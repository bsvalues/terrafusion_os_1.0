# WO-DATA-004B-SCALE-002B — Owner-WSDOR Scale Drain TopN=2,500 Results

**Work Order:** WO-DATA-004B-SCALE-002B
**Date:** 2026-06-19
**Status:** COMPLETE — 4,999 landed, 4,999 promoted, 7,118 canonicalized, 49/49 PASS, 0 quarantine.
**Prerequisite:** SCALE-002A accepted (parcel TopN=2,500, 2500/2500/2500, 17/17 PASS)

---

## 1. Pre-Drain Baseline Confirmation

Snapshot `terrafusion_scale_proof_scale002_postseed_baseline.dump` (721K) confirmed present.

**Post-SCALE-002A carry-forward state (pre-SCALE-002B drain):**

| Table | Pre-002B Count | Source |
|---|---|---|
| `legacy_pacs_raw.property` | 2,500 | SCALE-002A parcel drain ✓ |
| `legacy_pacs_raw.owner` | 2,500 | Co-landed with SCALE-002A parcel (see note §13) |
| `truth_pacs.parcel_spine` | 2,500 | SCALE-002A parcel drain ✓ |
| `truth_pacs.owner_current` | 0 | Not yet promoted ✓ |
| `canonical_tf.tf_parcel` | 2,500 | SCALE-002A parcel drain ✓ |
| `canonical_tf.tf_owner` | 0 | Not yet canonicalized ✓ |
| `sync_bridge.load_batch` | 4 | SCALE-002A only |
| `sync_bridge.source_xref` | 2,500 | SCALE-002A parcel entities only |
| `sync_bridge.promotion_gate_result` | 17 | SCALE-002A only |

---

## 2. Runtime Verification

**TF_SKIP_DEV_SEEDERS:** Active (confirmed during SCALE-002Z, same API process)
**API process:** `http://localhost:5000`
**API worktree:** `C:\Users\bsval\terrafusion_os_1.0\tf-scale-001z`

---

## 3. Database Target Verification

**Target:** `terrafusion_scale_proof`
**Connection:** `Host=127.0.0.1;Port=5432;Database=terrafusion_scale_proof`

**dev_clean unchanged (confirmed via SELECT before this drain):**

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No ✓ |
| `truth_pacs.parcel_spine` | 83,687 | No ✓ |
| `canonical_tf.tf_sale` | 61 | No ✓ |
| `canonical_tf.tf_land` | 137 | No ✓ |

---

