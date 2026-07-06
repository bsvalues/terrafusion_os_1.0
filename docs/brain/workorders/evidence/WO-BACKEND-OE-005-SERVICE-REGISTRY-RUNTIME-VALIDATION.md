# WO-BACKEND-OE-005 - Service Registry Runtime Validation

Date: 2026-07-06
Work order: WO-BACKEND-OE-005
Program: Backend Operational Excellence
Goal: GOAL-BACKEND-OPERATIONAL-EXCELLENCE
Loop: LOOP-BACKEND-OPERATIONAL-EXCELLENCE
Mode: evidence + targeted validation

## Result

RESULT: PASS_WITH_RELEASE_GAPS

ServiceRegistry is source-wired, startup-wired, controller-served, and covered by focused class-level
tests. Runtime release readiness is still partial because the current evidence does not prove that the
writer and reader resolve the same registry file at runtime, nor that registered services are health
checked or orphan-checked.

No backend runtime behavior was changed in this work order.

## Source Wiring

| Surface | Current evidence | Release interpretation |
|---------|------------------|------------------------|
| DI registration | `backend/src/TerraFusion.API/Program.cs` registers `ServiceRegistry` as singleton. | Active source wiring. |
| Hosted startup registration | `Program.cs` registers `StartupOrchestrationService` as hosted service. | Active startup hook. |
| Seed path | `ServiceRegistry.EnsureSeededAsync()` seeds from `platform.json` derived as sibling of the registry file unless an explicit path is passed. | Partial; default path still does not prove repo-root `platform.json` is used at runtime. |
| Backend self-registration | `StartupOrchestrationService` waits for `ApplicationStarted`, reads `ASPNETCORE_URLS`, extracts a port, and calls `RegisterServiceAsync("backend", port, pid)`. | Backend self-registration path is source-wired. |
| Controller read surface | `ServiceRegistryController` serves `GET /api/service-registry` anonymously and returns an empty registry when the file is missing. | Serving exists, but path alignment with the writer remains unproven. |
| Logging | Startup logs beginning registration, successful Kestrel port, registry registration success, and registration failures. | Startup events are observable in logs when the service actually runs. |

## What Gets Seeded

The repository root `platform.json` exists and contains these port keys:

```text
api
frontend
shell
desktop
levy
trends
consciousness
postgres
redis
```

`backend/platform.json` does not exist. Because the default `EnsureSeededAsync()` path derives
`platform.json` from the registry-file directory, platform-wide seeding remains a release gap until a
narrow runtime/path repair proves the canonical path.

## Targeted Validation

Command:

```powershell
$base = Join-Path $env:TEMP ('tf-wo-backend-oe-005-stage3-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $base | Out-Null
dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj `
  --filter "FullyQualifiedName~TerraFusion.Unit.Tests.Stage3.ServiceRegistryTests" `
  --logger "console;verbosity=minimal" `
  --artifacts-path $base
```

Result:

```text
Passed! - Failed: 0, Passed: 8, Skipped: 0, Total: 8
```

Coverage from the focused test slice:

- registry file creation from an explicit platform path,
- platform service seeding,
- default port assignment,
- seed idempotency,
- register-add,
- register-update,
- missing registry file creation,
- URL lookup.

## Failure-Mode Matrix

| Failure mode | Current handling | Remaining gap |
|--------------|------------------|---------------|
| Missing registry file | `RegisterServiceAsync()` creates a fresh registry; controller returns empty registry object. | Empty registry is safe but can mask discovery gaps unless release gate checks contents. |
| Missing default platform path | `EnsureSeededAsync()` logs warning and skips seed. | The runtime does not prove platform-wide seeding from repo-root `platform.json`. |
| Registration exception | `RegisterServiceAsync()` logs an error and swallows exception. | Startup may continue with stale/missing registry data. |
| Startup registration exception | `StartupOrchestrationService` logs failure inside the `ApplicationStarted` callback. | No readiness degradation or release-gate signal is tied to this failure. |
| Reader/writer path mismatch | Prior evidence identifies separate path derivations between writer and controller. | `/api/service-registry` cannot be treated as canonical runtime proof until path alignment is fixed or proven. |
| Orphaned service entry | No current evidence of stale PID/port checks. | Orphan detection remains missing. |
| Registered-service health | No current registry health contract per entry. | Registered services may be listed without health proof. |

## Release Readiness Verdict

ServiceRegistry is operationally understood as a partial system:

- active for DI registration,
- active for hosted startup callback,
- active for backend self-registration path,
- active for class-level mutation and lookup tests,
- active for anonymous controller serving,
- not yet release-proven for platform-wide discovery,
- not yet release-proven for writer/reader path alignment,
- not yet release-proven for health coverage or orphan detection.

## Not Changed

- No backend runtime code changed.
- No controller behavior changed.
- No service registry schema changed.
- No health/readiness behavior changed.
- No CI or release gate wiring changed.
- No migrations or database behavior changed.
- No production, county data, PACS, SQL, live service, or secret access occurred.

## Recommended Next WO

Proceed to `WO-BACKEND-OE-006 - Security/Auth/County-Isolation Proof Matrix`.

Do not treat ServiceRegistry as fully release-ready until a later narrow implementation/design packet
decides whether to repair:

- registry writer/reader canonical path alignment,
- platform-wide seed path,
- registered-service health checks,
- orphan/stale registration detection,
- release-gate assertions over `/api/service-registry` contents.

STOP_TYPE: BACKEND_SERVICE_REGISTRY_RUNTIME_VALIDATED
