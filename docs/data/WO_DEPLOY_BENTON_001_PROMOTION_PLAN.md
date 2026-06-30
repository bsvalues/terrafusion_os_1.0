# WO-DEPLOY-BENTON-001 — Benton Demo DB Promotion Plan

**Date:** 2026-06-28  
**Status:** PLANNING — awaiting operator target decision  
**Prerequisite:** WO-DATA-FINALIZE-PR complete, PR #1092 open, S6 snapshot preserved

---

## 1. Current State (Baseline)

| Item | State |
|------|-------|
| S6 dump | `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S6_complete.dump` (2.507 GB) |
| Local postgres container | `terrafusion-postgres-dev` running, S6 data live at `localhost:5432` |
| Local API | Port 5046, `wo/geom-011c` worktree — temporary, not the main dev stack |
| PACS containers | `tf-pacs-current-verify` :21433, `tf-pacs-bak-restore` :21434 — running |
| Azure CLI | Not authenticated (`az login` required before any Azure steps) |
| Prod compose | `backend/docker-compose.prod.yml` exists (`postgres:16-alpine`, named `terrafusion-postgres-prod`) |

---

## 2. Promotion Target Options

### Option A — Local Demo Runtime (Lowest friction, immediate)

Wire the completed S6 data into the **main dev stack** so the full application runs against real
Benton data on this machine.

**What it means:**
- Rename or snapshot `terrafusion_benton_demo` → `terrafusion_dev` (or update the API
  `DefaultConnection` to point at `terrafusion_benton_demo` directly)
- Start the main dev stack (`TF_API_PORT=5046 VITE_PORT=3000 pnpm run dev`) against S6 data
- Run smoke tests on the frontend with real parcel/owner/improvement/land/sales/geometry data

**Prerequisites:**
- Merge PR #1092 first
- Decide DB name: keep `terrafusion_benton_demo` as the live name, or restore into `terrafusion`

**Risk:** Low. Everything is already local. No secrets leave the machine.

**Blocker:** None — can be executed immediately.

---

### Option B — Azure Dev/Test Environment (Demo-ready, shareable)

Restore S6 into an **Azure Database for PostgreSQL Flexible Server** in a dev/test resource group.

**What it means:**
- Provision Azure PostgreSQL (or use existing, if one exists)
- Upload S6 dump → restore via `pg_restore` on the Azure server
- Update `appsettings.{env}.json` with Azure connection string
- Deploy API + frontend to Azure App Service or Container App
- Run smoke tests against Azure endpoint

**Prerequisites:**
- `az login` — operator must authenticate
- Azure subscription and resource group identified
- Decide: Flexible Server (recommended for pg_restore support) vs Azure DB for PostgreSQL
- Cost estimate: Flexible Server B1ms ~$13/month for dev tier

**Risk:** Medium. Connection strings go in Azure Key Vault or App Service settings, not committed.
Dump upload is ~2.5 GB — takes ~5-10 min on typical connection.

**Blockers:**
- Azure CLI auth (`az login`)
- Operator decision on subscription/resource group
- Azure PostgreSQL provisioning (~5-10 min)

---

### Option C — Benton-Owned Environment (Future, county handoff)

Deliver S6 as a restore package to Benton County's own infrastructure.

**What it means:**
- Package: S6 dump + restore procedure doc + connection string template + smoke test checklist
- County receives: portable archive, instructions, validation gates
- County runs restore on their environment (on-prem or county cloud)

**Prerequisites:**
- County has a PostgreSQL 16 target (or we provision one)
- Transfer mechanism for 2.5 GB dump (secure file transfer, Azure Blob, or physical)
- County DBA or operator to execute restore

**Risk:** Low for us (read-only delivery). Restore authority stays with county.

**Blockers:**
- County environment decision (out of scope for this WO, future WO)
- Secure transfer method

---

## 3. Restore Procedure (Common to all targets)

This procedure is target-agnostic. Adapt connection vars per environment.

