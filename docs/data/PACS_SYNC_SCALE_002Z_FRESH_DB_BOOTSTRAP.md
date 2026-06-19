# WO-DATA-004B-SCALE-002Z — Fresh DB Bootstrap + Post-Seed Snapshot

**Work Order:** WO-DATA-004B-SCALE-002Z
**Date:** 2026-06-19
**Status:** COMPLETE — fresh DB bootstrapped, doctrine seeded, snapshot taken.
**Prerequisite:** SCALE-002 decision memo approved (WO-DATA-004B-SCALE-002)

---

## Executive Summary

`terrafusion_scale_proof` dropped and recreated from scratch. 90 EF migrations applied,
0 pending. pgvector 0.8.2 installed. API started with `TF_SKIP_DEV_SEEDERS=1` — dev seeders
skipped, doctrine hosted seeders ran (3+6+3 rules). All 19 drain target tables confirmed at
0 rows. Post-seed pg_dump snapshot taken. Clean baseline for SCALE-002A (parcel TopN=2,500).

---

## 1. Worktree and Config

**Worktree:** `C:\Users\bsval\terrafusion_os_1.0\tf-scale-001z`
**Branch:** `docs/wo-data-004b-scale-001-results` (local SCALE-002 commits)
**Config file:** `backend/src/TerraFusion.API/appsettings.Development.local.json`
**DefaultConnection DB:** `terrafusion_scale_proof` (gitignored, not committed)

---

## 2. Database Recreation

Previous `terrafusion_scale_proof` contained SCALE-001 drain data (624 parcel rows,
125 sales, etc.). That state was dropped to give SCALE-002 an unambiguous clean baseline.

```bash
PGPASSWORD=<dev-postgres-password> psql -U postgres -h 127.0.0.1 -p 5432 \
  -c "DROP DATABASE IF EXISTS terrafusion_scale_proof;"
PGPASSWORD=<dev-postgres-password> psql -U postgres -h 127.0.0.1 -p 5432 \
  -c "CREATE DATABASE terrafusion_scale_proof;"
PGPASSWORD=<dev-postgres-password> psql -U postgres -h 127.0.0.1 -p 5432 \
  -d terrafusion_scale_proof -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Use the local development Postgres password from the operator environment; do not commit literal passwords.

**pgvector version installed:** 0.8.2

---

## 3. EF Migrations Applied

**Command:**
```bash
cd tf-scale-001z/backend
dotnet ef database update \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API \
  --context TerraFusionDbContext
```

**Result:** 90 migrations applied. 0 pending. Last migration: `20260616060820_AddForgeCostReference`.

**Verification:**
```sql
SELECT COUNT(*) FROM "__EFMigrationsHistory";
-- Result: 90
```

### Migration chain tail (last 6 applied):

| Migration ID |
|---|
| `20260508093708_SyncWorkbenchGCommitTables` |
| `20260508161603_SyncComplete2FullCorpusRun` |
| `20260508172855_SyncDoctrine5SalesQualificationCodes` |
| `20260509184340_SyncComplete2V2StageLevelResume` |
| `20260616060820_AddForgeCostReference` |

---

## 4. API Startup — Dev Seeders Skipped, Doctrine Seeders Ran

**Start command:**
```bash
TF_SKIP_DEV_SEEDERS=1 dotnet run --project backend/src/TerraFusion.API --no-build
```

**API port:** `http://localhost:5000`

### Dev seeders — SKIPPED (required)

| Seeder | Log line | Status |
|---|---|---|
| GPT seeder | `[STARTUP] GPT seeding skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.` | SKIPPED ✓ |
| Dossier seeder | `[DX-01] Dossier seed skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.` | SKIPPED ✓ |
| Dev seeders master | `[STARTUP] Dev seeders skip=True (arg=False, TF_SKIP_DEV_SEEDERS=1)` | SKIPPED ✓ |

### Doctrine hosted seeders — RAN (required)

| Seeder | New Rules | Log excerpt |
|---|---|---|
| `DoctrineRatioPolicySeeder` | 3 | `inserted 3 new rule(s); existing 0` |
| `DoctrinePropertyUniverseSeeder` | 6 | `inserted 6 V2 rule(s); deactivated 0 V1 rule(s); existing 0` |
| `SalesQualificationCodesSeeder` | 3 | `inserted 3 new rule(s); existing 0` |

**Total doctrine rules seeded:** 12 (3 ratio + 6 universe + 3 sales qualification)

**PACS background sync:** Skipped (read-only contract; expected).

