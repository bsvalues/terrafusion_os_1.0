# WO-AZURE-003 - Deployment Slot Strategy

**Program:** `azure-county-runtime`

**Goal:** `/goal azure-county-runtime`

**Loop:** `/loop evidence`

**Base:** `5f7ffb764daf20c341ab415e47fd3228b66ab5cd`

**Risk:** R1 documentation and committed-evidence reconciliation

**Status:** Complete on protected merge

## Objective

Define the deployment-slot strategy for the Benton demonstration App Service from committed evidence.
Select the promotion model, slot roles, configuration classes, validation gates, rollback posture, and
authority boundaries without inspecting or changing Azure.

## Allowed Actions

- Read committed preflight, deployment, configuration, health, and rollback evidence.
- Define a future non-production staging-slot contract.
- Classify configuration as environment-bound, release-bound, or shared.
- Define smoke, promotion, rollback, and evidence gates.
- Record that no staging-slot existence or behavior is currently proven.
- Route the program back to portfolio reconciliation after this safe documentation slice.

## Forbidden Actions

- Azure CLI, portal, API, App Service, deployment-slot, Key Vault, managed-identity, resource, or
  configuration inspection or mutation.
- Slot creation, configuration, deployment, traffic routing, swap, restart, rollback, or deletion.
- Secret values, connection-string values, tokens, certificates, credentials, or copied secret
  material.
- Database connection, query, migration, schema change, PACS access, or county-data access.
- Runtime, backend, frontend, package, lockfile, CI, workflow, or deployment behavior changes.
- County-production claims or production authorization.

## Reserved Files

- `docs/brain/workorders/active/WO-AZURE-003-deployment-slot-strategy.md`
- `docs/brain/workorders/active/WO-AZURE-002-app-settings-inventory.md`
- `docs/data/WO_AZURE_003_DEPLOYMENT_SLOT_STRATEGY.md`
- `docs/brain/workorders/programs/azure-county-runtime.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`

No live resource, environment, contract, runtime, migration, deployment target, or secret is
reserved.

## Required Evidence

- Exact base SHA.
- Current slot truth and explicit non-claims.
- Blue/green versus rolling decision and rationale.
- Slot-role and configuration-class contract.
- Pre-swap, swap, rollback, and evidence gates.
- Explicit separation of Benton demo from county production.
- Existing follow-on live-smoke walls and portfolio routing.
- `git diff --check`, Markdown formatting, work-order query, and root governance gates.

## Completion

The slot strategy is explicit and evidence-backed, no live slot is claimed or touched, and the diff
stays inside the reserved documentation files. Completion enables a separately authorized
`WO-DEPLOY-BENTON-003D` non-production smoke packet; it does not authorize deployment or swap.

`STOP_TYPE: AZURE_DEPLOYMENT_SLOT_STRATEGY_COMPLETE`

<!-- brain-machine-policy: brain review-diff reads the json block below -->

```json
{
  "id": "WO-AZURE-003",
  "task": "Define the Benton demo deployment-slot strategy from committed evidence without Azure access or mutation",
  "risk": "R1",
  "suite": "OS",
  "allowed_files": [
    "docs/brain/workorders/active/WO-AZURE-003-deployment-slot-strategy.md",
    "docs/brain/workorders/active/WO-AZURE-002-app-settings-inventory.md",
    "docs/data/WO_AZURE_003_DEPLOYMENT_SLOT_STRATEGY.md",
    "docs/brain/workorders/programs/azure-county-runtime.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md"
  ],
  "forbidden_patterns": [
    ".github/workflows/**",
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "package.json",
    "pnpm-lock.yaml"
  ],
  "required_proof": [
    "corepack pnpm exec prettier --check docs/brain/workorders/active/WO-AZURE-003-deployment-slot-strategy.md docs/brain/workorders/active/WO-AZURE-002-app-settings-inventory.md docs/data/WO_AZURE_003_DEPLOYMENT_SLOT_STRATEGY.md docs/brain/workorders/programs/azure-county-runtime.md docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md docs/brain/workorders/goal-loop/GOAL_COMMANDS.md docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "git diff --check",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "corepack pnpm run type-check",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
