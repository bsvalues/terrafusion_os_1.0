# WACO 2026 — Offline Conference Demo Runtime (Gap Analysis)

**Scope**: `docker/` and `scripts/` only. Honest, demo-scoped; no production claims.

## What the current docker/ deployment requires

- `docker/Dockerfile*` (api, frontend, ai-services): multi-stage builds that **pull base images at build time**
  (`mcr.microsoft.com/dotnet/sdk:8.0`, `node:18/20-alpine`) and **restore packages from the network**
  (`dotnet restore` → nuget.org, `npm/pnpm install` → registry.npmjs.org, `apk add` → dl-cdn.alpinelinux.org).
- `docker/dev/compose.yaml`: local dev toolboxes (node, dotnet). Profile-gated; **requires network for image
  build, pnpm install, and dotnet restore**. Explicitly dev-only per its README boundary.
- `compose/docker-compose.demo.yml` (nearest existing demo): pulls `postgis/postgis:15-3.4`, `redis:7-alpine`,
  `nginx:alpine`, `prom/prometheus:latest`, `grafana/grafana-oss:latest` **at run time**, requires an
  **external pre-created network** (`terrafusion_demo`), bind-mounts `../frontend` (source, not a build), and
  needs `POSTGRES_*` env vars. Also references `./prometheus.yml` and `./nginx-demo.conf`.

## What blocks a fully offline, portable demo runtime

1. **Image pulls at demo time** — every compose file references registry images; with no network, `docker compose up` fails unless images are pre-loaded.
2. **Build-time network** — Dockerfiles fetch packages; images must be built/exported *before* the demo.
3. **External network dependency** — demo compose uses `external: true` network; fails on a fresh laptop.
4. **No export/load tooling** — repo has no script to `docker save` images to a tarball or `docker load` them on the demo machine.
5. **Secrets/env** — demo compose requires real `POSTGRES_*` values; no offline-safe placeholder path.
6. **Observability weight** — prometheus/grafana are unnecessary for a booth demo and add two more images to preload.

## What this slice ships (bounded, honest)

- `docker/offline/compose.demo.yaml` — self-contained demo compose: internal network, placeholder-only env via
  `.env.example`, no observability stack, static frontend mount optional. Designed to run from **pre-loaded images**.
- `docker/offline/.env.example` — placeholder demo credentials (explicitly not real secrets).
- `docker/offline/nginx-demo.conf` — minimal API/static mock config for the demo.
- `scripts/offline-demo-export.sh` — build/pull images and `docker save` them to `dist/offline-demo-images.tar.gz` **(network-required, run before travel)**.
- `scripts/offline-demo-load.sh` — on the demo laptop: `docker load` the tarball, then `docker compose up` **(no network)**.
- `scripts/offline-demo-verify.sh` — static sanity checks (YAML parses, required files present).

### What this slice does NOT claim

- It does not build images offline (impossible without a local registry mirror).
- It does not guarantee the full .NET API runs offline — the demo path uses pre-built images or the nginx mock.
- It does not touch `backend/`, `frontend/`, or `.github/`.

## Verification status

- Docker daemon was **not running** on the authoring machine; `docker compose config` could not be executed.
  Static validation (YAML parse + file presence) is provided by `scripts/offline-demo-verify.sh` and must be
  re-run on a machine with Docker before travel.
