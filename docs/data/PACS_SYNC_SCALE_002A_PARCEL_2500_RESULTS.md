# WO-DATA-004B-SCALE-002A — Parcel Scale Drain TopN=2,500 Results

**Work Order:** WO-DATA-004B-SCALE-002A
**Date:** 2026-06-19
**Status:** COMPLETE — 2,500 landed, 2,500 promoted, 2,500 canonicalized, 17/17 PASS, 0 quarantine.
**Prerequisite:** SCALE-002Z accepted (fresh DB, 0-row baseline, post-seed snapshot)

---

## 1. Snapshot Confirmation

Snapshot `terrafusion_scale_proof_scale002_postseed_baseline.dump` (721K) confirmed present before drain.

---

## 2. Runtime Verification

**TF_SKIP_DEV_SEEDERS:** Active (confirmed in API startup log during SCALE-002Z)
**API process:** PID 54656, `http://localhost:5000`
**API worktree:** `C:\Users\bsval\terrafusion_os_1.0\tf-scale-001z`

---

## 3. Database Target Verification

**Target:** `terrafusion_scale_proof`

**dev_clean unchanged:**

| Table | Pre | Post | Changed? |
|---|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | 83,326 | No ✓ |

---

## 4. PACS Source Verification

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy)
**Proof:** drain succeeded with 2,500 rows landed — PACS unreachable would fail.
**tf_mssql_data Docker volume:** NOT touched.

---

## 5. Doctrine Rules Pre-Drain Confirmation

| Table | Count | Expected |
|---|---|---|
| `doctrine_tf.tf_doctrine_ratio_policy` | 3 | 3 ✓ |
| `doctrine_tf.tf_doctrine_property_universe` | 6 | 6 ✓ |
| `doctrine_tf.tf_doctrine_sales_qualification_codes` | 3 | 3 ✓ |

---

## 6. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/parcel`
**Body:**
```json
{
  "OperatorName": "claude-scale002a-parcel-2500-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 2500
}
```

---

## 7. Pre-Counts

| Table | Count | Gate check |
|---|---|---|
| `legacy_pacs_raw.property` | 0 | ✓ clean |
| `truth_pacs.parcel_spine` | 0 | ✓ clean |
| `canonical_tf.tf_parcel` | 0 | ✓ clean |
| `canonical_tf.tf_owner` | 0 | ✓ baseline |
| `canonical_tf.tf_improvement` | 0 | ✓ baseline |
| `canonical_tf.tf_land` | 0 | ✓ baseline |
| `canonical_tf.tf_sale` | 0 | ✓ baseline |
| `sync_bridge.load_batch` | 0 | — |
| `sync_bridge.source_xref` | 0 | — |
| `sync_bridge.promotion_gate_result` | 0 | — |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ clean |

---

## 8. Response Payload

**HTTP status:** 200
```json
{
  "lane": "parcel",
  "status": "Succeeded",
  "batchIds": [
    "a0bb2ad4-3244-4f99-84f2-d820cc96fb56",
    "b45e676b-5da9-4201-a314-0d1e3652d2f3",
    "4a097a16-6903-430e-8bb6-648758c85797",
    "c9afafaa-0c7d-49a8-a988-73433c6e9182"
  ],
  "counts": {
    "rowsLanded": 2500,
    "rowsPromotedToTruth": 2500,
    "rowsCanonicalized": 2500,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 8.3637623,
  "gateSummary": {
    "totals": [{"status": "PASS", "count": 17}],
    "recentFailures": []
  },
  "quarantineDelta": {"before": 0, "after": 0, "delta": 0},
  "nextRecommendedLane": "owner-wsdor"
}
```

**Batch count:** 4 batches (2,500 rows / 4 = ~625 rows/batch)

---

## 9. Post-Counts and Deltas

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.property` | 0 | **2,500** | +2,500 |
| `truth_pacs.parcel_spine` | 0 | **2,500** | +2,500 |
| `canonical_tf.tf_parcel` | 0 | **2,500** | **+2,500** |
| `canonical_tf.tf_owner` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_improvement` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_land` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 | 0 ✓ |
| `sync_bridge.load_batch` | 0 | **4** | +4 |
| `sync_bridge.source_xref` | 0 | **2,500** | +2,500 |
| `sync_bridge.promotion_gate_result` | 0 | **17** | +17 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 | 0 ✓ |

**Gate math proof:** +17 gate results = 17 PASS + 0 WARN + 0 FAIL = 17 total ✓
**Source_xref delta:** +2,500 = all parcel entities ✓

---

## 10. Gate Summary

| Gate status | Count |
|---|---|
| PASS | **17** |
| WARN | 0 |
| FAIL | 0 |

---

## 11. Non-Parcel Lane Proof

| Table | Post-drain | Expected |
|---|---|---|
| `canonical_tf.tf_owner` | 0 | 0 ✓ |
| `canonical_tf.tf_improvement` | 0 | 0 ✓ |
| `canonical_tf.tf_land` | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 ✓ |

---

## 12. Scale Comparison — SCALE-001A vs SCALE-002A

| Metric | SCALE-001A (TopN=500) | SCALE-002A (TopN=2,500) | Factor |
|---|---|---|---|
| Rows landed | 500 | 2,500 | 5× |
| Rows promoted | 500 | 2,500 | 5× |
| Rows canonicalized | 500 | 2,500 | 5× |
| Gate count | 17 PASS | 17 PASS | same |
| Duration | ~7s | 8.4s | +20% |
| Quarantine | 0 | 0 | same |

5× scale with <20% duration increase. Gate structure identical. No new failure modes.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/parcel` |
| TOPN | 2,500 |
| FULL_CORPUS | false |
| ROWS_LANDED | 2,500 |
| ROWS_PROMOTED | 2,500 |
| ROWS_CANONICALIZED | 2,500 |
| GATE_STATUS | 17/17 PASS, 0 WARN, 0 FAIL |
| QUARANTINE_STATUS | 0 (before=0, after=0, delta=0) |
| NON_PARCEL_LANES | All unchanged — owner/improvement/land/sale = 0 ✓ |
| DEV_CLEAN_TOUCHED | No (83,326 unchanged) ✓ |
| ERRORS | None |
| DURATION | 8.4s |
| LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_002A_PARCEL_2500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-002B — owner-wsdor drain TopN=2,500 |
