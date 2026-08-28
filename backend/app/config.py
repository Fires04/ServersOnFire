import os


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


NETBOX_URL = _require("NETBOX_URL").rstrip("/")
NETBOX_TOKEN = _require("NETBOX_TOKEN")

# Only devices/VMs tagged with this NetBox tag are shown. NetBox stays the
# single source of truth — this app never invents inventory data of its own.
DISPLAY_TAG = os.environ.get("DISPLAY_TAG", "netmap")

REFRESH_INTERVAL_MINUTES = int(os.environ.get("REFRESH_INTERVAL_MINUTES", "5"))

REQUIRE_LOGIN = os.environ.get("REQUIRE_LOGIN", "false").lower() == "true"
APP_USERNAME = _require("APP_USERNAME") if REQUIRE_LOGIN else ""
APP_PASSWORD = _require("APP_PASSWORD") if REQUIRE_LOGIN else ""
SESSION_SECRET = _require("SESSION_SECRET") if REQUIRE_LOGIN else ""
COOKIE_HTTPS_ONLY = os.environ.get("COOKIE_HTTPS_ONLY", "false").lower() == "true"

# Optional: "Sign in with Authentik" alongside the password form (see
# https://github.com/Fires04/FireAuth). All five (including APP_EMAIL just
# below) must be set for it to turn on — anything missing just means no
# OIDC button, password login still works on its own.
# Names are OIDC_* (not AUTHENTIK_*) per PROJECT_STANDARDS.md's
# 2026-08-28 naming unification — the underlying IdP is Authentik today,
# but the var names describe the OIDC integration point generically, and
# projects in this family had drifted between AUTHENTIK_*/OIDC_*
# inconsistently before this was fixed.
# OIDC_REDIRECT_URI must exactly match what's registered on the Authentik
# Provider (its own full URL, e.g.
# "https://serversonfire.example.lan/auth/callback" — not derived/guessed
# here since a mismatch is the single most common OIDC setup snag).
OIDC_CLIENT_ID = os.environ.get("OIDC_CLIENT_ID", "")
OIDC_CLIENT_SECRET = os.environ.get("OIDC_CLIENT_SECRET", "")
OIDC_ISSUER = os.environ.get("OIDC_ISSUER", "")
OIDC_REDIRECT_URI = os.environ.get("OIDC_REDIRECT_URI", "")

# SECURITY-CRITICAL (see FireAuth's "Pattern A + OIDC binding", 2026-08-27
# fix): ServersOnFire is a single shared-credential app, no user database
# — without this, a successful Authentik login would authenticate as this
# app's operator *regardless of which Authentik account it was*. Deliberately
# a separate value from APP_USERNAME rather than reusing FireAuth's own
# recommended "APP_EMAIL doubles as the login username" pattern — changing
# the existing password-login username wasn't asked for, and bundling it
# into this security fix would be an unrelated breaking change. This value
# only feeds the OIDC identity check (fireauth's `allowed_email`); the
# password form's username field is untouched.
APP_EMAIL = os.environ.get("APP_EMAIL", "")

OIDC_ENABLED = REQUIRE_LOGIN and all(
    [OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER, OIDC_REDIRECT_URI, APP_EMAIL]
)

# Color theme (see frontend/src/lib/themes.ts for the full 10-shade ramps
# and topology-canvas colors) — this is only the *starting point* for a
# browser that hasn't picked one of its own yet (frontend/src/Root.tsx),
# never overrides a saved local pick. THEME_ACCENTS below is the same set
# of themes, trimmed to what the login page's plain CSS actually needs
# (no React there to read the full ramps from) — keep both in sync if a
# theme's accent ever changes.
THEME_ACCENTS: dict[str, dict[str, str]] = {
    "signal": {"light": "#0f97c0", "light_text": "#ffffff", "dark": "#35c5f0", "dark_text": "#08222c"},
    "aurora": {"light": "#7440d6", "light_text": "#ffffff", "dark": "#9d6bff", "dark_text": "#1c1230"},
    "copper": {"light": "#a95f28", "light_text": "#ffffff", "dark": "#d68a4c", "dark_text": "#241505"},
    "slate": {"light": "#3a4fc7", "light_text": "#ffffff", "dark": "#5b7cfa", "dark_text": "#0d1130"},
}
DEFAULT_THEME = os.environ.get("DEFAULT_THEME", "copper")
if DEFAULT_THEME not in THEME_ACCENTS:
    DEFAULT_THEME = "copper"
