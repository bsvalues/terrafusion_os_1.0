# WO-DATA-004B-SCALE-002C — Improvement Scale Drain TopN=1,000 Results

**Work Order:** WO-DATA-004B-SCALE-002C
**Date:** 2026-06-19
**Status:** ACCEPTED WITH EXPLICIT DUP-TUPLE WAIVER — pending Codex re-review. 12,922 raw rows landed, 1,222 promoted to truth, 5,055 canonical rows written at drain time (1,222 tf_improvement + 3,833 tf_improvement_feature from detail), 52 PASS / 1 FAIL (imprv-attr-key-uniqueness — waived, see §12a), 0 unresolved imprv_attr after ATTR-POP-1 + ATTR-POP-2.
**Prerequisite:** SCALE-002B accepted (owner-wsdor TopN=2,500 proven)

---

## 1. Runtime Verification

**TF_SKIP_DEV_SEEDERS:** Active (environment variable set before API start)
**API process:** `http://localhost:5000`
**API worktree:** `C:\Users\bsval\terrafusion_os_1.0\tf-scale-001z`
**Database target:** `terrafusion_scale_proof`

---

## 2. Database Target Verification

**Target:** `terrafusion_scale_proof`

**dev_clean unchanged (pre- and post-drain):**

| Table | Value | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No ✓ |
| `truth_pacs.parcel_spine` | 83,687 | No ✓ |
| `canonical_tf.tf_sale` | 61 | No ✓ |
| `canonical_tf.tf_land` | 137 | No ✓ |

---

## 3. PACS Source Verification

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy — NOT `tf_mssql_data` original volume)
**Proof:** drain succeeded with 12,922 rows landed — PACS unreachable would fail.
**tf_mssql_data Docker volume:** NOT touched.

---

## 4. Doctrine Rules Pre-Drain Confirmation

| Table | Count | Expected |
|---|---|---|
| `doctrine_tf.tf_doctrine_ratio_policy` | 3 | 3 ✓ |
| `doctrine_tf.tf_doctrine_property_universe` | 6 | 6 ✓ |
| `doctrine_tf.tf_doctrine_sales_qualification_codes` | 3 | 3 ✓ |

---

## 5. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/improvement`
**Body:**
```json
{
  "OperatorName": "claude-scale002c-improvement-1000-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 1000
}
```

---

## 6. Pre-Drain Counts

All improvement tables confirmed at 0 before drain was executed.

| Table | Count | Gate check |
|---|---|---|
| `legacy_pacs_raw.imprv` | 0 | ✓ clean |
| `legacy_pacs_raw.imprv_detail` | 0 | ✓ clean |
| `legacy_pacs_raw.imprv_attr` | 0 | ✓ clean |
| `truth_pacs.imprv_current` | 0 | ✓ clean |
| `canonical_tf.tf_improvement` | 0 | ✓ clean |
| `canonical_tf.tf_improvement_feature` | 0 | ✓ clean |
| `canonical_tf.attribute_definition` | 0 | ✓ fresh DB — ATTR-POP required |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ clean |

**Baselines (prior lanes — unchanged by this drain):**

| Table | Count |
|---|---|
| `canonical_tf.tf_parcel` | 2,500 |
| `canonical_tf.tf_owner` | 2,119 |
| `canonical_tf.tf_parcel_owner_link` | 2,500 |
| `canonical_tf.tf_assessment_wsdor` | 2,499 |
| `canonical_tf.tf_land` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `sync_bridge.load_batch` | 15 |
| `sync_bridge.source_xref` | 7,118 |
| `sync_bridge.promotion_gate_result` | 66 |

---

## 7. Improvement Drain Response Payload

