# Work Order Engine Goal + Loop Integration

## Purpose

This packet connects the Work Order registry and read-only query output to TerraFusion's Goal + Loop
operating model.

The integration is doctrine only. It does not create an autonomous runner, mutate GitHub state, change
CI, or grant merge/deployment authority.

## Authority Boundary

The Work Order Engine participates in the existing one-Brain governance model:

1. A goal owns intent.
2. A loop owns repeated execution inside an approved risk boundary.
3. A Work Order owns the governed packet: scope, allowed systems, blocked systems, evidence, validation,
   and stop conditions.
4. Evidence proves completion.

The query tool can recommend what appears next from registry and scoring evidence. It cannot authorize
execution by itself.

## Canonical Flow

```text
goal intent
  -> work-order registry records
  -> read-only query/scoring
  -> operator selects the next dependency-cleared WO inside recorded authority
  -> loop executes within WO authority
  -> validation and PR evidence
  -> registry/evidence update in a later governed packet
```

## Responsibility Split

| Layer | Owns | Does not own |
| --- | --- | --- |
| Goal | Program intent, target lane, risk ceiling | File mutation or merge authority |
| Loop | Repeat execution until pass/block/authority wall | Scope expansion beyond the WO |
| Work Order | Allowed systems, blocked systems, validation, evidence | Competing Brain or suite-local queue |
| Query Tool | Advisory next-WO scoring from current registry data | Live PR mutation, branch cleanup, merge |
| Evidence | Proof that completion criteria were met | Future authorization by implication |

## Loop Consumption Rules

A Goal + Loop may consume query output only after confirming:

- the registry source is known;
- the scoring policy source is known;
- the authority risk class is explicit;
- the recommended WO has no hard exclusions;
- dependencies are satisfied or waived in evidence;
- the recommended WO's allowed systems match the current chain;
- stop conditions are compatible with the current operator authority.

If any item is uncertain, the loop first performs bounded read-only canon lookup and live-state
inspection. It downgrades to discovery or stops with a classified blocker only when material
uncertainty remains after that lookup.

## Status Semantics

The loop treats Work Order status as operational state:

- `proposed` and `ready` may be candidates when dependencies and risk fit.
- `in_progress`, `pr_open`, and `review` are active work, not new candidates.
- `blocked` and `deferred` are classified blockers, not unsupported states.
- `complete` and `merged` are completion evidence.
- `cancelled` and `superseded` are terminal but not completion evidence.

## Stop Gates

The loop must stop when the next step requires:

- runtime/product behavior outside the current WO;
- CI/governance changes outside the current WO;
- protected data, secrets, PACS, county SQL, county data, release, or deployment authority;
- destructive cleanup without explicit authority;
- merge authority when it is not already granted for the chain;
- conflicting canon between the Constitution, Brain/Cortex, domain packs, local `AGENTS.md`, and the WO;
- write behavior from a read-only tool.

## Evidence Handoff

Every completed loop slice should leave one of:

- merged PR;
- evidence document;
- validation output captured in PR body/comment;
- classified blocker with next recommended WO;
- explicit stop-gate decision.

The Work Order Engine does not require every evidence artifact to be immediately backfilled into the
registry. Registry updates are separate governed data packets.

## Non-Goals

This integration does not:

- implement a runner;
- query GitHub live state;
- mutate branches, worktrees, PRs, or checks;
- migrate existing Work Orders;
- change branch protection;
- grant merge authority;
- authorize production, deployment, secrets, PACS, county SQL, or county data access.

## Validation

Expected validation for this packet:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
```
