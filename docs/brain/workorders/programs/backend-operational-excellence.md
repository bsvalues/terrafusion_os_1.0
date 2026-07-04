# P3 — Backend Operational Excellence

**Program:** P3
**Goal:** `GOAL-BACKEND-OPERATIONAL-EXCELLENCE`
**Loop:** `LOOP-BACKEND-OPERATIONAL-EXCELLENCE`
**Status:** ACTIVE
**Owner:** Operator (bsvalues@gmail.com)
**Last Updated:** 2026-07-03

---

## Goal

Turn the backend from implemented and slice-verified into an operationally governed platform with
explicit build health, readiness proof, diagnostics, runtime validation, release criteria, evidence,
and rollback discipline.

## Non-Goal

Do not rebuild TerraDais persistence. Do not reopen foundation work unless WO-BACKEND-001 discovers a
current regression. Do not treat passing slices as production readiness.

## Known Baseline

- TerraPilot Tool Maturity is parked at P15.
- `origin/main` baseline for this program playbook: `2195309dacabc22eb4f0f0939178331d8ded86d4`.
- Backend/Dais foundation is believed implemented.
- Service registry activation is believed implemented.
- Previous backend build passed with warnings remaining.
- The next work is production discipline, not foundation rebuild.

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
- Keep warning burn-down tied to a warning register; no broad cleanup.
- Do not create EF migrations or apply database updates without an explicit migration WO.
- Do not access production, live county services, PACS, protected county data, or secrets.
- Do not continue TerraPilot P16, promote TerraPilot tools, or change tool maturity metadata.
- Treat passing build/test slices as evidence, not as production readiness.

---

## Work Orders

| WO | Title | Mode | Status | Purpose |
|----|-------|------|--------|---------|
| WO-BACKEND-000 | Backend Operational Excellence Program Playbook | Docs/governance creation | **THIS WO** | Register the program, goal, loop, chain, scope, evidence, and stop gates |
| WO-BACKEND-001 | Backend Operational Excellence Baseline | Read-only discovery / evidence baseline | NEXT | Establish current backend operational truth on `origin/main` |
| WO-BACKEND-002 | Build Warning Register | Docs/evidence first | QUEUED | Capture every backend warning verbatim and classify release risk |
| WO-BACKEND-003 | Build Warning Burn-down | Small implementation slices only | QUEUED | Fix only warning-register-approved warnings |
| WO-BACKEND-004 | Service Registry Runtime Validation | Evidence + targeted tests | QUEUED | Prove service registry runtime behavior and failure modes |
| WO-BACKEND-005 | Health and Readiness Truth | Audit + narrow implementation if authorized | QUEUED | Define what health/readiness endpoints actually prove |
| WO-BACKEND-006 | Backend Security / Auth / County Isolation Proof | Evidence-first; tests if scoped | QUEUED | Prove protected paths enforce auth, role, county, and audit expectations |
| WO-BACKEND-007 | Migration and Rollback Proof | Controlled validation; no production DB | QUEUED | Prove persistence can be migrated and recovered safely |
| WO-BACKEND-008 | Broader Dais / Workflow E2E Proof | Targeted test expansion | QUEUED | Prove Dais behavior beyond happy-path audited slices |
| WO-BACKEND-009 | Backend Release Gate Definition | Governance/docs + optional gate wiring later | QUEUED | Define objective backend release-ready criteria |
| WO-BACKEND-010 | Backend Operational Runbook | Runbook creation | QUEUED | Create backend startup, validation, failure triage, rollback, and evidence runbook |
| WO-BACKEND-011 | Backend Diagnostics and Observability Map | Evidence and docs first | QUEUED | Map logs, metrics, traces, audit events, health checks, and diagnostic signals |
| WO-BACKEND-012 | Backend Operational Packet | Operational packet assembly | QUEUED | Consolidate the program into an executable operational packet |
| WO-BACKEND-013 | Evidence Rollup and Program Closeout | Evidence rollup | QUEUED | Close the program with proof, gaps, deferred work, and next-lane recommendation |

## Dependency Chain

```text
WO-BACKEND-000
  -> WO-BACKEND-001
  -> WO-BACKEND-002
  -> WO-BACKEND-003
  -> WO-BACKEND-004
  -> WO-BACKEND-005
  -> WO-BACKEND-006
  -> WO-BACKEND-007
  -> WO-BACKEND-008
  -> WO-BACKEND-009
  -> WO-BACKEND-010
  -> WO-BACKEND-011
  -> WO-BACKEND-012
  -> WO-BACKEND-013
```

