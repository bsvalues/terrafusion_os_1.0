# WO-OP-AUTO-000 - Courier Friction Audit

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Mode: read-only governance audit

## Result

The recent Backend OE, Release Engineering, and Codex Operator Playbook lanes show that the main
remaining process defect is not missing work-order doctrine. The defect is repeated courier friction:
Codex reaches a routine PR, hook, review, or check state; reports it; the owner translates the state
into another prompt; Codex resumes; the cycle repeats.

This audit classifies which stops were true owner authority walls and which were routine operator
steps that should be covered by standing rules.

## Courier Friction Register

| Friction | Example pattern | Classification | Correct operator behavior |
|----------|-----------------|----------------|---------------------------|
| Missing local Prettier during docs-only commit | `prettier --write` unavailable on PATH after `git diff --check` and `wo-query` passed | Courier friction when standing local-tooling exception exists | Record the hook failure, use `git commit --no-verify`, continue. |
| Missing local Vitest during docs-only push | strict pre-push cannot find local `vitest`; remote CI is authoritative | Courier friction when standing local-tooling exception exists | Record the hook failure, use `git push --no-verify`, continue. |
| Review comment inside authorized docs scope | review requests wording/routing corrections in already-touched governance docs | Courier friction | Remediate in scope, revalidate, push, resolve thread. |
| Long-running checks | remote checks still pending after local watch timeout | Courier friction | Query PR state and continue monitoring until success/failure. |
| Merge-ready PR with no merge authorization | PR clean, checks green, review threads 0 | True owner wall unless pre-authorized merge mode applies | Return one merge-authority packet. |
| Branch strategy conflict | repeated behind/main race or manual merge window needed | True owner wall | Stop for branch/merge strategy decision. |
| Unsafe worktree | locked/incomplete worktree with broad deleted files | True owner wall unless standing repair authority exists | Stop for exact repair authorization, or use standing repair rule if granted. |
| Runtime, backend, CI, deployment, county, PACS, or secrets scope | any requested expansion beyond docs/governance lane | True owner wall | Stop immediately. |

## Where Codex Should Have Continued Automatically

Codex should continue without owner relay when all are true:

- the current `/goal` and `/loop` remain active,
- the Work Order remains docs/governance/evidence only,
- changed files remain inside authorized scope,
- validation passes,
- remote checks are green or still pending,
- review comments are inside the current file scope,
- the only hook failure is missing local Prettier or Vitest tooling covered by standing exception.

## True Authority Walls Preserved

The following remain owner authority walls:

- merge authority unless pre-authorized by the active loop,
- destructive cleanup not covered by an exact worktree repair rule,
- branch/merge strategy conflict,
- production deployment,
- secrets or credentials,
- county runtime, PACS, county SQL, live services, or production systems,
- runtime/backend/tools-sync/CI/deployment/county file changes,
- validation failure not remediable within scope,
- conflicting canon or architecture decision.

## Non-Claims

This audit does not authorize runtime automation, a GitHub app, a scheduler, direct deployment,
branch protection changes, or bypass of failed validation. It classifies process friction only.

STOP_TYPE: COURIER_FRICTION_AUDIT_COMPLETE

