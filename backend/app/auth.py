"""Own signed cookie instead of Starlette's SessionMiddleware — that
middleware's cookie Max-Age is fixed once at app startup, so it can't give
"remember me" (checked) and a plain login (unchecked) different lifetimes
on the same server. Same itsdangerous primitive it uses internally, just
applied per-login: the cookie's *value* carries its own expiry timestamp,
checked in verify_session_cookie() rather than by the cookie's browser-side
Max-Age alone (which we still set too, so an unchecked "remember me" also
dies when the browser closes, not just after 12h of it staying open).
"""

import hmac
import time

from fastapi import HTTPException, Request, Response
from itsdangerous import BadSignature, Signer

from . import config

COOKIE_NAME = "sof_session"
UNREMEMBERED_MAX_AGE = 60 * 60 * 12  # 12h — plain login, no "remember me"
REMEMBERED_MAX_AGE = 60 * 60 * 24 * 30  # 30 days — "remember me" checked


def check_credentials(username: str, password: str) -> bool:
    return hmac.compare_digest(username, config.APP_USERNAME) and hmac.compare_digest(
        password, config.APP_PASSWORD
    )


def _signer() -> Signer:
    return Signer(config.SESSION_SECRET, salt="sof-auth")


def set_session_cookie(response: Response, remember: bool) -> None:
    max_age = REMEMBERED_MAX_AGE if remember else UNREMEMBERED_MAX_AGE
    expires_at = int(time.time()) + max_age
    value = _signer().sign(str(expires_at).encode()).decode()
    response.set_cookie(
        COOKIE_NAME,
        value,
        # Omitting max_age for an unremembered login makes it a
        # session-only cookie (gone when the browser closes) — the
        # expires_at embedded in the value is still checked server-side as
        # a backstop for a browser that keeps it around longer than that.
        max_age=max_age if remember else None,
        httponly=True,
        samesite="lax",
        secure=config.COOKIE_HTTPS_ONLY,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def _cookie_valid(raw: str | None) -> bool:
    if not raw:
        return False
    try:
        payload = _signer().unsign(raw)
    except BadSignature:
        return False
    try:
        expires_at = int(payload)
    except ValueError:
        return False
    return time.time() < expires_at


def is_logged_in(request: Request) -> bool:
    return _cookie_valid(request.cookies.get(COOKIE_NAME))


def require_login_api(request: Request) -> None:
    if not is_logged_in(request):
        raise HTTPException(status_code=401, detail="Not authenticated")
