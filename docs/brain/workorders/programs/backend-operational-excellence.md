# P3 — Backend Operational Excellence

| Field | Value |
|-------|-------|
| Program | P3 |
| Goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Status | ACTIVE |
| Owner | Operator (bsvalues@gmail.com) |
| Last Updated | 2026-07-04 |

---

## Goal

Turn the backend from implemented and slice-verified into an operationally governed platform with
explicit build health, readiness proof, diagnostics, runtime validation, release criteria, evidence,
and rollback discipline.

## Non-Goal

Do not rebuild TerraDais persistence. Do not reopen foundation work unless WO-BACKEND-OE-001 discovers a
current regression. Do not treat passing slices as production readiness.

## Known Baseline

- TerraPilot Tool Maturity is parked at P15.
- `origin/main` baseline for this program playbook: `2195309dacabc22eb4f0f0939178331d8ded86d4`.
- Backend/Dais foundation is believed implemented.
- Service registry activation is believed implemented.
- WO-BACKEND-OE-001 confirmed the canonical backend build passes with `0 Warning(s)` and `0 Error(s)`.
- Warning burn-down is not currently required; non-warning blockers are tracked separately.
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
- Preserve the zero-warning backend build posture; do not invent warning burn-down work when the
  register is empty.
- Do not create EF migrations or apply database updates without an explicit migration WO.
- Do not access production, live county services, PACS, protected county data, or secrets.
- Do not continue TerraPilot P16, promote TerraPilot tools, or change tool maturity metadata.
- Treat passing build/test slices as evidence, not as production readiness.

---

## Work Orders

The `WO-BACKEND-OE-*` prefix is intentional. Earlier backend evidence packets
already use `WO-BACKEND-001` through `WO-BACKEND-007`; this renewed operational
excellence chain preserves those completed IDs and avoids ambiguous routing.

| WO | Title | Mode | Status | Purpose |
|----|-------|------|--------|---------|
| WO-BACKEND-000 | Backend Operational Excellence Program Playbook | Docs/governance creation | **THIS WO** | Register the program, goal, loop, chain, scope, evidence, and stop gates |
| WO-BACKEND-OE-001 | Backend Operational Excellence Baseline | Read-only discovery / evidence baseline | COMPLETE (evidence preserved in OE-002 packet) | Established current backend operational truth on `origin/main`; build is zero-warning, with non-warning blockers classified |
| WO-BACKEND-OE-002 | Build Warning Register | Docs/evidence register | THIS WO | Record zero-warning canonical build state and separate non-warning blockers from warning debt |
| WO-BACKEND-OE-003 | Integration Test Environment Dependency Register | Docs/evidence decision register | NEXT | Classify Docker/Testcontainers and local test reliability blockers before runtime validation work |
| WO-BACKEND-OE-004 | Service Registry Runtime Validation | Evidence + targeted tests | QUEUED | Prove service registry runtime behavior and failure modes |
| WO-BACKEND-OE-005 | Health and Readiness Truth | Audit + narrow implementation if authorized | QUEUED | Define what health/readiness endpoints actually prove |
| WO-BACKEND-OE-006 | Backend Security / Auth / County Isolation Proof | Evidence-first; tests if scoped | QUEUED | Prove protected paths enforce auth, role, county, and audit expectations |
| WO-BACKEND-OE-007 | Migration and Rollback Proof | Controlled validation; no production DB | QUEUED | Prove persistence can be migrated and recovered safely |
| WO-BACKEND-OE-008 | Broader Dais / Workflow E2E Proof | Targeted test expansion | QUEUED | Prove Dais behavior beyond happy-path audited slices |
| WO-BACKEND-OE-009 | Backend Release Gate Definition | Governance/docs + optional gate wiring later | QUEUED | Define objective backend release-ready criteria |
| WO-BACKEND-OE-010 | Backend Operational Runbook | Runbook creation | QUEUED | Create backend startup, validation, failure triage, rollback, and evidence runbook |
| WO-BACKEND-OE-011 | Backend Diagnostics and Observability Map | Evidence and docs first | QUEUED | Map logs, metrics, traces, audit events, health checks, and diagnostic signals |
| WO-BACKEND-OE-012 | Backend Operational Packet | Operational packet assembly | QUEUED | Consolidate the program into an executable operational packet |
| WO-BACKEND-OE-013 | Evidence Rollup and Program Closeout | Evidence rollup | QUEUED | Close the program with proof, gaps, deferred work, and next-lane recommendation |

## Dependency Chain

```text
WO-BACKEND-000
  -> WO-BACKEND-OE-001
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

## WO Definitions

### WO-BACKEND-OE-001 — Backend Operational Excellence Baseline

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
- Recommendation for WO-BACKEND-OE-002.

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

- Backend baseline findings are preserved in an evidence packet and the next WO is selected from evidence.

### WO-BACKEND-OE-002 — Build Warning Register

**Mode:** docs/evidence register.

Purpose:

- Record the backend warning state from WO-BACKEND-OE-001 evidence.
- Confirm the canonical backend build currently has `0 Warning(s)` and `0 Error(s)`.
- Separate non-warning operational blockers from warning debt.

Output:

- Zero-warning register verdict.
- Canonical build command and result.
- Empty warning ledger.
- Non-warning blocker list.
- Recommendation for the next backend OE work order.

Done:

- Warning debt is either explicitly registered or, as of WO-BACKEND-OE-001, confirmed empty.
- No warning burn-down work is invented when warning count is zero.

### WO-BACKEND-OE-003 — Integration Test Environment Dependency Register

**Mode:** docs/evidence decision register.

Dependency:

- WO-BACKEND-OE-002 complete.

Purpose:

- Classify non-warning validation blockers discovered by WO-BACKEND-OE-001.

Scope:

- Docker/Testcontainers SQL Server dependency in `TerraFusion.Integration.Tests.Sync.*` and Atlas SQL Server tests.
- `TerraFusion.API.Tests` Windows file-lock issue on `MvcTestingAppManifest.json`.
- Test-lane segmentation and release-gate implications.

Blocked:

- Backend runtime changes.
- CI workflow changes unless separately authorized.
- Docker/Testcontainers service startup unless explicitly authorized.
- Test weakening or exclusion without policy-backed evidence.

Validation:

- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.
- Evidence review against WO-BACKEND-OE-001 test output.

Done:

- Each non-warning blocker has a disposition: documented prerequisite, skipped/segmented CI lane,
  local-only integration lane, repair target, or release-gate blocker.

### WO-BACKEND-OE-004 — Service Registry Runtime Validation

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

### WO-BACKEND-OE-005 — Health and Readiness Truth

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

### WO-BACKEND-OE-006 — Backend Security / Auth / County Isolation Proof

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

### WO-BACKEND-OE-007 — Migration and Rollback Proof

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

### WO-BACKEND-OE-008 — Broader Dais / Workflow E2E Proof

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

### WO-BACKEND-OE-009 — Backend Release Gate Definition

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

### WO-BACKEND-OE-010 — Backend Operational Runbook

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

### WO-BACKEND-OE-011 — Backend Diagnostics and Observability Map

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

### WO-BACKEND-OE-012 — Backend Operational Packet

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

### WO-BACKEND-OE-013 — Evidence Rollup and Program Closeout

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

Program closeout requires WO-BACKEND-OE-013 to show:

- Build health evidence.
- Warning disposition.
- Runtime validation evidence.
- Release gate checklist.
- Security/readiness proof.
- Migration/rollback proof.
- Operational runbook.
- Diagnostics map.
- Deferred risk register.
