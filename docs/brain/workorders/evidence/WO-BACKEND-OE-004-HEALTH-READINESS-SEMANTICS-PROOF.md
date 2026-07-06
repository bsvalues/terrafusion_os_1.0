# WO-BACKEND-OE-004 - Health and Readiness Semantics Proof

| Field | Value |
|-------|-------|
| Work Order | `WO-BACKEND-OE-004` |
| Program | Backend Operational Excellence |
| Goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Mode | Evidence and endpoint contract proof |
| Base | `origin/main` at `28015b9dcfbc441d5f87398e2402de2c2e23251b` |
| Runtime code changed | No |
| Backend code changed | No |
| Services started | No |
| Docker/Testcontainers executed | No |
| Secrets/county/PACS/live DB touched | No |

## Objective

Define what the current backend health and readiness endpoints prove, what they do not prove, and
which endpoint semantics are safe to use in later release-gate work.

This packet is source and existing-test evidence only. It does not start the API, connect to live
services, change endpoint behavior, or promote any endpoint to release-gate authority by itself.

## Source Evidence

| Evidence | Finding |
|----------|---------|
| `backend/src/TerraFusion.API/Program.cs` | Registers ASP.NET health checks with `database`, `modules_consistency`, `pacs-contract`, and `speclock`. |
| `backend/src/TerraFusion.API/Program.cs` | Maps `/healthz` as liveness with `Predicate = _ => false`, so it proves process routability only. |
| `backend/src/TerraFusion.API/Program.cs` | Maps `/healthz/ready` as readiness with SpecLock, StateMesh, and checks tagged `readiness` plus the `speclock` check name. |
| `backend/src/TerraFusion.API/Health/PacsReadinessHealthCheck.cs` | Implements PACS readiness semantics, but current registration uses tags `ready` and `pacs`; this does not match the `/healthz/ready` predicate's `readiness` tag filter. |
| `backend/src/TerraFusion.API/Program.cs` | Maps `/health/codex369` to health checks whose names contain `codex-369`. |
| `backend/src/TerraFusion.API/Program.cs` | Maps `/api/transcendence/health` as a minimal lightweight feature probe returning static `ok` metadata. |
| `backend/src/TerraFusion.API/Program.cs` | Maps Levy endpoints under `/levy`; Levy health is `/levy/health`, not `/api/levy/health`. |
| `backend/src/TerraFusion.API/Controllers/SimpleHealthController.cs` | Provides `/health`, `/health/ready`, and `/health/live` controller endpoints separate from `/healthz`. |
| `backend/src/TerraFusion.API/Controllers/HealthProofController.cs` | Provides `/healthz/proof` and controller-level `/healthz/ready` proof endpoints, but minimal API `/healthz/ready` is also mapped in `Program.cs`. |
| `backend/TerraFusion.API.Tests/AuthenticationRateLimitTests.cs` | Verifies `/healthz` is routable and not throttled by auth rate limiting. |
| `backend/tests/TerraFusion.Unit.Tests/Observability/PacsReadinessHealthCheckRegistrationTests.cs` | Verifies PACS readiness check behavior for required, not-required, and reachable states. |

## Endpoint Semantics Matrix

| Endpoint | Type | Auth evidence | Dependencies checked | Success means | Failure means | Release-gate use |
|----------|------|---------------|----------------------|---------------|---------------|------------------|
| `/healthz` | Liveness | Minimal API mapping; no explicit auth requirement in the mapping | None; predicate excludes all checks | Process is reachable and routing the liveness probe | Process is unavailable or pipeline is not serving route | Safe for liveness only; not release readiness |
| `/healthz/ready` | Readiness | Minimal API mapping; no explicit auth requirement in the mapping | SpecLock, StateMesh, and checks tagged `readiness` plus `speclock`; PACS is currently tagged `ready` and is therefore not selected by this predicate | Guard verification passed and selected readiness checks did not report unhealthy | Readiness guard or selected dependency check failed; specific JSON reason for SpecLock/StateMesh failures | Best current candidate for backend readiness shape, but not currently PACS-gated until tag/predicate alignment is repaired |
| `/health/codex369` | Feature health | Minimal API mapping; no explicit auth requirement in the mapping | Health checks named with `codex-369` | Codex369-specific check set is healthy, if registered | Codex369 feature health is not healthy or no matching check behavior is ambiguous until registration is separately validated | Feature-specific only; not backend release readiness |
| `/api/transcendence/health` | Feature liveness | Minimal API mapping; no explicit auth requirement in the mapping | No heavy services; returns lightweight static payload | Transcendence route is mapped and process can return a simple payload | Route unavailable or API process failure | Feature liveness only; not dependency readiness |
| `/levy/health` | Feature/data dependency health | Minimal API mapping under `/levy`; no explicit auth requirement in the mapping | `LevyDbContext` provider and database connectivity; SQLite dev path may call `EnsureCreatedAsync` | Levy database provider is available or SQLite dev database can be ensured | Levy DB cannot connect or throws | Useful for Levy feature diagnostics; not whole-backend readiness |
| `/health` | General API health | `SimpleHealthController` has `[AllowAnonymous]` | Environment/version/service/Git SHA metadata only | API process route responds with service metadata | API controller route failure | Informational liveness/status only |
| `/health/ready` | Host-start readiness | `SimpleHealthController` has `[AllowAnonymous]` | `IHostApplicationLifetime.ApplicationStarted` only | Host has fired `ApplicationStarted` | Host startup not complete | Host-readiness only; weaker than `/healthz/ready` |
| `/health/live` | Host liveness | `SimpleHealthController` has `[AllowAnonymous]` | None | Controller route is live | Controller route unavailable | Liveness only |

