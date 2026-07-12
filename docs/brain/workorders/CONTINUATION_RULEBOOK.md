# Autonomous Continuation Rulebook (Canonical)

**Version:** 1.0
**Date:** 2026-07-12
**Authority:** WO-BRAIN-008 — Autonomous Continuation Rulebook Reconciliation
**Classification:** Operator Doctrine — the single source of truth for continuation, portfolio
reconciliation, wall parking, true-stop, and file authority.

> **This file is authoritative** for the semantics it defines. Where any other governance file states
> a continuation / stop / routing rule that conflicts with this rulebook, **this rulebook wins** and the
> other file is to be read as building-on (procedure/examples) or historical (snapshot), not overriding.
> Reconciled files: [LOOP_MODES.md](goal-loop/LOOP_MODES.md),
> [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md),
> [NEXT_ACTION_MATRIX.md](NEXT_ACTION_MATRIX.md),
> [programs/work-order-engine.md](programs/work-order-engine.md),
> [GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md).

---

## 1. Why this exists

Two prior doctrines diverged. WOE-011 / LOOP_MODES made `/loop program` run a **single program's**
same-risk queue and **STOP at its first wall**. WOE-012 / AUTONOMOUS_CONTINUATION_GATE made the operator
**cross programs** on a wall — park the lane and advance to the next safe lane, stopping only when every
lane is parked. Read literally, one says "stop at the wall" and the other says "advance past it." This
rulebook removes the ambiguity by defining **scopes**: the same wall means STOP in one scope and
PARK-AND-ADVANCE in another. Which behavior applies depends on **which program is active**, never on a
guess.

---

## 2. The three continuation scopes (the unambiguous boundary)

| Scope | Active program | On the active program's wall / queue-exhaustion | True stop |
|-------|----------------|--------------------------------------------------|-----------|
| **Within-program** | any regular program under `/loop program` | **STOP** and surface the wall (result block names it) | at the first wall / risk-up / exhaustion |
| **Portfolio** | the **portfolio-operator** program (`GOAL-PORTFOLIO-OPERATOR-001`) under `/loop program` | **PARK** the lane in the Wall Ledger and **ADVANCE** to the next safe lane (Lane Priority) | only at **ALL-LANES-PARKED** |
| **Bounded** | any program under `/loop once` \| `/loop evidence` \| `/loop discovery` \| `/loop merge-watch` \| `/loop recovery` | stop at that mode's own boundary | per the mode; **never** portfolio-reconcile |

**Key rule:** cross-program advance (portfolio reconciliation) is the **portfolio-operator program's job
only**. A regular program's `/loop program` never silently jumps to a different program on a wall — it
stops and surfaces. To continue across programs, the operator activates the portfolio-operator program
(`/goal portfolio-operator` + `/loop program`), which is where the AUTONOMOUS_CONTINUATION_GATE algorithm
runs. `/loop once`, `/loop evidence`, and `/loop discovery` **never** reconcile the portfolio.

---

## 3. When continuation stays INSIDE a program

Under `/loop program` on a regular program, continue to the next WO only when ALL hold:

1. the current WO has a COMPLETED result with evidence;
2. the next WO is in the **same** active program;
3. the next WO's risk class is **equal to or lower** than the current WO (R0 ≤ R1 ≤ R2; never auto-cross
   into R3+/a wall — see [risk classes in LOOP_MODES.md](goal-loop/LOOP_MODES.md));
4. all dependencies are satisfied (required PRs merged, prerequisite WOs done);
5. the next WO crosses **no** authority wall (SW-01..SW-10);
6. no conflicting canon and no failed out-of-scope validation gate.

If any item is uncertain, downgrade to `/loop once` or `/loop stop`.

---

## 4. When PORTFOLIO reconciliation occurs

**Only** under the portfolio-operator program. When the (regular) lane it activated reaches `WALL` or
`QUEUE_EXHAUSTED`, the portfolio-operator loop:

```
1. RECORD  the wall/exhaustion in the Wall Ledger (WORK_ORDER_PROGRAM_QUEUE.md §Global Walls).
2. PARK    the blocked WO (never cross the wall to stay busy).
3. SELECT  the next lane by Lane Priority: lowest-risk-first → continuity → dependency-readiness →
           register order — only lanes whose next WO is UNBLOCKED, SAME-RISK-OR-LOWER, crossing NO wall.
4. ADVANCE run that lane's within-program queue (§3).
5. REPEAT  until no safe lane remains.
6. STOP    at ALL-LANES-PARKED — the only legitimate full stop of a portfolio run.
```

