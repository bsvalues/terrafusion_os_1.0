# WO-DATA-004B-FIX3 — Controlled Parcel Drain Results

**Work Order:** WO-DATA-004B-FIX3
**Date:** 2026-06-17 / 2026-06-18
**Status:** COMPLETE — drain succeeded, evidence captured, parcel lane proven

---

## Mission

Run one tightly bounded controlled parcel pipeline drain:
- TopN = 100
- Verified PACS source: `pacs_oltp_verify` (SQL Server 2022, port 21433, D: copy only)
- Target: `terrafusion_dev_clean` (PostgreSQL Docker PG16)
- Parcel endpoint only

---

## DRAIN RESULT

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| Lane | parcel |
| Endpoint | `POST /api/sync/doctrine/drain/parcel` |
| Payload | `{"OperatorName":"claude-fix3-parcel-current-v1","WorkingYear":2026,"FullCorpus":false,"TopN":100}` |
| TopN | 100 |
| Duration | 9.41 sec |
| Status | Succeeded |
| BatchIds | e94d6de9, e66aafdc, 5a6c8328, fb5b0b83 (4 batches) |

### Pipeline Counts

| Stage | Count |
|---|---|
| Rows Landed (S1 → legacy_pacs_raw) | **100** |
| Rows Promoted to Truth (S2 → truth_pacs.parcel_spine) | **100** |
| Rows Canonicalized (S3 → canonical_tf.tf_parcel) | **100** |
| Rows Quarantined (this lane) | 0 |

### Gate Summary

| Status | Count |
|---|---|
| PASS | 17 |
| FAIL | 0 |

No gate failures. Quarantine delta: 0 before → 0 after → delta 0.

---

## Copy Evidence — COMPLETE (Re-copy, 2026-06-17)

### D: Copy Completion (COPY_COMPLETE.txt)

```
PACS MDF COPY COMPLETE
======================
COPY_CONTAINER:     pacs-mdf-copy
EXIT_CODE:          0
SOURCE_VOLUME:      tf_mssql_data
SOURCE_MDF_SIZE:    572901883904 bytes
DEST_MDF_SIZE:      572901883904 bytes -- EXACT MATCH
DEST_MDF_WRITTEN:   2026-06-17 18:26:35 local
LDF_SIZE:           1073618944 bytes -- EXACT MATCH
D_FREE_SPACE:       426055708672 bytes (396.8 GB)
SOURCE_UNCHANGED:   YES -- 572901883904 bytes confirmed via docker stat
RESTART_COUNT:      0
COPY_DURATION:      ~6h 39m (started ~18:47 UTC, finished ~01:26 UTC)
```

### Prior D: State at Invalidation (2026-06-17 ~11:32 AM local)

| Item | Value |
|---|---|
| pacs_oltp.mdf on D: | 92,185,821,184 bytes (85.85 GB) — PARTIAL, OVERWRITTEN |
| pacs_oltp_log.ldf on D: | 1,073,618,944 bytes — intact, matches target |
| tf_mssql_data source volume | UNCHANGED — only mounted read-only |

Root cause: `pacs-mdf-copy` container restarted when Docker Desktop restarted (on-failure policy), started re-copying from byte 0, overwriting the previously-completed 572 GB copy. Stopped at 85.85 GB. Re-copy configured as one-shot (`cp` command, not rsync), no restart policy.

---

## Preflight — COMPLETE

### 1. PACS Vintage Battery (pacs_oltp_verify, 2026-06-18)

All queries run against `pacs_oltp_verify` (SQL Server 2022, port 21433, D: copy).

**prop_supp_assoc — full universe:**

```sql
SELECT COUNT(*) AS total_rows, MIN(owner_tax_yr) AS min_yr, MAX(owner_tax_yr) AS max_yr
FROM prop_supp_assoc
```

| total_rows | min_yr | max_yr |
|---|---|---|
| 2,493,078 | 1968 | 2026 |

**Critical gate — qualifying rows (sup_num=0, year>=2018):**

