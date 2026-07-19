# WO-PORTFOLIO-013 - Cross-Project Scope Correction

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Portfolio Operator |
| Risk | R1 governance reconciliation |
| Dependency | WO-LOCAL-097 merged at `e47cc7f2ccc766f1681ae61efdbd19d338000059` |
| Result | WilliamOS/TerraGroq work removed from TerraFusion routing without rewriting history |

## Objective

Correct cross-project contamination caused by admitting OMEN and `williamos-*` runtime evidence into
the TerraFusion portfolio. Preserve merged documents as historical audit material, remove all
TerraFusion capability claims and successor routing, and recompute the native portfolio without
runtime, credential, container, database, or external-resource mutation.

## Authorized Files

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-LOCAL-093-read-only-diagnosis.md`
- `docs/brain/workorders/active/WO-LOCAL-094-docker-wsl-path-repair.md`
- `docs/brain/workorders/active/WO-LOCAL-095-historical-volume-recovery.md`
- `docs/brain/workorders/active/WO-LOCAL-096-omen-proof-container-recovery.md`
- `docs/brain/workorders/active/WO-LOCAL-097-omen-image-runtime-reconstitution.md`
- `docs/brain/workorders/active/WO-PORTFOLIO-013-cross-project-scope-correction.md`
- `docs/brain/workorders/evidence/WO-LOCAL-093-LOCAL-OMEN-READ-ONLY-DIAGNOSIS.md`
- `docs/brain/workorders/evidence/WO-LOCAL-094-DOCKER-WSL-PATH-REPAIR.md`
- `docs/brain/workorders/evidence/WO-LOCAL-095-HISTORICAL-VOLUME-RECOVERY.md`
- `docs/brain/workorders/evidence/WO-LOCAL-096-OMEN-PROOF-CONTAINER-RECOVERY.md`
- `docs/brain/workorders/evidence/WO-LOCAL-097-OMEN-IMAGE-AND-RUNTIME-RECONSTITUTION.md`
- `docs/brain/workorders/evidence/WO-PORTFOLIO-013-CROSS-PROJECT-SCOPE-CORRECTION.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Explicitly Blocked

- Credential inspection or rotation
- Container, image, volume, network, port, process, Docker, or WSL mutation
- WilliamOS/TerraGroq continuation or implicit authority transfer
- TerraFusion runtime, product, package, lockfile, CI, deployment, county, PACS, SQL, secret, or
  production changes
- Reverting or rewriting already merged historical evidence

## Result

WO-LOCAL-093 through WO-LOCAL-097 are classified `OUT_OF_SCOPE_CROSS_PROJECT` and
`NO_TERRAFUSION_CAPABILITY_DELIVERED`. Proposed WO-LOCAL-098 is withdrawn from TerraFusion routing.
Continuation belongs in a separately authorized WilliamOS/TerraGroq repository and program.

After correction, no dependency-cleared TerraFusion-native Work Order is registered within current
authority. Remaining native candidates cross recorded production deployment, protected data,
runtime-import, TerraPilot promotion, or new-product boundaries.

## Validation

- Parse the Work Order registry JSON.
- Run `git diff --check`.
- Run Work Order query and wave-planner tests.
- Prove WO-LOCAL-093 through WO-LOCAL-097 are terminal superseded records.
- Prove WO-LOCAL-098 is not registered, routed, or returned as executable.
- Confirm no runtime, product, package, CI, deployment, or protected-resource path changed.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-PORTFOLIO-013",
  "task": "Remove cross-project WilliamOS and OMEN work from TerraFusion capability and executable routing",
  "risk": "R1",
  "suite": "Portfolio Operator",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-LOCAL-093-read-only-diagnosis.md",
    "docs/brain/workorders/active/WO-LOCAL-094-docker-wsl-path-repair.md",
    "docs/brain/workorders/active/WO-LOCAL-095-historical-volume-recovery.md",
    "docs/brain/workorders/active/WO-LOCAL-096-omen-proof-container-recovery.md",
    "docs/brain/workorders/active/WO-LOCAL-097-omen-image-runtime-reconstitution.md",
    "docs/brain/workorders/active/WO-PORTFOLIO-013-cross-project-scope-correction.md",
    "docs/brain/workorders/evidence/WO-LOCAL-093-LOCAL-OMEN-READ-ONLY-DIAGNOSIS.md",
    "docs/brain/workorders/evidence/WO-LOCAL-094-DOCKER-WSL-PATH-REPAIR.md",
    "docs/brain/workorders/evidence/WO-LOCAL-095-HISTORICAL-VOLUME-RECOVERY.md",
    "docs/brain/workorders/evidence/WO-LOCAL-096-OMEN-PROOF-CONTAINER-RECOVERY.md",
    "docs/brain/workorders/evidence/WO-LOCAL-097-OMEN-IMAGE-AND-RUNTIME-RECONSTITUTION.md",
    "docs/brain/workorders/evidence/WO-PORTFOLIO-013-CROSS-PROJECT-SCOPE-CORRECTION.md",
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
    "node docs/brain/workorders/tools/wo-wave-plan.mjs --json --authority R3"
  ]
}
```
