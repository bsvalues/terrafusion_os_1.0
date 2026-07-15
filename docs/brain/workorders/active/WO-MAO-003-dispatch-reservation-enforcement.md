# WO-MAO-003 - Dispatch and Reservation Enforcement

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Base:** `c46c19735f836907bdbd64755f2d0737105af7f3`
**Risk:** `R3`
**Merge mode:** bounded `B`
**Status:** In progress

## Objective

Replace the pilot's honor-system disjoint scopes with a deterministic mechanical gate for path,
contract, and environment reservations. Preserve one Brain: the gate reads mutable assignments from
open governed PRs and does not create another queue.

## Completion Contract

- worker assignments bind repository, Work Order, PR number, exact head, worker, risk, and reservations;
- registered changed files remain inside active path reservations, including both rename sides;
- a later overlapping reservation fails and names both Work Orders, PRs, repository, and resource;
- stale active reservations fail closed;
- explicit release or reciprocal handoff preserves evidence and clears the collision;
- tests prove first-pass, overlap-fail, and post-release/handoff pass;
- the verifier runs inside the already-required `governed-spine` context.

## Authority

`OWNER-MAO-003-R3-RESERVATION-GATE-20260714` authorizes only the files listed in
`.governance/owner-decisions.json`, one exact-scope Mode B merge, and post-merge routing to
`WO-MAO-004`. It grants no runtime, production, protected-data, force-push, or MAO-004 merge authority.

## Validation

- `python scripts/ci/__tests__/mao-003-reservations.test.py`
- `python -m py_compile scripts/ci/verify-mao-003-reservations.py`
- `python scripts/ci/__tests__/mao-002-pilot-authority.test.py`
- `bash scripts/ci/__tests__/governance-canon-scripts.test.sh`
- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- exact-scope review, independent assurance, required remote checks, zero unresolved threads

STOP_TYPE: MAO_003_RESERVATION_GATE_READY_FOR_VALIDATION
