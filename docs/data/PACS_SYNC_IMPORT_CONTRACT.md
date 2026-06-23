# WO-DATA-004A: PACS/Sync Import Contract

**Date**: 2026-06-15
**Status**: LOCKED — binding contract for WO-DATA-004B execution
**Prerequisite**: PACS_SYNC_PREFLIGHT.md (all checks PASS or documented)

---

## 1. Contract Summary

This document defines the exact contract for importing real Harris PACS data into `terrafusion_dev_clean` via the Sync drain pipeline. WO-DATA-004B MUST NOT deviate from this contract without operator approval.

**Source**: Harris PACS 9.0 (MSSQL — pacs_oltp / pacs_golive)
**Target**: terrafusion_dev_clean (PG16 — Docker port 5432)
**Method**: Per-lane drain endpoints (`POST /api/sync/doctrine/drain/{lane}`)
**Prohibited**: `--seed-pacs` CLI, `FullCorpus=true`, any fabricated seeder

---

## 2. Data Flow Contract

```
Harris PACS (MSSQL)
    │
    ▼
POST /api/sync/doctrine/drain/{lane}  (TopN ≤ 20000, chunked)
    │
    ├─ Stage S1: Land raw rows into legacy_pacs_raw.*
    ├─ Stage S2: Promote truth rows into truth_pacs.*
    ├─ Stage S3: Project canonical rows into canonical_tf.*
    └─ Stage S4: Write lineage into sync_bridge.source_xref
```

### 2.1 Per-Layer Tables

| Layer | Schema | Tables | Content |
|-------|--------|--------|---------|
| Raw Landing | legacy_pacs_raw | 11 tables (account, imprv, imprv_attr, imprv_detail, land_detail, owner, prop_supp_assoc, property, property_val, sale, wash_prop_owner_val) | Exact mirror of PACS source rows |
| Truth | truth_pacs | 6 tables (parcel_spine, imprv_current, land_current, owner_current, sale, wash_prop_owner_val) | Validated, classified, doctrine-applied |
| Canonical | canonical_tf | 16 tables (tf_parcel, tf_sale, tf_owner, tf_parcel_owner_link, tf_assessment_wsdor, tf_improvement, tf_improvement_feature, tf_land, + 8 dict tables) | TF-native entities with CountyId isolation |
| Bridge | sync_bridge | source_xref, load_batch, promotion_gate_result | Lineage + batch tracking |

### 2.2 Identity Contract

Every canonical row MUST have:
- A TF-native GUID primary key
- A `CountyId` column (sovereign county isolation)
- A corresponding `sync_bridge.source_xref` row linking back to PACS source key
- A `PromotionLoadBatchId` tracing to the drain invocation

---

## 3. Lane Execution Contract

### 3.1 Lane Order (Mandatory)

```
1. parcel         — establishes spine (MUST be first)
2. owner-wsdor    — needs parcel spine
3. improvement    — needs parcel spine; PropertyVal lands in-band
4. land           — needs parcel spine
5. sales          — independent seed; benefits from existing tf_parcel
6. geometry       — ArcGIS source; benefits from existing tf_parcel
```

### 3.2 Per-Lane Parameters

| Lane | TopN | FullCorpus | Default TopN if omitted | Exhaustion Signal |
|------|------|-----------|-------------------------|-------------------|
| parcel | ≤ 20000 | false | 200 | RowsPromoted < TopN |
| owner-wsdor | ≤ 20000 | false | 200 | RowsPromoted < TopN |
| improvement | ≤ 20000 | false | 200 | RowsPromoted < TopN |
| land | ≤ 20000 | false | 200 | RowsPromoted < TopN |
| sales | ≤ 20000 | false | 500 | RowsPromoted < TopN |
| geometry | ≤ 20000 | false | 200 | RowsPromoted < TopN |

### 3.3 Operator Tag Contract

Every drain call MUST include `OperatorName` following the convention:
```
{agent}-chunk-{lane}-v{N}
```
Example: `claude-chunk-parcel-v1`, `claude-chunk-improvement-v3`

No overlapping IN_PROGRESS batches with the same operator-family prefix.

---

## 4. Prerequisite Contract

### 4.1 Before ANY Drain

