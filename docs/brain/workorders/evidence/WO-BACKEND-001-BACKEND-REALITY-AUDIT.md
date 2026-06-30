# WO-BACKEND-001 - Backend Reality Audit

**Date:** 2026-06-30
**Base:** `origin/main` at `c45d2ebf91b16e6323f12191d0a1b3c6a7dd7b77`
**Worktree:** `C:\Users\bsval\.codex-worktrees\backend-reality-audit-2`
**Branch:** `wo/backend-reality-audit-2`
**Mode:** backend operational discovery with evidence artifact

## Scope

This audit establishes current backend operational truth from the clean `origin/main` baseline. It does not change backend runtime behavior, database schema, migrations, CI, deployment, secrets, county data, PACS connections, or production configuration.

## Governance Context

- `WO-WOE-009` / PR #1114 is merged and provides the active program register.
- PR #1113, `docs(brain): promote work order operator doctrine`, remains open, clean, green, and non-draft. It is merge-authority work, not a blocker for this backend audit.
- `docs/brain/workorders/tools/wo-query.mjs --json` runs successfully, but its seed registry is stale and recommends `WO-LOCALOPS-000`. The merged Program Playbook Register identifies Backend Operational Excellence as queued with `WO-BACKEND-001` next.
- The user launch packet and merged playbook both agree that `WO-BACKEND-001` is the next backend node. Later backend WO naming differs between the launch packet and merged playbook, so continuation after this audit should reconcile those names before executing code changes.

## Backend Inventory

| Surface | Observed State |
|---------|----------------|
| Canonical solution | `backend/TerraFusion.sln` |
| Solution projects | 17 projects listed by `dotnet sln backend\TerraFusion.sln list` |
| Wider backend project files | 41 `.csproj` files under `backend/` |
| Test project files under backend | 13 test-like `.csproj` files |
| API controllers under `backend/src` and `backend/api-unified` | 195 `*Controller.cs` files |
| EF migration files | 197 files under `backend/src/TerraFusion.Data/Migrations` |
| Appsettings files | Multiple runtime, environment, published, tool, and test settings files under `backend/` |

## Runtime Entrypoints

### Main API

Primary API project:

```text
backend/src/TerraFusion.API/TerraFusion.API.csproj
backend/src/TerraFusion.API/Program.cs
```

Observed traits:

- Uses a large ASP.NET Core composition root with EF Core, SignalR, AI, operations, PACS, sync, marketplace, telemetry, OpenTelemetry, Prometheus, rate limiting, and environment-specific configuration.
- Resolves content root explicitly for test, worktree, and published layouts.
- Supports standalone modes such as `--canonicalize-only` and `--canonicalize-properties-only`.
- Uses `TerraFusionDbContext` from `backend/src/TerraFusion.Data`.

### Unified / Proxy API

Secondary minimal API project:

```text
backend/api-unified/TerraFusion.API.csproj
backend/api-unified/Program.cs
```

Observed traits:

- Minimal API plus controllers.
- Proxies `/pilot/**` to `PILOT_BASE_URL`, defaulting to `http://localhost:4317`.
- Exposes simple demo endpoints: `/health`, `/api/status`, `/api/counties`, `/api/counties/{countyId}/properties`.
- Returns generated placeholder property IDs for county property requests. Treat this as demo/minimal API behavior, not canonical backend truth.

## Health and Readiness Truth

Observed health surfaces:

| Endpoint / Surface | Source | Behavior |
|--------------------|--------|----------|
| `/health` | `SimpleHealthController` and `api-unified/Program.cs` | Basic anonymous health response; `SimpleHealthController` includes environment, version, service, and optional `TF_GIT_SHA`. |
| `/health/ready` | `SimpleHealthController` | Returns `Status = Ready` and message that TerraFusion OS is initializing. |
| `/health/live` | `SimpleHealthController` | Returns `Status = Live`. |
| `/healthz/proof` | `HealthProofController` | Constitutional proof endpoint. Returns 200 only when SpecLock and StateMesh guards are verified; otherwise 503. |
| `/healthz/ready` | `HealthProofController` | Readiness gate based on SpecLock and StateMesh verification. |
| `/api/Health` | `HealthController` | Dependency-oriented health check using database, AI engine, memory, and disk checks. |
| `/api/Health/detailed` | `HealthController` | Detailed system/database/AI/performance metrics. |
| `/api/Health/metrics` | `HealthController` | Metrics payload for database, AI, system, and application data. |

