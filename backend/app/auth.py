"""ServersOnFire-specific glue around FireAuth (github.com/Fires04/FireAuth)
— the session/cookie mechanism and (optionally) the OIDC client now live
there, shared with other apps in this workflow instead of being
reinvented per-project. This module only holds what's actually specific
to ServersOnFire: the password check and the two config-driven instances.
"""

import hmac

from fireauth import SessionAuth

from . import config

session = SessionAuth(
    secret=config.SESSION_SECRET,
    cookie_name="sof_session",
    https_only=config.COOKIE_HTTPS_ONLY,
)

oidc = None
if config.OIDC_ENABLED:
    from fireauth.oidc import OIDCClient, OIDCConfig

    oidc = OIDCClient(
        OIDCConfig(
            client_id=config.AUTHENTIK_CLIENT_ID,
            client_secret=config.AUTHENTIK_CLIENT_SECRET,
            issuer=config.AUTHENTIK_ISSUER,
            redirect_uri=config.AUTHENTIK_REDIRECT_URI,
        )
    )


def check_credentials(username: str, password: str) -> bool:
    return hmac.compare_digest(username, config.APP_USERNAME) and hmac.compare_digest(
        password, config.APP_PASSWORD
    )


# Thin re-exports so main.py's existing call sites
# (auth.is_logged_in/require_login_api) don't all need renaming.
is_logged_in = session.is_logged_in
require_login_api = session.require_login
