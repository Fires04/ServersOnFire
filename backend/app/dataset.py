"""Pure transform: raw NetBox API lists -> the per-server list the frontend
renders. No I/O here — kept separate from netbox.py so it can be
unit-tested against frozen fixture JSON without a live NetBox connection.

Visibility: only devices/VMs tagged with config.DISPLAY_TAG end up in the
returned list. netbox.py fetches devices/VMs/services *unfiltered* on
purpose, so an id->name lookup here covers every possible backup target,
even one that isn't itself tagged for display.

Custom-field shapes (confirmed against a live NetBox instance during
planning): `backup_method` is a select field (serializes as
{"value": ..., "label": ...}), `backup_target_vm`/`backup_target_device`
are object refs (serialize as the raw target PK), `backup_path` is plain
text. `_cf_object_id`/select handling stays defensive about that object-ref
shape, which NetBox's API is inconsistent about across versions/fields.
"""

from __future__ import annotations

from . import config, icons


def _strip_prefix(ip: str | None) -> str | None:
    if not ip:
        return None
    return ip.split("/")[0]


def _cf_object_id(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, dict):
        return value.get("id")
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _select_value(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, dict):
        return value.get("value")
    return value


def _has_tag(obj: dict, tag_slug: str) -> bool:
    return any(t.get("slug") == tag_slug for t in obj.get("tags") or [])


def _id_name_map(devices: list[dict], vms: list[dict]) -> dict[tuple[str, int], str]:
    names: dict[tuple[str, int], str] = {}
    for d in devices:
        names[("device", d["id"])] = d["name"]
    for v in vms:
        names[("vm", v["id"])] = v["name"]
    return names


def _cluster_hosts(devices: list[dict]) -> dict[int, str]:
    """cluster_id -> hosting device name, so a VM can show which physical
    host it runs on."""
    hosts: dict[int, str] = {}
    for d in devices:
        cluster = d.get("cluster")
        if cluster:
            hosts[cluster["id"]] = d["name"]
    return hosts


def _index_services(services: list[dict]) -> dict[tuple[str, int], list[dict]]:
    type_map = {"dcim.device": "device", "virtualization.virtualmachine": "vm"}
    by_host: dict[tuple[str, int], list[dict]] = {}
    for svc in services:
        kind = type_map.get(svc.get("parent_object_type"))
        parent_id = svc.get("parent_object_id")
        if not kind or not parent_id:
            continue
        cf = svc.get("custom_fields") or {}
        by_host.setdefault((kind, parent_id), []).append(
            {
                "name": svc["name"],
                "ports": svc.get("ports") or [],
                "protocol": (svc.get("protocol") or {}).get("value") or "",
                "internal_url": cf.get("internal_url") or "",
                "external_url": cf.get("external_url") or "",
                "icon_slug": icons.icon_slug(svc["name"]),
                "up": None,
            }
        )
    for lst in by_host.values():
        lst.sort(key=lambda s: s["name"].lower())
    return by_host


def _backup_info(obj: dict, names: dict[tuple[str, int], str]) -> dict | None:
    cf = obj.get("custom_fields") or {}
    method = _select_value(cf.get("backup_method"))
    target_vm_id = _cf_object_id(cf.get("backup_target_vm"))
    target_device_id = _cf_object_id(cf.get("backup_target_device"))
    path = cf.get("backup_path") or None

    target_name = None
    if target_vm_id:
        target_name = names.get(("vm", target_vm_id))
    elif target_device_id:
        target_name = names.get(("device", target_device_id))

    # Every field is currently null on every host on this instance — that's
    # the default render right now, not a rare edge case (see plan). None
    # here is what tells the frontend to show the "no backup configured"
    # state instead of a panel with blanks in it.
    if not (method or target_name or path):
        return None
    return {"method": method, "target_name": target_name, "path": path}


def _device_params(d: dict) -> dict:
    params: dict = {}
    device_type = d.get("device_type")
    if device_type:
        params["device_type"] = device_type.get("display") or device_type.get("model")
    platform = d.get("platform")
    if platform:
        params["platform"] = platform.get("display") or platform.get("name")
    return params


def _vm_params(v: dict, cluster_hosts: dict[int, str]) -> dict:
    params: dict = {}
    platform = v.get("platform")
    if platform:
        params["platform"] = platform.get("display") or platform.get("name")
    cluster = v.get("cluster")
    if cluster:
        params["cluster"] = cluster.get("display") or cluster.get("name")
        host_name = cluster_hosts.get(cluster["id"])
        if host_name:
            params["hypervisor"] = host_name
    if v.get("vcpus") is not None:
        params["vcpus"] = v["vcpus"]
    if v.get("memory") is not None:
        params["memory_mb"] = v["memory"]
    if v.get("disk") is not None:
        params["disk_gb"] = v["disk"]
    return params


def _base_server(obj: dict, kind: str) -> dict:
    role = obj.get("device_role") or obj.get("role") or {}
    status = obj.get("status") or {}
    site = obj.get("site")
    tenant = obj.get("tenant")
    return {
        "id": f"{kind}:{obj['id']}",
        "kind": kind,
        "name": obj["name"],
        "status": status.get("value") or "",
        "role": role.get("name") or "",
        "site_name": site.get("name") if site else None,
        "tenant_name": tenant.get("name") if tenant else None,
        "primary_ip": _strip_prefix((obj.get("primary_ip4") or {}).get("address")),
        # NetBox tag color is a 6-hex-digit string with no leading '#'
        # (e.g. "aa1409") — passed through as-is, the frontend prefixes it.
        "tags": [{"name": t["name"], "color": t.get("color") or ""} for t in obj.get("tags") or []],
    }


def build_servers(devices: list[dict], vms: list[dict], services: list[dict]) -> list[dict]:
    names = _id_name_map(devices, vms)
    cluster_hosts = _cluster_hosts(devices)
    services_by_host = _index_services(services)
    tag = config.DISPLAY_TAG

    servers: list[dict] = []

    for d in devices:
        if not _has_tag(d, tag):
            continue
        server = _base_server(d, "device")
        server["params"] = _device_params(d)
        server["services"] = services_by_host.get(("device", d["id"]), [])
        server["backup"] = _backup_info(d, names)
        server["icon_slug"] = icons.platform_icon_slug(server["params"].get("platform"))
        servers.append(server)

    for v in vms:
        if not _has_tag(v, tag):
            continue
        server = _base_server(v, "vm")
        server["params"] = _vm_params(v, cluster_hosts)
        server["services"] = services_by_host.get(("vm", v["id"]), [])
        server["backup"] = _backup_info(v, names)
        server["icon_slug"] = icons.platform_icon_slug(server["params"].get("platform"))
        servers.append(server)

    servers.sort(key=lambda s: s["name"].lower())
    return servers
