# WO-DATA-004A: PACS/Sync Execution Plan

**Date**: 2026-06-15
**Status**: PROPOSED — operator approval required before WO-DATA-004B begins
**Prerequisite**: PACS_SYNC_PREFLIGHT.md + PACS_SYNC_IMPORT_CONTRACT.md

---

## 1. Execution Overview

WO-DATA-004B will import real Harris PACS data into `terrafusion_dev_clean` using the proven Sync drain pipeline. This plan defines the exact execution steps.

```
Phase 0: Infrastructure Setup (resolve blockers)
Phase 1: Doctrine Seeding (populate reference rules)
Phase 2: Parcel Proof-of-Life (TopN=200, single chunk)
Phase 3: Parcel Full Drain (TopN=20000 chunks to exhaustion)
Phase 4: Remaining Lanes (owner → improvement → land → sales → geometry)
Phase 5: Verification + Evidence Seal
```

---

## 2. Phase 0: Infrastructure Setup

### Step 0.1: Start MSSQL Container

**Option A** (reuse existing container):
```powershell
docker start tf-benton-wo004-sql
# Verify: maps to port 11433
# Update PacsConnection to Server=localhost,11433
```

**Option B** (use compose-managed container):
```powershell
$env:TF_PACS_SA_PASSWORD = "<sa-password>"
docker compose -f backend/docker-compose.pacs.yml up -d
# Verify: tf-mssql on port 1433 (matches committed config)
```

**Operator decision needed**: Which container and which port?

### Step 0.2: Verify PACS Connectivity

```bash
# Read-only probe
curl http://localhost:5000/ops/pacs/ping
# OR
curl http://localhost:5000/ops/pacs/proof
```

### Step 0.3: Verify Connection Strings

Ensure `appsettings.Development.local.json` has:
- `DefaultConnection` → terrafusion_dev_clean (port 5432)
- `PacsConnection` → pacs_oltp (port matching running container)
- `PacsSalesConnection` → pacs_golive (same port)

### Step 0.4: Start API

```bash
TF_SKIP_DEV_SEEDERS=true dotnet run --project backend/src/TerraFusion.API
# Verify: GET /health returns 200
```

---

## 3. Phase 1: Doctrine Seeding

### Problem Statement

`TF_SKIP_DEV_SEEDERS=true` blocks doctrine hosted services. Three doctrine tables must be populated before improvement/sales drains produce correct results.

### Recommended Approach

**If manual seed endpoints exist** (check for `/api/sync/doctrine/policy/*/seed`):
```bash
# Seed each doctrine table individually
POST /api/sync/doctrine/policy/universe/seed
POST /api/sync/doctrine/policy/ratio/seed
POST /api/sync/doctrine/policy/sales-qualification/seed
```

**If manual endpoints don't exist** — start API once WITHOUT TF_SKIP_DEV_SEEDERS:
```bash
# ONE-TIME: let all hosted services run (including fabricated seeders)
dotnet run --project backend/src/TerraFusion.API
# Wait for startup to complete, then verify:
```

Then verify and clean up:
```sql
-- Verify doctrine seeded
SELECT COUNT(*) FROM doctrine_tf.tf_doctrine_property_universe;  -- expect 6
SELECT COUNT(*) FROM doctrine_tf.tf_doctrine_ratio_policy;       -- expect ~3
SELECT COUNT(*) FROM doctrine_tf.tf_doctrine_sales_qualification_codes; -- expect 3

-- Clean up fabricated data if dev seeders ran
DELETE FROM public."SaleRecords";
DELETE FROM public."GovernmentUsers" WHERE "Email" = 'admin@terrafusionmarket.com';
DELETE FROM public."Properties" WHERE "ParcelNumber" LIKE 'B-Reval%'
  OR "Address" LIKE '106 Oakmont%' OR "Address" LIKE '123 Main%'
  OR "Address" LIKE '456 Columbia%' OR "Address" LIKE '789 Wine Country%';
DELETE FROM public."Counties" WHERE "CountyId" = '19190019-1919-1919-1919-191919191919';

-- Verify cleanup
SELECT COUNT(*) FROM public."Properties";       -- must be 0
SELECT COUNT(*) FROM public."GovernmentUsers";   -- must be 0
SELECT COUNT(*) FROM public."SaleRecords";       -- must be 0
```

Then restart with `TF_SKIP_DEV_SEEDERS=true` for the rest of the session.

### Verification

```sql
SELECT "UniverseCode", "IsActive" FROM doctrine_tf.tf_doctrine_property_universe;
-- Expect: AG_CURRENT_USE, CONVERSION_LEGACY, MOBILE_HOME, PERSONAL_PROPERTY,
--         REAL_COMMERCIAL, REAL_RESIDENTIAL (6 rows, all active)
```

---

## 4. Phase 2: Parcel Proof-of-Life

