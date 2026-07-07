# WO-CLAUDE-SUP-003 — Backend OE #1233 Merge-Window Recommendation

**Goal:** GOAL-TF-CLAUDE-SUPPORT-001 — Claude Code Backend OE Support + Next-Lane Packet Prep
**WO:** WO-CLAUDE-SUP-003 — Merge-Window Recommendation Packet
**Category:** Support (recommendation only — no execution)
**Operator:** Claude Code · support lane

**Authorization:** Recommendation only. Claude does not resolve threads, update the branch, or merge. This packet exists
so the owner/Codex can act in one pass without a courier round-trip.

---

## 1. Recommendation (ordered, Codex/owner-owned actions)

**Step 1 — Codex resolves the 2 threads on the evidence doc.** Critical path.
- **copilot (line 12):** change the evidence `RESULT:` token to the canonical `RESULT: PASS_WITH_GAP` (match sibling
  Backend OE evidence files) so any rollup tooling parses it. Then resolve.
- **codex P1 (line 142):** remove/soften the "open/merge PRs when authorized" role expansion so the packet does not
  contradict `AGENTS.md:57` ("Agents open draft PRs; humans merge"). Recommended wording: operators **open** PRs and
  drive them to green; **a human performs the merge**. Then resolve.

**Step 2 — advance the branch to `main` (cheap).** #1233 is docs-only, so `Update branch` takes the docs fast-path (no
heavy backend/Vitest re-run). Do this **after** Step 1 so CI runs once on the final, thread-clean state.

**Step 3 — human merges.** Auto-merge is already armed; once Steps 1–2 make it MERGEABLE + up-to-date + 0-unresolved, it
lands without further action. If auto-merge does not fire, a human squash-merge is the authorized path (no `--admin`, no
break-glass).

## 2. Timing / race guidance

- **Good window now:** `main` is momentarily quiet after #1236/#1237. If Steps 1–2 happen before another lane merges,
  #1233 lands cleanly at 0-behind.
- **Race is low-cost anyway:** because #1233 is docs-only, even repeated 1-commit-behind updates are cheap — this is not
  a Vitest-starvation situation like the frontend lanes.
- **Claude will hold its own support-docs PR unmerged** until #1233 lands, so Claude does not add even a 1-commit race to
  #1233's merge window. (Zero file overlap regardless.)

## 3. What Claude will NOT do

Resolve Codex threads · edit the evidence doc · update the Codex branch · merge #1233 · touch backend/tool-registry/
product/routes · break-glass · hook bypass. These are Codex/owner authority walls.

## 4. Owner decision surface (one-line asks)

1. Approve the two thread fixes above for Codex to apply? (or supply preferred wording)
2. Confirm the humans-merge law stands for #1233 (Claude reads it as: yes — Codex opens/greens, human merges).

No Claude action is pending on these; they are Codex/owner-owned. Claude continues watching #1233 to terminal state.
