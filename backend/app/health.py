import asyncio
import logging

import httpx

log = logging.getLogger("serversonfire.health")

TIMEOUT = httpx.Timeout(3.0, connect=2.0)


async def _check_one(client: httpx.AsyncClient, url: str) -> bool:
    try:
        resp = await client.get(url, timeout=TIMEOUT, follow_redirects=True)
        return resp.status_code < 500
    except httpx.HTTPError:
        return False


async def check_services(services_with_urls: list[tuple[dict, str]]) -> None:
    """Mutates each service dict in-place, setting service['up'] to True/False."""
    if not services_with_urls:
        return
    async with httpx.AsyncClient(verify=False) as client:
        results = await asyncio.gather(
            *(_check_one(client, url) for _, url in services_with_urls)
        )
    for (service, _url), up in zip(services_with_urls, results):
        service["up"] = up
