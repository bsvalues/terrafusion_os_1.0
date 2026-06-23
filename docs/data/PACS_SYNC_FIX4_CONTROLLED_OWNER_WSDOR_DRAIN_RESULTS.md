# WO-DATA-004B-FIX4 — Controlled Owner/WSDOR Drain Results

**Work Order:** WO-DATA-004B-FIX4
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner`
**Branch:** `docs/wo-data-004b-fix3-parcel-drain` (evidence branch; worktree origin/main @ `a90e97ba7`)
**Status:** COMPLETE — drain succeeded

---

## Mission

Run one tightly bounded controlled owner-wsdor pipeline drain against the verified
current PACS copy (`pacs_oltp_verify`) and `terrafusion_dev_clean`. This is the
second lane after the successful parcel drain (WO-DATA-004B-FIX3).

---

## DRAIN RESULT

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| Lane | owner-wsdor |
| Endpoint | `POST /api/sync/doctrine/drain/owner-wsdor` |
| Payload | `{"OperatorName":"claude-fix4-owner-wsdor-v1","WorkingYear":2026,"FullCorpus":false,"TopN":100}` |
| TopN | 100 |
| Duration | 24.90 sec |
| Status | Succeeded |
| BatchIds | 11 batches (one per stage) |

### Raw Response Payload

```json
{
  "lane": "owner-wsdor",
  "status": "Succeeded",
  "batchIds": [
    "a457293a-addd-40ef-81ae-548578af3edc",
    "7912819e-9d7d-4afb-8a5e-6935391c361d",
    "d4173ecd-b65e-49dd-8790-e07453a40ccb",
    "70f5c237-5c31-4c43-b245-86fb7d6b4e5e",
    "2f00f39b-d830-4824-8a94-9f3d04149b18",
    "a552a0bf-85dc-4e5d-88a8-d8cf5066bdae",
    "e2205bc0-4021-41f3-a6da-1a3bacef2c62",
    "88a425a5-3e56-4f18-bcd9-386a9941369d",
    "0f12c832-4c93-43c2-91f3-cf8de2a4d234",
    "df2212a8-bd75-47a3-ab9b-8157761e3287",
    "73fd91c1-9b83-4d44-9a69-645ce51895fc"
  ],
  "counts": {
    "rowsLanded": 199,
    "rowsPromotedToTruth": 199,
    "rowsCanonicalized": 283,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 24.8965091,
  "gateSummary": {
    "totals": [{ "status": "PASS", "count": 49 }],
    "recentFailures": []
  },
  "quarantineDelta": { "before": 0, "after": 0, "delta": 0 },
  "nextRecommendedLane": "improvement"
}
```

### Pipeline Counts

| Stage Output | Count | Note |
|---|---|---|
| Rows Landed (Owner-S1 + WPOV-S1) | **199** | 100 owners + 99 WPOV |
| Rows Promoted to Truth (Owner-Truth + WPOV-Truth) | **199** | 100 owner_current + 99 WPOV truth |
| Rows Canonicalized (Owner + Links + WSDOR) | **283** | 84 tf_owner + 100 links + 99 WSDOR |
| Rows Quarantined | 0 | |

### Gate Summary

| Status | Count |
|---|---|
| PASS | 49 |
| FAIL | 0 |

No gate failures. Quarantine delta: 0 before → 0 after → delta 0.

---

## Preflight — All Gates PASSED

### 1. Fresh Worktree Confirmed

API version from startup log:
`a90e97ba7a9474b303b769fa18ce0cfca394aa7d` — matches origin/main.

No shared checkout used. Worktree: `C:\Users\bsval\tf-fix4-owner`.

### 2. Dev Seeders Suppressed

Confirmed from startup log:
```
[STARTUP] Dev seeders skip=True (arg=False, TF_SKIP_DEV_SEEDERS=true)
[STARTUP] GPT seeding skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
[DX-01] Dossier seed skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
```

Doctrine seeders ran normally: 0 new rules inserted (already seeded from FIX3).

### 3. Connection Strings

| Setting | Value | Status |
|---|---|---|
| DefaultConnection | `Host=127.0.0.1;Database=terrafusion_dev_clean;Port=5432` | ✅ |
| PacsConnection | `Server=localhost,21433;Database=pacs_oltp_verify` | ✅ |
| TF_SKIP_DEV_SEEDERS | `true` | ✅ |

### 4. PACS Vintage Gate

```sql
SELECT COUNT(*) AS qualifying_rows, MAX(owner_tax_yr) AS max_yr
FROM prop_supp_assoc WHERE sup_num = 0 AND owner_tax_yr >= 2018
```

| qualifying_rows | max_yr |
|---|---|
| 774,728 | 2026 |

Current PACS confirmed ✅.

---

## Pre-Drain Counts

| Table | Pre-Count | Source |
|---|---|---|
| `legacy_pacs_raw.owner` | 100 | From FIX3 Owner-Seed-S1 |
| `legacy_pacs_raw.account` | 0 | Clean |
| `legacy_pacs_raw.prop_supp_assoc` | 0 | Clean |
| `legacy_pacs_raw.wash_prop_owner_val` | 0 | Clean |
| `truth_pacs.owner_current` | 0 | Clean |
| `canonical_tf.tf_owner` | 0 | Clean |
| `canonical_tf.tf_parcel_owner_link` | 0 | Clean |
| `canonical_tf.tf_assessment_wsdor` | 0 | Clean |
| `canonical_tf.tf_parcel` | 100 | From FIX3 |
| `truth_pacs.parcel_spine` | 100 | From FIX3 |
| `sync_bridge.load_batch` | 10 | From FIX3 (4 batches) |
| `sync_bridge.source_xref` | 100 | From FIX3 |
| `sync_bridge.promotion_gate_result` | 34 | From FIX3 (17 gates × 2 entries) |

---

## Post-Drain Counts

| Table | Pre | Post | Delta | Status |
|---|---|---|---|---|
| `legacy_pacs_raw.owner` | 100 | **200** | +100 | ✅ |
| `legacy_pacs_raw.account` | 0 | **84** | +84 | ✅ |
| `legacy_pacs_raw.prop_supp_assoc` | 0 | **95,811** | +95,811 | ✅ (all historical supp records for 100 parcels) |
| `legacy_pacs_raw.wash_prop_owner_val` | 0 | **99** | +99 | ✅ |
| `truth_pacs.owner_current` | 0 | **100** | +100 | ✅ |
| `canonical_tf.tf_owner` | 0 | **84** | +84 | ✅ (unique owner accounts) |
| `canonical_tf.tf_parcel_owner_link` | 0 | **100** | +100 | ✅ |
| `canonical_tf.tf_assessment_wsdor` | 0 | **99** | +99 | ✅ |
| `canonical_tf.tf_parcel` | 100 | **100** | 0 | ✅ (resume skipped, already seeded from FIX3) |
| `truth_pacs.parcel_spine` | 100 | **100** | 0 | ✅ (resume skipped) |
| `sync_bridge.load_batch` | 10 | **21** | +11 | ✅ (11 stages) |
| `sync_bridge.source_xref` | 100 | **283** | +183 | ✅ |
| `sync_bridge.promotion_gate_result` | 34 | **83** | +49 | ✅ (49 gates) |

### Canonicalized Breakdown

`rowsCanonicalized = 283` = 84 (tf_owner) + 100 (tf_parcel_owner_link) + 99 (tf_assessment_wsdor) = **283** ✅

### prop_supp_assoc Note

95,811 rows for 100 parcels is expected. The Supp-S1 stage fetches ALL supplement records for
the keyed (PropId, OwnerTaxYr) combinations — not just the active supplement. PACS stores
a full history of all supplement numbers per property-year, spanning from 1968 onward. Each
of the 100 parcels may have many historical supplement records.

---

## Non-Owner Lane Proof — UNTOUCHED

| Table | Post-Count | Status |
|---|---|---|
| `canonical_tf.tf_improvement` | 0 | ✅ Not touched |
| `canonical_tf.tf_land` | 0 | ✅ Not touched |
| `canonical_tf.tf_sale` | 0 | ✅ Not touched |
| `truth_pacs.imprv_current` | 0 | ✅ Not touched |
| `truth_pacs.land_current` | 0 | ✅ Not touched |
| `truth_pacs.sale` | 0 | ✅ Not touched |

---

## Source Integrity

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ Source volume untouched |
| Original PACS source: NOT touched | ✅ |
| D: copy is the only attached source (`pacs_oltp_verify`) | ✅ |
| `terrafusion_dev_clean`: only owner-wsdor tables touched | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| No fake dev seeders ran | ✅ Confirmed by startup log |
| No non-owner lanes called | ✅ Confirmed by post-counts |
| API from fresh origin/main worktree | ✅ Version `a90e97ba7` confirmed |

---

## Sync State

| Lane | Status |
|---|---|
| parcel | DONE (FIX3: 100/100/100) |
| owner-wsdor | DONE (FIX4: 199/199/283) |
| improvement | PENDING — next recommended lane |
| land | PENDING |
| sales | PENDING |
| geometry | PENDING |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| WORKTREE | `C:\Users\bsval\tf-fix4-owner` (origin/main @ `a90e97ba7`) |
| BRANCH | `docs/wo-data-004b-fix3-parcel-drain` (evidence branch) |
| FILES_CHANGED | None (docs only) |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| PACS_SOURCE | `pacs_oltp_verify` — SQL Server 2022 port 21433 — D: copy |
| ENDPOINT | `POST /api/sync/doctrine/drain/owner-wsdor` |
| TOPN | 100 |
| ROWS_LANDED | 199 (100 owner + 99 WPOV) |
| ROWS_PROMOTED | 199 (100 owner_current + 99 WPOV truth) |
| ROWS_CANONICALIZED | 283 (84 tf_owner + 100 parcel_owner_link + 99 assessment_wsdor) |
| OWNER_LINKS | 100 rows in `canonical_tf.tf_parcel_owner_link` |
| NON_OWNER_LANES | All at 0 — not touched |
| SYNC_STATE | 49 PASS / 0 FAIL, 0 quarantine |
| ERRORS | None |
| PR_OR_LOCAL_ARTIFACT | `docs/wo-data-004b-fix3-parcel-drain` @ commit `d7c772a00`, worktree `C:\Users\bsval\tf-docs-fix3` |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX5 — Controlled Improvement Drain (awaiting operator approval) |
