# Governed Multi-Agent Operator Activation

**Program ID:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Status:** Closed - PASS_WITH_GAPS
**Current Work Order:** `WO-MAO-007` complete
**Next Work Order:** Portfolio reconciliation

**Source audit:** [`WO-MAO-000 Doctrine Conflict Audit Proof`](../../evidence/WO-MAO-000-proof.md)

## Owner Authorization Record

`OWNER-MAO-001-R5-GOVERNANCE-AMENDMENT` is completed with PR #1273, and
`OWNER-MAO-001A-AUTHORITY-STATE-SEPARATION` is completed with PR #1274. Issue #1276 records the
one-time MAO-002 owner bootstrap envelope; Codex owns the changing pilot execution state. Issue #1277
authorizes and records the bounded hook-runtime and native worker-plane repair. These records do not
grant general R5 authority, authorize production or credentials, change suite boundaries, or permit
runtime, backend, frontend, package, lockfile, or product behavior changes.

`OWNER-MAO-004-R3-WAVE-PLANNER-20260714` completed with PR #1286 and merge commit
`4b3c38a8eed9858ed72cc27ffcbd9c0d8456b7c9`. The owner then ratified
`OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`, which supplied bounded authority for MAO-005
through MAO-007 and is completed and consumed at closeout.

## Worker-Plane Repair Evidence

The pre-pilot repair prerequisite is complete:

- [R1 hook runtime repair](../../evidence/WO-MAO-002-R1-HOOK-RUNTIME-REPAIR.md)
- [R2 isolated mutable lane proof](../../evidence/WO-MAO-002-R2-MUTABLE-LANE-B-PROOF.md)
- [read-only child result record](../../evidence/WO-MAO-002-R0-READ-ONLY-CHILD-RESULTS.md)
- [worker-plane repair rollup](../../evidence/WO-MAO-002-WORKER-PLANE-REPAIR.md)

The linked child records and root collection rollup establish five native bounded completions: three
independent read-only agents and two concurrent mutable agents in separate clean worktrees with
disjoint single-file reservations. This proof clears the worker-plane prerequisite but is not counted
as either MAO-002 pilot PR.

## Pilot Completion Evidence

`WO-MAO-002` completed with PR #1281 merged at
`405677e151955b48d3e5f8abd269238736d2ab74` and PR #1280 merged at
`4f68ba4c689f100eb822f18bdb07a5c5b082a660`. The canonical
[post-merge assurance](../../evidence/WO-MAO-002-POST-MERGE-ASSURANCE.md) records exact heads,
reservations, independent reviews, checks, cycle times, founder touches, rollback class, and protected
scope proof. The pilot had zero founder queue-routing touches after the one-time bootstrap grant.

The pilot deliberately did not test overlapping reservations. `WO-MAO-003` closed that gap in PR
#1284, which mechanically rejected an intentional overlap and proved recovery after explicit release
or reciprocal handoff. `WO-MAO-004` now owns the deterministic executable graph and parallel-wave
planner.

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
| `WO-MAO-005` | Create evidence-informed worker and assurance playbooks. | MAO-004 merged | COMPLETE - PR #1287 |
| `WO-MAO-006` | Roll the proven model across the portfolio. | MAO-005 merged | COMPLETE - PR #1288 |
| `WO-MAO-007` | Close the program based on measured outcomes. | MAO-006 merged | COMPLETE - PASS_WITH_GAPS |

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

## Pilot Merge Authority Completion

**GENERAL MODE B IS RATIFIED; THE MAO-002 GRANT IS COMPLETE AND INACTIVE.**

MAO-001 ratified the bounded, revocable Mode B model, and MAO-001A corrected its operational boundary.
Issue #1276 supplied one owner bootstrap envelope; Codex translated it into the bootstrap variable and
owned the separate execution variable. Both authorized PRs merged, independent assurance passed, and
Codex removed both operational variables together after recording completion. William did not
maintain PR numbers, head SHAs, reservations, or variable JSON.

The checked-in `.governance/mao-002-pilot-merge-authority.json` policy remains inactive and fail-closed.
Issue #1276 remains the durable authority record, not an active grant. A future Mode B lane requires a
new applicable recorded grant and cannot inherit MAO-002 authority.

During MAO-002, the execution record had exactly two slots and the gate failed closed on absent or
mismatched records, suspension, head drift, scope or risk expansion, reservation overlap, reviewer
identity failure, expiry, and both sides of a rename. No third PR can inherit the completed grant.

## Reservation Boundary

MAO-002 uses an auditable interim reservation ledger but deliberately disjoint paths. MAO-003 must add
mechanical overlap enforcement and red-team it with an intentional collision that identifies the
conflicting Work Order, PR, repository, and path.

MAO-003 implements that boundary through the canonical
[`MAO Dispatch and Reservation Contract`](../schema/MAO_DISPATCH_RESERVATION_CONTRACT.md), checked-in
JSON schemas, and the required `governed-spine` verifier. Mutable assignment state lives in the
governed PR body, not an owner-maintained variable or a second queue. Any checked PR participating in
an overlap fails until explicit release or reciprocal handoff; unrelated lanes continue. Stale
reservations remain blocking. The program may route to MAO-004 only after the exact-scope MAO-003 PR
merges.

## Executable Graph Boundary

`WO-MAO-004` consumes the canonical Work Order registry, scoring rules, explicit repository-bound
candidate claims, and governed active reservations. It emits a deterministic read-only plan with the
initial executable set, projected dependency-unlock waves, worker-budget utilization, and an
explanation for every selected or excluded node.

The planner does not infer reservations from allowed-file globs, dispatch workers, mutate assignment
state, create PRs, merge, or grant authority. Stale active reservations remain blocking. A blocked
lane does not freeze unrelated ready work. Cross-repository planning remains blocked until canonical
path identity exists.

## Completed Program Continuation Envelope

`OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE` was activated on base
`4b3c38a8eed9858ed72cc27ffcbd9c0d8456b7c9`. It covers MAO-005 through MAO-007 under a bounded,
revocable R3 ceiling. It assigns mutable PR, SHA, worktree, reservation, worker, remediation, and
assurance state to Codex and fails closed on scope expansion, protected boundaries, failed checks,
unresolved review, assurance failure, reservation collision, stale reservation, conflicting
authority, false evidence, or expiration.

The envelope replaced per-PR owner gating only for eligible remaining MAO Work Orders. It preserved
explicit denials for runtime, production, county, PACS, SQL, credentials, secrets, destructive
actions, and unrestricted portfolio authority. It is completed and consumed by WO-MAO-007. No future
work inherits it; the program routes to Portfolio Operator reconciliation.

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