Audit finding:

- Backend has multiple health/readiness concepts with different meanings: simple liveness, initialization readiness, constitutional readiness, and dependency health.
- `WO-BACKEND-004` should define the canonical operator contract for public, protected, dev-only, and constitutional health/readiness endpoints.

## Persistence and Dais Status

Observed persistence:

- Main EF context: `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`.
- Additional Identity-style context: `backend/src/TerraFusion.Data/TerraFusionContext.cs`.
- Dais county operations are represented in `TerraFusionDbContext` comments and DbSets around exemptions, appeals, certification, notices, and queues.
- Wave 4 / Dais persistence tests exist:
  - `backend/tests/TerraFusion.Unit.Tests/Wave4/Wave4PersistenceTests.cs`
  - `backend/tests/TerraFusion.Unit.Tests/Wave4/DaisPersistenceAcceptanceTests.cs`
  - `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisWorkflowPersistenceTests.cs`
  - `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisCountyIsolationTests.cs`

Audit finding:

- Dais persistence is present as a modeled/tested backend surface, not merely documentation.
- No schema migration was applied or generated during this audit.
- County isolation appears as a recurring design/test concern through `CountyId` indexing and test coverage, but this audit did not prove every endpoint enforces county isolation.

## Service Registry and Startup Truth

Observed registry-related surfaces:

- `backend/src/TerraFusion.API/Controllers/ServiceRegistryController.cs`
- `backend/src/TerraFusion.Abstractions/Interfaces/IServiceDiscoveryService.cs`
- Multiple DI registrations via `AddScoped`, `AddSingleton`, and `AddTransient` in backend source.
- Module and service health tests exist, including `ModuleRuntimeHealthTests` references under API tests.

Audit finding:

- Service registry and module health surfaces exist, but the registry activation contract is not summarized in one operator-facing proof.
- `WO-BACKEND-003` should verify startup orchestration, registered service coverage, orphaned registrations, and health check coverage.

## Build and Test Command Truth

Environment:

```text
dotnet --version: 8.0.422
Installed SDKs: 8.0.416, 8.0.419, 8.0.420, 8.0.422
```

Commands run:

```powershell
dotnet sln backend\TerraFusion.sln list
dotnet build backend\TerraFusion.sln --no-restore
dotnet restore backend\TerraFusion.sln
dotnet build backend\TerraFusion.sln --no-restore
dotnet test backend\tests\TerraFusion.Unit.SmokeTests\TerraFusion.Unit.SmokeTests.csproj --no-build --logger "console;verbosity=minimal"
dotnet test backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~HealthContractTests|FullyQualifiedName~ServiceRegistry|FullyQualifiedName~ModuleRuntimeHealth" --logger "console;verbosity=minimal"
```

Results:

| Command | Result | Notes |
|---------|--------|-------|
| `dotnet build backend\TerraFusion.sln --no-restore` before restore | FAIL | Fresh worktree had no `obj/project.assets.json`; failure was bootstrap state, not source failure. |
| `dotnet restore backend\TerraFusion.sln` | PASS | Restored all solution projects. |
| `dotnet build backend\TerraFusion.sln --no-restore` after restore | PASS | 0 warnings, 0 errors, elapsed 00:02:17.47. |
| `dotnet test backend\tests\TerraFusion.Unit.SmokeTests\TerraFusion.Unit.SmokeTests.csproj --no-build` | PASS | 391 passed, 0 failed, 0 skipped. |
| Focused API test filter | PASS | 1 passed, 0 failed. The command restored and built `backend/TerraFusion.API.Tests`, which is outside `backend/TerraFusion.sln`. |

## Warning Truth

Current clean solution build:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

Out-of-solution API test project:

