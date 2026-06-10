# Agent Worktree Isolation — MANDATORY Policy

**Status:** MANDATORY for all agents (Claude Code, Codex, Copilot, fleet/swarm sessions) as of 2026-06-10 (WO-BRAIN-0021, drift D-020).
**Authority:** Operator executive decision after commit-race/contamination event #3. Subordinate to `.github/AGENT_ENTRYPOINT.md` and TF-052; enforced via `AGENTS.md`.

## The rule

> **No two agents may operate in the same working tree.**
> Each agent must use a dedicated git worktree tied to exactly one work order.
> The shared/main working tree is for human-controlled sync only.
> Agents must not stage, commit, checkout, reset, clean, stash, or format across another agent's worktree.

## Why (incident record)

Three contamination events in two days made proof, authorship, scope, and review boundaries unreliable in the shared tree — which violates Brain doctrine at its root:
1. **2026-06-09 ×2:** fleet commits `1e75e628c` and `a3fcb143b` absorbed another agent's staged Brain files.
2. **2026-06-10:** the June-10 branch rebuild stranded WO-0013..0016, orphaned commit `098d0d6b3`, regressed the FU-2C write-lanes gate, and reverted honesty docs (D-019).
3. **2026-06-10:** fleet commit `edcc58ef9` absorbed staged `CLAUDE.md` honesty restores mid-slice; earlier the same day recovery commit `c5664ff31` reverse-absorbed a fleet-staged branching doc.

Full record: `docs/brain/memory/incidents/INCIDENT-2026-06-09-commit-races.md`, drift rows D-019/D-020.

**Why worktrees and not a commit lock:** a cooperative commit lock only serializes commits. It does NOT protect against staged-file absorption, unstaged-file overwrites, checkout collisions, formatter sweeps, branch-reset contamination, or shared-index corruption. Per-agent worktrees remove the shared mutable index/tree entirely. A commit lock MAY be added later as a secondary safety layer; it is not the primary fix.

## Operating requirements

**One worktree = one work order = one branch = one PR.** Naming: `tf-agent-<lane>-<wo>` (e.g. `../tf-agent-localops-002`, `../tf-agent-atlas-d017`, `../tf-agent-sync-000`, or harness-managed `.claude/worktrees/tf-agent-<lane>-<wo>`). The existing `~/.codex-worktrees/**` and `~/.config/superpowers/worktrees/**` conventions already satisfy this policy — the violation pattern this policy kills is agents mutating the MAIN tree.

**Mandatory pre-start report** — every agent, before its first write:
```bash
pwd
git branch --show-current
git rev-parse --show-toplevel
git status --short
git worktree list
```
- If `--show-toplevel` is the main repo root and you are an agent: **STOP — create/enter your worktree first.**
- If foreign staged or unstaged files are present in YOUR worktree: **STOP** and report (someone else touched it).
- If live contamination is detected in the main tree: enter recovery mode per `SHARED_WORKTREE_RECOVERY.md`.

**Command discipline:**
- No `git add -A` / `git add .` unless the work order explicitly authorizes full-tree docs-only changes — path-limited staging always.
- No `git reset --hard`, `git clean`, force checkout, or broad `git stash` without explicit human approval.
- Stage + commit in ONE step; never leave files staged across an edit gap.
- Formatters/linters run only on the agent's own staged files (lint-staged default) — never tree-wide sweeps in shared spaces.

**Sync boundary:** PR merge (or the operator's explicit local merge) is the ONLY point where an agent's work enters the mainline. The main repo working tree remains clean; humans drive sync.

## Scope notes
- The Brain loop is unchanged: workorder → execute → review-diff → proof → commit-plan → land — it now simply runs INSIDE the agent's own worktree, which also makes `brain review-diff` verdicts authorship-exact (no more fleet-residue BLOCK noise).
- Long-running dev services (API watcher, vite) stay attached to the tree they were launched from; agents must not restart another tree's services without approval.
