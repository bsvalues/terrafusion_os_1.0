# PR / Review / CI Operator Rules

Work order: WO-CODEX-OP-005
Program: codex-operator-playbook

## PR Ownership

After implementation, Codex owns PR operations until merge authority is required.

Codex must:

- push the authorized branch,
- open the PR with scope, validation, and non-change statements,
- monitor checks,
- inspect failed checks,
- read review comments,
- remediate comments within authorized scope,
- resolve review threads after fixes,
- update the branch from `origin/main` when branch protection requires it,
- report merge readiness only when checks are green or acceptable and unresolved threads are zero.

## Review Remediation

Review fixes are routine only when they:

- touch authorized files,
- preserve risk class,
- do not add runtime/CI/deployment/schema/protected-resource scope,
- do not contradict evidence,
- do not alter canon without authority.

If review requires scope expansion, Codex emits an owner decision packet instead of broadening.

## CI Handling

Codex classifies check failures:

| Failure class | Action |
|---------------|--------|
| Docs/evidence typo or broken reference in scope | Fix and rerun. |
| Branch behind main | Update branch from `origin/main`. |
| Required check still running | Wait and report only if timeout/loop limit is hit. |
| Local hook missing Prettier/Vitest | Stop for hook bypass authority. |
| Runtime, CI, schema, deployment, Docker, secrets, county/PACS failure | Stop unless current WO explicitly authorizes repair. |

STOP_TYPE: PR_REVIEW_CI_OPERATOR_RULES_DEFINED
