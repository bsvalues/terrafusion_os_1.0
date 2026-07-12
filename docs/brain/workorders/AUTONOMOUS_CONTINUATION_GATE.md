# Autonomous Same-Risk Continuation Gate

**Version:** 1.0
**Date:** 2026-07-01
**Authority:** WO-WOE-012
**Classification:** Operator Doctrine — cross-program continuation logic
**Builds on:** [GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md) (within-program),
[STOP_WALL_REGISTER.md](STOP_WALL_REGISTER.md), [NEXT_ACTION_MATRIX.md](NEXT_ACTION_MATRIX.md).

> **Scope (WO-BRAIN-008):** this gate — park the walled lane and advance to the next safe lane — governs
> the **portfolio scope only** (the **portfolio-operator** program). It is **not** what a regular
> program's `/loop program` does; that stops at its wall. This document is the *procedure* for the
> portfolio scope and defers to [CONTINUATION_RULEBOOK.md](CONTINUATION_RULEBOOK.md) for the scope
> boundary. The example ledger below is a historical snapshot, not live routing (rulebook §7).

---

## 0. What This Adds

WOE-011 made the operator run **within** a program's same-risk queue until a wall. WOE-012 makes the
operator **cross programs**: when the active program hits a wall or exhausts its safe queue, the
operator **records the wall, parks the blocked WO, and advances to the next safe unblocked lane** —
without asking the human to choose. The human is the authority wall, not the dispatcher.

This codifies the behavior proven on 2026-07-01: five programs run in sequence
(p8-management-dashboard → benton-data-quality → backend-excellence → property-workbench →
terrapilot-maturity), each stopping only at its real wall or exhausting its R0 queue, 11 PRs, zero
"what next?" prompts between safe work.

---

## 1. The Gate (algorithm)

On any program reaching a terminal condition (`WALL` or `QUEUE_EXHAUSTED`):

```
1. RECORD   append the wall/exhaustion to the Wall Ledger (§3) with WO id, wall, evidence.
2. PARK     mark the blocked WO parked (do not attempt to cross the wall to stay busy).
3. SELECT   choose the next lane by Lane Priority (§2):
              - only programs whose next WO is UNBLOCKED and SAME-RISK-OR-LOWER and crosses NO wall.
4. ADVANCE  set that program as active; run its queue (WOE-011 within-program loop).
5. REPEAT   until no safe lane remains.
6. TERMINATE when every program is walled/exhausted → emit the All-Lanes-Parked report (§4) and stop.
             This is the ONLY legitimate full stop of an autonomous run.
```

`OPERATOR_ACTION_REQUIRED: NONE` at every step except TERMINATE, where it lists the parked walls the
human may authorize.

---

## 2. Lane Priority (deterministic selection)

Among programs with a safe, unblocked next WO, select in this order:

1. **Lowest risk class first** — use the canonical WOE R0-R5 execution model. Selection may identify
   a higher-risk candidate, but it never grants missing authority to execute it.
2. **Continuity** — prefer a lane that directly extends the finding just produced (e.g. after a
   Pilot-stub finding, the terrapilot-maturity lane). Continuity keeps evidence coherent.
3. **Dependency readiness** — prefer lanes whose prerequisites are merged/done.
4. **Register order** — tie-break by Program Playbook Register position.

If two lanes tie, pick the first by register order and note the alternative in the result block.

**Never** select a lane to "stay busy" if its only next WO crosses a wall. A walled lane is parked,
not entered.

---

## 3. Wall Ledger (the record)

Every parked wall is recorded so the human sees the full authorization backlog at once. Canonical
live copy lives in [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md) §"Global Walls".

Ledger row = `program | parked WO | wall (SW-xx) | one-line reason | evidence`.

Example (state at 2026-07-01):

| Program | Parked WO | Wall | Reason | Evidence |
|---------|-----------|------|--------|----------|
| p8-management-dashboard | MGMT-005 frontend deploy | SW-01/SW-10 | deploy SPA + auth posture | WO_P8_MGMT_004_* |
| benton-data-quality | DUPE-001B delete 30 rows | SW-02 | data mutation | WO_DATA_BENTON_DUPE_001 |
| benton-data-quality | quarantine classification | SW-03 | credentialed DB read | GEOM/OWNER/IMPR-LAND-001 |
| backend-excellence | BACKEND-004/005/006 | SW-09/SW-10 | health/config/auth code | WO_BACKEND_001_* |
| property-workbench | SPA deploy / pilot runtime | SW-01/SW-09 | reachability + runtime | WO_WORKBENCH_001_010_* |
| terrapilot-maturity | first-tool L3 promotion | SW-01/SW-09/SW-10 | deploy runtime + integrate | WO_TERRAPILOT_P3_P6_* |

---

## 4. All-Lanes-Parked Terminal Report

When no safe lane remains, emit ONE consolidated report (and stop — the loop is legitimately done):

```
RESULT:                   ALL_LANES_PARKED
GOAL:                     <last active>
LOOP_MODE:                program
LANES_RUN:                <programs completed/exhausted this run>
WALL_LEDGER:              <the §3 table>
PR_QUEUE:                 <open PRs + states>
MERGED:                   <PRs merged this run>
NEXT_UNBLOCK_OPTIONS:     <ranked list of walls the human may authorize, each with the WO it unblocks>
OPERATOR_ACTION_REQUIRED: authorize one or more walls to reopen a lane (else the run is complete)
```

This is the correct place to surface the authorization backlog — not a per-safe-WO prompt.

---

## 5. Guardrails (do NOT)

- **Do not cross a wall** (SW-01..SW-10) to keep advancing. A wall parks the lane.
- **Do not invent WOs** to manufacture a safe lane. Only Program Playbook Register nodes are legal.
- **Do not downgrade a wall** (e.g. call a runtime change "just a small edit") to enter it.
- **Do not loop forever** — if a lane produces no new safe WO across one full pass, mark it exhausted.
- **Honesty invariants still hold** (no fabricated numbers, no stale 89,247, disclose `unavailable`).
- **Merge-watch is in-scope** between lanes (resolve bot threads, update behind branches); it is not a wall.

---

## 6. Relationship to the Doctrine Layer

| Concern | Doc |
|---------|-----|
| Within-program continuation | [GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md) |
| **Cross-program advance (this gate)** | **AUTONOMOUS_CONTINUATION_GATE.md** |
| Per-loop procedure + result block | [OPERATOR_EXECUTION_PLAYBOOK.md](OPERATOR_EXECUTION_PLAYBOOK.md) |
| Deterministic next action | [NEXT_ACTION_MATRIX.md](NEXT_ACTION_MATRIX.md) |
| The walls | [STOP_WALL_REGISTER.md](STOP_WALL_REGISTER.md) |
| Live cross-program state + ledger | [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md) |

---

## 7. Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-07-01 | Continuation gate authored; codifies 5-lane autonomous run | WO-WOE-012 |

---

**WO-WOE-012: COMPLETE.** Next in program: WO-WOE-013 (Program Queue UI/Report), WO-WOE-014
(Cross-Program Dependency Graph).
