# WO-DATA-004B-SCALE-001Z — Fresh Scale DB Bootstrap

**Work Order:** WO-DATA-004B-SCALE-001Z
**Date:** 2026-06-19
**Status:** COMPLETE — DB bootstrapped, schema verified, clean baseline confirmed.
**Prerequisite:** PR #1051 (SCALE-001Y safe-default patch) merged at `abca83b439`

---

## Executive Summary

Fresh `terrafusion_scale_proof` PostgreSQL database created from current `origin/main` (post-SCALE-001Y).
EF migrations applied cleanly (90 migrations). All five doctrine/sync schema groups present. All key
drain tables confirmed at 0 rows. pgvector 0.8.2 installed. Sales-width migration chain verified.

This is a clean baseline for SCALE-001A (parcel TopN=500) and subsequent scale proof drains.

---

## 1. Worktree and Config

**Worktree:** `C:\Users\bsval\terrafusion_os_1.0\tf-scale-001z`
**Branch:** `origin/main` (post-PR #1051)
**Config file:** `backend/src/TerraFusion.API/appsettings.Development.local.json`
**DefaultConnection DB:** `terrafusion_scale_proof` (gitignored, not committed)

---

## 2. Database Creation

```bash
PGPASSWORD=<dev-postgres-password> psql -U postgres -h 127.0.0.1 -p 5432 \
  -c "CREATE DATABASE terrafusion_scale_proof;"
PGPASSWORD=<dev-postgres-password> psql -U postgres -h 127.0.0.1 -p 5432 -d terrafusion_scale_proof \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Use the local development Postgres password from the operator environment; do not commit literal passwords.

**pgvector version installed:** 0.8.2

---

## 3. EF Migrations Applied

**Command:**
```bash
cd backend
dotnet ef database update \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API \
  --context TerraFusionDbContext
```

**Note:** `--context TerraFusionDbContext` required — multiple DbContexts exist in solution.

**Result:** 90 migrations applied. Last migration: `20260616060820_AddForgeCostReference`.

### Migration chain tail (last 10):

| MigrationId |
|---|
| `20260616060820_AddForgeCostReference` |
| `20260509184340_SyncComplete2V2StageLevelResume` |
| `20260508172855_SyncDoctrine5SalesQualificationCodes` |
| `20260508161603_SyncComplete2FullCorpusRun` |
| `20260508093708_SyncWorkbenchGCommitTables` |
| `20260508083117_SyncWorkbenchFTriageTable` |
| `20260508015117_SyncE1G2DictsAndTfParcelConversionEra` |
| `20260506182219_SyncDoctrine4V4PropertyValLanding` |
| `20260506162612_SyncDoctrine4V3LandDetailAgApply` |
| `20260506073029_SyncDoctrine4PropertyUniverseAndAttributeDictionary` |

---

## 4. Schema Verification

### 4a. Schema groups present

| Schema | Table count |
|---|---|
| `canonical_tf` | 16 |
| `doctrine_tf` | 4 |
| `gis_tf` | 1 |
| `legacy_arcgis_raw` | 1 |
| `legacy_pacs_raw` | 11 |
| `legacy_tf_unproven` | 7 |
| `public` | 180 |
| `sync_bridge` | 8 |
| `tf_workbench` | 5 |
| `truth_arcgis` | 1 |
| `truth_pacs` | 6 |

All five doctrine/sync schema groups confirmed present: `legacy_pacs_raw`, `truth_pacs`, `canonical_tf`, `sync_bridge`, `legacy_tf_unproven`, plus `doctrine_tf`.

### 4b. Sales-width migration chain

Key sales-width migrations confirmed applied:

- `20260502184853_AddLegacyPacsRawSale` — landing table created
- `20260504000000_WidenLegacyPacsRawSaleCodeColumns` — code columns widened
- `20260506042453_SyncDoctrine2DualSurfaceSale` — dual-surface fields
- `20260508172855_SyncDoctrine5SalesQualificationCodes` — qualification codes table

### 4c. pgvector

```
extname | extversion
--------+-----------
vector  | 0.8.2
```

---

## 5. Baseline Row Counts

All key tables confirmed at **0 rows** — clean baseline.

| Table | Rows |
|---|---|
| `truth_pacs.parcel_spine` | 0 |
| `truth_pacs.imprv_current` | 0 |
| `truth_pacs.owner_current` | 0 |
| `truth_pacs.land_current` | 0 |
| `truth_pacs.sale` | 0 |
| `canonical_tf.tf_parcel` | 0 |
| `canonical_tf.tf_improvement` | 0 |
| `canonical_tf.tf_owner` | 0 |
| `canonical_tf.tf_land` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `legacy_pacs_raw.property` | 0 |
| `legacy_pacs_raw.imprv` | 0 |
| `legacy_pacs_raw.owner` | 0 |
| `legacy_pacs_raw.land_detail` | 0 |
| `legacy_pacs_raw.sale` | 0 |
| `doctrine_tf.tf_doctrine_ratio_policy` | 0 |
| `doctrine_tf.tf_doctrine_property_universe` | 0 |
| `doctrine_tf.tf_doctrine_sales_qualification_codes` | 0 |

**Doctrine tables empty** — expected. Doctrine rules are seeded by hosted services at API
startup (`DoctrineRuleSeederHostedService`), not by EF migrations. They will populate on
first API boot before any drain is run.

---

## 6. Snapshot Viability

This clean migrated DB is a viable reusable snapshot baseline. Recommended approach:

1. Take a pg_dump before first drain:
   ```bash
   PGPASSWORD=<dev-postgres-password> pg_dump -U postgres -h 127.0.0.1 -p 5432 \
     -Fc terrafusion_scale_proof > terrafusion_scale_proof_premigration_snapshot.dump
   ```
2. Keep dump as a recovery point — lets scale proof restart from empty state without re-running
   90 migrations if a drain is abandoned mid-run.

Note: Snapshot timing matters. Take the dump AFTER doctrine rules seed (first API startup) to
capture seeded rules in the snapshot — otherwise the first drain after restore will need a
full seed pass again.

---

## 7. What Was Not Done (Explicitly Excluded)

Per work order scope:

- No parcel drain
- No owner drain
- No improvement drain
- No land drain
- No sales drain
- No geometry drain
- No attempt to recreate FIX7B TopN=100 baseline

---

## Final Report

| Field | Value |
|---|---|
| RESULT | BOOTSTRAP COMPLETE |
| DB_NAME | `terrafusion_scale_proof` |
| HOST | `127.0.0.1:5432` |
| MIGRATIONS_APPLIED | 90 |
| LAST_MIGRATION | `20260616060820_AddForgeCostReference` |
| PGVECTOR | 0.8.2 installed |
| SALES_WIDTH_CHAIN | VERIFIED |
| ALL_DRAIN_TABLES | 0 rows (clean) |
| DOCTRINE_TABLES | 0 rows (seeded at API startup) |
| SNAPSHOT_VIABLE | YES (take pg_dump before first drain) |
| DRAINS_RUN | None |
| DB_MUTATION | Schema only (EF migrations) |
| PACS_CONTACT | None |
| NEXT_WORK_ORDER | SCALE-001A — parcel drain TopN=500 from empty canonical state |
