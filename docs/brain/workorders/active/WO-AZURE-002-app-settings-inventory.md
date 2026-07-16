# WO-AZURE-002 - App Settings and Secret Inventory

**Program:** `azure-county-runtime`

**Goal:** `/goal azure-county-runtime`

**Loop:** `/loop evidence`

**Base:** `09f3cb847a503f23b9e64f479c09b9d53cdd04aa`

**Risk:** R1 documentation and committed-evidence reconciliation

**Status:** Complete - PR #1293 merged at `5f7ffb764daf20c341ab415e47fd3228b66ab5cd`

## Objective

Inventory the Benton demo App Service configuration by key name, source class, current storage
posture, and accountable owner. Use committed evidence only. Do not inspect live Azure state, read
secret values, or change any application, resource, configuration, deployment, database, or county
boundary.

## Allowed Actions

- Read committed source and deployment evidence.
- Record configuration key names without values.
- Classify each key as non-secret, secret-bearing, optional, deferred, or protected.
- Record current evidence, intended storage posture, ownership, and unresolved proof gaps.
- Advance the safe documentation lane to WO-AZURE-003 after protected merge.

## Forbidden Actions

- Azure CLI, portal, API, App Service, Key Vault, managed-identity, resource, slot, or configuration
  inspection or mutation.
- Secret values, connection-string values, tokens, certificates, credentials, or copied secret
  material.
- Database connection, query, migration, schema change, PACS access, or county-data access.
- Runtime, backend, frontend, package, lockfile, CI, workflow, or deployment behavior changes.
- Secret rotation, credential replacement, resource provisioning, or county-production claims.

## Reserved Files

- `docs/brain/workorders/active/WO-AZURE-002-app-settings-inventory.md`
- `docs/brain/workorders/active/WO-AZURE-001-app-service-preflight.md`
- `docs/data/WO_AZURE_002_APP_SETTINGS_SECRET_INVENTORY.md`
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
- Complete required-key inventory derived from committed evidence.
- Secret-bearing key register with no values.
- Current versus intended storage posture.
- Ownership and unresolved county-production ownership boundaries.
- Explicit no-live-query, no-secret-access, and no-mutation statement.
- Existing follow-on routing to WO-AZURE-003.
- `git diff --check` and Markdown formatting.
- Work-order query and root governance gates.

## Completion

The evidence packet exists, every required key has a source class, storage posture, owner, and
evidence state, known gaps remain explicit, and the diff stays inside the reserved documentation
files. Completion does not authorize secret access, storage repair, Azure mutation, deployment, or
county production.

`STOP_TYPE: AZURE_APP_SETTINGS_SECRET_INVENTORY_COMPLETE`

<!-- brain-machine-policy: brain review-diff reads the json block below -->

```json
{
  "id": "WO-AZURE-002",
  "task": "Inventory Benton demo app-setting and secret names, source classes, storage posture, and ownership from committed evidence",
  "risk": "R1",
  "suite": "OS",
  "allowed_files": [
    "docs/brain/workorders/active/WO-AZURE-002-app-settings-inventory.md",
    "docs/brain/workorders/active/WO-AZURE-001-app-service-preflight.md",
    "docs/data/WO_AZURE_002_APP_SETTINGS_SECRET_INVENTORY.md",
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
    "corepack pnpm exec prettier --check docs/brain/workorders/active/WO-AZURE-002-app-settings-inventory.md docs/brain/workorders/active/WO-AZURE-001-app-service-preflight.md docs/data/WO_AZURE_002_APP_SETTINGS_SECRET_INVENTORY.md docs/brain/workorders/programs/azure-county-runtime.md docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md docs/brain/workorders/goal-loop/GOAL_COMMANDS.md docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "git diff --check",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "corepack pnpm run type-check",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
