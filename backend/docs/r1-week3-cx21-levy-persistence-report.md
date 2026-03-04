# CX-21: Levy Calculation Persistence + Retrieval Report
> R1 Week 3 · Evidence Lock Document

## Finding Summary

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| CX-21 | **High** | Levy calculations are fire-and-forget — no audit trail, no retrieval | **FIXED** |

## Defect Description

`LevyCalculationController.CalculateOptimalRate()` computed levy rates correctly from request inputs
but never persisted the results. Calculations were purely ephemeral — no audit trail existed for
government compliance (FISMA), no history endpoint allowed retrieval of past calculations.

The `TaxLevies` table (with `CountyId`, `TaxingDistrict`, `TaxRate`, `LevyAmount`, `TaxYear`,
`Purpose`, `EffectiveDate`) existed in the core schema but was never written to or read from.

### Architecture Gap: Two Disconnected Levy Systems

| System | Location | Used by Controller? |
|--------|----------|-------------------|
| `LevyCalculationController` (inline math) | API project | Self-contained |
| `TerraFusion.Levy` service + `LevyDbContext` | `backend/src/TerraFusion.Levy/` | Registered in DI, never called |
| Core `TaxLevies` DbSet | `TerraFusionDbContext` | **Never read or written** (pre-CX-21) |

## Fix Applied

### 1. LevyCalculationController — Persist After Calculate

**File**: `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs`

After successful `calculate-rate`, the controller now:
- Creates a `TaxLevy` record with `CountyId` (from resolved county context), `TaxingDistrict`,
  `TaxRate`, `LevyAmount`, `TaxYear`, `Purpose`, `EffectiveDate`
- Persists via `_db.TaxLevies.Add()` + `SaveChangesAsync()`
- Returns `TaxLevyId` (Guid) in the response DTO for traceability

### 2. Batch Calculate — Sequential Persistence

Batch calculate (`calculate-batch`) was refactored from `Parallel.ForEachAsync` (which was
unsafe with a single `DbContext`) to sequential processing with a single `SaveChangesAsync()`
after all calculations complete. Each result includes its `TaxLevyId`.

### 3. History Endpoint — County-Isolated Retrieval

New endpoint: `GET /api/levy-calculation/history?taxYear=N&districtId=X`

- County isolation enforced via `ResolveCountyContextAsync()`
- Queries `_db.TaxLevies` filtered by caller's `CountyId`
- Returns up to 200 records ordered by `EffectiveDate` descending
- Response: `List<LevyHistoryDto>` with `TaxLevyId`, `CountyId`, `TaxingDistrict`,
  `TaxRate`, `LevyAmount`, `TaxYear`, `Purpose`, `EffectiveDate`

### 4. DTO Enhancement

`LevyCalculationResultDto` now includes `TaxLevyId` (nullable Guid) linking each
calculation to its persisted audit record.

## Test Evidence

### Test File
`backend/tests/TerraFusion.Unit.Tests/R1Week3/R1Week3Cx21LevyPersistenceTests.cs`

### Seed Data
Two counties seeded (Benton + King) for county isolation testing.
No property data needed — Levy calculation takes all inputs from request body.

### Test Results: 6/6 PASS

| # | Test | Assertion | Result |
|---|------|-----------|--------|
| 1 | `Levy_Calculate_ReturnsNonZeroAndPersists` | AiOptimalRate > 0, ProjectedRevenue > 0, TaxLevyId non-null | PASS |
| 2 | `Levy_DifferentInputs_ProduceDifferentOutputs` | District A rate ≠ District B rate (different AV/budget) | PASS |
| 3 | `Levy_CalculateThenHistory_RoundTrip` | Calculate → GET history → find same TaxLevyId + matching rate | PASS |
| 4 | `Levy_History_CountyIsolated` | Benton levy NOT visible to King caller | PASS |
| 5 | `Levy_StatutoryCompliance_FlaggedCorrectly` | Compliant rate → `isCompliant=true`; Over-limit → `isCompliant=false` | PASS |
| 6 | `Levy_BatchCalculate_PersistsMultipleRecords` | 2 batch items → both appear in history | PASS |

## Architectural Note: DbContext Thread Safety

The previous `Parallel.ForEachAsync` with max 8 concurrent tasks sharing a single
`TerraFusionDbContext` was a latent thread-safety issue. CX-21 replaces this with
sequential processing. For production batch volumes (>100 items), a scoped DbContext
per batch partition should be considered — tracked as future optimization.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs` | Persistence, history endpoint, batch fix, DTO enhancement |
| `backend/tests/.../R1Week3/R1Week3Cx21LevyPersistenceTests.cs` | 6 integration tests + factory |
| `backend/docs/r1-week3-cx21-levy-persistence-report.md` | This evidence report |

## Verification Command

```bash
dotnet test tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter "FullyQualifiedName~R1Week3Cx21"
```

## Sign-Off

- **Defect**: Levy calculations were ephemeral with no audit trail
- **Fix**: Persist to TaxLevies + county-isolated history endpoint
- **Evidence**: 6 tests prove persistence, round-trip, county isolation, input-variable outputs
- **Bonus**: Fixed latent thread-safety issue in batch calculate (Parallel.ForEachAsync with shared DbContext)
