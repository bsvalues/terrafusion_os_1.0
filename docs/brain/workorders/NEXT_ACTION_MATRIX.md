# Next Action Matrix


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
**Version:** 1.1
**Date:** 2026-07-13
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
| 1 | Active program is **portfolio-operator** AND its current lane walls or exhausts | **PORTFOLIO RECONCILE** — park the lane, select the next authorized registered lane by Lane Priority (`AUTONOMOUS_CONTINUATION_GATE.md`); stop only at **ALL-LANES-PARKED**. |
| 2 | Active WO's next step crosses an unresolved stop wall (SW-01..SW-10) in a regular program | **STOP** at that wall. Emit `AUTHORITY_WALL`/`CANONICAL_CONFLICT`. `OPERATOR_ACTION_REQUIRED` set. |
| 3 | A gate failed and the failure is **outside** current WO scope | **STOP** — `FAILED_GATE` (SW-06). |
| 4 | A gate failed **inside** current WO scope | **RECOVER** — fix within scope (`/loop recovery`); not a wall. |
| 5 | Open PR is `BEHIND` main, auto-merge queued | `gh pr update-branch`; keep watching. |
| 6 | Open PR has unresolved bot/review threads blocking merge | Resolve in-scope threads (`resolveReviewThread`); keep watching. |
| 7 | Open PR gates pending | Wait, re-check; do not block on it — start next WO if independent. |
| 8 | PR merged AND `/loop program` active AND next WO is in the same active program, unblocked, in-register, and inside recorded authority | **EXECUTE** next WO. Cross-program advancement requires portfolio-operator row 1. Do not ask. |
| 9 | PR merged AND `/loop once` | **STOP** — name `NEXT_WO`, do not execute. |
| 10 | Next WO exceeds the current authority ceiling | **STOP** — request only the missing risk/system/file/action authority. A higher numeric risk already granted by the active record is not a new wall. |
| 11 | Next WO not in register | **STOP** — do not invent. Propose adding it to the register (docs WO). |
| 12 | No unblocked WO remains AND loop is `/loop once`, `/loop evidence`, or `/loop discovery` | **STOP** — that mode's scope is complete; retain its existing stop semantics. Do **not** portfolio-reconcile. |
| 13 | No unblocked WO remains (or next crosses a wall) in a **regular** program under `/loop program` (within-program scope) | **STOP** — surface the wall / queue-exhaustion. Do **not** auto-jump to another program. |
| 14 | None of the above | Continue the loop procedure. |

Continuation / portfolio / stop scope is canonical in [CONTINUATION_RULEBOOK.md](CONTINUATION_RULEBOOK.md)
(WO-BRAIN-008, reconciled by WO-MAO-001): row 13 = within-program STOP; row 1 =
portfolio-operator-only cross-program advance.

---

## Risk-Class Continuation Rule

Risk classes use the canonical Work Order data model (low → high):

```
R0  read-only discovery / evidence (no writes)
R1  docs / registry / playbook authoring
R2  local developer tooling
R3  CI / governance / hooks / policy tooling
R4  runtime or application behavior
R5  production / security / secrets / protected data / release / deployment
```

A loop continues only inside the risk ceiling and systems explicitly recorded by its Goal, Loop, and
Work Orders. A numeric increase is allowed when that authority was already granted; otherwise it is a
true wall. R4 and R5 are never entered by implication.

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
