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

## Current Selection

> **Snapshot, not live routing (CONTINUATION_RULEBOOK §7).** This section records the selection at a point
> in time. The authoritative live "current node / next WO" is
> [WORK_ORDER_PROGRAM_QUEUE.md](../WORK_ORDER_PROGRAM_QUEUE.md); if this snapshot disagrees, the queue wins.

At `origin/main` `d0e8eb57bec3b34f5f52b68dd9b468c7ce3ab008`, the lowest-risk executable node is
`WO-BRAIN-009 - Brain Operator integration evidence / closeout`:

- Brain Operator System has advanced through `WO-BRAIN-008`; `WO-BRAIN-001` … `WO-BRAIN-008` are all
  complete (`WO-BRAIN-001` in PR #1140, `WO-BRAIN-005` in PR #1265, `WO-BRAIN-008` produced the canonical
  `CONTINUATION_RULEBOOK.md`). `WO-BRAIN-009` is the current dependency-cleared node with merged
  prerequisites and no active wall.
- DevEx Hook Bootstrap is complete through `WO-DEVEX-HOOKS-006`; Work Order Engine WOE-012 and WOE-014
  are complete, WOE-013 is an R2 UI soft wall.
- Deployment, county runtime, data mutation, TerraPilot promotion, runtime import, and product
  behavior lanes remain parked at explicit walls.

STOP_TYPE: `NEXT_PROGRAM_SELECTED`
