# WO-DATA-004B-SCALE-001B — Owner-WSDOR Scale Drain TopN=500 Results

**Work Order:** WO-DATA-004B-SCALE-001B
**Date:** 2026-06-19
**Status:** COMPLETE — 999 landed/promoted, 1420 canonicalized, 49/49 gates PASS, 0 quarantine.
**Prerequisite:** SCALE-001A complete (canonical_tf.tf_parcel=500, source_xref=500)

---

## 1. Runtime Verification

### PR #1051 Safe-Default Patch

**Log proof — FullCorpus and TopN honored:**
```
[Drain:owner-wsdor] Owner S1 (TopN=500, FullCorpus=False)
```
No `TopN=null` or `FullCorpus=True` observed. Patch confirmed operative.

Full log sequence for this session (all three runs shown for context):
```
[Drain:parcel] Owner seed (TopN=1, FullCorpus=False)      ← probe
[Drain:parcel] Owner seed (TopN=500, FullCorpus=False)    ← SCALE-001A
[Drain:owner-wsdor] Owner S1 (TopN=500, FullCorpus=False) ← SCALE-001B
```

### TF_SKIP_DEV_SEEDERS

Confirmed from startup log (same API process as SCALE-001A):
```
[STARTUP] GPT seeding skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
[DX-01] Dossier seed skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
```

---

## 2. Database Target Verification

**Target DB:** `terrafusion_scale_proof`
**API port:** 5000 (same process started for SCALE-001A, still running)
**Config:** `appsettings.Development.local.json` → `Database=terrafusion_scale_proof`

**Proof — terrafusion_dev_clean untouched post-SCALE-001B:**

| Table | Expected | Actual | Changed? |
|---|---|---|---|
| `truth_pacs.parcel_spine` | 83,687 | 83,687 | No |
| `canonical_tf.tf_parcel` | 83,326 | 83,326 | No |
| `truth_pacs.owner_current` | 100 | 100 | No |
| `canonical_tf.tf_owner` | 84 | 84 | No |

---

## 3. PACS Source Verification

**Source:** `pacs_oltp_verify` on `Server=localhost,21433` (D: verified copy)
**Proof of connectivity:** drain succeeded with 999 rows landed — PACS unreachable would fail.
**tf_mssql_data Docker volume:** NOT touched.

---

## 4. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/owner-wsdor`
**Request headers:** `Content-Type: application/json`
**Request body (verbatim):**
```json
{
  "OperatorName": "claude-scale001b-owner-wsdor-500-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 500
}
```

---

## 5. Pre-Counts (before SCALE-001B run)

