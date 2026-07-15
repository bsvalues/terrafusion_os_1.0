# WO-MAO-004 - Executable Graph and Parallel Wave Planner Evidence

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Base:** `5660f153b810b2c25b04c59b5cfa4e8fa74ae7ed`
**Risk:** `R3`
**Mode:** bounded governance tooling, read-only output

## Atomic Transition

This Work Order corrects the state left after PR #1284 and implements the successor in one PR:

- `OWNER-MAO-003-R3-RESERVATION-GATE-20260714` is `completed`;
- predecessor PR: #1284;
- exact predecessor head: `dd268976b93893dbaa731f6eb117491d68d30d11`;
- predecessor merge commit: `5660f153b810b2c25b04c59b5cfa4e8fa74ae7ed`;
- predecessor evidence: `docs/brain/workorders/evidence/WO-MAO-003-RESERVATION-GATE.md`;
- `WO-MAO-003` is complete;
- `WO-MAO-004` is the only active MAO Work Order and implementation/merge authority;
- `WO-MAO-005` is next.

The transition regression reads the live owner-decision register and queue. It fails if the completed
predecessor is executable or if the active authority/current/next state drifts.

## Planner Contract

`wo-wave-plan.mjs` is a pure planning surface layered on the existing Work Order registry and scoring
rules. It accepts:

- one registry and scoring policy;
- one authority ceiling;
- one maximum-worker budget;
- one repository identity;
- explicit reservation claims for every candidate;
- optional active reservations from governed assignment state.

It returns a stable JSON plan containing the initial executable set, projected dependency-unlock
waves, budget utilization, reservation claims, and deterministic explanations for excluded nodes.
The schema is `parallel-wave-plan.schema.json`.

### Safety semantics

- only `ready` records are dispatch candidates; `proposed` is not executable;
- terminal, active, blocked, unsupported, over-authority, and protected-boundary records are excluded;
- dependency contradictions, cycles, missing nodes, and malformed claims fail closed;
- allowed-file globs are not treated as reservation authority;
- every candidate requires explicit repository-bound path, contract, or environment claims;
- path overlap uses MAO-003 exact/subtree semantics;
- contract and environment overlap requires exact identifier equality;
- stale active reservations remain blocking;
- released reservations and explicitly verified completed handoff-source reservations do not block;
- unverified handoff state and non-active candidate claims fail closed;
- a blocked lane does not freeze unrelated ready records;
- later waves are projections contingent on successful completion of earlier waves;
- each wave uses a bounded exact search for a maximum-cardinality conflict-free set;
- the search fails closed if its explicit node budget is exceeded;
- the planner performs no dispatch, reservation, PR, merge, repository, GitHub, or authority mutation.

## Proof Matrix

| Proof | Result |
|-------|--------|
| Existing `wo-query` regression suite | PASS |
| Completed predecessor excluded | PASS |
| Exactly one active MAO authority | PASS |
| MAO-003 complete / MAO-004 active / MAO-005 next | PASS |
| Dependency unlock projection | PASS |
| Blocked-lane bypass | PASS |
| Exact/subtree path conflicts | PASS |
| Contract/environment exact conflicts | PASS |
| Active and stale reservation blocking | PASS |
| Released reservation nonblocking | PASS |
| Maximum-cardinality worker-budget selection | PASS |
| Duplicate ID and dependency contradiction rejection | PASS |
| Dependency cycle isolation | PASS |
| Unsupported path-glob rejection | PASS |
| Missing explicit reservation claims rejected | PASS |
| Proposed records not dispatched | PASS |
| Byte stability and no input mutation | PASS |
| Registry input permutation invariance | PASS |

Focused command:

```text
node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs
35 tests passed; 0 failed; 0 skipped.
```

Full local proof wall:

