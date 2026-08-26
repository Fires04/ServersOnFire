import time

from app import auth


class FakeResponse:
    """Minimal stand-in for fastapi.Response — only what set_session_cookie/
    clear_session_cookie call, so these tests don't need a real request/
    response cycle to exercise the signing logic itself."""

    def __init__(self):
        self.cookies: dict[str, dict] = {}

    def set_cookie(self, key, value, **kwargs):
        self.cookies[key] = {"value": value, **kwargs}

    def delete_cookie(self, key, **kwargs):
        self.cookies.pop(key, None)


def _cookie_value(remember: bool) -> str:
    response = FakeResponse()
    auth.set_session_cookie(response, remember=remember)
    return response.cookies[auth.COOKIE_NAME]["value"]


def test_fresh_cookie_is_valid():
    assert auth._cookie_valid(_cookie_value(remember=False)) is True
    assert auth._cookie_valid(_cookie_value(remember=True)) is True


def test_missing_or_tampered_cookie_is_invalid():
    assert auth._cookie_valid(None) is False
    assert auth._cookie_valid("") is False
    assert auth._cookie_valid(_cookie_value(False) + "tampered") is False


def test_expired_cookie_is_invalid(monkeypatch):
    value = _cookie_value(remember=False)
    # Jump past the unremembered window without waiting for it for real.
    future = time.time() + auth.UNREMEMBERED_MAX_AGE + 1
    monkeypatch.setattr(time, "time", lambda: future)
    assert auth._cookie_valid(value) is False


def test_remember_me_sets_a_persistent_cookie_max_age():
    response = FakeResponse()
    auth.set_session_cookie(response, remember=True)
    assert response.cookies[auth.COOKIE_NAME]["max_age"] == auth.REMEMBERED_MAX_AGE


def test_unremembered_login_is_a_session_cookie():
    """No max_age at all (not even the short server-side window) — the
    browser should drop it when it closes, same as before this feature
    existed; the embedded expiry is just a server-side backstop."""
    response = FakeResponse()
    auth.set_session_cookie(response, remember=False)
    assert response.cookies[auth.COOKIE_NAME]["max_age"] is None
