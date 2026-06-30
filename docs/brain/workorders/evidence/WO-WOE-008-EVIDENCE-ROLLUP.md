# WO-WOE-008 Evidence Rollup

## Purpose

This packet records the Work Order Engine MVP baseline after WO-WOE-001 through WO-WOE-007. It is evidence and operator truth only. It does not implement automation, change schemas, change registry entries, touch runtime code, change CI, or start the next program.

## Baseline

| Field | Value |
| --- | --- |
| Work order | WO-WOE-008 |
| Program | Work Order Engine |
| Repository baseline | `origin/main` after PR #1110 |
| Baseline commit | `36fa31b06233866b7c46ce59c7c5488b87689a8f` |
| Mode | Docs/evidence only |
| Runtime code changed | No |
| CI changed | No |
| Automation implemented | No |

## Completed WOE Chain

| Work order | Outcome | Primary artifacts | Evidence |
| --- | --- | --- | --- |
| WO-WOE-001 - Work Order System Discovery | Complete, read-only discovery | Chat discovery report | Identified schema, registry, scoring, query, goal-loop, operator packet, and evidence-rollup gaps. |
| WO-WOE-002 - Work Order Data Model | Merged | `docs/brain/workorders/schema/work-order.schema.json`; `docs/brain/workorders/schema/WORK_ORDER_DATA_MODEL.md` | PR #1103; commit `b4714ea2a62f57a8db29d0ad1a86cba77acb44dc`. |
| WO-WOE-003 - Work Order Registry Seed | Merged | `docs/brain/workorders/registry/README.md`; `docs/brain/workorders/registry/work-order-registry.seed.json` | PR #1104; merge commit `b414301d9fcb72fe20738495ac8a2182ced43792`. |
| WO-WOE-004 - Next-WO Scoring Rules | Merged | `docs/brain/workorders/scoring/README.md`; `docs/brain/workorders/scoring/next-work-order-scoring.schema.json`; `docs/brain/workorders/scoring/next-work-order-scoring.rules.json` | PR #1105; merge commit `36a2562c96744ecfd80b034b47a2a36bb2df2634`. |
| WO-WOE-005 - Read-Only WO Query Tool | Merged | `docs/brain/workorders/tools/README.md`; `docs/brain/workorders/tools/wo-query.mjs`; `docs/brain/workorders/tools/wo-query.test.mjs` | PR #1107; merge commit `babf81d0f9d4e41d01dacc59b0ec65346499ecad`. |
| WO-WOE-006 - Goal + Loop Integration | Merged | `docs/brain/workorders/goal-loop/README.md` | PR #1108; merge commit `b46d23626924992489b578c1756dd9ae19357417`. |
| WO-WOE-007 - Operator Packet | Merged | `docs/brain/workorders/operator/README.md` | PR #1110; merge commit `36fa31b06233866b7c46ce59c7c5488b87689a8f`. |

## Intervening Governance Repair

WO-GOV-ESCAPE-001 repaired an unrelated governance gate that blocked the WOE chain. The repair refreshed the Seal Gate escape-hatch cutoff without weakening the test or modifying WOE artifacts.

Evidence:

- PR #1106
- Merge commit `6b99aae68fc651174f4387d12f4012b95d1271a3`
- Narrow validation: `SealGateWorkflow_AllEscapeHatchDates_AreFuture` and related Phase 7 CI compliance slice

## Current Registry State

The registry seed is intentionally representative, not a full historical ledger.

Canonical registry file:

- `docs/brain/workorders/registry/work-order-registry.seed.json`

Current characteristics:

- Contains completed WOE setup records and current WOE chain candidates.
- Includes representative DevOps and Brain queue records for query/scoring proof.
- Preserves the one-Brain model by keeping registry data under `docs/brain/workorders/**`.
- Does not migrate all historical work orders from active/archive locations.
- Does not query live GitHub, branch, worktree, Azure, or validation state.

## Schema and Data Model Status

Canonical schema and companion model:

- `docs/brain/workorders/schema/work-order.schema.json`
- `docs/brain/workorders/schema/WORK_ORDER_DATA_MODEL.md`

The model defines:

- canonical WO fields;
- risk classes `R0` through `R5`;
- lifecycle statuses;
- dependency objects;
- evidence required and produced;
- validation gates;
- derived Git/GitHub/worktree state;
- structured stop conditions;
- next-candidate records;
- explicit authority flags.

Status: usable as an MVP data contract. It does not enforce migration or execute work.

## Scoring Rule Status

Canonical scoring files:

- `docs/brain/workorders/scoring/README.md`
- `docs/brain/workorders/scoring/next-work-order-scoring.schema.json`
- `docs/brain/workorders/scoring/next-work-order-scoring.rules.json`

