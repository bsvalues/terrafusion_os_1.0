# WO-SR-005E-E3 - GPT Bounded Extraction Scope Audit

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only source classification and governance evidence |
| Dependency | `WO-SR-005E-E1` and `WO-SR-005E-E2` complete; `gpt.grounded-context@1.0.0` frozen |
| Authority | Ratified five-suite program plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY` |
| Result | `PASS_NO_EXECUTABLE_DIRECT_EXTRACTION` - build fresh; no source can be copied into the current standalone build surface as an executable capability |

## Objective

Decide whether committed sovereign GPT grounded-context source can be copied into
`bsvalues/terrafusion-gpt`, or whether the standalone product foundation must be built fresh against
`gpt.grounded-context@1.0.0`. Inventory candidate surfaces, verify the frozen contract and
destination anchors, classify ownership and dependencies, and define the smallest later F1
candidate without implementing it.

## Authorized Files

- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/active/WO-SR-005E-E3-gpt-bounded-extraction-scope-audit.md`
- `docs/brain/workorders/evidence/WO-SR-005E-E3-GPT-BOUNDED-EXTRACTION-SCOPE-AUDIT.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Explicitly Blocked

- Source extraction, copying, moving, or history import.
- F1 implementation, runtime wiring, retrieval, providers, models, embeddings, persistence, packages,
  publication, workflow changes, deployment, production, cutover, or source retirement.
- County, PACS, SQL, credentials, secrets, or live-resource access.
- Any backend, frontend, OS, contract, test, or standalone GPT repository write.

## Result

`PASS_NO_EXECUTABLE_DIRECT_EXTRACTION`. The E0 projection is pure, deterministic, provider-neutral,
and unwired, but it is C# source owned by the sovereign `.NET` solution. The standalone GPT
repository has a Node-based contract verifier and no `.NET` project, package, or compile gate.
Copying E0 there would create inert source; making it executable would require new project and
workflow surfaces outside this audit. The E1 adapter additionally imports the sovereign DTO.
Existing RAG services cross provider, embedding, persistence, HTTP, DI, controller, or runtime
boundaries.

The later candidate is a build-fresh, offline, unwired Node projection in
`bsvalues/terrafusion-gpt` that consumes only explicit host-proven assertions and the already
mirrored hash-pinned schema and synthetic corpus. This Work Order does not authorize it.

## Validation

- Verify all 14 frozen GPT files match `contracts.freeze.json`.
- Confirm the canonical standalone GPT checkout and live `main` anchor.
- Confirm the standalone repository has no executable `.NET` build surface.
- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Work Order tooling tests.
- Confirm exact changed paths equal the nine-file governance allowlist.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-SR-005E-E3",
  "task": "Audit GPT bounded-extraction scope against gpt.grounded-context@1.0.0",
  "risk": "R2",
  "suite": "GPT",
  "allowed_files": [
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "docs/brain/workorders/programs/five-suite-federated-repository-buildout.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/active/WO-SR-005E-E3-gpt-bounded-extraction-scope-audit.md",
    "docs/brain/workorders/evidence/WO-SR-005E-E3-GPT-BOUNDED-EXTRACTION-SCOPE-AUDIT.md",
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
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**"
  ],
  "required_proof": [
    "git diff --check",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs",
    "node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs"
  ]
}
```
