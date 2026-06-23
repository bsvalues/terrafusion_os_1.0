# WO-DATA-004B-FIX6 — Controlled Land Drain Results

**Work Order:** WO-DATA-004B-FIX6
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner` (API runtime) / `C:\Users\bsval\tf-docs-fix3` (docs commit)
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** COMPLETE — drain succeeded

---

## Mission

Run one tightly bounded controlled land pipeline drain against the verified current PACS copy
(`pacs_oltp_verify`) and `terrafusion_dev_clean`. Fourth lane after parcel (FIX3),
owner-wsdor (FIX4), and improvement (FIX5).

---

## Preflight — All Gates PASSED

### 1. API Runtime

API healthy at `http://localhost:5046/health`. Running from `C:\Users\bsval\tf-fix4-owner`
(origin/main worktree, Release build). No shared checkout used.

### 2. Dev Seeders Suppressed

`TF_SKIP_DEV_SEEDERS=true` in environment. Confirmed no dev seeder activity.

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

Current PACS confirmed ✅. Container: `tf-pacs-current-verify`, port 21433.

---

## Pre-Drain Counts

| Table | Pre-Count | Note |
|---|---|---|
| `legacy_pacs_raw.land_detail` | **137** | Pre-seeded by improvement drain's LandDetail-S1 non-blocking stage |
| `truth_pacs.land_current` | 0 | Clean |
| `canonical_tf.tf_land` | 0 | Clean |
| `sync_bridge.load_batch` | 33 | From FIX3+FIX4+FIX5 |
| `sync_bridge.source_xref` | 387 | From FIX3+FIX4+FIX5 |
| `sync_bridge.promotion_gate_result` | 136 | From FIX3+FIX4+FIX5 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | FIX5 improvement quarantine (carried forward) |
| `canonical_tf.tf_parcel` | 100 | From FIX3 — unchanged |
| `canonical_tf.tf_owner` | 84 | From FIX4 — unchanged |
| `canonical_tf.tf_improvement` | 104 | From FIX5 — unchanged |
| `canonical_tf.tf_improvement_feature` | 312 | From FIX5 — unchanged |
| `canonical_tf.tf_sale` | 0 | Pending, untouched |

### Pre-Drain Land Detail Note

The 137 pre-existing rows in `legacy_pacs_raw.land_detail` were seeded by the improvement drain's
non-blocking **LandDetail-S1** stage (line 876–893 of `DoctrineDrainController.cs`). This stage
seeds land detail as a side-input to the improvement universe classifier. The truth and canonical
tables were still at 0, so no promotion had occurred — the land drain's Land-S1 stage re-seeds
and the promoter picks up the canonical 137.

---

## DRAIN RESULT

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| Lane | land |
| Endpoint | `POST /api/sync/doctrine/drain/land` |
| Payload | `{"OperatorName":"claude-fix6-land-v1","WorkingYear":2026,"FullCorpus":false,"TopN":100}` |
| TopN | 100 |
| Duration | 7.23 sec |
| Status | Succeeded |
| BatchIds | 8 batches |

### Raw Response Payload

```json
{
  "lane": "land",
  "status": "Succeeded",
  "batchIds": [
    "00e9d257-3613-4eb9-a819-d194843b2f4e",
    "588e5d07-576b-47cd-95fe-a90be83e901d",
    "2dbebef2-309b-4912-8222-99e680a69e66",
    "ec7b170c-a340-4e1d-9b2c-32d908a6f28e",
    "0b3019e1-6729-4f2b-ab3c-0bf89902ec33",
    "23f05b13-b859-4598-9cab-bc6772d2fbbd",
    "621cfdda-4531-4fa8-bd47-b1cfb254743d",
    "bb0b5e38-9d07-4daf-9561-ad18a5e33104"
  ],
  "counts": {
    "rowsLanded": 137,
    "rowsPromotedToTruth": 137,
    "rowsCanonicalized": 137,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 7.2315903,
  "gateSummary": {
    "totals": [{ "status": "PASS", "count": 34 }],
    "recentFailures": []
  },
  "quarantineDelta": { "before": 588, "after": 588, "delta": 0 },
  "nextRecommendedLane": "sales"
}
```

### Pipeline Counts

| Stage Output | Count | Note |
|---|---|---|
| Rows Landed | **137** | land_detail rows from Land-S1 stage |
| Rows Promoted to Truth | **137** | land_current |
| Rows Canonicalized | **137** | canonical_tf.tf_land |
| Rows Quarantined | **0** | Clean — no quarantine this lane |

### Gate Summary

| Status | Count |
|---|---|
| PASS | 34 |
| FAIL | 0 |

No gate failures. Quarantine delta: 588 → 588 → delta 0 (existing FIX5 improvement quarantine unchanged).

