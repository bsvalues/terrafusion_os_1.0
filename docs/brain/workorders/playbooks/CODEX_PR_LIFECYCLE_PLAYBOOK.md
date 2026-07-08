# Codex PR Lifecycle Playbook

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-005

## Purpose

Codex owns the PR lifecycle after a Work Order starts. The owner should not courier routine PR,
review, check, push, or post-merge state.

## Lifecycle

1. Create or enter a dedicated clean worktree.
2. Confirm worktree identity:
   - `pwd`
   - `git branch --show-current`
   - `git rev-parse --show-toplevel`
   - `git status --short`
3. Execute the assigned Work Order only inside authorized scope.
4. Run local validation.
5. Commit.
6. Push.
7. Open PR.
8. Confirm PR scope.
9. Monitor remote checks.
10. Inspect review threads.
11. Remediate review feedback in scope.
12. Push fixes.
13. Wait for clean merge state.
14. Merge if pre-authorized; otherwise stop for merge authority.
15. Post-merge verify `origin/main`.
16. Update loop state.
17. Select the next Work Order in the same loop if allowed.

## Required Validation For Docs/Governance Work Orders

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
git status --short
```

## Scope Checks

Before commit and before merge-readiness reporting, Codex must confirm:

- runtime code changed: no,
- backend code changed: no,
- tools-sync code changed: no,
- CI/deployment changed: no,
- county/PACS/live resource changed: no,
- changed files match the active Work Order.

## Merge Readiness Criteria

A PR is merge-ready only when:

- PR is open and non-draft,
- changed files are in scope,
- remote checks are green or explicitly acceptable,
- review threads are resolved,
- merge state is clean,
- no owner authority wall remains except merge authority itself.

STOP_TYPE: CODEX_PR_LIFECYCLE_PLAYBOOK_DEFINED
