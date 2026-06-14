# Branch and Worktree Policy

**Status:** MANDATORY  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## Branch Model

| Branch Pattern | Purpose | Who Creates | Who Merges |
|---|---|---|---|
| `main` | Production-ready trunk | N/A | Human only |
| `claude/<work-order>` | Claude Code agent work | Agent | Human via PR |
| `codex/<work-order>` | Codex agent work | Agent | Human via PR |
| `tf-agent-<lane>-<wo>` | Scoped agent work | Agent | Human via PR |
| `feat/<feature>` | Feature development | Human or agent | Human via PR |
| `fix/<issue>` | Bug fix | Human or agent | Human via PR |

## Worktree Rules

1. **One worktree = one work order = one branch = one PR.**
2. Worktrees live outside the main repo directory (e.g., `C:\Users\bsval\tf-agent-<wo-id>`).
3. No agent may create worktrees inside the main repo tree (e.g., NOT under `C:\Users\bsval\terrafusion_os_1.0\worktrees\`).
4. The main repo checkout is reserved for human use and human-controlled merge operations.
5. Agents discover the main HEAD via `git rev-parse main` from any worktree, without checking out main.

## PR Boundary

- PR is the sync boundary between agent work and main.
- Agents open draft PRs. Humans promote to ready-for-review.
- Agents do not merge their own PRs unless explicitly told to.
- Agents do not force-push.

## Worktree Lifecycle

```
Create worktree from main
  → Agent works in worktree
  → Agent opens draft PR
  → Human reviews
  → Human merges
  → Human approves worktree removal
  → Agent or human removes worktree
```

## Sprawl Prevention

- Agents should not create worktrees without a work order justification.
- Completed worktrees should be removed after merge (with human approval).
- `git worktree list` should be checked periodically; >20 active worktrees is a warning sign.
- `git worktree prune` should be run after removals.
