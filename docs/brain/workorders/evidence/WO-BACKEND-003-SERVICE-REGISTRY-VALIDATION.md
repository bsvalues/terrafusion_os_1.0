# WO-BACKEND-003 - Service Registry Validation

Date: 2026-07-01
Work order: WO-BACKEND-003
Program: Backend Operational Excellence
Mode: evidence-only validation

## Result

RESULT: PASS_WITH_GAP

The backend ServiceRegistry surface is active for dependency injection, hosted startup registration,
registry mutation, registry serving, and focused unit coverage. The platform-wide seed path remains a
runtime behavior gap and is not repaired in this work order.

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

The seed-path repair would change runtime startup behavior by broadening the initial registry
contents from backend self-registration to platform service entries. That should be handled as a
narrow follow-up work order rather than folded into this validation packet.

## Next

Proceed to WO-BACKEND-004 - Health / Readiness Truth.

Create a later narrow repair packet if Program 2 elects to fix the ServiceRegistry seed path:

```text
WO-BACKEND-003B - ServiceRegistry Platform Seed Path Repair
```
