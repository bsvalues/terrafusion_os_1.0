# WO-DATA-004B-SCALE-001C-R2 — Attribute Definition Population + Reprojection Results

**Work Order:** WO-DATA-004B-SCALE-001C-R2 (Option A resolution)
**Date:** 2026-06-19
**Status:** COMPLETE — unresolved_imprv_attr=0. Threshold passed. SCALE-001C ACCEPTED.
**Prerequisite:** SCALE-001C-R1 (attr-drain-1 inconclusive, attribute_definition empty)

---

## Acceptance Rule Result

| Metric | Value | Threshold | Result |
|---|---|---|---|
| Pre ATTR-POP unresolved_imprv_attr | 4,098 (post-R1 state) | — | — |
| Post ATTR-POP-1 unresolved_imprv_attr | 2 | ≤ 1,176 | ✓ PASS |
| Post ATTR-POP-2 unresolved_imprv_attr | **0** | ≤ 1,176 | **✓ PASS** |

**SCALE-001C is ACCEPTED. SCALE-001D (land TopN=500) may proceed with operator approval.**

---

## 1. Endpoints Run (in order)

### ATTR-POP-1 — Family-grain attribute definitions from PACS `dbo.attribute`
**Endpoint:** `POST http://localhost:5000/api/debug/attr-pop-1/run-populate`
**HTTP status:** 200
**Duration:** 3.9s

```json
{
  "operatorName": "claude-scale001c-r2-attr-pop1",
  "populator": {
    "status": "COMPLETED",
    "rowsConsidered": 35,
    "rowsInserted": 35,
    "rowsUpdated": 0,
    "rowsSoftRetired": 0,
    "inactiveSkipped": 10
  },
  "counts": {
    "attribute_definition_total": 35,
    "attribute_definition_active": 25
  },
  "reprojection": {
    "status": "COMPLETED",
    "truthRowsConsidered": 296,
    "improvementsProjected": 296,
    "featuresProjected": 5950,
    "attributesConsidered": 4098,
    "attributesResolved": 4096,
    "attributesQuarantined": 2,
    "priorAttrQuarantineRowsRemoved": 4098
  },
  "quarantineDelta": -4096,
  "featuresAttributedDelta": 4096,
  "proofVerdict": "PROOF: attribute_definition populated AND 4096 additional tf_improvement_feature rows now carry AttributeId — ATTR-POP-1 succeeded."
}
```

### ATTR-POP-2 — Value-grain attribute definitions from PACS value-grain pairs
**Endpoint:** `POST http://localhost:5000/api/debug/attr-pop-2/run-populate`
**HTTP status:** 200
**Duration:** 8.7s

```json
{
  "operatorName": "claude-scale001c-r2-attr-pop2",
  "populator": {
    "status": "COMPLETED",
    "rowsConsidered": 222,
    "rowsInserted": 0,
    "rowsUpdated": 32,
    "duplicatePairsCollapsed": 190
  },
  "counts": {
    "attribute_definition_total": 35,
    "attribute_definition_active": 34
  },
  "reprojection": {
    "batchesReprojected": 2,
    "preQuarantine": 2,
    "postQuarantine": 0,
    "preFeaturesAttributed": 4096,
    "postFeaturesAttributed": 4098,
    "perBatch": [
      {
        "status": "COMPLETED",
        "attributesConsidered": 4098,
        "attributesResolved": 4098,
        "attributesQuarantined": 0,
        "priorAttrQuarantineRowsRemoved": 2
      },
      {
        "status": "COMPLETED",
        "attributesConsidered": 4098,
        "attributesResolved": 4098,
        "attributesQuarantined": 0,
        "priorAttrQuarantineRowsRemoved": 0
      }
    ]
  },
  "quarantineDelta": -2,
  "featuresAttributedDelta": 2,
  "proofVerdict": "PROOF: value-grain attribute_definition populated AND 2 additional tf_improvement_feature rows now carry AttributeId — ATTR-POP-2 closed the family/value-grain loop."
}
```

---

## 2. What ATTR-POP-1 / ATTR-POP-2 Do

| Step | Action |
|---|---|
| ATTR-POP-1 | Reads PACS `dbo.attribute` (family-grain), upserts 35 rows into `canonical_tf.attribute_definition` |
| ATTR-POP-1 auto-reprojection | Re-reads all truth improvements (296), projects features + resolves attrs against new definitions |
| ATTR-POP-2 | Reads PACS value-grain pairs, updates 32 existing definition rows with value-grain detail (190 duplicates collapsed) |
| ATTR-POP-2 auto-reprojection | Re-projects full truth scope again; final 2 quarantine rows resolved; 0 remaining |

Both endpoints include automatic reprojection (`RerunImprvCanonical=true` default). No separate attr-drain-1 call was needed after ATTR-POP.

---

## 3. Resolution Summary

| Stage | unresolved_imprv_attr | attributesResolved | attributesQuarantined |
|---|---|---|---|
| Post-SCALE-001C (pre-R1) | 2,049 | — | — |
| Post-R1 (attr-drain-1 with empty attr_def) | 4,098 | 0 | 4,098 |
| Post-ATTR-POP-1 | 2 | 4,096 | 2 |
| **Post-ATTR-POP-2** | **0** | **4,098** | **0** |

