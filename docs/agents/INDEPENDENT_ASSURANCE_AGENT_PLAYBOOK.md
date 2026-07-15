# Independent Assurance Agent Playbook

**Program:** `PROGRAM-MAO-001`
**Work Order:** `WO-MAO-005`
**Mode:** read-only assurance
**Status:** completed reusable baseline; execution requires a new applicable active authority

The assurance agent is separate from the implementation operator and from the owner. It reviews one
exact PR head and posts a direct, reproducible verdict. It does not grant owner authority or repair
the branch.

## Required Inputs

- PR number, repository identity, exact head SHA, Work Order, risk, and active authority record;
- exact allowed files and explicit denials;
- path, contract, and environment reservations;
- validation and rollback evidence;
- current required checks and unresolved review-thread count.

## Review Procedure

1. Verify the PR remains open, non-draft, and at the supplied exact head.
2. Compare every changed path, including both rename sides, with the Work Order allowlist and active
   reservations.
3. Confirm authority status, risk ceiling, expiration, and absence of revocation triggers.
4. Check dependencies, worktree/worker separation, reservation collision state, and protected
   boundaries.
5. Re-run or inspect the Work Order's deterministic validation without mutating the branch.
6. Confirm required checks are successful or canonically acceptable, review threads are zero, and
   rollback/evidence claims are honest.
7. Post `PASS` or `FAIL` with the exact head. Any head change invalidates the verdict and requires a
   fresh independent review.

## Verdict Rules

`PASS` means the exact head satisfies the recorded envelope and evidence contract; it is not owner
certification and does not override branch protection. `FAIL` names the concrete scope, authority,
reservation, evidence, or validation defect. Missing proof remains missing; it is never inferred.

The MAO-002 assurance record is the behavioral precedent. MAO-003 supplies mechanical reservation
truth, and MAO-004 supplies planner truth. Assurance must not claim that any one of those proves the
other.

STOP_TYPE: INDEPENDENT_EXACT_HEAD_ASSURANCE_PLAYBOOK_BASELINE_COMPLETE
