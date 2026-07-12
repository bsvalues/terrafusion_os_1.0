# WO-BRAIN-008 — Autonomous Continuation Rulebook Reconciliation (Evidence)

**Program:** AI / Brain / Operator System (`GOAL-BRAIN-OPERATOR-001`)
**WO:** WO-BRAIN-008 — Autonomous Continuation Rulebook Reconciliation
**Risk:** R1 (docs/governance) · **Base:** `origin/main d0e8eb57`
**Result:** PASS — one canonical continuation rulebook authored; the divergent continuation/stop/routing
statements are reconciled to it; routing advanced to WO-BRAIN-009.

---

## 1. Problem (discovery)

Two doctrines diverged on what `/loop program` does at a wall:

- **WOE-012 / `AUTONOMOUS_CONTINUATION_GATE.md`:** on a wall/exhaustion the operator **parks the lane and
  advances** to the next safe lane; stop only at all-lanes-parked.
- **WOE-010/011 / `LOOP_MODES.md` + `NEXT_ACTION_MATRIX.md`:** `/loop program` **stops at the first wall**.
- **`programs/work-order-engine.md`:** "the operator always makes the final call on which WO to execute
  next" — conflicts with automatic same-risk portfolio selection.
- No explicit boundary between **program-scoped** `/loop program` and **portfolio-scoped** continuation.
- `Current Selection` / `Current Instantiation` prose was being read as **live routing**.

## 2. Resolution

Authored the canonical **`CONTINUATION_RULEBOOK.md`** (WO-BRAIN-008). Core model:

1. **Three scopes** decide whether a wall means STOP or PARK-AND-ADVANCE — by which program is active:
   - **within-program** (`/loop program` on a regular program) → **STOP** at its wall;
   - **portfolio** (`/loop program` on the **portfolio-operator** program) → **park + advance**, stop only
     at ALL-LANES-PARKED;
   - **bounded** (`/loop once` \| `evidence` \| `discovery` \| `merge-watch` \| `recovery`) → stop at the
     mode's boundary; never portfolio-reconcile.
2. **When continuation stays inside a program** — the six same-risk/no-wall conditions.
3. **When portfolio reconciliation occurs** — portfolio-operator program only; the GATE algorithm is its
   procedure.
4. **How walls park lanes** — record in the Wall Ledger; never cross; STOP (within-program) vs
   park-and-advance (portfolio).
5. **When to truly STOP** — table incl. "human is the authority wall, not the per-WO dispatcher".
6. **Authoritative vs historical** — live routing = `WORK_ORDER_PROGRAM_QUEUE.md` +
   `PROGRAM_PLAYBOOK_REGISTER.md` + this rulebook; `Current Selection`/`Current Instantiation`/example
   prose are **snapshots**, not live routing.

## 3. Files changed (all docs/governance, R1)

| File | Change |
|------|--------|
| `CONTINUATION_RULEBOOK.md` | **new** — canonical rulebook (scopes, reconcile, walls, stop, authority) |
| `goal-loop/LOOP_MODES.md` | `/loop program` scope note → within-program; cross-program is portfolio-operator's |
| `AUTONOMOUS_CONTINUATION_GATE.md` | scope banner → governs the portfolio scope only; defers to rulebook |
| `NEXT_ACTION_MATRIX.md` | split reconcile rows: within-program STOP (row 12) vs portfolio-operator advance (row 13); marked §Current Instantiation as a snapshot |
| `programs/work-order-engine.md` | superseded "operator always makes the final call" with the authority-wall model |
| `WORK_ORDER_PROGRAM_QUEUE.md` | BRAIN-008 → DONE, **BRAIN-009 CURRENT**; operator note reconciled |
| `goal-loop/GOAL_COMMANDS.md` | brain state → BRAIN-009 |
| `PROGRAM_PLAYBOOK_REGISTER.md` | portfolio → Brain `WO-BRAIN-009`; brain current → `WO-BRAIN-009` |
| `programs/portfolio-operator.md` | Current Selection → BRAIN-009 + snapshot banner |

## 4. Validation

Docs/governance only — no runner, scheduler, queue-service, CLI, schema, runtime, CI, package, deploy,
data, secrets, PACS, county, or product change. `git diff --check` clean. Cross-file routing now
consistent (QUEUE + GOAL_COMMANDS + REGISTER + portfolio-operator all show BRAIN-008 DONE / BRAIN-009
CURRENT). WO-BRAIN-009 NOT executed (out of scope). `codex/brain-005-loop-maturity` not deleted.

## 5. Disposition

**WO-BRAIN-008: COMPLETE.** Next: **WO-BRAIN-009** (Brain Operator integration evidence / closeout) —
Brain/Codex lane, not Claude's. After merge, Claude returns to PARKED.
