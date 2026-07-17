# Merge Authority Model (Canonical)

Work order: WO-MAO-001
Program: governed-multi-agent-operator-activation
Goal: GOAL-MAO-001
Loop: LOOP-MAO-001

This file is the single semantic source for merge authority. Playbooks may describe the procedure but
must not redefine these modes.

Source audit: [`WO-MAO-000`](../../evidence/WO-MAO-000-proof.md). Owner authority is valid only when
recorded in `.governance/owner-decisions.json` or a canonically indexed successor register.

## Default Rule: Mode A for Unratified or Protected Boundaries

Mode A applies when no standing or bounded merge authority covers the action. It is mandatory for
constitutional changes, production/deployment, protected security policy, secrets, PACS, county SQL,
county data, destructive operations, and any PR outside a bounded operator grant.

## Mode B: Preauthorized Operator Merge

The owner may grant operator merge for one PR, an exact PR batch, or a bounded PR class in a recorded
Goal/Loop/Work Order. Every merge requires:

- authority record is active and identifies the eligible PR or bounded class;
- PR is open and non-draft;
- changed files match the exact Work Order scope;
- no active path, contract, repository, or environment reservation conflicts;
- required checks pass or have an explicitly documented acceptable neutral/skipped result;
- unresolved review threads are zero;
- merge state is clean and the merge method follows repository policy;
- evidence and rollback are complete;
- no production, credential, county-data, PACS, destructive, or protected-security boundary is crossed.

**THE GENERAL MODE B DOCTRINE AND STANDING DELIVERY GRANT ARE ACTIVE.** The active decision
`OWNER-TF-STANDING-OPERATOR-AUTHORITY` covers routine delivery for every already-ratified program and
dependency-cleared Work Order inside its separately recorded scope. It does not authorize a new
program, objective, file scope, risk, product behavior, deployment, protected resource, destructive
action, or external commitment.

When all Mode B conditions pass and no true authority wall exists, the result is
`MERGE_AND_CONTINUE`. No per-WO or per-PR owner approval is required. `MERGE_AUTH_REQUIRED` may be
emitted only when no applicable standing or bounded authority exists.

The historical MAO-002 bounded owner envelope is consumed and inactive. Owner issue
[#1276](https://github.com/bsvalues/terrafusion_os_1.0/issues/1276) authorized
at most two docs-scoped pilot PRs. Both slots were consumed by PRs #1281 and #1280, independent
post-merge assurance passed, and the paired operational repository variables were removed together
to release their reservations. Its completion does not revoke or narrow the later standing grant.

During the pilot, operator merge remained fail-closed until `MAO_002_PILOT_BOOTSTRAP_JSON` and
`MAO_002_PILOT_EXECUTION_JSON` validated together for the exact PR, head SHA, repository, allowed
scope, and reservations. The
[checked-in policy](../../../../.governance/mao-002-pilot-merge-authority.json) remains
`status: "inactive"`; a static policy ceiling cannot self-authorize, and the completed pilot does not
create continuing Mode B authority.

## Mode C: Auto-Merge Armed

Mode C is Mode B with repository auto-merge enabled. It is permitted only when the recorded grant
allows auto-merge, branch protection supports it, and every Mode B condition remains true. Auto-merge
does not bypass checks, review resolution, up-to-date requirements, or reservations.

## Automatic Suspension

Operator merge authority suspends immediately when any of these reaches `main` or is discovered in an
eligible merge:

- unauthorized path or material scope expansion;
- reservation collision;
- required gate bypass or misclassification;
- protected production, credential, county-data, PACS, destructive, or security boundary crossing;
- falsely represented evidence or rollback.

Suspension applies to the affected grant and any broader grant that depends on the failed control. New
operator merges stop until restoration is ratified.

The standing grant also suspends for explicit owner revocation or narrowing. Suspension affects only
the authority implicated by the trigger; it does not turn unrelated routine engineering into owner
work.

## Suspension Response and Restoration

1. Suspend operator merge authority.
2. Contain or revert through a normal protected PR; do not rewrite `main`.
3. Verify and record the post-rollback `origin/main` SHA.
4. Produce incident and root-cause evidence, including the offending diff and reservation history.
5. Correct the doctrine or mechanical control and prove the correction.
6. Restore authority only through explicit owner ratification.

Restoration evidence must include the incident record, rollback PR/SHA, validation results, corrected
scope and reservation evidence, required-check proof, and the owner restoration decision.

For MAO-002, the machine interlock failed a registered pilot PR when either the owner envelope or
operator execution state was absent, expired, suspended, mismatched, or outside policy. The execution
record contained exactly two PR slots and validated each current head. Codex revised that record after
review fixes, branch updates, assurance changes, and reservation updates without changing the owner
envelope. No third PR, higher risk, different repository, or broader path can inherit the completed
grant. Removing the paired operational variables after both merges returned the interlock to its
checked-in inactive posture.

## Post-Merge Verification

After every authorized merge, the operator fetches `origin/main`, records the merge commit, verifies
the expected and forbidden file sets, confirms applicable validation, and proceeds only when the active
Loop permits continuation.

STOP_TYPE: MERGE_AUTHORITY_MODEL_RATIFIED
