# WO-LOCAL-093 - Bounded Read-Only Local OMEN Diagnosis

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Local OMEN Runtime Repair |
| Goal | `GOAL-LOCAL-OMEN-RUNTIME-REPAIR` |
| Loop | `LOOP-LOCAL-OMEN-RUNTIME-REPAIR` |
| Risk | R2 local environment read-only diagnosis |
| Base | `d334c679a59a596810a9055dc168c20b589adc9f` |
| Result | `FOLLOW_ON_PROTECTED_BOUNDARY` |

## Objective

Inspect the named local OMEN proof surfaces without mutation, determine whether the proof runtime is
healthy, and produce one exact follow-on packet if repair requires protected runtime action.

## Authorized Files

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-LOCAL-093-read-only-diagnosis.md`
- `docs/brain/workorders/evidence/WO-LOCAL-093-LOCAL-OMEN-READ-ONLY-DIAGNOSIS.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Result

Docker Desktop 4.79.0 cannot initialize its Linux/WSL engine. The configured WSL disk path is a
junction from `%LOCALAPPDATA%\Docker\wsl\disk` to `E:\DockerData`, while `E:` is not available in
the diagnostic session. Docker repeatedly attempts to create the already-existing junction path and
fails before the daemon pipe is created. The named OMEN containers therefore cannot be inspected
through the Docker API, and no expected proof ports are listening.

No runtime, container, process, network, volume, configuration, credential, or data mutation was
performed. Repair requires a separately authorized `WO-LOCAL-094` packet.

## Validation

- Read-only Docker CLI, service, process, WSL, filesystem metadata, port, and sanitized log checks.
- Configuration key-name inventory only; no secret or configuration values recorded.
- `git diff --check`.
- Work Order query and wave-planner tests and JSON output.
- Brain scope review.
- No runtime, backend, product, package, CI, deployment, county, PACS, SQL, secret, or live-resource
  change.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCAL-093",
  "task": "Diagnose the named local OMEN proof runtime without mutation and identify the exact repair boundary",
  "risk": "R2",
  "suite": "LocalOps",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-LOCAL-093-read-only-diagnosis.md",
    "docs/brain/workorders/evidence/WO-LOCAL-093-LOCAL-OMEN-READ-ONLY-DIAGNOSIS.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
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
    "corepack pnpm brain review-diff --workorder WO-LOCAL-093"
  ]
}
```
