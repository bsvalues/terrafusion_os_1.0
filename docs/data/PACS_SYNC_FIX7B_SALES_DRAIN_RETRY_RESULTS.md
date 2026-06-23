# WO-DATA-004B-FIX7B — Controlled Sales Drain Retry Results

**Work Order:** WO-DATA-004B-FIX7B
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner` (API runtime) / `C:\Users\bsval\tf-docs-fix3` (docs commit)
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** COMPLETE — sales drain succeeded after FIX7A schema width alignment

---

## Mission

Retry the controlled sales drain after WO-DATA-004B-FIX7A widened
`legacy_pacs_raw.sale.wac_cd` (varchar(8)→32) and `sl_county_ratio_cd` (varchar(8)→10).
Fifth active lane after parcel (FIX3), owner-wsdor (FIX4), improvement (FIX5), land (FIX6).

---

## FIX7A Migration Proof

Confirmed before drain via `information_schema.columns`:

| Column | Post-FIX7A Width | EF Config MaxLength | Status |
|---|---|---|---|
| `WacCd` | `character varying(32)` | 32 | ✅ Aligned |
| `SlCountyRatioCd` | `character varying(10)` | 10 | ✅ Aligned |
| `SlRatioTypeCd` | `character varying(8)` | 8 | ✅ Unchanged |

Migration `20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment` applied — no pending
migrations on `terrafusion_dev_clean`.

---

## Preflight — All Gates PASSED

### 1. Infrastructure (post-reboot)

| Container | Status | Port |
|---|---|---|
| `terrafusion-postgres-dev` | Up | 5432 |
| `tf-pacs-current-verify` | Up | 21433 |
| PACS MDF copy | Complete (Exited 0 before reboot) | — |

### 2. API Runtime

API started from Release binary in `C:\Users\bsval\tf-fix4-owner`:

```bash
TF_API_PORT=5046 TF_SKIP_DEV_SEEDERS=true ASPNETCORE_ENVIRONMENT=Development \
  dotnet bin/Release/net8.0/TerraFusion.API.dll --urls http://localhost:5046
