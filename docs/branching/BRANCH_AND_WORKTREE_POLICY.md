# Branch and Worktree Policy

**Status:** MANDATORY  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## Branch Model

| Branch Pattern | Purpose | Who Creates | Who Merges |
|---|---|---|---|
| `main` | Production-ready trunk | N/A | Human or authorized operator, always via protected PR |
| `claude/<work-order>` | Claude Code agent work | Agent | Human or authorized operator via PR |
| `codex/<work-order>` | Codex agent work | Agent | Human or authorized operator via PR |
| `tf-agent-<lane>-<wo>` | Scoped agent work | Agent | Human or authorized operator via PR |
| `feat/<feature>` | Feature development | Human or agent | Human or authorized operator via PR |
| `fix/<issue>` | Bug fix | Human or agent | Human or authorized operator via PR |

## Worktree Rules

1. **One worktree = one work order = one branch = one PR.**
2. Worktrees live outside the main repo directory (e.g., `C:\Users\bsval\tf-agent-<wo-id>`).
3. No agent may create worktrees inside the main repo tree (e.g., NOT under `C:\Users\bsval\terrafusion_os_1.0\worktrees\`).
4. The main repo checkout is reserved for human-controlled synchronization. Agents merge through the
   remote PR boundary, never by mutating the shared checkout.
5. Agents discover the main HEAD via `git rev-parse main` from any worktree, without checking out main.

## PR Boundary

- PR is the sync boundary between agent work and main.
- Agents may open draft or ready PRs when the active Work Order permits.
- Agents may merge only under recorded authority defined by the canonical merge model. Without that
  authority, the owner merges.
- Agents do not force-push.

## Worktree Lifecycle

```
Create worktree from main
  → Agent works in worktree
  → Agent opens the authorized PR state
  → Required checks and review complete
  → Human or authorized operator merges
  → Exact cleanup authority is verified
  → Agent or human removes worktree
```

## Sprawl Prevention

- Agents should not create worktrees without a work order justification.
- Completed worktrees may be removed after merge under an exact approved cleanup rule. Failed
  current-WO worktrees may be repaired without a new owner touch only when the path is exact, Git
  worktree management is used, and any deleted branch is proven to have zero unique commits.
- `git worktree list` should be checked periodically; >20 active worktrees is a warning sign.
- `git worktree prune` should be run after removals.
