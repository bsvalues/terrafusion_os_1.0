# WO-BACKEND-OE-011 - Diagnostics and Observability Map

Date: 2026-07-06
Work order: WO-BACKEND-OE-011
Program: Backend Operational Excellence
Goal: GOAL-BACKEND-OPERATIONAL-EXCELLENCE
Loop: LOOP-BACKEND-OPERATIONAL-EXCELLENCE
Mode: docs/evidence

## Result

RESULT: PASS_WITH_GAP

Backend diagnostics and observability signals are now mapped from Backend OE evidence. The map is
operable for release-gate and runbook use, but it does not claim production observability readiness.
Several signals remain partial because Backend OE has not implemented instrumentation, changed
runtime logging, started services, repaired Docker/Testcontainers, or connected to production
resources.

No backend runtime behavior was changed in this work order.

## Guardrails

| Boundary | Result |
|----------|--------|
| Backend/runtime code changes | None |
| Runtime logging or instrumentation changes | None |
| Observability platform setup | Not changed |
| CI/release workflow wiring | Not changed |
| Service startup/control | Not run |
| Docker/Testcontainers repair | Not run |
| Migrations or database update | Not run |
| Deployment/cloud settings | Not changed |
| Production/live/shared DB access | Not used |
| County data, PACS, SQL, or secrets | Not touched |
| Tools/sync implementation | Not changed |

## Signal Inventory

| Signal | Current evidence | What it proves | What it does not prove | Release posture |
|--------|------------------|----------------|------------------------|-----------------|
| Canonical backend build | OE-001/OE-002 record `dotnet build backend/TerraFusion.sln` passing with `0 Warning(s)` and `0 Error(s)`. | Source compiles and warning posture is currently clean. | Runtime availability, dependency readiness, or deployment health. | Required release gate; rerun on release branch. |
| Unit test lane | OE-001 recorded unit tests passing; OE-006 focused security/county/audit slices passed. | Covered unit and focused policy slices are healthy. | Full integration environment or exhaustive endpoint policy coverage. | Required release gate; rerun on release branch. |
| Integration test artifacts | OE-003 classifies Docker/Testcontainers SQL Server dependency. | Integration lane prerequisite is known and separated from warning debt. | Full solution test pass without Docker-capable environment. | Segmented/deferred until Docker-capable lane is available. |
| Health checks | OE-004 maps `/healthz`, `/healthz/ready`, `/health/codex369`, `/api/transcendence/health`, `/levy/health`, `/health`, `/health/ready`, and `/health/live`. | Health surfaces and endpoint semantics are classified. | `/healthz/ready` does not yet prove PACS-gated readiness because of the ready/readiness tag mismatch. | Use only with OE-004 limits. |
| Readiness checks | OE-004 identifies `/healthz/ready` as the strongest readiness candidate with caveats. | Candidate readiness route exists. | Complete dependency readiness or release authority. | Blocks overclaim until tag/dependency gap is resolved or dispositioned. |
| Service registry events | OE-005 maps DI registration, hosted startup registration, self-registration, controller surface, and startup log messages. | Registry source wiring and class-level behavior are understood. | Writer/reader path alignment, stale/orphan detection, registered-service health, or canonical runtime registry proof. | Partial; release gate must carry gaps. |
| Request/error audit middleware | OE-006 maps `AuditLoggingMiddleware` behavior and skip paths. | API calls and downstream/controller 4xx/5xx response details are intended audit surfaces. | Middleware-level authorization denials before audit middleware are not proven audited. | Partial; do not overclaim auth-denial audit. |
| Domain audit events | OE-006 maps `AuditEventWriter` and domain audit tests. | Actor/county-attributed domain audit writes are covered by safe tests. | Every domain/action or production sink. | Proven for covered slices only. |
| Entity audit stamping | OE-006 maps `AuditableEntityInterceptor`. | Auditable entities receive actor/time metadata on saves. | Complete covered-entity inventory or live persistence proof. | Source-proven; release packet should scope claims. |
| Security events | OE-006 maps auth, role, permission, county-claim, and cross-county denial evidence. | Protected-path and denial behavior exists for tested slices. | Exhaustive controller/action coverage or public endpoint allowlist completion. | Partial release matrix. |
| Exception and error-path surfaces | Source inspection maps `GlobalExceptionHandlingMiddleware`, controller/service `LogError` plus 500-response patterns, health-check exception logging, and hosted-service startup/migration failure logging. | Backend exception/error-path surfaces exist at middleware, controller/service, health-check, and hosted-service levels. | Uniform error schema, route-wide middleware wiring, correlation propagation, alerting, or complete exception observability across every route. | Partial; release packet must carry exception observability as mapped but not complete. |
| Migration evidence | OE-007 inventories migration classes and rollback-source evidence. | Migration source and `Down` method inventory are known. | Apply/rollback execution, SQL-only rollback, schema drift proof, or live DB safety. | Source-present only unless safe execution proof is added. |
| Dais E2E artifacts | OE-008 maps Dais proof gaps and future slices. | Dais proof boundaries and next test areas are explicit. | Release-grade Dais E2E completeness. | Plan-ready, not implementation-complete. |
| Operational runbook | OE-010 creates `BACKEND_OPERATIONAL_RUNBOOK.md`. | Future operators have validation, triage, rollback-decision, evidence, and escalation procedure. | Runtime control, deployment, or DB mutation authority. | Operable with explicit stop gates. |
| CI evidence | PR checks and Backend OE validation runs provide build, test, gate, evidence, and seal artifacts. | Pull-request validation trail exists. | Production telemetry or live runtime behavior. | Required as release evidence; not runtime observability. |

