# WO-CLAUDE-QUEUE-003 — Next Goal Selection Packet

**Goal:** GOAL-TF-CLAUDE-OPERATOR-QUEUE-001
**WO:** WO-CLAUDE-QUEUE-003 — Next Goal Selection Packet
**Category:** Documentation (selection only)
**Depends on:** WO-CLAUDE-QUEUE-002 (queue register)

> **Governance (authority routing).** Per root `AGENTS.md` and `brain/packs/README.md`, the Brain/Cortex is the sole
> sequencing authority. This "selection" is a **recommendation** for Brain/operator ratification — not a self-granted
> authorization and not a bypass of `pnpm brain next`. In this run the operator explicitly authorized the recommended
> goal before execution.

---

## 1. Selection

From the ranked queue (WO-CLAUDE-QUEUE-002), the highest-value non-overlapping candidate is **#1**:

**Selected goal: `GOAL-TF-WB-PARITY-PROOF-001` — Workbench Route/Window Parity Proof.**

## 2. Non-overlap + scope confirmation

- **No Codex Backend OE collision:** touches only `frontend/apps/os-shell/src/__tests__/workbench/**` and
  `docs/audit/workbench-readiness/**`; read-only elsewhere. Codex Backend OE (#1226) is under `backend/**` /
  `WO-BACKEND-OE-*` — disjoint.
- **No backend/tool-registry/API/runtime work:** parity is proven from existing source (`Router.tsx` child routes +
  `PropertyWorkbenchWindow.tsx` `TAB_COMPONENTS`) + tests; no new integration.
- **No route/window architecture change:** read-only inspection; the only permitted code write is a *tiny in-scope fix*
  **iff** a parity test reveals a regression — otherwise test/docs only.
- **Expected validation:** `git diff --check`, scope check, required branch-protection contexts; Frontend Gate + Vitest
  Full Suite for any test change; review threads resolved; no `--admin` / break-glass / hook bypass.

## 3. Sub-loop to execute (LOOP-TF-WB-PARITY-PROOF-001)

1. WO-WB-PARITY-001 — Route/Window Parity Scope Audit (docs)
2. WO-WB-PARITY-002 — Existing Test Coverage Matrix (docs)
3. WO-WB-PARITY-003 — Route/Window Parity Test Backfill (test, only if a gap exists)
4. WO-WB-PARITY-004 — Parity Contract Documentation (docs)
5. WO-WB-PARITY-005 — Evidence Rollup (docs)

## 4. Why this over the others

G2 was just fixed; the natural next safe step is to **lock in** that both hosts stay aligned (a parity proof + contract)
so a future edit cannot silently reintroduce aliasing. It is pure test/docs, builds directly on merged work, and has zero
Codex dependency. All other queue items are lower value now, owner-gated (Sync), or blocked (Backend OE).

## 5. Result

- **SELECTED:** `GOAL-TF-WB-PARITY-PROOF-001`.
- Not `OPERATOR_QUEUE_EMPTY` — a safe candidate exists.
- Execution proceeds under WO-CLAUDE-QUEUE-004.

**Selection only. Execution begins in WO-CLAUDE-QUEUE-004.**
