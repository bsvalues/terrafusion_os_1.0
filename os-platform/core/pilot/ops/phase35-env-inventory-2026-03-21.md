# Phase 35 — TF_* Environment Variable Inventory

**Date**: 2026-03-21
**Status**: INVENTORY ONLY (SRE owns execution)
**Baseline**: `199f0f931`

---

## Inventory Method

Scanned: `**/*.json`, `**/*.yml`, `**/*.yaml`, `**/*.sh`, `**/*.ps1`, `**/*.cs`
Excluded: `.git/`, `node_modules/`, `bin/`, `obj/`

---

## Variables Identified

### Development-Only (TF_DEV_*)

| Variable | Where Used | Required For | Notes |
|----------|-----------|--------------|-------|
| `TF_DEV_DB_PASSWORD` | `backend/compose.dev.yml`, `backend/api-unified/appsettings.Development.json`, `compose/docker-compose.dev.enhanced.yml` | Local Postgres container | Dev-only. Prod uses separate DB credential. |
| `TF_DEV_JWT_SECRET` | `backend/api-unified/appsettings.Development.json`, `backend/src/TerraFusion.Operations/appsettings.Development.json`, `backend/publish/appsettings.Development.json` | JWT signing in dev | Dev-only static value. Prod uses `TF_JWT_SECRET`. |
| `TF_DEV_ENCRYPTION_KEY` | `backend/api-unified/appsettings.Development.json` | Data-at-rest encryption key in dev | Must be 256-bit. |
| `TF_DEV_PACS_PASSWORD` | `backend/src/TerraFusion.API/appsettings.Development.json` | SA password for tf-mssql container | Resolved via `appsettings.Development.local.json` (gitignored). Value: `TF_Pacs2026!` |
| `TF_DEV_GRAFANA_PASSWORD` | `backend/ai-models/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK/docker-compose.yml` | Grafana admin UI in dev | Low priority for Phase 35. |
| `TF_DEV_PGADMIN_PASSWORD` | `backend/compose.dev.yml` | pgAdmin dev UI | Low priority for Phase 35. |
| `TF_DEV_KEYCLOAK_PASSWORD` | `.ci_artifacts_local/docker-compose.dev.yml` | Keycloak dev admin | Phase 35 scope if Keycloak is in compose slice. |

### Production (TF_PROD_* / TF_*)

| Variable | Where Used | Required For | Notes |
|----------|-----------|--------------|-------|
| `TF_JWT_SECRET` | `backend/publish/appsettings.json`, `backend/src/TerraFusion.Operations/appsettings.json`, `backend/TerraFusion.IDE.Gateway/appsettings.json`, `backend/TerraFusion.QuantumAnalytics/appsettings.json`, `backend/TerraFusion.StreamingAnalytics/appsettings.json` | JWT signing in production | Must be ≥256-bit random. See JWT rotation runbook. |
| `TF_PROD_DB_PASSWORD` | Referenced in grep hits | PostgreSQL production connection | Resolves into `DefaultConnection` for prod API. |
| `TF_PROD_DB_REPLICATION_PASSWORD` | Referenced in grep hits | PostgreSQL streaming replication | SRE sets on cluster provisioning. |
| `TF_PACS_MODE` | Compose/config files | Controls PACS adapter behavior | Values: `live` / `dev` / `stub`. Phase 34 compose uses `live`. |

### Service URLs / Ports

| Variable | Where Used | Default | Notes |
|----------|-----------|---------|-------|
| `TF_API_URL` / `TF_API_BASE_URL` | Frontend `.env.*`, scripts | `http://localhost:5000` | Vite `VITE_API_URL` mirrors this. |
| `TF_API_PORT` / `TF_API_HTTPS_PORT` | Scripts | `5000` / `5001` | Dynamic in dev via `ServiceRegistry`. |
| `TF_DB_HOST` | Compose overrides | `localhost` / `postgres` (compose DNS) | Compose sets automatically for inner-network. |
| `TF_DB_PASSWORD` | Compose overrides | → `TF_PROD_DB_PASSWORD` | Alias. |

---

## Phase 34 Compose Slice: Required Vars

Only these are needed for Phase 34 rehearsal (compose-slice, scale=50):

```bash
# Must be set in environment OR docker-compose.override.yml before `docker-compose up`

# PACS bridge (via host.docker.internal — already hardcoded in override, no env var needed)
# Postgres app DB (compose generates dev credentials)
# JWT (dev static key in appsettings.Development.json is sufficient for Phase 34)
```

Phase 34 does NOT require `TF_PROD_*` variables. Dev statics are sufficient.

---

## Phase 35 K8s Gate: Required Secrets

For Phase 35 K8s staging, all of these must be provisioned as Kubernetes Secrets before cluster bring-up:

```
TF_JWT_SECRET              → k8s secret: terrafusion-jwt
TF_PROD_DB_PASSWORD        → k8s secret: terrafusion-postgres
TF_PROD_DB_REPLICATION_PASSWORD → k8s secret: terrafusion-postgres-replication
TF_PACS_PASSWORD           → k8s secret: terrafusion-pacs (pacs_oltp + pacs_golive same SA)
TF_DEV_ENCRYPTION_KEY      → k8s secret: terrafusion-encryption (prod key, not dev)
```

SRE provisioning is out of scope for Phase 34. This inventory is reference only.

---

## Open Items

- `TF_DEV_ENCRYPTION_KEY`: value not found in repo (correctly absent — secret). SRE must generate 256-bit key for prod.
- `TF_PROD_DB_REPLICATION_PASSWORD`: not present in any compose file scanned. Provisioned externally by SRE at cluster time.
- `HARRIS_PACS_PASSWORD` referenced in `appsettings.Development.json` as a separate field distinct from `TF_DEV_PACS_PASSWORD`. Needs clarity: is this legacy config or a second SA credential? Check with county ops before Phase 35.