| Table | Count |
|---|---|
| `legacy_pacs_raw.owner` | 501 (seeded by SCALE-001A parcel drain's owner-seed step) |
| `legacy_pacs_raw.wash_prop_owner_val` | 0 |
| `truth_pacs.owner_current` | 0 |
| `truth_pacs.wash_prop_owner_val` | 0 |
| `canonical_tf.tf_owner` | 0 |
| `canonical_tf.tf_parcel_owner_link` | 0 |
| `canonical_tf.tf_assessment_wsdor` | 0 |
| `canonical_tf.tf_parcel` | 500 (SCALE-001A baseline — unchanged) |
| `canonical_tf.tf_improvement` | 0 |
| `canonical_tf.tf_land` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `sync_bridge.load_batch` | 8 |
| `sync_bridge.source_xref` | 500 |
| `sync_bridge.promotion_gate_result` | 34 |
| `legacy_tf_unproven.*` (all 4) | 0 |

---

## 6. Response Payload

**HTTP status:** 200
```json
{
  "lane": "owner-wsdor",
  "status": "Succeeded",
  "batchIds": [
    "008522e9-7f29-478d-980d-dfa429815112",
    "4923ef6e-88fd-4d7a-8748-d3fd18eff243",
    "7d06e7ba-5341-44f1-bc6b-b56a180cc68b",
    "ee8c51bd-b53a-4de1-ae77-35a63a46f240",
    "cbe4be0b-c142-4a51-ac4f-7c403bf7dbd9",
    "766b6ffb-b412-4ef5-bb2c-9640e45577f8",
    "10ff42cc-1e61-43ed-81d8-9b7486d85d81",
    "0930fc35-d152-40ee-a07d-37b1f16baf52",
    "4247527c-d16a-42b4-853d-51418a6a0591",
    "7b3cdf10-27a9-44b8-abe7-b7bbdf3f9314",
    "fe1202f3-23e0-4777-b2a2-0f1a663a17f7"
  ],
  "counts": {
    "rowsLanded": 999,
    "rowsPromotedToTruth": 999,
    "rowsCanonicalized": 1420,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 23.4272033,
  "gateSummary": {
    "totals": [{"status": "PASS", "count": 49}],
    "recentFailures": []
  },
  "quarantineDelta": {"before": 0, "after": 0, "delta": 0},
  "nextRecommendedLane": "improvement"
}
```

---

## 7. Row Count Explanation (999 landed, 1420 canonicalized)

The owner-wsdor lane seeds **two PACS source tables** (not one), hence counts exceed TopN=500:

### Landing (rowsLanded=999):
| Table seeded | Delta | Explanation |
|---|---|---|
| `legacy_pacs_raw.owner` | +500 (501→1001) | TopN=500 accounts from pacs.owner |
| `legacy_pacs_raw.wash_prop_owner_val` | +499 (0→499) | WSDOR assessment values |
| **Total landed** | **999** | |

### Canonicalization (rowsCanonicalized=1420):
| Table written | Count | Explanation |
|---|---|---|
| `canonical_tf.tf_owner` | 421 | Unique owner entities (multiple parcels share owners) |
| `canonical_tf.tf_parcel_owner_link` | 500 | One link per parcel (full parcel set linked) |
| `canonical_tf.tf_assessment_wsdor` | 499 | WSDOR assessment canonical records |
| **Total canonicalized** | **1420** | 421 + 500 + 499 = 1420 ✓ |

### Truth promotion (rowsPromotedToTruth=999):
| Table | Count |
|---|---|
| `truth_pacs.owner_current` | 500 |
| `truth_pacs.wash_prop_owner_val` | 499 |
| **Total** | **999** ✓ |

The 421 unique owners for 500 parcels means ~1.19 owners/parcel average (some parcels have
shared ownership — LLC, joint tenancy, etc.).

---

## 8. Post-Counts

| Table | Pre | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.owner` | 501 | 1001 | +500 |
| `legacy_pacs_raw.wash_prop_owner_val` | 0 | 499 | +499 |
| `truth_pacs.owner_current` | 0 | 500 | +500 |
| `truth_pacs.wash_prop_owner_val` | 0 | 499 | +499 |
| `canonical_tf.tf_owner` | 0 | 421 | +421 |
| `canonical_tf.tf_parcel_owner_link` | 0 | 500 | +500 |
| `canonical_tf.tf_assessment_wsdor` | 0 | 499 | +499 |
| `canonical_tf.tf_parcel` | 500 | 500 | 0 (unchanged ✓) |
| `canonical_tf.tf_improvement` | 0 | 0 | 0 |
| `canonical_tf.tf_land` | 0 | 0 | 0 |
| `canonical_tf.tf_sale` | 0 | 0 | 0 |
| `sync_bridge.load_batch` | 8 | 19 | +11 |
| `sync_bridge.source_xref` | 500 | 1420 | +920 |
| `sync_bridge.promotion_gate_result` | 34 | 83 | +49 |
| `legacy_tf_unproven.imprv_current` | 0 | 0 | 0 |
| `legacy_tf_unproven.land_current` | 0 | 0 | 0 |
| `legacy_tf_unproven.owner_current` | 0 | 0 | 0 |
| `legacy_tf_unproven.sale` | 0 | 0 | 0 |

**source_xref delta:** +920 = 421 (tf_owner xrefs) + 499 (tf_assessment_wsdor xrefs).
The 500 tf_parcel_owner_link rows reference existing parcel xrefs, not creating new ones.

---

## 9. Gate Summary

| Gate status | Count |
|---|---|
| PASS | 49 |
| FAIL | 0 |

Owner-wsdor has 49 gates (vs parcel's 17) due to covering two sub-lanes (owner + WSDOR).
`recentFailures: []`.

---

## 10. Non-Owner Lane Proof

All non-owner canonical and truth tables unchanged:

| Table | Value | Expected |
|---|---|---|
| `canonical_tf.tf_improvement` | 0 | 0 ✓ |
| `canonical_tf.tf_land` | 0 | 0 ✓ |
| `canonical_tf.tf_sale` | 0 | 0 ✓ |
| `legacy_tf_unproven.imprv_current` | 0 | 0 ✓ |
| `legacy_tf_unproven.land_current` | 0 | 0 ✓ |
| `legacy_tf_unproven.owner_current` | 0 | 0 ✓ |
| `legacy_tf_unproven.sale` | 0 | 0 ✓ |

**Only the owner-wsdor lane changed.**

---

## 11. Source Safety

- `tf_mssql_data` Docker volume: NOT touched
- `terrafusion_dev_clean`: NOT touched (83,326/83,687 parcel counts verified post-run)
- No manual mutation SQL
- No filter changes
- No code changes

---

## 12. Improvement Lane Readiness Assessment

The operator noted improvement is the risky lane because it produced quarantine at TopN=100
in prior controlled-slice runs.

State after SCALE-001B:

| Condition | Status |
|---|---|
| Parcel lane complete (tf_parcel=500) | ✓ |
| Owner lane complete (tf_owner=421, links=500) | ✓ |
| source_xref populated for parcel+owner | ✓ 1420 rows |
| WSDOR assessments landed (tf_assessment_wsdor=499) | ✓ |
| `nextRecommendedLane` from API | `improvement` |
| Non-improvement canonical tables at 0 | ✓ |
| Gate status | 49/49 PASS |
| Quarantine at 0 | ✓ |

**Improvement TopN=250 can proceed IF separately approved.** Recommended TopN=250 (not 500)
as a conservative first probe given prior quarantine behavior at TopN=100. The improvement
lane intersects with universe classification (SYNC-DOCTRINE-4) and attribute resolution
(ImprvAttrDictionary). Expect some quarantine — the question is how much and what codes.

The prior FIX7B TopN=100 improvement run produced quarantine (UNKNOWN_ATTRIBUTE class).
At TopN=250, the improvement universe will be larger and may surface more quarantine entries.

Do NOT auto-proceed. Report first, then await operator decision on TopN and quarantine
tolerance before running improvement.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | SUCCEEDED |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/owner-wsdor` |
| TOPN | 500 |
| FULL_CORPUS | false (logged: `FullCorpus=False`) |
| ROWS_LANDED | 999 (500 owner + 499 wash_prop_owner_val) |
| ROWS_PROMOTED | 999 (500 truth owner + 499 truth WSDOR) |
| ROWS_CANONICALIZED | 1420 (421 tf_owner + 500 tf_parcel_owner_link + 499 tf_assessment_wsdor) |
| OWNER_LINKS | 500 (canonical_tf.tf_parcel_owner_link) |
| GATE_STATUS | 49/49 PASS |
| QUARANTINE_STATUS | before=0, after=0, delta=0 |
| NON_OWNER_LANES | All at 0 — untouched |
| DEV_CLEAN_TOUCHED | No (83,326/83,687 parcel + 84/100 owner verified unchanged) |
| ERRORS | None |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001B_OWNER_WSDOR_500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-001C — improvement drain (requires operator approval; recommend TopN=250 given prior quarantine history) |
