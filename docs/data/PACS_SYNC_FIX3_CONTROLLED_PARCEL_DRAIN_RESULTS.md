# WO-DATA-004B-FIX3 — Controlled Parcel Drain Results

**Work Order:** WO-DATA-004B-FIX3  
**Date:** 2026-06-17  
**Status:** BLOCKED — DI registration gap prevents endpoint execution

---

## Mission

Run one tightly bounded controlled parcel pipeline drain:
- TopN ≤ 100
- Verified PACS source: `pacs_oltp_verify` (SQL Server 2022, port 21433, D: copy only)
- Target: `terrafusion_dev_clean` (PostgreSQL Docker PG16)
- Parcel endpoint only

---

## Preflight Results

### 1. API Runtime Config — VERIFIED

| Setting | Value | Status |
|---|---|---|
| DefaultConnection | `Host=127.0.0.1;Database=terrafusion_dev_clean;...;Port=5432` | ✅ Correct |
| PacsConnection | `Server=localhost,21433;Database=pacs_oltp_verify;...` | ✅ Aligned to verified source |
| PacsSalesConnection | `Server=localhost,21433;Database=pacs_oltp_verify;...` | ✅ Aligned to verified source |
| DefaultCounty.Id | `4ec6e187-f053-4397-b87c-95d0ef9e99aa` | ✅ Benton |
| TF_SKIP_DEV_SEEDERS | `true` (set in launch config env) | ✅ Dev seeders suppressed |
| ASPNETCORE_ENVIRONMENT | `Development` | ✅ |

Config alignment performed: `PacsConnection` and `PacsSalesConnection` updated from
`localhost,1433/pacs_oltp` → `localhost,21433/pacs_oltp_verify` (pure config change, no logic
changed). This was required to point the drain at the verified current source rather than a
non-existent port.

### 2. Container State — VERIFIED

| Container | Port | Status |
|---|---|---|
| `tf-pacs-current-verify` | 21433 | Running |
| `terrafusion-postgres-dev` | 5432 | Running |
| `pacs-mdf-copy` | — | Running (idle, copy done) |

### 3. PACS Vintage — VERIFIED (from FIX2B)

| Metric | Value |
|---|---|
| DB | `pacs_oltp_verify` |
| `max_owner_tax_yr` | 2026 |
| Qualifying rows (`sup_num=0, year≥2018`) | **809,396** |
| `max_sl_dt` | 2026-01-13 |
| `post_2018_sales` | 62,042 |

### 4. API Health — VERIFIED

```
GET /health → 200 Healthy
{"status":"Healthy","service":"TerraFusion OS API - Basic Mode"}
```

---

## Pre-Drain Row Counts

Captured at 2026-06-17 before any drain attempt:

| Table | Pre-Count |
|---|---|
| `legacy_pacs_raw.property` | 0 |
| `legacy_pacs_raw.owner` | 0 |
| `truth_pacs.parcel_spine` | 0 |
| `truth_pacs.owner_current` | 0 |
| `canonical_tf.tf_parcel` | 0 |
| `canonical_tf.tf_owner` | 0 |
| `sync_bridge.load_batch` | 4 |
| `sync_bridge.source_xref` | 0 |
| `sync_bridge.promotion_gate_result` | 17 |
| `truth_pacs.imprv_current` (non-parcel) | 0 |
| `truth_pacs.land_current` (non-parcel) | 0 |
| `truth_pacs.sale` (non-parcel) | 0 |
| `canonical_tf.tf_improvement` (non-parcel) | 0 |
| `canonical_tf.tf_land` (non-parcel) | 0 |
| `canonical_tf.tf_sale` (non-parcel) | 0 |

---

## Drain Attempt

### Request

```
POST /api/sync/doctrine/drain/parcel
Authorization: Bearer dev-token
Content-Type: application/json

{
  "OperatorName": "claude-fix3-parcel-current-v1",
  "WorkingYear": 2026,
  "FullCorpus": false,
  "TopN": 100
}
```

### Response

```
HTTP 500 Internal Server Error

System.InvalidOperationException: No service for type
'TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService'
has been registered.
```

---

## BLOCKER: Missing DI Registrations

The parcel drain endpoint (`DoctrineDrainController.DrainParcel`) requires three services via
`[FromServices]` injection. All three implementations exist in `TerraFusion.Data` but are **not
registered** in `Program.cs`.

### Missing Registrations

| Interface | Implementation | File |
|---|---|---|
| `TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService` | `TerraFusion.Data.Services.LegacyPacsRaw.PacsPropertyLandingService` | Slice S1 — raw property landing |
| `TerraFusion.Core.Sync.PacsParcelTruth.IPacsParcelSpineTruthPromoter` | `TerraFusion.Data.Services.TruthPacs.PacsParcelSpineTruthPromoter` | Slice S2-B — parcel spine truth promoter |
| `TerraFusion.Core.Sync.PacsParcelCanonical.IPacsParcelCanonicalProjector` | `TerraFusion.Data.Services.CanonicalTf.PacsParcelCanonicalProjector` | Slice S3 — parcel canonical projector |

### What IS registered (for comparison)

The following equivalent services for other lanes ARE registered in `Program.cs`:

```csharp
// Owner lane — registered at line 1656
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsOwner.IPacsOwnerLandingService,
    TerraFusion.Data.Services.LegacyPacsRaw.PacsOwnerLandingService>();

// Imprv lane — registered at line 1671
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsImprv.IPacsImprvLandingService,
    TerraFusion.Data.Services.LegacyPacsRaw.PacsImprvLandingService>();

// Owner truth — registered at line 1705
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsOwnerTruth.IPacsOwnerCurrentTruthPromoter,
    TerraFusion.Data.Services.TruthPacs.PacsOwnerCurrentTruthPromoter>();
```

### Fix Required (Operator Approval Needed)

Three `AddScoped` lines need to be added to `Program.cs` — same pattern as the existing
registrations above. No new implementations. No logic changes. Purely wiring existing code into DI:

```csharp
// Slice S1: raw property landing — PACS property → legacy_pacs_raw.property
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService,
    TerraFusion.Data.Services.LegacyPacsRaw.PacsPropertyLandingService>();

// Slice S2-B: parcel spine truth promoter — legacy_pacs_raw.property → truth_pacs.parcel_spine
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelTruth.IPacsParcelSpineTruthPromoter,
    TerraFusion.Data.Services.TruthPacs.PacsParcelSpineTruthPromoter>();

// Slice S3: parcel canonical projector — truth_pacs.parcel_spine → canonical_tf.tf_parcel
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelCanonical.IPacsParcelCanonicalProjector,
    TerraFusion.Data.Services.CanonicalTf.PacsParcelCanonicalProjector>();
```

---

## Source Integrity

- `tf_mssql_data` Docker volume: **NOT touched**
- Original PACS source: **NOT touched**
- TerraFusion DB (`terrafusion_dev_clean`): **NOT mutated** (drain was blocked before any write)
- No manual SQL executed
- No fake seeders ran
- No other lanes called

---

## Post-Drain Row Counts

No drain occurred. All tables remain at pre-drain levels (all zero).

---

## Next Work Order

**FIX3 cannot proceed until operator approves the three DI registration additions.**

Once approved, the fix is a targeted `Program.cs` edit — add 3 `AddScoped` lines near the
existing lane registrations at line ~1725. Then rebuild and re-run the drain with the same
payload. No other code changes required.
