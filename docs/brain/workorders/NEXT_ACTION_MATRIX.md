# Next Action Matrix

**Version:** 1.0
**Date:** 2026-07-01
**Authority:** WO-WOE-011
**Classification:** Operator Doctrine — deterministic "what to do next"

---

## Purpose

Given the current state (PR state, gate state, next-WO risk, wall presence), this matrix returns the
single correct operator action. It removes "should I ask the human?" as a judgment call — the answer
is computed.

---

## Primary Decision Table

Evaluate top-to-bottom; first matching row wins.

| # | Condition | Action |
|---|-----------|--------|
| 1 | Active WO's next step crosses a stop wall (SW-01..SW-10) | **STOP** at that wall. Emit `AUTHORITY_WALL`/`CANONICAL_CONFLICT`. `OPERATOR_ACTION_REQUIRED` set. |
| 2 | A gate failed and the failure is **outside** current WO scope | **STOP** — `FAILED_GATE` (SW-06). |
| 3 | A gate failed **inside** current WO scope | **RECOVER** — fix within scope (`/loop recovery`); not a wall. |
| 4 | Open PR is `BEHIND` main, auto-merge queued | `gh pr update-branch`; keep watching. |
| 5 | Open PR has unresolved bot/review threads blocking merge | Resolve in-scope threads (`resolveReviewThread`); keep watching. |
| 6 | Open PR gates pending | Wait, re-check; do not block on it — start next WO if independent. |
| 7 | PR merged AND `/loop program` active AND next WO same-risk + unblocked + in-register | **EXECUTE** next WO. Do not ask. |
| 8 | PR merged AND `/loop once` | **STOP** — name `NEXT_WO`, do not execute. |
| 9 | Next WO is higher-risk than current | **STOP** — surface; request authorization for the higher risk class. |
| 10 | Next WO not in register | **STOP** — do not invent. Propose adding it to the register (docs WO). |
| 11 | No unblocked WO remains AND loop is `/loop once`, `/loop evidence`, or `/loop discovery` | **STOP** — that mode's scope is complete; retain its existing stop semantics. Do **not** portfolio-reconcile. |
| 12 | No unblocked WO remains (or next crosses a wall) in a **regular** program under `/loop program` (within-program scope) | **STOP** — surface the wall / queue-exhaustion. Do **not** auto-jump to another program. |
| 13 | Active program is **portfolio-operator** AND its current lane walls or exhausts | **PORTFOLIO RECONCILE** — park the lane, select the next safe registered lane by Lane Priority (`AUTONOMOUS_CONTINUATION_GATE.md`); stop only at **ALL-LANES-PARKED**. |
| 14 | None of the above | Continue the loop procedure. |

Continuation / portfolio / stop scope is canonical in [CONTINUATION_RULEBOOK.md](CONTINUATION_RULEBOOK.md)
(WO-BRAIN-008): row 12 = within-program STOP; row 13 = portfolio-operator-only cross-program advance.

---

## Risk-Class Continuation Rule

`/loop program` continues only to **equal-or-lower** risk. Risk classes (low → high):

```
R0  read-only discovery / evidence (no writes)
R1  docs / registry / playbook authoring
R2  scoped code change with tests, no runtime/behavior expansion
R3  runtime behavior change (SW-09) — requires authorization
R4  deploy / data mutation / secrets / go-live (SW-01..SW-04, SW-10) — always a wall
```

A loop that starts at R1 may run R1 and R0 WOs freely. It **stops** before the first R3/R4 WO and
surfaces it. R2 continues only if the WO explicitly authorizes scoped code (as WO-P8-MGMT-003 did).

---

## PR Lifecycle Sub-Matrix (merge-watch)

| PR state | Action |
|----------|--------|
| `OPEN` + checks `PENDING` | wait; poll |
| `OPEN` + `BEHIND` | `gh pr update-branch` |
| `OPEN` + unresolved threads + `required_conversation_resolution` | resolve in-scope threads |
| `OPEN` + `MERGEABLE` + auto-merge on | let it fire; poll for `MERGED` |
| `OPEN` + a **required** gate FAILED | classify: in-scope → recover; out-of-scope → SW-06 stop |
| `MERGED` | advance to next WO (per primary table row 7/8) |

Bot reviewers seen in this repo: Copilot, Sourcery, Codex, CodeRabbit. Their unresolved threads are
**not** walls — resolve and continue.

---

## Honesty Gate (applies to every action)

Before emitting any number or "done", confirm: sourced from a live probe / passing gate / evidence
doc, not fabricated; no stale `89,247`; no stub agent counts; `unavailable` disclosed where true.
See [GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md).

---

## Current Instantiation (2026-07-01) — historical snapshot

> **Not live routing (CONTINUATION_RULEBOOK §7).** This table is a dated illustration of how the matrix
> resolved on 2026-07-01. For the live current node / next WO, read
> [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md) — not this snapshot.

| Program | Next WO | Matrix row | Action |
|---------|---------|-----------|--------|
| p8-management-dashboard | WO-P8-MGMT-004 (deployment authorization **packet** — docs, R1) | 7 | EXECUTE after #1125 merges |
| p8-management-dashboard | *actual frontend deploy* | 1 (SW-01) | STOP — authorization packet only |
| benton-data-quality | WO-DATA-BENTON-ADDR-001 (read-only audit, R0) | 7 | EXECUTE (no SW-02) |
| benton-data-quality | WO-DATA-BENTON-DUPE-001B (delete rows, R4) | 1 (SW-02) | STOP — parked |
| benton-demo | WO-DEPLOY-BENTON-003D (smoke/evidence rollup, R0/R1) | 7 | EXECUTE only if authorized (touches live surface) |
| work-order-engine | WO-WOE-012 (autonomous continuation gate, R1) | 7 | EXECUTE |