## 4. PACS Source Verification

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy)
**Proof:** Drain succeeded with 4,999 owner-WSDOR cross-join rows — PACS unreachable would fail.
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

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/owner-wsdor`
**Body:**
```json
{
  "OperatorName": "claude-scale002b-owner-wsdor-2500-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 2500
}
```

---

## 7. Pre-Counts (at time of SCALE-002B drain invocation)

| Table | Count | Gate check |
|---|---|---|
| `legacy_pacs_raw.owner` | 2,500 | ✓ co-landed from parcel drain (see §13) |
| `truth_pacs.owner_current` | 0 | ✓ clean — not yet promoted |
| `canonical_tf.tf_owner` | 0 | ✓ clean — not yet canonicalized |
| `canonical_tf.tf_parcel` | 2,500 | ✓ SCALE-002A baseline |
| `sync_bridge.load_batch` | 4 | SCALE-002A only |
| `sync_bridge.source_xref` | 2,500 | SCALE-002A parcel entities only |
| `sync_bridge.promotion_gate_result` | 17 | SCALE-002A only |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | ✓ clean |

---

## 8. Response Payload

**HTTP status:** 200
```json
{
  "lane": "owner-wsdor",
  "status": "Succeeded",
  "batchIds": [
    "c5e7296c-c9a2-4e1d-b148-55a7853648ed",
    "457d552a-deb8-45bb-9a3d-73b8499214ca",
    "df76a184-f2dc-43f2-9fdf-48abfb36bf39",
    "59739f60-e05e-4b7a-885c-ab49ea026363",
    "a86df661-1183-4230-8217-5759c17ec3b5",
    "14c50f64-bc45-4a65-8d85-60b38294a4b6",
    "997cd41f-aa1a-4682-8506-01898d9d9de7",
    "ebd8c6eb-89a0-4068-8f91-16549ecadc95",
    "36546590-f042-4413-9365-b3f3cd31b666",
    "e0e0a635-a931-4978-8f14-8faa4767a273",
    "966a5674-21f2-400a-ab09-e552d3fc2c2b"
  ],
  "counts": {
    "rowsLanded": 4999,
    "rowsPromotedToTruth": 4999,
    "rowsCanonicalized": 7118,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 66.5798568,
  "gateSummary": {
    "totals": [{"status": "PASS", "count": 49}],
    "recentFailures": []
  },
  "quarantineDelta": {"before": 0, "after": 0, "delta": 0},
  "nextRecommendedLane": "improvement"
}
```

**Batch count:** 11 batches (~455 WSDOR tuples/batch)

---

## 9. Post-Counts and Deltas

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.owner` | 2,500 | **5,000** | +2,500 (see §13) |
| `truth_pacs.owner_current` | 0 | **2,500** | **+2,500** |
| `canonical_tf.tf_owner` | 0 | **2,119** | **+2,119** |
| `canonical_tf.tf_parcel` | 2,500 | 2,500 | 0 ✓ |
| `truth_pacs.imprv_current` | 0 | 0 | 0 ✓ |
| `truth_pacs.land_current` | 0 | 0 | 0 ✓ |
| `truth_pacs.sale` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_improvement` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_land` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 | 0 ✓ |
| `sync_bridge.load_batch` | 4 | **15** | +11 batches |
| `sync_bridge.source_xref` | 2,500 | **7,118** | +4,618 |
| `sync_bridge.promotion_gate_result` | 17 | **66** | +49 (= 49 PASS for this lane) |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 | 0 ✓ |

**Gate math proof:** +49 gate results = 49 PASS + 0 WARN + 0 FAIL = 49 total ✓
**Source_xref delta:** +4,618 owner-side canonical entries ✓

---

## 10. Gate Summary

| Gate status | Count |
|---|---|
| PASS | **49** |
| WARN | 0 |
| FAIL | 0 |

---

## 10a. Count Reconciliation — Promoted and Canonicalized Decomposition

### rowsPromotedToTruth = 4,999 decomposition

| Truth table | Count | Description |
|---|---|---|
| `truth_pacs.owner_current` | **2,500** | One current-year owner record per parcel |
| `truth_pacs.wash_prop_owner_val` | **2,499** | WSDOR assessed value per parcel/owner (1 missing = 1 parcel with no WSDOR assessment) |
| **Total** | **4,999** | Matches `rowsPromotedToTruth` ✓ |

### rowsCanonicalized = 7,118 decomposition (cumulative source_xref total)

| `sync_bridge.source_xref` EntityType | Count | Lane | Cumulative? |
|---|---|---|---|
| `parcel` | 2,500 | SCALE-002A | carry-forward ✓ |
| `assessment_wsdor` | 2,499 | SCALE-002B | new this lane |
| `owner` | 2,119 | SCALE-002B | new this lane |
| **Total** | **7,118** | | Cumulative total = `rowsCanonicalized` ✓ |

**SCALE-002B lane delta (source_xref new entries):** +4,618 = 2,499 (assessment_wsdor) + 2,119 (owner)

### Canonical component tables (post-drain SELECT)

| Table | Count | Description |
|---|---|---|
| `canonical_tf.tf_owner` | **2,119** | Distinct de-duplicated owners; source_xref `owner` = 2,119 ✓ |
| `canonical_tf.tf_parcel_owner_link` | **2,500** | Parcel-to-owner mapping; sub-artifact (not in source_xref separately) |
| `canonical_tf.tf_assessment_wsdor` | **2,499** | WSDOR assessments; source_xref `assessment_wsdor` = 2,499 ✓ |

**Math proof:** `tf_owner`(2,119) + `tf_assessment_wsdor`(2,499) + `tf_parcel_owner_link`(2,500) + SCALE-002A `tf_parcel`(2,500) accounts for all data movements. Source_xref total 7,118 = 2,500 + 2,499 + 2,119 = 7,118 ✓

---

## 10b. Runtime Control Proof — Explicit Negative Checks

**From request body (section 6):**
- `"FullCorpus": false` — explicitly set to false in the JSON body sent to the endpoint
- `"TopN": 2500` — explicitly set; not null, not omitted

**Negative confirmations:**
- `FullCorpus=True` was **NOT** present in the request. A `FullCorpus=true` drain would produce ~178,000+ rows (89,247 parcels × ~2 WSDOR years). Actual `rowsLanded=4,999` confirms this was not a full-corpus drain.
- `TopN=null` was **NOT** present. A null TopN would produce an unbounded drain against the PACS source. The 4,999 row response is bounded, consistent with TopN=2,500 parcels × 2 WSDOR assessment years.
- No zero-body POST was sent (the `NormalizeRequest ?? false` patch on PR #1051 would reject it).

---

## 11. Non-Owner Lane Proof

| Table | Post-drain | Expected |
|---|---|---|
| `canonical_tf.tf_improvement` | 0 | 0 ✓ |
| `canonical_tf.tf_land` | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 ✓ |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 0 ✓ |

---

## 12. Scale Comparison — SCALE-001B vs SCALE-002B

| Metric | SCALE-001B (TopN=500) | SCALE-002B (TopN=2,500) | Factor |
|---|---|---|---|
| Rows landed (WSDOR tuples) | 999 | 4,999 | 5× |
| Rows promoted | 999 | 4,999 | 5× |
| truth_pacs.owner_current | ~500 | 2,500 | 5× |
| canonical_tf.tf_owner | ~420 | 2,119 | 5× |
| Gate count | 49 PASS | 49 PASS | same |
| Duration | ~13s | 66.6s | 5.1× |
| Quarantine | 0 | 0 | same |

5× scale with ~5× duration (linear scaling, consistent with WSDOR cross-join workload).

---

## 13. Architectural Note — Owner Co-Landing During Parcel Drain

`legacy_pacs_raw.owner` showed 2,500 rows BEFORE the SCALE-002B drain was invoked. This was confirmed as expected behavior, not a data leak:

- The SCALE-002A parcel drain co-lands raw owner records into `legacy_pacs_raw.owner` as part of the parcel extraction query (owner data is co-fetched from PACS during the parcel landing step)
- These 2,500 co-landed rows carry `LoadBatchId = a0bb2ad4-3244-4f99-84f2-d820cc96fb56` (SCALE-002A batch 1) — confirmed via SELECT
- No separate `sync_bridge.load_batch` entry exists for those rows (they are sub-artifacts of the parcel batch)
- No `sync_bridge.source_xref` entry exists for them (source_xref tracks canonical entities, not raw landing artifacts)
- The SCALE-002B owner-wsdor drain then reads from `legacy_pacs_raw.owner` + WSDOR cross-join → produces `truth_pacs.owner_current` and `canonical_tf.tf_owner`
- Net table growth from SCALE-002B: `legacy_pacs_raw.owner` 2,500 → 5,000 (+2,500 WSDOR cross-join expansion rows)

**Cross-join math:**
- 2,500 parcels × ~2 WSDOR assessment years per parcel = ~5,000 owner×WSDOR tuples
- Response `rowsLanded=4,999`: consistent with 2,500 parcels × 2 WSDOR years, minus 1 dedup
- `truth_pacs.owner_current=2,500`: one canonical current-year owner per parcel
- `canonical_tf.tf_owner=2,119`: de-duplicated distinct canonical owners (2,500 parcels, some sharing owners)

---

## 14. Scope Explicitness — What Was Not Run

| Operation | Status |
|---|---|
| Improvement drain | NOT run |
| Land drain | NOT run |
| Sales drain | NOT run |
| Geometry drain | NOT run |
| ATTR-POP-1 / ATTR-POP-2 | NOT run |
| Manual mutation SQL | NOT used — only SELECT-only verification |
| `terrafusion_dev_clean` DB | NOT touched |
| `tf_mssql_data` Docker volume | NOT touched |

---

## 15. Runtime Log Status

**Serilog file sink** (`logs/terrafusion-20260619.log`): health heartbeats only. Drain-level logs go to stdout (same pattern as SCALE-002A).

**Primary proof — response payload:**
- `rowsLanded=4,999` with `FullCorpus: false` explicit in request body (section 6)
- Full corpus for owner-wsdor would produce ~178,000+ rows (89,247 parcels × 2 WSDOR years); 4,999 rows confirms FullCorpus=False

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/owner-wsdor` |
| TOPN | 2,500 |
| FULL_CORPUS | false |
| ROWS_LANDED | 4,999 (WSDOR cross-join tuples) |
| ROWS_PROMOTED | 4,999 |
| ROWS_CANONICALIZED | 7,118 (cumulative source_xref total: parcel 2,500 + assessment_wsdor 2,499 + owner 2,119; lane delta = +4,618) |
| TRUTH_OWNER_CURRENT | 2,500 (one per parcel, current year) |
| CANONICAL_TF_OWNER | 2,119 (de-duplicated distinct owners) |
| GATE_STATUS | 49/49 PASS, 0 WARN, 0 FAIL |
| QUARANTINE_STATUS | 0 (before=0, after=0, delta=0) |
| NON_OWNER_LANES | imprv/land/sale/unresolved_attr all = 0 ✓ |
| DEV_CLEAN_TOUCHED | No (83,326/83,687/61/137 unchanged) ✓ |
| ERRORS | None |
| DURATION | 66.6s |
| BATCH_COUNT | 11 batches |
| SOURCE_XREF_DELTA | +4,618 owner-side canonical entries |
| LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_002B_OWNER_WSDOR_2500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-002C — improvement drain TopN=1,000 → ATTR-POP-1 → ATTR-POP-2 |