**100% resolution. 0 truly-unresolvable attrs in this corpus.**

---

## 4. Final Post-Counts

| Table | Pre-R2 (post-R1) | Post-R2 | Delta |
|---|---|---|---|
| `legacy_tf_unproven.unresolved_imprv_attr` | 4,098 | **0** | -4,098 |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 | 0 | 0 |
| `canonical_tf.attribute_definition (total)` | 0 | 35 | +35 |
| `canonical_tf.attribute_definition (active)` | 0 | 34 | +34 |
| `canonical_tf.tf_improvement` | 307 | 307 | 0 |
| `canonical_tf.tf_improvement_feature` | 1,874 | **5,972** | +4,098 |
| `canonical_tf.tf_improvement_feature (with AttributeId)` | 0 | **4,098** | +4,098 |
| `sync_bridge.load_batch` | 40 | 45 | +5 |
| `sync_bridge.source_xref` | 1,727 | 1,727 | 0 |
| `canonical_tf.tf_land` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_parcel` | 500 | 500 | 0 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 | 0 ✓ |

**tf_improvement_feature growth note:** ATTR-POP reprojection reads the full truth scope (296 improvements, broader than the initial TopN=250 sample). The 5,972 features reflect the full improvement coverage from `truth_pacs.imprv_current`, not the 947 from the initial sample drain. The 4,098 `tf_improvement_feature` rows with `AttributeId` represent all imprv_attr canonical resolutions.

---

## 5. Non-Improvement Lane Proof

| Table | Value |
|---|---|
| `canonical_tf.tf_land` | 0 ✓ |
| `canonical_tf.tf_sale` | 0 ✓ |
| `canonical_tf.tf_parcel` | 500 ✓ |
| `canonical_tf.tf_owner` | 421 ✓ |
| `canonical_tf.tf_parcel_owner_link` | 500 (baseline unchanged) |
| `canonical_tf.tf_assessment_wsdor` | 499 (baseline unchanged) |

---

## 6. dev_clean Proof

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No ✓ |
| `canonical_tf.tf_improvement` | 104 | No ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | No ✓ |

---

## 7. Structural Finding — attribute_definition Must Be Seeded Before attr-drain-1

The correct sequence for improvement attribute resolution:
1. `POST /api/debug/attr-pop-1/run-populate` — seeds family-grain defs (auto-reprojects)
2. `POST /api/debug/attr-pop-2/run-populate` — seeds value-grain defs (auto-reprojects, closes loop)

attr-drain-1 (`POST /api/debug/attr-drain-1/run-drain`) cannot resolve attrs if `attribute_definition` is empty. ATTR-POP must run first. Both ATTR-POP endpoints include automatic reprojection, so a separate attr-drain-1 call is not needed when the ATTR-POP sequence is used.

This is NOT documented in the SCALE-001 work order chain — adding this as a lesson for any future scale proof or county deployment.

---

## 8. SCALE-001C Full Chain Status

| Step | Result |
|---|---|
| SCALE-001C: improvement drain TopN=250 | HTTP 200, Succeeded, 307 promoted, 1254 canonicalized, known FAIL gate actual=3 |
| SCALE-001C stop condition 6 | Triggered (2049 pre-staging > 1176) |
| SCALE-001C-R1: attr-drain-1 with empty attr_def | INCONCLUSIVE (0→4098 quarantine, 0 resolved) |
| SCALE-001C-R2: ATTR-POP-1 | 4096 resolved, 2 remaining, 35 defs seeded |
| SCALE-001C-R2: ATTR-POP-2 | Final 2 resolved, 0 remaining, threshold passed |
| **SCALE-001C acceptance rule** | **0 ≤ 1,176 → ACCEPTED** |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **ACCEPTED — unresolved_imprv_attr=0, threshold passed (0 ≤ 1,176)** |
| DB_TARGET | `terrafusion_scale_proof` |
| ENDPOINTS | `POST /api/debug/attr-pop-1/run-populate` + `POST /api/debug/attr-pop-2/run-populate` |
| PRE_UNRESOLVED_ATTRS | 4,098 (post-R1 state) |
| POST_UNRESOLVED_ATTRS | **0** |
| ROWS_RESOLVED | **4,098** (100%) |
| THRESHOLD_STATUS | **PASSED: 0 ≤ 1,176** |
| ATTRIBUTE_DEFINITION_SEEDED | 35 total, 34 active |
| TF_IMPROVEMENT_FEATURE_ATTRIBUTED | 4,098 rows now carry canonical AttributeId |
| DUP_KEY_COUNT | 3 (known, unchanged) |
| NON_IMPROVEMENT_LANES | All unchanged ✓ |
| DEV_CLEAN_TOUCHED | No ✓ |
| ERRORS | None |
| SCALE_001C_ACCEPTED | **Yes** |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001C_R2_ATTR_POP_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-001D — land lane TopN=500 (requires operator approval) |
