# WO-MAO-006 - Portfolio Rollout

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Base:** `d08dd16ebfde5bd96ee3830a0eb9bff91cce74b8`
**Risk:** `R3`
**Merge mode:** `B-bounded-program-envelope`
**Status:** In progress

## Objective

Apply the proven MAO operating model across portfolio classes without inventing executable work,
crossing the active envelope, or claiming cross-repository readiness that does not exist. Establish
the concurrency budget, allocation map, cross-repository schedule, status surface, owner brief
cadence, and incident/rollback procedure required for measured closeout.

## Atomic Transition

- PR #1287 closed WO-MAO-005 at exact head `3ac224136a162440ea8376c15213c9e46a135fbe`
  and merge commit `d08dd16ebfde5bd96ee3830a0eb9bff91cce74b8`.
- `OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE` remains the only active MAO authority.
- Amendment 001 durably authorizes the transition regression through WO-MAO-007 without changing
  planner behavior.
- WO-MAO-005 is complete; WO-MAO-006 is active; WO-MAO-007 is next.

## Rollout Boundary

- Mutable worker ceiling: 2, matching the canonical planner default.
- Effective current MAO mutable capacity: 1, because MAO-006 and MAO-007 are dependency-linear.
- Read-only assurance and monitoring are separate roles, not additional mutable-worker claims.
- The live seed planner currently returns no executable wave because candidate reservation inputs
  are invalid or absent. This is fail-closed evidence, not proof that the portfolio has no work.
- Cross-repository allocation remains blocked until exact path canon, repository-qualified planning,
  and reservation aggregation are separately authorized and proven.

## Completion Contract

- the evidence packet records the concurrency budget and current utilization honestly;
- suite, OS/governance, infrastructure, security, and release allocation dispositions are explicit;
- the cross-repository schedule identifies every prerequisite and performs no dispatch;
- the portfolio status surface distinguishes operator state, evidence, authority, and unknowns;
- routine owner couriering is excluded from the brief cadence;
- incident containment, suspension, protected revert, and recovery are documented;
- planner/query contradictions and post-merge advisory publishing incidents are not hidden;
- no runtime, product, CI, deployment, county, PACS, SQL, secret, or cross-repository change occurs.

## Validation

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `node docs/brain/workorders/tools/wo-wave-plan.mjs --json --authority R3 --max-workers 2`
- `node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs`
- exact authorized-file scope, reservation gate, independent exact-head assurance, required remote
  checks, and zero unresolved threads

STOP_TYPE: MAO_006_PORTFOLIO_ROLLOUT_READY
