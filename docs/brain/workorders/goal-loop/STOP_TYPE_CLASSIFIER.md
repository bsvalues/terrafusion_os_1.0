# Stop Type Classifier

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-004

## Purpose

STOP_TYPE values must tell Codex whether to continue, remediate, or stop for owner authority.

## Classifier

| STOP_TYPE | Class | Codex action |
|-----------|-------|--------------|
| `NO_STOP` | Continue | Continue the active loop. |
| `MERGE_AND_CONTINUE` | Continue | Squash-merge the eligible exact head, verify `origin/main`, close the WO, and continue. |
| `MERGE_AUTH_REQUIRED` | Owner wall only without applicable authority | Emit only when no standing or bounded Mode B/Mode C authority applies. |
| `LOCAL_TOOLING_BYPASS_USED` | Continue | Continue if the standing local-tooling exception applied and validation passed. |
| `LOCAL_TOOLING_BYPASS_REQUIRED` | Conditional wall | Stop only if no standing exception applies. |
| `VALIDATION_FAILED_REMEDIABLE` | Remediate | Fix within scope, rerun validation, continue. |
| `VALIDATION_FAILED_BLOCKED` | Owner wall | Stop with failure evidence and next valid action. |
| `REVIEW_REMEDIATION_REQUIRED` | Remediate | Fix review comments within authorized scope and continue. |
| `BRANCH_STRATEGY_CONFLICT` | Owner wall | Stop for branch/merge strategy decision. |
| `SCOPE_EXPANSION_REQUIRED` | Owner wall | Stop for owner scope decision. |
| `PRODUCTION_DEPLOYMENT_AUTH_REQUIRED` | Owner wall | Stop for deployment authority. |
| `COUNTY_PACS_SECRETS_BOUNDARY` | Owner wall | Stop for protected-resource authority. |
| `DESTRUCTIVE_ACTION_REQUIRED` | Owner wall | Stop for destructive-operation authority. |
| `CANON_CONFLICT` | Owner wall | Stop for canon or architecture decision. |

## Classification Rules

- Local tooling absence is not a validation failure when repository validation passed.
- Review comments are not owner walls when they remain inside authorized scope.
- Pending checks are not owner walls; Codex monitors until success, acceptable neutral/skipped, or failure.
- The active standing policy supplies merge authority for every already-ratified program and
  dependency-cleared Work Order inside its separately recorded scope.
- If `program_authorized`, `work_order_dependency_cleared`, `scope_within_authority`,
  `checks_green`, `unresolved_threads = 0`, and `no_true_authority_wall`, plus the remaining
  canonical exact-head, PR-state, reservation, and merge-state conditions all hold, classify
  `MERGE_AND_CONTINUE`.
- `MERGE_AUTH_REQUIRED` may not be emitted merely because an eligible PR is ready to merge.
- Pending checks, review feedback, ordinary conflicts, stale exact-head assurance, and technical
  uncertainty are operator watch or remediation states, not owner walls.
- Branch strategy conflicts are owner walls even when code quality is clean.

STOP_TYPE: STOP_TYPE_CLASSIFIER_DEFINED