## Exception And Error-Path Surface Map

| Surface | Source evidence | What it proves | What it does not prove | Release handling |
|---------|-----------------|----------------|------------------------|------------------|
| Global exception middleware | `backend/src/TerraFusion.Core/Middleware/GlobalExceptionHandlingMiddleware.cs` logs unhandled request exceptions and API error responses. | A global request exception-handling component exists. | That every backend host/pipeline uses it, that every response is ProblemDetails-compatible, or that correlation is propagated to every error. | Treat as source-present exception surface; require wiring/runtime proof before release-complete claim. |
| Controller-local 500 paths | Source inspection finds broad controller `LogError` and `StatusCode(500, ...)` patterns across API/Core controllers. | Many controller error paths log exceptions and return explicit 500 responses. | Uniform response shape, sanitized response body, or complete endpoint inventory. | Carry as mapped-but-partial; release gate should require endpoint/action error policy review before production-readiness claim. |
| Health-check exception paths | `PacsReadinessHealthCheck` logs PACS contract violations and unexpected readiness failures; `ModuleConsistencyHealthCheck` logs consistency-check errors. | Dependency/readiness failures have explicit health-check error signals. | Alerting, production sink delivery, or complete dependency coverage. | Use with OE-004 readiness limits and PACS readiness tag caveat. |
| Hosted-service startup/migration failures | `AutoMigrateHostedService` logs auto-migration failure while allowing backend continuation; OE-005 maps service-registry startup/orchestration logs. | Startup and migration-adjacent failure signals exist. | Safe migration execution, rollback execution, or degraded-readiness propagation. | Carry as operational triage signal, not migration safety proof. |
| Audit/error response middleware boundary | OE-006 maps `AuditLoggingMiddleware` for downstream/controller 4xx/5xx response audit surfaces. | Controller-level error responses are intended audit surfaces. | Middleware-level authorization denial audit or exception correlation completeness. | Keep as partial until targeted auth-denial and exception-correlation proof exists. |

## Diagnostics By Operational Question

| Question | Primary signal | Supporting evidence | Current answer |
|----------|----------------|---------------------|----------------|
| Is the backend source healthy? | Canonical backend build | OE-001/OE-002 and PR checks | Yes for current zero-warning build posture; rerun on release branch. |
| Are unit/security slices healthy? | Unit and focused test artifacts | OE-001 and OE-006 | Yes for covered slices; not exhaustive production readiness. |
| Is integration environment available? | Docker/Testcontainers lane | OE-003 | Classified prerequisite; not repaired in Backend OE. |
| Is the API process live? | `/healthz`, `/health/live`, `/health` | OE-004 | Liveness surfaces exist, but this WO did not start services. |
| Is the backend dependency-ready? | `/healthz/ready` | OE-004 | Candidate exists, but dependency coverage is partial because of readiness tag mismatch. |
| Is service discovery healthy? | Service registry logs/controller/source evidence | OE-005 | Source-wired and class-tested, but runtime registry health is partial. |
| Are auth/county boundaries enforced? | OE-006 security matrix and focused tests | OE-006 | Proven for covered slices; endpoint allowlist/action-policy map remains a release gap. |
| Are audit signals complete? | Middleware/domain audit evidence | OE-006 | Domain/controller audit evidence exists; middleware-level authorization denial audit is unproven. |
| Can migrations be recovered? | Migration/rollback register | OE-007 | Source rollback evidence exists; apply/rollback execution proof is absent. |
| Is Dais release-grade E2E? | Dais E2E expansion plan | OE-008 | No; proof plan exists and blocks overclaiming. |
| Can an operator triage failures? | Backend operational runbook | OE-010 | Yes within documented stop gates and non-mutating procedures. |