```sql
SELECT COUNT(*) AS qualifying_rows, MAX(owner_tax_yr) AS max_yr
FROM prop_supp_assoc
WHERE sup_num = 0 AND owner_tax_yr >= 2018
```

| qualifying_rows | max_yr |
|---|---|
| **774,728** | **2026** |

`max_owner_tax_yr = 2026` ✅ — Current PACS confirmed.

**sup_num distribution for year>=2018:**

`sup_num=0`: 774,728 (primary qualification predicate)
`sup_num=1`: 647 | `sup_num=2`: 177 | `sup_num=3`: 128 | `sup_num=4`: 181 | `sup_num=5`: 648 | (282 distinct sup_num values with year>=2018 in source)

**Candidate for year>=2017 (for discrepancy investigation):**

```sql
SELECT COUNT(*) FROM prop_supp_assoc WHERE owner_tax_yr >= 2017 AND sup_num = 0
-- Result: 852,591
```

**property table:**

```sql
SELECT COUNT(*) AS prop_count, MIN(prop_create_dt) AS min_dt, MAX(prop_create_dt) AS max_dt FROM property
-- Result: 128,949 rows, min 1900-01-01, max 2026-01-14
```

**sale table:**

```sql
SELECT COUNT(*) AS sale_cnt, MIN(sl_dt) AS min_sl, MAX(sl_dt) AS max_sl FROM sale
-- Result: 425,251 rows, min 1899-12-31, max 2026-01-13
SELECT COUNT(*) AS post2018_sales FROM sale WHERE sl_dt >= '2018-01-01'
-- Result: 62,042
```

**owner table (year>=2018):**

```sql
SELECT COUNT(*) AS owner_cnt, MIN(owner_tax_yr), MAX(owner_tax_yr) FROM owner WHERE owner_tax_yr >= 2018
-- Result: 855,296 rows, min 2018, max 2026
```

### 2. Count Discrepancy — 809,396 vs 774,728

**STATUS: FORMALLY DOCUMENTED AS UNVERIFIED**

The prior evidence doc recorded "Qualifying rows (sup_num=0, year≥2018): **809,396**" under "Preflight Results (from initial FIX3 attempt)" and labeled it "verified (from FIX2B, unchanged)."

Tested candidate predicates against current `pacs_oltp_verify`:

| Predicate | Count |
|---|---|
| `sup_num=0, year>=2018` | 774,728 |
| `sup_num=0, year>=2017` | 852,591 |
| `owner year>=2018` | 855,296 |
| 809,396 | **not reproducible from any tested predicate** |

**Conclusion:** The 809,396 figure cannot be verified against current `pacs_oltp_verify` with any standard predicate. Its SQL source in the prior session is unknown — it may have been run against a different attached DB, a different schema, or with a different predicate. FIX3 uses **774,728** as the authoritative qualifying row count from the verified D: copy. This is the correct number.

### 3. API Runtime Config

| Setting | Value | Status |
|---|---|---|
| DefaultConnection | `Host=127.0.0.1;Database=terrafusion_dev_clean;...;Port=5432` | ✅ Correct |
| PacsConnection | `Server=localhost,21433;Database=pacs_oltp_verify;...` | ✅ Aligned to verified source |
| TF_SKIP_DEV_SEEDERS | `true` | ✅ Dev seeders suppressed |
| ASPNETCORE_ENVIRONMENT | `Development` | ✅ |
| API port | 5046 | ✅ |

Confirmed in startup log: `[STARTUP] Dev seeders skip=True (arg=False, TF_SKIP_DEV_SEEDERS=true)`

### 4. Fake Dev Seeders — DID NOT RUN

Log line 192: `[STARTUP] Dev seeders skip=True (arg=False, TF_SKIP_DEV_SEEDERS=true)` ✅

### 5. Pre-Drain Row Counts (all target tables at 0)