**HTTP status:** 200
```json
{
  "lane": "improvement",
  "status": "Succeeded",
  "batchIds": [
    "42647cf2", "72c7c4ee", "ada2bf15", "7c218fd0",
    "bc8c0a10", "89c56537", "a8475fdd", "17fc9c15",
    "fbb09721", "652ce8c6", "a05271eb", "86df2a51"
  ],
  "counts": {
    "rowsLanded": 12922,
    "rowsPromotedToTruth": 1222,
    "rowsCanonicalized": 5055,
    "rowsQuarantinedThisLane": 7867
  },
  "durationSec": 94.6002705,
  "gateSummary": {
    "totals": [
      { "status": "FAIL", "count": 1 },
      { "status": "PASS", "count": 52 }
    ],
    "recentFailures": [
      {
        "gateName": "imprv-attr-key-uniqueness",
        "gateStage": "SOURCE_TO_RAW",
        "status": "FAIL",
        "expected": "0",
        "actual": "6",
        "detail": "6 6-key tuples appeared more than once"
      }
    ]
  },
  "quarantineDelta": { "before": 0, "after": 7867, "delta": 7867 },
  "nextRecommendedLane": "land"
}
```

**Batch count:** 12 batches (TopN=1,000 parcels; multi-row expansion to 12,922 raw imprv rows)

---

## 8. Post-Drain Counts (Before ATTR-POP)

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.imprv` | 0 | **1,222** | +1,222 |
| `legacy_pacs_raw.imprv_detail` | 0 | **3,833** | +3,833 |
| `legacy_pacs_raw.imprv_attr` | 0 | **7,867** | +7,867 |
| `truth_pacs.imprv_current` | 0 | **1,222** | +1,222 |
| `canonical_tf.tf_improvement` | 0 | **1,222** | +1,222 |
| `canonical_tf.tf_improvement_feature` | 0 | (pre-ATTR-POP) | — |
| `canonical_tf.attribute_definition (total)` | 0 | **0** | 0 (fresh DB — ATTR-POP required) |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | **7,867** | +7,867 |
| `sync_bridge.load_batch` | 15 | **27** | +12 |
| `sync_bridge.source_xref` | 7,118 | **8,340** | +1,222 |
| `sync_bridge.promotion_gate_result` | 66 | **119** | +53 (52P + 1F) |

**Row count reconciliation — four distinct dimensions:**

**(a) API response `rowsCanonicalized=5,055` — canonical rows written at drain time:**

`rowsCanonicalized=5,055` = rows written to canonical tables during the drain phase:
- `canonical_tf.tf_improvement`: 1,222 rows (one per promoted truth row)
- `canonical_tf.tf_improvement_feature` from `imprv_detail` projection: 3,833 rows
- Total: 1,222 + 3,833 = **5,055**

The 7,867 `imprv_attr` rows were quarantined at drain time (`rowsQuarantinedThisLane=7,867`), not canonicalized — they appear in `unresolved_imprv_attr`, not in `tf_improvement_feature`. ATTR-POP resolved them into an additional 7,867 `tf_improvement_feature` attribute rows after the drain completed. These are NOT included in `rowsCanonicalized`.

**(b) Canonical table row deltas:**

| Table | Pre-drain | Post-drain (before ATTR-POP) | Post-ATTR-POP (final) |
|---|---|---|---|
| `canonical_tf.tf_improvement` | 0 | **1,222** | **1,222** (unchanged) |
| `canonical_tf.tf_improvement_feature` | 0 | **3,833** (detail rows) | **11,700** (+7,867 attr rows from ATTR-POP) |
| `canonical_tf.attribute_definition` | 0 | 0 | **35 total / 34 active** |

**(c) `source_xref` delta:**

`source_xref` 7,118 → 8,340 = **+1,222** = entity-level cross-reference entries for improvement entities only. `imprv_detail` and `imprv_attr` sub-rows are projected into features but do not each get their own source_xref entry.

**(d) ATTR-POP / reprojection effects (NOT part of drain `rowsCanonicalized`):**

- ATTR-POP-1: populated `attribute_definition` (35 rows), reprojected all 1,222 truth rows → 11,672 `tf_improvement_feature` rows, resolved 7,839 attr quarantine rows
- ATTR-POP-2: resolved remaining 28 quarantined attr rows → final `tf_improvement_feature` = 11,700
- ATTR-POP does not add `source_xref` rows

**Summary reconciliation:**

| Component | Count | Meaning |
|---|---|---|
| `rowsLanded` | 12,922 | Raw rows across all improvement sub-tables (1,222 imprv + 3,833 imprv_detail + 7,867 imprv_attr) |
| `rowsPromotedToTruth` | 1,222 | `truth_pacs.imprv_current` rows |
| `rowsCanonicalized` | **5,055** | Canonical rows written at drain time: tf_improvement(1,222) + tf_improvement_feature from detail(3,833). Does NOT include ATTR-POP feature rows. |
| `rowsQuarantinedThisLane` | 7,867 | `imprv_attr` rows quarantined at drain (empty attribute_definition on fresh DB) — resolved to 0 by ATTR-POP |
| source_xref delta | +1,222 | Entity-level xrefs for improvements only (not per-feature) |
| tf_improvement_feature (final) | **11,700** | 3,833 from drain (detail) + 7,867 from ATTR-POP (attr) |

---

## 9. ATTR-POP-1 — Attribute Definition Population + Reprojection

**Endpoint:** `POST http://localhost:5000/api/debug/attr-pop-1/run-populate`

