# Review Remediation Autonomy

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-006

## Purpose

Routine review feedback must not turn the owner into a courier. Codex remediates review comments when
the fix is inside the active Work Order scope.

## Auto-Remediate When

Codex may fix and push review feedback automatically when all are true:

- the comment is on files already in scope,
- the fix is docs/governance only when the Work Order is docs/governance,
- no runtime behavior changes are required,
- no backend/frontend/tools-sync/CI/deployment/county files are required,
- no new files outside scope are required,
- validation still passes,
- the requested change does not alter goal/loop authority beyond current scope,
- no policy or canon conflict appears.

## Stop When

Codex must stop when review requests:

- scope expansion,
- runtime, deployment, county, PACS, secrets, or CI work,
- branch protection or gate modification,
- contradictory canon,
- new authority model beyond the active goal/loop,
- destructive cleanup,
- merge strategy change.

## Evidence Required

For each review-remediation pass, report:

- review threads before and after,
- files changed,
- validation run,
- whether local hook bypass was used,
- whether remote checks are green/acceptable.

STOP_TYPE: REVIEW_REMEDIATION_AUTONOMY_DEFINED