```bash
# 1. Create target database
psql -U postgres -h <HOST> -c "CREATE DATABASE terrafusion_benton_demo;"

# 2. Copy dump to target host (or use docker cp for local)
# For local: already at C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S6_complete.dump
# For Azure: upload via az storage blob upload or scp

# 3. Restore (parallel, 4 jobs)
pg_restore -U postgres -h <HOST> -d terrafusion_benton_demo -Fc -j 4 <dump_path>

# 4. Verify row counts (run against restored DB)
psql -U postgres -h <HOST> -d terrafusion_benton_demo -c "
SELECT 'parcel' as lane, COUNT(*) FROM canonical_tf.tf_parcel
UNION ALL SELECT 'owner', COUNT(*) FROM canonical_tf.tf_owner
UNION ALL SELECT 'land', COUNT(*) FROM canonical_tf.tf_land
UNION ALL SELECT 'sale', COUNT(*) FROM canonical_tf.tf_sale
UNION ALL SELECT 'improvement', COUNT(*) FROM canonical_tf.tf_improvement
UNION ALL SELECT 'geom', COUNT(*) FROM gis_tf.tf_parcel_geom;
"

# Expected:
# parcel      84,418
# owner       97,062
# land        87,767
# sale        90,386
# improvement 100,144
# geom        79,199
```

---

## 4. Connection String Templates

**Local (current):**
```
Host=localhost;Database=terrafusion_benton_demo;Username=postgres;Password=<local>;Port=5432;Command Timeout=600;Timeout=30
```

**Azure Flexible Server:**
```
Host=<server>.postgres.database.azure.com;Database=terrafusion_benton_demo;Username=<admin>@<server>;Password=<vault-secret>;Port=5432;SSL Mode=Require;Trust Server Certificate=False
```

**Never commit** — always in `appsettings.{Env}.local.json` (gitignored) or Azure Key Vault / App Service configuration.

---

## 5. Smoke Tests (Post-Restore Validation)

Run against the target API after restore and deploy.

| Test | Endpoint | Expected |
|------|----------|---------|
| Health check | `GET /health` | HTTP 200 |
| Parcel count | `GET /api/sync/status` or equivalent | parcel=84,418 |
| Single parcel fetch | `GET /api/parcels/{known_pin}` | HTTP 200, data present |
| Owner lookup | `GET /api/owners?parcelId=...` | HTTP 200 |
| Sales lane status | Sync status endpoint | sale=90,386 |
| Geometry present | `GET /api/parcels/{pin}/geometry` | HTTP 200, coordinates present |
| No active drain | Batch status check | 0 IN_PROGRESS (excl. 9 historical zombies) |

---

## 6. Secrets / Connection String Management

| Secret | Local | Azure |
|--------|-------|-------|
| Postgres password | `appsettings.Development.local.json` (gitignored) | Azure Key Vault or App Service Config |
| PACS SA password | `appsettings.Development.local.json` (gitignored) | Key Vault (only if PACS sync needed in cloud) |
| ArcGIS (geometry) | No credential needed for read-only REST | Same |

**Rule:** No connection strings or passwords in committed files. Ever.

---

## 7. Decision Gate

Operator must choose a path before execution begins.

| Decision | Options |
|----------|---------|
| **Primary target** | A (local demo), B (Azure dev/test), C (county handoff) |
| **DB name in target** | `terrafusion_benton_demo` (preserve) or `terrafusion` (rename to match dev stack) |
| **Azure subscription** | (if B) — which sub, which resource group |
| **PACS in cloud** | (if B) — include PACS SQL containers in Azure, or local-only |
| **Merge PR #1092 first?** | Recommended yes before any deployment |

---

## 8. Recommended Immediate Next Step

**Merge PR #1092 first.** It's the canonical record and should land on main before any deployment
work starts.

Then: operator declares target (A, B, or C), and execution begins on the chosen path as a
separate WO (e.g., WO-DEPLOY-BENTON-001A for local, WO-DEPLOY-BENTON-001B for Azure).

---

## Final Report

| Field | Value |
|-------|-------|
| RESULT | Plan complete — awaiting operator target decision |
| S6_RESTORE_POINT | `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S6_complete.dump` (2.507 GB) |
| TARGET_OPTIONS | A=local demo / B=Azure dev-test / C=county handoff |
| AZURE_CLI_STATUS | Not authenticated — `az login` required for Option B |
| IMMEDIATE_BLOCKER | None for Option A; `az login` + subscription for Option B |
| RECOMMENDED_FIRST_STEP | Merge PR #1092, then declare target |
| NEXT_WORK_ORDER | WO-DEPLOY-BENTON-001A/B/C per operator decision |