| # | Prerequisite | How to Verify | Blocker? |
|---|-------------|---------------|----------|
| 1 | PG16 running on port 5432 | `docker ps` shows terrafusion-postgres-dev | YES |
| 2 | MSSQL running with PACS databases | Port 1433 or 11433 reachable with pacs_oltp | YES |
| 3 | terrafusion_dev_clean has 0 data rows | Run verification SQL from §7 | YES |
| 4 | Connection strings correct | PacsConnection points to live MSSQL with real password | YES |
| 5 | DefaultConnection targets terrafusion_dev_clean | Check appsettings.Development.local.json | YES |
| 6 | API starts cleanly | `GET /health` returns 200 | YES |

### 4.2 Before Improvement/Sales Drains

| # | Prerequisite | How to Verify |
|---|-------------|---------------|
| 7 | Doctrine rules seeded (3 tables) | `SELECT COUNT(*) FROM doctrine_tf.tf_doctrine_property_universe` returns 6 |
| 8 | Parcel lane exhausted | truth_pacs.parcel_spine has rows matching PACS parcel count |

### 4.3 Doctrine Seeding Strategy

**Problem**: `TF_SKIP_DEV_SEEDERS` gates both fabricated seeders AND doctrine hosted services.

**Options for WO-DATA-004B**:

| Option | Method | Risk |
|--------|--------|------|
| A | Start API WITHOUT TF_SKIP_DEV_SEEDERS, let doctrine seed, then restart WITH flag | Fabricated seeders also run (125+ fake rows) |
| B | Start API WITH flag, call doctrine seed endpoints manually | Requires identifying/calling manual seed endpoints |
| C | Split the flag first (separate WO) | Correct but requires code change |
| D | Start WITHOUT flag against an EMPTY terrafusion_dev_clean, accept that fabricated rows land, then DELETE them manually before running drains | Messy but workable |

**Recommended**: Option B if manual seed endpoints exist; Option A with immediate verification/cleanup if not.

---

## 5. Connection String Contract

### 5.1 Required for WO-DATA-004B

| Name | Must Point To | Port |
|------|--------------|------|
| DefaultConnection | terrafusion_dev_clean (PG16) | 5432 |
| PacsConnection | pacs_oltp (MSSQL) | 1433 or 11433 (match running container) |
| PacsSalesConnection | pacs_golive (MSSQL) | same port as PacsConnection |

### 5.2 Local Override Warning

`appsettings.Development.local.json` in the main checkout targets `terrafusion` (not `terrafusion_dev_clean`). Before WO-DATA-004B:
- Either update the local override, OR
- Run the API from the worktree (which has no local override, so committed config applies)

---

## 6. Safety Circuit Breakers

### 6.1 Chunk-Level Safety

From `docs/sync/chunk-strategy.md`:
- `fire-next-chunk.mjs` refuses to fire if `/health` unreachable
- `fire-next-chunk.mjs` refuses if IN_PROGRESS batch exists with same operator prefix
- `chunk-watcher.mjs` exits on deadline (default 180 min) without auto-firing next

### 6.2 Stage-Level Resume

Each lane persists checkpoint to `FullCorpusLaneResult`:
- On failure at stage N, pass `LaneResultId` + `ResumeFromStage` on next invoke
- Completed stages are skipped; batch IDs reloaded from persisted JSON

### 6.3 Backend Memory

Restart backend between chunks if private memory exceeds 4 GB.

---

## 7. Verification Contract

### 7.1 Pre-Import Verification SQL

```sql
-- MUST return 0 for all rows before any drain
SELECT 'Properties' as tbl, COUNT(*) FROM public."Properties"
UNION ALL SELECT 'GovernmentUsers', COUNT(*) FROM public."GovernmentUsers"
UNION ALL SELECT 'SaleRecords', COUNT(*) FROM public."SaleRecords"
UNION ALL SELECT 'Counties', COUNT(*) FROM public."Counties"
UNION ALL SELECT 'parcel_spine', COUNT(*) FROM truth_pacs.parcel_spine
UNION ALL SELECT 'source_xref', COUNT(*) FROM sync_bridge.source_xref
UNION ALL SELECT 'load_batch', COUNT(*) FROM sync_bridge.load_batch;
```

