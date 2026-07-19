# WO-LOCAL-097 - OMEN Proof Image Acquisition and Runtime Reconstitution

| Field | Value |
| --- | --- |
| Status | SUPERSEDED - `OUT_OF_SCOPE_CROSS_PROJECT` |
| TerraFusion capability | `NO_TERRAFUSION_CAPABILITY_DELIVERED` |
| Program | Cross-Project Historical Audit (WilliamOS/TerraGroq) |
| Goal | None in TerraFusion |
| Loop | None in TerraFusion |
| Risk | R3 bounded local-runtime and supply-chain mutation envelope |
| Base | `4d1be03f4d5012ae249e2b0d2f016f7952d7da29` |
| Result | `OUT_OF_SCOPE_CROSS_PROJECT` |

> Historical audit only. The OMEN and `williamos-*` proof surfaces belong to the separate
> WilliamOS/TerraGroq project. This packet grants no TerraFusion execution or successor authority.

## Objective

Acquire the two exact proof images with immutable provenance, reconstruct the evidenced local-only
topology, recover PostgreSQL against preserved persistence, and start OMEN only when its effective
startup behavior passes every fail-closed gate.

## Authorized Files

This outside-core documentation scope is not self-granted by the Work Order. The controlling Owner
authorization for WO-LOCAL-097 explicitly permits evidence capture, commit, PR, review remediation,
authorized merge, post-merge verification, and portfolio recomputation for this recovery cycle. The
exact file list below bounds that explicit exception to the root `AGENTS.md` core-surface default.

- `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-LOCAL-097-omen-image-runtime-reconstitution.md`
- `docs/brain/workorders/evidence/WO-LOCAL-097-OMEN-IMAGE-AND-RUNTIME-RECONSTITUTION.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Result

The official PostgreSQL image was acquired by immutable registry digest, and the OMEN image was
reproduced from exact governed source with unchanged package and lockfile hashes. PostgreSQL was
recreated on the existing network and preserved named volume and became healthy after ordinary
crash recovery.

The application container was not created or started. Static assurance found that its telemetry
package defaults to a loopback OTLP exporter unless explicitly disabled. During safe metadata
capture, an over-broad local inspect command also emitted the Postgres environment array into
transient operator-only output. No secret value is reproduced, copied, or committed. Credential
rotation is now mandatory before OMEN startup and is outside this envelope.

## Validation

- Official PostgreSQL manifest and `linux/amd64` digest verified.
- Governed OMEN source commit, Dockerfile, package, lockfile, and context hashes recorded.
- OMEN build passed with a frozen lockfile and no tracked source mutation.
- Preserved volume identity and exact mount destination verified.
- Existing network, localhost binding, health check, and restart policy verified.
- PostgreSQL healthy and accepting connections after normal crash recovery.
- Independent startup assurance completed with file-and-line evidence.
- OMEN container creation and startup count: zero.
- No schema, seed, restore, record, county, PACS, production, CI, or deployment mutation.
- `git diff --check`.
- Work Order query and wave-planner tests and JSON output.
- Required core gates.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCAL-097",
  "task": "Acquire immutable OMEN proof images and reconstitute the local proof runtime only while supply-chain, topology, persistence, startup, and secret-safety gates pass",
  "risk": "R3",
  "suite": "LocalOps",
  "allowed_files": [
    "docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-LOCAL-097-omen-image-runtime-reconstitution.md",
    "docs/brain/workorders/evidence/WO-LOCAL-097-OMEN-IMAGE-AND-RUNTIME-RECONSTITUTION.md",
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
    "corepack pnpm brain review-diff --workorder WO-LOCAL-097",
    "corepack pnpm run type-check",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
