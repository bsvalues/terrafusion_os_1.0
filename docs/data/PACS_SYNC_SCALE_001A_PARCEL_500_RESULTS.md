# WO-DATA-004B-SCALE-001A — Parcel Scale Drain TopN=500 Results

**Work Order:** WO-DATA-004B-SCALE-001A
**Date:** 2026-06-19
**Status:** COMPLETE — 500/500/500 landed/promoted/canonicalized, 17/17 gates PASS, 0 quarantine.
**Prerequisite:** SCALE-001Z bootstrap complete (terrafusion_scale_proof migrated, clean baseline)

---

## 1. Runtime Verification

### PR #1051 Safe-Default Patch

Worktree `tf-scale-001z` is on `origin/main` at commit `abca83b439` (post-SCALE-001Y merge).

**Log proof — FullCorpus and TopN honored:**
```
[Drain:parcel] Owner seed (TopN=500, FullCorpus=False)
```
Also from the 1-row probe run:
```
[Drain:parcel] Owner seed (TopN=1, FullCorpus=False)
```
Both runs show `FullCorpus=False`. The old bug would have logged `FullCorpus=True` (and ignored TopN).
No `TopN=null` observed in any log line. Patch confirmed operative.

### TF_SKIP_DEV_SEEDERS

**Log proof:**
```
[STARTUP] GPT seeding skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
[DX-01] Dossier seed skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
```
Fake/dev seeders did not run. Doctrine rules were seeded by the production hosted service
(`DoctrineRuleSeederHostedService`) — not a dev seeder.

---

## 2. Database Target Verification

**Target DB:** `terrafusion_scale_proof`
**API started from:** `tf-scale-001z/backend/src/TerraFusion.API`
**Config:** `appsettings.Development.local.json` → `Database=terrafusion_scale_proof`
**Port:** 5000 (ASPNETCORE_URLS env var; API resolved to default 5000)

**Proof — doctrine rules seeded into terrafusion_scale_proof at API startup:**

| Table | Rows at startup |
|---|---|
| `doctrine_tf.tf_doctrine_ratio_policy` | 3 |
| `doctrine_tf.tf_doctrine_property_universe` | 6 |
| `doctrine_tf.tf_doctrine_sales_qualification_codes` | 3 |

These tables were at 0 before startup (confirmed in SCALE-001Z evidence). The seeder writes to
the connected DB — so `terrafusion_scale_proof` received these rows, not `terrafusion_dev_clean`.

**Proof — terrafusion_dev_clean untouched (confirmed post-run):**

| Table | Expected (FIX7B) | Actual | Changed? |
|---|---|---|---|
| `truth_pacs.parcel_spine` | 83,687 | 83,687 | No |
| `canonical_tf.tf_parcel` | 83,326 | 83,326 | No |
| `truth_pacs.imprv_current` | 104 | 104 | No |
| `truth_pacs.owner_current` | 100 | 100 | No |
| `truth_pacs.land_current` | 137 | 137 | No |
| `truth_pacs.sale` | 61 | 61 | No |

---

## 3. PACS Source Verification

**Source:** `pacs_oltp_verify` on `Server=localhost,21433` (D: verified copy)
**Connection:** Verified via successful drain execution (PACS unreachable → drain would fail)

**Vintage proof from landed rows:**
- 501 parcel_spine rows promoted on 2026-06-19 (today)
- PromotedAt range: `2026-06-19T15:16:16Z` → `2026-06-19T15:17:02Z`
- `PropTypeCd` distinct values: 1 (real property universe)

Source `tf_mssql_data` Docker volume was NOT touched — drain reads from `pacs_oltp_verify`
(port 21433), the D: verified copy, per the committed connection string in the gitignored
local config.

---

## 4. Exact Request Payload

**Endpoint:** `POST http://localhost:5000/api/sync/doctrine/drain/parcel`
**Request headers:** `Content-Type: application/json`
**Request body (verbatim):**
```json
{
  "OperatorName": "claude-scale001a-parcel-500-v2",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 500
}
```

*Note: a 1-row probe run (`TopN=1, OperatorName="vintage-probe-only"`) was executed first to
confirm PACS connectivity and parameter handling before the 500-row run.*

---

## 5. Pre-Counts

### Phase 1 — Before any run (absolute zero state)

All 18 key tables at 0 rows (documented in SCALE-001Z evidence).

### Phase 2 — After 1-row probe, before 500-row run

| Table | Count |
|---|---|
| `legacy_pacs_raw.property` | 1 |
| `legacy_pacs_raw.prop_supp_assoc` | 0 |
| `legacy_pacs_raw.property_val` | 0 |
| `truth_pacs.parcel_spine` | 1 |
| `canonical_tf.tf_parcel` | 1 |
| `canonical_tf.tf_owner` | 0 |
| `canonical_tf.tf_improvement` | 0 |
| `canonical_tf.tf_land` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `sync_bridge.load_batch` | 4 |
| `sync_bridge.source_xref` | 1 |
| `sync_bridge.promotion_gate_result` | 17 |
| `legacy_tf_unproven.*` (all 4) | 0 |

---

## 6. Response Payload — 500-Row Run

