# Benton County Onsite Production Demo Charter (Executable Superpowers Format)

Date: 2026-03-19
Branch: main
Classification: Execution-authorized charter (bounded lanes, hard-stop enforced)
Mode: Multi-agent orchestration with single-writer safety

## Mission

Deliver a fully functional Benton County onsite demo and dev-test environment with security closure, county isolation integrity, stable operator flows, and reproducible proof artifacts.

## Success Definition

The charter is complete only when all are true:

1. Demo-critical security findings are closed or formally waived with signed evidence.
2. County-scoped and auth-scoped behavior is enforced on all demo pathways.
3. Benton golden journeys run end-to-end without blocker-grade failure.
4. Command wall is green on final closure run.
5. Demo packet is published with runbook, rollback steps, and evidence bundle.

## Hard Constraints

1. Single writer lane for code changes by default.
2. Parallel subagents are read-only unless granted explicit disjoint-write scope.
3. No forbidden-scope edits.
4. No hardcoded ports; environment-variable pattern only.
5. Hard stop on failed mandatory gate.

## Lane Owners

| Lane | Owner | Responsibility | Write Scope |
|---|---|---|---|
| L0 Governance + Checkpoint | @tf-checkpoint | Phase entry/exit, barrier decisions, closure records | .governance/workflow/** docs only |
| L1 Security Closure | Copilot writer (@tf-writer) | Close JWT/anonymous-write/sanitization risks in active demo surfaces | frontend/apps/os-shell/**, backend/src/** (bounded files only) |
| L2 County Isolation + RBAC | Copilot writer (@tf-writer) | Enforce county/auth ownership and tool-risk policy on demo routes | frontend/apps/os-shell/**, os-platform/core/**, backend/src/** (bounded files only) |
| L3 Demo Flow Reliability | Copilot writer (@tf-writer) | Remove demo blockers in top Benton journeys and fallback states | frontend/apps/os-shell/**, backend/src/** (bounded files only) |
| L4 Proof + Evidence | Proof-Audit subagent (read-only) | Run command wall, capture pass/fail output, attach artifacts | Read-only |
| L5 Contract-Truth | Contract-Truth subagent (read-only) | Verify scope, gate claims, and dependency posture before release | Read-only |

## Execution Topology

1. Run L4 and L5 in parallel (read-only).
2. Run synchronization barrier.
3. Open one writer lane at a time (L1 -> L2 -> L3).
4. Re-run L4 command wall after each writer lane.
5. Publish checkpoint closure note after each lane.

## Command Wall

Mandatory (must pass every lane closure):

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Required for governance/risk lanes:

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Required for trace/pilot/demo surfaces when touched:

```bash
pnpm vitest run frontend/apps/os-shell/src/__tests__/trace/
pnpm vitest run frontend/apps/os-shell/src/__tests__/pilot/
```

Required for backend security/policy lane when touched:

```bash
dotnet test
```

## Proof Artifacts (Publish-on-Closure)

Required artifacts per lane:

1. L0 Governance + Checkpoint
- .governance/workflow/progress.md
- .governance/workflow/plan.md

2. L1 Security Closure
- .governance/workflow/SECURITY_DEMO_CLOSURE_2026-03-19.md (new)
- diff evidence for affected security files

3. L2 County Isolation + RBAC
- .governance/workflow/COUNTY_ISOLATION_DEMO_PROOF_2026-03-19.md (new)
- request/response evidence proving scoped behavior

4. L3 Demo Flow Reliability
- .governance/workflow/BENTON_DEMO_GOLDEN_JOURNEYS_2026-03-19.md (new)
- journey pass table with failure-mode screenshots/logs

5. L4 Proof + Evidence bundle
- .governance/workflow/COMMAND_WALL_RESULTS_2026-03-19.md (new)
- raw command outputs with timestamps

6. L5 Contract-Truth
- .governance/workflow/CONTRACT_TRUTH_AUDIT_2026-03-19.md (new)

## Day-by-Day Checkpoints

## Day 0 (Today) - Charter Bootstrap + Truth Sync

Objectives:
1. Freeze demo scope and owner lanes.
2. Reconcile workflow docs to main branch reality.
3. Publish checkpoint entry with hard-stop conditions.

Exit criteria:
1. Charter is published and linked.
2. Progress/plan status no longer conflicts with branch/head truth.
3. L4 baseline command wall run is green.

## Day 1 - Security Critical/High Closure

Objectives:
1. Close hardcoded JWT and anonymous write exposure on demo pathways.
2. Confirm sanitize/validation behavior for demo-exposed surfaces.
3. Record evidence with before/after risk status.

Exit criteria:
1. No open critical demo-path security finding.
2. Command wall green.
3. SECURITY_DEMO_CLOSURE artifact published.

## Day 2 - County Isolation + RBAC Hardening

Objectives:
1. Enforce county ownership checks on demo APIs and UI entry paths.
2. Validate risk policy/allowlist behavior for pilot/demo tools.
3. Capture cross-county denial proof.

Exit criteria:
1. Cross-county access fails as designed.
2. County-scoped success path remains green.
3. COUNTY_ISOLATION_DEMO_PROOF artifact published.

## Day 3 - Benton Golden Journeys (Primary)

Objectives:
1. Execute top 5 assessor journeys on Benton data profile.
2. Validate trace correlation and user-facing fallback behavior.
3. Resolve blocker-grade failures only.

Exit criteria:
1. 5/5 primary journeys pass.
2. No blocker-grade defect open.
3. BENTON_DEMO_GOLDEN_JOURNEYS artifact updated.

## Day 4 - Benton Golden Journeys (Secondary + Recovery)

Objectives:
1. Execute secondary journeys (appeals, dossier evidence, admin workflow).
2. Validate degraded/offline/retry states.
3. Validate operator recovery script.

Exit criteria:
1. Secondary journey pass rate >= 90%.
2. Recovery runbook executed once end-to-end.
3. Remaining defects classified as non-blocking with owner/date.

## Day 5 - Demo Rehearsal + Evidence Lock

Objectives:
1. Full dry run with timed script and role-based operators.
2. Freeze build and evidence set for onsite.
3. Confirm rollback and support escalation routes.

Exit criteria:
1. Rehearsal passes without blocker.
2. COMMAND_WALL_RESULTS and CONTRACT_TRUTH_AUDIT published.
3. Go/No-Go decision recorded in progress checkpoint.

## Day 6 - Onsite Demo Execution

Objectives:
1. Run scripted demo with live audit trail.
2. Capture findings and classify post-demo actions.

Exit criteria:
1. Demo complete with no critical incident.
2. Post-demo findings triaged into bounded slices.
3. Closure checkpoint published.

## Day 7 - Stabilization and Next-Slice Handoff

Objectives:
1. Convert onsite findings into prioritized backlog slices.
2. Re-open only approved lanes with explicit scope.

Exit criteria:
1. Signed handoff packet published.
2. Next charter created with bounded scope and command wall.

## Synchronization Barrier (Run Before Any Write Lane)

All must pass:

1. Mandatory command wall currently green.
2. No unresolved forbidden-scope write request.
3. Lane scope, owner, and proof target declared.
4. Hard-stop trigger list acknowledged.

If any fail -> stop and publish checkpoint note.

## Hard-Stop Triggers

1. Any mandatory command fails.
2. Security regression on demo-critical surface.
3. Cross-county isolation failure.
4. Unauthorized write outside active lane scope.
5. Missing proof artifact for a closed lane.

## Release Packet (Onsite-Ready)

Required contents:

1. Demo build identifier and commit hash.
2. Command wall evidence set.
3. Security closure evidence.
4. County isolation proof.
5. Golden journeys pass matrix.
6. Operator runbook (startup, fallback, rollback).
7. Known limitations and explicit deferred items.

## Acceptance Criteria

1. Lane ownership and scope are explicit and enforced.
2. Command wall executes and passes at every lane closure.
3. Proof artifacts are generated for each day/lane.
4. Day-by-day checkpoints are completed or explicitly failed with hard-stop notes.
5. Go/No-Go is evidence-backed, not narrative-only.
