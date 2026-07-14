# Codex Operator Authority Matrix


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-001

## Purpose

This matrix defines what Codex may do without re-asking the owner, what Codex may do under the local
tooling exception, and what must stop for owner authority.

The owner is the authority wall. The owner is not the courier for routine execution.

## Authority Buckets

### AUTO-PROCEED

Codex may proceed automatically when the active Work Order, `/goal`, and `/loop` already authorize
the work. A numeric risk increase is allowed only when an active, unexpired, non-revoked authority
grant explicitly covers the new class, systems, files, and actions:

- create a dedicated clean worktree and branch for the assigned Work Order,
- edit files inside the approved scope,
- run validation gates,
- commit in-scope changes,
- push normally,
- open a PR,
- monitor checks,
- read and remediate review feedback in scope,
- rerun validation,
- update evidence docs,
- resolve review threads after scoped fixes,
- continue to the next Work Order in the same approved loop when no authority wall exists.

### AUTO-PROCEED WITH LOCAL TOOLING EXCEPTION

Codex may use a local hook bypass when all are true:

- the Work Order is docs/evidence/governance/runbook only,
- changed files are inside the authorized file set,
- `git diff --check` passed,
- `node docs/brain/workorders/tools/wo-query.mjs --json` passed,
- runtime/backend/tools-sync/CI/deployment/county files changed: no,
- the hook failure is caused only by missing local dev tooling such as `prettier` or `vitest`,
- the bypass is recorded in evidence or the PR body,
- remote CI remains the authoritative validation surface.

Approved commands under this exception:

```powershell
git commit --no-verify -m "<scoped message>"
git push --no-verify
```

This exception must not hide failed tests, failed formatting, secret scans, security scans, or failed
repository validation.

### STOP_FOR_OWNER

Codex must stop when any of these are required or discovered:

- merge when merge authority is not pre-granted,
- production deployment,
- county runtime, PACS, county SQL, live services, or production resources,
- credentials or secrets,
- destructive operation not covered by an exact repair rule,
- runtime/product behavior change outside scope,
- backend/runtime/frontend/tools-sync/CI/deployment/county code change outside scope,
- branch/merge strategy conflict,
- validation failure not remediable in scope,
- canon conflict,
- review requiring files outside the authorized set,
- any scope expansion.

## Evidence Requirement

Every use of this matrix must report:

- files changed,
- validation run,
- whether bypass was used,
- exact bypass reason if used,
- runtime/backend/tools-sync/CI/deployment/county change status,
- next action and stop type.

STOP_TYPE: OPERATOR_AUTHORITY_MATRIX_DEFINED
