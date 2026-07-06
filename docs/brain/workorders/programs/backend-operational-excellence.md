# P3 — Backend Operational Excellence

| Field | Value |
|-------|-------|
| Program | P3 |
| Goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Status | ACTIVE |
| Owner | Operator (bsvalues@gmail.com) |
| Last Updated | 2026-07-06 |
| Next WO | `WO-BACKEND-OE-011` after `WO-BACKEND-OE-010` merges |

---

## Goal

Turn the backend from implemented and slice-verified into an operationally governed backend platform
with explicit environment dependencies, readiness semantics, security proof, migration and rollback
evidence, release gates, runbooks, diagnostics, and closeout evidence.

## Current Facts

- Canonical backend solution build is zero-warning: `0 Warning(s)`, `0 Error(s)`.
- Warning burn-down is not active work.
- Full solution test pass is blocked by integration environment dependencies, not warnings.
- The integration dependency is classified as a Docker/Testcontainers prerequisite and segmented
  integration-lane candidate, not warning debt.
- Dais persistence exists.
- Service registry is source-wired and class-tested; OE-005 classifies runtime proof as partial
  because writer/reader path alignment and registered-service health/orphan coverage remain unproven.
- Health/readiness endpoints exist and OE-004 classifies their current semantics; release-gate
  policy still needs to decide which readiness signal is authoritative.
- Security/auth/county/audit proof is consolidated in OE-006, with release gaps for public endpoint
  allowlisting, exhaustive controller/action policy mapping, and runtime observability.
- Migration source is inventoried in OE-007: EF migration classes include `Down` methods in the
  inspected contexts, but apply/rollback execution, SQL-only rollback, and schema drift proof remain
  release-gate gaps.
- Dais workflow proof is planned in OE-008: source, service, controller, county-isolation, audit, and
  migration evidence exist, but full authenticated HTTP pipeline, relational/restart persistence,
  certification gate, cross-county mutation, and Dais-Dossier boundary proof remain release-gate gaps.

## Non-Goals

- Do not rebuild Dais persistence.
- Do not invent warning debt.
- Do not promote TerraPilot tools.
- Do not touch county data, PACS, live databases, production resources, or secrets.
- Do not use Backend OE to repair local Prettier/Vitest hook tooling.

## Risk And Sovereignty Boundary

| Area | Classification | Rule |
|------|----------------|------|
| Docs, evidence, runbooks | R1 / L1 | Allowed inside this program when scoped to backend operational truth |
| Tests and warning fixes | R2 / L2 | Allowed only after evidence identifies a specific backend operational gap |
| Runtime/backend behavior | R3+ | Requires the active WO to explicitly authorize the change |
| Identity, audit rail, county data pipelines, release gates, governance controls | S4 Sovereign Core | Stop if scope is unclear or authority is missing |
| Appeals, exemptions, valuation evidence, protected parcel context | S3 Assessor Protected | Evidence-first; no protected data access without explicit owner authorization |
| Production, county data, PACS, secrets, live DB, deployment | Authority wall | Explicit owner authorization required |

## Program Rules

- Observe current backend truth before implementation.
- Preserve the zero-warning backend build posture.
- Do not create EF migrations or apply database updates without an explicit migration WO.
- Do not access production, live county services, PACS, protected county data, or secrets.
- Do not continue TerraPilot P16, promote TerraPilot tools, or change tool maturity metadata.
- Treat passing build/test slices as evidence, not as production readiness.
- Treat local Prettier/Vitest hook absence as Developer Experience debt, not Backend OE debt.

---

## Completed Opening History

