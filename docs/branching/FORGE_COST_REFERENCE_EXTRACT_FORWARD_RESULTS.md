# WO-BRANCH-003 — Forge Cost Reference Extract-Forward Results

**Date**: 2026-06-16
**Branch**: `feat/forge-cost-reference-v2` (off `origin/main` @ `2f09c7e7d`)
**Source (read-only)**: `feat/ws1-forge-cost-reference` @ `372471f94`
**Decision**: **Option A** — ship the verified Forge schema slice; defer the 12 integration tests to a WS-3 audit-infra work order.

---

## What shipped (final scope)

| Item | Detail |
|------|--------|
| Forge cost entities | 20 files under `backend/src/TerraFusion.Core/Entities/Forge/` (copied verbatim from source branch) |
| Allowlist expansion (approved) | `backend/src/TerraFusion.Core/Entities/IAuditableEntity.cs` — trivial 4-property marker interface, required by 5 entities |
| DbContext wiring (surgical) | `TerraFusion.Data/TerraFusionDbContext.cs`: `+ using TerraFusion.Core.Entities.Forge;` and 9 cost DbSets after `AuditLogs` |
| Migration (generated) | `20260616060820_AddForgeCostReference` (.cs + .Designer.cs) + `TerraFusionDbContextModelSnapshot.cs` update |
| Results doc | this file |

`CostForge.csproj` delta: **not applied** — the full solution builds green without it (delta was unnecessary on current main).

## Tests deferred (Option A)

The 12 Forge integration tests were **removed from this PR** because they import branch-only **WS-3 audit infrastructure** that is out of scope for a schema slice:
- `TerraFusion.Core.Time` → `IClock`
- `TerraFusion.Data.Interceptors` → `AuditableEntityInterceptor` (which further pulls `TerraFusion.Core.Auth`)

That is a second architecture slice, not a small test dependency. The tests were never on `main`, so removing the newly-copied files deletes nothing from `main`.

**Exact files deferred** (to WO-BRANCH-004):
```
backend/tests/TerraFusion.Integration.Tests/Forge/CalibrationGateTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/CostApproachTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/CostReferenceDataTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/ForgeGovernanceTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/IncomeApproachTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/LandApproachTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/ParcelValuationAssemblerTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/ParcelValuationPersistenceTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/ParityAndRolloutTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/ParityEvaluatorTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/SalesRatioTests.cs
backend/tests/TerraFusion.Integration.Tests/Forge/ValuationEngineTests.cs
```

## Migration scope (verified Forge-only)

`Up()` creates exactly **9 tables**; `Down()` drops exactly those 9. ModelSnapshot diff is **+394 / −0 (additive)**, adding only the 9 `Forge.*` entity types.

```
CostFactorSets   CostFactors
DepreciationSchedules  DepreciationFactors
LandScheduleSets  LandRates
CapRateSets  CapRates
ParcelValuations
```

No `CompSet*`, `Revenue*`, `Jurisdiction*`, `Quarantine*`, `SyncBridge*`. No `AddColumn/AlterColumn/RenameTable/Sql`. No drops/renames of existing objects.

## DB apply status (terrafusion_dev_clean only)

- Baseline before: 88 applied, tip `20260509184340_SyncComplete2V2StageLevelResume` (== main tip).
- `dotnet ef database update` → **Applied `20260616060820_AddForgeCostReference`. Done.**
- After: **89 applied, 0 pending.** All 9 Forge tables exist in `terrafusion_dev_clean`.
- No other database touched (no old `terrafusion`, no PACS, no native PG17).

## Build status

- `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj` → **succeeded, 0 errors.**
- `dotnet build backend/TerraFusion.sln` → **succeeded, 0 errors** (after deferring the WS-3-dependent test files).

## Denylist status

CLEAN. No `.playwright-mcp`, `generated/`, package trees, `.rcgu.o`, branch migrations/ModelSnapshot, CompSet, PACS/data files, and **no WS-3 audit files** (`IClock`, `AuditableEntityInterceptor`, `AuditInterceptorServiceCollectionExtensions`, `Core.Auth`, DI audit wiring).

## Follow-up work order

**WO-BRANCH-004 — WS-3 Audit Infrastructure + Forge Integration Tests**: extract the WS-3 audit subsystem (`Core/Time/IClock`, `Data/Interceptors/AuditableEntityInterceptor` + `AuditInterceptorServiceCollectionExtensions`, `Core.Auth` cascade, DI wiring) and re-introduce the 12 deferred Forge integration tests on top of it.

---

## Final Report

```
RESULT          : Forge Cost Reference schema slice extracted forward onto fresh main; verified green; migration applied to dev-clean.
FILES CHANGED   : 26 (20 Forge entities + IAuditableEntity + DbContext.cs + ModelSnapshot.cs + migration .cs/.Designer.cs + this results doc)
TESTS_DEFERRED  : 12 Forge integration tests (require denied WS-3 audit infra) → WO-BRANCH-004
MIGRATION       : 20260616060820_AddForgeCostReference
MIGRATION_SCOPE : Forge-only — 9 CreateTable (Up), 9 DropTable (Down), ModelSnapshot +394/-0 additive
BUILD_STATUS    : TerraFusion.API green; full TerraFusion.sln green (0 errors)
DB_APPLY_STATUS : applied to terrafusion_dev_clean only (88 -> 89 applied, 0 pending, 9 tables created)
DENYLIST_STATUS : clean (no WS-3 infra, no cruft, no branch migrations/snapshot)
PR              : draft — WO-BRANCH-003: Forge Cost Reference extract-forward
NEXT_WORK_ORDER : WO-BRANCH-004 — WS-3 Audit Infrastructure + Forge Integration Tests
```
