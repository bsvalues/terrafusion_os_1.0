# WO-DATA-FINALIZE-IMPROVEMENT-001 — Full Improvement Drain Results

**Database**: `terrafusion_benton_demo` (PostgreSQL 17, port 5433)  
**Operator name**: `finalize-improvement-full-v4`  
**Run date**: 2026-06-22 (PDT)  
**Wall clock**: 02:19 → 05:09 PDT (2 h 50 min)  
**Status**: COMPLETE — all 12 batches COMPLETED, all gates passed or acknowledged

---

## Final State

| Table | Row Count | Notes |
|---|---|---|
| `canonical_tf.tf_improvement` | **100,144** | Current Benton improvements in canonical |
| `canonical_tf.tf_improvement_feature` | **1,351,892** | Detail features (avg ~13.5 per improvement) |
| `truth_pacs.imprv_current` | 300,432 | Cumulative across v1+v2+v4 runs; see note |
| `legacy_pacs_raw.imprv_attr` | 1,870,609 | Cumulative ImprvAttr landing (all runs) |
| `legacy_tf_unproven.unresolved_imprv_attr` | 1,872,866 | Quarantine — all from attribute dictionary miss |

**Note on truth_pacs.imprv_current (300,432)**: The truth promoter APPENDS rather than UPSERTs. v1 added 100,144, v2 added 100,144, v4 added 100,144 = 300,432 total. Only the v4 batch (`576cd0d9`) represents current truth. Prior rows are historical artifacts; the canonical projector reads from the latest truth batch and correctly produced 100,144 canonical improvements.

---

## Improvement Universe Distribution (v4 Truth, 100,144 improvements)

| Universe | Count |
|---|---|
| REAL_RESIDENTIAL | 85,867 (85.7%) |
| REAL_COMMERCIAL | 9,547 (9.5%) |
| AG_CURRENT_USE | 4,730 (4.7%) |
| **Total** | **100,144** |

Aggregate improvement value: **$31,579,450,050** ($31.6B)

---

## Batch-by-Batch Timeline

| Batch ID | Stage | Started | Completed | Extracted | Promoted | Duration |
|---|---|---|---|---|---|---|
| `6f5525ea` | Landing (Owner+Parcel pre-stages) | 02:19 | 02:42 | 809,396 | 809,396 | 23 min |
| `c36cbe20` | Owner-WSDOR Truth | 02:42 | 02:44 | 95,810 | 95,810 | 2 min |
| `b05c59e3` | Parcel-Spine | 02:44 | 02:45 | 95,810 | 83,326 | 1 min |
| `5dc4f9b4` | Parcel-Canonical | 02:45 | 02:49 | 83,326 | 83,326 | 4 min |
| `9be830e5` | Imprv-S1 (improvement landing) | 02:49 | 03:01 | 83,326 | 83,326 | 12 min |
| `4dfa9610` | ImprvDetail-S1 sub-batch 1 | 03:01 | 03:12 | 83,326 | 83,326 | 11 min |
| `89c3ceeb` | ImprvDetail-S1 sub-batch 2 | 03:12 | 03:20 | 87,767 | 87,767 | 8 min |
| `66f89572` | ImprvDetail-S1 sub-batch 3 | 03:20 | 03:31 | 100,144 | 100,144 | 11 min |
| `98ef6028` | ImprvDetail-S1 sub-batch 4 (large) | 03:31 | 04:03 | 337,973 | 337,973 | 32 min |
| `3f72f51a` | ImprvAttr-S1 | 04:03 | 04:32 | 621,622 | 620,872 | 29 min |
| `576cd0d9` | Imprv-Truth | 04:32 | 04:34 | 100,144 | 100,144 | 2 min |
| `fe629fd2` | **Imprv-Canonical** | 04:34 | 05:09 | 100,144 | 100,144 | **35 min** |

All 12 batches: **COMPLETED**, ErrorSummary: **None**

---

## Gate Results

### ImprvAttr-S1 (batch `3f72f51a`)
| Gate | Status | Detail |
|---|---|---|
| `imprv-attr-aggregate` | PASS | considered=621,622 landed=620,872 quarantined=750 |
| `imprv-attr-distribution` | PASS | 621,622 rows, all known codes distributed |
| `provenance-coverage` | PASS | all 620,872 rows have load_batch_id + source_query_hash |
| `imprv-attr-key-uniqueness` | **FAIL** | 500 6-key tuples appeared more than once — PACS source data, non-blocking |
| `imprv-attr-dictionary-coverage` | **WARN** | 750 rows with code "Heat Pump" outside active dictionary; quarantined |

### Imprv-Truth (batch `576cd0d9`)
| Gate | Status | Detail |
|---|---|---|
| `truth-pacs-imprv-source-batches-completed` | PASS | both source batches COMPLETED |
| `truth-pacs-imprv-pre-conversion-share` | PASS | 0% pre-conversion (threshold ≤5%) |
| `truth-pacs-imprv-supp-aware-join` | PASS | noSuppPointer=0 staleSupNum=0 |
| `truth-pacs-imprv-promotion-coverage` | PASS | all 100,144 promoted rows carry full lineage |
| `truth-pacs-imprv-aggregate` | PASS | imprvValSum=$31,579,450,050 |
| `truth-pacs-imprv-universe-distribution` | PASS | AG=4,730 COMM=9,547 RES=85,867 |

