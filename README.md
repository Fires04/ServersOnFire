# ServersOnFire

Visual server dashboard backed by NetBox — a richer replacement in progress
for `home.fireit.cz` (`FireIT/netmap/`). Only devices/VMs tagged `netmap`
(configurable via `DISPLAY_TAG`) are shown. Styled after **Logs On Fire**
(`FiresLog/`): React + TypeScript + Vite + Mantine v9, the `flame` palette,
single-image Docker build.

NetBox stays the single source of truth — this app fetches and displays,
it never invents or stores its own copy of inventory data.

v1 is NetBox data only (overview grid + per-server detail: parameters,
services with live health dots, backup config). v2.0 (not built yet) adds
live CPU/RAM/disk via Zabbix.

## Local dev

Backend:
```
cd backend
uv venv .venv && uv pip install --python .venv/bin/python -e ".[dev]"
cp ../.env.example ../.env   # fill in NETBOX_URL / NETBOX_TOKEN
export $(grep -v '^#' ../.env | xargs)
.venv/bin/uvicorn app.main:app --reload
```

Frontend (separate terminal):
```
cd frontend
npm install
npm run dev
```
Vite proxies `/api/*` to `http://127.0.0.1:8000` (see `vite.config.ts`).

## Tests

`backend/app/dataset.py` is a pure transform (no I/O) — tested against
frozen fixtures, no live NetBox connection needed:
```
cd backend && .venv/bin/pytest -q
```

## Docker

```
docker compose up -d --build
```
`--build` matters — forgetting it serves a stale image with an old
frontend bundle (see netmap's docs for the same gotcha).

Port: **8092** by default (netmap=8090, NetboxMap planned=8091) — confirm
it's actually free on the target host before first deploy.

## Deploying to Lima

Not yet done from this session — needs someone with SSH access to the
Lima host to:
1. Resolve the `/srv/docker` vs `~/docker` path convention (docs disagree
   between netmap's `HANDOVER.md` and `NetboxMap/README.md`).
2. Confirm port 8092 is free.
3. `git clone`, drop in a real `.env`, `docker compose up -d --build`.
