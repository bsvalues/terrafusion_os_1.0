# Agent Failure, Retry, And Reassignment Playbook

**Program:** `PROGRAM-MAO-001`
**Work Order:** `WO-MAO-005`
**Status:** completed reusable baseline; execution requires a new applicable active authority

Retries and reassignments preserve authority, worktree isolation, reservations, and evidence. They
do not create broader authority.

## Classification

| Failure | Action |
|---------|--------|
| Transient read-only service failure | Bounded retry with unchanged head and scope; record attempts. |
| Worker process failure before a commit | Quarantine the worktree, verify branch state, and reassign only after ownership is unambiguous. |
| Remediation required | Same worker or explicitly reassigned worker updates the same bounded branch; refresh exact head and assurance. |
| Stale or colliding reservation | Do not retry around it. Release, renew, or perform reciprocal handoff through the MAO-003 contract. |
| Required-check or assurance failure | Fail closed until the defect is corrected and the new exact head passes. |
| Protected boundary or scope expansion | Suspend the lane and active continuation authority as applicable; request owner action. |

## Reassignment Contract

1. Preserve the Work Order and PR identity unless canon explicitly requires replacement.
2. Stop the old worker and make mutable ownership exclusive before starting the replacement.
3. Record the new worker identity and update reservation handoff evidence.
4. Never let two workers mutate the same worktree or branch concurrently.
5. Re-run identity checks, validation, remote checks, and independent exact-head assurance.
6. Do not force-push, reset, clean, or discard unique commits without explicit authority.

A blocked lane does not freeze unrelated conflict-free waves. The orchestrator may continue other
eligible nodes while this lane remains safely contained.

STOP_TYPE: AGENT_RETRY_REASSIGNMENT_PLAYBOOK_BASELINE_COMPLETE
