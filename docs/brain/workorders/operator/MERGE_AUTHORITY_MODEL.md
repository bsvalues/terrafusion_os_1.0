# Merge Authority Model (Canonical)

Work order: WO-MAO-001
Program: governed-multi-agent-operator-activation
Goal: GOAL-MAO-001
Loop: LOOP-MAO-001

This file is the single semantic source for merge authority. Playbooks may describe the procedure but
must not redefine these modes.

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

MAO-001 ratifies this model but does not enable portfolio-wide operator merge. The first grant is
limited to MAO-002's two exact pilot PRs after their dispatch packets and reservations exist.

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

## Post-Merge Verification

After every authorized merge, the operator fetches `origin/main`, records the merge commit, verifies
the expected and forbidden file sets, confirms applicable validation, and proceeds only when the active
Loop permits continuation.

STOP_TYPE: MERGE_AUTHORITY_MODEL_RATIFIED