### Step 2.1: Fire Single Chunk

```bash
curl -X POST http://localhost:5000/api/sync/doctrine/drain/parcel \
  -H "Content-Type: application/json" \
  -d '{
    "OperatorName": "claude-chunk-parcel-v1",
    "WorkingYear": 2026,
    "FullCorpus": false,
    "TopN": 200
  }'
```

### Step 2.2: Verify Results

```sql
-- Raw landing
SELECT COUNT(*) FROM legacy_pacs_raw.property;  -- expect ~200

-- Truth
SELECT COUNT(*) FROM truth_pacs.parcel_spine;   -- expect ~200

-- Canonical
SELECT COUNT(*) FROM canonical_tf.tf_parcel;    -- expect ~200

-- Lineage
SELECT COUNT(*) FROM sync_bridge.source_xref
  WHERE "TfEntityType" = 'parcel';              -- expect ~200

-- Batch status
SELECT "Status", "OperatorName", "RowsLanded", "RowsPromoted"
  FROM sync_bridge.load_batch
  ORDER BY "CreatedAt" DESC LIMIT 5;
```

### Step 2.3: Gate

- If all counts > 0 and batch status = COMPLETED → proceed to Phase 3
- If any failure → investigate, roll back batch, fix, retry
- If RowsPromoted = 0 → check PACS connectivity and doctrine state

---

## 5. Phase 3: Parcel Full Drain

### Strategy: TopN=20000 Chunks to Exhaustion

```bash
# Chunk 1
curl -X POST http://localhost:5000/api/sync/doctrine/drain/parcel \
  -d '{"OperatorName":"claude-chunk-parcel-v2","TopN":20000,"FullCorpus":false}'

# Monitor with chunk-watcher.mjs (if available)
# Or poll: SELECT COUNT(*) FROM truth_pacs.parcel_spine;

# Repeat with incrementing version until exhaustion:
# claude-chunk-parcel-v3, v4, v5...
# Exhaustion: RowsPromoted < 20000
```

### Expected Chunks

89,247 parcels ÷ 20,000 = ~5 chunks (last chunk partial)

### Verification After Exhaustion

```sql
SELECT COUNT(*) FROM truth_pacs.parcel_spine;  -- expect ~89,247
SELECT COUNT(*) FROM canonical_tf.tf_parcel;   -- expect ~89,247
```

### Backend Memory Check

Between chunks, check backend memory. Restart if > 4 GB.

---

## 6. Phase 4: Remaining Lanes

Execute in order. Same TopN=20000 chunked pattern for each.

### 4A: Owner-WSDOR

```bash
curl -X POST http://localhost:5000/api/sync/doctrine/drain/owner-wsdor \
  -d '{"OperatorName":"claude-chunk-owner-v1","TopN":20000,"FullCorpus":false}'
```

Verify: `truth_pacs.owner_current`, `canonical_tf.tf_owner`, `canonical_tf.tf_parcel_owner_link`

### 4B: Improvement

```bash
curl -X POST http://localhost:5000/api/sync/doctrine/drain/improvement \
  -d '{"OperatorName":"claude-chunk-improvement-v1","TopN":20000,"FullCorpus":false}'
```

Verify: `truth_pacs.imprv_current`, `canonical_tf.tf_improvement`, `canonical_tf.tf_improvement_feature`

Check universe classification:
```sql
SELECT "UniverseCode", COUNT(*) FROM truth_pacs.imprv_current GROUP BY "UniverseCode";
-- Expect: REAL_RESIDENTIAL (majority), REAL_COMMERCIAL, AG_CURRENT_USE, possibly UNKNOWN
```

### 4C: Land

```bash
curl -X POST http://localhost:5000/api/sync/doctrine/drain/land \
  -d '{"OperatorName":"claude-chunk-land-v1","TopN":20000,"FullCorpus":false}'
```

Verify: `truth_pacs.land_current`, `canonical_tf.tf_land`

### 4D: Sales

```bash
curl -X POST http://localhost:5000/api/sync/doctrine/drain/sales \
  -d '{"OperatorName":"claude-chunk-sales-v1","TopN":20000,"FullCorpus":false}'
```

Verify: `truth_pacs.sale`, `canonical_tf.tf_sale`

### 4E: Geometry

```bash
curl -X POST http://localhost:5000/api/sync/doctrine/drain/geometry \
  -d '{"OperatorName":"claude-chunk-geometry-v1","TopN":20000,"FullCorpus":false}'
```

Verify: canonical geometry table

**Note**: Geometry lane reads from ArcGIS, not MSSQL. Requires separate ArcGIS connectivity.

---

## 7. Phase 5: Verification + Evidence Seal

### 7.1 Full Corpus Verification SQL

