# TerraFusion Active Goal/Loop Execution Playbook

**Work Order:** `WO-GOAL-LOOP-MASTER-PLAYBOOK-001`
**Status:** Active execution graph
**Authority:** TerraFusion Brain / Work Order Operator
**Last Updated:** 2026-07-05
**Base:** `origin/main` at `0ba65618c68c5353834fd9b2a65ba69ae2ee8a72` or later

---

## Purpose

This playbook is the active execution graph for TerraFusion work.

Codex must not ask for one-off Work Orders when the next Work Order is already defined in an
active `/goal` plus `/loop` chain.

- A Work Order is the execution packet.
- A Goal is the program objective.
- A Loop is the governed continuation mechanism.
- The Program Playbook is the source of next-work truth.

---

## Operator Authority Model

Codex is the operator. The human owner is the authority wall, not the dispatcher for every next Work
Order.

Inside an active `/goal` plus `/loop`, Codex may do the following without returning to the owner when
no stop gate is hit:

1. Create a clean dedicated worktree.
2. Execute the next defined Work Order in the active program chain.
3. Create or update docs/evidence/governance files authorized by that Work Order.
4. Run approved validation commands.
5. Commit scoped changes.
6. Push the branch.
7. Open a PR.
8. Resolve review comments inside the authorized scope.
9. Update from `origin/main` if behind.
10. Prepare the PR for owner merge authorization when checks are green/acceptable, review threads are
    resolved, changed files remain in authorized scope, and no global stop gate is hit.
11. Merge only when the owner has explicitly authorized that merge under the active Work Order.
12. Verify `origin/main` after merge.
13. Continue to the next Work Order in the same `/goal` plus `/loop` if allowed.

Codex must return to the owner only for true authority walls.

---

## Global Execution Law

Codex may continue automatically from one Work Order to the next only when all are true:

1. The current Work Order is merged to `origin/main`.
2. Remote checks are green or explicitly acceptable.
3. Review threads are resolved.
4. The next Work Order is already defined in this playbook.
5. The next Work Order is in the same `/goal` and `/loop`.
6. The next Work Order is same or lower risk.
7. The next Work Order stays inside the authorized file scope.
8. No backend/runtime implementation is required unless that program explicitly authorizes implementation.
9. No secrets, county data, PACS, county SQL, production resources, migrations, deployment, or live
   services are implicated.
10. No local hook bypass is required.

Codex must stop for owner decision when any are true:

1. A local hook bypass is required.
2. A review thread requires files outside the current authorized scope.
3. Backend/runtime code change is required.
4. `tools/sync` runtime implementation is required outside the selected Sync chain.
5. Gate modification is required.
6. CI/release wiring is required.
7. Docker/Testcontainers repair is required.
8. Migration/schema change is required.
9. Secrets, county data, PACS, county SQL, live services, or production resources are implicated.
10. TerraPilot promotion or live integration is proposed.
11. Sovereign runtime import is proposed.
12. Property Workbench product behavior change is proposed.
13. Worktree is dirty, unsafe, timed out, locked, or incomplete.

Local hook failures are authority walls, not new Work Orders. After a hook bypass is authorized and
the current WO merges, Codex returns to the active `/goal` plus `/loop` chain automatically.

---

## Program 0 - Master Playbook Governance

| Field | Value |
|-------|-------|
| Goal | `GOAL-GOAL-LOOP-MASTER-PLAYBOOK` |
| Loop | `LOOP-GOAL-LOOP-MASTER-PLAYBOOK` |
| Program slug | `goal-loop-master-playbook` |
| Status | ACTIVE UNTIL MERGED, THEN GOVERNING BASELINE |
| Current WO | `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` |

### Purpose

Create and keep current the active TerraFusion `/goal` plus `/loop` execution graph.

### Current State

- `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` created the active Goal/Loop execution playbook.
- If this work order is not yet merged, finish it through PR using docs/governance-only scope.
- After merge, this playbook governs continuation.

### Authorized Files

- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/evidence/WO-GOAL-LOOP-MASTER-PLAYBOOK-001-ACTIVE-GOAL-LOOP-EXECUTION-PLAYBOOK.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`

### Validation

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Inspect goal/loop register.
- Inspect command map.
- Confirm no runtime/backend/tools-sync implementation changed.

### Stop Type

`GOAL_LOOP_MASTER_PLAYBOOK_CREATED_READY_FOR_CHAIN_EXECUTION`

Routing note:

- `wo-query` currently reports an older LocalOps/Work Order Engine recommendation. Until the registry
  backing `wo-query` is refreshed, this mismatch is a routing reconciliation gate, not authority to
  run both lanes.
- Backend Operational Excellence has since run through `WO-BACKEND-OE-013` and is closed. Do not
  route back to `WO-BACKEND-OE-003`; the next lane now requires owner/WOE selection from the
  remaining parked or follow-up programs.

---

## Program 0A - Codex Operator Work Order Playbook

| Field | Value |
|-------|-------|
| Goal | `GOAL-TF-CODEX-OPERATOR-WO-PLAYBOOK-001` |
| Loop | `LOOP-TF-CODEX-OPERATOR-WO-PLAYBOOK-001` |
| Program slug | `codex-operator-playbook` |
| Status | ACTIVE UNTIL MERGED, THEN GOVERNING OPERATOR DOCTRINE |
| Current WO | `WO-CODEX-OP-001` through `WO-CODEX-OP-009` |

### Purpose

Make Codex the primary TerraFusion Work Order operator so the owner is no longer the courier between
agents, PRs, reviews, checks, and merge readiness.

### Deliverables

- `docs/brain/workorders/operator/CODEX_OPERATOR_PLAYBOOK.md`
- `docs/brain/workorders/goal-loop/GOAL_LOOP_OPERATOR_CONTRACT.md`
- `docs/brain/workorders/operator/WORK_ORDER_LIFECYCLE.md`
- `docs/brain/workorders/operator/AUTONOMOUS_CONTINUATION_RULES.md`
- `docs/brain/workorders/operator/PR_REVIEW_CI_OPERATOR_RULES.md`
- `docs/brain/workorders/operator/OWNER_DECISION_PACKET_TEMPLATE.md`
- `docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md`
- `docs/brain/workorders/evidence/WO-CODEX-OPERATOR-PLAYBOOK-ROLLUP.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/operator/README.md`

### Stop Type

`CODEX_OPERATOR_PLAYBOOK_ROLLUP_READY_FOR_PR`

---

## Program 1 - Backend Operational Excellence

| Field | Value |
|-------|-------|
| Goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Program slug | `backend-operational-excellence` |
| Status | CLOSED |
| Next executable WO | None - program closed; owner/WOE selects next lane |

### Current State

Backend foundation is implemented and slice-verified. The canonical backend build is green with zero
warnings. Backend OE is closed as an evidence-backed operational baseline, not as production-ready
runtime certification. Remaining work is deferred into follow-up lanes such as release-gate
automation, DevEx hook bootstrap, county runtime proof, or future product-lane execution.

### Completed Work Orders

- `WO-BACKEND-000` - Program opened and playbook registered.
- `WO-BACKEND-OE-001` - Backend Operational Excellence Baseline.
- `WO-BACKEND-OE-001-S` - Baseline Worktree Residue Classification.
- `WO-BACKEND-OE-002` - Backend Build Warning Register.
- `WO-BACKEND-OE-PLAYBOOK-REFRESH` - Full Backend OE chain.
- `WO-MASTER-PLAYBOOK-001` / `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` - Master active program playbook.
- `WO-BACKEND-OE-003` through `WO-BACKEND-OE-013` - Backend OE evidence, gates, runbook,
  diagnostics, operational packet, and closeout.

### Current Facts

- `dotnet build backend/TerraFusion.sln` passed with 0 warnings and 0 errors.
- Unit tests passed.
- Full solution test pass is blocked by Docker/Testcontainers SQL Server environment dependencies.
- Dais persistence exists.
- ServiceRegistry exists.
- Health/readiness endpoints exist but semantics are not release-proven.
- Security/auth/county/audit proof exists but is not consolidated into a release-grade matrix.
- DevEx hook tooling failures are separate from Backend OE.

### Backend OE Work Order Chain

| WO | Mode | Purpose | Stop Type |
|----|------|---------|-----------|
| `WO-BACKEND-OE-003` | Docs/evidence/register only | Classify the Docker/Testcontainers SQL Server dependency blocking the full solution test pass. | `BACKEND_INTEGRATION_DEPENDENCY_REGISTER_READY_FOR_PR` |
| `WO-BACKEND-OE-004` | Evidence + endpoint contract proof | Define what `/healthz`, `/healthz/ready`, `/health/codex369`, `/api/transcendence/health`, and Levy `/health` actually prove. | `BACKEND_HEALTH_READINESS_SEMANTICS_PROVEN` |
| `WO-BACKEND-OE-005` | Evidence + targeted validation | Move ServiceRegistry from source-wired to runtime-understood. | `BACKEND_SERVICE_REGISTRY_RUNTIME_VALIDATED` |
| `WO-BACKEND-OE-006` | Evidence matrix first | Consolidate auth, authorization, county isolation, audit, and security proof into one release-grade matrix. | `BACKEND_SECURITY_PROOF_MATRIX_READY` |
| `WO-BACKEND-OE-007` | Evidence/register first | Inventory backend migrations and classify rollback/readiness evidence. | `BACKEND_MIGRATION_ROLLBACK_REGISTER_READY` |
| `WO-BACKEND-OE-008` | Test-plan/evidence first | Define the next Dais proof gaps without rebuilding persistence. | `BACKEND_DAIS_E2E_PROOF_PLAN_READY` |
| `WO-BACKEND-OE-009` | Governance/release checklist | Define objective backend release-readiness criteria. | `BACKEND_RELEASE_GATE_DEFINED` |
| `WO-BACKEND-OE-010` | Runbook creation | Create backend validation, triage, rollback, and evidence runbook. | `BACKEND_OPERATIONAL_RUNBOOK_READY` |
| `WO-BACKEND-OE-011` | Evidence/docs | Map backend diagnostics and operational signals. | `BACKEND_DIAGNOSTICS_OBSERVABILITY_MAPPED` |
| `WO-BACKEND-OE-012` | Operational packet assembly | Assemble the Backend Operational Excellence packet. | `BACKEND_OPERATIONAL_PACKET_READY` |
| `WO-BACKEND-OE-013` | Evidence rollup | Close Backend OE with proof, deferred items, and next-lane recommendation. | `BACKEND_OPERATIONAL_EXCELLENCE_PROGRAM_CLOSED` |

### Continuation Rule

Backend OE does not continue automatically after `WO-BACKEND-OE-013`. Any new backend work must be a
new owner/WOE-selected lane, especially if it requires release-gate automation, implementation,
Docker/Testcontainers repair, CI wiring, migrations, deployment, secrets, county/PACS/live resources,
or local hook tooling repair.

---

## Program 2 - Sovereign Sync Workbook Tooling

| Field | Value |
|-------|-------|
| Goal | `GOAL-SYNC-WORKBOOK-TOOLING` |
| Loop | `LOOP-SYNC-WORKBOOK-TOOLING` |
| Program slug | `sovereign-sync-workbook-tooling` |
| Status | ACTIVE / OWNER-SELECTION GATED |
| Repo | `bsvalues/terrafusion-os` |
| Next executable after owner selection | `WO-SYNC-132` |

### Completed Work Orders

- `WO-SYNC-057` - `tools/sync` boundary selected.
- `WO-SYNC-058` - Gate 14 enforcement created before implementation.
- `WO-SYNC-130` - C1 Workbook Admission Validator.
- `WO-SYNC-131` - C2 Column-Terminalization Checker.

### Current Tool Stack

1. `workbook-contract-check` - validates shape/schema.
2. `workbook-admission-check` - validates artifact class/admissibility.
3. `workbook-terminalization-check` - validates terminal completeness and Hard Guard #3 consistency.

### Sync Workbook Tooling Chain

| WO | Type | Purpose | Stop Type |
|----|------|---------|-----------|
| `WO-SYNC-132` | Built-fresh runtime tool | Determine whether an admitted and terminalized workbook is lock-eligible. | `SYNC_C3_LOCK_READINESS_CHECKER_MERGED` |
| `WO-SYNC-133` | Built-fresh runtime tool | Run contract, admission, terminalization, and lock-readiness checks and report lifecycle state. | `SYNC_WORKBOOK_LIFECYCLE_CHECKER_MERGED` |
| `WO-SYNC-134` | Design/policy gate only | Decide safe edit CLI behavior before mutation tooling exists. | `SYNC_WORKBOOK_EDIT_CLI_DESIGN_DECISION_READY` |
| `WO-SYNC-135` | Built-fresh runtime tool | Create a synthetic-only edit CLI if `WO-SYNC-134` explicitly authorizes implementation. | `SYNC_SYNTHETIC_WORKBOOK_EDIT_CLI_MERGED` |
| `WO-SYNC-136` | Design/safety architecture | Design a Gate-14-safe external artifact content scanner. | `SYNC_EXTERNAL_ARTIFACT_SCAN_DESIGN_DECISION_READY` |
| `WO-SYNC-137` | Built-fresh implementation only if authorized | Implement external artifact content scanning using the safe design. | `SYNC_EXTERNAL_ARTIFACT_CONTENT_SCAN_MERGED` |
| `WO-SYNC-138` | Built-fresh runtime tool | Generate a synthetic evidence bundle summarizing workbook validation state. | `SYNC_WORKBOOK_EVIDENCE_BUNDLE_MERGED` |
| `WO-SYNC-139` | Runbook/operator documentation | Create operator runbook for the built-fresh workbook toolchain. | `SYNC_WORKBOOK_OPERATOR_RUNBOOK_MERGED` |
| `WO-SYNC-140` | Governance/release checklist | Define what must pass before workbook tooling is release-ready for broader operator use. | `SYNC_WORKBOOK_TOOLING_RELEASE_GATE_DEFINED` |
| `WO-SYNC-141` | Evidence rollup/program closeout | Summarize workbook tooling lane evidence, limitations, and next Sync lane. | `SYNC_WORKBOOK_TOOLING_ROLLUP_COMPLETE` |

### Stop Gates

Sync remains owner-selection gated. Do not start `WO-SYNC-132` unless the owner selects Sync. Stop on
Gate 14 changes, forbidden content scan shape, live data, county/PACS/SQL access, or implementation
outside the selected Sync chain.

### Sync Hard Rules

- Every `tools/sync` file must satisfy Gate 14.
- Built-fresh header required.
- No archive import.
- No PACS/county SQL/county data/live connection.
- No backend/frontend/os-platform references.
- No package/build/CI/runtime entrypoint.
- No scheduler/daemon/service wiring.
- No weakening Gate 14.

### Sync Continuation Rule

Do not auto-start Sync while Backend OE is the selected active program. If the owner selects Sync,
continue within the Sync chain only while each next WO is defined and no global stop gate is hit.

---

## Program 3 - TerraPilot Tool Maturity

| Field | Value |
|-------|-------|
| Goal | `GOAL-TERRAPILOT-TOOL-MATURITY` |
| Loop | `LOOP-TERRAPILOT-TOOL-MATURITY` |
| Program slug | `terrapilot-tool-maturity` |
| Status | PARKED |
| Next | None unless owner authorizes P16 design-only |

### Current State

TerraPilot is parked at P15. P16 is not started and remains blocked unless explicitly authorized as
design-only.

### Locked Truth

- `summarize_levy_rate_components` is contract-covered only.
- `liveIntegration`: false.
- `backendIntegrated`: false.
- live: no.
- promoted: no.
- metadata mutation after P13: no.
- runtime/backend/handler changes: no.

Stop type: `TERRAPILOT_P15_PARKED`

---

## Program 4 - DevEx Hook Tooling

| Field | Value |
|-------|-------|
| Goal | `GOAL-DEVEX-HOOK-BOOTSTRAP` |
| Loop | `LOOP-DEVEX-HOOK-BOOTSTRAP` |
| Program slug | `devex-hook-tooling` |
| Status | FOLLOW-UP / NOT ACTIVE |
| Candidate WO | `WO-DEVEX-HOOKS-001` |

### Problem

Local hooks repeatedly fail because Prettier and Vitest are unavailable in the local tooling context.

Rule: Do not mix this into Backend OE, Sync, TerraPilot, or runtime work.

---

## Program 5 - Local OMEN Runtime Repair

| Field | Value |
|-------|-------|
| Goal | `GOAL-LOCAL-OMEN-RUNTIME-REPAIR` |
| Loop | `LOOP-LOCAL-OMEN-RUNTIME-REPAIR` |
| Program slug | `local-omen-runtime-repair` |
| Status | BLOCKED AT RUNTIME REPAIR GATE |
| Next | `WO-LOCAL-093` |

### Current Facts

- Docker Desktop recovered.
- `williamos-postgres-proof` exists on `127.0.0.1:15432` but is unhealthy.
- App proof container is missing.
- Ports `3100` / `3101` are clear.
- TerraFusion Postgres is untouched.
- Manual proof is incomplete.

Rule: Diagnosis first. No app integration, persistence, LAN exposure, service/schedule, or Docker
destructive cleanup unless separately authorized.

---

## Program 6 - Runtime Import Disposition

| Field | Value |
|-------|-------|
| Goal | `GOAL-RUNTIME-IMPORT-DISPOSITION` |
| Loop | `LOOP-RUNTIME-IMPORT-DISPOSITION` |
| Program slug | `runtime-import-disposition` |
| Status | OWNER-GATED |
| Next | `WO-CORE-1` |

Rule: No `backend/`, `frontend/`, or `os-platform/` import into the sovereign repo without explicit
Work Order, provenance, and validation gates.

Possible outcomes:

- no import,
- promote specific contract only,
- promote specific built-fresh scaffold,
- mine archive for pattern only,
- authorize narrowly scoped runtime import later.

---

## Program 7 - Property Workbench

| Field | Value |
|-------|-------|
| Goal | `GOAL-PROPERTY-WORKBENCH` |
| Loop | `LOOP-PROPERTY-WORKBENCH` |
| Program slug | `property-workbench` |
| Status | CLOSED / EVIDENCE BASELINE COMPLETE |
| Next if selected | No restart; owner must authorize a new Workbench phase |

Rule: Do not restart the closed Workbench evidence chain. Any future Workbench work must be a new
phase selected by owner/WOE, not a rerun of `WO-WORKBENCH-001`.

Closed evidence chain:

- `WO-WORKBENCH-001` - Workbench Reality Audit.
- `WO-WORKBENCH-002` - Routing and Deep-Link Gate Audit.
- `WO-WORKBENCH-003` - Tab Capability Classification.
- `WO-WORKBENCH-004` - Forge Surface Completion Plan.
- `WO-WORKBENCH-005` - Atlas Surface Completion Plan.
- `WO-WORKBENCH-006` - Dais Surface Completion Plan.
- `WO-WORKBENCH-007` - Dossier Surface Completion Plan.
- `WO-WORKBENCH-008` - Pilot Integration Boundary.
- `WO-WORKBENCH-009` - End-to-End Parcel Flow Proof.
- `WO-WORKBENCH-010` - Workbench Operational Packet.
- `WO-WORKBENCH-011` - Evidence Rollup.

---

## Command Concepts

The command map must expose these operator commands:

- `/program-status`
- `/program-next`
- `/program-stop`
- `/backend-start`
- `/backend-status`
- `/backend-next`
- `/backend-stop`
- `/sync-status`
- `/sync-next`
- `/sync-stop`
- `/terrapilot-status`
- `/terrapilot-stop`
- `/devex-hooks-status`
- `/local-omen-status`
- `/core-import-status`
- `/workbench-status`

---

## Output Format

After each Work Order, return:

```text
RESULT:
WORK_ORDER:
PROGRAM:
GOAL:
LOOP:
FILES_CHANGED:
RUNTIME_CODE_CHANGED:
BACKEND_CODE_CHANGED:
TOOLS_SYNC_CODE_CHANGED:
VALIDATION:
PR_NUMBER:
PR_URL:
MERGE_COMMIT:
ORIGIN_MAIN_HEAD:
REVIEW_THREADS:
NEXT_EXECUTABLE_GOAL:
NEXT_EXECUTABLE_LOOP:
NEXT_EXECUTABLE_WO:
STOP_TYPE:
```

If blocked by an authority wall, return:

```text
RESULT: BLOCKED_OWNER_DECISION
WORK_ORDER:
PROGRAM:
GOAL:
LOOP:
STOP_TYPE:
BLOCKER:
CURRENT_STATE:
AUTHORIZED_OPTIONS:
RECOMMENDED_OPTION:
```