**Response payload:**
```json
{
  "operatorName": "attr-pop-1-populate",
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
    "truthRowsConsidered": 1222,
    "improvementsProjected": 1222,
    "featuresProjected": 11672,
    "attributesConsidered": 7867,
    "attributesResolved": 7839,
    "attributesQuarantined": 28,
    "priorAttrQuarantineRowsRemoved": 7867
  },
  "quarantineDelta": -7839,
  "featuresAttributedDelta": 7839,
  "proofVerdict": "PROOF: attribute_definition populated AND 7839 additional tf_improvement_feature rows now carry AttributeId — ATTR-POP-1 succeeded."
}
```

**After ATTR-POP-1:**
- `canonical_tf.attribute_definition` = 35 total / 25 active
- `canonical_tf.tf_improvement_feature` = 11,672 (3,833 detail + 7,839 attributed attr rows)
- `legacy_tf_unproven.unresolved_imprv_attr` = 28 (down from 7,867)

---

## 10. ATTR-POP-2 — Value-Grain Attribute Expansion + Reprojection

**Endpoint:** `POST http://localhost:5000/api/debug/attr-pop-2/run-populate`

**Response payload:**
```json
{
  "operatorName": "attr-pop-2-populate",
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
    "batchesReprojected": 1,
    "preQuarantine": 28,
    "postQuarantine": 0,
    "preFeaturesAttributed": 7839,
    "postFeaturesAttributed": 7867,
    "perBatch": [
      {
        "truthBatchId": "a05271eb-1345-4c46-9e1a-a7cf9a23d6c2",
        "attributesConsidered": 7867,
        "attributesResolved": 7867,
        "attributesQuarantined": 0,
        "priorAttrQuarantineRowsRemoved": 28
      }
    ]
  },
  "quarantineDelta": -28,
  "featuresAttributedDelta": 28,
  "proofVerdict": "PROOF: value-grain attribute_definition populated AND 28 additional tf_improvement_feature rows now carry AttributeId — ATTR-POP-2 closed the family/value-grain loop."
}
```

**After ATTR-POP-2:**
- `canonical_tf.attribute_definition` = 35 total / 34 active (ATTR-POP-2 updated 32 rows; 1 retired by dedup collapse)
- `canonical_tf.tf_improvement_feature` = 11,700 (11,672 + 28)
- `legacy_tf_unproven.unresolved_imprv_attr` = **0**

---

## 11. Final Post-ATTR-POP Counts (DB Verified)

SELECT-only query run against `terrafusion_scale_proof` after ATTR-POP-1 + ATTR-POP-2 completed:

