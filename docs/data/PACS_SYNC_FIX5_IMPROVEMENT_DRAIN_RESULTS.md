# WO-DATA-004B-FIX5 / FIX5A — Controlled Improvement Drain Results

**Work Order:** WO-DATA-004B-FIX5 (drain) / WO-DATA-004B-FIX5A (DI blocker resolution)
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner` (API runtime) / `C:\Users\bsval\tf-docs-fix3` (docs commit)
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** COMPLETE — drain succeeded

---

## FIX5A — DI Blocker Resolution

### Root Cause

FIX5 first attempt hit HTTP 500: `IPropertyUniverseClassifier` could not be resolved. Root cause was a
binary compiled from a **stale shared working tree**, not missing registration.

`IPropertyUniverseClassifier → PropertyUniverseClassifier` (Singleton) IS registered in origin/main at
`Program.cs` lines 1871–1873:

```csharp
// SYNC-DOCTRINE-4: property-universe classifier. Singleton with
// ConcurrentDictionary cache; loads rules from
// doctrine_tf.tf_doctrine_property_universe via IServiceScopeFactory.
builder.Services.AddSingleton<
    TerraFusion.Core.Sync.Doctrine.IPropertyUniverseClassifier,
    TerraFusion.Data.Services.Doctrine.PropertyUniverseClassifier>();
```

### Fix Applied

**No code change.** The fix was:

1. Kill old API process (PID 31092, stale binary)
2. Clean Release build from `tf-fix4-owner` (origin/main worktree):
   `dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release -v:q` → exit 0
3. Restart API from Release binary with `TF_SKIP_DEV_SEEDERS=true`
4. Confirm health endpoint (`http://localhost:5046/health`) — ready

**Lesson confirmed:** All drain work must run from a fresh origin/main worktree binary. Never the shared
checkout. Runtime DI errors against origin/main code = stale binary, not missing registration.

---

## Mission

Run one tightly bounded controlled improvement pipeline drain against the verified current PACS copy
(`pacs_oltp_verify`) and `terrafusion_dev_clean`. Third lane after successful parcel (FIX3) and
owner-wsdor (FIX4) drains.

---

## DRAIN RESULT

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| Lane | improvement |
| Endpoint | `POST /api/sync/doctrine/drain/improvement` |
| Payload | `{"OperatorName":"claude-fix5-improvement-v1","WorkingYear":2026,"FullCorpus":false,"TopN":100}` |
| TopN | 100 |
| Duration | 34.69 sec |
| Status | Succeeded |
| BatchIds | 12 batches |

### Raw Response Payload

```json
{
  "lane": "improvement",
  "status": "Succeeded",
  "batchIds": [
    "9aa14ef6-bfa8-4745-9fc9-53d68db8ea62",
    "9b0e8bce-f28b-4432-bb02-c9f0add45e20",
    "c00ab016-ef6c-4266-9407-dcf23b1b9a36",
    "0163eff4-d42c-4d3d-810a-2724c18f7341",
    "5f15659b-68e5-4247-90a9-f77b04c7e259",
    "a3d53819-166a-4049-9984-9bfd92c768ba",
    "002f66b7-e088-4884-b8cb-fda002fe1086",
    "7bf2c646-62fb-4a84-b246-fe479ec0e2c0",
    "df6e633e-44a5-459d-bf82-5c169bfd45fd",
    "b4195acc-bc61-45b9-a258-bbdcd5fe2414",
    "9ac3bea9-58a3-4c1f-83e8-504e1d2b5293",
    "96126912-faef-4a8c-9a78-ce83087806d3"
  ],
  "counts": {
    "rowsLanded": 1004,
    "rowsPromotedToTruth": 104,
    "rowsCanonicalized": 416,
    "rowsQuarantinedThisLane": 588
  },
  "durationSec": 34.6853527,
  "gateSummary": {
    "totals": [
      { "status": "FAIL", "count": 1 },
      { "status": "PASS", "count": 52 }
    ],
    "recentFailures": [
      {
        "loadBatchId": "b4195acc-bc61-45b9-a258-bbdcd5fe2414",
        "gateName": "imprv-attr-key-uniqueness",
        "gateStage": "SOURCE_TO_RAW",
        "status": "FAIL",
        "expected": "0",
        "actual": "3",
        "detail": "3 6-key tuples appeared more than once",
        "executedAt": "2026-06-18T16:43:46.423183Z"
      }
    ]
  },
  "quarantineDelta": { "before": 0, "after": 588, "delta": 588 },
  "nextRecommendedLane": "land"
}
```