**HTTP status:** 200
```json
{
  "lane": "parcel",
  "status": "Succeeded",
  "batchIds": [
    "26f492c5-130f-4739-aacc-9f3c8914ce62",
    "4e1aa21e-2bda-4f7d-8ec5-865f825de928",
    "1184da82-73ee-4b3b-8681-1b144885cd82",
    "2b02b133-aa28-479c-bef4-2dde504e2af9"
  ],
  "counts": {
    "rowsLanded": 500,
    "rowsPromotedToTruth": 500,
    "rowsCanonicalized": 500,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 2.7977121,
  "gateSummary": {
    "totals": [{"status": "PASS", "count": 17}],
    "recentFailures": []
  },
  "quarantineDelta": {"before": 0, "after": 0, "delta": 0},
  "nextRecommendedLane": "owner-wsdor"
}
```

---

## 7. Post-Counts

| Table | Pre (phase 2) | Post | Delta |
|---|---|---|---|
| `legacy_pacs_raw.property` | 1 | 501 | +500 |
| `legacy_pacs_raw.prop_supp_assoc` | 0 | 0 | 0 |
| `legacy_pacs_raw.property_val` | 0 | 0 | 0 |
| `truth_pacs.parcel_spine` | 1 | 501 | +500 |
| `canonical_tf.tf_parcel` | 1 | 500 | +499* |
| `canonical_tf.tf_owner` | 0 | 0 | 0 |
| `canonical_tf.tf_improvement` | 0 | 0 | 0 |
| `canonical_tf.tf_land` | 0 | 0 | 0 |
| `canonical_tf.tf_sale` | 0 | 0 | 0 |
| `sync_bridge.load_batch` | 4 | 8 | +4 |
| `sync_bridge.source_xref` | 1 | 500 | +499* |
| `sync_bridge.promotion_gate_result` | 17 | 34 | +17 |
| `legacy_tf_unproven.imprv_current` | 0 | 0 | 0 |
| `legacy_tf_unproven.land_current` | 0 | 0 | 0 |
| `legacy_tf_unproven.owner_current` | 0 | 0 | 0 |
| `legacy_tf_unproven.sale` | 0 | 0 | 0 |

*`+499` on canonical and source_xref: the 500-row run's TopN=500 included the probe's
1 parcel (it was among the top 500). The canonicalizer upserted that 1 existing row +
inserted 499 new rows = 500 unique canonical parcels. truth_pacs.parcel_spine is
append-only per batch so it records both: 1 probe row + 500 new rows = 501 total spine rows.
The API response's `rowsCanonicalized=500` is the count for this run alone, not the net
unique delta.

---

## 8. Gate Summary

| Gate status | Count |
|---|---|
| PASS | 17 |
| FAIL | 0 |

Both the probe run and the 500-row run returned `17/17 PASS`. `recentFailures: []`.

---

## 9. Non-Parcel Lane Proof

All non-parcel canonical, truth, and landing tables at **0 rows** after both runs:

- `canonical_tf.tf_owner`: 0
- `canonical_tf.tf_improvement`: 0
- `canonical_tf.tf_land`: 0
- `canonical_tf.tf_sale`: 0
- `truth_pacs.owner_current`: 0
- `truth_pacs.imprv_current`: 0
- `truth_pacs.land_current`: 0
- `truth_pacs.sale`: 0
- `legacy_tf_unproven.imprv_current`: 0
- `legacy_tf_unproven.land_current`: 0
- `legacy_tf_unproven.owner_current`: 0
- `legacy_tf_unproven.sale`: 0

**Only the parcel lane changed.**

---

## 10. Source Safety

- `tf_mssql_data` Docker volume: NOT touched
- Old `terrafusion` DB (if any): NOT touched
- `terrafusion_dev_clean`: NOT touched (verified above)
- No manual mutation SQL executed
- No filter changes

---

## 11. Errors / Blockers

None. Both probe and 500-row run returned `status: "Succeeded"` with HTTP 200.

---

## 12. Owner-WSDOR Readiness Assessment

State after SCALE-001A:

| Condition | Status |
|---|---|
| Parcel lane complete (canonical_tf.tf_parcel seeded) | ✓ 500 unique parcels |
| source_xref populated (required for owner XRef lookup) | ✓ 500 xref rows |
| `nextRecommendedLane` from API | `owner-wsdor` |
| Non-parcel canonical tables at 0 | ✓ clean state |
| Gate status | 17/17 PASS |
| Quarantine at 0 | ✓ |

**Owner-WSDOR TopN=500 can proceed** — no blockers. Payload would be:
```json
{
  "OperatorName": "claude-scale001b-owner-500",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 500
}
```
Requires separate operator approval before execution.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | SUCCEEDED |
| DB_TARGET | `terrafusion_scale_proof` |
| PACS_SOURCE | `pacs_oltp_verify` (localhost:21433, D: copy) |
| ENDPOINT | `POST /api/sync/doctrine/drain/parcel` |
| TOPN | 500 |
| FULL_CORPUS | false (logged: `FullCorpus=False`) |
| ROWS_LANDED | 500 |
| ROWS_PROMOTED | 500 |
| ROWS_CANONICALIZED | 500 (500 unique parcels in canonical_tf.tf_parcel) |
| GATE_STATUS | 17/17 PASS |
| QUARANTINE_STATUS | before=0, after=0, delta=0 |
| NON_PARCEL_LANES | All at 0 rows — untouched |
| DEV_CLEAN_TOUCHED | No (83,326/83,687 unchanged) |
| ERRORS | None |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001A_PARCEL_500_RESULTS.md` |
| NEXT_WORK_ORDER | SCALE-001B — owner-wsdor TopN=500 (requires operator approval) |