---

## Post-Drain Counts

| Table | Pre | Post | Delta | Status |
|---|---|---|---|---|
| `legacy_pacs_raw.land_detail` | 137 | **274** | +137 | ✅ (137 pre-seeded + 137 from Land-S1; promoter picks 137 unique) |
| `truth_pacs.land_current` | 0 | **137** | +137 | ✅ |
| `canonical_tf.tf_land` | 0 | **137** | +137 | ✅ |
| `sync_bridge.load_batch` | 33 | **41** | +8 | ✅ (8 stages) |
| `sync_bridge.source_xref` | 387 | **524** | +137 | ✅ |
| `sync_bridge.promotion_gate_result` | 136 | **170** | +34 | ✅ (34 gates) |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | **588** | 0 | ✅ FIX5 quarantine unchanged |

### Land Detail Doubling Explained

`legacy_pacs_raw.land_detail` went from 137 → 274. This is correct and expected:
- 137 were seeded by the improvement drain's non-blocking LandDetail-S1 (prior run)
- 137 were seeded by the land drain's Land-S1 stage (this run)
- The promoter reads the landing table and promotes 137 unique land records to `truth_pacs.land_current`
- No data loss; no corruption. The landing table is append-only staging.

---

## Completed Lanes — UNCHANGED

| Table | Expected | Post-Count | Status |
|---|---|---|---|
| `canonical_tf.tf_parcel` | 100 | **100** | ✅ FIX3 — unchanged |
| `truth_pacs.parcel_spine` | 100 | — | ✅ (not re-queried; load_batch delta shows no parcel activity) |
| `canonical_tf.tf_owner` | 84 | **84** | ✅ FIX4 — unchanged |
| `canonical_tf.tf_improvement` | 104 | **104** | ✅ FIX5 — unchanged |
| `canonical_tf.tf_improvement_feature` | 312 | **312** | ✅ FIX5 — unchanged |
| `truth_pacs.imprv_current` | 104 | **104** | ✅ FIX5 — unchanged |

---

## Non-Land Lane Proof — UNTOUCHED

| Table | Post-Count | Status |
|---|---|---|
| `canonical_tf.tf_sale` | 0 | ✅ Not touched |
| `truth_pacs.sale` | 0 | ✅ Not touched |

---

## Source Integrity

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ Source volume untouched |
| Original PACS source: NOT touched | ✅ |
| D: copy is the only attached source (`pacs_oltp_verify`) | ✅ |
| `terrafusion_dev_clean`: only land tables touched | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| No fake dev seeders ran | ✅ |
| No non-land lanes called | ✅ Confirmed by post-counts |
| API from fresh origin/main worktree | ✅ |

---

## Improvement Lane Carry-Forward (from FIX5)

> **IMPROVEMENT LANE STATUS (CARRY-FORWARD):** The improvement lane is operationally successful
> with quarantine handling, **not fully clean**. 588 unresolved imprv_attr codes remain in
> `legacy_tf_unproven.unresolved_imprv_attr` and require a future `attr-drain-1` release pass.
>
> **Known PACS duplicate-key issue (carry-forward):** `imprv-attr-key-uniqueness` gate flagged
> 3 duplicate 6-key tuples in the FIX5 improvement drain. Count must remain visible in all
> reports. Accepted as known PACS source data; acceptance conditional on count staying at 3.

---

## Sync State

| Lane | Status |
|---|---|
| parcel | DONE (FIX3: 100/100/100, 17 PASS) |
| owner-wsdor | DONE (FIX4: 199/199/283, 49 PASS) |
| improvement | DONE with quarantine (FIX5: 1004 landed / 104 promoted / 416 canonicalized / 588 quarantine, 52 PASS / 1 FAIL-known-pacs) |
| land | DONE (FIX6: 137/137/137, 34 PASS, 0 quarantine) |
| sales | PENDING |
| geometry | PENDING |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| PACS_SOURCE | `pacs_oltp_verify` — SQL Server 2022 port 21433 — D: copy |
| ENDPOINT | `POST /api/sync/doctrine/drain/land` |
| TOPN | 100 |
| ROWS_LANDED | 137 |
| ROWS_PROMOTED | 137 (`truth_pacs.land_current`) |
| ROWS_CANONICALIZED | 137 (`canonical_tf.tf_land`) |
| QUARANTINE_STATUS | 0 this lane; 588 FIX5 improvement quarantine carried forward unchanged |
| NON_LAND_LANES | `tf_sale` = 0 — not touched |
| SYNC_STATE | 34 PASS / 0 FAIL, 0 quarantine this lane |
| ERRORS | None |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix2a-pacs-copy-evidence`, this file |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX7 — Controlled Sales Drain (awaiting operator approval) |
