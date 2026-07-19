# WO-LOCAL-095 - Historical Docker Data Volume Recovery and Verified Remount

| Field | Value |
| --- | --- |
| Status | SUPERSEDED - `OUT_OF_SCOPE_CROSS_PROJECT` |
| TerraFusion capability | `NO_TERRAFUSION_CAPABILITY_DELIVERED` |
| Program | Cross-Project Historical Audit (WilliamOS/TerraGroq) |
| Goal | None in TerraFusion |
| Loop | None in TerraFusion |
| Risk | R3 bounded local-runtime recovery envelope |
| Base | `4d77e0717b10c3178a1c59e811cf1cf25cb6116f` |
| Result | `OUT_OF_SCOPE_CROSS_PROJECT` |

> Historical audit only. The recovered Docker/OMEN surfaces belong to the separate
> WilliamOS/TerraGroq project. This packet grants no TerraFusion execution or successor authority.

> Every objective, file scope, result, successor, and authorization below is historical and
> withdrawn. It is not routable and cannot be used as a current Brain machine policy.

## Historical Objective (Not Authorized)

Verify the reconnected historical Docker data volume by exact identity, recover Docker Desktop once
against the preserved data store, and re-observe the named OMEN proof surfaces without recreating
containers, images, volumes, networks, or credentials.

## Historical File Scope (Withdrawn)

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-LOCAL-095-historical-volume-recovery.md`
- `docs/brain/workorders/evidence/WO-LOCAL-095-HISTORICAL-VOLUME-RECOVERY.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Historical Result

The historical volume returned at `E:` with the exact recorded volume GUID and preserved Docker data
VHDX. Docker Desktop's automatic startup raced volume attachment and failed. The authorized bounded
recovery stopped only the failed Docker/WSL engine processes, shut WSL down, and started Docker
Desktop once. The engine then reached `running` against the preserved store.

Existing images, volumes, networks, and the runtime-operator container survived. The named OMEN
Postgres and application proof containers are absent, ports `15432`, `3100`, and `3101` are clear,
and the expected application image is absent. Recreating or rebuilding those proof surfaces is a new
runtime mutation and was not performed.

## Validation

- Exact historical volume GUID and unchanged junction target verified.
- Docker data VHDX presence and byte size recorded before engine recovery.
- Docker Engine version and information queries passed after one clean recovery.
- Existing container, image, volume, network, and port state inspected without secret values.
- `git diff --check`.
- Work Order query and wave-planner tests and JSON output.
- No container/image/volume/network recreation, removal, pull, build, configuration, database,
  product, package, CI, deployment, county, PACS, SQL, secret, or production mutation.

<!-- withdrawn historical policy: deliberately not machine-readable by brain review-diff -->
```historical-json
{
  "id": "WO-LOCAL-095",
  "task": "Verify and recover Docker against the reconnected historical data volume, then re-observe OMEN proof state without container recreation",
  "risk": "R3",
  "suite": "LocalOps",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-LOCAL-095-historical-volume-recovery.md",
    "docs/brain/workorders/evidence/WO-LOCAL-095-HISTORICAL-VOLUME-RECOVERY.md",
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
    "corepack pnpm brain review-diff --workorder WO-LOCAL-095",
    "corepack pnpm run type-check",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