The scoring policy defines:

- hard exclusions before scoring;
- weighted factors on a 100-point scale;
- decision bands;
- deterministic tie-breakers;
- required scoring-result output.

Status: advisory scoring contract exists. Scoring does not grant execution, merge, cleanup, protected-data, or production authority.

## Read-Only Query Tool Status

Canonical tool files:

- `docs/brain/workorders/tools/wo-query.mjs`
- `docs/brain/workorders/tools/wo-query.test.mjs`
- `docs/brain/workorders/tools/README.md`

The query tool currently:

- reads the seed registry and scoring rules;
- reports the active lane;
- reports completed and blocked work orders;
- recommends the next work order with rationale;
- supports text and JSON output;
- writes only to stdout.

The query tool does not:

- query GitHub live state;
- inspect worktrees;
- mutate files;
- stage, commit, push, merge, or mark PRs ready;
- execute work orders.

## Goal + Loop Integration Status

Canonical integration file:

- `docs/brain/workorders/goal-loop/README.md`

The integration establishes:

- goal owns intent;
- loop owns repeated execution inside an approved risk boundary;
- work order owns allowed systems, blocked systems, validation, evidence, and stop conditions;
- evidence proves completion;
- query output is advisory and must be checked against authority and scope before execution.

Status: doctrine exists. No runner exists.

## Operator Packet Status

Canonical operator packet:

- `docs/brain/workorders/operator/README.md`

The operator packet defines:

- Work Order Operator responsibilities;
- subagent patterns as execution patterns, not governance authorities;
- autonomous continuation rules;
- stop rules;
- merge-readiness rules;
- review-comment handling boundaries;
- evidence output expectations;
- local tooling reality boundaries.

Important authority boundary:

- The operator may report merge readiness only when scope/check/review conditions are satisfied.
- Merge remains a human authority wall unless the human explicitly authorizes that specific PR merge.

## Validation Results

Validation performed across the WOE MVP chain included:

- JSON parse checks for schema, registry, and scoring files.
- `git diff --check` for docs/schema/tooling packets.
- `node --test docs/brain/workorders/tools/wo-query.test.mjs` for the query tool.
- `node docs/brain/workorders/tools/wo-query.mjs --json` for read-only query smoke validation.
- GitHub PR checks before each merge.

WO-WOE-008 local validation:

```powershell
Test-Path docs\brain\workorders\evidence\WO-WOE-008-EVIDENCE-ROLLUP.md
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
```

## Known Limitations

- Registry is a seed, not a full work-order ledger.
- Query output depends on registry freshness and does not refresh live GitHub state.
- Scoring is advisory and deterministic, but it does not execute the result.
- The engine does not yet persist derived live state.
- The engine does not yet update registry records after merges.
- The engine does not yet monitor PR checks or review conversations.
- The engine does not perform branch/worktree hygiene.
- The engine does not replace Brain/Cortex authority, domain packs, local `AGENTS.md`, or human gates.

## Authority Walls

The Work Order Engine MVP must stop for:

- merge authority unless the specific PR merge is authorized;
- runtime or product behavior changes outside the current WO;
- CI/governance/tooling changes outside the current WO;
- secrets, credentials, PACS, county SQL, county data, release, deployment, or production resources;
- destructive cleanup without explicit authority;
- branch protection override, admin merge, or auth repair;
- conflicting canon between the Constitution, Brain/Cortex, domain packs, local `AGENTS.md`, and the WO;
- write behavior from read-only query/evidence tools.

## Recommended Next Program

Recommended next program: Program 2 - Backend Operational Excellence.

Goal:

Turn the backend into an operationally governed platform with explicit health, readiness, diagnostics, warning discipline, and release gates.

Recommended chain:

1. `WO-BACKEND-001` - Backend Reality Audit
2. `WO-BACKEND-002` - Build Warning Burn-down
3. `WO-BACKEND-003` - Service Registry Validation
4. `WO-BACKEND-004` - Health / Readiness Truth
5. `WO-BACKEND-005` - Release Gate Definition
6. `WO-BACKEND-006` - Operational Packet
7. `WO-BACKEND-007` - Evidence Rollup

This packet does not start that program. It records it as the next executable program candidate for owner review.

## Done / Not Done

Done:

- Work Order schema exists.
- Representative registry seed exists.
- Deterministic scoring policy exists.
- Read-only query tool exists and is validated.
- Goal + Loop integration doctrine exists.
- Operator packet exists.
- MVP evidence rollup exists.

Not done:

- No autonomous execution engine.
- No live PR/state polling inside the query tool.
- No registry auto-update after PR merge.
- No full historical WO migration.
- No backend operational-excellence work started.
- No runtime code, CI, deployment, or protected-data behavior changed.