```sql
-- Pipeline counts (all 3 layers)
SELECT 'legacy_pacs_raw.property' as surface, COUNT(*) FROM legacy_pacs_raw.property
UNION ALL SELECT 'truth_pacs.parcel_spine', COUNT(*) FROM truth_pacs.parcel_spine
UNION ALL SELECT 'canonical_tf.tf_parcel', COUNT(*) FROM canonical_tf.tf_parcel
UNION ALL SELECT 'truth_pacs.owner_current', COUNT(*) FROM truth_pacs.owner_current
UNION ALL SELECT 'canonical_tf.tf_owner', COUNT(*) FROM canonical_tf.tf_owner
UNION ALL SELECT 'truth_pacs.imprv_current', COUNT(*) FROM truth_pacs.imprv_current
UNION ALL SELECT 'canonical_tf.tf_improvement', COUNT(*) FROM canonical_tf.tf_improvement
UNION ALL SELECT 'canonical_tf.tf_improvement_feature', COUNT(*) FROM canonical_tf.tf_improvement_feature
UNION ALL SELECT 'truth_pacs.land_current', COUNT(*) FROM truth_pacs.land_current
UNION ALL SELECT 'canonical_tf.tf_land', COUNT(*) FROM canonical_tf.tf_land
UNION ALL SELECT 'truth_pacs.sale', COUNT(*) FROM truth_pacs.sale
UNION ALL SELECT 'canonical_tf.tf_sale', COUNT(*) FROM canonical_tf.tf_sale
UNION ALL SELECT 'sync_bridge.source_xref', COUNT(*) FROM sync_bridge.source_xref
UNION ALL SELECT 'sync_bridge.load_batch', COUNT(*) FROM sync_bridge.load_batch;
```

### 7.2 Anti-Contamination Check

```sql
-- Must ALL return 0
SELECT COUNT(*) FROM public."Properties"
  WHERE "ParcelNumber" LIKE 'B-Reval%';
SELECT COUNT(*) FROM public."GovernmentUsers"
  WHERE "Email" = 'admin@terrafusionmarket.com';
SELECT COUNT(*) FROM public."SaleRecords"
  WHERE "ParcelId" LIKE 'B-Reval%';
```

### 7.3 Lineage Integrity Check

```sql
-- Every canonical entity has a source_xref entry
SELECT 'tf_parcel' as entity,
  (SELECT COUNT(*) FROM canonical_tf.tf_parcel) as canonical_count,
  (SELECT COUNT(*) FROM sync_bridge.source_xref WHERE "TfEntityType" = 'parcel') as xref_count;
-- canonical_count should equal xref_count
```

### 7.4 Evidence Artifact

Write `evidence/{date}-benton-full-corpus-verification.md` with:
- Per-lane row counts across all 3 layers
- Universe distribution for improvements
- Batch status summary
- Any quarantine counts from `legacy_tf_unproven`
- Comparison to PACS source counts

---

## 8. Operator Decision Points

| Decision | When | Options |
|----------|------|---------|
| MSSQL container choice | Phase 0 | tf-benton-wo004-sql (port 11433) vs tf-mssql compose (port 1433) |
| Doctrine seeding method | Phase 1 | Manual endpoints vs one-time unguarded startup |
| Continue after proof-of-life | Phase 2 gate | Proceed to full drain vs investigate issues |
| Backend restart cadence | Between chunks | Auto (>4GB) vs manual |
| Geometry source | Phase 4E | ArcGIS REST (requires separate connectivity check) |
| Full corpus seal | Phase 5 | Accept as complete vs re-drain specific lanes |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Improvement lane hangs at corpus scale | TopN=20000 chunks (never FullCorpus=true) |
| Backend OOM | Restart between chunks if >4GB |
| PACS connectivity loss mid-drain | Resume from checkpoint (LaneResultId + ResumeFromStage) |
| Fabricated data contamination | Pre/post verification SQL; TF_SKIP_DEV_SEEDERS=true |
| Wrong DB target | Verify DefaultConnection in local override before starting |
| Overlapping drains | Operator tag convention + fire-next-chunk.mjs guard |

---

## 10. Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 0: Setup | 15 min | Start container, verify connectivity |
| Phase 1: Doctrine | 5 min | Seed 3 tables |
| Phase 2: Proof-of-life | 5 min | Single TopN=200 chunk |
| Phase 3: Parcel full | ~30-60 min | ~5 chunks × 5-10 min each |
| Phase 4A: Owner | ~30-60 min | Similar to parcel |
| Phase 4B: Improvement | ~60-120 min | Largest lane (attribute fan-out) |
| Phase 4C: Land | ~20-30 min | Smaller lane |
| Phase 4D: Sales | ~20-30 min | Smaller lane |
| Phase 4E: Geometry | TBD | ArcGIS dependency |
| Phase 5: Verification | 15 min | SQL queries + evidence artifact |

**Total estimated**: 3-6 hours for full corpus (all 6 lanes)

---

No mutations performed. Execution plan only.