### 7.2 Post-Drain Verification (Per Lane)

**After parcel drain**:
```sql
SELECT COUNT(*) FROM legacy_pacs_raw.property;       -- raw landed
SELECT COUNT(*) FROM truth_pacs.parcel_spine;          -- truth promoted
SELECT COUNT(*) FROM canonical_tf.tf_parcel;           -- canonical projected
SELECT COUNT(*) FROM sync_bridge.source_xref
  WHERE "TfEntityType" = 'parcel';                     -- lineage exists
```

**After improvement drain**:
```sql
SELECT COUNT(*) FROM truth_pacs.imprv_current;
SELECT COUNT(*) FROM canonical_tf.tf_improvement;
SELECT COUNT(*) FROM canonical_tf.tf_improvement_feature;
-- Check universe classification:
SELECT "UniverseCode", COUNT(*) FROM truth_pacs.imprv_current
  GROUP BY "UniverseCode";
```

**After sales drain**:
```sql
SELECT COUNT(*) FROM truth_pacs.sale;
SELECT COUNT(*) FROM canonical_tf.tf_sale;
```

### 7.3 Expected Counts (from Prior TopN=200 Runs)

| Surface | Prior TopN=200 Result | Full Corpus Target |
|---------|----------------------|-------------------|
| Parcel spine | ~200 | ~89,247 |
| Sales truth | ~96 (with doctrine) | TBD |
| Improvement truth | ~241 | TBD |
| Improvement features | ~13,445 | TBD |

### 7.4 Anti-Contamination Verification

After ANY drain, verify NO fabricated data leaked:
```sql
-- Must return 0
SELECT COUNT(*) FROM public."Properties"
  WHERE "ParcelNumber" LIKE 'B-Reval%' OR "Address" LIKE '106 Oakmont%';

SELECT COUNT(*) FROM public."GovernmentUsers"
  WHERE "Email" = 'admin@terrafusionmarket.com';
```

---

## 8. Rollback Contract

### 8.1 Per-Batch Rollback (Preferred)

Delete by `promotion_load_batch_id` in this order:
1. `canonical_tf.*` (FK integrity)
2. `truth_pacs.*`
3. `sync_bridge.source_xref`
4. `sync_bridge.promotion_gate_result`
5. `sync_bridge.load_batch`
6. `legacy_pacs_raw.*` (optional)

### 8.2 Full Reset (Nuclear)

If everything goes wrong, TRUNCATE all 3 layers + sync_bridge. This returns to the WO-DATA-002B baseline (schema-only, 0 data rows).

### 8.3 No Rollback Needed For

- Doctrine rules (idempotent, can be re-seeded)
- In-memory dictionary (volatile, refreshed on restart)

---

## 9. Forbidden Operations

During WO-DATA-004B execution, these are NEVER allowed:

| Operation | Why |
|-----------|-----|
| `--seed-pacs` CLI | Uncontrolled full ETL, not per-lane |
| `FullCorpus=true` | Proven to hang on improvement lane |
| DevPropertySeeder | Fabricated data |
| SaleRecordSeeder | Fabricated data |
| DatabaseSeeder | Fabricated data |
| GPTConfigurationSeeder | Fabricated config data |
| Any `INSERT/UPDATE/DELETE` against production | Out of scope |
| `docker-compose.yml` (main backend compose) | Uses wrong DB name |
| Direct SQL INSERT into terrafusion_dev_clean | Bypass Sync pipeline |

---

## 10. WO-DATA-004B Scope Definition

WO-DATA-004B is the first controlled import slice. Its scope:

1. Resolve MSSQL container (start `tf-benton-wo004-sql` or `tf-mssql`)
2. Verify PACS connectivity (read-only ping)
3. Seed doctrine rules (3 tables)
4. Run parcel lane proof-of-life (TopN=200)
5. Verify parcel data landed correctly across all 3 layers
6. If proof-of-life passes, scale to TopN=20000 chunked drain on parcel lane
7. Move to next lane when parcel exhausted
8. Write evidence artifact for each completed lane

**WO-DATA-004B stops when**: All 6 lanes are exhausted and verified against PACS source counts.

---

No mutations performed. Contract document only.