| Table | Pre-Count |
|---|---|
| `legacy_pacs_raw.property` | 0 |
| `legacy_pacs_raw.owner` | 0 |
| `truth_pacs.parcel_spine` | 0 |
| `canonical_tf.tf_parcel` | 0 |
| `canonical_tf.tf_improvement` | 0 |
| `canonical_tf.tf_land` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `canonical_tf.tf_owner` | 0 |
| `sync_bridge.load_batch` | 6 (prior runs) |
| `sync_bridge.source_xref` | 0 |
| `sync_bridge.promotion_gate_result` | 17 (prior runs) |
| `truth_pacs.imprv_current` | 0 |
| `truth_pacs.land_current` | 0 |
| `truth_pacs.sale` | 0 |
| `truth_pacs.owner_current` | 0 |

---

## Post-Drain Row Counts

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.property` | 0 | **100** | +100 ✅ |
| `legacy_pacs_raw.owner` | 0 | **100** | +100 ✅ |
| `truth_pacs.parcel_spine` | 0 | **100** | +100 ✅ |
| `canonical_tf.tf_parcel` | 0 | **100** | +100 ✅ |
| `sync_bridge.source_xref` | 0 | **100** | +100 ✅ |
| `sync_bridge.load_batch` | 6 | **10** | +4 ✅ (4 batches) |
| `sync_bridge.promotion_gate_result` | 17 | **34** | +17 ✅ (17 gates) |

### Non-Parcel Lanes — UNTOUCHED (all remain 0)

| Table | Post-Count | Status |
|---|---|---|
| `canonical_tf.tf_improvement` | 0 | ✅ Not touched |
| `canonical_tf.tf_land` | 0 | ✅ Not touched |
| `canonical_tf.tf_sale` | 0 | ✅ Not touched |
| `canonical_tf.tf_owner` | 0 | ✅ Not touched |
| `truth_pacs.imprv_current` | 0 | ✅ Not touched |
| `truth_pacs.land_current` | 0 | ✅ Not touched |
| `truth_pacs.sale` | 0 | ✅ Not touched |
| `truth_pacs.owner_current` | 0 | ✅ Not touched |

---

## Source Integrity Confirmations

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ Mounted read-only for copy only |
| Original PACS source: NOT touched | ✅ |
| D: copy is the only attached source | ✅ |
| `terrafusion_dev_clean`: only parcel lane touched | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| No fake dev seeders ran | ✅ Confirmed by log |
| No other lanes called | ✅ Confirmed by post-drain counts |

---

## BLOCKER 1 — DI Registration Gap (RESOLVED)

Three services were missing from `Program.cs`. Added (operator-approved, NOT committed to git — code lives in shared working tree, to be reviewed before branch commit):

```csharp
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService,
    TerraFusion.Data.Services.LegacyPacsRaw.PacsPropertyLandingService>();

builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelTruth.IPacsParcelSpineTruthPromoter,
    TerraFusion.Data.Services.TruthPacs.PacsParcelSpineTruthPromoter>();

builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelCanonical.IPacsParcelCanonicalProjector,
    TerraFusion.Data.Services.CanonicalTf.PacsParcelCanonicalProjector>();
```

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| PACS_SOURCE | `pacs_oltp_verify` — SQL Server 2022 port 21433 — D: copy only (D:\TerraFusion_PACS_Verification\source-copy\pacs_oltp.mdf, 572,901,883,904 bytes) |
| OWNER_YEAR_RANGE | 1968 – 2026 |
| QUALIFYING_OWNER_ROWS | 774,728 (sup_num=0, owner_tax_yr>=2018) |
| COUNT_DISCREPANCY_STATUS | 809,396 (prior evidence doc) cannot be reproduced — SQL source unverifiable — FORMALLY UNRESOLVED. FIX3 authoritative count = 774,728. |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| ENDPOINT | `POST /api/sync/doctrine/drain/parcel` |
| TOPN | 100 |
| ROWS_LANDED | 100 |
| ROWS_PROMOTED | 100 |
| ROWS_CANONICALIZED | 100 |
| NON_PARCEL_LANES | All at 0 — not touched |
| ERRORS | None |
| GATE_RESULTS | 17 PASS / 0 FAIL |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix3-parcel-drain`, worktree `C:\Users\bsval\tf-docs-fix3` |
| NEXT_WORK_ORDER | Operator decision — full corpus drain? next lane (owner-wsdor)? Program.cs DI commit? |
