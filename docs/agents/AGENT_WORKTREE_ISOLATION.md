# Agent Worktree Isolation Policy

**Status:** MANDATORY  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## Principle

No two agents may operate in the same mutable working tree. Each agent uses a dedicated git worktree tied to exactly one work order. The shared/main working tree (`C:\Users\bsval\terrafusion_os_1.0`) is reserved for human-controlled merge operations.

## Rules (20)

### Identity & Verification

1. **Before the first write**, every agent runs and reports:
   - `pwd`
   - `git branch --show-current`
   - `git rev-parse --show-toplevel`
   - `git status --short`
2. If `--show-toplevel` returns the main repo root and the agent was not explicitly assigned there, **STOP** and create a worktree.
3. If foreign staged or unstaged files are present, **STOP** and report.

### Worktree Lifecycle

4. One worktree = one work order = one branch = one PR.
5. Worktrees live outside the main repo directory (e.g., `C:\Users\bsval\tf-<wo-id>`).
6. No agent may create worktrees inside the main repo tree.
7. Create worktrees from clean main: `git worktree add ../tf-<wo-id> -b <branch-name> origin/main`.
8. Completed worktrees are removed after merge, with human approval.

### Forbidden Operations (without human approval)

9. No `git reset --hard`.
10. No `git clean -fd` or `git clean -fx`.
11. No force checkout (`git checkout -f`).
12. No broad stash (`git stash` without file-specific scope).
13. No `git add -A` or `git add .` (use explicit file paths).
14. No `git push --force` (agents do not force-push).
15. No deleting branches, tags, worktrees, or stashes without human approval.

### PR Boundary

16. PR is the sync boundary between agent work and main.
17. Agents open draft PRs; humans promote to ready-for-review.
18. Agents do not merge their own PRs unless explicitly told to.

### Stale Plan Doctrine

19. If a recovery plan's assumptions diverge from current repo state, the plan is stale — **do not execute it**.
20. If the shared checkout state is uncertain, **quarantine** it (do not clean/recover). See `SHARED_WORKTREE_QUARANTINE.md`.

## Before-First-Write Checklist

```bash
# Run ALL of these and include output in your first message:
pwd
git branch --show-current
git rev-parse --show-toplevel
git status --short

# Verify:
# 1. pwd is NOT the main repo root
# 2. Branch matches your assigned work order
# 3. No foreign staged/unstaged files
# 4. You are in an isolated worktree
```

## Worktree Creation (Command Guide)

```bash
# From any location with access to the repo:
cd C:\Users\bsval\terrafusion_os_1.0

# Fetch latest main
git fetch origin main

# Create isolated worktree
git worktree add ../tf-<wo-id> -b claude/<wo-id>-<description> origin/main

# Enter worktree
cd ../tf-<wo-id>

# Verify isolation
pwd                           # Should be ../tf-<wo-id>
git branch --show-current     # Should be claude/<wo-id>-<description>
git rev-parse --show-toplevel # Should be ../tf-<wo-id>
git status --short            # Should be clean
```

## Contamination Detection

Signs that an agent is operating in the wrong tree:

- `--show-toplevel` returns the main repo root
- `git status` shows files from other work orders
- Branch name doesn't match the current work order
- Staged files include paths the agent didn't create
- Multiple agents report the same `--show-toplevel`

**If any of these are true:** STOP immediately. Do not commit. Do not push. Report the contamination.
