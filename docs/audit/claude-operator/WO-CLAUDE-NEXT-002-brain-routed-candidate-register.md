# WO-CLAUDE-NEXT-002 — Brain-Routed Candidate Register

**Goal:** GOAL-TF-CLAUDE-NEXT-LANE-RATIFICATION-001
**WO:** WO-CLAUDE-NEXT-002 — Brain-Routed Candidate Register
**Category:** Documentation (register — no execution)
**Depends on:** WO-CLAUDE-NEXT-001

> **Not authority.** This register is a **Brain-routed evidence input**. The Brain/Cortex sequences; `brain next` reads
> `docs/brain/canon/next-queue.json`. Claude Code does **not** self-select from this file.

---

## 1. The Brain's authoritative backlog (`docs/brain/canon/next-queue.json`, verbatim order)

| # | Brain queue item | Risk | Shape | Claude-eligible? |
|---|------------------|------|-------|-------------------|
| 0 | **ServiceRegistry activation verification** | R2 | backend product-gate (stop if activation needs backend behavior change) | ❌ backend — not Claude's frontend lane; Codex-adjacent |
| 1 | live-DB migration verify (Dais) | R2 | `dotnet ef migrations` vs dev DB | ❌ DB/backend — **blocked** |
| 2 | dock/top-bar deep sweep (launch-surface truth table) | R2 | **run frontend launch-surface + shell-truth vitest batches; evidence note** | ✅ frontend test/evidence — Claude-appropriate, **but position 2 = "why not yet"** |
| 3 | TF-LOCALOPS-001 chain: WO-LOCALOPS-000 | R1→R4 | LocalOps local-AI infra chain | ❌ backend/AI; hard boundaries |
| 4 | per-agent worktree isolation hardening | R2 | brain process doctrine + git worktree tooling | ◑ process/DevEx; not frontend; owner-gated tooling |

`brain next` recommends **[0]** and lists the rest as "why not yet."

## 2. Other Claude-shaped candidates (from active WOs + prior operator queue)

| Candidate | Source | Shape | Note |
|-----------|--------|-------|------|
| WO-0001 — replace 34 fake-green Dais stub tests | `docs/brain/workorders/active/` | frontend test-honesty | Claude-appropriate; **not at the Brain queue head** — status unclear (active WO, not the current backlog[0]) |
| WO-0007 — investigate workbench-window contract (D-011) | `docs/brain/workorders/active/` | frontend investigation | may already be retargeted (WO-0008 D-011 in `_done`) — verify before touching |
| Remote merged-branch cleanup packet | prior operator queue | docs packet | deletion blocked by pre-push hook → owner-gated |
| Pre-push hook repair — discovery only | prior operator queue | docs | fix needs `.husky`/config → owner-gated |

## 3. Classification

- **Blocked (backend/DB/AI):** queue [0] ServiceRegistry, [1] Dais migration, [3] LocalOps — outside Claude's allowed
  scope and/or Codex-adjacent.
- **Recommended-but-NOT-ratified (Claude-appropriate, but not the Brain head):** queue [2] dock/top-bar frontend vitest
  sweep; WO-0001 Dais stub-test honesty.
- **Owner-gated:** [4] worktree-isolation tooling; branch-cleanup; pre-push-hook fix.
- **Blocked by Codex overlap:** all Backend OE (#1233).

## 4. Register conclusion

The Brain's **head recommendation is queue[0] (ServiceRegistry)** — a backend lane, **not** Claude's. The only clean
Claude-appropriate lanes ([2] frontend sweep, WO-0001) are **not at the head** ("why not yet"). Ratification is decided in
WO-CLAUDE-NEXT-003 — Claude may not promote a non-head item on its own.

**Register only. Nothing executed in this WO.**
