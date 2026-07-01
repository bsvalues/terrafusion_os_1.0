# WO-BACKEND-002 — Build Warning Burn-Down Evidence

Date: 2026-06-30

## Scope

WO-BACKEND-002 established the backend warning baseline after WO-BACKEND-001 and burned down low-risk, mechanical nullable warnings in the out-of-solution API test project.

Allowed scope:

- Backend build warning evidence.
- Mechanical test-only nullability fixes.
- No runtime behavior changes.
- No production, deployment, secrets, county data, PACS, or SQL access.

## Baseline

The canonical backend solution remains warning-clean:

```powershell
dotnet build backend\TerraFusion.sln --no-restore --property:WarningLevel=999
```

Result:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

WO-BACKEND-001 also identified `backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj` as an out-of-solution test project. Building that project directly initially produced 30 nullable warnings.

## Mechanical Repairs

The warning burn-down changed only test files:

- `backend/TerraFusion.API.Tests/AuditCorrelationTests.cs`
- `backend/TerraFusion.API.Tests/SystemIntegrationTests.cs`
- `backend/TerraFusion.API.Tests/Integration/CountyStudioSmokeTests.cs`

Changes were limited to:

- Explicit non-null validation before parsing audit log JSON payloads.
- Explicit deserialization guards in skipped aspirational integration tests.
- Default initializers for test DTO properties.
- A null assertion before checking a saved County Studio scenario result.

No backend runtime files were changed.

## Validation

Out-of-solution API test warning gate:

```powershell
dotnet build backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --no-restore --property:WarningLevel=999
```

Result:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

Canonical backend solution warning gate:

```powershell
dotnet build backend\TerraFusion.sln --no-restore --property:WarningLevel=999
```

Result:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

Out-of-solution API test execution:

```powershell
dotnet test backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --no-build --logger "console;verbosity=minimal"
```

Result:

```text
Failed: 9, Passed: 649, Skipped: 35, Total: 693
```

Failure classes observed:

- Missing Rust valuation kernel binaries.
- Phase 12 orphan-interface guard expectations for absent interfaces.
- Phase 13 trace-contract expectations for missing `tools/tf` CLI files.
- Phase 14 controller security boundary expectation drift.
- Authentication rate-limit baseline returning HTTP 500.
- County Studio adjustment-set transition expectation drift.

These failures pre-exist the nullable warning burn-down and require separate backend operational WOs. They were not patched in WO-BACKEND-002 because doing so would exceed the warning burn-down scope.

## Conclusion

WO-BACKEND-002 is complete for warning discipline:

- Canonical backend solution build: warning-clean.
- Out-of-solution API test build: warning-clean.
- Runtime code changed: no.
- Dependency changes: no.
- Pipeline or workflow changes: no.

## Next Recommended WO

Proceed to `WO-BACKEND-003 — Service Registry Validation`.

Carry forward the API test execution failures as backend operational gaps, not as warning-baseline failures.
