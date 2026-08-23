import datetime
import logging

import httpx

from . import config, dataset, health

log = logging.getLogger("serversonfire.netbox")

HEADERS = {
    "Authorization": f"Token {config.NETBOX_TOKEN}",
    "Accept": "application/json",
}


async def _paginated(client: httpx.AsyncClient, path: str, params: dict) -> list[dict]:
    results: list[dict] = []
    url = f"{config.NETBOX_URL}{path}"
    while url:
        resp = await client.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        data = resp.json()
        results.extend(data["results"])
        url = data.get("next")
        params = None
    return results


async def fetch_all(client: httpx.AsyncClient) -> tuple[list[dict], list[dict], list[dict]]:
    """Unfiltered on purpose (unlike netmap's server-side tag= query) — a
    backup target that isn't itself DISPLAY_TAG-tagged still needs to
    resolve to a real name in dataset.py."""
    devices = await _paginated(client, "/api/dcim/devices/", {"limit": 200})
    vms = await _paginated(client, "/api/virtualization/virtual-machines/", {"limit": 200})
    services = await _paginated(client, "/api/ipam/services/", {"limit": 500})
    return devices, vms, services


async def build_dataset() -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        devices, vms, services = await fetch_all(client)

    servers = dataset.build_servers(devices, vms, services)

    checks: list[tuple[dict, str]] = []
    for server in servers:
        for svc in server["services"]:
            url = svc["internal_url"] or svc["external_url"]
            if url:
                checks.append((svc, url))
    await health.check_services(checks)

    return {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "servers": servers,
    }