### Pipeline Counts

| Stage Output | Count | Note |
|---|---|---|
| Rows Landed | **1,004** | 104 imprv + 312 imprv_detail + 588 imprv_attr |
| Rows Promoted to Truth | **104** | imprv_current |
| Rows Canonicalized | **416** | 104 tf_improvement + 312 tf_improvement_feature |
| Rows Quarantined | **588** | imprv_attr — unresolvable attribute codes |

### Gate Summary

| Status | Count |
|---|---|
| PASS | 52 |
| FAIL | 1 |

---

## Gate FAIL — imprv-attr-key-uniqueness

**Gate:** `imprv-attr-key-uniqueness`
**Stage:** `SOURCE_TO_RAW`
**Detail:** 3 duplicate 6-key tuples detected in PACS source

This is a **known PACS data quality issue**, not a code error. The same anomaly was surfaced and
documented in SYNC-COMPLETE-3 (TopN=200 drain, 2026-05). Harris PACS stores 3 duplicate imprv_attr
tuples for certain properties; the gate correctly flags them. The drain still succeeded — these 3 tuples
are accounted for within the 588 quarantine cohort.

**No code change required.** This is PACS source data.

> **PRODUCTION REPORTING REQUIREMENT:** The known duplicate-key PACS issue (3 duplicate 6-key
> `imprv_attr` tuples, gate `imprv-attr-key-uniqueness`) must **not be silently ignored** in
> production reporting. It must appear as a flagged anomaly in any improvement lane drain report,
> attributed to PACS source data, with the exact duplicate count recorded. Acceptance is conditional
> on the count remaining at 3; any increase signals new PACS data corruption.

---

## Quarantine — 588 Rows

588 `imprv_attr` rows quarantined under the SYNC-DOCTRINE-4 taxonomy.
All are in `legacy_tf_unproven.unresolved_imprv_attr` — unresolvable attribute codes
(landing-layer quarantine, same cohort pattern as SYNC-DOCTRINE-4-V7 found for the full corpus at
9,504 rows TopN=full; TopN=100 sample lands 588).

| Table | Count |
|---|---|
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 |
| `legacy_tf_unproven.unproven_imprv_attr_triage` | 0 |

These are valid PACS imprv_attr codes not yet in the attribute dictionary. They are **not lost** —
they await the `attr-drain-1` release pass (SYNC-DOCTRINE-4-V8 pattern). Not a blocker for lane
progression.

> **IMPROVEMENT LANE STATUS:** The improvement lane is operationally successful with quarantine
> handling, **not fully clean**. Canonical data (`canonical_tf.tf_improvement`,
> `canonical_tf.tf_improvement_feature`) is uncontaminated. The 588 unresolved attributes are
> isolated in `legacy_tf_unproven.unresolved_imprv_attr` and require a future `attr-drain-1`
> release pass before they can be promoted.

---

## Preflight — All Gates PASSED

### 1. Fresh Worktree Confirmed

API running from `C:\Users\bsval\tf-fix4-owner` (origin/main), Release build, clean binary.
No shared checkout used.

### 2. Dev Seeders Suppressed

`TF_SKIP_DEV_SEEDERS=true` — confirmed via health endpoint response and startup log pattern.

### 3. Connection Strings

| Setting | Value | Status |
|---|---|---|
| DefaultConnection | `Host=127.0.0.1;Database=terrafusion_dev_clean;Port=5432` | ✅ |
| PacsConnection | `Server=localhost,21433;Database=pacs_oltp_verify` | ✅ |
| TF_SKIP_DEV_SEEDERS | `true` | ✅ |

---

## Pre-Drain Counts

