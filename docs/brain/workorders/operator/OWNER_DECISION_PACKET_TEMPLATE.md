# Owner Decision Packet Template

Work order: WO-CODEX-OP-006
Program: codex-operator-playbook

## Required Format

When Codex is blocked, it must ask for authority using this exact structure:

```text
RESULT: BLOCKED_OWNER_DECISION
PROGRAM:
GOAL:
LOOP:
WORK_ORDER:
STOP_TYPE:
CURRENT_STATE:
BLOCKER:
WHY_BLOCKED:
OWNER_DECISION_NEEDED:
NEXT_VALID_ACTION:
AUTHORIZED_FILES:
EXPLICITLY_OUT_OF_SCOPE:
ACTIONS_NOT_TAKEN:
SAFE_TO_CONTINUE: false
```

## Packet Rules

- State the smallest decision needed.
- Include exact file scope.
- Name the exact command only when command authorization is needed.
- Do not bundle unrelated decisions.
- Do not ask the owner to courier routine PR/check/review state.
- Do not present a bypass as validation success.

STOP_TYPE: OWNER_DECISION_PACKET_TEMPLATE_DEFINED