---

## WO Definitions

### WO-BACKEND-001 — Backend Operational Excellence Baseline

**Mode:** read-only discovery / evidence baseline.

Purpose:

- Establish current backend operational truth on `origin/main`.

Output:

- Build result.
- Warning count.
- Warning categories.
- Test inventory.
- Test results.
- Dais proof points.
- Service registry proof points.
- Health/readiness endpoint map.
- Auth/security/county-isolation evidence map.
- Release-readiness gap list.
- Recommendation for WO-BACKEND-002.

Allowed:

- Read-only inspection.
- `dotnet build`.
- Existing tests if no external services or secrets are required.
- `pnpm run type-check` if needed.

Blocked:

- Edits.
- Commits.
- Migrations.
- Runtime config changes.
- Live DB, PACS, or county resources.

Done:

- Backend baseline report exists and the next WO is selected from evidence.

### WO-BACKEND-002 — Build Warning Register

**Mode:** docs/evidence first; implementation only if explicitly authorized after register.

Purpose:

- Capture every backend warning verbatim and classify release risk.

Output:

- Warning ledger.
- Category per warning: nullable/reference safety, obsolete API, dead/deprecated code, analyzer/style,
  package/runtime concern, or configuration risk.
- Owner/disposition per warning.
- Fix/defer recommendation.

Done:

- Warnings are no longer vague debt. Each warning has a disposition and next action.

### WO-BACKEND-003 — Build Warning Burn-down

**Mode:** small implementation slices only.

Dependency:

- WO-BACKEND-002 complete.

Purpose:

- Fix high-signal warnings that affect runtime safety, maintainability, or release confidence.

Scope:

- Only warnings approved by the warning register.

Blocked:

- Broad cleanup.
- Unrelated refactors.
- Style-only churn unless explicitly approved.
- Runtime behavior changes not tied to a warning.

Validation:

- `dotnet build backend/TerraFusion.sln`.
- Relevant targeted tests.
- `pnpm run type-check` if coupled.

Done:

- Warning count reduced or justified, and no new warnings introduced.

### WO-BACKEND-004 — Service Registry Runtime Validation

**Mode:** evidence + targeted tests.

Purpose:

- Move service registry from wired in startup to runtime-validated and failure-mode understood.

Checks:

- `Program.cs` registration path.
- `StartupOrchestrationService` behavior.
- Startup success path.
- Degraded/failure path.
- Registry drift behavior.
- Logging/observability.
- Environment-specific config behavior.

Output:

- Service registry validation report.
- Failure-mode matrix.
- Required test additions, if any.
- Runtime proof if safe.

Done:

- Service registry is not just present; it is operationally understandable and test-backed.

### WO-BACKEND-005 — Health and Readiness Truth

**Mode:** audit + implementation if narrow.

Purpose:

- Define what backend health/readiness endpoints actually prove.

Questions:

- Which health endpoints exist?
- Which readiness endpoints exist?
- Which dependencies do they check?
- Do they distinguish live, degraded, unavailable, and unauthenticated?
- Are endpoints safe for production exposure?
- Are they county/data safe?

Output:

- Endpoint inventory.
- Readiness semantics table.
- Missing checks.
- Proposed endpoint contract.
- Test plan.

Done:

- Health/readiness stops being a vague status page and becomes an operational contract.

### WO-BACKEND-006 — Backend Security / Auth / County Isolation Proof

**Mode:** evidence-first; tests if scoped.

Purpose:

- Prove backend protected paths enforce auth, role, county, and audit expectations.

Scope:

- Auth-required endpoints.
- Role/permission checks.
- `CountyId` filters.
- Cross-county denial behavior.
- Audit/security event emission where expected.
- No owner-sensitive or county-sensitive leak in responses.

Blocked:

- Auth architecture rewrite.
- New identity provider.
- Secrets changes.
- Production credentials.
- County DB/PACS access.

Output:

- Security/readiness proof matrix.
- Tests run.
- Gaps by endpoint/domain.
- Risk-ranked follow-up WOs.

Done:

- Security posture is described from evidence, not assumption.

