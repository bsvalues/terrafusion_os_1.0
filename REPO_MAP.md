# TerraFusion OS – Repo Map

## Top-Level Directory Index

| Directory | Purpose |
|-----------|---------|
| `backend/` | .NET 8 microservices (Iron, Cortex, Gateway, Consciousness) |
| `compose/` | Docker compose overrides |
| `config/` | Shared configuration |
| `data/` | Local data directory (SQLite DBs, etc.) |
| `database/` | Schema definitions, migrations |
| `docker/` | Additional Dockerfiles |
| `docs/` | Specs, governance locks, architecture docs |
| `frontend/` | React 18 + Vite (OS Shell) |
| `golden/` | Golden corpus reference data |
| `native-shell/` | Electron / WPF desktop shell + frontend build output |
| `ops/` | Operations: prod compose, proxy config, dev tooling |
| `os-platform/` | Core platform: pilot, types, tests, AI systems |
| `packages/` | Shared packages |
| `scripts/` | Build/deploy automation, repo-shape-guard |
| `tests/` | Root-level test infrastructure |
| `tools/` | Dev tools, registry, CLI utilities |

## Entropy Cap

- **Max top-level dirs**: 20 (current: 16)
- **Max root files**: 40 (current: 29)
- **Guard**: `node scripts/repo-shape-guard.mjs`

New top-level directories require justification and updating the guard caps.

## Quick Start

```powershell
pwsh tools/dev/start.ps1       # boot Docker spine
pwsh tools/dev/verify.ps1      # run all gates
```

- **Canonical compose**: `ops/prod/docker-compose.prod.server.yml`
- Soul builds from **repo root context** using the root lockfile
- Soul serves on port 80 internally; Shield (Caddy) exposes 8080 externally
- Cortex docs at `http://localhost:8006/docs`

## Architectural Decisions (do not revert)

| Decision | Why |
|----------|-----|
| Build context = repo root | Single `pnpm-lock.yaml` at root is the lockfile authority. No stale copies. |
| No `frontend/pnpm-lock.yaml` | Deleted — root lockfile is the single source of truth. |
| `pnpm@9.0.0` pinned exact | Prevents "pnpm 9 vs 10" drift inside Docker. |
| `--frozen-lockfile --filter ./frontend...` | Deterministic install scoped to frontend workspace. CI-safe. |
| `nginx.conf` → `conf.d/default.conf` | File contains a `server {}` block, not a full `nginx.conf`. Must go to `conf.d/`. |
| `.dockerignore` excludes `QUARANTINE/`, `backend/`, etc. | Keeps build context < 300 KB. |

## Tags

| Tag | Commit | Purpose |
|-----|--------|---------|
| `pre-cleanup-20260211` | Before quarantine | Rollback anchor |
| `soul-fixed-20260211` | After deterministic build fix | Known-good forward anchor |

## Quarantine

`QUARANTINE/` holds ~160 directories and ~750 files moved during the 2026-02-11 cleanup.
Contents are preserved (not deleted) for archaeology. Safety tag: `pre-cleanup-20260211`.
