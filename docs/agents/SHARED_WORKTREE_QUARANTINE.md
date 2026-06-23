# Shared Worktree Quarantine Protocol

**Status:** MANDATORY  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## When to Quarantine

A shared checkout is **QUARANTINED** when any of these are true:

- Active branch does not match expected branch
- Recovery backstop (branch or tag) is missing
- Stash count is high (>10) or contents are ambiguous
- Untracked files are numerous or not understood
- Active editor or agent may still be writing
- The recovering agent is physically operating inside the shared checkout
- Staged files do not belong to the current work order
- Worktree count suggests sprawl or unresolved parallel work (>20 worktrees)
- Current state diverges from the approved recovery script

## Quarantine Means

- No checkout
- No restore
- No stash pop
- No reset (soft or hard)
- No clean
- No delete (branches, tags, worktrees, stashes)
- No recovery execution
- No implementation work in the shared checkout

## What to Do Instead

1. Create or use an isolated worktree from clean main.
2. Document the quarantine state (branch, HEAD, dirty files, stash count, worktree count).
3. Proceed with new work in the isolated worktree.
4. Leave cleanup/recovery for a separate, explicitly approved work order.

## Incident Record: 2026-06-13

The shared checkout `C:\Users\bsval\terrafusion_os_1.0` was quarantined because:

- Branch was `feat/ws1-forge-cost-reference` (not the expected `fix/projector-delete-insert-atomicity`)
- Prior recovery plan expected `triage-backstop-snapshot` branch, which does not exist
- 88 stash entries accumulated
- ~95 active worktrees
- 40+ untracked files
- Modified `.ai/README.md` and `.claude/launch.json`
- Multiple git processes running from other editors/agents

**Decision:** Quarantine the shared checkout. Create fresh worktree from main for all new work. Do not attempt the stale recovery plan.
