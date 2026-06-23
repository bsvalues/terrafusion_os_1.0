# WO-DATA-004A: PACS/Sync Import Contract Preflight

**Date**: 2026-06-15
**Database**: `terrafusion_dev_clean` (Docker PG16, port 5432)
**Status**: COMPLETE — read-only preflight, zero mutations
**Method**: Source-code analysis + DB schema inspection + container inventory. No drains, no imports, no DB writes.
**Prerequisite**: WO-DATA-003 (SEED_FIXTURE_PROVENANCE_AUDIT) merged as `6895206c1`

---

## 1. Preflight Summary

| Check | Result |
|-------|--------|
| DB data-empty | PASS — 0 rows in Properties, GovernmentUsers, SaleRecords, Counties |
| Doctrine tables empty | PASS — 0 rows in all 3 doctrine_tf tables |
| Truth tables empty | PASS — 0 rows in all 6 truth_pacs tables |
| Canonical tables empty | PASS — 0 rows in all 16 canonical_tf tables |
| Legacy landing tables empty | PASS — 0 rows in all 11 legacy_pacs_raw tables |
| Sync bridge tables empty | PASS — 0 rows in source_xref, load_batch |
| Schema count | PASS — 231 tables across 11 schemas |
| Fake dev seeders disabled | PASS — TF_SKIP_DEV_SEEDERS documented as required |
| PG16 Docker container running | PASS — `terrafusion-postgres-dev` up, port 5432 |
| MSSQL (PACS) container status | WARN — `tf-benton-wo004-sql` exists but STOPPED (port 11433) |
| MSSQL compose container | NOT RUNNING — `tf-mssql` (port 1433) does not exist as container |
| PacsConnection in committed config | PRESENT — localhost:1433, pacs_oltp, sa/${TF_DEV_PACS_PASSWORD} |
| PacsConnection in local override | PRESENT — localhost:1433, pacs_oltp (with real password in main checkout) |
| Local override DB target | CAUTION — DefaultConnection in local override targets `terrafusion` not `terrafusion_dev_clean` |
| Docker volumes for PACS | PRESENT — tf_mssql_data, tf_mssql_data_pacs, pacs_baks |

---

## 2. Database Verification (terrafusion_dev_clean)

### 2.1 Core Tables — All Empty

```
Properties          | 0
GovernmentUsers     | 0
SaleRecords         | 0
Counties            | 0
```

### 2.2 Doctrine Tables — All Empty

```
doctrine_tf.tf_doctrine_property_universe      | 0
doctrine_tf.tf_doctrine_ratio_policy           | 0
doctrine_tf.tf_doctrine_sales_qualification_codes | 0
```

**Note**: Doctrine seeders have NOT run because `TF_SKIP_DEV_SEEDERS` blocks them (the blunt-instrument coupling identified in WO-DATA-003). WO-DATA-004B must seed doctrine rules BEFORE running drains — either by:
- Starting API without `TF_SKIP_DEV_SEEDERS` briefly (risks dev seeders too), or
- Calling doctrine seeder endpoints directly, or
- Splitting the flag first (recommended in WO-DATA-003 cleanup plan)

### 2.3 Three-Layer Pipeline — All Empty

**legacy_pacs_raw (11 tables)**:
```
account | 0    property     | 0    sale              | 0
imprv   | 0    property_val | 0    wash_prop_owner_val | 0
imprv_attr | 0  owner       | 0    prop_supp_assoc   | 0
imprv_detail | 0  land_detail | 0
```

**truth_pacs (6 tables)**:
```
parcel_spine       | 0    owner_current        | 0
imprv_current      | 0    wash_prop_owner_val  | 0
land_current       | 0    sale                 | 0
```

**canonical_tf (16 tables)**:
```
tf_parcel              | 0    tf_improvement_feature | 0
tf_sale                | 0    tf_land                | 0
tf_owner               | 0    tf_parcel_geom         | 0 (if exists)
tf_parcel_owner_link   | 0    attribute_definition   | 0
tf_assessment_wsdor    | 0    dict_* (8 tables)      | 0
tf_improvement         | 0
```

