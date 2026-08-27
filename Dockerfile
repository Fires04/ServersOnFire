# syntax=docker/dockerfile:1

# ---- Stage 1: build the frontend (React + Vite) ----
FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: derive the build version from git: "<major from nearest
# vN tag>.<commits since that tag>+g<hash>", e.g. tag v1 + 7 commits since
# = "1.7+ge1be41b". The count
# auto-increments every commit; a deliberate major bump is:
#     git tag v2 && git push origin v2
FROM python:3.12-slim AS gitinfo
WORKDIR /src
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
COPY .git ./.git
RUN TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0") \
    && BASE=${TAG#v} \
    && COUNT=$(git rev-list --count "${TAG}..HEAD" 2>/dev/null || git rev-list --count HEAD) \
    && HASH=$(git rev-parse --short=12 HEAD) \
    && echo -n "${BASE}.${COUNT}+g${HASH}" > /version.txt

# ---- Stage 3: python runtime ----
FROM python:3.12-slim AS runtime
WORKDIR /app

# git: pyproject.toml depends on fireauth straight from its GitHub repo
# (git+https://...) — pip needs the actual git binary to clone a VCS
# dependency, which python:3.12-slim doesn't ship.
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

COPY --from=gitinfo /version.txt /version.txt
COPY backend/ ./
# `-e` (editable), not a regular install: a regular `pip install .` copies
# app/ into site-packages, which would leave app.main's __file__ pointing
# there — NOT at the ./app/static this stage populates two lines down — so
# the built frontend would silently 404. Editable keeps imports resolved
# against this same source tree.
RUN sed -i "s/^version = .*/version = \"$(cat /version.txt)\"/" pyproject.toml \
    && pip install --no-cache-dir -e .

# Built frontend assets are served directly by FastAPI (app/main.py mounts
# ./app/static/assets and serves ./app/static/index.html for "/") — no
# separate frontend server/container.
COPY --from=frontend-build /fe/dist ./app/static

ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