- `backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj` builds with warnings when invoked directly.
- Warning categories observed during focused test build:
  - CS8604 possible null argument in `AuditCorrelationTests.cs`.
  - CS8602 possible null dereference in `SystemIntegrationTests.cs` and `CountyStudioSmokeTests.cs`.
  - CS8618 non-nullable properties not initialized in `SystemIntegrationTests.cs`.

Audit finding:

- `WO-BACKEND-002` should focus first on the out-of-solution API test warning surface, not the canonical solution build, unless the operator decides to expand the warning ledger to all 41 backend projects.

## Implemented / Partial / Missing Matrix

| Capability | Status | Evidence |
|------------|--------|----------|
| Canonical backend solution builds | Implemented | `dotnet restore`, then `dotnet build backend\TerraFusion.sln --no-restore` passes with 0 warnings/errors. |
| Smoke test gate | Implemented | `TerraFusion.Unit.SmokeTests` passes 391/391. |
| Main API composition root | Implemented | `backend/src/TerraFusion.API/Program.cs`. |
| Secondary minimal/proxy API | Partial / demo | `backend/api-unified/Program.cs` exposes placeholder data and pilot proxy. |
| Health/liveness/readiness endpoints | Partial | Multiple endpoints exist, but operator-facing contract is split across simple, constitutional, and dependency health surfaces. |
| Dais persistence | Implemented / needs proof summary | EF context and Dais/Wave4 tests exist. Endpoint-to-persistence coverage was not exhaustively proven in this WO. |
| Service registry validation | Partial | Registry/controller/interfaces exist; coverage and orphan registration proof need a dedicated WO. |
| Auth behavior proof | Partial | Auth/security tests exist, but endpoint-by-endpoint protected/public classification is not consolidated. |
| Release gate | Missing / not canonical | No single backend release gate accepted by operator in this audit. |
| Backend operational packet | Missing | This program should produce it after WOs 002-007/008. |

## Risks and Blockers

- The merged playbook and launch prompt differ after `WO-BACKEND-001`. Reconcile the chain before continuing beyond the audit:
  - Launch prompt: warning burn-down, service registry, health/readiness, release gate, operational packet, evidence rollup.
  - Merged playbook: runtime truth, warning burn-down, service registry, health/readiness, runtime config, auth/security endpoint proof, release gate, operational packet.
- The Work Order Engine query registry is stale relative to the merged program playbook. `wo-query` runs, but does not yet compute Backend Operational Excellence as next.
- Fresh worktrees require `dotnet restore` before backend build. `--no-restore` is not a valid first command from a clean clone/worktree.
- `backend/TerraFusion.API.Tests` is outside the canonical solution and has warnings when invoked directly.
- There are many historical backend docs with stale claims and absolute paths; use live commands and source over legacy markdown claims.

## Recommended Next Work Orders

1. `WO-BACKEND-002 - Build Warning Burn-down`
   - Start with a warning ledger for `backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj`.
   - Fix only low-risk nullability warnings in tests if clearly mechanical.
   - Do not broaden to runtime behavior changes.

2. `WO-BACKEND-003 - Service Registry Validation`
   - Verify service registry activation, startup orchestration, orphaned registrations, and health coverage.

3. `WO-BACKEND-004 - Health / Readiness Truth`
   - Define canonical operator semantics for `/health`, `/health/ready`, `/health/live`, `/healthz/proof`, `/healthz/ready`, and `/api/Health*`.

4. Reconcile Program 2 chain naming before executing WOs beyond `WO-BACKEND-004`.

## Done / Not Done

Done:

- Clean backend worktree created from `origin/main`.
- Backend solution/project/test inventory captured.
- Solution restore/build truth captured.
- Smoke test gate validated.
- Focused API health/registry test command validated enough to expose out-of-solution warning truth.
- No runtime, schema, deployment, secret, PACS, county data, CI, or Docker changes made.

Not done:

- No endpoint-by-endpoint exhaustive runtime execution.
- No service registry code changes.
- No warning fixes.
- No health/readiness contract changes.
- No release gate definition.
