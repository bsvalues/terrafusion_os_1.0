# WO-BACKEND-004 - Health / Readiness Truth

Date: 2026-07-01
Work order: WO-BACKEND-004
Program: Backend Operational Excellence
Mode: evidence-only contract clarification

## Result

RESULT: PASS

TerraFusion backend health/readiness is not a single endpoint. It is a set of surfaces with
different meanings and different operator uses. This packet records the current truth without
changing auth, runtime behavior, pipeline behavior, deployment behavior, schemas, or migrations.

## Canonical Operator Contract

| Surface | Route | Auth | Meaning | Operator use |
| --- | --- | --- | --- | --- |
| Public liveness | `GET /health` | anonymous | API process is responding and returns stable artifact identity shape including `GitSha`. | External/load-balancer liveness and basic release smoke. |
| Simple readiness | `GET /health/ready` | anonymous | Controller-level "Ready" response with message `TerraFusion OS is initializing`. | Lightweight startup/readiness hint only; not a constitutional or dependency gate. |
| Simple liveness | `GET /health/live` | anonymous | Controller-level "Live" response. | Basic process liveness. |
| Infrastructure liveness | `GET /healthz` | anonymous minimal API route | K8s/infra-style liveness endpoint mapped in `Program.cs`; currently returns a simple healthy payload. | Infrastructure smoke and workflow compatibility probe. |
| Constitutional proof | `GET /healthz/proof` | not explicitly `[AllowAnonymous]` on controller | Returns proof payload and HTTP 200 only when SpecLock and StateMesh guards are verified; otherwise HTTP 503. | Governance/constitutional readiness evidence. |
| Constitutional readiness | `GET /healthz/ready` | not explicitly `[AllowAnonymous]` on controller | Returns 200 only when SpecLock and StateMesh guards are verified; otherwise 503 with reason. | Readiness gate for governance-sensitive operation. |
| System health | `GET /api/system/health` | anonymous action | Aggregates orchestration/module-loader state and returns `Healthy` or `Degraded` response. | Operator diagnostic view of module/system state. |
| PACS readiness health checks | health-check registrations tagged `ready` | service-level health-check model | Unit tests prove `AddPacsReadiness` produces ready-tagged health-check behavior. | PACS readiness proof in configured environments; not invoked by this WO against live PACS. |
| Domain-specific probes | e.g. `/levy/health`, `/api/transcendence/health`, `/api/pacs/health` | varies by controller/action | Domain/service-specific probes. | Domain diagnostics only; not the canonical global readiness signal. |

## Evidence

### Public liveness contract

`backend/src/TerraFusion.API/Controllers/SimpleHealthController.cs`:

- `[AllowAnonymous]`
- `[Route("health")]`
- `GET /health` returns `Status`, `Timestamp`, `Environment`, `Version`, `Service`, and `GitSha`.
- `GET /health/ready` returns `Status = Ready`.
- `GET /health/live` returns `Status = Live`.

### Infrastructure liveness contract

`backend/src/TerraFusion.API/Program.cs`:

- Maps `GET /healthz` as an anonymous infrastructure liveness probe.
- Returns a simple healthy response and is used by existing workflow smoke checks.
- Is distinct from `GET /healthz/proof` and `GET /healthz/ready`, which are controller-based constitutional proof/readiness surfaces.

### Constitutional proof/readiness contract

`backend/src/TerraFusion.API/Controllers/HealthProofController.cs`:

- `[Route("healthz")]`
- `GET /healthz/proof` returns a deterministic proof payload.
- `GET /healthz/proof` returns HTTP 503 when SpecLock or StateMesh is not verified.
- `GET /healthz/ready` returns HTTP 200 only when both SpecLock and StateMesh guards are verified.
- `GET /healthz/ready` returns HTTP 503 and a reason when constitutional readiness is false.

### System health contract

`backend/src/TerraFusion.API/Controllers/SystemHealthController.cs`:

- `[Route("api/system")]`
- `GET /api/system/health` is `[AllowAnonymous]`.
- Returns `Healthy` or `Degraded` based on orchestration/module health.
- Returns a degraded response instead of throwing when health probing fails.

### Focused validation

```powershell
$base = Join-Path $env:TEMP ('tf-wo-backend004-health-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $base | Out-Null
dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj `
  --filter "FullyQualifiedName~TerraFusion.Unit.Tests.Controllers.SimpleHealthControllerGitShaTests" `
  --logger "console;verbosity=minimal" `
  --artifacts-path $base
```

Result:

```text
Passed! - Failed: 0, Passed: 4, Skipped: 0, Total: 4
```

## Gaps

- `/health/ready` is a simple readiness hint, not a dependency-complete readiness gate.
- `/healthz/ready` is constitutional readiness, not general dependency readiness.
- `/api/system/health` is a diagnostic endpoint and can return a degraded payload instead of failing the HTTP call.
- Domain-specific probes are not interchangeable with global readiness.
- The backend currently has a multi-surface health model. Operators should choose the probe based on intent rather than treating all health routes as equivalent.
- `/healthz` is infrastructure liveness; `/healthz/ready` is constitutional readiness. They are not interchangeable.

## Not Changed

- No runtime code changed.
- No auth policy changed.
- No health endpoint behavior changed.
- No CI or GitHub workflow changed.
- No Azure pipeline changed.
- No schema or migration changed.
- No deployment behavior changed.
- No secrets, county data, PACS data, or SQL access touched.

## Next

Proceed under the active owner-authorized backend loop to WO-BACKEND-005 - Release Gate Definition.

Note: older or alternate backend program registers may use different numbering for runtime configuration,
auth/security proof, release gate, and operational packet work. This packet records the current health
truth only; it does not supersede those dependency requirements or authorize release readiness.
