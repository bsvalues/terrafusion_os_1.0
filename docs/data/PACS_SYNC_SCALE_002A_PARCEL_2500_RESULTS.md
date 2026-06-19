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

## 13. Runtime Log Proof — FullCorpus and TopN

**Serilog file sink status:** The file sink (`logs/terrafusion-20260619.log`) captures only health heartbeats (5-minute `System Health` entries). Drain-specific controller and service logs go to stdout/console and are not written to the file sink. No drain-level log lines are available in the file.

**Primary proof — HTTP response payload (section 8):**

The response payload provides authoritative proof of runtime parameters:

| Evidence | Proof |
|---|---|
| `"counts": {"rowsLanded": 2500}` | Exactly TopN=2,500 rows were landed. Full corpus = 89,247 parcels — if FullCorpus were true, landed count would be 89,247, not 2,500. |
| `"quarantineDelta": {"before": 0, "after": 0}` | Confirms single-lane parcel drain only; no cross-lane contamination. |
| `"nextRecommendedLane": "owner-wsdor"` | Drain engine correctly identified parcel as the completed lane. |
| `"status": "Succeeded"` | No partial-drain or error that could distort row counts. |

**Request payload (documented in section 6):**

```json
{
  "OperatorName": "claude-scale002a-parcel-2500-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 2500
}
```

`FullCorpus: false` and `TopN: 2500` were explicit in the request body sent to the drain endpoint. The response `rowsLanded: 2500` is consistent with and confirms these parameters.

**Conclusion:** `FullCorpus=True` and `TopN=null` did NOT appear for this drain. The 2,500 row landed count is deterministic proof — full corpus would produce ~89,247 rows, not 2,500.

---

## 14. PACS Source Vintage Proof

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy — `pacs_oltp_verify`, NOT `tf_mssql_data` original volume)

**SELECT-only query run against pacs_oltp_verify (no mutation):**

```sql
SELECT MAX(owner_tax_yr) as max_owner_tax_yr, COUNT(*) as qualifying_rows
FROM owner
WHERE owner_tax_yr >= 2024;
```

**Result:**

| Field | Value |
|---|---|
| `max_owner_tax_yr` | **2026** |
| `qualifying_rows` (owner_tax_yr >= 2024) | **289,166** |

**Conclusion:** PACS source is current (max year = 2026), contains qualifying rows, and is the `pacs_oltp_verify` D: copy. `tf_mssql_data` Docker volume was not touched.

---

## 15. Non-Parcel Truth-Table Proof (Post-Drain SELECT)

**SELECT-only query run against terrafusion_scale_proof after drain:**

```sql
SELECT 'truth_pacs.owner_current', COUNT(*) FROM truth_pacs.owner_current
UNION ALL SELECT 'truth_pacs.imprv_current', COUNT(*) FROM truth_pacs.imprv_current
UNION ALL SELECT 'truth_pacs.land_current', COUNT(*) FROM truth_pacs.land_current
UNION ALL SELECT 'truth_pacs.sale', COUNT(*) FROM truth_pacs.sale
UNION ALL SELECT 'truth_pacs.parcel_spine', COUNT(*) FROM truth_pacs.parcel_spine;
```

**Result:**

| Table | Count | Expected |
|---|---|---|
| `truth_pacs.owner_current` | **0** | 0 ✓ (no owner drain run) |
| `truth_pacs.imprv_current` | **0** | 0 ✓ (no improvement drain run) |
| `truth_pacs.land_current` | **0** | 0 ✓ (no land drain run) |
| `truth_pacs.sale` | **0** | 0 ✓ (no sales drain run) |
| `truth_pacs.parcel_spine` | **2,500** | 2,500 ✓ (parcel lane result) |

---

## 16. Scope Explicitness — What Was Not Run

The following operations were NOT performed during or after the SCALE-002A parcel drain:

| Operation | Status |
|---|---|
| Owner-WSDOR drain | NOT run |
| Improvement drain | NOT run |
| Land drain | NOT run |
| Sales drain | NOT run |
| Geometry drain | NOT run |
| ATTR-POP-1 / ATTR-POP-2 | NOT run |
| Attr-drain-1 | NOT run |
| Manual mutation SQL | NOT used — only SELECT-only verification after drain |
| `terrafusion_dev_clean` DB | NOT touched |
| `tf_mssql_data` Docker volume | NOT touched |
| PACS source mutation | NOT performed — read-only PACS contact only |

---

## 17. Dev-Clean Isolation Proof (Strengthened)

**SELECT-only query run against terrafusion_dev_clean after SCALE-002A drain:**

```sql
SELECT 'canonical_tf.tf_parcel', COUNT(*) FROM canonical_tf.tf_parcel
UNION ALL SELECT 'truth_pacs.parcel_spine', COUNT(*) FROM truth_pacs.parcel_spine
UNION ALL SELECT 'canonical_tf.tf_sale', COUNT(*) FROM canonical_tf.tf_sale
UNION ALL SELECT 'canonical_tf.tf_land', COUNT(*) FROM canonical_tf.tf_land;
```

**Result:**

| Table | Count | Pre-SCALE-002 Baseline | Changed? |
|---|---|---|---|
| `canonical_tf.tf_parcel` | **83,326** | 83,326 | No ✓ |
| `truth_pacs.parcel_spine` | **83,687** | 83,687 | No ✓ |
| `canonical_tf.tf_sale` | **61** | 61 | No ✓ |
| `canonical_tf.tf_land` | **137** | 137 | No ✓ |

`terrafusion_dev_clean` is unchanged across all sampled tables.

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
| NON_PARCEL_LANES | All unchanged — owner/improvement/land/sale = 0 ✓ (section 15) |
| DEV_CLEAN_TOUCHED | No — 83,326/83,687/61/137 all unchanged ✓ (section 17) |
| ERRORS | None |
| DURATION | 8.4s |
| RUNTIME_LOG_STATUS | Serilog file sink = health heartbeats only; drain logs went to stdout. Response payload is primary proof (section 13). |
| FULL_CORPUS_PROOF | rowsLanded=2,500 (not 89,247). FullCorpus=True would produce full corpus. |
| TOPN_PROOF | rowsLanded=2,500 exactly matches TopN=2,500 request body (section 6). |
| PACS_VINTAGE | max_owner_tax_yr=2026, qualifying_rows=289,166 (section 14). |
| PACS_SOURCE | `pacs_oltp_verify` on `localhost:21433` (D: copy). `tf_mssql_data` NOT touched. |
| SCOPE_EXCLUSIONS | owner-wsdor/improvement/land/sales/geometry — none run (section 16). |
| LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_002A_PARCEL_2500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-002B — owner-wsdor drain TopN=2,500 |
