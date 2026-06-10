# Branch & Worktree Policy

**Status:** MANDATORY (WO-BRAIN-0021, 2026-06-10). Companion to `docs/agents/AGENT_WORKTREE_ISOLATION.md` and the rule block in root `AGENTS.md`.

## The mapping

| Unit | Rule |
|------|------|
| Worktree | One per agent per work order. Named `tf-agent-<lane>-<wo>`. Removed (or archived) when the WO lands. |
| Branch | One per work order, created with the worktree (`git worktree add <path> -b <branch> <base>`). No agent commits on a branch another agent's worktree has checked out. |
| PR | One per work order. PR merge (or operator's explicit local merge) is the ONLY sync boundary into the mainline. |
| Main working tree | Human-controlled sync surface ONLY. Agents read from it; they do not stage, commit, checkout, reset, clean, stash, or format in it. |

## Base-ref rule
Agent worktrees branch from the operator-designated integration branch HEAD at creation time (currently the June-10 lineage; ask the Brain queue / operator when unclear — do NOT assume `origin/main`, which can trail local mainline by hundreds of commits). When the integration branch is rebuilt or replaced, in-flight agent branches are re-based or surgically re-applied by path-limited checkout (see recovery doc) — never by force-pushing the shared branch.

## Branch events (rebuild / replace / large merge)
A branch rebuild is an operator-level action. Whoever performs one MUST:
1. Announce it (Brain ledger row or incident note) BEFORE rebuilding.
2. Enumerate in-flight agent branches (`git worktree list`, open WOs) and verify their commits remain reachable from some branch — orphaning a landed WO commit is a contamination event.
3. Re-run `node scripts/brain/brain.mjs check` on the rebuilt branch — gates regress silently (precedent: FU-2C write-lanes regression, D-019 honesty-doc reversion).
4. Diff doc-honesty surfaces (`CLAUDE.md`, `backend/CLAUDE.md`) against the honest lineage.

## Staging discipline (all trees)
- Path-limited `git add` always; `git add -A` only when a WO explicitly authorizes full-tree docs-only scope.
- Stage and commit in a single invocation. Staged-but-uncommitted files in any shared context are the proven absorption hazard (3 events).
- `git reset --hard` / `git clean` / force checkout / broad stash require explicit human approval, in any tree.

## Existing ecosystem
`~/.codex-worktrees/**`, `~/.config/superpowers/worktrees/**`, and `.claude/worktrees/**` already follow the one-worktree-per-task shape and are compliant as-is. This policy's purpose is to END the remaining pattern: multiple agents (fleet sessions, loop sessions, Brain governance sessions) mutating `C:/Users/bsval/terrafusion_os_1.0` directly and concurrently.

## Future enhancement (explicitly secondary, NOT scheduled)
A cooperative commit lock (e.g. Brain-managed lockfile around `git commit` in the main tree) may be layered on later for defense-in-depth. It is NOT the primary fix: it cannot prevent staged-file absorption, unstaged overwrites, checkout collisions, formatter sweeps, branch-reset contamination, or index corruption. Only isolation does.

## Justification
Commit-race events #1–#3 and the June-10 branch-rebuild contamination: `docs/brain/memory/incidents/INCIDENT-2026-06-09-commit-races.md`, drift D-019 (honesty-doc reversion), D-020 (isolation mandate).
