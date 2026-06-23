# WO-DATA-004B-P2: First Controlled Drain — Execution Contract

**Date**: 2026-06-15
**Status**: PROPOSED — requires P1 merge + operator approval before execution
**Prerequisite**: WO-DATA-004B-P1 merged (flag split + prereq alignment)

---

## 1. Contract Summary

P2 performs the first controlled PACS drain into `terrafusion_dev_clean`. Scope is parcel lane only (proof-of-life at TopN=200, then full drain at TopN=20000 chunks).

**P2 does NOT drain**: owner, improvement, land, sales, or geometry. Those are P3+.

---

## 2. Pre-Drain Checklist

Every item must PASS before the first `POST /api/sync/doctrine/drain/parcel`.

| # | Check | How | Expected |
|---|-------|-----|----------|
| 1 | PG16 running | `docker ps` | terrafusion-postgres-dev UP, port 5432 |
| 2 | MSSQL running with PACS | `docker ps` | tf-mssql or tf-benton-wo004-sql UP |
| 3 | PACS port matches config | Compare container port to PacsConnection | Must match |
| 4 | DefaultConnection → terrafusion_dev_clean | Check appsettings or local override | CONFIRMED |
| 5 | terrafusion_dev_clean has 0 data rows | Run verification SQL §8 | All 0 |
| 6 | API starts cleanly | `GET /health` returns 200 | 200 |
| 7 | Doctrine tables seeded | `SELECT COUNT(*) FROM doctrine_tf.*` | universe=6, ratio≥1, sales_qual=3 |
| 8 | Fake dev seeder guard active | Console output shows `Dev seeders skip=True` | True |
| 9 | Anti-contamination check | Run verification SQL §9 | All 0 |
| 10 | PACS read-only connectivity | `GET /ops/pacs/ping` or equivalent | 200 |

---

## 3. API Startup Configuration

```powershell
# Environment
$env:TF_SKIP_DEV_SEEDERS = "true"
# TF_SKIP_DOCTRINE_SEEDERS intentionally NOT SET → doctrine seeds on startup
$env:ASPNETCORE_ENVIRONMENT = "Development"

# Start from worktree (uses committed config → terrafusion_dev_clean)
cd C:\Users\bsval\tf-wo-data-004b-p1\backend\src\TerraFusion.API
dotnet run
```

### Expected startup console output

```
[STARTUP] Dev seeders skip=True (arg=False, TF_SKIP_DEV_SEEDERS=true)
[STARTUP] GPT seeding skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
[DX-01] Dossier seed skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
```

Doctrine hosted services should log seeding activity (6 universe rules, etc.) without being blocked.

---

## 4. Phase 1: Parcel Proof-of-Life

### Step 1: Fire single chunk (TopN=200)

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

### Step 2: Verify results

```sql
SELECT COUNT(*) FROM legacy_pacs_raw.property;      -- expect ~200
SELECT COUNT(*) FROM truth_pacs.parcel_spine;        -- expect ~200
SELECT COUNT(*) FROM canonical_tf.tf_parcel;         -- expect ~200
SELECT COUNT(*) FROM sync_bridge.source_xref
  WHERE "TfEntityType" = 'parcel';                   -- expect ~200
SELECT "Status", "OperatorName", "RowsLanded", "RowsPromoted"
  FROM sync_bridge.load_batch
  ORDER BY "CreatedAt" DESC LIMIT 5;
```

### Step 3: Gate decision

- All counts > 0 AND batch status = COMPLETED → proceed to Phase 2
- Any failure → investigate, roll back, fix, retry
- RowsPromoted = 0 → check PACS connectivity and doctrine state

---

## 5. Phase 2: Parcel Full Drain

### Strategy: TopN=20000 chunks to exhaustion

```bash
# Chunk 1
curl -X POST http://localhost:5000/api/sync/doctrine/drain/parcel \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"claude-chunk-parcel-v2","TopN":20000,"FullCorpus":false}'

# Repeat with v3, v4, v5... until RowsPromoted < 20000
```

### Expected chunks

89,247 parcels ÷ 20,000 ≈ 5 chunks (last chunk partial)

### Between chunks

- Check backend memory (restart if > 4 GB)
- Run anti-contamination SQL §9
- Verify batch status is COMPLETED before firing next

### Exhaustion verification

```sql
SELECT COUNT(*) FROM truth_pacs.parcel_spine;  -- expect ~89,247
SELECT COUNT(*) FROM canonical_tf.tf_parcel;   -- expect ~89,247
```

---

## 6. P2 Scope Boundary

### P2 DOES

- Resolve MSSQL container + verify PACS connectivity
- Start API with `TF_SKIP_DEV_SEEDERS=true` (doctrine seeds automatically)
- Verify doctrine tables populated
- Run parcel proof-of-life (TopN=200)
- Scale parcel to full drain (TopN=20000 chunks)
- Write evidence artifact for parcel lane
- Verify clean DB state (no contamination)

### P2 DOES NOT

- Drain owner, improvement, land, sales, or geometry
- Modify connection strings
- Create migrations
- Change packages/dependencies
- Touch native PG17

---

## 7. Rollback Contract

### Per-batch rollback

Delete by `PromotionLoadBatchId` in reverse FK order:
1. `canonical_tf.tf_parcel`
2. `truth_pacs.parcel_spine`
3. `sync_bridge.source_xref` WHERE TfEntityType='parcel'
4. `sync_bridge.promotion_gate_result`
5. `sync_bridge.load_batch`
6. `legacy_pacs_raw.property` (optional)

### Full reset (nuclear)

TRUNCATE all 3 layers + sync_bridge. Returns to WO-DATA-002B baseline.

---

## 8. Pre-Import Verification SQL

```sql
-- Must ALL return 0 before any drain
SELECT 'Properties' as tbl, COUNT(*) FROM public."Properties"
UNION ALL SELECT 'GovernmentUsers', COUNT(*) FROM public."GovernmentUsers"
UNION ALL SELECT 'SaleRecords', COUNT(*) FROM public."SaleRecords"
UNION ALL SELECT 'Counties', COUNT(*) FROM public."Counties"
UNION ALL SELECT 'parcel_spine', COUNT(*) FROM truth_pacs.parcel_spine
UNION ALL SELECT 'source_xref', COUNT(*) FROM sync_bridge.source_xref
UNION ALL SELECT 'load_batch', COUNT(*) FROM sync_bridge.load_batch;
```

---

## 9. Anti-Contamination SQL

```sql
-- Must return 0 after EVERY operation
SELECT COUNT(*) FROM public."Properties"
  WHERE "ParcelNumber" LIKE 'B-Reval%'
     OR "Address" LIKE '106 Oakmont%'
     OR "Address" LIKE '123 Main%'
     OR "Address" LIKE '456 Columbia%'
     OR "Address" LIKE '789 Wine Country%';

SELECT COUNT(*) FROM public."GovernmentUsers"
  WHERE "Email" = 'admin@terrafusionmarket.com';

SELECT COUNT(*) FROM public."SaleRecords";
```

---

## 10. Evidence Artifact

After parcel lane exhaustion, write:
```
evidence/{date}-benton-parcel-drain-verification.md
```

Contents:
- Per-layer row counts (legacy_pacs_raw.property, truth_pacs.parcel_spine, canonical_tf.tf_parcel)
- Batch summary (count, all COMPLETED, total RowsPromoted)
- Source_xref count matches canonical count
- Anti-contamination check PASS
- Comparison to PACS source count (~89,247)

---

No mutations performed. Execution contract only.
