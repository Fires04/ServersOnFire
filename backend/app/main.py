import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Form, Request
from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from . import auth, config, netbox, quicklinks

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("serversonfire")

# The hand-written login form lives outside the React build — served from
# here regardless of what the frontend build produced.
LOGIN_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

# Populated at image-build time by `COPY --from=frontend-build /fe/dist
# ./app/static` (see Dockerfile) — empty in local dev, where the Vite dev
# server serves the SPA instead and proxies /api to this backend.
DIST_DIR = Path(__file__).resolve().parent / "static"

state: dict = {"dataset": None, "last_error": None}


async def refresh_loop():
    while True:
        await refresh_dataset()
        await asyncio.sleep(config.REFRESH_INTERVAL_MINUTES * 60)


async def refresh_dataset():
    try:
        state["dataset"] = await netbox.build_dataset()
        state["last_error"] = None
        log.info("NetBox data refreshed: %d servers", len(state["dataset"]["servers"]))
    except Exception as exc:  # keep serving stale data if NetBox is unreachable
        state["last_error"] = str(exc)
        log.exception("Failed to refresh data from NetBox")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await refresh_dataset()
    task = asyncio.create_task(refresh_loop())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory=LOGIN_STATIC_DIR), name="login-static")
if (DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")


if config.REQUIRE_LOGIN:

    @app.get("/login", response_class=HTMLResponse)
    async def login_page(request: Request):
        if auth.is_logged_in(request):
            return RedirectResponse(url="/", status_code=302)
        return FileResponse(LOGIN_STATIC_DIR / "login.html")

    @app.post("/login")
    async def login_submit(
        username: str = Form(...),
        password: str = Form(...),
        remember: str | None = Form(None),
    ):
        if auth.check_credentials(username, password):
            response = RedirectResponse(url="/", status_code=302)
            auth.set_session_cookie(response, remember=bool(remember))
            return response
        return RedirectResponse(url="/login?error=1", status_code=302)

    @app.get("/logout")
    async def logout():
        response = RedirectResponse(url="/login", status_code=302)
        auth.clear_session_cookie(response)
        return response


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    if config.REQUIRE_LOGIN and not auth.is_logged_in(request):
        return RedirectResponse(url="/login", status_code=302)
    return FileResponse(DIST_DIR / "index.html")


@app.get("/api/data")
async def api_data(request: Request):
    if config.REQUIRE_LOGIN:
        auth.require_login_api(request)
    return JSONResponse(
        {
            "dataset": state["dataset"],
            "last_error": state["last_error"],
            # Surfaced so the frontend's NetBox cheatsheet (HelpPanel) can
            # name the real configured tag instead of hardcoding "netmap"
            # and silently going stale if DISPLAY_TAG is ever overridden.
            "display_tag": config.DISPLAY_TAG,
        }
    )


@app.get("/api/quicklinks")
async def api_quicklinks(request: Request):
    if config.REQUIRE_LOGIN:
        auth.require_login_api(request)
    return JSONResponse(quicklinks.load())


@app.put("/api/quicklinks")
async def api_quicklinks_update(request: Request):
    """Full-replace, not a per-item patch — the frontend editor always
    holds and submits the whole (short) list, so there's no id scheme to
    keep in sync between client and file."""
    if config.REQUIRE_LOGIN:
        auth.require_login_api(request)
    body = await request.json()
    if not isinstance(body, list):
        return JSONResponse({"detail": "Expected a JSON array of links"}, status_code=400)
    cleaned = quicklinks.normalize(body)
    quicklinks.save(cleaned)
    return JSONResponse(cleaned)


@app.post("/api/refresh")
async def api_refresh(request: Request):
    if config.REQUIRE_LOGIN:
        auth.require_login_api(request)
    await refresh_dataset()
    return JSONResponse(
        {
            "dataset": state["dataset"],
            "last_error": state["last_error"],
            "display_tag": config.DISPLAY_TAG,
        }
    )


# Fallback for anything else the frontend build dropped straight into
# dist/'s root (favicon.png, logo.png, ...) — from Vite's public/ dir, so
# there's no per-file route to add here as more show up. Mounted last so
# every explicit route above (including "/") still wins first; Starlette
# tries mounts/routes in registration order and this only catches what
# nothing else matched.
if DIST_DIR.is_dir():
    app.mount("/", StaticFiles(directory=DIST_DIR, html=False), name="dist-root")