**sync_bridge (8 tables)**:
```
source_xref            | 0    promotion_gate_result  | 0
load_batch             | 0    rollback_package       | 0
conflict_queue         | 0    writeback_journal      | 0
diff_ledger            | 0    field_authority        | 0
```

### 2.4 Schema Inventory

| Schema | Tables |
|--------|--------|
| public | 171 |
| canonical_tf | 16 |
| legacy_pacs_raw | 11 |
| sync_bridge | 8 |
| legacy_tf_unproven | 7 |
| truth_pacs | 6 |
| tf_workbench | 5 |
| doctrine_tf | 4 |
| truth_arcgis | 1 |
| legacy_arcgis_raw | 1 |
| gis_tf | 1 |

---

## 3. Connection String Inventory

### 3.1 Committed (appsettings.Development.json)

| Name | Type | Host | Port | Database | Auth |
|------|------|------|------|----------|------|
| DefaultConnection | PG16 | localhost | 5432 | terrafusion_dev_clean | postgres / devpassword123 |
| LevyDatabase | PG16 | localhost | 5432 | terrafusion_levy | postgres / devpassword123 |
| PacsConnection | MSSQL | localhost | 1433 | pacs_oltp | sa / ${TF_DEV_PACS_PASSWORD} |
| PacsSalesConnection | MSSQL | localhost | 1433 | pacs_golive | sa / ${TF_DEV_PACS_PASSWORD} |

### 3.2 Local Override (appsettings.Development.local.json — gitignored)

Exists in main checkout (`C:\Users\bsval\terrafusion_os_1.0`), NOT in worktrees.

| Name | Override |
|------|----------|
| DefaultConnection | Targets `terrafusion` (not `terrafusion_dev_clean`) |
| PacsConnection | localhost:1433, pacs_oltp (with real SA password) |
| PacsSalesConnection | localhost:1433, pacs_oltp (same DB, real password) |

**CRITICAL**: The local override changes DefaultConnection to target a DIFFERENT database (`terrafusion` vs `terrafusion_dev_clean`). Running the API from the main checkout will NOT write to `terrafusion_dev_clean` unless the local override is updated or removed.

### 3.3 PACS Password Status

- `TF_DEV_PACS_PASSWORD` env var: placeholder in committed config
- Real password: stored in `appsettings.Development.local.json` (main checkout only)
- Confirmation: password EXISTS (3 credential lines in local file) — not printed here

---

## 4. MSSQL (PACS Source) Status

### 4.1 Containers Found

| Container | Image | Port | Status | Volume |
|-----------|-------|------|--------|--------|
| tf-benton-wo004-sql | mssql/server:2019-latest | 11433→1433 | STOPPED (Exited 11h ago) | unknown (likely tf_mssql_data_pacs) |
| tf-mssql (compose) | mssql/server:2022-latest | 1433→1433 | DOES NOT EXIST | tf_mssql_data (volume exists) |

### 4.2 Docker Volumes

```
tf_mssql_data       — for compose-managed tf-mssql
tf_mssql_data_pacs  — likely for tf-benton-wo004-sql
pacs_baks           — backup volume
```

### 4.3 Port Mismatch

The committed config and local override both target `localhost:1433`. But the only MSSQL container that exists maps to port **11433**. To use PACS for WO-DATA-004B, either:
- Start the compose-managed `tf-mssql` on port 1433, OR
- Update connection string to point to port 11433, OR
- Start `tf-benton-wo004-sql` and remap to 1433

### 4.4 PACS Database Names

| Connection | Database | Content |
|------------|----------|---------|
| PacsConnection | pacs_oltp | PACS operational database (parcels, improvements, owners, land) |
| PacsSalesConnection | pacs_golive | PACS go-live database (sales primarily) |

---

## 5. Environment Variable Inventory

### 5.1 Data Operation Gates

