# WO-PORTFOLIO-004 - Standing Operator Authority Ratification

**Program:** `portfolio-operator`
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Base:** `4d1ee8417b4f9ab7594ee310aa5e8f4c2e403df3`
**Risk:** `R3`
**Status:** Complete on protected merge

## Objective

Ratify the owner's continuous TerraFusion delivery authority as a durable, revocable operator grant
and mechanically prevent routine engineering, review, validation, merge, and continuation work from
being mislabeled as owner decisions.

## Boundary

This Work Order grants delivery lifecycle authority only. It does not authorize a new program,
objective, file scope, product behavior, deployment, protected resource, destructive action, or
external commitment. Those permissions must already exist in the active ratified program and Work
Order.

## Required Result

When an active program and dependency-cleared Work Order cover the exact scope, the PR is current and
clean, required checks pass, review threads are zero, reservations are clear, and no true authority
wall exists, the classifier returns `MERGE_AND_CONTINUE`.

`MERGE_AUTH_REQUIRED` is valid only when no applicable standing or bounded merge authority exists.

## Validation

- `python scripts/ci/verify-standing-operator-authority.py`
- `python scripts/ci/__tests__/standing-operator-authority.test.py`
- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `corepack pnpm brain review-diff --workorder WO-PORTFOLIO-004`
- required remote governance checks

STOP_TYPE: `STANDING_OPERATOR_AUTHORITY_RATIFIED`

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-PORTFOLIO-004",
  "task": "Ratify and enforce continuous standing operator authority for already-authorized TerraFusion delivery",
  "risk": "R3",
  "suite": "Portfolio Operator",
  "allowed_files": [
    ".governance/owner-decisions.json",
    ".governance/standing-operator-authority.json",
    ".github/workflows/core-governance-gates.yml",
    "AGENTS.md",
    "docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md",
    "docs/brain/workorders/AUTONOMOUS_CONTINUATION_GATE.md",
    "docs/brain/workorders/CANON_INDEX.md",
    "docs/brain/workorders/CONTINUATION_RULEBOOK.md",
    "docs/brain/workorders/GOAL_LOOP_AUTONOMY_RULES.md",
    "docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md",
    "docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md",
    "docs/brain/workorders/active/WO-PORTFOLIO-004-standing-operator-authority.md",
    "docs/brain/workorders/evidence/WO-PORTFOLIO-004-STANDING-OPERATOR-AUTHORITY.md",
    "docs/brain/workorders/goal-loop/STOP_TYPE_CLASSIFIER.md",
    "docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md",
    "docs/brain/workorders/goal-loop/GOAL_COMMANDS.md",
    "docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md",
    "docs/brain/workorders/operator/AUTONOMOUS_CONTINUATION_RULES.md",
    "docs/brain/workorders/operator/PR_REVIEW_CI_OPERATOR_RULES.md",
    "docs/brain/workorders/operator/README.md",
    "docs/brain/workorders/operator/WORK_ORDER_LIFECYCLE.md",
    "docs/brain/workorders/operator/WORK_ORDER_OPERATOR_DOCTRINE.md",
    "docs/brain/workorders/playbooks/CODEX_PR_LIFECYCLE_PLAYBOOK.md",
    "docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md",
    "docs/brain/workorders/programs/portfolio-operator.md",
    "scripts/ci/verify-standing-operator-authority.py",
    "scripts/ci/__tests__/standing-operator-authority.test.py"
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
    "python scripts/ci/verify-standing-operator-authority.py",
    "python scripts/ci/__tests__/standing-operator-authority.test.py",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "corepack pnpm brain review-diff --workorder WO-PORTFOLIO-004",
    "git diff --check"
  ]
}
```
