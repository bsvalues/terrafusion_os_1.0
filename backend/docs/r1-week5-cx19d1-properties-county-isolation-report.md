# R1Week5 CX-19D1 Properties County Isolation Report

- Lane: `CX-19D1 (HIGH)`
- Branch: `copilot/r1-week5-cx19d1-properties-county-isolation`
- Baseline commit at execution start: `8e81bb0a6789cac333f9a0250ac00d5c4b0f6691`

## Summary

`GET /api/properties/{id}` now enforces server-side county scoping from caller claims.  
Cross-county access returns `404 NotFound` (non-leak), not `403`.

## Implementation

- `PropertiesController.GetProperty(Guid id)` now:
  - resolves county from `countyId` claim (GUID)
  - returns `Forbid()` when county context is missing/invalid
  - calls county-scoped service query
  - returns `NotFound()` when `(id, countyId)` has no match
- `IPropertyService` and `PropertyService` now expose/implement:
  - `GetPropertyByIdAsync(Guid id, Guid countyId)`
  - query path filtered by both property id and county id

## Locked Matrix Evidence

1. Unauthenticated request to `GET /api/properties/{GUID_A}` returns `401`
2. Authenticated same-county request returns `200`
3. Authenticated cross-county request returns `404` (non-leak)
4. Authenticated without county claims returns `403` (current policy behavior)

Implemented via:

- `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx19D1PropertiesCountyIsolationIntegrationTests.cs`
- Filter: `FullyQualifiedName~R1Week5Cx19D1`

## Commands and Results

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week5Cx19D1" -nologo -v minimal
```

Result: `Passed: 4, Failed: 0, Skipped: 0, Total: 4`

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week5" -nologo -v minimal
```

Result: `Passed: 108, Failed: 0, Skipped: 0, Total: 108`

## Explicit Non-Leak Statement

Cross-county retrieval through `GET /api/properties/{id}` is fixed by server-side county filtering.  
When the property exists in a different county, the endpoint returns `404 NotFound`.