| WO | Status | Evidence |
|----|--------|----------|
| `WO-BACKEND-000` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-000-PROGRAM-PLAYBOOK.md` |
| `WO-BACKEND-OE-001` | COMPLETE | Baseline findings preserved in `WO-BACKEND-OE-002-BUILD-WARNING-REGISTER.md` |
| `WO-BACKEND-OE-001-S` | COMPLETE | Generated validation residue classified and cleaned from the baseline worktree |
| `WO-BACKEND-OE-002` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-002-BUILD-WARNING-REGISTER.md` |
| `WO-BACKEND-OE-003` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-003-INTEGRATION-TEST-ENVIRONMENT-DEPENDENCY-REGISTER.md` |
| `WO-BACKEND-OE-004` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-004-HEALTH-READINESS-SEMANTICS-PROOF.md` |
| `WO-BACKEND-OE-005` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-005-SERVICE-REGISTRY-RUNTIME-VALIDATION.md` |
| `WO-BACKEND-OE-006` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md` |
| `WO-BACKEND-OE-007` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-007-MIGRATION-ROLLBACK-PROOF-REGISTER.md` |
| `WO-BACKEND-OE-008` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-008-DAIS-WORKFLOW-E2E-PROOF-EXPANSION-PLAN.md` |
| `WO-BACKEND-OE-009` | CLOSED | `docs/brain/workorders/evidence/WO-BACKEND-OE-009-BACKEND-RELEASE-GATE-DEFINITION.md` |
| `WO-BACKEND-OE-010` | READY FOR PR | `docs/brain/workorders/evidence/WO-BACKEND-OE-010-BACKEND-OPERATIONAL-RUNBOOK.md`; `docs/brain/workorders/runbooks/BACKEND_OPERATIONAL_RUNBOOK.md` |

## Remaining Work Order Chain

| WO | Title | Mode | Dependency | Status | Next |
|----|-------|------|------------|--------|------|
| `WO-BACKEND-OE-003` | Integration Test Environment Dependency Register | Evidence/register documentation first | OE-002 merged | CLOSED | OE-004 |
| `WO-BACKEND-OE-004` | Health and Readiness Semantics Proof | Evidence + narrow endpoint contract proof | OE-003 merged | CLOSED | OE-005 |
| `WO-BACKEND-OE-005` | Service Registry Runtime Validation | Evidence + targeted validation | OE-004 merged | CLOSED | OE-006 |
| `WO-BACKEND-OE-006` | Security/Auth/County-Isolation Proof Matrix | Evidence matrix first | OE-005 merged | CLOSED | OE-007 |
| `WO-BACKEND-OE-007` | Migration and Rollback Proof Register | Evidence/register first | OE-006 merged | CLOSED | OE-008 |
| `WO-BACKEND-OE-008` | Dais Workflow E2E Proof Expansion Plan | Test-plan/evidence first | OE-007 merged | CLOSED | OE-009 |
| `WO-BACKEND-OE-009` | Backend Release Gate Definition | Governance/release checklist | OE-008 merged | CLOSED | OE-010 |
| `WO-BACKEND-OE-010` | Backend Operational Runbook | Runbook creation | OE-009 merged | READY FOR PR | OE-011 |
| `WO-BACKEND-OE-011` | Diagnostics and Observability Map | Evidence/docs | OE-010 merged | QUEUED | OE-012 |
| `WO-BACKEND-OE-012` | Backend Operational Packet | Operational packet assembly | OE-011 merged | QUEUED | OE-013 |
| `WO-BACKEND-OE-013` | Evidence Rollup and Program Closeout | Evidence rollup / closeout | OE-012 merged | QUEUED | Program close |

```text
WO-BACKEND-000
  -> WO-BACKEND-OE-001
  -> WO-BACKEND-OE-001-S
  -> WO-BACKEND-OE-002
  -> WO-BACKEND-OE-003
  -> WO-BACKEND-OE-004
  -> WO-BACKEND-OE-005
  -> WO-BACKEND-OE-006
  -> WO-BACKEND-OE-007
  -> WO-BACKEND-OE-008
  -> WO-BACKEND-OE-009
  -> WO-BACKEND-OE-010
  -> WO-BACKEND-OE-011
  -> WO-BACKEND-OE-012
  -> WO-BACKEND-OE-013
```

---

## Work Order Definitions

### WO-BACKEND-OE-003 - Integration Test Environment Dependency Register