| Gate | Result |
|------|--------|
| `corepack pnpm install --frozen-lockfile` in isolated worktree | PASS; ignored dependency state only |
| `package.json` SHA-256 before/after | unchanged: `AE1B423C71421A30983D06D8F303E4B556E674F3551CBB226CF1F33AB500C0D6` |
| `pnpm-lock.yaml` SHA-256 before/after | unchanged: `D23687DD59C77E400D392DC99BB3F12308761377368D686528868C22615489A0` |

`brain review-diff` and `brain commit-plan` were also invoked with both `WO-MAO-004` and the full
active-packet basename. The current Brain helper only resolves its legacy numeric filename form, so
it reported the MAO packet as not found and could not enforce packet scope. The exact 15-file scope
was instead checked directly and by independent review. This is a tooling limitation, not a passing
Brain-scope claim.
| `corepack pnpm run type-check` | PASS |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS; 56 tests |
| `python scripts/ci/__tests__/mao-003-reservations.test.py` | PASS; 22 tests |
| planner output against `parallel-wave-plan.schema.json` | PASS |
| reserved-boundary check | CLEAN; 0 violations |
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS |
| `node docs/brain/workorders/tools/wo-wave-plan.mjs --json` | PASS, fail-closed seed result |

## Honest Limitation

The checked-in `work-order-registry.seed.json` describes itself as representative, is not the full
portfolio queue, contains no MAO nodes, and carries no explicit candidate reservations or repository
identity. Therefore the default planner invocation returns no dispatchable waves and explains the
missing reservation identity/claims. This is a correct fail-closed result, not evidence that the
portfolio has no executable work.

The planner does not create a second queue. A complete registry and governed reservation snapshot are
prerequisites for operational dispatch. Cross-repository planning remains blocked until
`PATH_CANON_REGISTER.md` exists on the active base.

## Durable Continuation Envelope Proposal

The owner directive `PER_PR_OWNER_GATING_MUST_END` is implemented as an inactive machine-readable
proposal: `OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`.

The proposal covers MAO-005 through MAO-007 and, once separately ratified, permits Codex to select
planner-safe waves; create isolated worktrees; maintain PR numbers, exact SHAs, reservations, workers,
review state, and assurance; remediate; and perform bounded Mode B merges without per-PR owner grants.
It automatically suspends on scope expansion, protected boundaries, failed checks, unresolved review,
assurance failure, collision, stale reservation, conflicting authority, false evidence, or expiration.
The proposed envelope expires at `2026-10-12T23:59:59Z` if MAO-007 has not already merged or another
terminal/suspension condition has not already consumed it.

It explicitly denies runtime, backend, frontend, product, package, lockfile, tools-sync, CI, workflow,
branch-protection, deployment, production, county, PACS, SQL, credential, secret, protected-data,
destructive, force-push, required-gate-bypass, and unrestricted portfolio authority.
The file envelope is an exact allowlist of the six new subordinate agent-playbook documents and the
named MAO-005 through MAO-007 work-order, evidence, routing, and program-state files. It does not
authorize changes to the Constitution, root canon, `AGENTS.md`, `ADR-EXEC-001`, existing mandatory
agent policy, the Brain authority hierarchy, or domain packs.

The proposal is not active and cannot authorize MAO-005 until the owner ratifies the exact envelope.
After this PR merges, the one intended authority packet is:

```text
OWNER_DECISION: APPROVED
DECISION_ID: OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE
AUTHORIZE: activate the exact proposed PROGRAM-MAO-001 continuation envelope recorded by
WO-MAO-004 for WO-MAO-005 through WO-MAO-007, with Codex-owned mutable execution state, automatic
conflict-free wave continuation, bounded Mode B merge under the R3 ceiling, fail-closed suspension,
explicit protected-boundary denials, and atomic WO-MAO-004 closeout / WO-MAO-005 activation.
```

This is a program-envelope decision, not a MAO-005-only PR authorization.

## Rollback

Use a normal revert PR to remove the planner/schema/evidence and restore a consistent predecessor and
successor state. Do not force-push or mutate `main` directly.

STOP_TYPE: MAO_004_WAVE_PLANNER_EVIDENCE_COMPLETE
