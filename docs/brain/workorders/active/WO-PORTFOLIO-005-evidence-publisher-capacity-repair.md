# WO-PORTFOLIO-005 - Evidence Publisher Capacity Repair

**Program:** `portfolio-operator`
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Base:** `5049ed24eda651ac4896b2ccfcbf5ceed3ac04b6`
**Risk:** `R3`
**Status:** Complete on protected merge

## Objective

Restore the post-merge autonomy evidence publication path after the shared July release reached
GitHub's 1,000-assets-per-release limit. Preserve strict verification, signatures, custody proof, and
one-year retention without deleting or rewriting retained evidence.

## Admission Basis

Portfolio synthesis found no unfinished WOE or LocalOps chain: the WOE baseline is closed, and
`WO-LOCALOPS-000` through `WO-LOCALOPS-008` plus the implemented AI-consolidation slices are already
merged. The live
`Autonomy Evidence Publisher` failure is instead a current, reproducible R3 delivery defect:

- workflow run `29553323267` generated, verified, signed, and custody-checked its evidence;
- publication failed only with `file_count limited to 1000 assets per release`;
- release `autonomy-evidence/2026-07` contains exactly 1,000 assets;
- no production, county, PACS, SQL, credential, secret, or runtime access is required.

## Implementation

Future workflow runs publish to a deterministic per-run release shard:

```text
autonomy-evidence-shard-YYYY-MM-RUN_ID
```

The run ID makes cross-run asset accumulation impossible. Existing monthly releases remain untouched.
The workflow contract test requires both the date provenance and run binding.

## Validation

- evidence-publisher contract tests;
- workflow YAML parse and release-tag assertions;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- Work Order query/report/wave-planner regression tests;
- `corepack pnpm brain review-diff --workorder WO-PORTFOLIO-005`;
- required remote governance checks.

STOP_TYPE: `EVIDENCE_PUBLISHER_CAPACITY_REPAIRED`

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-PORTFOLIO-005",
  "task": "Repair the autonomy evidence publisher release-capacity defect without deleting retained evidence",
  "risk": "R3",
  "suite": "Portfolio Operator",
  "allowed_files": [
    ".github/workflows/autonomy-evidence-publisher.yml",
    "docs/AUTONOMY_EVIDENCE_RETENTION_POLICY.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-PORTFOLIO-005-evidence-publisher-capacity-repair.md",
    "docs/brain/workorders/evidence/WO-PORTFOLIO-005-EVIDENCE-PUBLISHER-CAPACITY-REPAIR.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "docs/brain/workorders/programs/portfolio-operator.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json",
    "tools/registry/autonomy-viewer/test/evidence-publisher.test.ts"
  ],
  "forbidden_patterns": [
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "tools/sync/**",
    "package.json",
    "**/pnpm-lock.yaml",
    "deployment/**",
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "corepack pnpm exec tsx --test tools/registry/autonomy-viewer/test/evidence-publisher.test.ts",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-report.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "corepack pnpm brain review-diff --workorder WO-PORTFOLIO-005",
    "git diff --check"
  ]
}
```
