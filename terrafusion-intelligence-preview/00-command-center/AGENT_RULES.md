# Agent Rules

Every agent in this swarm follows these rules. No exceptions.

---

## Core Directive

Your job is not to expand TerraFusion.
Your job is to prove TerraFusion can transfer capability through three conference-ready experiences:

1. **Atlas**: understand a property
2. **Academy**: understand a professional problem
3. **TerraFusion OS**: act on intelligence

If your work does not improve one of those three experiences, stop and move it to `POST_CONFERENCE.md`.

---

## Agent Loop

1. Inspect
2. Report assumptions
3. Execute smallest safe slice
4. Verify
5. Document evidence
6. Hand off

No agent gets to just "build cool stuff."

---

## Required Report Format

```
Agent:
Mission:
Sources inspected:
Findings:
Files changed:
Evidence:
Verification:
Blockers:
Next recommended action:
Post-conference ideas:
```

---

## Merge Rules

No PR merges without:
- Clear demo purpose
- Evidence
- Tests for touched area
- Type-check pass
- `git diff --check`
- Runtime route smoke if UI changed

---

## Feature Scoring (1-5 each)

| Criterion | Score |
|---|---|
| Demo clarity | ? |
| User value | ? |
| Conference impact | ? |
| Truthfulness / evidence | ? |
| Build effort (inverse) | ? |

- Below 15/25 = post-conference
- Above 20/25 = priority

---

## Cut Rules

Cut anything that:
- Cannot demo in 60 seconds
- Requires architecture explanation
- Has no evidence source
- Does not answer "Now What?"
- Needs more than 2 days to stabilize
- Creates legal/privacy risk
