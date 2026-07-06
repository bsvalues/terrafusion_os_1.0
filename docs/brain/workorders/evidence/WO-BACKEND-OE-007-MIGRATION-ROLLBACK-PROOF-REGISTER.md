# WO-BACKEND-OE-007 - Migration and Rollback Proof Register

Date: 2026-07-06
Work order: WO-BACKEND-OE-007
Program: Backend Operational Excellence
Goal: GOAL-BACKEND-OPERATIONAL-EXCELLENCE
Loop: LOOP-BACKEND-OPERATIONAL-EXCELLENCE
Mode: evidence/register first

## Result

RESULT: PASS_WITH_GAP

Backend migration files are present for the primary TerraFusion data context, CurrentUse, Levy, and
SQL-scripted experiment/Levy surfaces. EF migration classes include `Down` methods in the inspected
contexts, including the Dais, PACS/sync, and recent audit-event migrations. This work order does not
claim release-ready migration safety because no database update, migration application, rollback
execution, schema drift check, production database access, county data access, or PACS access was run.

No backend runtime behavior was changed in this work order. No migration was created or applied.

## Guardrails

| Boundary | Result |
|----------|--------|
| `dotnet ef database update` | Not run |
| `dotnet ef migrations add` | Not run |
| Destructive schema operation | Not run |
| Production/live/shared DB access | Not used |
| County data, PACS, SQL, or secrets | Not touched |
| Backend/runtime code changes | None |

## Migration Inventory

| Context or surface | Path | Evidence count | Rollback artifact observed | Interpretation |
|--------------------|------|----------------|----------------------------|----------------|
| Primary TerraFusion data context | `backend/src/TerraFusion.Data/Migrations` | 105 EF migration classes, 0 SQL files | 105 of 105 EF classes contain `protected override void Down` | Main context has a large migration history with reversible EF migration methods present in source. |
| CurrentUse context | `backend/src/TerraFusion.CurrentUse/Migrations` | 1 EF migration class, 0 SQL files | 1 of 1 EF classes contain `Down` | CurrentUse schema has EF rollback source, but apply/rollback execution is not proven here. |
| Levy context | `backend/src/TerraFusion.Levy/Migrations` | 4 EF migration classes, 2 SQL files | 4 of 4 EF classes contain `Down`; SQL files have no EF `Down` method | Levy has EF migration rollback source plus manual SQL artifacts that need explicit rollback policy. |
| Experiments SQL surface | `backend/TerraFusion.Experiments/Migrations` | 0 EF migration classes, 1 SQL file | No EF `Down` method because the artifact is SQL-only | SQL-only migration needs a manual rollback/disposition rule before release gating. |

Inventory command shape:

```powershell
Get-ChildItem <migration-path> -Filter '*.cs' -File |
  Where-Object { $_.Name -notlike '*.Designer.cs' -and $_.Name -notlike '*ModelSnapshot.cs' }
```

## Required Domain Proof Points

| Domain | Evidence | Status | Gap |
|--------|----------|--------|-----|
| Dais persistence | `backend/src/TerraFusion.Data/Migrations/20260317074518_AddDaisEntities.cs` exists in the primary data-context migration chain. | Source-present | No safe apply/rollback execution proof was run in this WO. |
| PACS/sync schema | Primary data migrations include PACS and sync migrations such as `AddPacsEntities`, `AddPacsTaxAreaAssoc`, `AddPacsFullSaleTable`, `AddPacsLevyTables`, `AddSyncSpineEntities`, `AddSyncDatabaseAtlas`, `AddSyncSourceConnection`, `Slice_C2_AddSyncMappingWorkbook`, and later SyncDoctrine/SyncWorkbench migrations. | Source-present | The PACS/sync schema surface is broad and remains tied to the segmented integration environment from OE-003. |
| Audit-event schema | `20260703002317_AU2_2_AuditEventsCountyIdAndTrailIndex.cs` and `20260703125335_AU2_5B_AuditEventsActorFkDecouple.cs` exist and include `Down` methods. | Source-present | No migration application or rollback execution proof was run. |
| Main API startup migration behavior | `Program.cs` registers `AutoMigrateHostedService` unless `TF_SKIP_AUTO_MIGRATE=true`; the hosted service calls `GetPendingMigrationsAsync()` and `MigrateAsync()` on `TerraFusionDbContext`. | Source-wired | Release policy must decide where automatic main-context migration is permitted and whether non-fatal migration failure is acceptable. |
| CurrentUse startup migration behavior | `CurrentUseServiceExtensions.InitializeCurrentUseDatabaseAsync()` uses `EnsureCreatedAsync()` for InMemory, custom table creation for SQLite, and `MigrateAsync()` for other providers. | Source-wired | Startup migration behavior is provider-dependent and still needs release policy on where automatic migration is allowed. |
| Main design-time migration context | `TerraFusionDbContextFactory` configures Npgsql, `MigrationsAssembly("TerraFusion.Data")`, retry behavior, and a local fallback connection string. | Source-wired | Design-time configuration is not runtime migration safety proof. |
| Levy migration context | `LevyDbContext` states it is backed by real migrations and exposes Levy domain sets; Levy migration files and model snapshot are present. | Source-present | SQL seed/schema artifacts require explicit manual rollback handling. |

