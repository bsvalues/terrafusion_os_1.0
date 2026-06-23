# WO-DATA-004B-SCALE-002E — Sales Scale Drain TopN=1,000 Results

**Work Order:** WO-DATA-004B-SCALE-002E
**Date:** 2026-06-19
**Status:** COMPLETE — 1,000 landed, 386 promoted to truth, 385 canonicalized, 30 PASS / 1 WARN / 0 FAIL, 1 quarantined sale row.
**Prerequisite:** SCALE-002D accepted (land TopN=2,500 PASS)

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
**Proof:** drain succeeded with 1,000 rows landed — PACS unreachable would fail.
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

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/sales`
**Body:**
```json
{
  "OperatorName": "claude-scale002e-sales-1000-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 1000
}
```

---

## 6. Pre-Drain Counts

| Table | Count | Gate check |
|---|---|---|
| `legacy_pacs_raw.sale` | 0 | ✓ clean |
| `truth_pacs.sale` | 0 | ✓ clean |
| `canonical_tf.tf_sale` | 0 | ✓ clean |
| `legacy_tf_unproven.sale` | 0 | ✓ clean |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ unchanged |

**Baselines (prior lanes — unchanged by this drain):**

| Table | Count |
|---|---|
| `canonical_tf.tf_parcel` | 2,500 |
| `canonical_tf.tf_improvement` | 1,222 |
| `canonical_tf.tf_owner` | 2,119 |
| `canonical_tf.tf_land` | 2,666 |
| `sync_bridge.load_batch` | 39 |
| `sync_bridge.source_xref` | 11,006 |
| `sync_bridge.promotion_gate_result` | 169 |

---

## 7. Sales Drain Response Payload

**HTTP status:** 200
```json
{
  "lane": "sales",
  "status": "Succeeded",
  "batchIds": [
    "2de22d15-b34b-42f4-a978-3ca14d7a7315",
    "2d9b9507-ecc4-490d-a14e-b9b1b8caecb8",
    "d44a5ad1-a761-40b1-9f9d-e2f919d512ab",
    "3cbede59-20cb-4c18-9ccc-aa21f59d5024",
    "9a663e3f-7564-4827-b945-d595ca099a60",
    "6512fca4-0632-4f89-a9c5-023aa10ca444",
    "94eae4fe-74c4-46a4-8ce9-59b6a91d6612"
  ],
  "counts": {
    "rowsLanded": 1000,
    "rowsPromotedToTruth": 386,
    "rowsCanonicalized": 385,
    "rowsQuarantinedThisLane": 1
  },
  "durationSec": 11.6417666,
  "gateSummary": {
    "totals": [
      { "status": "PASS", "count": 30 },
      { "status": "WARN", "count": 1 }
    ],
    "recentFailures": [
      {
        "loadBatchId": "d44a5ad1-a761-40b1-9f9d-e2f919d512ab",
        "gateName": "truth-pacs-supp-aware-join",
        "gateStage": "RAW_TO_TRUTH",
        "status": "WARN",
        "expected": "0",
        "actual": "210",
        "detail": "noSuppPointer=210 staleSupNum=0",
        "executedAt": "2026-06-19T19:25:38.335776Z"
      }
    ]
  },
  "quarantineDelta": { "before": 0, "after": 1, "delta": 1 },
  "nextRecommendedLane": "geometry"
}
```

**Batch count:** 7 batches

---

## 8. Post-Drain Counts and Deltas

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.sale` | 0 | **1,000** | +1,000 |
| `truth_pacs.sale` | 0 | **386** | +386 |
| `canonical_tf.tf_sale` | 0 | **385** | +385 |
| `legacy_tf_unproven.sale` | 0 | **1** | +1 |
| `canonical_tf.tf_parcel` | 2,500 | **2,872** | **+372** (see §8a) |
| `sync_bridge.load_batch` | 39 | **46** | +7 |
| `sync_bridge.source_xref` | 11,006 | **11,763** | +757 (see §8b) |
| `sync_bridge.promotion_gate_result` | 169 | **200** | +31 (30P + 1W) |

