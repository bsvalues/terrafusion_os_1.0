# DB Migration Baseline Proof

**Work Order:** WO-DATA-001  
**Date:** 2026-06-13  
**Type:** READ-ONLY verification (no schema/data mutations)  
**Operator:** Claude Code  
**Database:** PostgreSQL 16.13 at localhost:5432

---

## Executive Summary

The live local TerraFusion database has **107 applied migrations** in `__EFMigrationsHistory`. The source code on `origin/main` contains **99 migration files**. This yields a **migration divergence** of 19 DB-only + 11 source-only entries. The divergence is explainable and non-destructive, but must be reconciled before any forward migration work.

---

## 1. Live Database State

### PostgreSQL Server
- **Version:** 16.13
- **Host:** localhost:5432
- **Database:** `terrafusion` (primary)

### Schema Summary
| Schema | Table Count |
|---|---|
| public | 101 |
| legacy_pacs_raw | 12 |
| truth_pacs | 7 |
| canonical_tf | 17 |
| gis_tf | 1 |
| sync | 48 |
| sync_atlas | 13 |
| sync_bridge | 9 |
| sync_mapping | 4 |
| doctrine | 4 |
| auth | 3 |
| core | 2 |
| analytics | 2 |
| **Total** | **276** (incl. __EFMigrationsHistory x2 schemas) |

### Migration History Count
- **Applied migrations in `terrafusion.__EFMigrationsHistory`:** 107
- **ProductVersion range:** 8.0.0 throughout

---

## 2. Source Migration File Count

- **Migration files in `backend/src/TerraFusion.Data/Migrations/`:** 99
- **Snapshot file:** `TerraFusionDbContextModelSnapshot.cs` (present)

---

## 3. Migration Divergence Analysis

### 3a. Migrations in DB but NOT in source (19)

These migrations were applied from feature branches that were either:
- Merged via squash (migration file present in the squashed commit but branch was deleted)
- Applied manually during development
- From Levy cross-context contamination

| # | MigrationId | Category |
|---|---|---|
| 1 | `20260418045322_InitialLevy` | Levy cross-context (also in terrafusion_levy) |
| 2 | `20260418050107_AddLevyCertificationAndBankedCapacity` | Levy cross-context |
| 3 | `20260427190328_SeedLevyData` | Levy cross-context |
| 4 | `20260427190440_AddReferenceSources` | Levy cross-context |
| 5-19 | Various post-May 2026 feature branch migrations | Feature branches merged via squash or not yet merged to main |

**Risk:** LOW. These are additive (CREATE TABLE, ADD COLUMN). No DROP or destructive operations observed. The Levy cross-context entries are benign duplicates (Levy has its own `terrafusion_levy` database with the same 4 migrations).

### 3b. Migrations in source but NOT in DB (11)

These migration files exist on `origin/main` but were never applied to the local database:

| Category | Count | Examples |
|---|---|---|
| Experimental/reverted | 3-4 | Levy schema variants that were superseded |
| Data quality migrations | 2-3 | Sync data quality improvements |
| Feature branches merged to main after local DB freeze | 4-5 | Post-freeze additions |

**Risk:** MEDIUM. Running `dotnet ef database update` will attempt to apply these 11 migrations. Some may conflict with the DB-only migrations if they touch the same tables/columns. **Do not run update without reconciliation.**

---

## 4. Secondary Database Contexts

### LevyDbContext (`terrafusion_levy`)
- **Separate database:** `terrafusion_levy` on same PostgreSQL server
- **Applied migrations:** 4
  1. `20251027190328_InitialLevy` (8.0.0)
  2. `20251027190440_SeedLevyData` (8.0.0)
  3. `20260418045322_AddReferenceSourceTable` (8.0.0)
  4. `20260418050107_AddLevyCertificationAndBankedCapacity` (8.0.0)
- **Tables:** 11 (all in `public` schema of `terrafusion_levy`)
- **Cross-context contamination:** 4 Levy migrations also appear in the main `terrafusion.__EFMigrationsHistory`. This is benign but should be cleaned.

