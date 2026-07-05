# WO-GOAL-LOOP-MASTER-PLAYBOOK-001 - Active Goal/Loop Execution Playbook

| Field | Value |
|-------|-------|
| Work Order | `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` |
| Mode | Docs/governance/playbook creation and routing |
| Goal | Active goal/loop execution graph |
| Base | `origin/main` at `0ba65618c68c5353834fd9b2a65ba69ae2ee8a72` |
| Runtime code changed | No |
| Backend code changed | No |
| tools/sync code changed | No |

## Objective

Create the full TerraFusion active execution playbook using the `/goal` and `/loop` model so Codex
operates from governed program chains instead of one-off Work Orders.

This packet does not execute Backend OE, Sync, TerraPilot P16, runtime import, OMEN repair, or
Property Workbench work. It creates the operating graph that controls those lanes.

## Files Updated

- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/evidence/WO-GOAL-LOOP-MASTER-PLAYBOOK-001-ACTIVE-GOAL-LOOP-EXECUTION-PLAYBOOK.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`

## Goals Registered

| Goal | Loop | Program slug | Status | Next executable |
|------|------|--------------|--------|-----------------|
| `GOAL-GOAL-LOOP-MASTER-PLAYBOOK` | `LOOP-GOAL-LOOP-MASTER-PLAYBOOK` | `goal-loop-master-playbook` | Active until merged, then governing baseline | `WO-BACKEND-OE-003` after merge |
| `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` | `backend-operational-excellence` | Active | `WO-BACKEND-OE-003` |
| `GOAL-SYNC-WORKBOOK-TOOLING` | `LOOP-SYNC-WORKBOOK-TOOLING` | `sovereign-sync-workbook-tooling` | Owner-selection gated | `WO-SYNC-132` after owner selection |
| `GOAL-TERRAPILOT-TOOL-MATURITY` | `LOOP-TERRAPILOT-TOOL-MATURITY` | `terrapilot-tool-maturity` | Parked | P16 design-only if authorized |
| `GOAL-DEVEX-HOOK-BOOTSTRAP` | `LOOP-DEVEX-HOOK-BOOTSTRAP` | `devex-hook-tooling` | Follow-up / not active | `WO-DEVEX-HOOKS-001` if authorized |
| `GOAL-LOCAL-OMEN-RUNTIME-REPAIR` | `LOOP-LOCAL-OMEN-RUNTIME-REPAIR` | `local-omen-runtime-repair` | Blocked | `WO-LOCAL-093` if authorized |
| `GOAL-RUNTIME-IMPORT-DISPOSITION` | `LOOP-RUNTIME-IMPORT-DISPOSITION` | `runtime-import-disposition` | Owner-gated | `WO-CORE-1` |
| `GOAL-PROPERTY-WORKBENCH` | `LOOP-PROPERTY-WORKBENCH` | `property-workbench` | Future lane | `WO-WORKBENCH-001` if selected |

## Command Routing Added Or Confirmed

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

## Execution Law Recorded

Codex is the operator. The owner is the authority wall, not the dispatcher for every next Work Order.
Inside an active `/goal` plus `/loop`, Codex may create worktrees, execute scoped WOs, validate,
commit, push, open PRs, resolve in-scope review comments, update from `origin/main`, merge clean PRs,
verify `origin/main`, and continue to the next defined WO when no stop gate is hit.

Codex may continue automatically from one Work Order to the next only when:

- the current WO is merged to `origin/main`,
- remote checks are green or explicitly acceptable,
- review threads are resolved,
- the next WO is defined in the same active `/goal` and `/loop`,
- risk does not increase,
- scope remains authorized,
- no runtime/backend implementation, secrets, county/PACS/live resources, migrations, deployment, or
  local hook bypass is required.

Codex must stop for owner decision on local hook bypass, out-of-scope review files, runtime/backend
changes, gate changes, CI/release wiring, Docker/Testcontainers repair, migrations, protected data,
TerraPilot live promotion, runtime import, Property Workbench product behavior changes, or unsafe
worktree state.

Local hook failures are authority walls, not new Work Orders. After a hook bypass is authorized and
the current WO merges, Codex returns to the active `/goal` plus `/loop` chain automatically.

## Output Format

The playbook records the standard result block for completed WOs and authority walls so Codex
returns evidence batches instead of one-off "what next" prompts.

## Next Executable

| Field | Value |
|-------|-------|
| Next goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Next loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Next WO | `WO-BACKEND-OE-003` |

## Validation

Required validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Inspect active playbook includes all active/parked programs.
- Inspect program register includes goal/loop routing.
- Inspect command map routes required commands.
- Confirm no runtime/backend/tools-sync implementation paths changed.

## Stop Type

`GOAL_LOOP_MASTER_PLAYBOOK_CREATED_READY_FOR_CHAIN_EXECUTION`