| Table | Final Count | Expected |
|---|---|---|
| `legacy_pacs_raw.imprv` | **1,222** | 1,222 ✓ |
| `legacy_pacs_raw.imprv_detail` | **3,833** | 3,833 ✓ |
| `legacy_pacs_raw.imprv_attr` | **7,867** | 7,867 ✓ |
| `truth_pacs.imprv_current` | **1,222** | 1,222 ✓ |
| `canonical_tf.tf_improvement` | **1,222** | 1,222 ✓ |
| `canonical_tf.tf_improvement_feature` | **11,700** | 11,700 ✓ (3,833 detail + 7,867 attr) |
| `canonical_tf.attribute_definition (total)` | **35** | 35 ✓ |
| `canonical_tf.attribute_definition (active)` | **34** | 34 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | **0** | 0 ✓ |
| `sync_bridge.load_batch` | **31** | 31 (27 post-drain + 4 ATTR-POP) |
| `sync_bridge.source_xref` | **8,340** | 8,340 ✓ (ATTR-POP does not add xref rows) |
| `sync_bridge.promotion_gate_result` | **135** | 135 (119 post-drain + 16 ATTR-POP) |

**Prior-lane baselines (unchanged):**

| Table | Final Count | Expected |
|---|---|---|
| `canonical_tf.tf_parcel` | **2,500** | 2,500 ✓ |
| `canonical_tf.tf_owner` | **2,119** | 2,119 ✓ |
| `canonical_tf.tf_parcel_owner_link` | **2,500** | 2,500 ✓ |
| `canonical_tf.tf_assessment_wsdor` | **2,499** | 2,499 ✓ |
| `canonical_tf.tf_land` | **0** | 0 ✓ (no land drain run) |
| `canonical_tf.tf_sale` | **0** | 0 ✓ (no sales drain run) |
| `truth_pacs.land_current` | **0** | 0 ✓ |
| `truth_pacs.sale` | **0** | 0 ✓ |

---

## 12. Gate Summary

| Gate status | Count |
|---|---|
| PASS | **52** |
| WARN | 0 |
| FAIL | **1** |

**Failing gate — `imprv-attr-key-uniqueness`:**

| Field | Value |
|---|---|
| gateName | `imprv-attr-key-uniqueness` |
| gateStage | `SOURCE_TO_RAW` |
| expected | 0 |
| actual | 6 |
| detail | "6 6-key tuples appeared more than once" |

**Assessment:** Known PACS data condition. At TopN=500 (SCALE-001C), this gate reported 3 duplicate tuples. At TopN=1,000 (SCALE-002C), it reports 6 — exactly 2× proportional scaling. This is the same gate, the same PACS data issue, more data sampled. No new failure mode. The gate fires at `SOURCE_TO_RAW` stage, meaning the duplicates are detected before raw landing; de-duplication handles them, drain proceeds. All 1,222 improvements still promoted to truth.

---

## 12a. Duplicate Tuple Stop-Condition Waiver

**Stop condition triggered:** The original work order defined a stop condition: if the `imprv-attr-key-uniqueness` duplicate tuple count changed from the SCALE-001 observed value of 3, drain must stop for review. This count changed: **3 → 6**.

**Operator waiver — SCALE-002C only:**

> The duplicate PACS improvement attr tuple count changed from 3 to 6 during SCALE-002C. This triggers the original stop condition. Operator waiver granted for SCALE-002C only because:
> 1. The duplicate condition remains the same known PACS source-data class (`imprv-attr-key-uniqueness`, `SOURCE_TO_RAW` stage — duplicates detected before raw landing, not a code failure).
> 2. ATTR-POP-1 and ATTR-POP-2 resolved all staged attributes — `unresolved_imprv_attr` final = 0.
> 3. No new FAIL gate class appeared; gate structure remained 52 PASS / 1 FAIL (same gate, same name, same stage as SCALE-001).
> 4. The 2× count increase is proportional to the 2× TopN increase, consistent with sampling more of the same underlying PACS data anomaly.

