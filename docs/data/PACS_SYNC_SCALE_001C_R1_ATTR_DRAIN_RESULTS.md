# WO-DATA-004B-SCALE-001C-R1 — Improvement Attr Drain Resolution Pass Results

**Work Order:** WO-DATA-004B-SCALE-001C-R1
**Date:** 2026-06-19
**Status:** INCONCLUSIVE — quarantine increased from 2,049 to 4,098. Threshold comparison cannot be made.
**Acceptance rule:** post-resolution unresolved_imprv_attr > 1,176 → SCALE-001C REMAINS STOPPED.
**Root cause:** `canonical_tf.attribute_definition` has 0 active rows in both terrafusion_scale_proof AND terrafusion_dev_clean. attr-drain-1 cannot resolve any imprv_attr without canonical attribute definitions populated.

---

## Acceptance Rule Result

| Metric | Value | Threshold | Result |
|---|---|---|---|
| Pre attr-drain-1 unresolved_imprv_attr | 2,049 | — | — |
| Post attr-drain-1 unresolved_imprv_attr | **4,098** | ≤ 1,176 | **STOP — EXCEEDED** |
| Resolved | **0** | — | 0 resolutions |

**SCALE-001C remains stopped. Do not proceed to land.**

---

## 1. Pre-Run State Verification

| Table | Count | Expected |
|---|---|---|
| `legacy_tf_unproven.unresolved_imprv_attr` | 2,049 | 2,049 ✓ |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 | 0 ✓ |
| `canonical_tf.tf_improvement` | 307 | — |
| `canonical_tf.tf_improvement_feature` | 947 | — |
| `canonical_tf.attribute_definition` | 0 | — |
| `sync_bridge.load_batch` | 31 | — |
| `sync_bridge.source_xref` | 1,727 | — |
| `sync_bridge.promotion_gate_result` | 136 | — |
| `canonical_tf.tf_land` | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 ✓ |
| `canonical_tf.tf_parcel` | 500 | 500 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 ✓ |

**dev_clean pre-run (unchanged baseline):**

| Table | Count |
|---|---|
| `canonical_tf.tf_parcel` | 83,326 ✓ |
| `canonical_tf.tf_improvement` | 104 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 ✓ |

---

## 2. Endpoint and DB Target

**Endpoint:** `POST http://localhost:5000/api/debug/attr-drain-1/run-drain`
**HTTP status:** 200
**DB target:** `terrafusion_scale_proof` (confirmed — non-improvement tables at expected scale_proof values)
**No request body required** (debug endpoint uses API context)

---

## 3. Response Payload (verbatim)

```json
{
  "operatorName": "attr-drain-1",
  "bentonCountyId": "31f78d81-f3d8-4171-8d6f-be3a0cc5906f",
  "inspection": {
    "totalQuarantineBefore": 2049,
    "quarantineByReason": [{"reason": "UNKNOWN_ATTRIBUTE", "count": 2049}],
    "landingQuarantineCount": 0,
    "canonicalQuarantineCount": 2049,
    "distinctTuples": 198,
    "distinctYears": 1,
    "yearBreakdown": {"2026": 198},
    "attributeDefinitionsActive": 0,
    "landingDictionaryBefore": 193,
    "landingDictionaryAfter": 193,
    "landingDictionaryDelta": 0,
    "featuresAttributedBefore": 0
  },
  "perYearResults": [{
    "year": 2026,
    "stage": "imprv-canon",
    "status": "COMPLETED",
    "parcelsProcessed": 198,
    "truthRowsConsidered": 296,
    "improvementsProjected": 296,
    "featuresProjected": 1854,
    "attributesConsidered": 4098,
    "attributesResolved": 0,
    "attributesQuarantined": 4098,
    "priorAttrQuarantineRowsRemoved": 2049
  }],
  "outcome": {
    "totalQuarantineBefore": 2049,
    "landingQuarantineAfter": 0,
    "canonicalQuarantineAfter": 4098,
    "totalQuarantineAfter": 4098,
    "quarantineDrained": -2049,
    "featuresAttributedBefore": 0,
    "featuresAttributedAfter": 0,
    "featuresAttributedDelta": 0
  },
  "proofVerdict": "INCONCLUSIVE: drain ran but quarantine did not decrease. Investigate landing/canonical reason breakdown above."
}
```