## Apply And Rollback Proof

| Proof area | Current state | Release interpretation |
|------------|---------------|------------------------|
| Migration source inventory | Present for main, CurrentUse, Levy, and SQL-only surfaces. | Sufficient to prove migration artifacts exist. |
| EF `Down` method inventory | Present on all inspected EF migration classes. | Sufficient to prove EF rollback source exists, not that rollback executes safely. |
| Migration apply execution | Not run in this WO. | Release gate cannot claim apply readiness from this evidence. |
| Rollback execution | Not run in this WO. | Release gate cannot claim rollback readiness from this evidence. |
| Schema drift detection | No dedicated drift check found or run. | Release gate needs a drift/checksum command or documented manual gate. |
| SQL-only rollback | No paired rollback script observed for Levy SQL files or experiments SQL. | SQL artifacts need explicit manual rollback or non-release classification. |

## Risk Register

| Risk | Severity | Evidence | Follow-up |
|------|----------|----------|-----------|
| Rollback source is not rollback proof | Major | EF `Down` methods exist, but no rollback execution was run. | OE-009 release gate must separate source-present rollback from executed rollback proof. |
| SQL-only migrations lack paired rollback proof | Major | Levy and Experiments SQL files are present outside EF `Down` mechanics. | Define manual rollback/disposition before release readiness. |
| Multiple migration contexts need coordinated release gating | Major | Main data, CurrentUse, Levy, and SQL-only surfaces coexist. | OE-009 must include a multi-context migration gate. |
| PACS/sync schema surface remains environment-gated | Major | PACS/sync migrations are present, but full solution integration tests are Docker/Testcontainers-gated from OE-003. | Keep PACS/sync migration proof segmented until integration prerequisites are satisfied. |
| Automatic startup migration policy is not decided | Major | Main API registers `AutoMigrateHostedService` unless `TF_SKIP_AUTO_MIGRATE=true`, and CurrentUse calls `MigrateAsync()` for non-InMemory/non-SQLite providers. | Release policy must decide whether startup migration is permitted in shared/prod environments and how opt-out is enforced. |
| Schema drift proof absent | Minor | No drift command or evidence was found in this WO. | Add drift detection to OE-009 release gate or a follow-up implementation WO. |

## Release Readiness Interpretation

Backend persistence is migration-backed, not migration-release-ready. The current evidence proves:

- migration files exist,
- EF rollback methods exist in inspected EF migrations,
- Dais, PACS/sync, audit-event, CurrentUse, and Levy migration surfaces are source-visible,
- no unauthorized database mutation occurred during this WO.

The current evidence does not prove:

- a clean database can be migrated end-to-end,
- a migrated database can be rolled back safely,
- SQL-only scripts have complete rollback paths,
- schema drift is detectable before release,
- automatic startup migration behavior is acceptable in production/shared environments.

## Validation

| Command | Result |
|---------|--------|
| Migration inventory and `Down` method source inspection | PASS |
| `dotnet ef database update` | Not run by rule |
| `dotnet ef migrations add` | Not run by rule |
| Production/live DB validation | Not run by rule |

## Next Work Order

Recommended next WO:

`WO-BACKEND-OE-008 - Dais Workflow E2E Proof Expansion Plan`

Recommended scope:

- Plan Dais proof expansion without rebuilding Dais persistence.
- Classify missing Dais unhappy-path, county-context, cross-county denial, validation-error,
  concurrency, audit/trace, and controller/service-boundary proof.
- Do not create migrations, apply databases, touch PACS/county data, or change runtime behavior.

STOP_TYPE: BACKEND_MIGRATION_ROLLBACK_REGISTER_READY