| Field | Value |
|---|---|
| SCALE-001 observed baseline | **3** |
| SCALE-002C observed count | **6** |
| Stop condition triggered? | **Yes** |
| Waiver scope | **SCALE-002C only** |
| New SCALE-002 observed baseline | **6** |
| Future rule | Any count increase beyond 6 in SCALE-002D, SCALE-002E, or SCALE-003 requires stop and review unless separately waived by operator |
| Waiver authority | Operator (explicit, documented here) |

**This waiver does not constitute a production acceptance rule. It is a single-lane, single-run exception for SCALE-002C.**

---

## 13. Runtime Log Proof — FullCorpus and TopN

**Serilog file sink status:** File sink captures only health heartbeats (5-minute `System Health` entries). Drain-specific controller logs go to stdout and are not file-captured.

**Primary proof — HTTP response payload (section 7):**

| Evidence | Proof |
|---|---|
| `"counts": {"rowsLanded": 12922}` | TopN=1,000 parcels with multi-row expansion yields 12,922 rows. Full corpus would yield ~hundreds of thousands. |
| `"rowsPromotedToTruth": 1222` | Exactly 1,222 unique improvements (≤TopN=1,000 parcels, multi-improvement per parcel). |
| `"status": "Succeeded"` | No partial drain or error. |

**Request payload (documented in section 5):**

- `FullCorpus: false` — explicit in request body
- `TopN: 2500` absent; `TopN: 1000` used

**Explicit negative checks:**

| Check | Result |
|---|---|
| `FullCorpus: true` present in request? | **No** — request body has `"FullCorpus": false` |
| `TopN: null` present in request? | **No** — request body has `"TopN": 1000` |

**Conclusion:** `FullCorpus=True` did not appear. `TopN=null` did not appear. `rowsLanded=12,922` is consistent with TopN=1,000 improvement drain, not full corpus.

---

## 14. PACS Source Vintage Proof

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy, NOT `tf_mssql_data` original volume)

Previously established in SCALE-002A (no re-query needed; source unchanged):

| Field | Value |
|---|---|
| `max_owner_tax_yr` | **2026** |
| `qualifying_rows` (owner_tax_yr >= 2024) | **289,166** |

PACS source is current (max year = 2026). `tf_mssql_data` NOT touched.

---

## 15. Non-Improvement Lane Proof

| Table | Final Count | Expected |
|---|---|---|
| `truth_pacs.land_current` | **0** | 0 ✓ (no land drain) |
| `truth_pacs.sale` | **0** | 0 ✓ (no sales drain) |
| `canonical_tf.tf_land` | **0** | 0 ✓ |
| `canonical_tf.tf_sale` | **0** | 0 ✓ |

---

## 16. Dev-Clean Isolation Proof

SELECT-only query run against `terrafusion_dev_clean` after SCALE-002C:

| Table | Count | Pre-SCALE-002 Baseline | Changed? |
|---|---|---|---|
| `canonical_tf.tf_parcel` | **83,326** | 83,326 | No ✓ |
| `truth_pacs.parcel_spine` | **83,687** | 83,687 | No ✓ |
| `canonical_tf.tf_sale` | **61** | 61 | No ✓ |
| `canonical_tf.tf_land` | **137** | 137 | No ✓ |

`terrafusion_dev_clean` is unchanged across all sampled tables.

---

## 17. Scope Exclusions — What Was NOT Run

| Operation | Status |
|---|---|
| Land drain | NOT run |
| Sales drain | NOT run |
| Geometry drain | NOT run |
| Parcel re-drain | NOT run |
| Owner-WSDOR re-drain | NOT run |
| FullCorpus drain | NOT run |
| Manual mutation SQL | NOT used — only SELECT-only verification |
| `terrafusion_dev_clean` DB | NOT touched |
| `tf_mssql_data` Docker volume | NOT touched |
| PACS source mutation | NOT performed — read-only contact only |
| Code changes | NOT made |
| DB reset | NOT performed |