**Mode:** evidence/register documentation first.
**Dependency:** `WO-BACKEND-OE-002` merged.

Purpose:

- Classify the Docker/Testcontainers SQL Server dependency that blocks full solution test pass.

Questions:

- Which tests require Docker/Testcontainers?
- Which projects are affected?
- Is SQL Server container required?
- Are secrets, PACS, county data, or live services required?
- Is the failure an environment prerequisite, test defect, backend defect, or release-gate blocker?
- How should this lane be represented in CI/release validation?

Allowed scope:

- Source and test inventory.
- Existing safe command evidence.
- Documentation/evidence only unless a separate repair WO is authorized.

Blocked scope:

- Backend runtime code changes.
- CI workflow changes.
- Docker/Testcontainers service startup unless explicitly authorized.
- Test weakening or exclusion without policy-backed evidence.
- Secrets, PACS, county data, live services, migrations, or deployment.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-003-INTEGRATION-TEST-ENVIRONMENT-DEPENDENCY-REGISTER.md`

Verdict options:

- Documented prerequisite.
- Segmented CI lane.
- Local-only integration lane.
- Repair target.
- Release-gate blocker.

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- No backend/runtime file changes.

Stop type:

- `BACKEND_INTEGRATION_DEPENDENCY_REGISTER_READY_FOR_PR`

Next routing:

- `WO-BACKEND-OE-004` unless evidence says the dependency is a release-blocking repair.

### WO-BACKEND-OE-004 - Health and Readiness Semantics Proof

**Mode:** evidence + narrow endpoint contract proof.
**Dependency:** `WO-BACKEND-OE-003` merged.

Purpose:

- Define what backend health/readiness endpoints actually prove.

Known endpoints to classify:

- `/healthz`
- `/healthz/ready`
- `/health/codex369`
- `/api/transcendence/health`
- Levy `/health`

Questions:

- Is the endpoint liveness, readiness, dependency readiness, or feature health?
- Does it require auth?
- Is it production-safe?
- Does it expose sensitive information?
- Which dependencies are checked?
- What does failure mean operationally?
- Which endpoint should release gates rely on?

Allowed scope:

- Source inspection.
- Existing safe tests if available.
- Evidence and endpoint contract documentation.

Blocked scope:

- Service startup unless explicitly authorized.
- Production, county, PACS, live DB, or secret access.
- Backend runtime behavior changes unless a separate WO authorizes them.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-004-HEALTH-READINESS-SEMANTICS-PROOF.md`

Validation:

- Source inspection.
- Existing safe tests if available.
- No service startup unless explicitly authorized.
- No production/county/PACS access.

Stop type:

- `BACKEND_HEALTH_READINESS_SEMANTICS_PROVEN`

Next routing:

- `WO-BACKEND-OE-005`

### WO-BACKEND-OE-005 - Service Registry Runtime Validation

**Mode:** evidence + targeted validation.
**Dependency:** `WO-BACKEND-OE-004` merged.

Purpose:

- Move service registry from source-wired to runtime-understood.

Questions:

- Where is `ServiceRegistry` registered?
- Where is `StartupOrchestrationService` registered?
- What gets seeded?
- What failure modes exist?
- What logs prove registry startup?
- What tests cover registration and startup orchestration?
- What gaps remain before release?

Allowed scope:

- Source inspection.
- Targeted existing tests.
- Evidence and validation matrix.

Blocked scope:

- Runtime mutation.
- Broad startup rewiring.
- Production/live resources.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-005-SERVICE-REGISTRY-RUNTIME-VALIDATION.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Targeted existing tests if safe.

Stop type:

- `BACKEND_SERVICE_REGISTRY_RUNTIME_VALIDATED`

Next routing:

- `WO-BACKEND-OE-006`

### WO-BACKEND-OE-006 - Security/Auth/County-Isolation Proof Matrix

**Mode:** evidence matrix first.
**Dependency:** `WO-BACKEND-OE-005` merged.

Purpose:

- Consolidate auth, authorization, county isolation, audit, and security proof into one release-grade
  matrix.

Scope:

- Authentication middleware.
- Authorization policies.
- Controller security boundary tests.
- Dais county isolation.
- Cross-county denial tests.
- Audit correlation tests.
- Security event surfaces.
- Owner/PII leak checks where existing evidence supports them.

Blocked scope:

- Auth architecture rewrite.
- New identity provider.
- Secrets changes.
- Production credentials.
- Live county/PACS resources.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Existing safe tests/evidence only unless a separate implementation WO authorizes more.

Stop type:

- `BACKEND_SECURITY_PROOF_MATRIX_READY`

Next routing:

- `WO-BACKEND-OE-007`

### WO-BACKEND-OE-007 - Migration and Rollback Proof Register

**Mode:** evidence/register first.
**Dependency:** `WO-BACKEND-OE-006` merged.

Purpose:

- Inventory backend migrations and classify rollback/readiness evidence.

Scope:

- Dais migration.
- PACS/sync migrations.
- Audit-event migrations.
- Migration ordering.
- `Down` methods where present.
- Migration apply/rollback proof if already existing.
- Schema drift risks.

Blocked scope:

- `dotnet ef database update`.
- New migration creation.
- Destructive schema operation.
- Production DB.
- County/PACS data.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-007-MIGRATION-ROLLBACK-PROOF-REGISTER.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- No migration creation or database mutation.

Stop type:

- `BACKEND_MIGRATION_ROLLBACK_REGISTER_READY`

Next routing:

- `WO-BACKEND-OE-008`

### WO-BACKEND-OE-008 - Dais Workflow E2E Proof Expansion Plan

**Mode:** test-plan/evidence first.
**Dependency:** `WO-BACKEND-OE-007` merged.

Purpose:

- Define the next Dais proof gaps without rebuilding persistence.

Test areas:

- Dais CRUD unhappy paths.
- Malformed payloads.
- Missing county context.
- Cross-county denial.
- Concurrency/update conflict.
- Validation errors.
- Audit/trace behavior.
- Restart persistence if safe.
- Controller/service boundary behavior.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-008-DAIS-WORKFLOW-E2E-PROOF-EXPANSION-PLAN.md`

Output:

- Existing proof.
- Missing proof.
- Proposed test slices.
- Release relevance.
- Risk ranking.

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- No backend/runtime implementation unless a follow-up WO authorizes it.

Stop type:

- `BACKEND_DAIS_E2E_PROOF_PLAN_READY`

Next routing:

- `WO-BACKEND-OE-009`

### WO-BACKEND-OE-009 - Backend Release Gate Definition

**Mode:** governance/release checklist.
**Dependency:** `WO-BACKEND-OE-008` merged.

Purpose:

- Define objective criteria for backend release readiness.

Release gate must include:

- Backend build green.
- Warning count threshold.
- Unit test lane.
- Integration test lane classification.
- Health/readiness semantics.
- Service registry validation.
- Security/auth/county-isolation proof.
- Migration/rollback proof.
- Audit/trace proof.
- Runbook exists.
- Evidence attached.
- Known blockers classified.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-009-BACKEND-RELEASE-GATE-DEFINITION.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`

Stop type:

- `BACKEND_RELEASE_GATE_DEFINED`

Next routing:

- `WO-BACKEND-OE-010`

### WO-BACKEND-OE-010 - Backend Operational Runbook

**Mode:** runbook creation.
**Dependency:** `WO-BACKEND-OE-009` merged.

Purpose:

- Create the operator runbook for backend validation, triage, rollback, and evidence capture.

Runbook must cover:

- Build validation.
- Unit test validation.
- Integration test prerequisite handling.
- Health/readiness interpretation.
- Service registry triage.
- Auth/security proof references.
- Migration safety.
- Rollback procedure.
- Known blocker triage.
- Evidence capture.
- Escalation triggers.

Deliverables:

- `docs/brain/workorders/runbooks/BACKEND_OPERATIONAL_RUNBOOK.md`
- `docs/brain/workorders/evidence/WO-BACKEND-OE-010-BACKEND-OPERATIONAL-RUNBOOK.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`

Stop type:

- `BACKEND_OPERATIONAL_RUNBOOK_READY`

Next routing:

- `WO-BACKEND-OE-011`

### WO-BACKEND-OE-011 - Diagnostics and Observability Map

**Mode:** evidence/docs.
**Dependency:** `WO-BACKEND-OE-010` merged.

Purpose:

- Map backend diagnostics and operational signals.

Scope:

- Logs.
- Health checks.
- Readiness checks.
- Audit events.
- Security events.
- Service registry events.
- Exception surfaces.
- Test artifacts.
- CI evidence.
- Missing observability.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-011-DIAGNOSTICS-OBSERVABILITY-MAP.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`

Stop type:

- `BACKEND_DIAGNOSTICS_OBSERVABILITY_MAPPED`

Next routing:

- `WO-BACKEND-OE-012`

### WO-BACKEND-OE-012 - Backend Operational Packet

**Mode:** operational packet assembly.
**Dependency:** `WO-BACKEND-OE-011` merged.

Purpose:

- Assemble the Backend Operational Excellence packet.

Packet must include:

- Objective.
- Capability affected.
- Canon references.
- Sovereignty boundary.
- Execution playbook.
- Validation gates.
- Evidence requirements.
- Runbook impact.
- ADR impact.
- Operational ownership.
- Rollback path.
- Promotion criteria.
- Done definition.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-012-BACKEND-OPERATIONAL-PACKET.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`

Stop type:

- `BACKEND_OPERATIONAL_PACKET_READY`

Next routing:

- `WO-BACKEND-OE-013`

### WO-BACKEND-OE-013 - Evidence Rollup and Program Closeout

**Mode:** evidence rollup / closeout.
**Dependency:** `WO-BACKEND-OE-012` merged.

Purpose:

- Close the Backend Operational Excellence program with proof, deferred items, and next-lane
  recommendation.

Rollup must include:

- Completed WOs.
- Evidence links.
- Validation summary.
- Build/warning state.
- Integration-test dependency state.
- Release gate state.
- Runbook state.
- Remaining risks.
- Deferred WOs.
- Recommended next program:
  - Property Workbench.
  - County Runtime.
  - Release Engineering.
  - Continue Backend OE only if blockers remain.

Deliverable:

- `docs/brain/workorders/evidence/WO-BACKEND-OE-013-EVIDENCE-ROLLUP-PROGRAM-CLOSEOUT.md`

Validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`

Stop type:

- `BACKEND_OPERATIONAL_EXCELLENCE_PROGRAM_CLOSED`

---

## Autonomous Continuation Rule

Codex may proceed from one Backend OE evidence/doc WO to the next only when:

- Current WO is merged to `origin/main`.
- PR checks are green/acceptable.
- Review threads are resolved.
- No backend/runtime code changes are required.
- No secrets, county data, PACS, live DB, or live county resources are touched.
- Next WO is same or lower risk.
- Next WO is already defined in this playbook.

Codex must stop for owner decision when:

- Implementation is required.
- Backend/runtime code change is required.
- Test repair is required.
- CI/release gate wiring is required.
- Docker/Testcontainers repair is required.
- Secrets, county data, PACS, live services, or live DB are implicated.
- Review requires scope expansion outside the current WO.
- Local tooling bypass is needed.

---

## Optional Separate DevEx Lane - Not Backend OE

Program:

- Developer Experience / Local Hook Bootstrap.

Work order:

- `WO-DEVEX-HOOKS-001 - Local Prettier/Vitest Hook Bootstrap Diagnosis`.

Trigger:

- Only if local hook failures recur or the owner authorizes it.

Purpose:

- Fix or document local pre-commit/pre-push tooling prerequisites.

Not part of:

- Backend Operational Excellence.

Why:

- Prettier/Vitest hook absence is local tooling debt, not backend release debt.
