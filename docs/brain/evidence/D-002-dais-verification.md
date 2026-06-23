# D-002 — Dais Verification Evidence (WO-001)

- **Date:** 2026-06-09 · **Verdict: ✅ D-002 CLOSED** (verify-not-rebuild)
- Method: `dotnet test --no-build` against already-built Debug DLLs (avoided the live agent fleet's
  file locks); both real suites use the in-memory EF provider (no live DB required).

## Verified items
| Target | Evidence |
|---|---|
| Exemption / Appeal / CertificationStep / Notice / QueueItem persistence | Entities + DbSets (`TerraFusionDbContext.cs:600-604`) + migration `20260317074518_AddDaisEntities` present; behavior covered by the 31-test suite below |
| Persistence behavior | `dotnet test --no-build TerraFusion.API.Tests --filter FullyQualifiedName~Dais` → **31 passed, 0 failed** |
| CountyId isolation | `dotnet test --no-build TerraFusion.Integration.Tests --filter ~DaisCountyIsolation` → **6 passed, 0 failed** |
| AuditableEntity pattern | `Appeal.cs:42-53` + `Exemption.cs:43-54` carry `CountyId` + `CreatedBy/UpdatedBy/CreatedAt/UpdatedAt` |
| Service/controller delegation | `AppealService.cs` / `ExemptionService.cs` / `DaisController.cs` present and exercised by the suites above |
| No fake test coverage | 34 empty-body `[Fact]` stubs (`DaisPersistenceAcceptanceTests.cs`) found and **deleted** (D-008); real coverage retained (`Wave4PersistenceTests.cs` 13 facts / 25 asserts + the 37 tests above) |

## Honest gaps / blockers (recorded, not hidden)
- **Full `dotnet build` not re-run** this session — agent-fleet file locks (D-001, environmental; 0 CS
  errors at last clean compile). Tests ran `--no-build` against existing DLLs.
- **Live-DB migration apply not verified** — suites use the in-memory provider. Own follow-up if a live
  migration gate is wanted before 1.0.
- "Services replace static catalogs" release-gate row not separately measured (behavior covered by tests).

## Commands run
```
dotnet test TerraFusion.API.Tests --no-build -c Debug --filter "FullyQualifiedName~Dais"            → 31/31 PASS
dotnet test tests/TerraFusion.Integration.Tests --no-build -c Debug --filter "~DaisCountyIsolation" → 6/6 PASS
grep CountyId|CreatedAt|UpdatedAt|CreatedBy|UpdatedBy Appeal.cs Exemption.cs                         → all present
```