### WO-BACKEND-007 — Migration and Rollback Proof

**Mode:** controlled validation; no production DB.

Purpose:

- Prove backend persistence can be migrated and recovered safely.

Scope:

- Migration presence.
- Migration apply in safe/local/test context.
- Rollback/down-path evidence where available.
- Dais migration status.
- Schema drift detection.
- No accidental production mutation.

Blocked:

- Production database update.
- Live county data.
- Unapproved EF migration creation.
- Destructive schema operations.

Output:

- Migration inventory.
- Apply/rollback proof or documented blocker.
- Schema risk register.
- Recovery notes.

Done:

- Persistence readiness includes rollback/recovery evidence, not just "migration file exists."

### WO-BACKEND-008 — Broader Dais / Workflow E2E Proof

**Mode:** targeted test expansion.

Purpose:

- Prove Dais behavior beyond happy-path audited slices.

Test targets:

- Dais CRUD unhappy paths.
- Malformed payloads.
- Missing county context.
- Cross-county denial.
- Concurrency/update conflict.
- Validation errors.
- Audit/trace behavior.
- Restart persistence if safe.

Done:

- Dais proof covers realistic failure modes, not only success slices.

### WO-BACKEND-009 — Backend Release Gate Definition

**Mode:** governance/docs + optional gate wiring later.

Purpose:

- Define objective criteria for backend release-ready.

Release gate must include:

- Build green.
- Warning threshold met.
- Test suite matrix green.
- Migrations verified.
- Rollback documented.
- County isolation verified.
- Auth/security proof present.
- Service registry healthy.
- Health/readiness semantics verified.
- Audit/trace hooks verified.
- Runbook updated.
- Evidence attached.

Output:

- Backend release checklist.
- Required validation commands.
- Pass/fail definitions.
- Promotion criteria.

Done:

- No more implied production-readiness. Release readiness has a checklist.

### WO-BACKEND-010 — Backend Operational Runbook

**Mode:** runbook creation.

Purpose:

- Create the operator runbook for backend startup, validation, failure triage, rollback, and evidence capture.

Runbook must cover:

- Local/dev validation.
- Shared validation environment.
- Build/test commands.
- Health/readiness interpretation.
- Service registry triage.
- Migration safety.
- Rollback procedure.
- Log locations.
- Evidence capture.
- Escalation triggers.

Done:

- A future operator can validate and recover the backend without rediscovering the system.

### WO-BACKEND-011 — Backend Diagnostics and Observability Map

**Mode:** evidence and docs first.

Purpose:

- Map backend logs, metrics, traces, audit events, health checks, and diagnostic signals.

Output:

- Diagnostics inventory.
- What each signal proves.
- What is missing.
- Minimum observability requirements for release.
- Follow-up instrumentation WOs if needed.

Done:

- Operational visibility is mapped and gaps are explicit.

### WO-BACKEND-012 — Backend Operational Packet

**Mode:** operational packet assembly.

Purpose:

- Consolidate the backend program into an executable operational packet.

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

Done:

- Backend Operational Excellence can be operated, validated, evidenced, and recovered.

### WO-BACKEND-013 — Evidence Rollup and Program Closeout

**Mode:** evidence rollup.

Purpose:

- Close the program with proof, gaps, deferred work, and next-lane recommendation.

Output:

- Completed WO list.
- Evidence links.
- Validation summary.
- Release-gate status.
- Remaining risks.
- Deferred WOs.
- Recommendation: continue backend, move to Property Workbench, move to County Runtime, or move to
  Release Engineering.

Done:

- Program state is clear enough that WOE can compute the next lane.

---

## Stop Conditions

Stop and request owner authority if the work requires:

- Production deployment.
- Secrets, credentials, PACS, county SQL, live DB, or protected county data.
- Schema migration creation or apply.
- Destructive schema or data operation.
- Auth architecture rewrite or identity-provider change.
- Runtime behavior change outside the current WO.
- Conflicting canon about backend readiness or release criteria.
- Continuing TerraPilot P16 or promoting TerraPilot tools.

## Completion Criteria

Program closeout requires WO-BACKEND-013 to show:

- Build health evidence.
- Warning disposition.
- Runtime validation evidence.
- Release gate checklist.
- Security/readiness proof.
- Migration/rollback proof.
- Operational runbook.
- Diagnostics map.
- Deferred risk register.
