# WO-PORTFOLIO-002 - Current-State Reconciliation

**Program:** `portfolio-operator`
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Base:** `14221dbda0e4a916ef4ea2937b1ca82623ead39b`
**Risk:** `R1`
**Status:** Complete on protected merge

## Objective

Reconcile live portfolio routing after WO-WOE-013 merged, remove stale executable claims, and apply
the canonical portfolio selection algorithm without preselecting deployment or another protected
lane.

## Authorized Scope

- live Work Order queue, program register, command routing, and active playbook status;
- Benton Data Quality and Work Order Engine closeout truth;
- Portfolio Operator current-state evidence and terminal classification.

## Explicit Non-Claims

- This Work Order grants no deployment, production, county, PACS, SQL, secret, runtime, CI, data
  mutation, or successor-program authority.
- It does not close, update, or merge stale unrelated pull requests.
- It does not treat the advisory Work Order registry report as live routing.

## Validation

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- exact governed scope inspection
- no runtime, backend, tools/sync, CI, deployment, county, PACS, SQL, secret, or production changes

STOP_TYPE: `ALL_LANES_PARKED`

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-PORTFOLIO-002",
  "task": "Reconcile the live portfolio after Work Order Engine closeout",
  "risk": "R1",
  "suite": "Portfolio Operator",
  "allowed_files": [
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-PORTFOLIO-002-current-state-reconciliation.md",
    "docs/brain/workorders/evidence/WO-PORTFOLIO-002-CURRENT-STATE-RECONCILIATION.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "docs/brain/workorders/programs/benton-data-quality.md",
    "docs/brain/workorders/programs/portfolio-operator.md",
    "docs/brain/workorders/programs/work-order-engine.md"
  ],
  "forbidden_patterns": [
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "tools/sync/**",
    ".github/workflows/**",
    "package.json",
    "**/pnpm-lock.yaml",
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "corepack pnpm brain review-diff --workorder WO-PORTFOLIO-002",
    "git diff --check"
  ]
}
```
