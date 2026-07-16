# WO-WOE-013 - Program Queue Report

**Program:** `work-order-engine`
**Goal:** `/goal work-order-engine`
**Loop:** `/loop program`
**Base:** `ec0938b2ac3d239a8160e261b84e077a146fad0d`
**Risk:** `R2`
**Status:** Complete on protected merge

## Objective

Provide a deterministic, read-only report over the existing Work Order Engine query result without
adding a product route, mutating registry state, or presenting an advisory registry projection as
live routing authority.

## Authorized Scope

- `docs/brain/workorders/tools/wo-report.mjs`
- `docs/brain/workorders/tools/wo-report.test.mjs`
- `docs/brain/workorders/tools/README.md`
- this active packet and `docs/brain/workorders/evidence/WO-WOE-013-PROGRAM-QUEUE-REPORT.md`
- Work Order Engine program, queue, register, and command-map status updates

## Explicit Non-Claims

- The report does not grant execution or merge authority.
- The registry seed is an advisory projection and is not silently treated as the live queue.
- No frontend route, runtime API, registry migration, scoring change, deployment, protected-resource
  access, or autonomous mutation is included.

## Validation

- `node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-report.test.mjs`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `node docs/brain/workorders/tools/wo-report.mjs`
- `git diff --check`
- exact governed scope inspection

STOP_TYPE: `WOE_013_PROGRAM_QUEUE_REPORT_COMPLETE`

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-WOE-013",
  "task": "Implement the bounded Work Order Engine Program Queue Report",
  "risk": "R2",
  "suite": "Work Order Engine",
  "allowed_files": [
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-WOE-013-program-queue-report.md",
    "docs/brain/workorders/evidence/WO-WOE-013-PROGRAM-QUEUE-REPORT.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/programs/work-order-engine.md",
    "docs/brain/workorders/tools/README.md",
    "docs/brain/workorders/tools/wo-report.mjs",
    "docs/brain/workorders/tools/wo-report.test.mjs"
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
    "node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-report.test.mjs",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "node docs/brain/workorders/tools/wo-report.mjs",
    "corepack pnpm brain review-diff --workorder WO-WOE-013",
    "git diff --check"
  ]
}
```
