# Portfolio Operator Program

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Status:** Active at `WO-ATLAS-003` - map renderer contract decision

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

At `origin/main` `f2816c2740a0cc92b2442635d6c4673850c64a58`, WO-ATLAS-003 retains `mapbox-gl` 3.20.0 as the
supported current renderer baseline. No live ADR or dependency canonizes MapLibre, and stale PR #1073
is not a safe migration vehicle. Any future renderer change must start from current main and prove the
provider, glyph, attribution, security, test, package, and rollback contract across every current map
surface.

`WO-ATLAS-004 - GeoForge Popup Content Safety Audit` is next as a docs-only security inventory.

STOP_TYPE: `ATLAS_RENDERER_CONTRACT_DECIDED_POPUP_SAFETY_AUDIT_NEXT`
