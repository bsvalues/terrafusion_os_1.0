# WO-BRAIN-0021 — Per-Agent Worktree Isolation (mandatory operating policy)

- **Risk:** R2 (governance/process; docs + agent policy only, no runtime code) · **Suite:** OS governance / Brain · **Agent:** Claude Code
- **Trigger:** Commit-race / worktree-contamination event **#3** (2026-06-10, fleet commit `edcc58ef9` absorbed staged CLAUDE.md restores; reverse-absorption `c5664ff31`; June-10 branch rebuild stranded WO-0013..0016). The recorded deferral rule — "build isolation only if the race bites a third time" — has FIRED. **Operator decision 2026-06-10: per-agent git worktrees are the PRIMARY fix; cooperative commit lock is a future secondary layer only.**
- **Freeze:** Feature work in the shared worktree (LocalOps, TerraAtlas, D-017, dev39) is FROZEN until this policy lands.

## Mission
No two agents may operate in the same mutable working tree. Each agent works in a dedicated git worktree tied to exactly one work order. The shared/main working tree becomes human-controlled sync surface only.

## Allowed files
- `AGENTS.md` (mandatory rule added)
- `docs/agents/**` (new policy + recovery docs)
- `docs/branching/**` (branch & worktree policy)
- `docs/localops/LOCALOPS_WORKORDER_PLAN.md` (blocker reference only)
- `docs/brain/memory/**` (D-020 ledger row, incident references)
- `docs/brain/canon/**` (queue head promotion)
- `docs/brain/workorders/active/**` (this file)
- `wiki/**` (regen)

## Forbidden
- production runtime code · LocalOps/TerraAtlas/Sync implementation
- package/dependency changes · database/migrations · auth/security behavior
- `git reset --hard` / `git clean` / force checkout / broad stash
- touching another agent's live work

## Deliverables
1. `docs/agents/AGENT_WORKTREE_ISOLATION.md` — the mandatory policy
2. `docs/agents/SHARED_WORKTREE_RECOVERY.md` — contamination recovery sequence
3. `docs/branching/BRANCH_AND_WORKTREE_POLICY.md` — branch/worktree/PR mapping
4. `AGENTS.md` — mandatory rule block
5. D-020 drift row + queue head promotion + LocalOps plan blocker note

## Acceptance criteria
- [ ] Policy says per-agent worktrees are MANDATORY (not advisory); commit lock explicitly secondary/future
- [ ] AGENTS.md carries the rule (no two agents in one tree; one worktree = one WO = one branch = one PR; shared tree = human sync only; no cross-tree stage/commit/checkout/reset/clean/stash/format)
- [ ] Mandatory pre-start report specified (pwd, branch, toplevel, status, worktree list) + stop-on-foreign-files rule
- [ ] Recovery doc covers the 8-step sequence (stop → record → identify foreign files → identify owner → no destructive commands → recover from known commit/stash only with approval → leave uncommitted unless approved → report)
- [ ] Incidents referenced as justification (INCIDENT-2026-06-09-commit-races.md, D-019, D-020)
- [ ] No production behavior changed; no dependency changes; gates pass

## Required proof
- `node scripts/brain/brain.mjs check`
- `node scripts/brain/brain.mjs review-diff --workorder WO-BRAIN-0021`
- `node scripts/brain/brain.mjs proof --workorder WO-BRAIN-0021`

## Rollback
- Docs-only: revert the policy files + AGENTS.md hunk.

## Stop conditions
- policy requires changing another agent's live workflow files mid-flight → coordinate via operator
- a forbidden path must change

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-BRAIN-0021",
  "task": "Per-agent worktree isolation: mandatory policy, AGENTS.md rule, recovery + branching docs (D-020)",
  "risk": "R2",
  "suite": "OS governance / Brain",
  "allowed_files": [
    "AGENTS.md",
    "docs/agents/**",
    "docs/branching/**",
    "docs/localops/LOCALOPS_WORKORDER_PLAN.md",
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "docs/brain/workorders/active/**",
    "docs/brain/evidence/**",
    "wiki/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/**",
    "frontend/**",
    "backend/**",
    "scripts/**",
    "tools/**",
    "package.json",
    "pnpm-lock.yaml",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "node scripts/brain/brain.mjs check",
    "node scripts/brain/brain.mjs review-diff --workorder WO-BRAIN-0021"
  ]
}
```
