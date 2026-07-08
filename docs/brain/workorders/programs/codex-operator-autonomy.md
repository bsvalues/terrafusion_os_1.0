# Codex Operator Autonomy Program

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Status: active until merged, then governing operator baseline

## Mission

Eliminate human courier mode. Codex is the TerraFusion Work Order operator. The human owner remains
the authority gate for true authority walls.

## Success State

This program is complete when:

- a courier-friction audit exists,
- operator authority buckets are explicit,
- `/goal` and `/loop` contracts are defined,
- STOP_TYPE classification is standardized,
- PR lifecycle, review remediation, hook exception, merge authority, and next-WO selection rules exist,
- evidence output format is standardized,
- Release Engineering has an operator-autonomy application path,
- a rollup records the governing baseline and non-claims.

## Work Order Chain

| Work Order | Mode | Deliverable | Stop Type |
|------------|------|-------------|-----------|
| `WO-OP-AUTO-000` | read-only | `docs/brain/workorders/evidence/WO-OP-AUTO-000-COURIER-FRICTION-AUDIT.md` | `COURIER_FRICTION_AUDIT_COMPLETE` |
| `WO-OP-AUTO-001` | docs/governance | `docs/brain/workorders/programs/CODEX_OPERATOR_AUTHORITY_MATRIX.md` | `OPERATOR_AUTHORITY_MATRIX_DEFINED` |
| `WO-OP-AUTO-002` | docs/governance | `docs/brain/workorders/goal-loop/GOAL_CONTRACT.md` | `GOAL_CONTRACT_DEFINED` |
| `WO-OP-AUTO-003` | docs/governance | `docs/brain/workorders/goal-loop/LOOP_CONTRACT.md` | `LOOP_CONTRACT_DEFINED` |
| `WO-OP-AUTO-004` | docs/governance | `docs/brain/workorders/goal-loop/STOP_TYPE_CLASSIFIER.md` | `STOP_TYPE_CLASSIFIER_DEFINED` |
| `WO-OP-AUTO-005` | docs/governance | `docs/brain/workorders/playbooks/CODEX_PR_LIFECYCLE_PLAYBOOK.md` | `CODEX_PR_LIFECYCLE_PLAYBOOK_DEFINED` |
| `WO-OP-AUTO-006` | docs/governance | `docs/brain/workorders/playbooks/REVIEW_REMEDIATION_AUTONOMY.md` | `REVIEW_REMEDIATION_AUTONOMY_DEFINED` |
| `WO-OP-AUTO-007` | docs/governance | `docs/brain/workorders/playbooks/LOCAL_TOOLING_HOOK_EXCEPTION_POLICY.md` | `LOCAL_TOOLING_HOOK_EXCEPTION_POLICY_DEFINED` |
| `WO-OP-AUTO-008` | docs/governance | `docs/brain/workorders/playbooks/MERGE_AUTHORITY_MODEL.md` | `MERGE_AUTHORITY_MODEL_DEFINED` |
| `WO-OP-AUTO-009` | docs/governance | `docs/brain/workorders/goal-loop/NEXT_WO_SELECTION_RULE.md` | `NEXT_WO_SELECTION_RULE_DEFINED` |
| `WO-OP-AUTO-010` | docs/governance | `docs/brain/workorders/evidence/CODEX_EVIDENCE_OUTPUT_STANDARD.md` | `CODEX_EVIDENCE_OUTPUT_STANDARD_DEFINED` |
| `WO-OP-AUTO-011` | docs/governance | Release Engineering autonomy routing in active playbook/register | `RELEASE_ENGINEERING_OPERATOR_AUTONOMY_APPLIED` |
| `WO-OP-AUTO-012` | docs/governance rollup | `docs/brain/workorders/evidence/WO-OP-AUTO-012-OPERATOR-AUTONOMY-ROLLUP.md` | `OPERATOR_AUTONOMY_ROLLUP_READY_FOR_PR` |

## Continuation Rule

Codex may continue through this chain without owner relay while all are true:

- changed files remain under `docs/brain/workorders/**`,
- validation passes,
- no runtime/backend/tools-sync/CI/deployment/county files are touched,
- no protected resource boundary appears,
- review remediation remains within scope.

## Stop Walls

Stop for:

- merge authority unless pre-authorized,
- branch/merge strategy conflict,
- destructive operation outside exact worktree repair authority,
- production/deployment/county/PACS/secrets boundary,
- runtime/backend/tools-sync/CI/deployment/county change,
- validation failure not remediable in scope,
- canon conflict,
- scope expansion.

## Non-Goals

This program does not create a scheduler, GitHub app, autonomous runner, CI workflow, branch
protection change, deployment pipeline, runtime automation, or production control plane.
