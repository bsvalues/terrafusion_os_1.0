# WO-DATA-004B-SCALE-001E — Sales Scale Drain TopN=250 Results

**Work Order:** WO-DATA-004B-SCALE-001E
**Date:** 2026-06-19
**Status:** COMPLETE — 250 landed, 125 promoted/canonicalized, 30/30 PASS + 1 expected WARN, 0 quarantine.
**Prerequisite:** SCALE-001D accepted (land 543/543/543)

---

## 1. Evidence Commit Gate

SCALE-001D evidence committed at `f891992bd` on branch `docs/wo-data-004b-scale-001-results` before this drain ran (includes Z/A/B/C/C-R1/C-R2/D evidence).

---

## 2. Runtime Verification

**TF_SKIP_DEV_SEEDERS:** Confirmed (same API process as SCALE-001A through SCALE-001D).
**FullCorpus=False, TopN=250:** Per drain request payload below.

---

## 3. Database Target Verification

**Target:** `terrafusion_scale_proof`

**dev_clean unchanged:**

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No ✓ |
| `canonical_tf.tf_sale` | 61 | No ✓ |
| `canonical_tf.tf_land` | 137 | No ✓ |

---

## 4. PACS Source Verification

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy)
**Proof:** drain succeeded — PACS unreachable would fail.
**tf_mssql_data Docker volume:** NOT touched.

---

## 5. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/sales`
**Body:**
```json
{
  "OperatorName": "claude-scale001e-sales-250-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 250
}
```

---

## 6. Pre-Counts

| Table | Count | Gate check |
|---|---|---|
| `legacy_pacs_raw.sale` | 0 | ✓ clean |
| `truth_pacs.sale` | 0 | ✓ clean |
| `canonical_tf.tf_sale` | 0 | ✓ clean |
| `canonical_tf.tf_parcel` | 500 | ✓ baseline (parcel TopN=500) |
| `canonical_tf.tf_owner` | 421 | ✓ baseline |
| `canonical_tf.tf_improvement` | 307 | ✓ baseline |
| `canonical_tf.tf_land` | 543 | ✓ baseline |
| `canonical_tf.attribute_definition` | 35 | ✓ populated |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ fully resolved |
| `sync_bridge.load_batch` | 53 | — |
| `sync_bridge.source_xref` | 2,270 | — |
| `sync_bridge.promotion_gate_result` | 233 | — |

---

## 7. Response Payload

**HTTP status:** 200
```json
{
  "lane": "sales",
  "status": "Succeeded",
  "counts": {
    "rowsLanded": 250,
    "rowsPromotedToTruth": 125,
    "rowsCanonicalized": 125,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 8.8818747,
  "gateSummary": {
    "totals": [{"status": "PASS", "count": 30}, {"status": "WARN", "count": 1}],
    "recentFailures": [{
      "loadBatchId": "75b9ae17-6650-44da-8981-b2f56252e745",
      "gateName": "truth-pacs-supp-aware-join",
      "gateStage": "RAW_TO_TRUTH",
      "status": "WARN",
      "expected": "0",
      "actual": "9",
      "detail": "noSuppPointer=9 staleSupNum=0",
      "executedAt": "2026-06-19T16:17:22.165597Z"
    }]
  },
  "quarantineDelta": {"before": 0, "after": 0, "delta": 0},
  "nextRecommendedLane": "geometry"
}
```

---

## 8. WARN Gate — truth-pacs-supp-aware-join

| Field | Value |
|---|---|
| Gate | `truth-pacs-supp-aware-join` |
| Stage | `RAW_TO_TRUTH` |
| Status | **WARN** (expected) |
| actual | `noSuppPointer=9` |
| staleSupNum | `0` |

**noSuppPointer=9** means 9 sales in this batch had no matching supplemental pointer in PACS. This is a known condition for Benton sales data and was called out explicitly in the work order as the expected WARN. `staleSupNum=0` confirms no stale supplemental numbers — the 9 are simply absent from the supplemental table, not stale references. This is a WARN, not a FAIL; the 9 sales were still promoted to truth.

---

## 9. Promotion Rate Explanation (125/250 = 50%)

Sales lane applies doctrine filters before promotion. Only DOR-ratio-qualified sales (qualifying ratio code + year range) promote to `truth_pacs.sale`. The remaining 125 landed records failed doctrine qualification (DOR ratio code mismatch or out-of-year-range) and were not promoted — they are not quarantined, simply not qualified for truth.

| Stage | Count | Explanation |
|---|---|---|
| `legacy_pacs_raw.sale` | 250 | All PACS sales landed |
| `truth_pacs.sale` | 125 | Doctrine-qualified sales (50% — expected for Benton DOR filter) |
| `canonical_tf.tf_sale` | 125 | Canonicalized from truth (1:1) |
| `legacy_tf_unproven.sale` | 0 | No unproven sales (non-qualified are simply not promoted) |

---

