# WO-DATA-002B: Table Row-Count Baseline

**Date**: 2026-06-15
**Database**: `terrafusion_dev_clean` (Docker PG16, port 5432)
**Status**: COMPLETE — schema-complete, data-empty
**Method**: SELECT-only against `information_schema`, `pg_stat_user_tables`, direct `count(*)`

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total tables | 231 |
| Schemas | 11 |
| Tables with rows > 0 | 0 |
| EF migrations applied | 88 |
| Extensions | plpgsql 1.0, uuid-ossp 1.1, vector 0.8.2 |

**Every table has 0 rows.** The database is schema-complete but entirely data-empty, as expected after a clean migration-only bootstrap (WO-DATA-002A-EXEC-P2).

## 2. Tables by Schema

| Schema | Table Count |
|--------|-------------|
| public | 171 |
| canonical_tf | 16 |
| legacy_pacs_raw | 11 |
| sync_bridge | 8 |
| legacy_tf_unproven | 7 |
| truth_pacs | 6 |
| tf_workbench | 5 |
| doctrine_tf | 4 |
| legacy_arcgis_raw | 1 |
| gis_tf | 1 |
| truth_arcgis | 1 |
| **Total** | **231** |

## 3. Migration Proof

- **Count**: 88 rows in `public."__EFMigrationsHistory"`
- **Last 5 migrations**:
  1. `20260509184340_SyncComplete2V2StageLevelResume`
  2. `20260508172855_SyncDoctrine5SalesQualificationCodes`
  3. `20260508161603_SyncComplete2FullCorpusRun`
  4. `20260508093708_SyncWorkbenchGCommitTables`
  5. `20260508083117_SyncWorkbenchFTriageTable`

## 4. Key Domain Tables — Row Counts

| Table | Rows |
|-------|------|
| public.Properties | 0 |
| public.Counties | 0 |
| public.GovernmentUsers | 0 |
| public.TaxLevies | 0 |
| public.PropertyAssessments | 0 |
| canonical_tf.tf_parcel | 0 |
| canonical_tf.tf_improvement | 0 |
| canonical_tf.tf_sale | 0 |
| truth_pacs.imprv_current | 0 |
| truth_pacs.sale | 0 |

## 5. Sibling Database Status

| Database | Public Tables | Status |
|----------|---------------|--------|
| terrafusion_dev_clean | 171 | ACTIVE — 88 migrations |
| terrafusion_levy | 0 | EMPTY — isolated, no contamination |
| terrafusion | 0 | EMPTY — untouched legacy |

## 6. Levy Contamination Check

Migration `20260405062618_AddPacsLevyTables` exists in `__EFMigrationsHistory`. This is the **schema** migration (creates pacs_levy_* tables). No LevyDbContext data or separate Levy migration stream exists — the Levy fallback DbContext was removed in WO-DATA-002A-EXEC-P2.

`terrafusion_levy` database has 0 tables — confirms isolation.

---

No mutations performed. All queries were SELECT-only.
