# Multi-Agent Operator Brief

## Default

Start only planner-selected eligible Work Orders, up to the maximum safe conflict-free wave within
the planner's authorized worker budget. Dependencies must be satisfied, authority active, risk
within the recorded ceiling, and path, contract, repository, and environment reservations
conflict-free. A blocked lane does not freeze unrelated lanes.

## One Brain, Multiple Workers

The TerraFusion Brain owns queue, sequencing, risk, reservations, proof, review-diff, and
commit-plan. Workers receive bounded assignments in isolated worktrees; they do not create local
queues or independent authority.

## Five Operator Checks

1. **Authority:** active, applicable, unexpired, and not revoked.
2. **Dependency:** every predecessor is complete and the planner input is canonical.
3. **Isolation:** one Work Order, branch, worktree, worker, and PR.
4. **Reservations:** explicit repository-bound claims; no overlap or stale state.
5. **Completion:** required checks, zero unresolved threads, exact-head assurance, merge authority,
   post-merge verification, and honest evidence.

## Stop

Fail closed on scope expansion, protected boundaries, failed required checks, assurance failure,
unresolved review, reservation collision, stale reservation, conflicting authority, false evidence,
or expiration. Routine PR numbers, SHAs, worker assignments, remediation, and next-wave routing are
operator state, not owner tasks.

## Evidence Chain

- MAO-002: bounded two-lane execution and independent assurance.
- MAO-003: mechanical collision rejection and recovery.
- MAO-004: deterministic conflict-free wave planning.
- MAO-005: these subordinate, evidence-informed operating playbooks.

STOP_TYPE: MULTI_AGENT_OPERATOR_BRIEF_ACTIVE