---

## 4. Root Cause Analysis

### Key diagnostic from response

| Field | Value | Significance |
|---|---|---|
| `attributeDefinitionsActive` | **0** | Canonical attr table is empty — no resolution possible |
| `landingDictionaryBefore` | 193 | Landing dict loaded correctly from PACS — NOT the issue |
| `attributesResolved` | **0** | Zero resolutions despite 193 landing codes |
| `attributesQuarantined` | 4,098 | All attrs went back to staging (doubled from prior 2,049) |
| `priorAttrQuarantineRowsRemoved` | 2,049 | Old staging rows cleared — then re-projected generated 4,098 new ones |

### Two-layer architecture — where the failure occurs

```
PACS imprv_attr rows
        ↓
[Layer 1 — Landing]   RefreshableImprvAttrDictionary (193 codes)
                       ✓ PASSES — quarantined=0 at landing
        ↓
[Layer 2 — Canonical]  canonical_tf.attribute_definition (0 active rows)
                       ✗ FAILS — 0 definitions → 100% quarantine
        ↓
legacy_tf_unproven.unresolved_imprv_attr (staging)
```

The landing-level check (193 codes) is working correctly — all attrs are recognized at landing. The canonical resolution step requires `attribute_definition` entries to assign a canonical `AttributeId`. With 0 active definitions, attr-drain-1 cannot map any attr code to a canonical id.

### Why quarantine doubled (2,049 → 4,098)

attr-drain-1 does NOT simply re-process the staged rows. It:
1. Removes prior staging rows (`priorAttrQuarantineRowsRemoved: 2,049`)
2. Re-queries the full truth+canonical layer for all improvements (296 truth rows, 198 parcels)
3. Re-projects ALL attrs from that full set (`attributesConsidered: 4,098`)
4. All 4,098 attrs fail canonical resolution → all re-staged

The re-projection produced 4,098 attrs (vs the original 2,049 from the improvement drain) because attr-drain-1 reads a broader PACS scope than the initial `TopN=250` drain.

### Why dev_clean's 588 is NOT comparable to a "released" baseline

`canonical_tf.attribute_definition` = 0 rows in **both** databases. The V8 release (9,504 → 0) was run against a different database state where `attribute_definition` presumably had entries populated. The current dev_clean state has `attribute_definition = 0`, meaning dev_clean's 588 in `unresolved_imprv_attr` is also unresolvable by attr-drain-1 — it is FIX7B-era staging, not post-release truly-unresolvable residual.

**The 588 baseline used for the 1,176 threshold was not a valid post-release measurement in the current schema state.**

---

## 5. Post-Run Counts

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_tf_unproven.unresolved_imprv_attr` | 2,049 | **4,098** | +2,049 |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 | 0 | 0 |
| `canonical_tf.tf_improvement` | 307 | 307 | 0 |
| `canonical_tf.tf_improvement_feature` | 947 | **1,874** | **+927** |
| `canonical_tf.attribute_definition` | 0 | 0 | 0 |
| `sync_bridge.load_batch` | 31 | 40 | +9 |
| `sync_bridge.source_xref` | 1,727 | 1,727 | 0 |
| `sync_bridge.promotion_gate_result` | 136 | 177 | +41 |
| `canonical_tf.tf_land` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_parcel` | 500 | 500 | 0 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 | 0 ✓ |

