# Merge Authority Model (Canonical)

Work order: WO-MAO-001
Program: governed-multi-agent-operator-activation
Goal: GOAL-MAO-001
Loop: LOOP-MAO-001

This file is the single semantic source for merge authority. Playbooks may describe the procedure but
must not redefine these modes.

Source audit: [`WO-MAO-000`](../../evidence/WO-MAO-000-proof.md). Owner authority is valid only when
recorded in `.governance/owner-decisions.json` or a canonically indexed successor register.

## Default Rule: Mode A

The owner merges unless recorded authority grants Mode B or Mode C. Mode A is mandatory for
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

**THE GENERAL MODE B DOCTRINE IS RATIFIED, AND THE MAO-002 BOUNDED OWNER ENVELOPE IS ACTIVE.** Owner
issue [#1276](https://github.com/bsvalues/terrafusion_os_1.0/issues/1276) activates only the bounded
MAO-002 grant for at most two docs-scoped pilot PRs; Mode A remains mandatory outside that grant.
Operator merge for a specific pilot PR remains fail-closed and inactive until both
`MAO_002_PILOT_BOOTSTRAP_JSON` and `MAO_002_PILOT_EXECUTION_JSON` validate together for the exact PR,
current head SHA, repository, allowed scope, and reservation records, with every other Mode B
condition satisfied. The [checked-in policy](../../../../.governance/mao-002-pilot-merge-authority.json)
intentionally remains `status: "inactive"` because a static policy ceiling cannot self-authorize.
Active authority comes only from the issue #1276 owner envelope plus the Codex-maintained operator
execution record, cryptographically bound to the envelope and policy and validated by
`governed-spine`. Editing the policy or execution record cannot create or broaden the owner grant.

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

## Suspension Response and Restoration

1. Suspend operator merge authority.
2. Contain or revert through a normal protected PR; do not rewrite `main`.
3. Verify and record the post-rollback `origin/main` SHA.
4. Produce incident and root-cause evidence, including the offending diff and reservation history.
5. Correct the doctrine or mechanical control and prove the correction.
6. Restore authority only through explicit owner ratification.

Restoration evidence must include the incident record, rollback PR/SHA, validation results, corrected
scope and reservation evidence, required-check proof, and the owner restoration decision.

For MAO-002, the machine interlock fails a registered pilot PR when either the owner envelope or
operator execution state is absent, expired, suspended, mismatched, or outside policy. The execution
record contains exactly two PR slots and validates each current head. Codex may revise that record
after review fixes, branch updates, assurance changes, or reservation updates without changing the
owner envelope. A third PR, higher risk, different repository, or broader path cannot inherit the
grant. Variable updates do not change `main` or either pilot head, so strict up-to-date protection
remains satisfiable.

## Post-Merge Verification

After every authorized merge, the operator fetches `origin/main`, records the merge commit, verifies
the expected and forbidden file sets, confirms applicable validation, and proceeds only when the active
Loop permits continuation.

STOP_TYPE: MERGE_AUTHORITY_MODEL_RATIFIED
