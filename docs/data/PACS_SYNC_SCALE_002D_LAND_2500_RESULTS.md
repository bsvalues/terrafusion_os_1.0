# WO-DATA-004B-SCALE-002D — Land Scale Drain TopN=2,500 Results

**Work Order:** WO-DATA-004B-SCALE-002D
**Date:** 2026-06-19
**Status:** COMPLETE — 2,666 landed, 2,666 promoted to truth, 2,666 canonicalized, 34/34 PASS, 0 quarantine.
**Prerequisite:** SCALE-002C accepted with explicit dup-tuple waiver (Codex re-review PASS)

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
**Proof:** drain succeeded with 2,666 rows landed — PACS unreachable would fail.
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

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/land`
**Body:**
```json
{
  "OperatorName": "claude-scale002d-land-2500-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 2500
}
```

---

## 6. Pre-Drain Counts

| Table | Count | Note |
|---|---|---|
| `legacy_pacs_raw.land_detail` | **1,060** | Pre-existing co-land from parcel drain (same pattern as owner) |
| `truth_pacs.land_current` | 0 | ✓ clean — no prior land promotion |
| `canonical_tf.tf_land` | 0 | ✓ clean |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ unchanged from SCALE-002C |

**Baselines (prior lanes — unchanged by this drain):**

| Table | Count |
|---|---|
| `canonical_tf.tf_parcel` | 2,500 |
| `canonical_tf.tf_owner` | 2,119 |
| `canonical_tf.tf_improvement` | 1,222 |
| `canonical_tf.tf_sale` | 0 |
| `sync_bridge.load_batch` | 31 |
| `sync_bridge.source_xref` | 8,340 |
| `sync_bridge.promotion_gate_result` | 135 |

**Note on pre-existing `legacy_pacs_raw.land_detail` = 1,060:** The parcel drain co-lands land_detail rows into `legacy_pacs_raw.land_detail` at the same time it lands parcel rows. This is the same co-landing pattern observed for `legacy_pacs_raw.owner` in SCALE-002B. The 1,060 raw rows existed before this drain; `truth_pacs.land_current=0` confirms none had been promoted yet.

---

## 7. Land Drain Response Payload

**HTTP status:** 200
```json
{
  "lane": "land",
  "status": "Succeeded",
  "batchIds": [
    "bb0b2d49-1c0a-47b5-a643-84f2238d6a60",
    "9ba3afd9-df4e-4917-a33b-2c8a809b5226",
    "0a0e0a08-47f9-4618-b718-cbf1d880daeb",
    "1a20f0f5-e690-49f5-a309-9a5c3ca92ea7",
    "8df313b0-bff5-4f76-8b58-19ef3f2c1412",
    "3d46cf0e-5e11-435f-9381-49d80f4ca124",
    "e66103b8-d213-4531-8964-86008814fb24",
    "6a17239d-8ee4-4456-968c-5b28e31b6ec3"
  ],
  "counts": {
    "rowsLanded": 2666,
    "rowsPromotedToTruth": 2666,
    "rowsCanonicalized": 2666,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 47.4406501,
  "gateSummary": {
    "totals": [{ "status": "PASS", "count": 34 }],
    "recentFailures": []
  },
  "quarantineDelta": { "before": 0, "after": 0, "delta": 0 },
  "nextRecommendedLane": "sales"
}
```

**Batch count:** 8 batches (TopN=2,500 parcels; 2,666 land rows = ~1.07 land records per parcel)

---

## 8. Post-Drain Counts and Deltas

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.land_detail` | 1,060 | **3,726** | +2,666 |
| `truth_pacs.land_current` | 0 | **2,666** | +2,666 |
| `canonical_tf.tf_land` | 0 | **2,666** | +2,666 |
| `sync_bridge.load_batch` | 31 | **39** | +8 |
| `sync_bridge.source_xref` | 8,340 | **11,006** | +2,666 |
| `sync_bridge.promotion_gate_result` | 135 | **169** | +34 (34 PASS) |

**Row count reconciliation:**

| Component | Count | Meaning |
|---|---|---|
| `rowsLanded` | 2,666 | Raw land_detail rows landed from PACS |
| `rowsPromotedToTruth` | 2,666 | `truth_pacs.land_current` rows |
| `rowsCanonicalized` | 2,666 | `canonical_tf.tf_land` rows = 1:1 with promoted |
| `rowsQuarantinedThisLane` | 0 | No quarantine |
| source_xref delta | +2,666 | Entity-level xrefs for land rows |

**Cumulative source_xref:** 11,006 = parcel(2,500) + assessment_wsdor(2,499) + owner(2,119) + improvement(1,222) + land(2,666)

**Pre-existing raw rows:** `legacy_pacs_raw.land_detail` was 1,060 before drain (co-landed by parcel drain). Drain added +2,666 additional land rows from PACS WSDOR expansion, bringing total to 3,726. The 2,666 promoted rows are the WSDOR-cross-joined set, not the raw 1,060 count — same cross-join expansion pattern as SCALE-002B owner-WSDOR.

---

## 9. Gate Summary

| Gate status | Count |
|---|---|
| PASS | **34** |
| WARN | 0 |
| FAIL | **0** |

No failing gates. Gate math: +34 results = 34 PASS ✓

**Duplicate tuple standing control:** Duplicate tuple baseline for SCALE-002 = 6 (established SCALE-002C waiver). This drain: no `imprv-attr-key-uniqueness` gate applies to land lane — gate is improvement-specific. No new dup-key gate appeared.

---

## 10. Runtime Log Proof — FullCorpus and TopN

**Primary proof — HTTP response payload (section 7):**

| Evidence | Proof |
|---|---|
| `"counts": {"rowsLanded": 2666}` | TopN=2,500 land drain produced 2,666 rows. Full corpus would yield tens of thousands. |
| `"rowsPromotedToTruth": 2666` | 1:1 with landed — all rows promoted. |
| `"status": "Succeeded"` | No partial drain or error. |

**Explicit negative checks:**

| Check | Result |
|---|---|
| `FullCorpus: true` present in request? | **No** — request body has `"FullCorpus": false` |
| `TopN: null` present in request? | **No** — request body has `"TopN": 2500` |

---

## 11. PACS Source Vintage Proof

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy, NOT `tf_mssql_data` original volume)