See [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) for the full algorithm, Lane
Priority detail, and the All-Lanes-Parked report; it is the **procedure** for this scope and defers to
this rulebook for the scope boundary.

---

## 5. How walls park lanes

A wall (`SW-01..SW-10`, or any R3+/deploy/data/secret/runtime/CI/schema/product change) **parks the
lane** — it is never crossed to keep working:

- **RECORD** it in the Wall Ledger: `program | parked WO | wall | one-line reason | evidence`.
- **PARK** the blocked WO; do not downgrade the wall ("just a small edit") to enter it; do not invent a
  WO to manufacture a safe lane.
- **Within-program scope:** the wall is a **STOP** — emit the result block that names the wall and set
  `OPERATOR_ACTION_REQUIRED`.
- **Portfolio scope:** the wall is a **PARK-AND-ADVANCE** — the lane is parked and the next safe lane is
  selected; the human sees the whole authorization backlog once, at ALL-LANES-PARKED.

---

## 6. When the operator must truly STOP

| Situation | Stop? |
|-----------|-------|
| Within-program `/loop program` hits a wall / risk-up / queue-exhaustion / failed out-of-scope gate | **STOP** — surface the wall |
| Portfolio run: a lane walls | do **not** stop — park + advance |
| Portfolio run: ALL lanes parked/exhausted | **STOP** — All-Lanes-Parked report |
| Bounded mode reaches its scope boundary | **STOP** per that mode |
| Human authority wall (R3+, deploy, data, secrets, PACS, county, new external service) | **STOP** — always |
| Merge requires human authority not already granted | **STOP** |
| Conflicting canon, or an honesty invariant would be violated | **STOP** |

**The human is the authority wall, not the per-WO dispatcher.** Safe, same-risk continuation *inside the
active scope* is automatic and must not prompt "what next?". The human decides only at walls, risk-class
increases, ALL-LANES-PARKED, merge-authority gaps, or canon conflicts. (This supersedes the older
"the operator always makes the final call on which WO to execute next" line in
[work-order-engine.md](programs/work-order-engine.md), which predates the continuation gate.)

---

## 7. Authoritative files vs historical snapshots

To stop stale prose from acting as live routing:

- **LIVE ROUTING (authoritative):**
  - [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md) — the current node, per-program queue
    states, and the Wall Ledger. **This is the live "what is active / what is next" source.**
  - [PROGRAM_PLAYBOOK_REGISTER.md](PROGRAM_PLAYBOOK_REGISTER.md) — structural program definitions + each
    program's current/next node.
  - This rulebook — continuation/stop/reconcile **semantics**.
- **HISTORICAL SNAPSHOTS (NOT live routing):** any `Current Selection`, `Current Instantiation`, dated
  example, or "state at <date>" prose in `programs/*.md` (incl. `portfolio-operator.md`),
  `NEXT_ACTION_MATRIX.md` §Current Instantiation, and the AUTONOMOUS_CONTINUATION_GATE examples/ledger.
  They illustrate a past state for context and **must not be followed as the next action**. When such a
  snapshot disagrees with the live queue, **the live queue wins** and the snapshot is stale.

Rule for operators/tooling: resolve "what is the current node / next WO" from the **live queue**, never
from a `Current Selection` line.

---

## 8. Reconciliation table (what this supersedes)

| Prior statement | File | Reconciled reading |
|-----------------|------|--------------------|
| `/loop program` "stops at authority wall" | LOOP_MODES.md | True for **within-program** scope; in **portfolio** scope the wall parks-and-advances (§2, §5). |
| Operator crosses programs on a wall, stopping only at all-lanes-parked | AUTONOMOUS_CONTINUATION_GATE.md | Applies to the **portfolio-operator** program only, not every `/loop program` (§2, §4). |
| Row 1 "next step crosses a wall → STOP"; row 12 portfolio-reconcile | NEXT_ACTION_MATRIX.md | Row 1 is within-program STOP; portfolio-reconcile fires only when the **active program is portfolio-operator** (§2). |
| "The operator always makes the final call on which WO to execute next" | work-order-engine.md | Superseded — human is the authority wall, safe same-risk continuation is automatic (§6). |
| `Current Selection` / `Current Instantiation` prose | programs/*.md, NEXT_ACTION_MATRIX.md | Historical snapshots, not live routing (§7). |

---

## 9. Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-07-12 | Continuation rulebook authored; reconciles WOE-010/011/012 + matrix + WO-engine into one canonical scope/stop/routing model | WO-BRAIN-008 |

---

**WO-BRAIN-008: COMPLETE.** Next in program: **WO-BRAIN-009** (Brain Operator integration evidence /
closeout). See [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md).
