import hmac

from fastapi import HTTPException, Request

from . import config


def check_credentials(username: str, password: str) -> bool:
    return hmac.compare_digest(username, config.APP_USERNAME) and hmac.compare_digest(
        password, config.APP_PASSWORD
    )


def is_logged_in(request: Request) -> bool:
    return bool(request.session.get("authenticated"))


def require_login_api(request: Request) -> None:
    if not is_logged_in(request):
        raise HTTPException(status_code=401, detail="Not authenticated")
