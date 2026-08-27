import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Request
from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fireauth import build_auth_router
from fireauth.csrf import generate_token, set_csrf_cookie

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

if config.OIDC_ENABLED:
    # authlib's Starlette client needs request.session to stash the OAuth
    # state/nonce for the few seconds between the /auth/login redirect and
    # the /auth/callback — unrelated to (and much narrower than) the "why
    # not SessionMiddleware for real login sessions" problem FireAuth's
    # SessionAuth exists to avoid (see auth.py): a fixed 10-minute Max-Age
    # is fine for a handshake that only ever takes seconds, and a random
    # secret regenerated on every restart is fine since nothing needs it
    # to survive one.
    import os

    from starlette.middleware.sessions import SessionMiddleware

    app.add_middleware(SessionMiddleware, secret_key=os.urandom(32).hex(), max_age=600)

# Explicit routes, not a StaticFiles mount, specifically so these two
# hand-written files (edited far more often than they're deployed) can
# carry a no-store header — a stale cached copy of either previously left
# the login page rendering with old CSS the newer HTML didn't match
# (oversized logo, misplaced checkbox). No perf concern either way: two
# tiny files on a page nobody loads more than a few times a day.
NO_STORE = {"Cache-Control": "no-store"}


_LOGIN_CSS = (LOGIN_STATIC_DIR / "style.css").read_text()


@app.get("/static/style.css")
async def login_stylesheet():
    # The login page has no client-side theme picker (no React there) —
    # it always reflects config.DEFAULT_THEME, substituted into the
    # __ACCENT_*__ placeholders (see style.css). Matches the in-app default
    # a browser that hasn't picked its own theme yet would land on.
    accents = config.THEME_ACCENTS[config.DEFAULT_THEME]
    css = (
        _LOGIN_CSS.replace("__ACCENT_LIGHT__", accents["light"])
        .replace("__ACCENT_LIGHT_TEXT__", accents["light_text"])
        .replace("__ACCENT_DARK__", accents["dark"])
        .replace("__ACCENT_DARK_TEXT__", accents["dark_text"])
    )
    return HTMLResponse(css, media_type="text/css", headers=NO_STORE)


if (DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")


# Login/logout (+ /auth/login, /auth/callback if OIDC_ENABLED) come from
# FireAuth's router factory — see auth.py for the SessionAuth/OIDCClient
# instances it's built from. Only the GET /login page (the actual HTML,
# branded per-app) stays here.
if config.REQUIRE_LOGIN:
    app.include_router(
        build_auth_router(
            auth.session,
            check_password=auth.check_credentials,
            oidc=auth.oidc,
            # SECURITY-CRITICAL: without this, a valid Authentik login from
            # *any* account on the shared instance would authenticate as
            # this app's single operator (see config.APP_EMAIL's comment
            # and FireAuth's "Pattern A + OIDC binding" fix, 2026-08-27).
            # None whenever OIDC isn't configured at all — harmless, since
            # build_auth_router only registers /auth/* routes `if oidc:`.
            allowed_email=config.APP_EMAIL or None,
            app_name="serversonfire",  # turns on stdout login-attempt logging
            app=app,  # turns on per-IP rate limiting on POST /login
        )
    )

    _LOGIN_HTML = (LOGIN_STATIC_DIR / "login.html").read_text()
    # Swapped in only when Authentik is actually configured (see
    # config.OIDC_ENABLED) — a button pointing at a route that doesn't
    # exist would just 404.
    _OIDC_BUTTON_HTML = """
      <a class="oidc-button" href="/auth/login">Sign in with Authentik</a>
      <div class="divider"><span>or</span></div>
    """

    @app.get("/login", response_class=HTMLResponse)
    async def login_page(request: Request):
        if auth.is_logged_in(request):
            return RedirectResponse(url="/", status_code=302)
        html = _LOGIN_HTML.replace(
            "<!-- OIDC_BUTTON -->", _OIDC_BUTTON_HTML if config.OIDC_ENABLED else ""
        )
        # CSRF (FireAuth's POST /login now always enforces it, no opt-out,
        # see fireauth/csrf.py): generate the token before the response
        # object exists so it can go straight into the HTML body, then
        # attach the matching cookie to that same response — a mismatch
        # between the two is exactly what verify_csrf_token() rejects.
        token = generate_token()
        html = html.replace("__CSRF_TOKEN__", token)
        response = HTMLResponse(html, headers=NO_STORE)
        set_csrf_cookie(response, token, https_only=config.COOKIE_HTTPS_ONLY)
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
            "default_theme": config.DEFAULT_THEME,
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
            "default_theme": config.DEFAULT_THEME,
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
