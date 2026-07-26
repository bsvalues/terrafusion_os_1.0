# WO-SR-005D-E3 - Dossier Bounded Extraction Scope Audit

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only source classification and governance evidence |
| Dependency | `WO-SR-005D-E1` and `WO-SR-005D-E2` complete; `dossier.evidence-registry-read@1.0.0` frozen |
| Authority | Ratified five-suite program plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY` |
| Result | `PASS_NO_DIRECT_EXTRACTION` - build fresh; no Dossier source has a safe direct-copy boundary |

## Objective

Decide whether committed sovereign Dossier evidence-registry source can be copied into
`bsvalues/terrafusion-dossier`, or whether the standalone product foundation must be built fresh
against `dossier.evidence-registry-read@1.0.0`. Inventory the candidate surfaces, verify the frozen
contract and destination anchors, classify ownership and dependencies, and define the smallest
later F1 candidate without implementing it.

## Authorized Files

- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/active/WO-SR-005D-E3-dossier-bounded-extraction-scope-audit.md`
- `docs/brain/workorders/evidence/WO-SR-005D-E3-DOSSIER-BOUNDED-EXTRACTION-SCOPE-AUDIT.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Explicitly Blocked

- Source extraction, copying, moving, or history import.
- F1 implementation, runtime wiring, custody mutation, persistence, providers, packages, publication,
  workflow changes, deployment, production, cutover, or source retirement.
- County, PACS, SQL, credentials, secrets, or live-resource access.
- Any backend, frontend, OS, contract, test, or standalone Dossier repository write.

## Result

`PASS_NO_DIRECT_EXTRACTION`. The controller is bound to ASP.NET authorization, EF persistence,
cross-suite CostForge composition, and custody mutation. The persistent entity carries excluded
title/creator fields and navigation properties. The pure sovereign adapter still imports the
sovereign DTO and persistence entity. Frontend Dossier services depend on auth, OS write-lane,
TerraTrace, or shell composition. No candidate is independently owned, provider-neutral product
source suitable for direct copy.

The later candidate is a build-fresh, offline, unwired standalone projection in
`bsvalues/terrafusion-dossier` that consumes the already-mirrored hash-pinned schema and synthetic
corpus. This Work Order does not authorize that implementation.

## Validation

- Verify all 13 frozen Dossier files match `contracts.freeze.json`.
- Confirm the standalone Dossier `main` anchor and existing parity evidence.
- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Work Order tooling tests.
- Confirm exact changed paths equal the nine-file governance allowlist.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-SR-005D-E3",
  "task": "Audit Dossier bounded-extraction scope against dossier.evidence-registry-read@1.0.0",
  "risk": "R2",
  "suite": "Dossier",
  "allowed_files": [
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "docs/brain/workorders/programs/five-suite-federated-repository-buildout.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/active/WO-SR-005D-E3-dossier-bounded-extraction-scope-audit.md",
    "docs/brain/workorders/evidence/WO-SR-005D-E3-DOSSIER-BOUNDED-EXTRACTION-SCOPE-AUDIT.md",
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
