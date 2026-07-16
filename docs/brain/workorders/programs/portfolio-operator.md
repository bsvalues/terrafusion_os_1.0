# Portfolio Operator Program

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Status:** Governing portfolio continuation baseline

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

At `origin/main` `14221dbda0e4a916ef4ea2937b1ca82623ead39b`, WO-PORTFOLIO-002 selected
`WO-AZURE-002 - App settings and secret inventory` as the highest-priority dependency-cleared node.
PR #1275 completed WO-AZURE-001 and routes configuration key-name, source-class, storage-posture, and
ownership documentation to WO-AZURE-002 without live Azure or secret access.

No deployment lane is preselected. The live result is recorded in
[`WO-PORTFOLIO-002-CURRENT-STATE-RECONCILIATION.md`](../evidence/WO-PORTFOLIO-002-CURRENT-STATE-RECONCILIATION.md).

STOP_TYPE: `NEXT_PROGRAM_SELECTED`
