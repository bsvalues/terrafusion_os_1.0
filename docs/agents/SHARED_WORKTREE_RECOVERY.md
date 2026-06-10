# Shared Worktree Recovery — Contamination Response

When an agent detects foreign staged/unstaged files in its tree, or the main tree shows mixed-authorship mutation, follow this sequence. The prime directive: **make the state legible before changing it; never destroy what you cannot attribute.**

## The 8-step sequence

1. **Stop all agents.** No further writes, stages, commits, or checkouts anywhere in the repo until recovery completes. (Operator pauses fleet sessions; an agent that detects contamination stops itself and reports.)

2. **Record current state** — read-only snapshot, saved to the incident note:
   ```bash
   git branch --show-current
   git rev-parse HEAD
   git status --short
   git worktree list
   git stash list
   git log --oneline -10 --format="%h %an %s"
   ```

3. **Identify foreign staged files.** `git diff --cached --name-only` — for each file, determine which agent/work order it belongs to (work-order allowed-files lists, recent session logs, file content).

4. **Identify the current work-order owner** of each contaminated path (Brain work orders under `docs/brain/workorders/active/`, write-lane canon). Ambiguous ownership → operator decides; do not guess.

5. **Avoid destructive commands.** No `reset --hard`, no `clean`, no force checkout, no stash-drop, no history rewrite on shared branches — ever, during recovery. Absorbed content in committed HEAD stays (attribution is annotated in the ledger, history is not rewritten).

6. **Recover from a known commit or stash ONLY with explicit operator approval.** Lost work is recovered surgically: `git checkout <known-sha> -- <exact paths>` (proven pattern from the June-10 recovery, `c5664ff31`) or `git show <sha>:<path>` — never wholesale resets. Orphaned commits are findable via `git reflog`; verify content with `git show <sha> --stat` before touching the tree.

7. **Leave recovered work uncommitted unless approved.** Present the restored diff to the operator (or the owning work order's review-diff) before it lands. Exception: if leaving it uncommitted re-exposes it to absorption (the original hazard), stage+commit path-limited in one step with an explicit recovery message naming the source SHA.

8. **Report the final state:** branch, HEAD, clean/dirty status, what was recovered from where, what was absorbed-and-annotated rather than rewritten, drift-ledger rows updated, and the go/no-go to resume agent work.

## Known recovery precedents (real, from this repo)
- **Stranded slices after branch rebuild:** `git checkout <stranded-sha> -- <paths>` re-applied WO-0014..0016 verbatim (`c5664ff31`); cherry-pick was rejected because the rebuilt branch had partially-ported file states.
- **Orphaned commit:** WO-0016's `098d0d6b3` was reachable by SHA after its branch was rebuilt away; its files were restored by path-limited checkout. Reflog keeps orphans ~90 days — recover promptly.
- **Absorbed staged files:** content was already correct in HEAD (the absorber committed it); resolution = ledger annotation (D-019/D-020 rows + incident note), NOT history rewrite.

## After recovery
Re-run `node scripts/brain/brain.mjs check` — gates can silently regress in branch events (the FU-2C write-lanes regression was caught only by re-running). Then verify honesty-sensitive docs (`CLAUDE.md`, `backend/CLAUDE.md`) against `docs/security/baseline.md` framing — doc snapshots regress in rebuilds too (D-019).
