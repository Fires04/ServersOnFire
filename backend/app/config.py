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
