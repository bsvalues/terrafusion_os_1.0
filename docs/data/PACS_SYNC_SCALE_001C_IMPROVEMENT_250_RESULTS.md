# WO-DATA-004B-SCALE-001C — Improvement Scale Drain TopN=250 Results

**Work Order:** WO-DATA-004B-SCALE-001C
**Date:** 2026-06-19
**Status:** STOP CONDITION 6 TRIGGERED — unresolved_imprv_attr=2049 > threshold 1,176.
**Drain status:** Succeeded (HTTP 200, no system failure). Stop is operator-defined threshold, not a crash.
**Prerequisite:** SCALE-001A + SCALE-001B complete

---

## STOP CONDITION EVALUATION

| # | Condition | Result |
|---|---|---|
| 1 | FullCorpus=True or TopN=null in logs | ✓ PASS — `FullCorpus=False, TopN=250` logged |
| 2 | Manual mutation SQL required | ✓ PASS — none |
| 3 | 500/error response | ✓ PASS — HTTP 200 |
| 4 | FAIL gate other than `imprv-attr-key-uniqueness` | ✓ PASS — only 1 FAIL, the known one |
| 5 | Duplicate tuple count changed from 3 | ✓ PASS — actual=3, unchanged |
| **6** | **unresolved_imprv_attr > 1,176** | **⚠️ TRIGGERED — 2049 > 1,176** |
| 7 | Non-improvement lanes unexpectedly changed | ✓ PASS — all unchanged |
| 8 | terrafusion_dev_clean changed | ✓ PASS — unchanged |

**Do not proceed to land without operator review of this report.**

---

## 1. Runtime Verification

**Log proof — FullCorpus and TopN honored:**
```
[Drain:improvement] Owner seed (TopN=250, FullCorpus=False)
[Drain:improvement] ImprvAttr-S1 year-sliced; years=1 (range 2026..2026)
[Drain:improvement] ImprvAttr-S1-Y2026 OK; batchId=36a0c298-5941-43e6-9e8b-7f9856bef2df rowsLanded=2049
```
No `FullCorpus=True` or `TopN=null` in any log line. Patch confirmed operative.

**TF_SKIP_DEV_SEEDERS:** Confirmed from startup log (same API process, started with SCALE-001A).

**ImprvAttrDictionary loaded from PACS at startup:**
```
ImprvAttrDictionaryRefreshHostedService: refreshed landing dictionary; 0 → 193 codes loaded from PACS.
```

---

## 2. Database Target Verification

**Target:** `terrafusion_scale_proof` (confirmed — doctrine rules seeded there at startup)
**dev_clean unchanged post-run:**

| Table | Count | Changed? |
|---|---|---|
| `canonical_tf.tf_parcel` | 83,326 | No |
| `canonical_tf.tf_improvement` | 104 | No |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | No |

---

## 3. PACS Source Verification

**Source:** `pacs_oltp_verify` on `localhost:21433` (D: verified copy)
**Proof:** drain completed — PACS unreachable would error.
**tf_mssql_data Docker volume:** NOT touched.

---

## 4. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/improvement`
**Body:**
```json
{
  "OperatorName": "claude-scale001c-improvement-250-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 250
}
```

---

## 5. Pre-Counts

| Table | Count |
|---|---|
| `legacy_pacs_raw.imprv` | 0 |
| `legacy_pacs_raw.imprv_detail` | 0 |
| `legacy_pacs_raw.imprv_attr` | 0 |
| `truth_pacs.imprv_current` | 0 |
| `canonical_tf.tf_improvement` | 0 |
| `canonical_tf.tf_improvement_feature` | 0 |
| `legacy_tf_unproven.imprv_current` | 0 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 |
| `canonical_tf.tf_parcel` | 500 ✓ (baseline) |
| `canonical_tf.tf_owner` | 421 ✓ (baseline) |
| `canonical_tf.tf_parcel_owner_link` | 500 ✓ (baseline) |
| `canonical_tf.tf_assessment_wsdor` | 499 ✓ (baseline) |
| `canonical_tf.tf_land` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `sync_bridge.load_batch` | 19 |
| `sync_bridge.source_xref` | 1420 |
| `sync_bridge.promotion_gate_result` | 83 |

**Duplicate PACS tuple baseline:** Not directly queryable pre-drain. Confirmed at drain time: `actual=3` (known).

---

## 6. Response Payload

