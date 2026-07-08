# WO-REL-005 - Rollback Drill Authorization Packet

Date: 2026-07-08
Work order: WO-REL-005
Program: Release Engineering
Goal: GOAL-TF-RELEASE-ENGINEERING-001
Loop: LOOP-TF-RELEASE-ENGINEERING-001
Mode: docs/governance only
Current lane base: `718c5f75481e4d890055a6ec645f848a8cf7acd6`

## Result

RESULT: PASS

Release Engineering now has a rollback drill authorization packet. The packet defines what an owner
must decide before any future safe-environment rollback drill can execute, what evidence must exist,
which rollback classes are in scope, and which boundaries remain blocked.

This work order does not execute rollback, create migrations, modify deployment scripts, change CI,
touch runtime/backend/frontend/tools-sync code, access secrets, or touch county/PACS/live resources.

## Scope Authorization

This work order is documentation/governance only under `docs/brain/workorders/**`.

Authorized changes:

- create the rollback drill authorization packet,
- update Release Engineering program/routing docs as needed.

Not authorized:

- rollback execution,
- deployment execution,
- GitHub Actions or Azure Pipelines changes,
- branch protection changes,
- release automation changes,
- runtime/backend/frontend/tools-sync implementation,
- schema or migration creation/application,
- data mutation,
- secrets, county SQL, PACS/CAMA, production systems, or live services.

## Authorization Packet Template

Use this packet before any future rollback drill execution. Replace every bracketed field before an
owner can make a decision.

```text
OWNER_DECISION:
[APPROVED | HOLD | REJECTED]

Rollback drill ID:
[ROLLBACK-DRILL-ID]

Release candidate or version:
[RC-ID or version]

Candidate SHA:
[exact SHA]

Rollback class:
[Docs-only rollback | Config rollback | Feature-flag rollback | Dependency rollback | Migration rollback | Deployment rollback | Full revert]

Target environment:
[local | test | shared validation | other safe non-production environment]

Production involved:
no

County/PACS/live data involved:
no

Execution command or procedure:
[exact documented command/procedure, or HOLD if not yet defined]

Evidence packet:
[path]

Rollback owner:
[owner]

Approval expiration:
[timestamp or condition]
```

## Rollback Class Model

| Rollback class | Example scope | Required proof before drill | Owner authority required |
|----------------|---------------|-----------------------------|--------------------------|
| Docs-only rollback | Revert a governance/evidence doc | PR/revert path, affected docs, post-merge verification | Docs rollback approval |
| Config rollback | Revert non-secret config in safe env | Config diff, safe target env, restore path | Config rollback approval |
| Feature-flag rollback | Toggle a safe non-production flag | Flag inventory, before/after state, blast-radius statement | Flag rollback approval |
| Dependency rollback | Revert package/tool dependency in safe env | Lockfile/package diff, build/test proof, known risk | Dependency rollback approval |
| Migration rollback | Exercise migration Down/recovery in disposable DB | Migration inventory, disposable DB proof target, data-loss analysis | Migration drill approval |
| Deployment rollback | Roll back a non-production deployment | Deployment target, artifact versions, health checks, recovery path | Deployment drill approval |
| Full revert | Revert one or more PRs in safe validation | PR list, conflict analysis, validation matrix | Revert drill approval |

## Required Pre-Drill Evidence

A rollback drill cannot execute until these evidence fields are complete:

| Evidence | Required? | Notes |
|----------|-----------|-------|
| Exact candidate SHA | yes | Must match the release candidate or tag/version evidence. |
| Rollback class | yes | Must use one of the class names above. |
| Safe target environment | yes | Must not be production unless separately authorized. |
| Procedure or command | yes | Must be exact enough to reproduce. |
| Expected success signal | yes | Health/check/log/evidence output that proves rollback result. |
| Expected failure signal | yes | What causes immediate stop. |
| Data boundary statement | yes | Must state no county/PACS/live data unless separately authorized. |
| Secrets boundary statement | yes | Must state no secrets access unless separately authorized. |
| Recovery path | yes | How to return from the drill state. |
| Evidence capture path | yes | Where proof will be recorded. |

## Required Post-Drill Evidence

If a future rollback drill is authorized and executed, its evidence packet must include:

- start time and operator,
- exact target environment,
- exact SHA/version/tag involved,
- exact command/procedure executed,
- before state,
- after state,
- validation output,
- recovery output,
- logs or check URLs where available,
- PASS/HOLD/FAIL decision,
- residual risks,
- non-claims.

## Stop Conditions

Stop for owner decision before any rollback drill if:

- production deployment or production rollback is implicated,
- county runtime, county SQL, PACS/CAMA, protected data, or live services are implicated,
- secrets or credentials are required,
- migration/schema changes are required,
- CI/release workflow changes are required,
- deployment scripts must change,
- destructive cleanup is proposed,
- rollback evidence contradicts release candidate evidence,
- the rollback class is ambiguous,
- the target environment is not disposable or safe.

## Non-Claims

This packet does not claim:

- rollback has been executed,
- rollback execution proof exists,
- deployment rollback is safe,
- migration rollback is safe against real data,
- production recovery is proven,
- county/PACS/live boundaries are in scope,
- secrets were accessed,
- any command is authorized to run.

## PASS / HOLD / FAIL Interpretation

| Decision | Meaning |
|----------|---------|
| PASS | The authorization packet is complete enough for an owner to decide whether to approve a future safe-environment rollback drill. PASS does not authorize execution. |
| HOLD | Required evidence is missing, stale, ambiguous, or points at a protected boundary. |
| FAIL | The packet proposes production/protected-resource rollback, claims unproven execution proof, or contradicts release evidence. |

## Validation Summary

Required validation for this work order:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- scope inspection confirms docs/governance only
- runtime/backend/tools-sync implementation files changed: none
- CI/workflow files changed: none
- deployment files changed: none
- county/PACS/CAMA/secrets/live resources touched: none

## Next Work

Next recommended Release Engineering WO:

`WO-REL-006 - Release Engineering Evidence Rollup`

That work order remains docs/evidence only and should close or explicitly defer the Release
Engineering baseline based on merged evidence.
