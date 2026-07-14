# Next Work Order Selection Rule


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-009

## Purpose

Codex should not ask "what next?" after every merge. The active `/goal` plus `/loop` selects the next
Work Order unless a stop gate is hit.

## Selection Order

1. Continue the current Work Order if incomplete.
2. Remediate the current PR if review comments or checks require it and the fix is in scope.
3. Post-merge verify the current Work Order if merge occurred.
4. Select the next Work Order declared in the current loop.
5. If the loop is complete, produce a next-lane recommendation from evidence.
6. Stop only if no approved loop remains or a stop gate appears.

## Required Inputs

Codex must use:

- current program register,
- active program playbook,
- goal/loop command map,
- PR state,
- review threads,
- remote checks,
- local validation,
- durable owner decisions linked by the active Goal/Loop/Work Order, including their scope, expiry,
  and revocation state.

## Stop Conditions

Stop instead of selecting next work when:

- the next Work Order is not declared,
- the next Work Order exceeds the recorded risk, system, file, or action authority,
- scope expands,
- validation is blocked,
- merge authority is missing,
- protected systems are implicated,
- canon conflicts.

STOP_TYPE: NEXT_WO_SELECTION_RULE_DEFINED