## Readiness Contract Findings

The backend has multiple health surfaces, but they do not all prove the same thing.

- `/healthz` proves liveness only. It intentionally does not execute dependency checks.
- `/healthz/ready` is the strongest current readiness candidate by route shape because it combines
  runtime guard checks and selected health checks, but it currently filters on tag `readiness` while
  PACS readiness is registered with tag `ready`. It must not be treated as PACS-gated until that
  mismatch is repaired in a separate implementation WO.
- `/health/ready` proves host-start state only. It is useful but should not be treated as dependency
  readiness.
- `/api/transcendence/health` and `/health/codex369` are feature health probes, not backend platform
  readiness proof.
- `/levy/health` is Levy-specific and may touch the Levy database context. It must not become a
  whole-backend readiness gate without explicit release-gate policy.

## Production-Safety Classification

| Endpoint | Production-safety posture | Reason |
|----------|---------------------------|--------|
| `/healthz` | Safe liveness candidate | Static liveness payload; no dependency detail exposed. |
| `/healthz/ready` | Conditionally safe readiness candidate | Emits guard/check names and readiness status; acceptable for ops, but release gate must define exposure, config, and the current PACS tag/predicate mismatch. |
| `/health/codex369` | Feature diagnostic | Scope is Codex369-specific; release relevance depends on feature registration proof. |
| `/api/transcendence/health` | Lightweight feature diagnostic | Returns only static service/timestamp payload, but it does not prove heavy-service readiness. |
| `/levy/health` | Internal/diagnostic until release policy says otherwise | Checks Levy DB provider/connectivity and can reveal provider/mode; should be governed before public exposure. |
| `/health` | Public informational status | Exposes environment/version/service/Git SHA metadata; useful for status, not dependency readiness. |
| `/health/ready` | Public host-readiness candidate | Confirms host started only; insufficient for backend dependency release gate. |
| `/health/live` | Public liveness candidate | No dependency detail. |

## Release-Gate Recommendation

Future backend release-gate work should use a layered health contract:

1. Liveness: `/healthz` or `/health/live`.
2. Platform readiness: `/healthz/ready`, after the health-check tag/predicate mismatch is resolved
   or explicitly accepted by release-gate policy.
3. Host-start readiness: `/health/ready` only as a secondary host lifecycle signal.
4. Feature diagnostics: `/health/codex369`, `/api/transcendence/health`, and `/levy/health` only for
   feature-specific checks.

`/healthz/ready` should be the default candidate for release readiness, but only after the release
gate explicitly defines required environment settings, PACS-required behavior, SpecLock/StateMesh
expectations, acceptable exposure, and whether the `ready` versus `readiness` tag mismatch is fixed
or formally handled.

## Gaps

| Gap | Classification | Follow-up |
|-----|----------------|-----------|
| No consolidated release gate maps liveness, readiness, and feature health into pass/fail criteria | Release governance gap | `WO-BACKEND-OE-009` |
| `/healthz/ready` filters tag `readiness`, but PACS readiness is registered with tag `ready` | Readiness contract mismatch | Separate implementation/test repair WO before claiming PACS-gated readiness |
| ServiceRegistry startup is not yet runtime-validated in this packet | Backend OE next lane | `WO-BACKEND-OE-005` |
| Security/auth/county/audit proof is not consolidated into one matrix | Backend OE queued lane | `WO-BACKEND-OE-006` |
| Levy health may reveal provider/mode and can call SQLite `EnsureCreatedAsync` in dev mode | Feature diagnostic safety concern | Treat as diagnostic until release policy classifies exposure |
| `/health/codex369` depends on matching health-check registration, which this packet did not prove end-to-end | Feature health gap | Keep feature-specific; do not use as platform readiness |

## Explicit Non-Claims

This packet does not claim:

- production readiness,
- full runtime startup proof,
- service registry runtime validation,
- security/auth/county-isolation proof,
- migration or rollback readiness,
- Docker/Testcontainers repair,
- endpoint behavior changes,
- CI/release-gate wiring,
- or permission to expose additional health surfaces publicly.

## Validation

Planned validation for this evidence packet:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Confirm changed files are docs/governance/evidence only.
- Confirm no backend/runtime/tools implementation files changed.

## Next Recommended Work Order

`WO-BACKEND-OE-005 - Service Registry Runtime Validation`

Reason:

- Health/readiness endpoint semantics are now classified from source and existing tests.
- The next Backend OE gap is proving the ServiceRegistry is not merely source-wired, but
  runtime-understood with startup behavior, seeded state, failure modes, and logging evidence.

## Stop Type

`BACKEND_HEALTH_READINESS_SEMANTICS_PROVEN`