| Table | Count | Source |
|---|---|---|
| `legacy_pacs_raw.imprv` | 0 | Clean |
| `legacy_pacs_raw.imprv_detail` | 0 | Clean |
| `legacy_pacs_raw.imprv_attr` | 0 | Clean |
| `truth_pacs.imprv_current` | 0 | Clean |
| `canonical_tf.tf_improvement` | 0 | Clean |
| `canonical_tf.tf_improvement_feature` | 0 | Clean |
| `sync_bridge.load_batch` | 21 | From FIX3+FIX4 |
| `sync_bridge.source_xref` | 283 | From FIX3+FIX4 |
| `sync_bridge.promotion_gate_result` | 83 | From FIX3+FIX4 |

---

## Post-Drain Counts

| Table | Pre | Post | Delta | Status |
|---|---|---|---|---|
| `legacy_pacs_raw.imprv` | 0 | **104** | +104 | ✅ |
| `legacy_pacs_raw.imprv_detail` | 0 | **312** | +312 | ✅ |
| `legacy_pacs_raw.imprv_attr` | 0 | **588** | +588 | ✅ (quarantined) |
| `truth_pacs.imprv_current` | 0 | **104** | +104 | ✅ |
| `canonical_tf.tf_improvement` | 0 | **104** | +104 | ✅ |
| `canonical_tf.tf_improvement_feature` | 0 | **312** | +312 | ✅ |
| `sync_bridge.load_batch` | 21 | **33** | +12 | ✅ |
| `sync_bridge.source_xref` | 283 | **387** | +104 | ✅ |
| `sync_bridge.promotion_gate_result` | 83 | **136** | +53 | ✅ |

### Canonicalized Breakdown

`rowsCanonicalized = 416` = 104 (tf_improvement) + 312 (tf_improvement_feature) = **416** ✅

### Landed Breakdown

`rowsLanded = 1004` = 104 (imprv) + 312 (imprv_detail) + 588 (imprv_attr) = **1,004** ✅

---

## Non-Improvement Lane Proof — UNTOUCHED

| Table | Post-Count | Status |
|---|---|---|
| `canonical_tf.tf_land` | 0 | ✅ Not touched |
| `canonical_tf.tf_sale` | 0 | ✅ Not touched |
| `truth_pacs.land_current` | 0 | ✅ Not touched |
| `truth_pacs.sale` | 0 | ✅ Not touched |

---

## Source Integrity

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ Source volume untouched |
| Original PACS source: NOT touched | ✅ |
| D: copy is the only attached source (`pacs_oltp_verify`) | ✅ |
| `terrafusion_dev_clean`: only improvement tables touched | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| No fake dev seeders ran | ✅ |
| No non-improvement lanes called | ✅ Confirmed by post-counts |
| API from fresh origin/main worktree | ✅ |

---

## Sync State

| Lane | Status |
|---|---|
| parcel | DONE (FIX3: 100/100/100, 17 PASS) |
| owner-wsdor | DONE (FIX4: 199/199/283, 49 PASS) |
| improvement | DONE (FIX5: 1004 landed / 104 promoted / 416 canonicalized / 588 quarantine, 52 PASS / 1 FAIL-known-pacs) |
| land | PENDING |
| sales | PENDING |
| geometry | PENDING |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SUCCEEDED** |
| FIX5A_CODE_CHANGE | None — registration existed in origin/main at lines 1871–1873 |
| FIX5A_FIX | Kill stale binary → clean Release build → restart API |
| WORKTREE | `C:\Users\bsval\tf-fix4-owner` (origin/main) |
| BRANCH | `docs/wo-data-004b-fix2a-pacs-copy-evidence` |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| PACS_SOURCE | `pacs_oltp_verify` — SQL Server 2022 port 21433 — D: copy |
| ENDPOINT | `POST /api/sync/doctrine/drain/improvement` |
| TOPN | 100 |
| ROWS_LANDED | 1,004 (104 imprv + 312 imprv_detail + 588 imprv_attr) |
| ROWS_PROMOTED | 104 (imprv_current) |
| ROWS_CANONICALIZED | 416 (104 tf_improvement + 312 tf_improvement_feature) |
| ROWS_QUARANTINED | 588 (imprv_attr — known attribute code gap, not a blocker) |
| GATE_FAIL | 1 (imprv-attr-key-uniqueness — known PACS dup tuple, not a code error) |
| GATE_PASS | 52 |
| NON_IMPROVEMENT_LANES | All at 0 — not touched |
| ERRORS | None |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX6 — Controlled Land Drain (awaiting operator approval) |