```

Health: `{"status":"Healthy","environment":"Development","version":"1.0.0"}` ✅

### 3. Dev Seeders Suppressed

```
[STARTUP] GPT seeding skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
[DX-01] Dossier seed skipped by TF_SKIP_DEV_SEEDERS/--skip-dev-seeders.
[STARTUP] Dev seeders skip=True (arg=False, TF_SKIP_DEV_SEEDERS=true)
DoctrineRatioPolicySeederHostedService: 0 new rule(s) inserted
DoctrinePropertyUniverseSeederHostedService: 0 rules added / 0 dict entries added
SalesQualificationCodesSeederHostedService: 0 new rule(s) inserted
```

All doc seeders idempotent (0 inserts). ✅

### 4. Connection Strings (from appsettings.Development.local.json)

| Setting | Value | Status |
|---|---|---|
| `DefaultConnection` | `Host=127.0.0.1;Database=terrafusion_dev_clean;Port=5432` | ✅ |
| `PacsConnection` | `Server=localhost,21433;Database=pacs_oltp_verify` | ✅ |
| `PacsSalesConnection` | `Server=localhost,21433;Database=pacs_oltp_verify` | ✅ |

### 5. PACS Vintage Gate

| Metric | Value | Status |
|---|---|---|
| qualifying_rows (owner_tax_yr ≥ 2018, sup_num=0) | 774,728 | ✅ |
| max_yr | 2026 | ✅ Current PACS |
| post-2018 sales (`pacs_oltp_verify.dbo.sale`) | 62,042 | ✅ |

---

## Pre-Drain Counts

| Table | Pre-Count | Note |
|---|---|---|
| `legacy_pacs_raw.sale` | 0 | Clean |
| `truth_pacs.sale` | 0 | Clean |
| `canonical_tf.tf_sale` | 0 | Clean |
| `canonical_tf.tf_parcel` | 100 | FIX3 — 100 parcels |
| `canonical_tf.tf_owner` | 84 | FIX4 — unchanged |
| `canonical_tf.tf_improvement` | 104 | FIX5 — unchanged |
| `canonical_tf.tf_land` | 137 | FIX6 — unchanged |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | FIX5 quarantine carry-forward |
| `sync_bridge.load_batch` | 42 | FIX3–FIX6 |
| `sync_bridge.source_xref` | 524 | FIX3–FIX6 |
| `sync_bridge.promotion_gate_result` | 170 | FIX3–FIX6 |
| Geometry tables | 0 | Untouched |

---

## DRAIN RESULT

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| Lane | sales |
| Endpoint | `POST /api/sync/doctrine/drain/sales` |
| Payload | `{"OperatorName":"claude-fix7b-sales-retry-v1","WorkingYear":2026,"FullCorpus":false,"TopN":100}` |
| Duration | 14.22 sec |
| Status | Succeeded |
| BatchIds | 7 batches |

### Raw Response Payload

```json
{
  "lane": "sales",
  "status": "Succeeded",
  "batchIds": [
    "fb1b4a53-6337-45bc-82b2-08eb05d39621",
    "8fa3014d-ea66-4b47-a2f4-f067bdaad4a4",
    "799967db-9b9d-47d8-afcd-e3819d72ea68",
    "defff567-7017-4efd-be94-15c70d1dc3b1",
    "675b9d31-10d4-4bbe-92aa-dcda23166391",
    "22a3cd29-ed31-4dc3-9be3-036bf89d0bb7",
    "278faa40-efea-4df8-a35e-aebe53b94ddc"
  ],
  "counts": {
    "rowsLanded": 100,
    "rowsPromotedToTruth": 61,
    "rowsCanonicalized": 61,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 14.2233597,
  "gateSummary": {
    "totals": [
      {"status": "PASS", "count": 30},
      {"status": "WARN", "count": 1}
    ],
    "recentFailures": [
      {
        "loadBatchId": "799967db-9b9d-47d8-afcd-e3819d72ea68",
        "gateName": "truth-pacs-supp-aware-join",
        "gateStage": "RAW_TO_TRUTH",
        "status": "WARN",
        "expected": "0",
        "actual": "4",
        "detail": "noSuppPointer=4 staleSupNum=0",
        "executedAt": "2026-06-18T23:49:51.119693Z"
      }
    ]
  },
  "quarantineDelta": {"before": 588, "after": 588, "delta": 0},
  "nextRecommendedLane": "geometry"
}
```

### Pipeline Counts

| Stage Output | Count | Note |
|---|---|---|
| Rows Landed | **100** | `legacy_pacs_raw.sale` |
| Rows Promoted to Truth | **61** | `truth_pacs.sale` (doctrine qualification filter) |
| Rows Canonicalized | **61** | `canonical_tf.tf_sale` |
| Rows Quarantined | **0** | No quarantine this lane |

**39 non-promoted:** Filtered by sales qualification doctrine (not WAC/RCW error — the
schema fix unblocked landing; doctrine promotion rules filtered ineligible sales normally).

**Promoted sale date range:** 2025-12-11 to 2026-01-08 (recent, WorkingYear=2026 qualified sales).

---

## Gate Summary

| Status | Count |
|---|---|
| PASS | 30 |
| WARN | 1 |
| FAIL | 0 |

**WARN — `truth-pacs-supp-aware-join`:** `noSuppPointer=4 staleSupNum=0`

4 sale records have no supplement pointer in `prop_supp_assoc`. This is a data quality
observation — these sales landed correctly but 4 cannot be cross-referenced to a supplement
record. Not a blocker. Not a schema error. WARN (not FAIL) is the correct gate status.

---

## Sale Qualification / Doctrine Behavior

100 landed, 61 promoted (61%). Doctrine qualification rules filtered 39 as non-qualified.
This is expected: not all sales in PACS meet the DOR ratio study qualification criteria
(sl_ratio_type_cd or sl_county_ratio_cd qualification thresholds per SYNC-DOCTRINE-3 rules).

No `PostgresException 22001` errors — WacCd overflow is fully resolved by FIX7A.

---

## Post-Drain Counts

| Table | Pre | Post | Delta | Status |
|---|---|---|---|---|
| `legacy_pacs_raw.sale` | 0 | **100** | +100 | ✅ Landed |
| `truth_pacs.sale` | 0 | **61** | +61 | ✅ Promoted |
| `canonical_tf.tf_sale` | 0 | **61** | +61 | ✅ Canonicalized |
| `canonical_tf.tf_parcel` | 100 | **160** | +60 | ✅ See note below |
| `canonical_tf.tf_owner` | 84 | **84** | 0 | ✅ Unchanged |
| `canonical_tf.tf_improvement` | 104 | **104** | 0 | ✅ Unchanged |
| `canonical_tf.tf_land` | 137 | **137** | 0 | ✅ Unchanged |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | **588** | 0 | ✅ Quarantine unchanged |
| `sync_bridge.load_batch` | 42 | **49** | +7 | ✅ 7 batches this drain |
| `sync_bridge.source_xref` | 524 | **645** | +121 | ✅ 61 parcel + 61 sale xrefs |
| `sync_bridge.promotion_gate_result` | 170 | **201** | +31 | ✅ 30 PASS + 1 WARN |

### tf_parcel +60 Explained

The sales drain's parcel cross-reference stage creates canonical `tf_parcel` stub entries
for properties referenced by promoted sales that are not yet in the canonical parcel table.

Source_xref breakdown by entity type and operator:

| TfEntityType | Operator | Count |
|---|---|---|
| parcel | `claude-fix6-land-v1` | 99 |
| parcel | `claude-fix7b-sales-retry-v1` | 61 |
| sale | `claude-fix7b-sales-retry-v1` | 61 |

The land drain referenced 99 parcels (all already in FIX3's 100). The sales drain
referenced 61 additional parcels — 1 overlapped with existing parcels, 60 were new stubs
for sale-referenced properties. Net result: tf_parcel 100→160.

**This is expected pipeline behavior**, not a leakage or side-channel. No manual INSERT was
used. The 60 new parcel stubs serve as cross-reference anchors for the 61 promoted sales.

---

## Geometry Lane — UNTOUCHED

| Check | Result |
|---|---|
| `canonical_tf.tf_parcel_geometry` | 0 (table not present / empty) |
| `canonical_tf.tf_geometry` | 0 (table not present / empty) |
| `legacy_pacs_raw.geometry` | 0 |
| No geometry drain called | ✅ |
| `nextRecommendedLane = "geometry"` | ✅ Noted — FIX8 requires separate approval |

---

## Non-Sales Lane Proof — UNCHANGED

| Table | Expected | Post-Count | Status |
|---|---|---|---|
| `canonical_tf.tf_owner` | 84 | **84** | ✅ FIX4 — unchanged |
| `canonical_tf.tf_improvement` | 104 | **104** | ✅ FIX5 — unchanged |
| `canonical_tf.tf_land` | 137 | **137** | ✅ FIX6 — unchanged |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | **588** | ✅ FIX5 quarantine unchanged |

---

## Source Integrity

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ |
| Original PACS source: NOT touched | ✅ |
| D: copy (`pacs_oltp_verify`): read-only drain source | ✅ |
| `terrafusion_dev_clean`: only sales tables + parcel stubs written | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| No fake dev seeders ran | ✅ |
| No geometry drain called | ✅ |
| API from fresh origin/main worktree Release build | ✅ |

---

## Improvement Lane Carry-Forward (from FIX5)

> **IMPROVEMENT LANE STATUS (CARRY-FORWARD):** The improvement lane is operationally
> successful with quarantine handling, **not fully clean**. 588 unresolved imprv_attr codes
> remain in `legacy_tf_unproven.unresolved_imprv_attr` and require a future `attr-drain-1`
> release pass.
>
> **Known PACS duplicate-key issue (carry-forward):** `imprv-attr-key-uniqueness` gate
> flagged 3 duplicate 6-key tuples. Count must remain visible in all reports. Accepted as
> known PACS source data; acceptance conditional on count staying at 3.

---

## Sync State

| Lane | Status |
|---|---|
| parcel | DONE (FIX3: 100/100/100, 17 PASS) |
| owner-wsdor | DONE (FIX4: 199/199/283, 49 PASS) |
| improvement | DONE with quarantine (FIX5: 1004/104/416, 52 PASS / 1 FAIL-known / 588 quarantine) |
| land | DONE (FIX6: 137/137/137, 34 PASS, 0 quarantine) |
| sales | **DONE (FIX7B: 100/61/61, 30 PASS / 1 WARN, 0 quarantine)** |
| geometry | PENDING — requires WO-DATA-004B-FIX8 approval |

---

## Geometry Readiness

The sales drain completed cleanly. `nextRecommendedLane = "geometry"` per the API response.
Geometry is the final lane. **FIX8 requires separate operator approval** — do not start
automatically.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| PACS_SOURCE | `pacs_oltp_verify` — SQL Server 2022 port 21433 — D: copy |
| ENDPOINT | `POST /api/sync/doctrine/drain/sales` |
| TOPN | 100 |
| ROWS_LANDED | 100 |
| ROWS_PROMOTED | 61 (`truth_pacs.sale`) |
| ROWS_CANONICALIZED | 61 (`canonical_tf.tf_sale`) |
| QUARANTINE_STATUS | 0 this lane; 588 FIX5 improvement quarantine unchanged |
| GATE_STATUS | 30 PASS / 1 WARN (`truth-pacs-supp-aware-join`: noSuppPointer=4) / 0 FAIL |
| NON_SALES_LANES | tf_owner=84, tf_improvement=104, tf_land=137 — all unchanged |
| ERRORS | None — WacCd varchar(32) resolved by FIX7A |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix2a-pacs-copy-evidence`, this file |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX8 — Controlled Geometry Drain (awaiting operator approval) |