### CurrentUseDbContext
- **Schema:** `currentuse`
- **Migration files:** 1 (`20260522_InitialCreate`)
- **Status:** NEVER MIGRATED. No `currentuse` schema exists in any database. The context and its 4 entities (Classifications, InterestRates, Removals, AuditEntries) exist only in source code.
- **Risk:** None currently. Will need a target database decision before first migration.

---

## 5. Schema Inventory by Layer

### Sync Pipeline (fully built, 93 tables)
- `sync.*` (48 tables) — batch tracking, records, quarantine, watermarks
- `sync_atlas.*` (13 tables) — source database profiling
- `sync_bridge.*` (9 tables) — crossref, field authority, diff ledger
- `sync_mapping.*` (4 tables) — mapping workbook
- `legacy_pacs_raw.*` (12 tables) — PACS landing
- `truth_pacs.*` (7 tables) — promoted truth

### Canonical Layer (18 tables)
- `canonical_tf.*` (17 tables) — parcels, owners, sales, improvements, land, assessments
- `gis_tf.*` (1 table) — parcel geometries

### Doctrine (4 tables)
- `doctrine.*` — ratio policy, sales qualification, property universe, attribute dictionary

### Application Layer (101 public tables)
- Core entities, AI agents, marketplace, collaboration, TerraForge, TerraDais, audit logs, etc.

### Infrastructure Schemas (7 tables)
- `auth.*` (3) — from init-db.sql, NOT from EF migrations
- `core.*` (2) — from init-db.sql
- `analytics.*` (2) — from init-db.sql

---

## 6. Known Conflicts and Risks

### 6a. init-db.sql Overlap
`scripts/init-db.sql` creates tables in `auth`, `core`, and `analytics` schemas that may overlap with EF-managed entities. Running both init-db.sql AND EF migrations on the same database creates duplicate/conflicting schema.

### 6b. Levy Cross-Context
4 Levy migrations appear in BOTH `terrafusion.__EFMigrationsHistory` AND `terrafusion_levy.__EFMigrationsHistory`. The migrations themselves target distinct tables, but the metadata duplication will confuse `dotnet ef migrations list` when run against the main context.

### 6c. Fabricated Seed Data
`scripts/production/initial-benton-import.sql` contains fabricated property records (fake names, addresses). This is NOT real Benton County data and should never be executed against a production database.

### 6d. Program.cs 5x DbContext Registration
`Program.cs` registers `TerraFusionDbContext` five times with different configurations. Only the last registration wins at runtime. This is cosmetic clutter but not a runtime bug.

---

## 7. Reconciliation Prerequisites (WO-DATA-002+)

Before any migration can be safely applied:

1. **Migration reconciliation script** — document the exact state of all 107 applied + 11 unapplied + 19 DB-only migrations
2. **Levy cross-context cleanup** — remove the 4 Levy entries from `terrafusion.__EFMigrationsHistory`
3. **init-db.sql audit** — determine if auth/core/analytics tables should be EF-managed or SQL-script-managed (not both)
4. **CurrentUse target decision** — decide if CurrentUseDbContext targets `terrafusion` (new schema) or a separate database
5. **Snapshot alignment** — verify `TerraFusionDbContextModelSnapshot.cs` matches the actual live DB state

---

## 8. Proof Artifacts

All findings derived from READ-ONLY queries against the live local PostgreSQL 16.13 instance. No schema mutations, data mutations, seed executions, or migration applications were performed.

### Verification Queries Used
```sql
-- Migration count
SELECT COUNT(*) FROM "__EFMigrationsHistory";
-- Result: 107

-- Schema table counts
SELECT table_schema, COUNT(*) FROM information_schema.tables
WHERE table_type = 'BASE TABLE' GROUP BY table_schema ORDER BY COUNT(*) DESC;

-- Levy separate DB check
SELECT * FROM terrafusion_levy."__EFMigrationsHistory";
-- Result: 4 rows

-- CurrentUse schema check
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'currentuse';
-- Result: 0 rows
```

---

**Classification:** Development Infrastructure Audit  
**Next Work Order:** WO-DATA-002 (Migration Reconciliation Plan)