## Missing Observability

| Missing signal | Impact | Recommended handling |
|----------------|--------|----------------------|
| Runtime log capture for a safe backend startup | Service registry, readiness, and startup claims remain source/test based. | Create a future runtime-validation WO only if service startup is explicitly authorized. |
| Registry writer/reader path proof | `/api/service-registry` cannot be treated as canonical registry health proof. | Carry as release-gate gap or authorize narrow implementation/proof WO. |
| Registered-service health and orphan detection | Listed services may not imply healthy services. | Carry as service-registry follow-up before release-health claims. |
| PACS readiness tag alignment | `/healthz/ready` may omit PACS readiness. | Repair or formally disposition before production readiness claim. |
| Public endpoint allowlist and full action-policy map | Anonymous/protected posture is not fully release-reviewed. | Carry as release-gate follow-up. |
| Middleware-level 401/403 audit proof | Authorization denials may be overclaimed as audited. | Require targeted proof or instrumentation design before claiming complete security audit. |
| Uniform exception correlation and response contract | Global middleware, controller-local 500 paths, health checks, and hosted services expose different error-path surfaces. | Require route/pipeline wiring proof, response-shape policy, and correlation propagation proof before claiming complete exception observability. |
| Migration apply/rollback execution artifact | Persistence rollback readiness is not execution-proven. | Prove in safe environment or scope release to source-present migration readiness. |
| Dais authenticated HTTP/restart/certification/cross-county mutation proof | Dais E2E remains planned, not complete. | Use OE-008 slices as future implementation/test WOs. |
| Production telemetry sink map | No live logging/metrics/tracing platform is proven. | Defer to release engineering or observability implementation lane. |

## Release Gate Impact

OE-011 changes the OE-009 release gate as follows:

| Gate | Previous state | New state |
|------|----------------|-----------|
| Diagnostics map | BLOCKER | PASS_WITH_GAP: diagnostics/observability surfaces are mapped, but missing runtime observability remains explicitly classified. |
| Operational packet | BLOCKER | Still pending OE-012. |
| Evidence rollup | BLOCKER | Still pending OE-013. |

## Explicit Non-Claims

This work order does not claim:

- production readiness,
- live runtime observability,
- service startup proof,
- Docker/Testcontainers repair,
- observability platform setup,
- CI workflow wiring,
- health/readiness behavior changes,
- service registry repair,
- security policy changes,
- uniform exception handling or correlation across every backend route,
- migration apply/rollback execution,
- Dais E2E implementation,
- or deployment authority.

## Review Closure

PR #1232 review asked OE-011 to map exception/error-path surfaces before OE-012 consumes this
packet. This revision adds the exception/error-path signal, a dedicated surface map, an explicit
missing-observability gap, and a non-claim for uniform route-wide exception handling/correlation.

## Validation

Planned validation for this work order:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Scope inspection confirms only authorized docs/governance/evidence files changed.
- No backend/runtime/tools-sync implementation files changed.

## Next Work Order

`WO-BACKEND-OE-012 - Backend Operational Packet`

Recommended scope:

- Assemble objective, capability, canon references, sovereignty boundary, execution playbook,
  validation gates, evidence requirements, runbook impact, ADR impact, ownership, rollback path,
  promotion criteria, done definition, and links to OE-003 through OE-011 evidence.
- Do not implement backend/runtime changes, CI wiring, migrations, service startup, deployment, or
  observability instrumentation.

STOP_TYPE: BACKEND_DIAGNOSTICS_OBSERVABILITY_MAPPED
