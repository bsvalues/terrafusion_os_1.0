# WO-LOCAL-096 - OMEN Proof Container Recovery and Data-Preserving Reconstitution

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Local OMEN Runtime Repair |
| Goal | `GOAL-LOCAL-OMEN-RUNTIME-REPAIR` |
| Loop | `LOOP-LOCAL-OMEN-RUNTIME-REPAIR` |
| Risk | R3 bounded local-runtime mutation envelope |
| Base | `e5082f7b981ce4f5d5ee06d0fa7041af9d2ecc9d` |
| Result | `FOLLOW_ON_PROTECTED_BOUNDARY` |

## Objective

Recreate only the named OMEN Postgres and application proof containers against preserved Docker
state after proving the exact images, volume, network, ports, commands, and non-destructive startup
contract.

## Authorized Files

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-LOCAL-096-omen-proof-container-recovery.md`
- `docs/brain/workorders/evidence/WO-LOCAL-096-OMEN-PROOF-CONTAINER-RECOVERY.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Result

Preflight positively identified the preserved Postgres volume, existing Docker network, localhost
ports, Compose service, application start script, and environment-variable names without exposing
values. Neither required image exists locally: `postgres:16-bookworm` and
`williamos-app-proof:omen` both fail exact image inspection, and no dangling image matches either
artifact.

The authorization prohibits pulls, builds, and container recreation when an existing local image
cannot be verified. No container was therefore created or started, and the preserved volume was not
mounted or mutated.

## Validation

- Docker Engine healthy against the recovered historical data store.
- Target container-name collision checks passed: both names absent.
- Preserved volume identity, Compose labels, and 47.66 MB allocation recorded.
- Existing network identity and topology recorded.
- Ports `15432`, `3100`, and `3101` confirmed clear.
- Required local image inspection failed closed for both exact tags.
- Environment key names recorded; values not emitted or disclosed.
- `git diff --check`.
- Work Order query and wave-planner tests and JSON output.
- Required core gates.
- No container, image, volume, network, database, credential, package, CI, deployment, county, PACS,
  SQL, external-resource, or production mutation.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCAL-096",
  "task": "Recreate the named OMEN proof containers only after exact local images and preserved topology pass the mandatory preflight",
  "risk": "R3",
  "suite": "LocalOps",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-LOCAL-096-omen-proof-container-recovery.md",
    "docs/brain/workorders/evidence/WO-LOCAL-096-OMEN-PROOF-CONTAINER-RECOVERY.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
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
    "corepack pnpm brain review-diff --workorder WO-LOCAL-096",
    "corepack pnpm run type-check",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
