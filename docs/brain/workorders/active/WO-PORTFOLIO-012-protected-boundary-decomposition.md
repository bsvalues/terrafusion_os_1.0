# WO-PORTFOLIO-012 - Protected Boundary Decomposition

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Portfolio Operator |
| Risk | R1 governance reconciliation |
| Dependency | WO-PORTFOLIO-011 merged at `416942e43cc272e7bbc2ed6c667b2ff6ca2e4278` |
| Result | Remaining lanes decomposed; stale P8 deployment wall removed; one strategic packet recommended |

## Objective

Audit every incomplete or parked program at the boundary reported by WO-PORTFOLIO-011. Name the
exact remaining outcome and missing authority, separate routine engineering from protected action,
and provide one consolidated recommendation instead of a sequence of technical approval requests.

## Authorized Files

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-PORTFOLIO-012-protected-boundary-decomposition.md`
- `docs/brain/workorders/evidence/WO-PORTFOLIO-012-PROTECTED-BOUNDARY-DECOMPOSITION.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/p8-management-dashboard.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Explicitly Blocked

- Docker container start, restart, removal, rebuild, network mutation, prune, or reset
- TerraPilot P16 design or any handler, runtime, backend, metadata, or promotion change
- Sovereign PR #133 modification, rebase, merge, cherry-pick, or import
- Azure, deployment, credentials, county, PACS, SQL, protected-data, or production access
- Product behavior, package, lockfile, CI, workflow, schema, or runtime changes

## Result

The generic `runtime repair/import` and `TerraPilot promotion` labels were too broad. Local OMEN,
sovereign import, P16 design, and L3/L4 promotion are separate boundaries. Live GitHub and repository
history also prove that Management Dashboard MGMT-005 and its MGMT-006 auth-boundary repair already
merged, so MGMT-005 is removed as an outstanding executable deployment wall.

No routine read-only, documentation, test-hardening, or already-authorized implementation Work Order
remains after this reconciliation. The recommended next strategic grant is a bounded read-only
`WO-LOCAL-093` diagnosis envelope. That recommendation does not activate the WO or authorize Docker
mutation.

## Validation

- Parse the Work Order registry JSON.
- Run `git diff --check`.
- Run Work Order query and wave-planner tests.
- Confirm query and planner return no executable protected node.
- Verify PRs #1157 and #1158, sovereign PR #133, and active owner-decision state.
- Confirm no runtime, product, package, CI, deployment, or protected-resource path changed.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-PORTFOLIO-012",
  "task": "Decompose every remaining portfolio boundary and remove stale protected-wall claims",
  "risk": "R1",
  "suite": "Portfolio Operator",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-PORTFOLIO-012-protected-boundary-decomposition.md",
    "docs/brain/workorders/evidence/WO-PORTFOLIO-012-PROTECTED-BOUNDARY-DECOMPOSITION.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "docs/brain/workorders/programs/p8-management-dashboard.md",
    "docs/brain/workorders/programs/portfolio-operator.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json"
  ],
  "forbidden_patterns": [
    ".governance/**",
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "tools/**",
    "packages/**",
    ".github/workflows/**",
    "deployment/**",
    "package.json",
    "**/pnpm-lock.yaml",
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**"
  ],
  "required_proof": [
    "git diff --check",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs",
    "node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "node docs/brain/workorders/tools/wo-wave-plan.mjs --json --authority R3",
    "corepack pnpm brain review-diff --workorder WO-PORTFOLIO-012"
  ]
}
```