### Imprv-Canonical (batch `fe629fd2`)
| Gate | Status | Detail |
|---|---|---|
| `canonical-imprv-source-batch-completed` | PASS | truth-pacs source batch COMPLETED |
| `canonical-imprv-parcel-xref-coverage` | PASS | considered=100,144 projected=100,144 quarantined=0 |
| `canonical-imprv-source-xref-coverage` | PASS | all 100,144 tf_improvement rows have source_xref |
| `canonical-imprv-county-isolation` | PASS | every tf_improvement has non-empty CountyId |
| `canonical-imprv-feature-coverage` | PASS | features=1,351,892; 99,930 with features, 214 without |
| `canonical-imprv-attribute-coverage` | PASS (informational) | considered=1,870,609 resolved=0 quarantined=1,870,609 |

**Canonical gate summary: 6/6 PASS** (no FAIL, no WARN)

---

## Known Non-Blocking Issues

### 1. `imprv-attr-key-uniqueness` FAIL — 500 duplicate 6-key tuples in PACS
PACS source table `imprv_attr` has 500 rows where `(prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id, i_attr_val_id)` is duplicated. This is a PACS data integrity issue. The gate FAILs by design but is non-blocking — duplicate rows are landed and downstream stages handle them by quarantine or dedup logic. Known from prior doctrine drains; per operator: do not treat as a blocker.

### 2. `imprv-attr-dictionary-coverage` WARN — 750 rows with "Heat Pump" code
750 ImprvAttr rows carry `i_attr_val_cd = 'Heat Pump'` which is not in the current active dictionary (`attribute_definition` table). These rows are quarantined to `legacy_tf_unproven.unresolved_imprv_attr`. Non-blocking; dictionary can be extended post-drain.

### 3. `canonical-imprv-attribute-coverage` — resolved=0, quarantined=1,870,609
The canonical projector resolved **0** of 1,870,609 attribute records. All went to quarantine. Root cause: `attribute_definition` table in `terrafusion_benton_demo` is not populated (the `ImprvAttrDictionaryRefreshHostedService` requires PACS connectivity at API startup; the demo DB was seeded without PACS live). Effect: all `tf_improvement_feature.AttributeId` values are NULL. The features themselves (1,351,892 rows) are correctly projected — AttributeId is a nullable FK by design. Resolution: run the attr dictionary refresh against PACS when needed, or populate via admin endpoint.

---

## Schema Fixes Applied During This Work Order

Three rounds of VARCHAR(32) overflow required three EF migrations before v4 succeeded:

| Migration | Fixed Column(s) | Root Cause |
|---|---|---|
| `WO_IMPROVEMENT_ImprvAttrValCd_Widen` | `legacy_pacs_raw.imprv_attr.IAttrValCd` 32→64 | PACS `i_attr_val_cd` up to 41 chars ("CS Controlled Atmosphere, Conditioned Air") |
| `WO_IMPROVEMENT_TfImprovementFeature_WidenCodes` | `canonical_tf.tf_improvement_feature`: FeatureCode, MethodCd, ClassCd, SubClassCd — all 32→64 | Canonical projector writes raw PACS codes; landing tier no longer truncates after fix #1 |
| `WO_IMPROVEMENT_UnprovenAttr_WidenCodes` | `legacy_tf_unproven.unresolved_imprv_attr.IAttrValCd`, `legacy_tf_unproven.unproven_imprv_attr_triage.RoutedToIAttrValCd`, `tf_workbench.workbench_commit_decision_link.RoutedToIAttrValCd` — all 32→64 | Canonical projector also writes quarantine and triage rows; those tables inherited old constraint |

**Failed attempts before fixes were complete:**
- **v1**: Failed at ImprvAttr-S1 — fix #1 applied
- **v2**: Failed at Imprv-Canonical — fix #2 applied
- **v3**: Failed at Imprv-Canonical (different columns) — fix #3 applied
- **v4**: SUCCESS ✅

---

## Benton Demo DB Progress Summary

| Lane | Status |
|---|---|
| Parcel | COMPLETE (v4 pre-stages) |
| Owner-WSDOR | COMPLETE (prior WO-DATA-FINALIZE-OWNER-002) |
| **Improvement** | **COMPLETE (this WO)** |
| Land | PENDING — not yet started |
| Sales | PENDING — not yet started |
| Geometry | PENDING — GEOM-011C hard-blocked |

---

## Next Steps (Operator Decision Required)

Per operating rules: do not start the next lane automatically. Operator must explicitly authorize:
1. **S3 snapshot** — `terrafusion_benton_demo_S3_post_improvement.dump` recommended before proceeding
2. **Land drain** — WO-DATA-FINALIZE-LAND-001 (not yet created)
3. **Sales drain** — WO-DATA-FINALIZE-SALES-001 (not yet created)
4. **Geometry** — GEOM-011C hard-blocked; separate operator decision required

---

*Evidence file written by TerraFusion Copilot — 2026-06-22*
