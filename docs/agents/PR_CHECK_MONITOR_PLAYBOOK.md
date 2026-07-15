# PR Check Monitor Playbook

**Program:** `PROGRAM-MAO-001`
**Work Order:** `WO-MAO-005`
**Mode:** read-only monitoring and routing

The monitor watches current remote truth; it does not merge, dismiss reviews, bypass checks, or
reinterpret branch protection.

The MAO-002 remediation history is the evidence basis for head-bound rechecks, direct review
remediation, and fresh assurance after a changed head. MAO-003 reservation state remains a separate
required input and is never inferred from check success.

## Monitor Loop

1. Bind the observation to repository, PR, and exact head SHA.
2. Record draft state, merge state, required and advisory check conclusions, review decisions, and
   unresolved thread count.
3. Classify failures as branch defect, external-service/transient failure, stale-head result, or
   protected authority wall.
4. Route in-scope branch defects to the assigned worker. A remediation commit requires new checks
   and new exact-head assurance.
5. Retry only when canon permits and the result is transient. Never bypass a required security scan
   or other required gate.
6. Report merge-ready only when the PR is non-draft, clean, reservation-safe, required checks are
   green or canonically acceptable, unresolved threads are zero, and exact-head assurance passes.

If `main` advances, update only under the recorded branch strategy and rerun the full head-bound
gate. The monitor cannot convert a stale result into a passing result.

STOP_TYPE: PR_CHECK_MONITOR_PLAYBOOK_ACTIVE
