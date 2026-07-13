# Governed Multi-Agent Operator Activation

**Program ID:** `PROGRAM-MAO-001`  
**Goal:** `GOAL-MAO-001`  
**Loop:** `LOOP-MAO-001`  
**Status:** Active  
**Current Work Order:** `WO-MAO-001`  
**Next Work Order:** `WO-MAO-002`

## Objective

Make governed parallel execution the default TerraFusion operating mode while preserving one Brain,
isolated mutable worktrees, explicit authority, protected boundaries, and evidence-backed completion.

One Brain means one authority for queue, sequencing, Work Orders, reservations, risk, proof,
review-diff, and commit-plan. It does not mean one worker. Multiple isolated workers may execute
dependency-cleared Work Orders concurrently when their path, contract, and environment reservations
do not conflict.

## Success Measures

The program closes only when the evidence rollup reports:

1. founder touches per merged Work Order;
2. sustained concurrent mutable lanes;
3. median Work Order cycle time before and after activation;
4. reservation violations reaching `main`;
5. unauthorized-scope merges;
6. operator-merge suspensions and restoration evidence;
7. automatic next-wave selection evidence.

Unknown historical founder-touch data remains `UNKNOWN`; it is never inferred.

## Work Order Chain

| Work Order | Purpose | Dependency | Completion evidence |
|------------|---------|------------|---------------------|
| `WO-MAO-000` | Audit governance contradictions and capture the pre-pilot denominator. | None | Source-cited matrix and historical metrics |
| `WO-MAO-001` | Reconcile authority semantics and ratify bounded operator merge. | MAO-000 | ADR, amended canon, evidence matrix |
| `WO-MAO-002` | Run a minimal, falsifiable two-lane pilot. | MAO-001 merged | Two dispatches, two PRs, independent post-merge checks |
| `WO-MAO-003` | Define reservations and enforce collisions mechanically. | MAO-002 evidence | Mechanical gate rejects intentional overlap and passes after release |
| `WO-MAO-004` | Compute executable nodes and conflict-free parallel waves. | MAO-003 merged | Deterministic planner evidence |
| `WO-MAO-005` | Create evidence-informed worker and assurance playbooks. | MAO-004 merged | Rules cite pilot, gate, or controlling doctrine |
| `WO-MAO-006` | Roll the proven model across the portfolio. | MAO-005 merged | Allocation, concurrency, incident, and rollback evidence |
| `WO-MAO-007` | Close the program based on measured outcomes. | MAO-006 merged | Final metrics and canon closeout |

## MAO-002 Pilot Contract

The pilot uses two agents, two disjoint mutable scopes, two worktrees, two branches, two Work Orders,
and two PRs. It tests:

- automatic continuation;
- zero founder queue routing;
- bounded-scope compliance;
- isolated-worktree compliance;
- operator-merge behavior;
- automatic next-action selection.

It does not prove reservation enforcement. MAO-003 owns that proof.

Each pilot PR receives a post-merge scope check from a separate read-only assurance-agent instance.
The reviewer is neither the implementation operator nor William.

## Pilot Merge Authority

MAO-001 ratifies the bounded, revocable Mode B model. It does not grant portfolio-wide merge
authority. The first pilot grant becomes effective only after MAO-002 records its two exact dispatch
packets, reservations, and PR identities. It covers only those two PRs and requires every condition in
the canonical [merge authority model](../operator/MERGE_AUTHORITY_MODEL.md).

Any suspension trigger immediately revokes the pilot grant. Restoration requires incident evidence,
normal-PR containment or rollback, verified `main`, corrected controls, and explicit ratification.

## Reservation Boundary

MAO-002 uses an auditable interim reservation ledger but deliberately disjoint paths. MAO-003 must add
mechanical overlap enforcement and red-team it with an intentional collision that identifies the
conflicting Work Order, PR, repository, and path.

## Cross-Repository Boundary

Cross-repository workers require a committed `PATH_CANON_REGISTER.md` that establishes exact canonical
path identity. This repository does not currently contain that register. Until it exists, cross-repo
dispatch is blocked and MAO-002 may use two disjoint path families in this canonical repository.

## True Authority Walls

A wall exists only when presently unresolved new owner authority is required. Production, live county,
credentials, protected data, irreversible destruction, constitutional change, unresolved canon, and
security exceptions remain protected. Failed tests, review comments, routine conflicts, approved
worktree repair, implementation choices, authorized behavior, and next-WO selection are not walls.

## Non-Goals

- No competing Brain or suite-local queue.
- No portfolio-wide operator merge in MAO-001.
- No runtime, backend, frontend, suite, production, credential, or county-data change.
- No claim that an honor-system reservation table is enforcement.

## Validation

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- exact changed-file scope review
- Markdown/link inspection
- required PR checks and zero unresolved review threads

