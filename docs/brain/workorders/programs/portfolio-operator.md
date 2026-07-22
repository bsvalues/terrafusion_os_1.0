# Portfolio Operator Program

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Status:** Five-suite program active at WO-SR-005C-C

## Purpose

Select and activate the highest-priority dependency-cleared program whenever an active program
closes. The owner is an authority wall, not the dispatcher between completed programs.

## Selection Algorithm

1. Fetch and reconcile current `origin/main`.
2. Read the program register, active playbook, command map, program queue, wall ledger, and
   cross-program dependency graph.
3. Exclude completed, superseded, dependency-blocked, parked, and authority-gated next nodes.
4. Rank executable nodes by risk, continuity, dependency readiness, and register order.
5. Activate the highest-ranked program goal and loop.
6. Start its first dependency-cleared Work Order and continue until a true wall or program closeout.
7. On closeout, repeat portfolio reconciliation instead of returning a next-program selection stop.

## Standing Delivery Authority

`OWNER-TF-STANDING-OPERATOR-AUTHORITY` continuously authorizes routine delivery mechanics for every
already-ratified program and dependency-cleared Work Order inside its separate scope. The operator
owns worktrees, implementation judgment, validation, commits, pushes, PRs, exact-head assurance,
review remediation, eligible squash merges, post-merge verification, closeout, and continuation.

The grant does not make any parked node executable. A new program, protected boundary, destructive
action, or other true wall still requires its own authority.

## Valid Portfolio Stops

- canonical backlog genuinely empty;
- every remaining node dependency-blocked;
- every remaining node requires production, county, PACS, secret, deployment, schema, or protected
  resource authority;
- two top candidates create a real strategic conflict; or
- canon cannot establish a valid next lane.

`NEXT_PROGRAM_SELECTION_REQUIRED` is not a valid stop when an executable canonical node exists.

## Current Reconciliation

> **Snapshot, not live routing (CONTINUATION_RULEBOOK §7).** This section records the selection at a point
> in time. The authoritative live "current node / next WO" is
> [WORK_ORDER_PROGRAM_QUEUE.md](../WORK_ORDER_PROGRAM_QUEUE.md); if this snapshot disagrees, the queue wins.

WO-PORTFOLIO-013 classified WO-LOCAL-093 through WO-LOCAL-097 as cross-project WilliamOS/TerraGroq
work, preserved their documents as historical audit material, removed them from TerraFusion
executable routing, and withdrew proposed WO-LOCAL-098. No TerraFusion capability was delivered by
those Work Orders and no authority transfers to the foreign project.

After that correction, the ratified Five-Suite Federated Repository Buildout remains active.
WO-SR-003 and WO-SR-004 created, bootstrapped, checked, and protected all five suite repositories.
WO-SR-005B-I implemented and hash-froze the Atlas read boundary without runtime adoption.
WO-SR-005B-A selected the safe canonical adapter source and admitted the two-repository E1/E2
implementation sequence. WO-SR-005B-E1 completed the pure unwired adapter with 30 passing tests and
a zero-warning solution build. WO-SR-005B-E2 merged the standalone synthetic parity harness in
Atlas PR #1. WO-SR-005B-E3 rejected direct source copying because no sovereign candidate has a clean
suite-only boundary. WO-SR-005B-F1 merged the built-fresh standalone projection foundation in Atlas
PR #2 without runtime adoption. WO-SR-005C-P verified county-isolated Dais workflow truth and
selected appeals as the first contract cohort. WO-SR-005C-C is the dependency-cleared docs/evidence
decomposition slice; Dais extraction/implementation and protected resources remain blocked.

STOP_TYPE: `ACTIVE_PROGRAM_EXECUTING`