**Unchanged prior lanes:**

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_improvement` | 1,222 | No ✓ |
| `canonical_tf.tf_owner` | 2,119 | No ✓ |
| `canonical_tf.tf_land` | 2,666 | No ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | No ✓ |

---

## 8a. Parcel Auto-Canonicalization by Sales Lane

`canonical_tf.tf_parcel` increased from 2,500 → 2,872 (+372). This is expected design behavior, not contamination.

**Explanation:** The sales drain promotes sale records that may reference parcels outside the original TopN=2,500 parcel sample. When a promoted sale references a parcel not yet in `canonical_tf.tf_parcel`, the sales lane co-canonicalizes that parcel. This ensures every canonical sale row has a valid parcel foreign key.

**source_xref confirms:** After SCALE-002E, `source_xref` by entity type:

| Entity type | Count |
|---|---|
| parcel | **2,872** |
| land | 2,666 |
| assessment_wsdor | 2,499 |
| owner | 2,119 |
| improvement | 1,222 |
| sale | **385** |
| **Total** | **11,763** |

The 372 new parcel xrefs = parcels referenced by promoted sales that were outside the original sample. These are real Benton County parcels from PACS, not injected data.

**dev_clean is not affected:** `terrafusion_dev_clean.canonical_tf.tf_parcel` = 83,326 unchanged. The auto-canonicalized parcels went only to `terrafusion_scale_proof`.

---

## 8b. Row Count Reconciliation

| Component | Count | Meaning |
|---|---|---|
| `rowsLanded` | 1,000 | Raw sale rows from PACS |
| `rowsPromotedToTruth` | 386 | Rows passing doctrine qualification (DOR ratio + supplement join) |
| Not promoted | 614 | Filtered at RAW_TO_TRUTH — includes 210 noSuppPointer (WARN gate) + other qualification failures |
| `rowsCanonicalized` | 385 | `canonical_tf.tf_sale` rows = rowsPromotedToTruth(386) − quarantined(1) |
| `rowsQuarantinedThisLane` | 1 | 1 sale row in `legacy_tf_unproven.sale` |
| source_xref delta | +757 | = sale(+385) + new-parcel(+372) |
| `canonical_tf.tf_parcel` delta | +372 | Auto-canonicalized parcels referenced by promoted sales |

---

## 9. Gate Summary

| Gate status | Count |
|---|---|
| PASS | **30** |
| WARN | **1** |
| FAIL | **0** |

**WARN gate — `truth-pacs-supp-aware-join`:**

| Field | Value |
|---|---|
| gateName | `truth-pacs-supp-aware-join` |
| gateStage | `RAW_TO_TRUTH` |
| status | WARN |
| expected | 0 |
| actual | 210 |
| detail | `noSuppPointer=210 staleSupNum=0` |

**Assessment:** 210 of the 1,000 raw sale rows had no supplement pointer — the sales drain could not join them to a supplement record to determine qualification status. These rows were filtered out (not promoted to truth). This is a known PACS data characteristic for sales without supplement data. Gate status is WARN, not FAIL — no blocking condition. 0 FAIL gates. `staleSupNum=0` confirms no stale supplement numbers were encountered.

**Duplicate tuple standing control:** Baseline = 6 (improvement lane, SCALE-002C). No imprv-attr-key-uniqueness gate applies to sales lane. No dup-key gate appeared.

---

## 10. Runtime Log Proof — FullCorpus and TopN

**Primary proof — HTTP response payload (section 7):**

| Evidence | Proof |
|---|---|
| `"counts": {"rowsLanded": 1000}` | Exactly TopN=1,000 raw rows landed. Full corpus would yield thousands more. |
| `"rowsPromotedToTruth": 386` | Subset promoted after doctrine qualification — consistent with sales filtering behavior. |
| `"status": "Succeeded"` | No partial drain or error. |

**Explicit negative checks:**

| Check | Result |
|---|---|
| `FullCorpus: true` present in request? | **No** — request body has `"FullCorpus": false` |
| `TopN: null` present in request? | **No** — request body has `"TopN": 1000` |

---

## 11. PACS Source Vintage Proof

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy, NOT `tf_mssql_data` original volume)

Established in SCALE-002A (source unchanged):

| Field | Value |
|---|---|
| `max_owner_tax_yr` | **2026** |
| `qualifying_rows` (owner_tax_yr >= 2024) | **289,166** |

---

## 12. Non-Sales Lane Proof

| Table | Final Count | Expected |
|---|---|---|
| `canonical_tf.tf_improvement` | **1,222** | 1,222 ✓ (unchanged) |
| `canonical_tf.tf_owner` | **2,119** | 2,119 ✓ (unchanged) |
| `canonical_tf.tf_land` | **2,666** | 2,666 ✓ (unchanged) |
| `legacy_tf_unproven.unresolved_imprv_attr` | **0** | 0 ✓ (unchanged) |

**Note:** `canonical_tf.tf_parcel` = 2,872 (was 2,500). The +372 increase is from sale-referenced parcel auto-canonicalization (§8a) — not a prior-lane re-drain.

---

## 13. Dev-Clean Isolation Proof

SELECT-only query run against `terrafusion_dev_clean` after SCALE-002E:

| Table | Count | Pre-SCALE-002 Baseline | Changed? |
|---|---|---|---|
| `canonical_tf.tf_parcel` | **83,326** | 83,326 | No ✓ |
| `truth_pacs.parcel_spine` | **83,687** | 83,687 | No ✓ |
| `canonical_tf.tf_sale` | **61** | 61 | No ✓ |
| `canonical_tf.tf_land` | **137** | 137 | No ✓ |

---

## 14. Scope Exclusions — What Was NOT Run

| Operation | Status |
|---|---|
| Geometry drain | NOT run |
| Parcel re-drain | NOT run |
| Owner-WSDOR re-drain | NOT run |
| Improvement re-drain | NOT run |
| Land re-drain | NOT run |
| FullCorpus drain | NOT run |
| Manual mutation SQL | NOT used — only SELECT-only verification |
| `terrafusion_dev_clean` DB | NOT touched |
| `tf_mssql_data` Docker volume | NOT touched |
| PACS source mutation | NOT performed — read-only contact only |
| Code changes | NOT made |
| DB reset | NOT performed |

---

## 15. Scale Comparison — SCALE-001E vs SCALE-002E

| Metric | SCALE-001E (TopN=500) | SCALE-002E (TopN=1,000) | Factor |
|---|---|---|---|
| TopN | 500 | 1,000 | 2× |
| Rows landed | 500 (est) | 1,000 | 2× |
| Rows promoted | ~193 (est) | 386 | ~2× |
| Gate count | 30P / 1W (est) | 30P / 1W | same |
| noSuppPointer | ~105 (est) | 210 | ~2× — proportional |
| Quarantine | ~0-1 (est) | 1 | same class |
| Duration | ~6s (est) | 11.6s | ~2× |

2× scale with proportional row and filter counts. noSuppPointer=210 at 2× TopN is consistent with proportional scaling from SCALE-001E.

---

## 16. Secret Scan

**Checked for literals (patterns searched — not reproduced here):**

| Pattern class | Result |
|---|---|
| Dev Postgres password literal | **Not present** ✓ |
| PACS SA password literal | **Not present** ✓ |
| Postgres env var with literal value | **Not present** ✓ |
| Connection string with literal value | **Not present** ✓ |

No credentials or secrets in this document.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/sales` |
| TOPN | 1,000 |
| FULL_CORPUS | false |
| ROWS_LANDED | 1,000 |
| ROWS_PROMOTED | 386 (614 filtered — 210 noSuppPointer via WARN gate, remainder via doctrine qualification) |
| ROWS_CANONICALIZED | 385 (rowsPromotedToTruth=386 − 1 quarantined = 385) |
| GATE_STATUS | 30 PASS / 1 WARN (truth-pacs-supp-aware-join, noSuppPointer=210) / 0 FAIL |
| QUARANTINE_STATUS | 1 row in `legacy_tf_unproven.sale` |
| PARCEL_AUTO_CANON | +372 parcels auto-canonicalized (sale-referenced parcels outside original TopN=2,500 sample — expected, see §8a) |
| SOURCE_XREF_DELTA | +757 = sale(+385) + new-parcel(+372). Cumulative = 11,763. |
| DUP_KEY_COUNT | N/A — no imprv-attr-key-uniqueness gate on sales lane. Standing baseline = 6. |
| NON_SALES_LANES | improvement/owner/land unchanged ✓ (section 12). tf_parcel +372 explained by §8a. |
| DEV_CLEAN_TOUCHED | No — 83,326/83,687/61/137 unchanged ✓ (section 13) |
| ERRORS | None |
| DURATION | 11.6s |
| RUNTIME_LOG_STATUS | Serilog file sink = health heartbeats only; drain logs to stdout. Response payload is primary proof (section 10). |
| FULL_CORPUS_PROOF | rowsLanded=1,000 exactly matches TopN=1,000 request. Full corpus would yield thousands more. |
| TOPN_PROOF | rowsLanded=1,000 matches TopN=1,000 request body. |
| PACS_VINTAGE | max_owner_tax_yr=2026, qualifying_rows=289,166 (established SCALE-002A). |
| SECRET_SCAN | CLEAN — no credentials or passwords in this document. |
| LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_002E_SALES_1000_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-002 complete (geometry excluded by design). Proceed to SCALE-002 milestone PR. |
