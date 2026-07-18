# WO-LOCAL-094 - Docker WSL Disk Path Repair and OMEN Re-observation

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Local OMEN Runtime Repair |
| Goal | `GOAL-LOCAL-OMEN-RUNTIME-REPAIR` |
| Loop | `LOOP-LOCAL-OMEN-RUNTIME-REPAIR` |
| Risk | R3 bounded local-runtime repair envelope |
| Base | `13f0eabea7c4975e14818bbace84856f3ba823d9` |
| Result | `FOLLOW_ON_PROTECTED_BOUNDARY` |

## Objective

Preserve and restore Docker Desktop's existing WSL data path, initialize Docker once, and re-observe
the named OMEN containers without deleting, replacing, or silently recreating Docker state.

## Authorized Files

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-LOCAL-094-docker-wsl-path-repair.md`
- `docs/brain/workorders/evidence/WO-LOCAL-094-DOCKER-WSL-PATH-REPAIR.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Result

The data-preservation gate stopped repair before mutation. The existing Docker data target is a
historical external volume with GUID `{359cf739-10c6-4534-98b0-07fc3c6de7fb}` mounted previously as
`E:`. That volume is not connected. Only the internal system disk is present, and no Docker data
VHDX or preserved copy exists in the inspected standard Docker, WSL, or operator-local locations.

The 96 MiB `Docker\wsl\main\ext4.vhdx` is the engine distribution, not the missing container data.
Creating a replacement directory or starting Docker would risk initializing an empty data store, so
no junction, process, WSL, Docker, container, network, volume, port, credential, or database mutation
was performed.

## Validation

- Worktree identity and cleanliness at current `origin/main`.
- Junction reparse data, target, ACL, timestamps, and mount-manager identity captured.
- Connected logical disks, physical disks, volumes, partitions, WSL state, Docker service/processes,
  and engine pipes inventoried read-only.
- Standard Docker/WSL/operator-local paths searched for existing data VHDX or preserved copies.
- `git diff --check`.
- Work Order query and wave-planner tests and JSON output.
- Brain scope review and required core gates.
- No runtime, Docker, WSL, process, container, filesystem mapping, product, package, CI, deployment,
  county, PACS, SQL, secret, or live-resource mutation.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCAL-094",
  "task": "Repair Docker WSL storage only when existing state can be preserved, then re-observe the named OMEN containers",
  "risk": "R3",
  "suite": "LocalOps",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-LOCAL-094-docker-wsl-path-repair.md",
    "docs/brain/workorders/evidence/WO-LOCAL-094-DOCKER-WSL-PATH-REPAIR.md",
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
    "corepack pnpm brain review-diff --workorder WO-LOCAL-094"
  ]
}
```
