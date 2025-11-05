# TerraFusion Tests

This folder hosts multiple test tiers. The default, reliable baseline is a minimal smoke test project that runs without external infrastructure. Heavier suites (integration, performance) are isolated and opt-in.

## Test tiers

- Unit (smoke):
  - Project: `TerraFusion.Unit.SmokeTests`
  - Purpose: Fast, infra-free sanity checks to keep CI green
  - Status: Enabled and passing

- Legacy/aggregate tests:
  - Project: `TerraFusion.Tests`
  - Purpose: Historical aggregate project that previously pulled in unit/integration/perf sources
  - Status: Compiles; heavy suites are excluded by design. No infra deps.

- Integration:
  - Project: `TerraFusion.Integration.Tests`
  - Purpose: Containerized integration tests (e.g., Postgres, API, migrations)
  - Status: **6/6 tests passing** ✅
  - Requirements: Docker runtime
  - Key Test Suites:
    - **County Isolation Tests (5/5)** - Validates strict tenant data boundaries
      - `GetProperty_WithValidCountyCode_ReturnsOnlyCountyData` - Ensures queries filter by county
      - `GetProperty_WithoutCountyCodeFilter_ShouldNotBeUsed` - Prevents cross-county leaks
      - `UpdateProperty_OnlyAffectsTargetCounty` - Validates update isolation
      - `DeleteProperty_OnlyAffectsTargetCounty` - Validates delete isolation
      - `BulkOperation_EnforcesCountyIsolation` - Validates bulk operation boundaries
    - **PostgreSQL Container Tests (1/1)** - Testcontainers infrastructure validation
  - Opt-in: Not part of default CI; run manually or via VS Code task

- Performance:
  - Project: `TerraFusion.Performance.Tests`
  - Purpose: Load and microbenchmark tests (NBomber, BenchmarkDotNet)
  - Status: Enabled; opt-in only
  - Example: NBomber load test, BenchmarkDotNet microbenchmark
  - Opt-in: Not part of default CI; run manually or via VS Code task

## How to run

Run the smoke tests (recommended):

```bash
cd backend/tests/TerraFusion.Unit.SmokeTests
dotnet test --nologo
```

Run tests from the tests folder (compiles legacy aggregate project and any enabled tests):

```bash
cd backend/tests
dotnet test --nologo
```

Run integration tests (requires Docker):

```bash
cd backend/tests/TerraFusion.Integration.Tests
dotnet test --nologo
```

Run performance tests:

```bash
cd backend/tests/TerraFusion.Performance.Tests
dotnet test --nologo
```

## VS Code tasks

- Run Unit Smoke Tests
- Run Backend Tests (legacy)
- Run Integration Tests
- Run Performance Tests
- Run TerraFusion Diagnostic

Access via Command Palette → Tasks: Run Task

## County Isolation Validation

**Government Compliance Critical**: TerraFusion enforces strict tenant data boundaries across 39 Washington State counties.

### Schema Standards
- All county-scoped entities use `Guid CountyId` foreign keys
- All user-scoped entities use `Guid UserId` foreign keys
- Reference entities: `County.Id` and `GovernmentUser.Id` are both `Guid`

### Integration Test Coverage
The `CountyIsolationTests` suite provides audit-ready proof of tenant isolation:

1. **Read Isolation**: `GetProperty_WithValidCountyCode_ReturnsOnlyCountyData`
   - Creates properties in 3 counties
   - Verifies queries return ONLY the target county's data
   - Ensures no cross-county leaks in SELECT operations

2. **Anti-Pattern Detection**: `GetProperty_WithoutCountyCodeFilter_ShouldNotBeUsed`
   - Verifies repositories correctly throw exceptions for unscoped queries
   - Prevents accidental cross-county data exposure

3. **Update Isolation**: `UpdateProperty_OnlyAffectsTargetCounty`
   - Updates property in County A
   - Verifies County B and C properties remain unchanged
   - Validates UPDATE operations respect tenant boundaries

4. **Delete Isolation**: `DeleteProperty_OnlyAffectsTargetCounty`
   - Deletes property in County A
   - Verifies County B and C properties still exist
   - Validates DELETE operations respect tenant boundaries

5. **Bulk Operation Isolation**: `BulkOperation_EnforcesCountyIsolation`
   - Performs bulk update across multiple properties in County A
   - Verifies County B properties remain untouched
   - Validates batch operations maintain strict isolation

### Usage Pattern (from tests)
```csharp
// Create county-scoped context
var context = CreateContext("test-king-wa");

// All queries MUST include countyCode parameter
var property = await repository.GetByIdAsync(countyCode, propertyId);

// Repository throws exception if countyCode omitted
await Assert.ThrowsAsync<ArgumentException>(() =>
    repository.GetAllAsync() // Missing countyCode - prevents cross-county leaks
);
```

### Best Practices
- **NEVER** query without `countyCode` parameter
- **ALWAYS** validate `CountyId` foreign keys are `Guid` types
- **USE** in-memory database for fast county isolation testing
- **REFERENCE** `CountyIsolationTests.cs` as canonical pattern implementation

## Notes

- `TerraFusion.Tests.csproj` excludes `unit/**`, `integration/**`, `performance/**`, and `TestSetup.cs` to avoid placeholder and infra-dependent sources.
- Duplicate assembly attribute issues were resolved by setting `GenerateAssemblyInfo=false` and `GenerateTargetFrameworkAttribute=false` in the legacy tests project.
- Integration tests require Docker to be running and available on the system.
- Performance tests are opt-in and may require additional system resources for load/benchmark scenarios.