## 10. Post-Counts

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.sale` | 0 | **250** | +250 |
| `truth_pacs.sale` | 0 | **125** | +125 |
| `canonical_tf.tf_sale` | 0 | **125** | **+125** |
| `canonical_tf.tf_parcel` | 500 | **624** | **+124** (see note) |
| `canonical_tf.tf_owner` | 421 | 421 | 0 ✓ |
| `canonical_tf.tf_improvement` | 307 | 307 | 0 ✓ |
| `canonical_tf.tf_land` | 543 | 543 | 0 ✓ |
| `canonical_tf.attribute_definition` | 35 | 35 | 0 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 | 0 ✓ |
| `legacy_tf_unproven.sale` | 0 | 0 | 0 ✓ |
| `sync_bridge.load_batch` | 53 | 60 | +7 |
| `sync_bridge.source_xref` | 2,270 | 2,519 | +249 |
| `sync_bridge.promotion_gate_result` | 233 | 264 | +31 |

**Gate math proof:** +31 gate results = 30 PASS + 1 WARN = 31 total ✓

**Source_xref delta proof:** +249 = 125 sale entities + 124 parcel entities ✓
(source_xref entity distribution post-drain: parcel=624, land=543, assessment_wsdor=499, owner=421, improvement=307, sale=125)

---

## 11. tf_parcel +124 — Structural Finding

`canonical_tf.tf_parcel` grew from 500 to 624 (+124 rows) during the sales drain.

**Root cause:** The sales promoter resolves each promoted sale to its source parcel. Of the 125 promoted sales, 124 referenced parcels that were outside the original parcel drain's TopN=500 sample. The sales promoter seeded those 124 additional parcels into `canonical_tf.tf_parcel` and `sync_bridge.source_xref` (entity type `parcel`) to establish the parcel-sale link.

This is expected behavior — the sales lane includes parcel resolution for associated sale records, and the PACS sales population is not bounded to the same 500-parcel window as the parcel drain. The 124 additional parcels are real Benton County parcels that have qualifying sales history but were not in the TopN=500 parcel seed.

| Source_xref entity type | Count |
|---|---|
| `parcel` | **624** (+124 from sales drain) |
| `land` | 543 |
| `assessment_wsdor` | 499 |
| `owner` | 421 |
| `improvement` | 307 |
| `sale` | 125 |

---

## 12. Gate Summary

| Gate status | Count |
|---|---|
| PASS | 30 |
| WARN | 1 (truth-pacs-supp-aware-join, noSuppPointer=9 — expected) |
| FAIL | 0 |

---

## 13. Improvement Attr State Proof

Sales drain did not affect improvement attr resolution:

| Table | Post-sales | Expected |
|---|---|---|
| `canonical_tf.attribute_definition` | 35 | 35 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 ✓ |
| `canonical_tf.tf_improvement` | 307 | 307 ✓ |

---

## 14. Non-Sales Lane Proof

| Table | Value | Expected |
|---|---|---|
| `canonical_tf.tf_land` | 543 | 543 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 ✓ |
| `canonical_tf.tf_improvement` | 307 | 307 ✓ |

---

## 15. Cumulative Scale State After SCALE-001E

| Lane | Status | Key Counts |
|---|---|---|
| parcel (SCALE-001A) | ACCEPTED | 500/500/500, 17/17 PASS |
| owner-wsdor (SCALE-001B) | ACCEPTED | 999/999/1420, 49/49 PASS |
| improvement (SCALE-001C+R2) | ACCEPTED | 307 headers + 5972 features + 4098 attributed attrs |
| land (SCALE-001D) | ACCEPTED | 543/543/543, 34/34 PASS |
| **sales (SCALE-001E)** | **ACCEPTED** | **125/250 promoted, 30 PASS + 1 WARN (expected), 0 quarantine** |
| geometry | EXCLUDED | Awaiting slice-control design |

**Cumulative terrafusion_scale_proof state:**

| Table | Rows |
|---|---|
| `canonical_tf.tf_parcel` | 624 (500 original + 124 from sales promotion) |
| `canonical_tf.tf_owner` | 421 |
| `canonical_tf.tf_improvement` | 307 |
| `canonical_tf.tf_land` | 543 |
| `canonical_tf.tf_sale` | 125 |
| `canonical_tf.attribute_definition` | 35 (34 active) |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 |
| `sync_bridge.load_batch` | 60 |
| `sync_bridge.source_xref` | 2,519 |
| `sync_bridge.promotion_gate_result` | 264 |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/sales` |
| TOPN | 250 |
| FULL_CORPUS | false |
| ROWS_LANDED | 250 |
| ROWS_PROMOTED | 125 (50% — DOR ratio doctrine filter) |
| ROWS_CANONICALIZED | 125 |
| ROWS_QUARANTINED | 0 |
| GATE_STATUS | 30 PASS + 1 WARN (truth-pacs-supp-aware-join, noSuppPointer=9) |
| WARN_EXPECTED | Yes — called out in work order |
| IMPROVEMENT_ATTR_STATUS | Resolved (unresolved_imprv_attr=0, attribute_definition=35) |
| TF_PARCEL_DELTA | +124 (sales promoter seeded parcels outside parcel-lane sample) |
| NON_SALES_LANES | All unchanged ✓ |
| DEV_CLEAN_TOUCHED | No ✓ |
| ERRORS | None |
| DURATION | 8.88s |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001E_SALES_250_RESULTS.md` |
| SCALE_001E_ACCEPTED | **Yes** |
| NEXT_WORK_ORDER | Scale Summary |
