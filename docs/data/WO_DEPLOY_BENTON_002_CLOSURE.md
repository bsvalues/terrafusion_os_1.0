# WO-DEPLOY-BENTON-002 — Full Closure Report (002A–002D)

**Date:** 2026-06-30  
**WO:** WO-DEPLOY-BENTON-002  
**Status:** CLOSED — ALL GATES PASS  
**Milestone:** Local end-to-end runtime proof against Azure Benton demo DB

---

## Scope

Convert WO-DEPLOY-BENTON-001 data-load success into a proven local runtime.
Four sequential gates, each requiring the prior to pass before proceeding.

**NOT authorized by this WO:** production deployment, Azure app deployment,
schema migrations, data mutation, PACS connectivity.

---

## Gate 002A — Preflight: Safe-to-Start Runtime

**Result: PASS (GO_WITH_CONDITIONS)**

| Check | Finding |
|-------|---------|
| Seeder risk | GPT seeder and DX-01 Dossier seeder blockable via `TF_SKIP_DEV_SEEDERS=true` |
| Migration risk | `DatabaseInitializationService.MigrateAsync()` only fires if pending migrations exist |
| Migration state | 94 migrations applied in Azure demo DB, 0 pending — `MigrateAsync()` will NOT fire |
| Secrets separation | Azure admin password kept in shell env only; `appsettings.BentonCounty.json` uses `${...}` placeholder syntax |
| Connection string | Supplied via `ConnectionStrings__DefaultConnection` env var override |
| AuditEncryptionKey | Optional — generates random session key if absent, no crash |
| Health endpoints | `/healthz` and `/healthz/ready` require auth; `/api/auth/dev-token` is anonymous in Development |

**Conditions satisfied before proceeding to 002B:**
- `TF_SKIP_DEV_SEEDERS=true` set
- `ASPNETCORE_ENVIRONMENT=Development` set
- `ConnectionStrings__DefaultConnection` override provided via env var
- No `--launch-profile` (bypasses launchSettings.json port collision)

---

## Gate 002B — API Runtime Smoke

**Result: PASS**

| Check | Value |
|-------|-------|
| API port | 5046 |
| Startup | `Now listening on: http://localhost:5046` confirmed |
| Seeders | Blocked — `TF_SKIP_DEV_SEEDERS=true` active |
| Migrations | 0 pending; `MigrateAsync()` did NOT fire |
| Operational tables | `CREATE TABLE IF NOT EXISTS` calls are idempotent; no harm |
| Dev token | `GET /api/auth/dev-token` → 200 OK |
| Health | `/healthz` → Healthy (authenticated via dev token) |
| Readiness | `/healthz/ready` → Ready |
| Schema mutations | NONE |
| Data mutations | NONE |

**Connection string used (local env only, not committed):**
```
Host=pg-terrafusion-benton-demo.postgres.database.azure.com;Port=5432;
Database=terrafusion_benton_demo;Username=tfadmin;SSL Mode=Require
```
Password: local env only, never logged or committed.

---

## Gate 002C — Canonical API Path Proven

**Result: PASS**

Direct API hit (no frontend proxy) at port 5046:

```
GET /api/counties/benton/parcels?pageSize=3
Authorization: Bearer <dev-token>
```

Response (abbreviated):

```json
{
  "county": "Benton",
  "rowType": "parcels",
  "runtimeTable": "canonical_tf.tf_parcel",
  "semantics": {
    "countyScoped": true,
    "activeOnly": true,
    "duplicateParcelVersionsCollapsed": true,
    "currentParcelVersion": true,
    "source": "canonical_tf_runtime_query"
  },
  "total": 84388,
  "count": 50
}
```

| Check | Value |
|-------|-------|
| Controller | `CountyRowsController.GetParcels()` → `_db.TfParcels` |
| EF table mapping | `TfParcelConfiguration` → `canonical_tf.tf_parcel` |
| Total parcels | 84,388 (active, de-duped) |
| Source | `canonical_tf_runtime_query` |
| Schema mutations | NONE |
| Data mutations | NONE |

Note: `total` (84,388) is slightly below raw row count from 001H restore verification
(84,418) because 002C applies `duplicateParcelVersionsCollapsed: true` filtering.

---

## Gate 002D — Frontend Proxy Chain Proven

**Result: PASS — Evidence commit `322b0a9fb`**

Full chain:

```
Browser → Vite :3000 → TerraFusion.API :5046 → Azure PG16 → canonical_tf.tf_parcel
```

| Check | Value |
|-------|-------|
| Vite version | v5.4.21 |
| Vite startup | Ready in 834 ms on port 3000 |
| Proxy target | `http://localhost:5046` (via `TF_API_PORT=5046`) |
| Parcel total via proxy | 84,388 — matches 002C direct count |
| `runtimeTable` | `canonical_tf.tf_parcel` |
| `source` | `canonical_tf_runtime_query` |
| Schema mutations | NONE |
| Data mutations | NONE |
| Secrets in evidence | NONE |

Detailed evidence: `docs/data/WO_DEPLOY_BENTON_002D_FRONTEND_SMOKE.md`

---

## Aggregated Proof

| Sub-gate | Gate | Result |
|----------|------|--------|
| 002A | Preflight safe | PASS |
| 002B | API runtime smoke | PASS |
| 002C | Canonical API path | PASS |
| 002D | Frontend proxy chain | PASS |

**Full runtime chain proven local-only against Azure demo DB.**

---

## What This Does NOT Authorize

- Production deployment to Azure App Service or any hosted runtime
- Azure App Service configuration
- PACS connectivity
- Schema migrations
- Data mutation
- Secret commits

---

## Consistent Row Counts Across All Phases

| Phase | Source | tf_parcel count |
|-------|--------|----------------|
| WO-001 restore (001H) | pg_restore row count | 84,418 (raw) |
| WO-002C direct API | canonical_tf query (de-duped active) | 84,388 |
| WO-002D via Vite proxy | same query via proxy | 84,388 |

30-row delta = duplicate version collapse + active filter applied by API query.

---

## Files in This PR

| File | Purpose |
|------|---------|
| `docs/data/WO_DEPLOY_BENTON_002D_FRONTEND_SMOKE.md` | 002D gate evidence (committed `322b0a9fb`) |
| `docs/data/WO_DEPLOY_BENTON_002_CLOSURE.md` | This file — 002A–002D full closure report |

No runtime code changes. No schema changes. No secrets.

---

## Next Recommended WO

Operator decision among three options:

**Option A — WO-DEPLOY-BENTON-003A: Local Demo Rehearsal**
Run the full demo script locally against the Azure demo DB. Prove the UI flows
that would be shown to stakeholders before any cloud deployment.

**Option B — WO-DEPLOY-BENTON-003B: Azure App Deployment Preflight**
Scope the config, secrets, and infra needed to host TerraFusion.API on Azure
App Service against the existing Azure demo DB.

**Option C — WO-CONFIG-BENTON-001: County.PropertyCount + Demo Config Hardening**
Lock down county seed record, PropertyCount, and demo-mode config before
any stakeholder-visible runtime.

Recommended sequence: **Option A → Option B**.

---

**DEPLOYMENT_AUTHORIZED: NO**  
**STOP_TYPE: Evidence merged, operator decision required for next lane**
