# WO-DATA-004B-SCALE-001D — Land Scale Drain TopN=500 Results

**Work Order:** WO-DATA-004B-SCALE-001D
**Date:** 2026-06-19
**Status:** COMPLETE — 543 landed/promoted/canonicalized, 34/34 gates PASS, 0 quarantine.
**Prerequisite:** SCALE-001C accepted after ATTR-POP-1 → ATTR-POP-2 (unresolved_imprv_attr=0)

---

## 1. Evidence Commit Gate

SCALE-001C-R2 evidence committed at `f891992bd` on branch `docs/wo-data-004b-scale-001-results` before this drain ran.

---

## 2. Runtime Verification

**Log proof — FullCorpus and TopN honored (from prior session startup, same API process):**
```
[Drain:land] Owner seed (TopN=500, FullCorpus=False)
```
No `TopN=null` or `FullCorpus=True` observed. PR #1051 patch confirmed operative.

**TF_SKIP_DEV_SEEDERS:** Confirmed (same API process started with SCALE-001A).

---

## 3. Database Target Verification

**Target:** `terrafusion_scale_proof`

**dev_clean unchanged:**

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No ✓ |
| `canonical_tf.tf_land` | 137 | No ✓ |
| `canonical_tf.tf_improvement` | 104 | No ✓ |

---

## 4. PACS Source Verification

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy)
**Proof:** drain succeeded — PACS unreachable would fail.
**tf_mssql_data Docker volume:** NOT touched.

---

## 5. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/land`
**Body:**
```json
{
  "OperatorName": "claude-scale001d-land-500-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 500
}
```

---

## 6. Pre-Counts

| Table | Count | Gate check |
|---|---|---|
| `legacy_pacs_raw.land_detail` | 289 (pre-seeded by prior drain pass) | — |
| `truth_pacs.land_current` | 0 | ✓ clean |
| `canonical_tf.tf_land` | 0 | ✓ clean |
| `canonical_tf.tf_parcel` | 500 | ✓ baseline |
| `canonical_tf.tf_owner` | 421 | ✓ baseline |
| `canonical_tf.tf_improvement` | 307 | ✓ baseline |
| `canonical_tf.tf_improvement_feature` | 5,972 | ✓ baseline |
| `canonical_tf.attribute_definition` | 35 | ✓ populated |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ fully resolved |
| `canonical_tf.tf_sale` | 0 | ✓ clean |
| `sync_bridge.load_batch` | 45 | — |
| `sync_bridge.source_xref` | 1,727 | — |
| `sync_bridge.promotion_gate_result` | 199 | — |

---

## 7. Response Payload

**HTTP status:** 200
```json
{
  "lane": "land",
  "status": "Succeeded",
  "batchIds": [
    "c9d1c526-1a2d-42ac-90e8-329fd6110367",
    "504403ac-5938-4646-b90b-dd26e9162c4c",
    "4e7bf2a4-4c18-4a5a-ba88-812b326f6ec6",
    "cc5b81c5-f427-4216-b5ff-76f7fe0feebe",
    "a76d6833-ab23-40ad-9548-ec80c73bb9b2",
    "1e646b4c-2dc2-4914-b441-220037b1f1cf",
    "bb488768-123c-4622-91ff-5dbf4bf8cd6e",
    "9b3af18c-b366-4bb9-868c-27b1b689b542"
  ],
  "counts": {
    "rowsLanded": 543,
    "rowsPromotedToTruth": 543,
    "rowsCanonicalized": 543,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 22.4278892,
  "gateSummary": {
    "totals": [{"status": "PASS", "count": 34}],
    "recentFailures": []
  },
  "quarantineDelta": {"before": 0, "after": 0, "delta": 0},
  "nextRecommendedLane": "sales"
}
```

---

## 8. Row Count Explanation (543 > TopN=500)

Land lane seeds more rows than TopN because parcels can have multiple land segments (split lots, combined assessments, multiple land types). TopN=500 parcels → 543 landed land records.

| Table | Rows | Explanation |
|---|---|---|
| `legacy_pacs_raw.land_detail` | +543 (289→832) | Land segment details per parcel |
| `truth_pacs.land_current` | 543 | One truth row per land segment |
| `canonical_tf.tf_land` | 543 | One canonical row per land segment |

**543/543/543 landed/promoted/canonicalized** — full pipeline, no divergence.

---

## 9. Post-Counts

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.land_detail` | 289 | 832 | +543 |
| `truth_pacs.land_current` | 0 | 543 | +543 |
| `canonical_tf.tf_land` | 0 | **543** | **+543** |
| `canonical_tf.tf_parcel` | 500 | 500 | 0 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 | 0 ✓ |
| `canonical_tf.tf_improvement` | 307 | 307 | 0 ✓ |
| `canonical_tf.tf_improvement_feature` | 5,972 | 5,972 | 0 ✓ |
| `canonical_tf.attribute_definition` | 35 | 35 | 0 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 | 0 ✓ |
| `legacy_tf_unproven.land_current` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 | 0 ✓ |
| `sync_bridge.load_batch` | 45 | 53 | +8 |
| `sync_bridge.source_xref` | 1,727 | 2,270 | +543 |
| `sync_bridge.promotion_gate_result` | 199 | 233 | +34 |

---

## 10. Gate Summary

| Gate status | Count |
|---|---|
| PASS | 34 |
| FAIL | 0 |

`recentFailures: []`. Clean gate run.

---

## 11. Improvement Attr State Proof

Improvement attr resolution unaffected by land drain:

| Table | Post-land | Expected |
|---|---|---|
| `canonical_tf.attribute_definition` | 35 | 35 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 ✓ |
| `canonical_tf.tf_improvement` | 307 | 307 ✓ |
| `canonical_tf.tf_improvement_feature` | 5,972 | 5,972 ✓ |

---

## 12. Non-Land Lane Proof

| Table | Value | Expected |
|---|---|---|
| `canonical_tf.tf_sale` | 0 | 0 ✓ |
| `canonical_tf.tf_parcel` | 500 | 500 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 ✓ |
| `canonical_tf.tf_parcel_owner_link` | 500 (baseline) | 500 ✓ |
| `canonical_tf.tf_assessment_wsdor` | 499 (baseline) | 499 ✓ |

---

## 13. Cumulative Scale State After SCALE-001D

| Lane | Status | Key Counts |
|---|---|---|
| parcel (SCALE-001A) | ACCEPTED | 500/500/500, 17/17 PASS |
| owner-wsdor (SCALE-001B) | ACCEPTED | 999/999/1420, 49/49 PASS |
| improvement (SCALE-001C+R2) | ACCEPTED | 307 headers + 5972 features + 4098 attributed attrs |
| **land (SCALE-001D)** | **ACCEPTED** | **543/543/543, 34/34 PASS** |
| sales | NEXT | — |
| geometry | EXCLUDED | — |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/land` |
| TOPN | 500 |
| FULL_CORPUS | false |
| ROWS_LANDED | 543 (land segments, multiple per parcel) |
| ROWS_PROMOTED | 543 |
| ROWS_CANONICALIZED | 543 |
| GATE_STATUS | 34/34 PASS |
| IMPROVEMENT_ATTR_STATUS | Resolved (unresolved_imprv_attr=0, attribute_definition=35) |
| NON_LAND_LANES | All unchanged ✓ |
| DEV_CLEAN_TOUCHED | No ✓ |
| ERRORS | None |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001D_LAND_500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-001E — sales lane (requires operator approval) |
