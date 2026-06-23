# WO-DATA-004B-FIX7 — Controlled Sales Drain Results

**Work Order:** WO-DATA-004B-FIX7
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner` (API runtime) / `C:\Users\bsval\tf-docs-fix3` (docs commit)
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** BLOCKED — hard blocker on first attempt; STOPPED per work order rules

---

## Mission

Run one tightly bounded controlled sales pipeline drain against the verified current PACS copy
(`pacs_oltp_verify`) and `terrafusion_dev_clean`. Fifth lane after parcel, owner-wsdor, improvement, land.

---

## DRAIN RESULT

| Field | Value |
|---|---|
| RESULT | **FAILED** |
| Lane | sales |
| Endpoint | `POST /api/sync/doctrine/drain/sales` |
| Payload | `{"OperatorName":"claude-fix7-sales-v1","WorkingYear":2026,"FullCorpus":false,"TopN":100}` |
| Status | Failed |
| FailedStage | Exception |
| Duration | 4.74 sec |
| RowsLanded | 0 |
| RowsPromoted | 0 |
| RowsCanonicalized | 0 |
| RowsQuarantined | 0 |

### Raw Response (truncated at error chain)

```json
{
  "lane": "sales",
  "status": "Failed",
  "failedStage": "Exception",
  "error": "DbUpdateException: An error occurred while saving the entity changes. || INNER: PostgresException: 22001: value too long for type character varying(8)",
  "batchIds": [],
  "counts": { "rowsLanded": 0, "rowsPromotedToTruth": 0, "rowsCanonicalized": 0, "rowsQuarantinedThisLane": 0 },
  "durationSec": 4.735104,
  "gateSummary": { "totals": [], "recentFailures": [] },
  "quarantineDelta": { "before": 588, "after": 588, "delta": 0 },
  "nextRecommendedLane": null
}
```

**Failure location:** `PacsSaleLandingService.LandSalesAsync` at
`TerraFusion.Data/Services/LegacyPacsRaw/PacsSaleLandingService.cs:line 201`

---

## Hard Blocker — Schema/Migration Gap

### Root Cause

**`legacy_pacs_raw.sale.wac_cd` is `varchar(8)` in the database but PACS source contains WAC/RCW
exemption code values up to 19+ characters.**

PostgreSQL error: `22001: value too long for type character varying(8)`

### Evidence

**PACS source values that overflow:**

| `wac_cd` value | Length |
|---|---|
| `RCW 82.45.010(3)(s)` | 19 |
| `458-61A-211(2)(e)` | 17 |
| `458-61A-306(2)(a)` | 17 |
| `458-61A-202(6)(g)` | 17 |
| `458-61A-202(6)(f)` | 17 |

These are valid Washington State RCW and WAC property transfer exemption codes. They are
real PACS source data, not bad data.

**Database actual column widths (`legacy_pacs_raw.sale`):**

| Column | DB varchar(n) | EF config MaxLength | Status |
|---|---|---|---|
| `SlCountyRatioCd` | **8** | 10 | ⚠️ DB behind config |
| `WacCd` | **8** | 32 | ❌ OVERFLOW — hard blocker |
| `SlRatioTypeCd` | **8** | 8 | ✅ Matches |

**EF configuration already has the correct widths** (see comment at line 27–36 of
`LegacyPacsRawSaleConfiguration.cs`):

```csharp
// SYNC-POP-2 finding #6: original fixture caps were 8/8/8, but real
// Harris PACS column widths (per PacsSale entity attributes) are:
//   sl_county_ratio_cd → 10
//   wac_cd             → 32
//   sl_ratio_type_cd   → 5  (kept at 8 here for headroom)
// Widened to match source-system reality.
builder.Property(x => x.SlCountyRatioCd).HasMaxLength(10);
builder.Property(x => x.WacCd).HasMaxLength(32);
builder.Property(x => x.SlRatioTypeCd).HasMaxLength(8);
```

**The EF migration to apply these widths was never generated.** The EF config was updated
(SYNC-POP-2 finding #6) but no `dotnet ef migrations add` was run. The `terrafusion_dev_clean`
database still has the original varchar(8) widths from the initial table creation.

**Last applied migration:** `20260616060820_AddForgeCostReference`
No migration between initial sale table creation and current `HEAD` widens `wac_cd` or `SlCountyRatioCd`.

### Required Fix

A new EF migration is needed:

```bash
dotnet ef migrations add WidenLegacyPacsRawSaleVarcharColumns \
  --project src/TerraFusion.Data/TerraFusion.Data.csproj \
  --startup-project src/TerraFusion.API/TerraFusion.API.csproj \
  --context TerraFusionDbContext
```

This migration will generate `AlterColumn` calls to widen:
- `wac_cd`: varchar(8) → varchar(32)
- `sl_county_ratio_cd`: varchar(8) → varchar(10)

Then apply it:

```bash
dotnet ef database update \
  --project src/TerraFusion.Data/TerraFusion.Data.csproj \
  --startup-project src/TerraFusion.API/TerraFusion.API.csproj \
  --context TerraFusionDbContext
