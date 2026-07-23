# WO-SR-005C-E3 - Dais Bounded Extraction Scope Audit

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R1 sovereign-side scope audit (read-only classification) |
| Dependency | `dais.appeal-workflow@1.0.0` frozen (PR #1350); sovereign base `e57b1eca9` |
| Authority | Owner authorization of five-suite bounded extraction (2026-07-23) + `OWNER-TF-STANDING-OPERATOR-AUTHORITY` for routing/evidence under `docs/brain/workorders/**` |
| Result | `PASS_NO_DIRECT_EXTRACTION` — build fresh; no provably provider-neutral Dais source exists |

## Objective

Decide whether any committed sovereign Dais/appeal source can be directly extracted into
`bsvalues/terrafusion-dais`, or whether the suite module must be built fresh against the frozen
`dais.appeal-workflow@1.0.0` contract. Inventory every candidate, classify each (contract-artifact /
synthetic-fixture / provably provider-neutral / prohibited-sovereign), pin the sovereign anchor SHA and
frozen artifact hashes, and produce the exact external-repo target allowlist for the F1 slice. This is
the mandatory per-suite E3 gate, mirroring Atlas `WO-SR-005B-E3`.

## Authorized Files

- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/active/WO-SR-005C-E3-dais-bounded-extraction-scope-audit.md`
- `docs/brain/workorders/evidence/WO-SR-005C-E3-DAIS-BOUNDED-EXTRACTION-SCOPE-AUDIT.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Explicitly Blocked

- Any modification to the frozen `dais.appeal-workflow@1.0.0` DTO, schema, or fixtures.
- Any Dais product implementation (no F1/E2 code) — this WO produces only the scope verdict.
- Any extraction, copy, or move of sovereign Dais source; any provider, county, PACS, SQL,
  persistence, credential, runtime, workflow, package, lockfile, deployment, or cutover change.
- `.governance/**`, backend/frontend/os-platform/tools/packages source changes.

## Result

`PASS_NO_DIRECT_EXTRACTION`. Zero committed Dais candidates are provably provider-neutral: backend
entities/services/controllers are persistence/PACS/HTTP/auth-bound; every `services/suites/dais*` file
is welded to the OS `writeLane` (TFR-028) and `terraTrace` (TFR-027) runtime; OS-shell components/pages
are composition. The frozen contract (DTO + schema) stays sovereign-owned. The Dais F1 slice must be
built fresh, offline and unwired, in `bsvalues/terrafusion-dais` per the allowlist in the evidence.

## Validation

- Parse the Work Order registry JSON.
- Run `git diff --check`.
- Run `wo-query.test.mjs` (the wave-planner test additionally needs `ajv` from a full install; runs in CI).
- Re-verify the 11 frozen `dais.appeal-workflow@1.0.0` file hashes equal the `contracts.freeze.json` pins.
- Confirm no sovereign source, contract artifact, or protected-resource path changed.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-SR-005C-E3",
  "task": "Audit Dais bounded-extraction scope against frozen dais.appeal-workflow@1.0.0 and return the exact-scope verdict",
  "risk": "R1",
  "suite": "Dais",
  "allowed_files": [
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-SR-005C-E3-dais-bounded-extraction-scope-audit.md",
    "docs/brain/workorders/evidence/WO-SR-005C-E3-DAIS-BOUNDED-EXTRACTION-SCOPE-AUDIT.md",
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
    "node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs"
  ]
}
```
