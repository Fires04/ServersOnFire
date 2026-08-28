"""The signed-cookie mechanism itself (signing, expiry, remember-me) is
tested in FireAuth's own suite (github.com/Fires04/FireAuth) — this file
only covers what's actually ServersOnFire-specific: the password check and
that auth.py wires up FireAuth's SessionAuth/OIDCClient correctly."""

from fireauth import SessionAuth

from app import auth


def test_check_credentials_requires_both_to_match(monkeypatch):
    monkeypatch.setattr(auth.config, "APP_USERNAME", "admin")
    monkeypatch.setattr(auth.config, "APP_PASSWORD", "secret")
    assert auth.check_credentials("admin", "secret") is True
    assert auth.check_credentials("admin", "wrong") is False
    assert auth.check_credentials("someone-else", "secret") is False


def test_session_is_a_fireauth_sessionauth_instance():
    assert isinstance(auth.session, SessionAuth)
    assert auth.session.cookie_name == "sof_session"


def test_oidc_is_none_when_not_configured():
    # conftest.py doesn't set any OIDC_* env vars, so config.OIDC_ENABLED
    # is False and auth.py must not have built an OIDCClient.
    assert auth.oidc is None


def test_is_logged_in_and_require_login_api_are_bound_to_the_session():
    # Re-exported from auth.session so main.py's existing call sites don't
    # need renaming — confirm they're actually the session's own bound
    # methods, not accidentally something disconnected from it.
    assert auth.is_logged_in.__self__ is auth.session
    assert auth.require_login_api.__self__ is auth.session
