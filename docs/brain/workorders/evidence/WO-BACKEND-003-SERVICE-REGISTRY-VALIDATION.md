# WO-BACKEND-003 - Service Registry Validation

Date: 2026-07-01
Work order: WO-BACKEND-003
Program: Backend Operational Excellence
Mode: evidence-only validation

## Result

RESULT: PASS_WITH_GAP

The backend ServiceRegistry surface is active for dependency injection, hosted startup registration,
registry mutation, registry serving, and focused unit coverage. Two ServiceRegistry maturity gaps
remain outside this evidence-only work order:

- platform-wide seed path and reader/writer path alignment
- registered-service health coverage and orphan-registration detection

Those gaps are not repaired here because doing so would change runtime startup or registry semantics.

## Evidence

### Active and verified

- `backend/src/TerraFusion.API/Program.cs` registers `ServiceRegistry` as a singleton.
- `backend/src/TerraFusion.API/Program.cs` registers `StartupOrchestrationService` as a hosted service.
- `StartupOrchestrationService.ExecuteAsync()` calls `ServiceRegistry.EnsureSeededAsync()` before application-start registration.
- `StartupOrchestrationService` registers the running backend service after `ApplicationStarted`.
- `ServiceRegistry.RegisterServiceAsync()` creates or updates `service-registry.json`.
- `ServiceRegistry.GetServiceUrlAsync()` resolves URLs from the registry file.
- `ServiceRegistryController` serves `GET /api/service-registry` anonymously and returns an empty registry object if the file is missing.
- `backend/tests/TerraFusion.Unit.Tests/Stage3/ServiceRegistryTests.cs` covers seed creation, platform-port seed mapping, idempotency, register-add, register-update, missing-file creation, and URL lookup.

### Validation run

```powershell
$base = Join-Path $env:TEMP ('tf-wo-backend003-stage3-' + [guid]::NewGuid().ToString('N'))
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

## Gap

The default seed path still appears to derive `platform.json` as a sibling of the registry file.
With the current constructor, the registry path is based on:

```text
env.ContentRootPath\..\..\service-registry.json
```

When `EnsureSeededAsync()` is called without an explicit platform path, it derives:

```text
Path.Combine(Path.GetDirectoryName(_registryPath)!, "platform.json")
```

The repository's `platform.json` exists at the repository root. Prior evidence in
`docs/brain/evidence/WO-0013-serviceregistry-verification.md` classified this as the reason the
service registry is active for backend self-registration but not yet reliable as a platform-wide
native-app discovery surface.

There is also an unresolved path-alignment risk between the registry writer and reader surfaces:

- `ServiceRegistry` derives `service-registry.json` from `env.ContentRootPath\..\..\service-registry.json`.
- `ServiceRegistryController` derives its read path from `AppContext.BaseDirectory\..\..\..\..\..\service-registry.json`.

That means `/api/service-registry` should not be assumed to reflect `RegisterServiceAsync()` writes
until a focused repair proves both surfaces resolve the same canonical file at runtime.

### Registered-service health and orphan coverage

The current validation proves the `ServiceRegistry` class behavior and backend startup registration
path. It does not prove that every registered service has a health endpoint, nor does it detect orphaned
registrations. That gap was already called out by the Program 2 playbook and by
`docs/brain/workorders/evidence/WO-BACKEND-001-BACKEND-REALITY-AUDIT.md`.

Treat this evidence packet as a partial ServiceRegistry activation proof, not as complete
service-registry maturity or release readiness.

## Not changed

- No backend runtime code changed.
- No startup behavior changed.
- No controller behavior changed.
- No service registry schema changed.
- No migrations or database behavior changed.
- No production deployment behavior changed.
- No secrets, county data, PACS data, or SQL access touched.

## Disposition

Service registry activation is proven as partial:

- active: DI registration, hosted registration path, controller serving, and unit coverage
- gap: default platform seed path
- gap: ServiceRegistry writer and controller reader may resolve different registry file paths
- gap: registered-service health coverage and orphan-registration detection are not yet proven

The seed-path/path-alignment repair would change runtime startup or serving behavior by making the
registry file contract canonical. Health/orphan coverage would add a stricter operational proof gate.
Both should be handled as narrow follow-up work orders rather than folded into this validation packet.

## Next

Proceed to WO-BACKEND-004 - Health / Readiness Truth only for endpoint truth documentation. Do not
treat WO-BACKEND-003 as fully closed for release readiness until the follow-up registry maturity items
below are resolved or explicitly deferred.

Create a later narrow repair packet if Program 2 elects to fix the ServiceRegistry seed path:

```text
WO-BACKEND-003B - ServiceRegistry Platform Seed Path Repair
```

Create a later narrow evidence/repair packet for registry maturity coverage:

```text
WO-BACKEND-003C - ServiceRegistry Health Coverage and Orphan Detection
```