```

**This is a non-destructive schema change** — widening varchar does not lose existing data.
No EF migration startup-project gotcha applies (no DROP TABLE risk here; widening only).

### Stop Condition

Per work order rules: "no code changes unless a hard blocker appears and you stop first."
**This is that stop.** No migration generated, no code changed, no DB mutated beyond the
failed landing attempt (0 rows landed — the transaction rolled back before commit).

Awaiting operator approval to generate and apply the migration as a new work order (FIX7A
or similar) before retrying FIX7.

---

## Preflight — Passed Before Drain Attempt

### 1. API Runtime

API healthy at `http://localhost:5046/health`. Running from `C:\Users\bsval\tf-fix4-owner`
(origin/main worktree, Release build). No shared checkout.

### 2. Dev Seeders Suppressed

`TF_SKIP_DEV_SEEDERS=true` confirmed.

### 3. Connection Strings

| Setting | Value | Status |
|---|---|---|
| DefaultConnection | `Host=127.0.0.1;Database=terrafusion_dev_clean;Port=5432` | ✅ |
| PacsConnection | `Server=localhost,21433;Database=pacs_oltp_verify` | ✅ |
| TF_SKIP_DEV_SEEDERS | `true` | ✅ |

### 4. PACS Vintage Gate

| qualifying_rows (owner_tax_yr ≥ 2018, sup_num=0) | max_yr | post-2018 sales |
|---|---|---|
| 774,728 | 2026 | 62,042 |

Current PACS confirmed ✅.

---

## Pre-Drain Counts

| Table | Pre-Count | Source |
|---|---|---|
| `legacy_pacs_raw.sale` | 0 | Clean |
| `truth_pacs.sale` | 0 | Clean |
| `canonical_tf.tf_sale` | 0 | Clean |
| `sync_bridge.load_batch` | 41 | From FIX3–FIX6 |
| `sync_bridge.source_xref` | 524 | From FIX3–FIX6 |
| `sync_bridge.promotion_gate_result` | 170 | From FIX3–FIX6 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | FIX5 quarantine |
| `canonical_tf.tf_parcel` | 100 | FIX3 — complete |
| `canonical_tf.tf_owner` | 84 | FIX4 — complete |
| `canonical_tf.tf_improvement` | 104 | FIX5 — complete |
| `canonical_tf.tf_land` | 137 | FIX6 — complete |

---

## Post-Drain Counts — UNCHANGED (drain failed, 0 rows written)

All tables remain at pre-drain values. The DB transaction rolled back on the varchar overflow.
No data was written to any sales table. No existing lane tables were affected.

---

## Carry-Forward — Improvement Lane Exception (FIX5)

> **IMPROVEMENT LANE STATUS (CARRY-FORWARD):** Operationally successful with quarantine
> handling, not fully clean. 588 unresolved imprv_attr codes in
> `legacy_tf_unproven.unresolved_imprv_attr` require future `attr-drain-1` release pass.
>
> **Known PACS duplicate-key issue:** `imprv-attr-key-uniqueness` — 3 duplicate 6-key tuples.
> Count must remain visible in all reports. Accepted; conditional on count staying at 3.

---

## Sync State

| Lane | Status |
|---|---|
| parcel | DONE (FIX3: 100/100/100, 17 PASS) |
| owner-wsdor | DONE (FIX4: 199/199/283, 49 PASS) |
| improvement | DONE with quarantine (FIX5: 52 PASS / 1 FAIL-known-pacs / 588 quarantine) |
| land | DONE (FIX6: 137/137/137, 34 PASS) |
| sales | **BLOCKED — schema migration gap on `wac_cd` varchar(8)→32** |
| geometry | PENDING |

---

## Source Integrity

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ |
| Original PACS source: NOT touched | ✅ |
| D: copy is the only attached source (`pacs_oltp_verify`) | ✅ |
| `terrafusion_dev_clean`: 0 rows written (transaction rolled back) | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| No fake dev seeders ran | ✅ |
| No code changes made | ✅ Stopped per work order rule |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **BLOCKED** |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| PACS_SOURCE | `pacs_oltp_verify` — SQL Server 2022 port 21433 — D: copy |
| ENDPOINT | `POST /api/sync/doctrine/drain/sales` |
| TOPN | 100 |
| ROWS_LANDED | 0 (transaction rolled back) |
| ROWS_PROMOTED | 0 |
| ROWS_CANONICALIZED | 0 |
| QUARANTINE_STATUS | 0 this lane; 588 FIX5 carry-forward unchanged |
| NON_SALES_LANES | All completed lanes unchanged; geometry still at 0 |
| SYNC_STATE | 0 PASS / 0 FAIL — drain did not reach gate evaluation |
| ERRORS | `PostgresException 22001: value too long for type character varying(8)` on `wac_cd` |
| BLOCKER | `legacy_pacs_raw.sale.wac_cd` is varchar(8) in DB; PACS values up to 19 chars; EF config already has `HasMaxLength(32)`; migration was never generated |
| REQUIRED_FIX | `dotnet ef migrations add WidenLegacyPacsRawSaleVarcharColumns` + `dotnet ef database update` |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix2a-pacs-copy-evidence`, this file |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX7A — Widen `legacy_pacs_raw.sale` varchar columns (schema migration, awaiting operator approval) |
