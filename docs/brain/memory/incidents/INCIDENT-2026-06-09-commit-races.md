# Incident — Shared-Worktree Commit Races (observed 2×)

- **Date:** 2026-06-09 · **Severity:** process hazard (no data loss either time) · **Status:** mitigated (WO-0011)

## What happened
Two separate times, files this lane had **staged but not yet committed** were silently absorbed into
another agent's commit, because the agent fleet shares one worktree and `git commit` commits the whole
index regardless of who staged what:

1. **Race 1:** WO-0007 landing hit a transient pre-commit failure → files stayed staged → the fleet's
   revenue-a agent committed → staged Brain files swept into `1e75e628c`.
2. **Race 2:** a small ledger follow-through edit was staged → the fleet's sync-readiness agent
   committed → swept into `a3fcb143b`.

Both times: content verified intact in HEAD; attribution mixed; nothing lost.

## Root cause
Shared worktree + multiple committing agents + non-atomic stage→commit gaps. Any pause between
`git add` and `git commit` is an absorption window.

## Mitigation landed (WO-0011)
Lightweight staged-file guard across the Brain loop:
- `brain status` / `brain next` → loud STAGED-FILE HAZARD warning when anything is staged
- `brain review-diff --workorder` → **blocks** staged files forbidden by the active work order; warns otherwise
- `brain commit-plan` → lists already-staged files separately with "commit path-limited FIRST or unstage"
- `brain proof` → records the staged count at proof time in the evidence artifact
- Operating rule: **no staged files may remain unattended in shared worktrees** — stage and commit in
  one uninterrupted invocation.

## Residual risk
The guard makes the hazard visible and blocking at every loop step, but cannot physically prevent
another agent's commit from absorbing a staged index. Full elimination requires **per-agent worktree
isolation** (or a cooperative commit lock) — deferred as its own future slice.
