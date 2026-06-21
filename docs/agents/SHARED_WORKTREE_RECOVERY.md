# Shared Worktree Recovery Protocol

**Status:** REFERENCE — use only when recovery is explicitly authorized  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## Prerequisites (ALL must be true)

Recovery is allowed only when:

1. The active editor/agent using the checkout is confirmed stopped.
2. A T0/T1 quiescence probe (75-second gap) shows no file, status, branch, or HEAD changes.
3. The expected target branch is known and exists.
4. The backstop ref (branch or tag) exists and is verified.
5. Stash contents have been inspected (`git stash show --name-only stash@{N}`) and understood.
6. Staged files have been inspected (`git diff --name-only --cached`) and understood.
7. The restore source (backstop diff) has been computed and reviewed.
8. An exact file allowlist/denylist for restore is known.
9. Human has authorized the specific recovery plan.
10. The recovering agent is NOT racing live edits and is NOT inside the checkout being recovered.

If any prerequisite fails, enter quarantine mode: see `SHARED_WORKTREE_QUARANTINE.md`.

## Quiescence Probe

```bash
# T0 capture:
git branch --show-current
git rev-parse HEAD
git status --short
git diff --name-only --cached
git stash list

# Wait 75 seconds
sleep 75

# T1 capture (repeat all above)
# Compare: no changes in any output = quiescent
```

If anything changes between T0 and T1: **RECOVERY BLOCKED — SHARED CHECKOUT STILL ACTIVE**.

## Recovery Steps (only after all prerequisites pass)

1. Record full state (branch, HEAD, status, stash list, staged files).
2. Create safety branch: `git branch recovery-before-<description> HEAD`.
3. Inspect and unstage any foreign staged files: `git reset HEAD -- <file>`.
4. Checkout expected branch: `git checkout <target-branch>`.
5. Restore files from backstop using selective checkout: `git checkout <backstop-ref> -- <file-list>`.
6. Inspect stash if relevant: `git stash show --name-only stash@{0}`. Pop only if contents are understood and expected.
7. If stash pop conflicts: **STOP** and report.

## Forbidden During Recovery

- `git reset --hard`
- `git clean`
- `git add -A`
- Committing (leave for human review)
- Deleting branches, tags, or stashes
- Resolving merge/stash conflicts automatically
