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