**HTTP status:** 200
```json
{
  "lane": "improvement",
  "status": "Succeeded",
  "batchIds": [
    "90038689-ca29-4f28-882f-a84101df7d5f",
    "c5f62770-19c4-4edb-b030-9b8c611455a0",
    "3645911f-48b2-40cf-b4ed-a3b4e0191759",
    "1141c158-bc6d-47c1-a58b-0cb55179a36b",
    "59f90e46-19f0-4c22-af95-9ca7aff40bc1",
    "82783f68-d11f-4743-a95a-b29afa8f1db8",
    "5189d977-23cc-4c66-bb4c-c2c747eb38a3",
    "ea4eb3f5-13b6-4ae6-ad5f-71933ceb358a",
    "ada7d48d-e387-4621-b721-5ea7f8980f6c",
    "36a0c298-5941-43e6-9e8b-7f9856bef2df",
    "9504811d-7aa3-4d35-81b5-0201e00b8b27",
    "e5b9328a-9321-4761-a57a-2161a6cc9ed8"
  ],
  "counts": {
    "rowsLanded": 3303,
    "rowsPromotedToTruth": 307,
    "rowsCanonicalized": 1254,
    "rowsQuarantinedThisLane": 2049
  },
  "durationSec": 48.8306442,
  "gateSummary": {
    "totals": [{"status": "FAIL", "count": 1}, {"status": "PASS", "count": 52}],
    "recentFailures": [{
      "loadBatchId": "36a0c298-5941-43e6-9e8b-7f9856bef2df",
      "gateName": "imprv-attr-key-uniqueness",
      "gateStage": "SOURCE_TO_RAW",
      "status": "FAIL",
      "expected": "0",
      "actual": "3",
      "detail": "3 6-key tuples appeared more than once",
      "executedAt": "2026-06-19T15:38:09.539381Z"
    }]
  },
  "quarantineDelta": {"before": 0, "after": 2049, "delta": 2049},
  "nextRecommendedLane": "land"
}
```

---

## 7. Row Count Explanation

The improvement lane seeds **three PACS sub-tables**:

### Landing (rowsLanded=3303):
| Sub-table | Rows | Explanation |
|---|---|---|
| `legacy_pacs_raw.imprv` | 307 | TopN=250 improvements (250 PACS imprv records → some deduped to 307 landed) |
| `legacy_pacs_raw.imprv_detail` | 947 | ~3.1 detail rows per improvement (size/shape features) |
| `legacy_pacs_raw.imprv_attr` | 2049 | ~6.7 attribute rows per improvement (shingles, flooring, HVAC, etc.) |
| **Total** | **3303** | |

### Truth promotion (rowsPromotedToTruth=307):
Only `truth_pacs.imprv_current` promoted. Detail and attr rows go through different paths.

### Canonicalization (rowsCanonicalized=1254):
| Table | Count | Source |
|---|---|---|
| `canonical_tf.tf_improvement` | 307 | imprv headers |
| `canonical_tf.tf_improvement_feature` | 947 | imprv_detail rows (shape/size features) |
| **Total** | **1254** | ✓ |

Attribute rows (imprv_attr) are NOT included in `rowsCanonicalized` — they go to staging first.

---

## 8. Post-Counts

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.imprv` | 0 | 307 | +307 |
| `legacy_pacs_raw.imprv_detail` | 0 | 947 | +947 |
| `legacy_pacs_raw.imprv_attr` | 0 | 2049 | +2049 |
| `truth_pacs.imprv_current` | 0 | 307 | +307 |
| `canonical_tf.tf_improvement` | 0 | 307 | +307 |
| `canonical_tf.tf_improvement_feature` | 0 | 947 | +947 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 | 2049 | **+2049** |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 | 0 | 0 |
| `canonical_tf.tf_parcel` | 500 | 500 | 0 ✓ |
| `canonical_tf.tf_owner` | 421 | 421 | 0 ✓ |
| `canonical_tf.tf_land` | 0 | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 | 0 ✓ |
| `sync_bridge.load_batch` | 19 | 31 | +12 |
| `sync_bridge.source_xref` | 1420 | 1727 | +307 |
| `sync_bridge.promotion_gate_result` | 83 | 136 | +53 |

---

## 9. Gate Summary

| Gate status | Count |
|---|---|
| FAIL | 1 (known: `imprv-attr-key-uniqueness`) |
| PASS | 52 |

**Known FAIL — `imprv-attr-key-uniqueness`:**
- `expected: "0"` (zero duplicate 6-key tuples)
- `actual: "3"` (3 duplicates found in PACS source)
- **Status unchanged from prior runs** — still 3, not a new issue.

No new FAIL gates introduced.

---

## 10. Quarantine Analysis — STOP CONDITION 6 DETAIL

### Threshold check

| Metric | Value | Threshold | Result |
|---|---|---|---|
| `unresolved_imprv_attr` after drain | 2,049 | 1,176 | **EXCEEDED — STOP** |

### Landing vs. Promotion quarantine distinction

**Critical diagnostic:**
```
PACS imprv_attr landing COMPLETED.
  batch=36a0c298... considered=2049 landed=2049 quarantined=0 duplicates=3 dictSize=193