| Variable | Purpose | Current State | Required for WO-DATA-004B |
|----------|---------|---------------|---------------------------|
| TF_SKIP_DEV_SEEDERS | Blocks fabricated seeders + doctrine hosted services | NOT SET (default) | Must manage carefully — see §2.2 |
| TF_RUN_DEV_PROPERTY_PROJECTION | Enables bulk PACS→Properties projection in DevPropertySeeder | NOT SET (disabled) | NO — this is the fabricated seeder path |
| ASPNETCORE_ENVIRONMENT | Selects config profile | Development | YES — must be Development for dev config |
| TF_DEV_PACS_PASSWORD | MSSQL SA password for dev PACS | In local override file | YES — required for PACS connectivity |

### 5.2 Runtime Variables

| Variable | Purpose |
|----------|---------|
| TERRAFUSION_API_CONTENT_ROOT | Override API content root |
| TERRAFUSION_UI_DIST_PATH | Override UI dist path |

---

## 6. Drain Endpoint Inventory

### 6.1 Primary Drain Endpoints (DoctrineDrainController)

All `POST /api/sync/doctrine/drain/{lane}` — `[AllowAnonymous]`

| Lane | Route | Data Flow |
|------|-------|-----------|
| parcel | `/parcel` | PACS→legacy_pacs_raw→truth_pacs.parcel_spine→canonical_tf.tf_parcel |
| owner-wsdor | `/owner-wsdor` | PACS→landing→truth_pacs.owner_current+wash_prop_owner_val→canonical_tf.tf_owner+tf_parcel_owner_link+tf_assessment_wsdor |
| improvement | `/improvement` | PACS→landing→truth_pacs.imprv_current→canonical_tf.tf_improvement+tf_improvement_feature |
| land | `/land` | PACS→landing→truth_pacs.land_current→canonical_tf.tf_land |
| sales | `/sales` | PACS→landing→truth_pacs.sale→canonical_tf.tf_sale |
| geometry | `/geometry` | ArcGIS→landing→truth→canonical_tf.tf_parcel_geom |

**Request parameters**: `OperatorName`, `WorkingYear`, `FullCorpus` (bool), `TopN` (int), `LaneResultId` (Guid?), `ResumeFromStage` (string)

**Safe defaults**: `FullCorpus=false`, `TopN=200` (parcel/owner), `TopN=500` (sales)

### 6.2 Chunked Drain Strategy (Operational Doctrine)

Per `docs/sync/chunk-strategy.md`:
- `FullCorpus=true` is **NOT USED** (proven to hang on improvement lane)
- `TopN<=20000` per chunk, repeat until exhaustion (`RowsPromoted < TopN`)
- `fire-next-chunk.mjs` enforces: no overlapping IN_PROGRESS batches
- `chunk-watcher.mjs` writes JSONL evidence per poll cycle
- Backend restart between chunks if memory exceeds 4 GB

### 6.3 CLI Entry Point

`dotnet run --project TerraFusion.API -- --seed-pacs` — full 13-table ETL. NOT recommended for controlled import; use per-lane drain endpoints instead.

### 6.4 Sync Controller Endpoints (Non-Drain)

| Endpoint | Method | Writes? |
|----------|--------|---------|
| `/api/sync/requalify/{countyId}` | POST | YES — updates QualificationRecommendation |
| `/api/sync/backfill-ratios/{countyId}` | POST | YES — backfills ratio fields |
| `/api/sync/backfill-neighborhoods/{countyId}` | POST | YES — backfills neighborhood |
| `/api/sync/qualification-status/{countyId}` | GET | NO |
| `/api/sync/comps/eligible` | GET | NO |
| `/api/sync/active-workbook` | GET/PUT/DELETE | PUT writes pointer only |
| `/api/sync/schema/catalog/summary` | GET | NO |

---

## 7. Doctrine/Reference Prerequisites

### 7.1 Required Before Any Drain

| Seeder | Table | Rows | Why Required |
|--------|-------|------|-------------|
| DoctrinePropertyUniverseSeeder | doctrine_tf.tf_doctrine_property_universe | 6 | Improvement promoter classifies universes (REAL_RESIDENTIAL, REAL_COMMERCIAL, AG_CURRENT_USE, etc.) |
| DoctrineRatioPolicySeeder | doctrine_tf.tf_doctrine_ratio_policy | ~3 | Sales promoter applies ratio qualification rules |
| SalesQualificationCodesSeeder | doctrine_tf.tf_doctrine_sales_qualification_codes | 3 | Sales promoter applies qualification code rules |

