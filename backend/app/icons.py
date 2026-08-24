import re

# Curated overrides where the service display name doesn't map cleanly onto a
# dashboard-icons slug (https://github.com/homarr-labs/dashboard-icons).
# Copied verbatim from netmap/app/icons.py so both dashboards render the same
# icon for the same service.
ICON_OVERRIDES = {
    "ispconfig develop": "ispconfig",
    "isp config - web management": "ispconfig",
    "phpmyadmin": "phpmyadmin",
    "n8n": "n8n",
    "netbox": "netbox",
    "kasm": "kasm",
    "pterodactyl panel": "pterodactyl",
    "portainer": "portainer",
    "memos": "memos",
    "freshrss": "freshrss",
    "semaphore": "semaphore",
    "zabbix": "zabbix",
    "calibre-web-automated": "calibre-web",
    "jellyfin": "jellyfin",
    "sonarr": "sonarr",
    "radarr": "radarr",
    "lidarr": "lidarr",
    "prowlarr": "prowlarr",
    "qbittorrent": "qbittorrent",
    "portainer (juliet)": "portainer",
    "immich": "immich",
    "inventree": "inventree",
    "home assistant": "home-assistant",
    "authentik": "authentik",
    "passbolt": "passbolt",
    "nginx proxy manager": "nginx-proxy-manager",
    "proxmox ve": "proxmox",
    "proxmox backup web interface": "proxmox",
    "dsm": "synology-dsm",
    "graylog": "graylog",
}


def icon_slug(service_name: str) -> str:
    key = service_name.strip().lower()
    if key in ICON_OVERRIDES:
        return ICON_OVERRIDES[key]
    slug = re.sub(r"[^a-z0-9]+", "-", key).strip("-")
    return slug


# Platform names from NetBox carry free-text versions ("Debian 13 (trixie)",
# "Proxmox VE 9.2") that would never match a dashboard-icons slug as-is —
# unlike service names, these are matched by substring rather than an exact
# lookup. Ordered so a more specific hint (e.g. "proxmox backup") is checked
# before a shorter one it would otherwise also match ("proxmox").
PLATFORM_ICON_HINTS: list[tuple[str, str]] = [
    ("proxmox backup", "proxmox"),
    ("proxmox", "proxmox"),
    ("synology", "synology-dsm"),
    ("dsm", "synology-dsm"),
    ("home assistant", "home-assistant"),
    ("truenas", "truenas"),
    ("opnsense", "opnsense"),
    ("pfsense", "pfsense"),
    ("debian", "debian"),
    ("ubuntu", "ubuntu"),
    ("alpine", "alpine-linux"),
    ("windows", "windows"),
    ("docker", "docker"),
]


def platform_icon_slug(platform_name: str | None) -> str | None:
    """Best-effort icon for a server's platform. No curated hint matches ->
    fall back to the same slugify as icon_slug() (might still hit a real
    dashboard-icons slug, e.g. a short/clean platform name); the frontend
    already degrades a missing icon gracefully (see ServiceRow), so a wrong
    guess here is harmless."""
    if not platform_name:
        return None
    key = platform_name.strip().lower()
    for hint, slug in PLATFORM_ICON_HINTS:
        if hint in key:
            return slug
    return icon_slug(platform_name)
