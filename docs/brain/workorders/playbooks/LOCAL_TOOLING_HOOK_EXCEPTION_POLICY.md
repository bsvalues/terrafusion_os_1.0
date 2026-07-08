# Local Tooling Hook Exception Policy

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-007

## Purpose

Missing local Prettier or Vitest should not repeatedly stop docs/governance Work Orders when
repository validation already passed and remote CI is authoritative.

## Standing Exception

Codex may use `--no-verify` only when all are true:

- the Work Order is docs/evidence/governance/runbook only,
- changed files are inside the authorized scope,
- `git diff --check` passed,
- `node docs/brain/workorders/tools/wo-query.mjs --json` passed,
- runtime/backend/tools-sync/CI/deployment/county files changed: no,
- the hook failure is only missing local tooling such as `prettier` or `vitest`,
- remote CI will validate the PR,
- the bypass is recorded in evidence or PR text.

## Approved Commands

```powershell
git commit --no-verify -m "<scoped message>"
git push --no-verify
```

## Blocked Uses

Codex must not use this exception for:

- failed tests,
- real lint or format errors in files,
- failed security scans,
- failed secret checks,
- branch protection bypass,
- unvalidated runtime changes,
- backend/runtime/tools-sync/CI/deployment/county changes unless separately authorized.

## Required Evidence

Each bypass record must include:

- exact hook error,
- validation commands passed,
- files changed,
- statement that remote CI is authoritative,
- protected-scope change status.

STOP_TYPE: LOCAL_TOOLING_HOOK_EXCEPTION_POLICY_DEFINED
