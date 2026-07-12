# WO-BRAIN-006 - Memory And Provenance Integration Audit

**Program:** Brain Operator System

**Goal:** `GOAL-BRAIN-OPERATOR-001`

**Loop:** `LOOP-BRAIN-OPERATOR-001`

**Base:** `f4806e30b2e31b59d0b826ced45e8910c031c1e2`

## Verdict

PARTIAL / ENVIRONMENT-DEPENDENT. TerraFusion has repository-tracked memory and provenance contracts,
but it does not have one automatically refreshed persistent-memory system. Current routing is proven
by live Git/GitHub probes and merged work-order evidence, not by the repository memory snapshot.

## Source And Freshness Matrix

| Source | Ownership | Last repository update | Mutation path | What it proves | Non-claim |
|--------|-----------|------------------------|---------------|----------------|-----------|
| `.claude/memory/MEMORY.md` | Claude session aid | PR #995, 2026-06-21 commit | `save-state` skill / manual | Index for one Claude project snapshot | Not current portfolio state |
| `.claude/memory/project_current_state.md` | Claude session aid | Content says 2026-06-14 / PR #995 | overwrite target of `save-state` | Historical handoff for the Pulse PR | Not the latest session despite index wording |
| `docs/brain/memory/**` | Brain governance ledgers | PR #1054, 2026-06-19 commit | governed docs PRs | Historical decisions, drift, release, honesty, and deferral records | Not a live queue or current release status |
| Work-order evidence and registers | Brain/WO governance | Updated through PR #1265 | bounded WO PRs | Current declared program state and auditable decisions | Can still drift from live GitHub state |
| Work-order schema provenance | WOE contract | Schema from 2026-06-29 | governed schema/data packets | Supports source, timestamps, commit, and stale-after metadata | Does not refresh evidence automatically |
| Live Git/GitHub probes | Derived external state | Query-time | read-only tools | Current heads, PRs, checks, reviews, and worktrees | Not durable until captured in evidence |
| Codex application memory | External operator context | Outside this repository | platform-managed | Can supply prior-run context to an active Codex session | Not repository canon and not guaranteed to other agents |

## Loading Truth

- The root governance contract is loaded by agent instruction, but no repository mechanism proves
  that every agent loads `.claude/memory/project_current_state.md` or `docs/brain/memory/**`.
- `.claude/skills/save-state/SKILL.md` writes to an external user-profile path. Its current snapshot
  records that the path did not exist in a remote Linux environment and used the repository fallback.
- The tracked memory index calls the snapshot "always the latest session-end record," but the snapshot
  still describes draft PR #995 while current `main` includes PR #1265. That claim is false today.
- Therefore memory is advisory context. Live repository, PR, check, and worktree state must be refreshed
  before routing or completion claims.

## Provenance Rules

1. Cite a source path and observed commit or timestamp for material claims.
2. Treat repository memory without freshness metadata as historical until verified.
3. Prefer live derived state for PR, branch, check, review, and worktree decisions.
4. Preserve evidence in merged WO packets when a live observation affects governance.
5. Do not infer authorization from memory, prior completions, or a next-candidate field.
6. Never write external memory or ingest an external store from this audit.

## Gaps

- No canonical freshness policy connects the memory index, Brain ledgers, work-order evidence, and
  live derived state.
- No loader receipt proves which memory sources an agent consumed.
- The save-state target differs by environment and is not normalized by repository policy.
- Work-order provenance fields are optional and the seed registry is not current portfolio truth.
- Historical memory contains stale release and current-state claims that need labels, not silent use.

## Implementation Boundary

This audit does not update memory, create ingestion, add a store, change the save-state skill, expose
secrets, or grant memory-derived authority. Any loader, freshness checker, or state synchronizer is a
separate bounded implementation Work Order.

## Next Work Order

`WO-BRAIN-007 - Agent Role And Stop-Gate Matrix` is dependency-cleared.

STOP_TYPE: `BRAIN_MEMORY_PROVENANCE_INTEGRATION_AUDITED`
