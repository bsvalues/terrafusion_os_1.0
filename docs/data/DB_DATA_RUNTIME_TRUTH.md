# DB/Data Runtime Truth Gate

**Work Order:** WO-DATA-000  
**Date:** 2026-06-13  
**Type:** READ-ONLY audit  
**Branch:** `claude/wo-data-000-db-data-truth-gate`  
**Base:** `3f420185e` (origin/main after PR #1004)

---

## 1. DB Engine

| Environment | Provider | Connection Target |
|---|---|---|
| Base (appsettings.json) | SQLite | `terrafusion.db` (file) |
| Development | Npgsql (PostgreSQL) | `localhost:5432/terrafusion` |
| Production | Npgsql (PostgreSQL) | `${TF_DB_HOST}/terrafusion_production` |
| BentonCounty | Npgsql (PostgreSQL) | `localhost:5432/terrafusion` |
| Docker Compose | PostgreSQL 16-alpine | `terrafusion_os` |

**Provider selection logic** (`Program.cs`): Connection string is read from `ConnectionStrings:DefaultConnection`. If it starts with `Host=` or contains Npgsql markers, `UseNpgsql()` is called; otherwise `UseSqlite()`. The registration appears **5 times** in Program.cs (multiple `WebApplicationBuilder` patterns for different service scopes).

**PACS source** (MSSQL, read-only):
- Dev: `localhost:1433/pacs_oltp` (sa, password from `${TF_DEV_PACS_PASSWORD}`)
- Dev sales: `localhost:1433/pacs_golive` (sa, same password var)
- BentonCounty: `localhost:1433/pacs_oltp` (sa, `${TF_PACS_PASSWORD}`)

## 2. psql CLI

**Found:** `C:\Program Files\PostgreSQL\17\bin\psql.exe`

Status: AVAILABLE but not tested against live DB in this audit (read-only constraint).

## 3. DbContexts

### Primary: `TerraFusionDbContext`
- **Location:** `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`
- **Size:** 1,640 lines
- **DbSets:** 219 entity types registered
- **Schemas used:** public (default), plus schema-qualified entities for canonical_tf, truth_pacs, legacy_pacs_raw, gis_tf, doctrine_tf, sync_bridge, legacy_arcgis_raw, truth_arcgis, legacy_tf_unproven, workbench

### Secondary: `CurrentUseDbContext`
- **Location:** `backend/src/TerraFusion.CurrentUse/Data/CurrentUseDbContext.cs`
- **Schema:** `currentuse`
- **DbSets:** 4 (Classifications, InterestRates, Removals, AuditEntries)
- **Has own migrations:** Yes (under TerraFusion.CurrentUse)

### Secondary: `LevyDbContext`
- **Location:** `backend/src/TerraFusion.Levy/Data/LevyDbContext.cs`
- **Schema:** Not specified (uses default or configured)
- **DbSets:** 8 (Districts, LevyMeasures, LevyScenarios, RevenueProjections, LevyRates, DistrictParcels, ReferenceSources, LevyCertifications + BankedCapacities)
- **Has own migrations:** Yes (InitialLevy, SeedLevyData, AddReferenceSourceTable, AddLevyCertificationAndBankedCapacity)
- **Connection:** `LEVY_DATABASE_URL` or `ConnectionStrings:LevyDatabase`

## 4. Connection Strings (REDACTED)

All passwords/secrets replaced with `[REDACTED]`.

| Key | Dev Value (redacted) |
|---|---|
| `DefaultConnection` | `Host=localhost;Database=terrafusion;Username=postgres;Password=[REDACTED];Port=5432` |
| `BentonCountyLegacy` | `Data Source=../../county-data/wa-benton/county.db` (SQLite) |
| `HarrisPacsLegacy` | `Data Source=harris_pacs_cache.db` (SQLite cache) |
| `PacsConnection` | `Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=[REDACTED]` |
| `PacsSalesConnection` | `Server=localhost,1433;Database=pacs_golive;User Id=sa;Password=[REDACTED]` |

Production uses env-var templates (`${TF_DB_HOST}`, `${TF_DB_PASSWORD}`).

## 5. EF Migrations

**Count:** 99 migrations (excluding .Designer.cs and Snapshot files)

**Range:** `20251027_InitialCreate` through `20260509_SyncComplete2V2StageLevelResume`

**Key milestone migrations:**
1. `InitialCreate` — base schema (Properties, Counties, Users, AI, etc.)
2. `GuidMigration_UserIdCountyId` — GUID-based IDs
3. `InitialLevySchema` through `AddLevyAudit` — Levy domain
4. `AddDaisEntities` — TerraDais domain
5. `ActivateAiPersistence` — AI agent persistence
6. `AddPacsEntities` through `AddPacsLevyTables` — PACS integration entities
7. `AddCalibrationWorkbench` through `AddCountyStudySessionCountyNameMaxLength` — TerraForge workbench
8. `AddSyncSpineEntities` through `Slice_C2_AddSyncMappingWorkbook` — Sync R3 spine + atlas
9. `AddCanonicalTfAndSyncBridgeV1` — canonical TF schema + sync bridge
10. `AddLegacyPacsRaw*` — 12 migrations for legacy PACS raw landing tables
11. `AddTruthPacs*` — truth-layer tables
12. `SyncDoctrine1` through `SyncDoctrine5` — doctrine rules engine
13. `SyncWorkbench*` + `SyncComplete2*` — workbench commit + full corpus

**Migration status against live DB:** NOT TESTED (read-only audit). Requires `dotnet ef migrations list` against a running DB to determine applied vs. pending.

## 6. Schemas (from init-db.sql)

The `scripts/init-db.sql` creates 4 PostgreSQL schemas:
- `auth` — users, authentication
- `core` — properties, core government data
- `analytics` — analytics/reporting
- `ai` — AI system tables

**Note:** EF migrations use additional schema-qualified table names (canonical_tf, truth_pacs, legacy_pacs_raw, gis_tf, doctrine_tf, sync_bridge, legacy_arcgis_raw, truth_arcgis, legacy_tf_unproven, workbench) that may or may not align with PostgreSQL schemas. The `init-db.sql` schemas are likely stale — EF migrations are the authoritative schema source.

## 7. Seed / Import Scripts

| Script | Purpose | Type |
|---|---|---|
| `scripts/init-db.sql` | PostgreSQL schema + basic tables | DDL (CREATE TABLE) |
| `scripts/production/initial-benton-import.sql` | Mock sample data (NOT real PACS) | DML (INSERT, sample) |
| `scripts/seed-benton-database.sh` | Database seeding shell script | Shell |
| `scripts/load_benton_data.py` | Python data loading | Python |
| `scripts/production/initiate-harris-migration.sh` | Harris PACS migration trigger | Shell |
| `scripts/cleanup-databases.ps1` | Database cleanup (PowerShell) | PowerShell |
| `scripts/ignite-os-data-layer.ps1` | OS data layer init | PowerShell |
| `scripts/run_data_pipeline.py` | Data pipeline runner | Python |
| `scripts/test-import.mjs` | Import testing | Node.js |

**WARNING:** `initial-benton-import.sql` contains fabricated sample data (e.g., "John & Mary Anderson", "1234 Maple Street"), NOT real Benton County data. Real PACS data flows through the Sync runtime (drain endpoints), not SQL scripts.

## 8. Health Endpoints

| Endpoint | Purpose |
|---|---|
| `/healthz` | Kubernetes liveness probe |
| `/healthz/ready` | Kubernetes readiness probe |

Health checks registered:
- `ModuleConsistencyHealthCheck` — module discovery
- `PacsReadinessHealthCheck` — PACS connectivity (registered per PR-3 comment)

## 9. SignalR Hubs

| Hub | Path |
|---|---|
| `OSCoreHub` | `/hubs/oscore` |
| `EnhancementHub` | `/hubs/enhancement` |
| `QuantumMetricsHub` | `/hubs/quantum-metrics` |

## 10. Runtime Configuration

**DefaultCounty (Dev):**
- Id: `19190019-1919-1919-1919-191919191919`
- Code: `benton`

**BentonCounty profile:**
- Name: Benton County
- State: WA
- FIPS: 53005
- County Code: 053
- Property Count (config): 89,447

**Redis (Dev):** `localhost:6379`, key prefix `terrafusion:benton:`

## 11. BLOCKED Items

| Item | Reason | Impact |
|---|---|---|
| Live DB row counts | Read-only audit, no DB connection attempted | Cannot confirm actual data presence |
| CountyId isolation verification | Requires live DB queries | Cannot confirm multi-tenant isolation |
| Migration applied/pending status | Requires `dotnet ef migrations list` against live DB | Cannot confirm schema completeness |
| TerraTrace persistence state | Requires live DB or code tracing | Deferred to WO-DATA-006 |
| TerraDais persistence state | Requires live DB or code tracing | Deferred to WO-DATA-005 |

## 12. Key Findings

1. **Dual-provider architecture** — SQLite for zero-config dev, Npgsql for real work. The 5x duplication of AddDbContext in Program.cs is a code smell but not a runtime bug.

2. **Three independent DbContexts** — TerraFusionDbContext (219 entities), CurrentUseDbContext (4 entities), LevyDbContext (8 entities). Each has its own migration history. No shared migration tracking.

3. **init-db.sql vs. EF migrations** — The `init-db.sql` creates schemas and tables that overlap with (and may conflict with) EF migrations. The init script's tables are a subset and may be stale. EF migrations should be the single source of truth for schema.

4. **No real seed data in scripts** — `initial-benton-import.sql` is fabricated sample data. Real Benton data enters through the Sync drain runtime, not scripts.

5. **99 migrations without known applied state** — The migration chain is long but linear. Whether all 99 have been applied to any given DB instance is unknown without a live connection.

6. **PACS dual-database** — Two MSSQL databases (`pacs_oltp` for current data, `pacs_golive` for historical/sales). Both are source-only (read from PACS → write to TerraFusion).

7. **Docker Compose uses a different DB name** — `terrafusion_os` vs. dev's `terrafusion` vs. production's `terrafusion_production`. Three distinct database names across environments.