Established in SCALE-002A (source unchanged):

| Field | Value |
|---|---|
| `max_owner_tax_yr` | **2026** |
| `qualifying_rows` (owner_tax_yr >= 2024) | **289,166** |

---

## 12. Non-Land Lane Proof

| Table | Final Count | Expected |
|---|---|---|
| `canonical_tf.tf_parcel` | **2,500** | 2,500 ✓ (unchanged) |
| `canonical_tf.tf_improvement` | **1,222** | 1,222 ✓ (unchanged) |
| `canonical_tf.tf_owner` | **2,119** | 2,119 ✓ (unchanged) |
| `canonical_tf.tf_sale` | **0** | 0 ✓ (no sales drain) |
| `legacy_tf_unproven.unresolved_imprv_attr` | **0** | 0 ✓ (unchanged) |

---

## 13. Dev-Clean Isolation Proof

SELECT-only query run against `terrafusion_dev_clean` after SCALE-002D:

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
| Sales drain | NOT run |
| Geometry drain | NOT run |
| Parcel re-drain | NOT run |
| Owner-WSDOR re-drain | NOT run |
| Improvement re-drain | NOT run |
| FullCorpus drain | NOT run |
| Manual mutation SQL | NOT used — only SELECT-only verification |
| `terrafusion_dev_clean` DB | NOT touched |
| `tf_mssql_data` Docker volume | NOT touched |
| PACS source mutation | NOT performed — read-only contact only |
| Code changes | NOT made |
| DB reset | NOT performed |

---

## 15. Scale Comparison — SCALE-001D vs SCALE-002D

| Metric | SCALE-001D (TopN=500) | SCALE-002D (TopN=2,500) | Factor |
|---|---|---|---|
| TopN | 500 | 2,500 | 5× |
| Rows landed | ~533 (est) | 2,666 | ~5× |
| Rows promoted | ~533 (est) | 2,666 | ~5× |
| Rows canonicalized | ~533 (est) | 2,666 | ~5× |
| Gate count | 34 PASS | 34 PASS | same |
| Duration | ~9s (est) | 47.4s | ~5× |
| Quarantine | 0 | 0 | same |
| DUP_KEY events | 0 | 0 | same |

5× scale with proportional duration increase. Gate structure identical. No new failure modes.

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
| ENDPOINT | `POST /api/sync/doctrine/drain/land` |
| TOPN | 2,500 |
| FULL_CORPUS | false |
| ROWS_LANDED | 2,666 |
| ROWS_PROMOTED | 2,666 |
| ROWS_CANONICALIZED | 2,666 (1:1 land rows; source_xref delta = +2,666; cumulative source_xref = 11,006) |
| GATE_STATUS | 34/34 PASS, 0 WARN, 0 FAIL |
| QUARANTINE_STATUS | 0 (before=0, after=0, delta=0) |
| DUP_KEY_COUNT | 0 (land lane does not have imprv-attr-key-uniqueness gate; standing baseline = 6 from SCALE-002C) |
| NON_LAND_LANES | parcel/owner/improvement unchanged; sales = 0 ✓ (section 12) |
| DEV_CLEAN_TOUCHED | No — 83,326/83,687/61/137 unchanged ✓ (section 13) |
| ERRORS | None |
| DURATION | 47.4s |
| RUNTIME_LOG_STATUS | Serilog file sink = health heartbeats only; drain logs to stdout. Response payload is primary proof (section 10). |
| FULL_CORPUS_PROOF | rowsLanded=2,666 — consistent with TopN=2,500 land drain. Full corpus would be tens of thousands. |
| TOPN_PROOF | rowsLanded=2,666 matches TopN=2,500 parcel expansion. |
| PACS_VINTAGE | max_owner_tax_yr=2026, qualifying_rows=289,166 (established SCALE-002A). |
| SECRET_SCAN | CLEAN — no credentials or passwords in this document. |
| LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_002D_LAND_2500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-002E — sales drain TopN=1,000 |