### 7.2 What Happens Without Doctrine

- **Parcel drain**: Runs fine — no doctrine dependency
- **Owner drain**: Runs fine — no doctrine dependency
- **Improvement drain**: Promoter classifies all improvements as `UNKNOWN` universe (no matching rules)
- **Sales drain**: Promoter may not correctly qualify sales (missing ratio/qualification rules)
- **Land drain**: Runs fine — no doctrine dependency
- **Geometry drain**: Runs fine — no doctrine dependency

### 7.3 ImprvAttrDictionaryRefreshHostedService

- Reads PACS `imprv_attr` codes into in-memory dictionary
- Requires PACS MSSQL connectivity to populate
- Non-fatal if PACS unreachable (dictionary stays empty)
- Currently gated by `TF_SKIP_DEV_SEEDERS` (same blunt flag)

---

## 8. Import Order (Locked)

```
1. Seed doctrine rules (3 seeders → 3 tables)
2. parcel lane (TopN=20000 chunks until exhaustion)
3. owner-wsdor lane (same chunking)
4. improvement lane (same chunking; PropertyVal lands in-band)
5. land lane (same chunking)
6. sales lane (TopN=20000 chunks; independent seed)
7. geometry lane (ArcGIS source, not MSSQL)
```

**Dependencies**:
- Parcel MUST run first (establishes spine for all other lanes)
- Owner needs parcel spine
- Improvement benefits from PropertyVal (landed in-band since V4) but non-blocking
- Land needs parcel spine
- Sales is independent but benefits from existing tf_parcel for canonical projection
- Geometry benefits from existing tf_parcel for APN crosswalk

---

## 9. Rollback Strategy

### 9.1 Stage-Level Resume (Preferred)

Each lane persists `LastCompletedStage` to `FullCorpusLaneResult`. On re-invoke with `LaneResultId` + `ResumeFromStage`, skips completed stages.

### 9.2 Per-Batch DELETE (Surgical)

Delete by `promotion_load_batch_id` in reverse FK order:
1. canonical_tf tables
2. truth_pacs tables
3. sync_bridge (source_xref, promotion_gate_result, load_batch)
4. legacy_pacs_raw tables (optional)

### 9.3 Full TRUNCATE (Nuclear)

`CanonicalDebugController.TruncateRawLanding()` — clears legacy_pacs_raw + sync metadata. Does NOT clear truth or canonical.

### 9.4 Recommended for WO-DATA-004B

Start with TopN=200 proof-of-life on parcel lane. If successful, scale to TopN=20000 chunks. If anything goes wrong, use per-batch DELETE to roll back the specific batch.

---

## 10. Blockers for WO-DATA-004B

| # | Blocker | Resolution |
|---|---------|------------|
| 1 | MSSQL not running | Start `tf-benton-wo004-sql` or `tf-mssql` compose container |
| 2 | Port mismatch (config=1433, container=11433) | Update local override OR remap container |
| 3 | Doctrine tables empty | Seed 3 doctrine tables before improvement/sales drains |
| 4 | TF_SKIP_DEV_SEEDERS coupling | Must solve doctrine seeding without enabling fabricated seeders |
| 5 | Local override targets wrong DB | Verify/update `appsettings.Development.local.json` DefaultConnection |
| 6 | TF_DEV_PACS_PASSWORD needed | Confirm env var set or local override has real password |

---

## 11. Verification Counts (Expected from Prior Runs)

From memory (SYNC-COMPLETE-3 seal at TopN=200):
- Parcel: ~200 rows landed, promoted, projected
- Sales: ~96 promoted truth rows (with doctrine rules)
- Improvement: 241 truth rows, 13,445 features projected
- Full corpus (89,247 Benton parcels): target for exhaustion drain

---

No mutations performed. No scripts executed. No drains triggered. No imports run. All analysis from source code reads, DB schema queries, and container inspection.
