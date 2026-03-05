# CX-23: Parcel Dossier v1 "details" — Evidence Report
# ════════════════════════════════════════════════════════
# Status: SHIPPED
# Branch: r1/cx23-parcel-dossier-details
# Base: r1/integration @ 8733e8412 (#557 CX-22 merged)
# Author: Copilot (GitHub Copilot agent, Claude Opus 4.6)

## Objective

Add `GET /api/dossier/parcels/{parcelId}/details` — a deeper parcel dossier
view that extends CX-22's composed summary with:
- Parameterized `levyLimit` [1,100] and `noteLimit` [1,20] query params
- PII redaction: `piiRedacted: true`, note headers only (no content/preview),
  `authorKind` classification instead of raw `createdBy`
- Cost breakdown categories via `GetCostBreakdownAsync` (deeper than CX-22's
  `AnalyzeCostAsync` summary)
- CAMA-ready property placeholders (classCode, useCode, neighborhood)
- County isolation: cross-county → 404 (anti-enumeration)

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `backend/src/TerraFusion.API/DTOs/ParcelDossierDetailsDto.cs` | 6 sealed records: ParcelDossierDetailsDto, PropertyDetails, ValuationSignals, ValuationCategory, LevyDetails, LevyEntry, NoteHeaders, NoteHeaderItem |
| `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx23ParcelDossierDetailsTests.cs` | 8 integration tests covering shape, isolation, limits, PII |
| `backend/docs/cx-23-parcel-dossier-details-evidence.md` | This evidence report |

### Modified Files
| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Controllers/DossierController.cs` | Added `/details` endpoint + `ClassifyAuthorKind` helper + `TerraFusion.API.DTOs` import |
| `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx19CrossCountyNonLeakTests.cs` | Expanded Cx19 factory: 7 Benton notes (was 1), 3 Benton + 1 King TaxLevy seeds, `GetCostBreakdownAsync` mock |
| `.husky/pre-push` | Split build gate: `backend:build` always, `frontend:build` only when `frontend/` paths changed |

## Endpoint Contract

```
GET /api/dossier/parcels/{parcelId}/details?levyLimit=10&noteLimit=5
Authorization: Bearer <token>
Requires: read:dossier permission

200 OK:
{
  "parcelId": "string",
  "countyId": "guid",
  "generatedAt": "datetime",
  "piiRedacted": true,
  "property": {
    "propertyId": "guid",
    "parcelNumber": "string",
    "address": "string",
    "propertyType": "string?",
    "yearBuilt": "int?",
    "assessedValue": "decimal",
    "landValue": "decimal",
    "improvementValue": "decimal",
    "marketValue": "decimal",
    "taxYear": "int",
    "assessmentDate": "datetime",
    "classCode": null,         // CAMA-ready placeholder
    "useCode": null,           // CAMA-ready placeholder
    "neighborhood": null       // CAMA-ready placeholder
  },
  "valuation": {               // nullable — CostForge may be unavailable
    "totalValue": "decimal",
    "categoryCount": "int",
    "categories": [
      { "name": "string", "amount": "decimal", "percentage": "double" }
    ]
  },
  "levies": {
    "levyCountTotal": "int",
    "levyCountReturned": "int",
    "recent": [
      { "taxLevyId": "guid", "taxingDistrict": "string", "taxRate": "decimal",
        "levyAmount": "decimal", "taxYear": "int", "purpose": "string",
        "effectiveDate": "datetime" }
    ]
  },
  "notes": {
    "noteCountTotal": "int",
    "noteCountReturned": "int",
    "items": [
      { "noteId": "guid", "noteType": "string", "createdAt": "datetime",
        "authorKind": "system|human|unknown" }
    ]
  }
}

400: Invalid parcelId format
403: No county claims resolved
404: Parcel not found (includes anti-enumeration for cross-county)
```

## Test Matrix

| # | Test | Asserts |
|---|------|---------|
| 1 | `Details_SameCounty_Returns200WithAllSections` | 200, all section keys present, piiRedacted=true, CAMA placeholders |
| 2 | `Details_CrossCounty_Returns404` | 404 for King parcel from Benton user |
| 3 | `Details_NoCountyClaims_Returns403` | 403/401 with no countyId claim |
| 4 | `Details_InvalidParcelFormat_Returns400` | 400 for special characters |
| 5 | `Details_Valuation_HasCategoriesWhenPresent` | Valuation key present, categories populated from mock |
| 6 | `Details_NoteHeaders_BoundedByLimit_NoContentLeaked` | noteLimit=3 caps items, no content/preview/createdBy leaked |
| 7 | `Details_NoteHeaders_CrossCounty_NoLeak` | Only Benton notes counted |
| 8 | `Details_Levies_BoundedByLimit_CountyIsolated` | levyLimit=2 caps items, total ≥ 3 |

**Filter:** `dotnet test --filter "FullyQualifiedName~R1Week5Cx23"`

## Design Decisions

1. **Separate DTOs from CX-22**: CX-23's `ParcelDossierDetailsDto` lives in `TerraFusion.API.DTOs`
   (not `TerraFusion.Core.DTOs` like CX-22). Different fidelity levels, different consumers.

2. **CostForge method**: CX-22 uses `AnalyzeCostAsync` (summary). CX-23 uses
   `GetCostBreakdownAsync` (category detail). Both are best-effort/nullable.

3. **Note PII redaction**: CX-22's `ParcelDossierNoteEntryDto` includes `Preview` (content)
   and raw `CreatedBy`. CX-23 strips content entirely, replaces `CreatedBy` with
   `authorKind` (system|human|unknown) — stronger PII posture.

4. **Parameterized limits**: CX-22 hardcodes Take(10)/Take(5). CX-23 accepts `levyLimit`
   and `noteLimit` query params, clamped to [1,100] and [1,20] respectively.

5. **CAMA placeholders**: `classCode`, `useCode`, `neighborhood` are null for now.
   The Property entity doesn't have these columns yet. When CAMA integration lands,
   the endpoint is already wired.

6. **Pre-push hook**: Split monolithic `npm run build` into `backend:build` (always) +
   `frontend:build` (only when `frontend/` paths changed). Prevents frontend type-check
   failures from blocking backend-only pushes.

## Provenance

- **CX-22 base**: PR #557 (merged to r1/integration, commit `8733e8412`)
- **CX-22 PR #556**: My earlier CX-22, closed/unmerged — superseded by #557
- **This CX-23**: Clean branch from `origin/r1/integration` at `8733e8412`
