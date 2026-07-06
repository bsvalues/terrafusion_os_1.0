# WO-CLAUDE-NEXT-004 — Park Packet (Owner Decision Required)

**Goal:** GOAL-TF-CLAUDE-NEXT-LANE-RATIFICATION-001
**WO:** WO-CLAUDE-NEXT-004 — Next Goal Packet or Park Packet
**Category:** Documentation (owner-decision packet)
**Depends on:** WO-CLAUDE-NEXT-002/003

Ratification check (NEXT-003) result: **no lane is ratified for Claude now** → this is a **park packet**, not an
executable `/goal + /loop`.

---

## 1. Why park

- Brain head recommendation = **queue[0] ServiceRegistry** (backend) → not Claude's frontend/docs scope; Codex-adjacent.
- Codex Backend OE is **active** (#1233).
- The Claude-appropriate frontend lanes are **not at the Brain head**; Claude promoting them would override Brain
  sequencing.

## 2. Owner decision required (choose one)

**Option A — Park (default).** No Claude execution; wait for Codex Backend OE to close or for the operator to ratify a
lane. Consistent with the standing posture and the Brain queue head.

**Option B — Run `pnpm brain next`.** Let the Brain formally dispatch the true next WO. Per the current backlog that is
ServiceRegistry (backend) — a Codex/backend lane, likely **not** Claude's; if so, it routes to Codex, and Claude stays
parked.

**Option C — Explicitly ratify a Claude-appropriate non-head lane.** Two clean, non-overlapping, frontend/docs-only
candidates the operator could authorize (each currently "why not yet" per the Brain):

| Ratifiable lane | Shape | Allowed files | Blocked | Stop walls | Non-overlap w/ Codex |
|-----------------|-------|---------------|---------|-----------|:--------------------:|
| **C1. Dock/top-bar launch-surface truth sweep** (Brain queue[2]) | run frontend launch-surface + shell-truth vitest batches; record an evidence note; classify failures mine-vs-fleet-vs-stale | `__tests__/**` (run only) + `docs/audit/**` | shell **routing** changes (R4 → stop) | fix needs shell routing / fleet-owned file | ✅ frontend, no backend |
| **C2. Dais fake-green stub-test honesty** (WO-0001) | replace 34 fake-green Dais stub tests with real assertions | `__tests__/**` + `docs/audit/**` | Dais component behavior change | real behavior/route change needed | ✅ frontend tests |

Both need explicit ratification because they are **not** the Brain's head item.

## 3. If Option C is chosen — packet skeleton (not executed here)

```
/goal create GOAL-TF-WB-<C1|C2>-001
/loop run  LOOP-...
Allowed: frontend/apps/os-shell/src/__tests__/** ; docs/audit/**
Blocked: backend/** ; tools/registry/** ; route/window impl ; package/build/CI ; PACS/county ; Codex Backend OE ; --admin / hook bypass
Validation: Frontend Gate + Vitest (if tests change) ; git diff --check ; scope ; review resolved
STOP if a fix requires component behavior / routing / backend.
```

## 4. Non-overlap proof with Codex Backend OE

Codex Backend OE (#1233, `WO-BACKEND-OE-*`, `backend/**`) is disjoint from every Option-C candidate (`__tests__/**` +
`docs/audit/**`). No file/path overlap.

## 5. Recommendation

**Option A (park)** by default, with **Option C1 (dock/top-bar sweep)** as the highest-value ratifiable Claude lane if the
owner wants a small non-overlapping win while Backend OE continues.

**Docs-only. No execution in this WO.**