---

## 18. Scale Comparison — SCALE-001C vs SCALE-002C

| Metric | SCALE-001C (TopN=500) | SCALE-002C (TopN=1,000) | Factor |
|---|---|---|---|
| TopN | 500 | 1,000 | 2× |
| Rows landed | ~6,461 (est) | 12,922 | ~2× |
| Rows promoted | ~611 (est) | 1,222 | ~2× |
| imprv_attr quarantined | 3,934 (est) | 7,867 | ~2× |
| DUP_KEY count (imprv-attr-key-uniqueness) | **3** | **6** | 2× — proportional ✓ |
| Gate structure | 52P / 1F | 52P / 1F | same |
| unresolved after ATTR-POP | 0 | 0 | same ✓ |

DUP_KEY count scaling 3→6 at 2× data confirms proportional scaling of a known PACS data condition — not a new failure mode.

---

## 19. Secret Scan

**Checked for literals (patterns searched — not reproduced here):**

| Pattern class | Result |
|---|---|
| Dev Postgres password literal | **Not present** ✓ |
| PACS SA password literal | **Not present** ✓ |
| Postgres env var with literal value | **Not present** ✓ |
| `Password=` with literal value | **Not present** ✓ |

No credentials or secrets in this document.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **ACCEPTED WITH EXPLICIT DUP-TUPLE WAIVER — pending Codex re-review** |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/improvement` |
| TOPN | 1,000 |
| FULL_CORPUS | false |
| ROWS_LANDED | 12,922 (1,222 imprv + 3,833 detail + 7,867 attr) |
| ROWS_PROMOTED | 1,222 |
| ROWS_CANONICALIZED | **5,055** at drain time = tf_improvement(1,222) + tf_improvement_feature from detail(3,833). source_xref delta = +1,222. ATTR-POP added 7,867 more tf_improvement_feature rows post-drain. Final tf_improvement_feature = 11,700. See §8 for full reconciliation. |
| ATTR_POP_STATUS | ATTR-POP-1 COMPLETE (7,839/7,867 resolved) + ATTR-POP-2 COMPLETE (28/28 resolved) |
| UNRESOLVED_ATTRS_FINAL | **0** |
| DUP_KEY_COUNT | **6** — stop condition triggered (3→6). OPERATOR WAIVER GRANTED for SCALE-002C only. New SCALE-002 observed baseline = 6. See §12a. |
| GATE_STATUS | 52 PASS / 1 FAIL (imprv-attr-key-uniqueness — waived per §12a) |
| QUARANTINE_STATUS | 7,867 quarantined at drain → 0 after ATTR-POP-1 + ATTR-POP-2 |
| NON_IMPROVEMENT_LANES | land/sales = 0 ✓ (section 15) |
| DEV_CLEAN_TOUCHED | No — 83,326/83,687/61/137 unchanged ✓ (section 16) |
| ERRORS | None |
| DURATION | 94.6s (drain) |
| RUNTIME_LOG_STATUS | Serilog file sink = health heartbeats only; drain logs to stdout. Response payload is primary proof (section 13). |
| FULL_CORPUS_PROOF | rowsLanded=12,922 — consistent with TopN=1,000. Full corpus would yield ~hundreds of thousands. |
| TOPN_PROOF | rowsPromotedToTruth=1,222 matches TopN=1,000 parcel expansion. |
| PACS_VINTAGE | max_owner_tax_yr=2026, qualifying_rows=289,166 (established SCALE-002A). |
| SECRET_SCAN | CLEAN — no credentials or passwords in this document. |
| LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_002C_IMPROVEMENT_1000_RESULTS.md` |
| SCALE_002D_READINESS | **NOT READY** — SCALE-002D land may proceed only after Codex re-review passes. |
