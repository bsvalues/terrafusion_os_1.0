# Codex Evidence Output Standard

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-010

## Purpose

Codex output must be evidence-first. Chatty progress is not a substitute for proof.

## Required Result Format

```text
RESULT:
WORK_ORDER:
PROGRAM:
GOAL:
LOOP:
BRANCH:
COMMIT:
PR:
FILES_CHANGED:
VALIDATION_RUN:
VALIDATION_RESULT:
REMOTE_CHECKS:
REVIEW_THREADS:
MERGE_STATE:
RISK_CLASS:
SCOPE_DRIFT:
BYPASS_USED:
RUNTIME_CODE_CHANGED:
BACKEND_CODE_CHANGED:
TOOLS_SYNC_CODE_CHANGED:
CI_DEPLOYMENT_COUNTY_CHANGED:
OWNER_ACTION_REQUIRED:
NEXT_ACTION:
STOP_TYPE:
```

## Required Blocked Format

```text
RESULT: BLOCKED_OWNER_DECISION
PROGRAM:
GOAL:
LOOP:
WORK_ORDER:
STOP_TYPE:
CURRENT_STATE:
BLOCKER:
OWNER_DECISION_NEEDED:
NEXT_VALID_ACTION:
AUTHORIZED_FILES:
EXPLICITLY_OUT_OF_SCOPE:
```

## Evidence Rules

- Always report exact files changed.
- Always distinguish validation failure from local tooling friction.
- Always report whether runtime/backend/tools-sync/CI/deployment/county files changed.
- Always report review-thread and check state before asking for merge.
- Never claim merge, deployment, rollback, production readiness, or live integration without evidence.

STOP_TYPE: CODEX_EVIDENCE_OUTPUT_STANDARD_DEFINED
