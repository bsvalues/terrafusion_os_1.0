# Work Order Lifecycle

Work order: WO-CODEX-OP-003
Program: codex-operator-playbook

## Canonical States

| State | Meaning | Operator action |
|-------|---------|-----------------|
| READY | Work Order is defined and dependencies are clear. | Create/enter clean worktree and verify scope. |
| IN_PROGRESS | Authorized work is being performed. | Mutate only authorized files and systems. |
| VALIDATING | Local validation is running. | Run required commands and classify failures. |
| PR_OPEN | PR exists. | Monitor checks and review. |
| REVIEW_REMEDIATION | Review comments exist. | Fix within authorized files or stop for scope expansion. |
| CHECK_WATCH | Checks are pending/rerunning. | Wait, update branch if routine, classify failures. |
| MERGE_READY | Checks green/acceptable, threads zero, scope clean. | Request merge authorization unless already granted. |
| MERGED | PR merged. | Fetch `origin/main` and record merge commit. |
| POST_MERGE_VERIFIED | Files/evidence verified on `origin/main`. | Continue if loop permits. |
| BLOCKED_OWNER_DECISION | Owner authority required. | Emit owner decision packet. |
| FAILED | Validation or state failed and cannot be repaired in scope. | Emit failure evidence and next valid action. |

## Result Classifier

| Result | Use when |
|--------|----------|
| PASS | Work Order completed and required evidence exists. |
| PASS_WITH_GAP | Work Order completed but explicitly records limitations or deferred proof. |
| BLOCKED_OWNER_DECISION | Owner authority is required before the next action. |
| FAILED_VALIDATION | Validation failed and cannot be repaired within scope. |
| FAILED_STATE | Worktree, branch, PR, or repo state is unsafe or contradictory. |

## Stop-Type Registry

| Stop type | Meaning |
|-----------|---------|
| MERGE_AUTH_REQUIRED | PR is merge-ready, but owner merge authorization is required. |
| HOOK_BYPASS_AUTH_REQUIRED | Local commit/push hook bypass is required. |
| SCOPE_EXPANSION_REQUIRED | Required fix touches files outside authorized scope. |
| VALIDATION_FAILURE_OUT_OF_SCOPE | Validation failed in a way the current WO cannot repair. |
| CONFLICTING_CANON | Two authority sources conflict. |
| UNSAFE_WORKTREE_STATE | Worktree is dirty, locked, incomplete, or has foreign changes. |
| DESTRUCTIVE_ACTION_AUTH_REQUIRED | Cleanup, force removal, reset, or deletion requires owner approval. |
| PROTECTED_RESOURCE_AUTH_REQUIRED | Secrets, county data, PACS, county SQL, live DB, production, or deployment is implicated. |

STOP_TYPE: WORK_ORDER_LIFECYCLE_DEFINED
