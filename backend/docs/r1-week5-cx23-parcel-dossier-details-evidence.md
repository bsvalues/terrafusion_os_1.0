# CX-23: Parcel Dossier v1 ("Details") — Evidence Report

## Provenance

| Field | Value |
|-------|-------|
| **Branch** | `r1/cx22-parcel-dossier-v0` (continuation) |
| **Base** | `r1/integration` |
| **PR** | #556 (appended to CX-22 delivery) |
| **Commit** | `c285cd61b` |
| **Author** | AI-Collaboration: GitHub Copilot (CX-23 session) |

## Summary

Implements `GET /api/dossier/parcels/{parcelId}/details` — a richer read-only
composition endpoint returning expanded property fields, valuation signals,
CostForge breakdown, levy history with total count, and note headers (metadata
only, no bodies). PII redacted (`piiRedacted: true`, OwnerSSN excluded).

## Endpoint Contract

| Field | Value |
|-------|-------|
| **Route** | `GET /api/dossier/parcels/{parcelId}/details?levyLimit=10&noteLimit=5` |
| **Auth** | `[Authorize]` + `RequiresPermission("read:dossier")` |
| **County Isolation** | Full (`ResolveCountyIdAsync` → property+levy+notes all county-scoped) |
| **Response DTO** | `ParcelDossierDetailsDto` |
| **PII** | OwnerSSN excluded; `piiRedacted: true` in metadata |

### Status Codes

| Code | Condition |
|------|-----------|
| `200` | Success (nullable fields may be `null` — see below) |
| `400` | Invalid `parcelId` format |
| `403` | No `countyId` claim |
| `404` | Parcel not found OR cross-county (anti-enumeration) |

### Query Parameters

| Param | Type | Default | Clamp |
|-------|------|---------|-------|
| `levyLimit` | int | 10 | [1, 100] |
| `noteLimit` | int | 5 | [1, 20] |

### Nullable Field Semantics

| Field | When null | Endpoint still 200? |
|-------|-----------|---------------------|
| `costBreakdown` | CostForge service throws | Yes |
| `property.classCode` | Not in schema yet | Yes |
| `property.useCode` | Not in schema yet | Yes |
| `property.neighborhood` | Not in schema yet | Yes |
| `property.landSummary` | Not in schema yet | Yes |
| `property.buildingSummary` | Not in schema yet | Yes |

## Response Shape

```json
{
  "parcelId": "CX19-BENTON-P1",
  "countyId": "19190019-...",
  "piiRedacted": true,
  "property": {
    "id": "...",
    "parcelNumber": "CX19-BN-001",
    "address": "100 Main St, Kennewick, WA",
    "ownerName": "...",
    "propertyType": null,
    "yearBuilt": 1990,
    "classCode": null,
    "useCode": null,
    "neighborhood": null,
    "landSummary": null,
    "buildingSummary": null
  },
  "valuation": {
    "assessedValue": 250000,
    "landValue": 100000,
    "improvementValue": 150000,
    "marketValue": 260000,
    "assessmentDate": "2026-...",
    "taxYear": 2026
  },
  "costBreakdown": {
    "propertyId": "...",
    "totalValue": 100000,
    "categories": [...]
  },
  "levy": {
    "levyCountTotal": 1,
    "history": [
      {
        "taxLevyId": "...",
        "taxingDistrict": "BENTON-GEN-001",
        "taxRate": 0.0123,
        "levyAmount": 3075,
        "taxYear": 2026,
        "purpose": "General Fund",
        "effectiveDate": "2026-01-01T00:00:00Z"
      }
    ]
  },
  "notes": {
    "noteCount": 7,
    "latest": [
      {
        "noteId": "...",
        "createdAt": "2026-...",
        "noteType": "case_note",
        "authorKind": "user"
      }
    ]
  },
  "generatedAtUtc": "2026-..."
}
```

## Files Changed

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/DTOs/ParcelDossierDetailsDto.cs` | NEW — v1 composition DTO |
| `backend/src/TerraFusion.API/Controllers/DossierController.cs` | Add `/details` endpoint |
| `backend/tests/.../R1Week5/R1Week5Cx23ParcelDossierDetailsTests.cs` | NEW — 8 integration tests |
| `backend/tests/.../R1Week5/R1Week5Cx19CrossCountyNonLeakTests.cs` | Expand Benton notes (7) for limit testing |
| `backend/docs/r1-week2-cx9-endpoint-contracts.md` | CX-23 bump — new `/details` row + unified status/param doc |

## Test Evidence

| Test | Validates |
|------|-----------|
| `Details_SameCounty_Returns200WithExpectedShape` | 200 + piiRedacted + property + valuation + levy + notes + costBreakdown |
| `Details_CrossCounty_Returns404` | Benton user → King parcel → 404 |
| `Details_NoClaim_Returns403` | No countyId claim → 403 |
| `Details_InvalidParcelFormat_Returns400` | SQL-injection-style parcel → 400 |
| `Details_CostForgeThrows_Returns200WithNullBreakdown` | costBreakdown nullable contract + other fields still present |
| `Details_NoteHeaders_BoundedToLimit` | 7 seeds, default limit 5, array ≤ 5, ordering newest-first |
| `Details_NoteHeaders_DoNotLeakCrossCounty` | All notes from Benton, valid authorKind |
| `Details_LevyHistory_DoesNotLeakCrossCounty` | Levy districts contain no King data |

Regression: CX-22 (6 ✓), CX-19D2 (13 ✓), CX-15 (5 ✓), AtlasDossier (7 ✓) = 57 total ✓.

## Performance Verification

Query count for `GET /parcels/{parcelId}/details`:

| Step | Operation | Query Count | Notes |
|------|-----------|-------------|-------|
| 1 | `ResolveCountyIdAsync()` | 0–1 | 0 if Guid claim, 1 if name/FIPS lookup |
| 2 | Property details | 1 | `FirstOrDefaultAsync` with `Select` projection, `AsNoTracking` |
| 3 | Valuation signals | 1 | Same table, `Select` projection, `AsNoTracking` |
| 4 | CostForge breakdown | 1 (service) | Single call; null on failure |
| 5 | Levy count total | 1 | `CountAsync` |
| 6 | Levy history | 1 | `Where + OrderByDesc + Take(N) + Select`, `AsNoTracking` |
| 7 | Notes count | 1 | `CountAsync` |
| 8 | Note headers | 1 | `Where + OrderByDesc + Take(N) + Select`, `AsNoTracking` |

**Total: 7–8 DB queries, ≤ 8 worst-case.** No N+1. All projected. All `AsNoTracking`.

## Design Notes

- **Note headers only**: Content excluded to prevent PII leakage. `authorKind`
  derived as "system" if `CreatedBy` starts with "system", else "user".
- **Schema-expansion placeholders**: `classCode`, `useCode`, `neighborhood`,
  `landSummary`, `buildingSummary` all return `null` until CAMA integration adds
  these columns to the Property entity.
- **`piiRedacted: true`**: Explicit metadata flag confirms OwnerSSN is excluded.
- **Reuses CX-22 seams**: Same `ResolveCountyIdAsync`, same `ICostForgeService`,
  same `LevyHistorySummary` DTO, same `IsValidParcelId` regex.
- **Retry-idempotency**: GET endpoint, fully idempotent.
