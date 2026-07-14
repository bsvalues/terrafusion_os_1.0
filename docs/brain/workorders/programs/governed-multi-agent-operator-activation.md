# Governed Multi-Agent Operator Activation

**Program ID:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Status:** Active
**Current Work Order:** `WO-MAO-001A`
**Next Work Order:** `WO-MAO-002`

**Source audit:** [`WO-MAO-000 Doctrine Conflict Audit Proof`](../../evidence/WO-MAO-000-proof.md)

## Owner Authorization Record

`OWNER-MAO-001-R5-GOVERNANCE-AMENDMENT` is completed with PR #1273. The active correction decision is
`OWNER-MAO-001A-AUTHORITY-STATE-SEPARATION` in `.governance/owner-decisions.json`. It authorizes only
the split authority-state contract and its exact files/actions. It does not activate MAO-002, grant
general R5 authority, authorize production or credentials, change suite boundaries, or permit runtime,
backend, frontend, package, lockfile, or product behavior changes.

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
| `WO-MAO-001A` | Separate one-time owner bootstrap authority from mutable operator execution state. | MAO-001 merged | Split schemas, interlock tests, owner/operator responsibility proof |
| `WO-MAO-002` | Run a minimal, falsifiable two-lane pilot. | MAO-001A merged and owner envelope granted once | Two dispatches, two PRs, independent post-merge checks |
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

**OPERATOR-MERGE AUTHORITY IS RATIFIED BUT NOT ACTIVE.**

MAO-001 ratified the bounded, revocable Mode B model. MAO-001A corrects its operational boundary.
The owner grants one bootstrap envelope containing the authorized operator and assurance identities,
repository set, path ceiling, risk ceiling, maximum two pilot merges, expiry, and suspension state.
Codex translates that grant into `MAO_002_PILOT_BOOTSTRAP_JSON`; William does not type variable JSON.
Codex then owns `MAO_002_PILOT_EXECUTION_JSON`, including dispatch packets, reservations, PR numbers,
exact current head SHAs, allowed paths, implementation identities, assurance evidence, and revision.
Review fixes and branch updates require Codex to refresh only the execution record and rerun the gate.
The execution record is bound to the exact bootstrap digest and both records bind to the checked-in
inactive `.governance/mao-002-pilot-merge-authority.json` policy. The required `governed-spine` check
rejects any execution field outside the owner envelope.

Any suspension trigger immediately revokes the pilot grant. Restoration requires incident evidence,
normal-PR containment or rollback, verified `main`, corrected controls, and explicit ratification.

The operator execution record has exactly two slots. A pilot-labeled or `codex/mao-002-*` PR fails
closed when either split record is absent, the owner envelope is not active, either record is
suspended, digests differ, the current head differs, scope or risk exceeds the envelope, reservations
are missing or overlap, reviewer independence is invalid, or the grant is expired. Owner fields are
forbidden in execution state and execution fields are forbidden in the owner envelope. Scope
evaluation includes both sides of a rename. No third PR can inherit the grant.

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
security exceptions remain protected. Recoverable in-scope test failures, review comments, routine
conflicts, approved worktree repair, implementation choices, authorized behavior, and next-WO
selection are not walls. A required validation failure that cannot be repaired in scope remains
`SW-06` and stops that lane.

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
