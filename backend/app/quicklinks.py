"""Hand-maintained list of external links (other projects/dashboards the
user hops to often) that aren't NetBox inventory and don't belong in it —
persisted as a plain JSON file rather than a NetBox object or a DB table,
editable either by hand on the server or from the frontend's own editor
(PUT /api/quicklinks in main.py), both reading/writing the same file.

DATA_DIR must be a volume mount (see docker-compose.yml) — anything written
under the app's own source tree gets wiped on the next `docker compose up
--build`, same reasoning as netbox.py's dataset cache being in-memory only.
"""

import json
import logging
from pathlib import Path

log = logging.getLogger("serversonfire.quicklinks")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
QUICKLINKS_FILE = DATA_DIR / "quicklinks.json"


def load() -> list[dict]:
    if not QUICKLINKS_FILE.exists():
        return []
    try:
        data = json.loads(QUICKLINKS_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        log.exception("Failed to read quicklinks.json — showing none")
        return []
    if not isinstance(data, list):
        log.warning("quicklinks.json is not a JSON array — showing none")
        return []
    return data


def normalize(raw: list) -> list[dict]:
    """Validate/clean a client-submitted list before it touches disk — name
    and url are the only required fields (matches the plan: "icon, name,
    URL, order is enough"); order defaults to submission position so
    entries the editor sends without one still sort predictably."""
    cleaned: list[dict] = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        url = str(item.get("url") or "").strip()
        if not name or not url:
            continue
        icon = str(item["icon"]).strip() if item.get("icon") else None
        try:
            order = int(item["order"]) if item.get("order") is not None else i
        except (TypeError, ValueError):
            order = i
        cleaned.append({"name": name, "url": url, "icon": icon, "order": order})
    return cleaned


def save(links: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    QUICKLINKS_FILE.write_text(json.dumps(links, indent=2) + "\n")