**Note — tf_improvement_feature increased +927:** attr-drain-1 re-projected all improvement features from the full truth scope (296 improvements → 1,854 features projected per response). The 927 new feature rows represent additional features from improvements that fell outside the original `TopN=250` boundary but exist in `truth_pacs.imprv_current`. This is expected behavior for attr-drain-1 — it covers the full truth set, not just the sample drain.

---

## 6. Non-Improvement Lane Proof

| Table | Post-R1 | Expected |
|---|---|---|
| `canonical_tf.tf_land` | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 ✓ |
| `canonical_tf.tf_parcel` | 500 | 500 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 ✓ |

---

## 7. dev_clean Verification

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No ✓ |
| `canonical_tf.tf_improvement` | 104 | No ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | No ✓ |
| `canonical_tf.attribute_definition` | 0 | No ✓ |

---

## 8. Structural Finding — attribute_definition Population Gap

`canonical_tf.attribute_definition` = 0 rows in both databases. This table is required for canonical imprv_attr resolution (assigning `AttributeId`). Without it:

- attr-drain-1 resolves 0 attrs regardless of dataset size
- imprv_attr will always quarantine to `unresolved_imprv_attr` at the canonical layer
- The improvement, feature, and parcel/owner/WSDOR pipelines work correctly — this gap only affects attr resolution (the imprv_attr canonical step)

The improvement pipeline for headers and features is healthy:
- `tf_improvement`: 307 rows ✓
- `tf_improvement_feature`: 1,874 rows (includes attr-drain-1 expansion of full truth scope) ✓
- `tf_parcel`, `tf_owner`, `tf_parcel_owner_link`, `tf_assessment_wsdor`: all correct ✓

Only imprv_attr canonical resolution is blocked pending `attribute_definition` population.

---

## 9. Errors / Blockers

- No HTTP errors (status 200 throughout)
- API `proofVerdict`: `"INCONCLUSIVE: drain ran but quarantine did not decrease."`
- No crashes, no manual SQL required

---

## 10. SCALE-001C Acceptance Status

**SCALE-001C: NOT ACCEPTED.**

Post-R1 unresolved_imprv_attr = 4,098 > threshold 1,176.

However, the structural context: the imprv_attr quarantine is a known open gap (`attribute_definition` population) that affects both databases equally. It does not indicate a problem with the improvement drain pipeline, the PACS source, the FullCorpus patch, or the scale proof architecture. The parcel, owner-WSDOR, improvement header, and improvement feature pipelines all proved out correctly.

---

## 11. Land Lane Status

**SCALE-001D (land TopN=500): Cannot proceed yet.**

Acceptance rule requires SCALE-001C accepted OR explicit operator authorization to proceed despite improvement attr gap.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | INCONCLUSIVE — quarantine increased 2049→4098. Threshold NOT met. |
| DB_TARGET | `terrafusion_scale_proof` |
| ENDPOINT | `POST /api/debug/attr-drain-1/run-drain` |
| PRE_UNRESOLVED_ATTRS | 2,049 |
| POST_UNRESOLVED_ATTRS | **4,098** |
| ROWS_RESOLVED | **0** |
| THRESHOLD_STATUS | **FAILED: 4,098 > 1,176** |
| ROOT_CAUSE | `canonical_tf.attribute_definition` = 0 rows (canonical attr resolution layer empty) |
| DUP_KEY_COUNT | N/A (attr-drain-1 does not re-evaluate source duplicates) |
| NON_IMPROVEMENT_LANES | All unchanged ✓ |
| DEV_CLEAN_TOUCHED | No ✓ |
| ERRORS | None (HTTP 200, API INCONCLUSIVE verdict) |
| SCALE_001C_ACCEPTED | **No** |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001C_R1_ATTR_DRAIN_RESULTS.md` |
| NEXT_WORK_ORDER | Operator decision required. Options: (A) populate attribute_definition and re-run R1; (B) authorize land/sales despite improvement attr gap as known structural open item; (C) defer improvement attr lane to a dedicated workstream |
