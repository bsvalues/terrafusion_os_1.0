# WO-BRAIN-009 — Brain / Work-Order-Engine Integration Evidence Packet

**Program:** AI / Brain / Operator System (`GOAL-BRAIN-OPERATOR-001`)
**WO:** WO-BRAIN-009 — Brain/WOE Integration Evidence Packet
**Risk:** R0 discovery + R1 evidence/docs · **Base:** `origin/main 42ce3800`
**VERDICT:** **PARTIAL / INTEGRATION GAP** — the query + scoring surface is real and deterministic, but it
operates on a stale representative seed and is not wired to one current machine-readable live-state source;
continuation/wall doctrine is canonical (BRAIN-008) but not integrated into that source. Governance routing
had a BRAIN-008/009 drift, reconciled here. This closes the Brain Operator **evidence baseline** honestly —
it does **not** claim full live integration.

---

## 1. Evidence Matrix

| Surface | Artifact(s) | Real / deterministic? | Reflects the LIVE program graph? | Gap |
|---------|-------------|-----------------------|----------------------------------|-----|
| **Query** | `tools/wo-query.mjs` | ✅ yes — runs, deterministic output | ❌ no — reads the stale seed | query answers about a representative snapshot, not live state |
| **Scoring** | `scoring/next-work-order-scoring.rules.json` + wo-query | ✅ yes — deterministic (`WO-LOCALOPS-000` score 82) | ❌ no — scores stale-seed records | "next recommended" ≠ the live next WO |
| **Routing** | `WORK_ORDER_PROGRAM_QUEUE.md`, `PROGRAM_PLAYBOOK_REGISTER.md`, `goal-loop/GOAL_COMMANDS.md`, `goal-loop/COMMAND_TO_PROGRAM_MAP.md`, `programs/brain-operator-system.md` | ✅ yes (prose) | ⚠️ **PARTIAL** — QUEUE/REGISTER/GOAL_COMMANDS were current (BRAIN-009); `brain-operator-system.md` + `COMMAND_TO_PROGRAM_MAP.md` were stale (BRAIN-008) | cross-file drift → **reconciled in this WO** |
| **Walls** | `STOP_WALL_REGISTER.md`, `WORK_ORDER_PROGRAM_QUEUE.md` §Global Walls (Wall Ledger) | ✅ yes | ✅ yes (prose ledger) | not represented in the seed/query state |
| **Continuation** | `CONTINUATION_RULEBOOK.md` (WO-BRAIN-008) | ✅ yes — canonical | doctrine only | **not wired into the query/one machine-readable state source** |
| **Operator surfaces** | `NEXT_ACTION_MATRIX.md`, `goal-loop/LOOP_MODES.md`, `OPERATOR_EXECUTION_PLAYBOOK.md`, `GOAL_LOOP_AUTONOMY_RULES.md` | ✅ yes | ✅ yes (reconciled by BRAIN-008) | — |

**Bottom line:** every surface exists and the doctrine layer is now internally consistent (post-BRAIN-008),
but the **machine-readable** layer (seed → query → score) is a *representative snapshot*, decoupled from the
*live* prose graph. That decoupling is the integration gap.

## 2. Exact stale-registry / query result (recorded, read-only)

**Seed** (`registry/work-order-registry.seed.json`) — verified first-hand:
```
schemaVersion: 0.1.0
generatedBy:   WO-WOE-003
generatedAt:   2026-06-29T00:00:00Z
description:   "Representative seed registry for the TerraFusion Work Order Engine. Data only; no automation authority."
records:       12  → WO-WOE-000..008, WO-DEVOPS-006I, WO-BRAIN-0013, WO-LOCALOPS-000
                    WOE-003 status = in_progress
                    contains a stale `WO-BRAIN-0013` (complete); OMITS WO-BRAIN-008 and WO-BRAIN-009 entirely
```

**Query** (`node docs/brain/workorders/tools/wo-query.mjs --json`, default registry, authority R2) — verified:
```
activeLane:               "Work Order Engine"
completedWorkOrders:      [WO-WOE-001, WO-WOE-002, WO-DEVOPS-006I, WO-BRAIN-0013]
nextRecommendedWorkOrder: WO-LOCALOPS-000 — "Planning Envelope" — R1 — status ready — verdict eligible — score 82
```

**Contradiction with the live graph** (`WORK_ORDER_PROGRAM_QUEUE.md`): live active lane = **brain-operator /
WO-BRAIN-009**; WO-BRAIN-001..008 are **complete**; the seed's active lane, completed set, and "next
recommended" (`WO-LOCALOPS-000`) are all a June-29 representative snapshot, **not** the live next action.
The query is trustworthy about its input; its input is not the live graph.

## 3. Routing reconciliation performed (BRAIN-008/009 drift)

Verified stale-at-BRAIN-008 and corrected to the live BRAIN-009 truth:
- `programs/brain-operator-system.md` — `Status: ACTIVE at WO-BRAIN-008` and the WO table (BRAIN-008
  CURRENT / BRAIN-009 QUEUED) → BRAIN-008 COMPLETE / **BRAIN-009 the closing WO**; baseline closeout added.
- `goal-loop/COMMAND_TO_PROGRAM_MAP.md` — `program-next` and `brain-operator` rows + the brain WO table were
  at `WO-BRAIN-008` → advanced to **WO-BRAIN-009** and, on closeout, **portfolio reconciliation** (no
  preselected lane).
- `WORK_ORDER_PROGRAM_QUEUE.md` / `PROGRAM_PLAYBOOK_REGISTER.md` / `goal-loop/GOAL_COMMANDS.md` — BRAIN-009
  marked DONE; brain-operator evidence baseline closed; next = **portfolio reconciliation** (portfolio-operator
  selects), explicitly **not preselected**.

## 4. Honest closeout of the Brain Operator evidence baseline

`WO-BRAIN-001..009` establish the Brain Operator as **real operator doctrine** plus a **representative**
(not live) WO Engine query/scoring tool:
- **Proven:** deterministic query + scoring exist; goal/loop/continuation/wall/stop doctrine is canonical and
  internally consistent (BRAIN-008); routing prose is now cross-file consistent (this WO).
- **NOT proven / deferred (out of scope, explicitly blocked here):** wiring `wo-query`/scoring to a single
  **current** machine-readable state source (a live registry generated from the live queue), refreshing the
  June-29 seed, or changing the query/scoring/schema/`brain next`. Full live integration is a **future,
  separately-ratified** WO — this packet does not claim it done.

## 5. Next action

Route to **portfolio reconciliation** (activate `portfolio-operator`, which selects the next dependency-cleared
lane per `CONTINUATION_RULEBOOK.md`). **No lane is preselected here** — selection is the portfolio-operator's
job. Claude does not execute it.

---

**WO-BRAIN-009: COMPLETE (PARTIAL / INTEGRATION GAP).** Brain Operator evidence baseline closed honestly.
Next: portfolio reconciliation (Brain/Codex; not Claude's lane).
