# Backend Operational Runbook

Date: 2026-07-06
Program: Backend Operational Excellence
Goal: GOAL-BACKEND-OPERATIONAL-EXCELLENCE
Loop: LOOP-BACKEND-OPERATIONAL-EXCELLENCE

## Purpose

This runbook defines how an operator validates, triages, and records evidence for the TerraFusion
backend without overclaiming production readiness. It converts the Backend OE release gate into an
operable procedure.

This runbook does not authorize service startup, Docker repair, database migration, deployment,
secrets access, county data access, PACS access, or runtime behavior changes.

## Operator Preconditions

Before using this runbook for a release-readiness claim, confirm:

- Worktree is clean and based on the intended release branch or `origin/main`.
- No backend/runtime implementation edits are mixed into evidence-only work.
- No production, county SQL, PACS, protected county data, or secrets are required.
- Docker/Testcontainers lane is either available and authorized or explicitly dispositioned as
  segmented/deferred.
- Current evidence links are recorded in the release packet or Backend OE rollup.

## Validation Sequence

Run these gates in order. Stop when a gate fails unless the failure is already classified and
accepted by the active release packet.

| Step | Gate | Command or evidence | Pass condition | Stop or triage condition |
|------|------|---------------------|----------------|--------------------------|
| 1 | Source identity | `git status --short`, `git rev-parse HEAD`, `git rev-parse origin/main` | Expected branch/HEAD and clean worktree. | Dirty, detached, unsafe, or unexpected worktree state. |
| 2 | Build | `dotnet build backend/TerraFusion.sln` | `0 Warning(s)`, `0 Error(s)`. | Any warning or error without warning-register disposition. |
| 3 | Warning posture | `WO-BACKEND-OE-002-BUILD-WARNING-REGISTER.md` plus current build output | Warning count remains zero. | Any new warning creates a warning-register update before release claim. |
| 4 | Unit lane | Current backend unit test command/evidence | Unit lane passes on current branch. | Unit failure not classified as environment-only. |
| 5 | Integration lane | `WO-BACKEND-OE-003-INTEGRATION-TEST-ENVIRONMENT-DEPENDENCY-REGISTER.md` | Docker-capable lane passes, or segmented/deferred disposition is explicit. | Docker/Testcontainers required but unavailable and not dispositioned. |
| 6 | Health/readiness | `WO-BACKEND-OE-004-HEALTH-READINESS-SEMANTICS-PROOF.md` | Release packet identifies authoritative liveness/readiness signals and limits. | Readiness endpoint semantics are ambiguous or overclaimed. |
| 7 | Service registry | `WO-BACKEND-OE-005-SERVICE-REGISTRY-RUNTIME-VALIDATION.md` | Registry proof is source/runtime-understood and gaps are dispositioned. | Registry is used as release-health proof while path/health/orphan gaps remain open. |
| 8 | Security/county | `WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md` | Public/protected boundary, auth, permission, county isolation, and audit gaps are classified. | Production security readiness is claimed without allowlist/action-policy proof. |
| 9 | Migration/rollback | `WO-BACKEND-OE-007-MIGRATION-ROLLBACK-PROOF-REGISTER.md` | Migration source, rollback source, and apply/rollback disposition are explicit. | Live/shared DB migration behavior is ambiguous. |
| 10 | Dais E2E | `WO-BACKEND-OE-008-DAIS-WORKFLOW-E2E-PROOF-EXPANSION-PLAN.md` | Dais claims are limited to proven coverage or follow-up slices are authorized. | Dais is called release-grade E2E while planned gaps remain open. |
| 11 | Release gate | `WO-BACKEND-OE-009-BACKEND-RELEASE-GATE-DEFINITION.md` | Gate status is green or explicitly dispositioned. | Any blocker is unresolved or overclaimed. |
| 12 | Diagnostics | `WO-BACKEND-OE-011-DIAGNOSTICS-OBSERVABILITY-MAP.md` when complete | Signals, logs, audit, health, CI, and missing observability are mapped. | Diagnostics map missing for release-readiness claim. |
| 13 | Operational packet | `WO-BACKEND-OE-012-BACKEND-OPERATIONAL-PACKET.md` when complete | Ownership, gates, rollback, evidence, and done definition are assembled. | Packet missing before closeout or handoff. |

## Integration Test Prerequisite Handling

The full solution test pass is currently blocked by Docker/Testcontainers SQL Server dependencies,
not by backend build warnings. Operators must treat this as an integration-lane prerequisite.

Allowed dispositions:

- Docker-capable lane passes in an authorized environment.
- Integration lane is segmented and required before production release.
- Integration lane is documented as local-only for the current non-production baseline.
- Integration lane is deferred with explicit release risk.
- Docker/Testcontainers repair is split into a separate owner-authorized WO.

Not allowed:

- Treat Docker/Testcontainers failure as warning debt.
- Weaken or remove tests to make the lane green.
- Start Docker, repair Docker, or change CI wiring from this runbook without explicit authority.

## Health And Readiness Interpretation

Use OE-004 as the source of truth for endpoint semantics.

Current operational posture:

- `/healthz` can be used as a liveness-style signal only within the limits recorded in OE-004.
- `/healthz/ready` must not be overclaimed as dependency-complete readiness until its readiness tag
  mismatch and dependency coverage are resolved or dispositioned.
- `/health/codex369`, `/api/transcendence/health`, Levy `/health`, and controller-local health
  endpoints are feature or subsystem health signals, not global release gates unless a release packet
  explicitly selects them.

## Service Registry Triage

Use OE-005 before treating ServiceRegistry as release proof.

Triage questions:

- Is `ServiceRegistry` registered in startup as expected?
- Is `StartupOrchestrationService` registered and invoked as expected?
- Is the seed path clear?
- Are writer/reader paths aligned?
- Are stale, orphan, degraded, and health states understood?
- Are registry logs or diagnostics available for the scenario being claimed?

If the answer to any question is unknown, record the gap instead of promoting the registry to release
proof.

## Security, Auth, County Isolation, And Audit

Use OE-006 as the release matrix.

Operators must verify or explicitly disposition:

- Public endpoint allowlist.
- Protected endpoint authorization policy.
- Role/permission checks for release-critical paths.
- CountyId/claim filtering behavior.
- Cross-county read and mutation denial.
- Domain audit and trace evidence.
- Known audit gap for middleware-level authorization denial, where applicable.

Do not use live county data, PACS, county SQL, production secrets, or production identity systems from
this runbook.

## Migration Safety And Rollback Interpretation

Use OE-007 as the migration source inventory.

Allowed from this runbook:

- Read migration evidence.
- Confirm migration classes and `Down` method inventory from existing evidence.
- Record whether apply/rollback execution proof exists.
- Record SQL-only rollback gaps.

Blocked from this runbook:

- `dotnet ef database update`
- `dotnet ef migrations add`
- New migration creation.
- Production/shared DB mutation.
- Destructive schema operation.
- County/PACS data access.

## Dais E2E Proof Gap Handling

Use OE-008 to constrain Dais claims.

Current Dais posture is proof-planned, not release-grade E2E complete. Operators must not claim Dais
release-grade E2E until the planned slices are implemented or explicitly deferred:

- Authenticated HTTP pipeline.
- Relational/restart persistence.
- Certification gate and metadata behavior.
- Cross-county mutation denial.
- Dais-Dossier boundary proof.
- Audit/trace closure for failure modes.

## Known Blocker Triage

| Blocker | Classification | Triage |
|---------|----------------|--------|
| Docker/Testcontainers SQL Server lane | Integration prerequisite | Segment, run in Docker-capable lane, defer explicitly, or authorize repair WO. |
| API.Tests Windows file lock from baseline | Environment/tooling caveat | Rerun or disposition affected lane before release claim. |
| `/healthz/ready` tag/dependency ambiguity | Readiness semantics gap | Do not use as global readiness gate until repaired or dispositioned. |
| ServiceRegistry writer/reader and health gaps | Operational proof gap | Record as registry release gap unless follow-up proof closes it. |
| Public endpoint allowlist/action-policy map | Security release gap | Complete or explicitly disposition before production readiness. |
| Migration apply/rollback not executed | Persistence release gap | Prove in safe environment or scope release to source-present readiness only. |
| Dais E2E slices not implemented | Product proof gap | Do not overclaim release-grade Dais E2E. |
| Local Prettier/Vitest hook gaps | DevEx tooling debt | Do not mix into Backend OE; use separate DevEx follow-up if needed. |

## Evidence Capture

For each backend validation run, capture:

- Branch and HEAD.
- `origin/main` or release branch SHA.
- Commands run.
- Build warning/error counts.
- Unit/integration lane result.
- Environment prerequisites used or missing.
- Release-gate disposition for every non-green gate.
- Links to PRs, commits, and evidence files.
- Explicit non-claims.

## Escalation Triggers

Stop for owner authorization if any step requires:

- Backend/runtime code change.
- Test implementation or repair.
- CI/release workflow wiring.
- Docker/Testcontainers repair.
- Migration/schema change or DB update.
- Production deployment.
- Secrets, county data, PACS, county SQL, or live service access.
- Destructive cleanup outside current-WO worktree repair rules.
- Review changes outside the active WO file scope.

## Done Definition

The runbook is usable when a future operator can:

- Validate build and warning posture.
- Interpret unit and integration test lanes.
- Triage Docker/Testcontainers prerequisites without misclassifying them as warning debt.
- Interpret health/readiness and service-registry evidence without overclaiming readiness.
- Reference security/county/audit, migration/rollback, and Dais E2E proof boundaries.
- Capture evidence and know when to stop for authority.
