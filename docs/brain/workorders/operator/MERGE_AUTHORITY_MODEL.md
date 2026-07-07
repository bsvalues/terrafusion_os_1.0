# Merge Authority Model

Work order: WO-CODEX-OP-007
Program: codex-operator-playbook

## Default Rule

Codex does not merge unless explicit owner authorization exists for that PR.

Merge authority may be granted as:

- a single PR merge authorization,
- a batch merge authorization listing exact PRs and order,
- a quiet-window branch strategy authorization,
- a program packet that explicitly grants merge conditions for named PRs.

## Required Merge Conditions

Even when authorized, Codex may merge only when:

- PR is open,
- PR is non-draft,
- merge state is clean or mergeable under repo policy,
- required checks are green or explicitly acceptable,
- unresolved review threads are zero,
- changed files match authorized scope,
- no forbidden runtime/CI/deployment/schema/protected-resource files changed,
- merge method follows repo policy,
- branch/merge strategy authority is still valid.

## Post-Merge Verification

After merge, Codex must:

- fetch `origin/main`,
- record merge commit,
- verify expected files exist on `origin/main`,
- verify no forbidden files landed,
- run or confirm applicable post-merge validation,
- continue only if the active loop permits it.

STOP_TYPE: MERGE_AUTHORITY_MODEL_DEFINED