```

- `quarantined=0` AT LANDING — the ImprvAttrDictionary (193 codes) recognized ALL 2049 attr codes. No landing-level rejection.
- `unresolved_imprv_attr=2049` AT PROMOTION — all attrs are in **pre-resolution staging**, awaiting `attr-drain-1` release.

This is the same staging behavior as the pre-V8 state in dev_clean (before `POST /api/debug/attr-drain-1/run-drain` released 9,504 rows).

**Dev_clean comparison:**

| DB | unresolved_imprv_attr | State |
|---|---|---|
| `terrafusion_dev_clean` | 588 | POST attr-drain-1 release (FIX7B TopN=100 residual — truly unresolvable) |
| `terrafusion_scale_proof` (SCALE-001C) | 2,049 | PRE attr-drain-1 release (all imprv_attr rows staging) |

**These are not the same measurement.** The operator's threshold of 1,176 (2× FIX7B's 588) was set against dev_clean's post-release count. The 2,049 is a pre-release count — the truly-unresolvable remainder after attr-drain-1 would likely be a subset.

The `canonical_tf.attribute_definition` table has **0 rows** in both DBs, confirming the canonical-level matching does not filter them — the `unresolved_imprv_attr` staging applies to ALL imprv_attr rows until `attr-drain-1` resolves them.

### Operator decision point

Three paths forward:

**Option A — Run attr-drain-1 on scale_proof, then compare residual:**
- `POST /api/debug/attr-drain-1/run-drain` against the scale_proof API
- This resolves staging queue → canonical features or remaining truly-unresolvable
- Residual count after release = the comparable metric to dev_clean's 588
- If residual ≤ 1,176 → improvement lane can be considered valid
- RISK: attr-drain-1 may need the full corpus dict (or specific PACS codes loaded) to resolve correctly

**Option B — Accept quarantine staging as operational behavior, proceed to land/sales:**
- Land and sales don't have imprv_attr complexity
- Come back to improvement quarantine resolution in a later work order
- The 2,049 rows are staged, not lost — they can be resolved later

**Option C — Tighten improvement scale, rerun at TopN=100 on scale_proof:**
- Would likely produce ~820 staging attrs (proportional to 2049 × 100/250)
- After attr-drain-1, compare to FIX7B's post-release 588

---

## 11. Non-Improvement Lane Proof

All non-improvement canonical and truth tables unchanged:

| Table | Value |
|---|---|
| `canonical_tf.tf_parcel` | 500 ✓ |
| `canonical_tf.tf_owner` | 421 ✓ |
| `canonical_tf.tf_parcel_owner_link` | 500 ✓ |
| `canonical_tf.tf_assessment_wsdor` | 499 ✓ |
| `canonical_tf.tf_land` | 0 ✓ |
| `canonical_tf.tf_sale` | 0 ✓ |
| `legacy_tf_unproven.imprv_current` | 0 ✓ |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 ✓ |
| `legacy_tf_unproven.owner_current` | 0 ✓ |
| `legacy_tf_unproven.land_current` | 0 ✓ |
| `legacy_tf_unproven.sale` | 0 ✓ |

---

## 12. Land Lane Readiness

**API says:** `nextRecommendedLane: "land"`

Land lane does not involve imprv_attr, ImprvAttrDictionary, or attribute_definition. The quarantine state from improvement does not block land technically.

**Cannot be approved here** — operator must review this report first.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | ⚠️ STOP CONDITION 6 TRIGGERED (drain Succeeded, threshold exceeded) |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/improvement` |
| TOPN | 250 |
| FULL_CORPUS | false — log proof: `[Drain:improvement] Owner seed (TopN=250, FullCorpus=False)` |
| ROWS_LANDED | 3303 (307 imprv + 947 imprv_detail + 2049 imprv_attr) |
| ROWS_PROMOTED | 307 (truth_pacs.imprv_current) |
| ROWS_CANONICALIZED | 1254 (307 tf_improvement + 947 tf_improvement_feature) |
| ROWS_QUARANTINED | 2049 (all imprv_attr in pre-resolution staging) |
| DUP_KEY_COUNT | 3 (unchanged — known PACS issue) |
| GATE_STATUS | 1 FAIL (known `imprv-attr-key-uniqueness`) / 52 PASS |
| QUARANTINE_THRESHOLD | **EXCEEDED: 2049 > 1176** |
| QUARANTINE_NATURE | Pre-attr-drain-1 staging (not truly unresolvable — see §10) |
| NON_IMPROVEMENT_LANES | All unchanged ✓ |
| DEV_CLEAN_TOUCHED | No |
| ERRORS | None (HTTP 200, Succeeded) |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001C_IMPROVEMENT_250_RESULTS.md` |
| NEXT_WORK_ORDER | Operator decision required — see §10 options A/B/C before land approval |