---

## 5. Zero-Row Baseline — All Drain Tables

All 19 drain target tables confirmed at **0 rows** — clean baseline for SCALE-002.

| Table | Rows |
|---|---|
| `legacy_pacs_raw.property` | 0 |
| `legacy_pacs_raw.imprv` | 0 |
| `legacy_pacs_raw.owner` | 0 |
| `legacy_pacs_raw.land_detail` | 0 |
| `legacy_pacs_raw.sale` | 0 |
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
| `sync_bridge.load_batch` | 0 |
| `sync_bridge.source_xref` | 0 |
| `sync_bridge.promotion_gate_result` | 0 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 |

---

## 6. Doctrine and Reference Tables — Post-Seed State

| Table | Rows | Expected |
|---|---|---|
| `doctrine_tf.tf_doctrine_ratio_policy` | 3 | 3 ✓ |
| `doctrine_tf.tf_doctrine_property_universe` | 6 | 6 ✓ |
| `doctrine_tf.tf_doctrine_sales_qualification_codes` | 3 | 3 ✓ |
| `canonical_tf.attribute_definition` | 0 | 0 ✓ (populated by ATTR-POP-1 during improvement drain) |

---

## 7. Sales-Width Migration Chain Verification

Key sales-width migrations confirmed applied via `__EFMigrationsHistory`:

| Migration | Purpose |
|---|---|
| `20260502184853_AddLegacyPacsRawSale` | Landing table |
| `20260504000000_WidenLegacyPacsRawSaleCodeColumns` | Code columns widened |
| `20260506042453_SyncDoctrine2DualSurfaceSale` | Dual-surface fields |
| `20260508172855_SyncDoctrine5SalesQualificationCodes` | Qualification codes |

---

## 8. Post-Seed Snapshot

Snapshot taken **after** doctrine seeders ran and **before** any drain.

```bash
PGPASSWORD=<dev-postgres-password> pg_dump -U postgres -h 127.0.0.1 -p 5432 \
  -Fc terrafusion_scale_proof > terrafusion_scale_proof_scale002_postseed_baseline.dump
```

| Field | Value |
|---|---|
| Snapshot file | `terrafusion_scale_proof_scale002_postseed_baseline.dump` |
| Snapshot path | `tf-scale-001z/terrafusion_scale_proof_scale002_postseed_baseline.dump` |
| Format | PostgreSQL custom (`-Fc`) |
| File size | 721K |
| Snapshot timing | After doctrine seeder, before any drain |

**Recovery use:** `pg_restore -U postgres -d terrafusion_scale_proof terrafusion_scale_proof_scale002_postseed_baseline.dump` restores to this exact post-seed state without re-running 90 migrations.

---

## 9. dev_clean Isolation Proof

`terrafusion_dev_clean` was not touched at any point during this bootstrap.

| Table | Pre | Post | Changed? |
|---|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | 83,326 | No ✓ |
| `canonical_tf.tf_sale` | 61 | 61 | No ✓ |
| `canonical_tf.tf_land` | 137 | 137 | No ✓ |

---

## 10. What Was Not Done (Explicitly Excluded)

- No parcel drain
- No owner-wsdor drain
- No improvement drain
- No land drain
- No sales drain
- No geometry drain
- PACS source (`pacs_oltp_verify`) not queried (no drain → no PACS contact)
- No code changes
- No schema changes

---

## Final Report

| Field | Value |
|---|---|
| RESULT | BOOTSTRAP COMPLETE |
| DB_NAME | `terrafusion_scale_proof` |
| MIGRATIONS_APPLIED | 90 |
| PENDING_MIGRATIONS | 0 |
| LAST_MIGRATION | `20260616060820_AddForgeCostReference` |
| PGVECTOR | 0.8.2 installed |
| DOCTRINE_SEED_STATUS | 12 rules seeded (3 ratio + 6 universe + 3 sales qualification) |
| ZERO_ROW_BASELINE | All 19 drain tables at 0 ✓ |
| SNAPSHOT | `terrafusion_scale_proof_scale002_postseed_baseline.dump` (721K) |
| DRAINS_RUN | None |
| DEV_CLEAN_TOUCHED | No ✓ |
| PACS_CONTACT | None |
| CODE_CHANGED | No |
| FILES_CHANGED | `docs/data/PACS_SYNC_SCALE_002Z_FRESH_DB_BOOTSTRAP.md` (this file) |
| NEXT_WORK_ORDER | SCALE-002A — parcel drain TopN=2,500 |
