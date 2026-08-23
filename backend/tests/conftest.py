import os

# app.config reads these at import time (config._require) — set harmless
# dummies before any `app.*` module is imported so the test suite doesn't
# need a real .env. Must run before test modules import `app`, hence
# conftest.py rather than a fixture.
os.environ.setdefault("NETBOX_URL", "http://netbox.invalid")
os.environ.setdefault("NETBOX_TOKEN", "test-token")
