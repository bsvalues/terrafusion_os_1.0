# CX-22: Parcel Dossier v0 — Evidence Report

## Provenance

| Field | Value |
|-------|-------|
| **Branch** | `r1/cx22-parcel-dossier-v0` |
| **Commit** | `2f824b522` |
| **PR** | [#556](https://github.com/bsvalues/terrafusion_os_1.0/pull/556) |
| **Base** | `r1/integration` |
| **Author** | AI-Collaboration: GitHub Copilot (CX-22 session) |

## Summary
Implements `GET /api/dossier/parcels/{parcelId}/summary` — a read-only composition
endpoint returning property core fields, CostForge breakdown, county-scoped levy
history, and dossier notes summary. All data is county-isolated.

## Endpoint Contract

| Field | Value |
|-------|-------|
| **Route** | `GET /api/dossier/parcels/{parcelId}/summary?levyLimit=10` |
| **Auth** | `[Authorize]` + `RequiresPermission("read:dossier")` |
| **County Isolation** | Full (`ResolveCountyIdAsync` → property+levy+notes all county-scoped) |
| **Response DTO** | `ParcelDossierDto` |
| **PII** | OwnerSSN excluded from response |

## Response Shape

```json
{
  "parcelId": "CX19-BENTON-P1",
  "countyId": "19190019-...",
  "property": {
    "id": "...",
    "parcelNumber": "CX19-BN-001",
    "address": "100 Main St, Kennewick, WA",
    "ownerName": "...",
    "propertyType": "...",
    "yearBuilt": 1990,
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
  "levyHistory": [
    {
      "taxLevyId": "...",
      "taxingDistrict": "BENTON-GEN-001",
      "taxRate": 0.0123,
      "levyAmount": 3075,
      "taxYear": 2026,
      "purpose": "General Fund",
      "effectiveDate": "2026-01-01T00:00:00Z"
    }
  ],
  "notes": {
    "noteCount": 1,
    "latestNoteAt": "2026-..."
  },
  "generatedAtUtc": "2026-..."
}
```

## Files Changed

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/DTOs/ParcelDossierDto.cs` | NEW — composition DTO |
| `backend/src/TerraFusion.API/Controllers/DossierController.cs` | Add `ICostForgeService` injection + `/summary` endpoint |
| `backend/tests/.../R1Week5/R1Week5Cx22ParcelDossierV0Tests.cs` | NEW — 6 integration tests |
| `backend/tests/.../R1Week5/R1Week5Cx19CrossCountyNonLeakTests.cs` | Add `GetCostBreakdownAsync` mock + TaxLevy seed data |
| `backend/tests/.../R1Week3/AtlasDossierControllerGuardsTests.cs` | Fix constructor for new `ICostForgeService` param |
| `backend/tests/.../R1Week4/R1Week4Cx15BackendValidationSuiteTests.cs` | Fix constructor for new `ICostForgeService` param |
| `backend/docs/r1-week2-cx9-endpoint-contracts.md` | CX-22 bump — new `/summary` row + note |

## Test Evidence

| Test | Validates |
|------|-----------|
| `ParcelSummary_SameCounty_Returns200WithExpectedShape` | 200 + correct parcelId, countyId, property, notes, levy, costBreakdown |
| `ParcelSummary_CrossCounty_Returns404` | Benton user → King parcel → 404 (not leaked) |
| `ParcelSummary_NonExistentParcel_Returns404` | Non-existent parcel → 404 |
| `ParcelSummary_NoClaim_Returns403` | No countyId claim → 403 |
| `ParcelSummary_InvalidParcelFormat_Returns400` | SQL-injection-style parcel → 400 |
| `ParcelSummary_LevyHistory_DoesNotLeakCrossCounty` | Levy array contains zero King records |

Regression: CX-19D2 (5 tests ✓), CX-15 (5 tests ✓), AtlasDossier (7 tests ✓).

## Design Notes

- **CostForge integration**: `ICostForgeService.GetCostBreakdownAsync()` called with graceful
  try/catch fallback. If CostForge is unavailable, `costBreakdown` returns null — the endpoint
  still returns property + levy + notes.
- **Levy history is county-scoped** (not parcel-scoped) because levies apply at the district
  level, not individual parcel level. The `levyLimit` parameter caps results (default 10, max 100).
- **No new DI registrations required** — `ICostForgeService` was already registered in
  `Program.cs` (CX-8).
- **Retry-idempotency**: GET endpoint, fully idempotent by nature.

## Reproduction Commands

```bash
# Build (from backend/)
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release --no-restore

# Run CX-22 tests only
dotnet test tests/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj \
  --filter "FullyQualifiedName~R1Week5Cx22" --verbosity normal

# Run full regression (CX-15 + CX-19 + CX-22 + AtlasDossier)
dotnet test tests/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj \
  --filter "FullyQualifiedName~R1Week5|FullyQualifiedName~R1Week4Cx15|FullyQualifiedName~AtlasDossier" \
  --verbosity normal
```

## Performance Verification

Query count for `GET /parcels/{parcelId}/summary`:

| Step | Operation | Query Count | Notes |
|------|-----------|-------------|-------|
| 1 | `ResolveCountyIdAsync()` | 0–1 | 0 if Guid claim, 1 if name/FIPS lookup |
| 2 | Property lookup | 1 | `FirstOrDefaultAsync` with `Select` projection, `AsNoTracking` |
| 3 | CostForge breakdown | 1 (service) | Single `GetCostBreakdownAsync` call; null on failure |
| 4 | Levy history | 1 | `Where + OrderByDescending + Take(N) + Select`, `AsNoTracking` |
| 5 | Notes count | 1 | `CountAsync` |
| 6 | Latest note date | 0–1 | `MaxAsync` only if count > 0 |

**Total: 4–6 DB queries, O(1) per field group**. No N+1. No full-entity materialization.
All read queries use `AsNoTracking()` and server-side `Select` projection.
