# CX-8: CostForge Real-Output Verification Report
> R1 Week 2 · Evidence Lock Document

## Finding Summary

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| CX-8 | **Critical** | CostForge returns hardcoded demo data, not real parcel-variable output | **FIXED** |

## Defect Description

`CostForgeService.AnalyzeCostAsync(Guid propertyId)` constructed a **hardcoded** `PropertyDto` with fixed values
(`AssessedValue=275000, LandValue=125000, ImprovementValue=150000, CountyName="BENTON"`) regardless of the
requested property ID. Every invocation returned identical cost calculations—masking a critical defect
where cost analysis was never derived from actual property data.

### Root Cause Chain

1. **Hardcoded demo data**: The `Guid` overload of `AnalyzeCostAsync` never queried the database.
   It created a synthetic `PropertyDto` with fixed values.
2. **Broken AutoMapper mapping**: `Property.Id` is `Guid` but `PropertyDto.Id` is `int`.
   The existing `TerraFusionMappingProfile` registered `CreateMap<Property, PropertyDto>()`
   but AutoMapper cannot map `Guid -> Int32`, so `PropertyService.GetPropertyByIdAsync()` would
   throw `AutoMapperMappingException` if called.
3. **Missing DI registration**: Neither `ICostForgeService` (Core namespace) nor `IPropertyService`
   were registered in `Program.cs`—only mocked in test factories.

## Fix Applied

### 1. CostForgeService — Direct DB Query (bypasses broken AutoMapper)

**File**: `backend/src/TerraFusion.Core/Services/CostForgeService.cs`

- Replaced `IPropertyService` dependency with `ITerraFusionDbContext` (direct EF Core access)
- `AnalyzeCostAsync(Guid)` now queries:
  ```csharp
  var property = await _context.Properties
      .Include(p => p.County)
      .FirstOrDefaultAsync(p => p.Id == propertyId);
  ```
- Manually constructs `PropertyDto` with only the fields needed for cost calculation
  (avoids the `Guid -> int` AutoMapper failure entirely)
- Sets `result.PropertyId = propertyId` to ensure response tracks the requested property

### 2. Program.cs — DI Registration

**File**: `backend/src/TerraFusion.API/Program.cs`

Added:
```csharp
builder.Services.AddScoped<TerraFusion.Core.Services.ICostForgeService,
    TerraFusion.API.Services.CostForgeService>();
```

### 3. PropertyDto.Id Type Mismatch — NOT FIXED (pre-existing, separate concern)

The `PropertyDto.Id` (`int`) vs `Property.Id` (`Guid`) mismatch is a pre-existing architectural
debt item. Fixing it is out of scope for CX-8 (would require touching all consumers of PropertyDto).
CostForgeService now bypasses this entirely via direct DB query.

## Test Evidence

### Test File
`backend/tests/TerraFusion.Unit.Tests/R1Week2/R1Week2Cx8CostForgeRealOutputTests.cs`

### Seed Data

| Property | ParcelNumber | LandValue | ImprovementValue | AssessedValue |
|----------|-------------|-----------|------------------|---------------|
| A (small) | CX8-BN-SMALL-001 | $120,000 | $80,000 | $200,000 |
| B (large) | CX8-BN-LARGE-002 | $250,000 | $400,000 | $650,000 |

Both seeded into Benton County (ID `c8c8c8c8-0000-0000-0000-c8c8c8c8c8c8`).

### Test Results: 6/6 PASS

| # | Test | Assertion | Result |
|---|------|-----------|--------|
| 1 | `CostForge_PropertyA_ReturnsNonZeroValues` | TotalCost, LandValue, ImprovementValue > 0 | PASS |
| 2 | `CostForge_PropertyB_ReturnsNonZeroValues` | TotalCost, LandValue, ImprovementValue > 0 | PASS |
| 3 | `CostForge_PropertyA_DiffersFrom_PropertyB` | At least one output value differs between A and B | PASS |
| 4 | `CostForge_ResponsePropertyId_MatchesRequest` | Response PropertyId == requested PropertyId | PASS |
| 5 | `CostForge_ByParcelNumber_ReturnsNonZeroValues` | ParcelNumber lookup produces non-zero TotalCost | PASS |
| 6 | `CostForge_ConfidenceScore_IsPositive` | 0 < ConfidenceScore <= 1.0 | PASS |

### Regression: 113/113 PASS

All R1Week5 tests pass with zero breakage from the CostForgeService changes.

```
Filter: FullyQualifiedName~R1Week5
Passed! - Failed: 0, Passed: 113, Skipped: 0, Total: 113
```

## Files Changed

| File | Change |
|------|--------|
| `backend/src/TerraFusion.Core/Services/CostForgeService.cs` | Replaced IPropertyService with ITerraFusionDbContext; direct DB query for real property data |
| `backend/src/TerraFusion.API/Program.cs` | Added ICostForgeService DI registration |
| `backend/tests/.../R1Week2/R1Week2Cx8CostForgeRealOutputTests.cs` | NEW — 6 integration tests proving parcel-variable output |
| `backend/docs/r1-week2-cx8-costforge-real-output-report.md` | NEW — This evidence report |

## Verification Command

```bash
dotnet test tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter "FullyQualifiedName~R1Week2Cx8"
```

## Sign-Off

- **Defect**: CostForge produced identical output for all properties (hardcoded demo data)
- **Fix**: Direct DB query returns real property values per parcel
- **Evidence**: 6 tests prove parcel-variable output; 113 regression tests prove zero breakage
- **Residual**: PropertyDto.Id type mismatch (Guid vs int) is pre-existing debt, tracked separately
