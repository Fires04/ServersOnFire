"""dataset.py is pure (no I/O), so it's tested here against small
frozen fixtures instead of a live NetBox connection — see its docstring."""

from app import dataset


def _device(id, name, tags=("netmap",), extra=None):
    d = {
        "id": id,
        "name": name,
        "status": {"value": "active"},
        "device_role": {"name": "server"},
        "site": {"name": "Home"},
        "tenant": None,
        "primary_ip4": {"address": "10.0.0.1/24"},
        "tags": [{"name": t, "slug": t} for t in tags],
        "custom_fields": {},
    }
    if extra:
        d.update(extra)
    return d


def _vm(id, name, tags=("netmap",), extra=None):
    v = {
        "id": id,
        "name": name,
        "status": {"value": "active"},
        "role": {"name": "service"},
        "site": {"name": "Home"},
        "tenant": None,
        "primary_ip4": {"address": "10.0.0.2/24"},
        "tags": [{"name": t, "slug": t} for t in tags],
        "custom_fields": {},
        "vcpus": 2,
        "memory": 2048,
        "disk": 20,
    }
    if extra:
        v.update(extra)
    return v


def test_only_tagged_hosts_are_visible():
    devices = [_device(1, "tagged-device"), _device(2, "untagged-device", tags=())]
    vms = [_vm(10, "tagged-vm"), _vm(11, "untagged-vm", tags=())]
    servers = dataset.build_servers(devices, vms, [])
    assert {s["name"] for s in servers} == {"tagged-device", "tagged-vm"}


def test_backup_target_resolves_even_if_target_untagged():
    # Backup target device (id=2) is deliberately NOT netmap-tagged — this
    # is exactly the gap the plan calls out: netbox.py must fetch devices
    # unfiltered so this name still resolves.
    target = _device(2, "backup-target", tags=())
    source = _device(
        1,
        "source-host",
        extra={
            "custom_fields": {
                "backup_method": {"value": "rsync", "label": "Rsync"},
                "backup_target_device": 2,
                "backup_path": "/srv/backups/source-host",
            }
        },
    )
    servers = dataset.build_servers([source, target], [], [])
    visible = {s["name"]: s for s in servers}
    assert "backup-target" not in visible  # stays hidden, just resolvable
    backup = visible["source-host"]["backup"]
    assert backup == {"method": "rsync", "target_name": "backup-target", "path": "/srv/backups/source-host"}


def test_no_backup_configured_is_none_not_a_blank_panel():
    d = _device(1, "plain-host")
    servers = dataset.build_servers([d], [], [])
    assert servers[0]["backup"] is None


def test_services_join_by_parent_object():
    d = _device(1, "web-host")
    services = [
        {
            "parent_object_type": "dcim.device",
            "parent_object_id": 1,
            "name": "Jellyfin",
            "ports": [8096],
            "protocol": {"value": "tcp"},
            "custom_fields": {"internal_url": "http://10.0.0.1:8096"},
        },
        {
            "parent_object_type": "dcim.device",
            "parent_object_id": 999,  # different host, must not leak in
            "name": "Other",
            "ports": [1],
            "protocol": {"value": "tcp"},
            "custom_fields": {},
        },
    ]
    servers = dataset.build_servers([d], [], services)
    assert [s["name"] for s in servers[0]["services"]] == ["Jellyfin"]


def test_vm_hypervisor_resolved_via_shared_cluster():
    host = _device(1, "pve-host", extra={"cluster": {"id": 5, "name": "cluster-a"}})
    vm = _vm(10, "guest-vm", extra={"cluster": {"id": 5, "name": "cluster-a"}})
    servers = dataset.build_servers([host], [vm], [])
    guest = next(s for s in servers if s["name"] == "guest-vm")
    assert guest["params"]["hypervisor"] == "pve-host"
