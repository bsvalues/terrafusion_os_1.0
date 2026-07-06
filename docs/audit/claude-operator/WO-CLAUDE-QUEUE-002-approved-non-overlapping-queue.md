# WO-CLAUDE-QUEUE-002 — Approved Non-Overlapping Queue Register

**Goal:** GOAL-TF-CLAUDE-OPERATOR-QUEUE-001
**WO:** WO-CLAUDE-QUEUE-002 — Approved Non-Overlapping Queue Register
**Category:** Documentation (register only — no execution)
**Depends on:** WO-CLAUDE-QUEUE-001 (lane state)

---

## 1. Purpose

A ranked queue of work Claude Code may execute autonomously (no courier), each **non-overlapping** with Codex Backend OE
and free of backend/tool-registry/runtime/PACS. Ranked by value ÷ risk. **No candidate is executed in this WO.**

## 2. Ranked queue

| # | Candidate | Risk | Allowed paths | Blocked | Codex dep? | Stop walls |
|---|-----------|------|---------------|---------|-----------|-----------|
| 1 | **Workbench Route/Window Parity Proof** (`GOAL-TF-WB-PARITY-PROOF-001`) | low | `__tests__/workbench/**`, `docs/audit/workbench-readiness/**`; read-only `pages/workbench/**`, `Router.tsx` | window/route impl (unless tiny regression fix), backend, registry | none | impl beyond test/docs; route/window ambiguity |
| 2 | Workbench operator documentation refresh | low | `docs/audit/workbench-readiness/**` | code | none | source contradicts docs |
| 3 | Frontend honesty/provenance maintenance rollup | low | `docs/audit/workbench-readiness/**` | code | none | none |
| 4 | Remote merged-branch cleanup decision packet | low | `docs/audit/claude-operator/**` | actually deleting via hook-blocked push | none | push blocked by pre-push hook (needs bypass auth) |
| 5 | DevEx pre-push hook repair — **discovery only** | med | `docs/audit/claude-operator/**` | `.husky/**`, `package.json`, any CI/build config write | none | fixing it needs config write (owner-gated) |
| 6 | Mapping workbook retention policy decision packet | low | `docs/audit/**` | any Sync code/data | none | Sync is parked; owner-gated to un-park |
| 7 | Source-derived Sync governance decision packet | med | `docs/audit/**` | Sync code/data/tooling | none | **owner-gated** (Sync parked) |
| 8 | Backend OE overlap (any) | — | — | — | **YES** | **BLOCKED — Codex lane** |

## 3. Classification notes

- **#1 Parity Proof** — highest value now: G2 was just fixed; a parity proof + contract hardens against reintroducing
  aliasing and is pure test/docs. Directly builds on merged work; zero Codex overlap. **Default selection.**
- **#2/#3 doc refresh/rollup** — low value on their own right now (recently written); defer.
- **#4 branch cleanup** — real housekeeping (14 merged branches), but deleting them is blocked by the repo pre-push hook;
  a **decision packet** is safe, the deletion itself needs a hook-bypass authorization → owner-gated. Register as a packet.
- **#5 pre-push hook repair** — discovery (why the hook rejects delete-pushes) is safe docs; the **fix** touches `.husky`/
  config → owner-gated. Discovery-only if selected.
- **#6/#7 Sync packets** — Sync is parked; **owner-gated** to select. Do not self-select.
- **#8** — Backend OE is Codex's; **blocked**.

## 4. Default next candidate

**#1 — `GOAL-TF-WB-PARITY-PROOF-001` (Workbench Route/Window Parity Proof).** Safe, non-overlapping, high-value,
test+docs only, no Codex dependency. Selection packet → WO-CLAUDE-QUEUE-003.

**Register only. Nothing executed in this WO.**
