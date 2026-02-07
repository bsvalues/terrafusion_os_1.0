# Progress Document Template

> **Purpose:** Track execution status, completed work, and next steps in real-time.
> This is a REQUIRED artifact for any non-trivial change (feature/refactor/UX).

---

* **Project:** [Name of initiative]
* **Branch/PR:** [Branch name or PR #]
* **Last Updated:** [YYYY-MM-DD HH:MM]
* **Plan Link:** [Link to plan.md]

---

## Current Status

| Field | Value |
|-------|-------|
| **Phase** | [Current phase from plan.md] |
| **Task** | [Current task ID] |
| **Status** | 🟢 On Track / 🟡 At Risk / 🔴 Blocked |
| **Latest Commit** | [Commit hash - REQUIRED] |

---

## Blockers

> What is actively preventing progress? Empty if no blockers.

| ID | Blocker | Owner | Action Required | ETA |
|----|---------|-------|-----------------|-----|
| B1 | [Description] | [Who can unblock] | [What needs to happen] | [When] |

---

## Completed Tasks (with commit refs)

> Audit trail of completed work. MUST include commit hashes.

| Task | Description | Commit | Tests | Date |
|------|-------------|--------|-------|------|
| ✅ 1.1 | [What was done] | `abc1234` | ✅ Pass | YYYY-MM-DD |
| ✅ 1.2 | [What was done] | `def5678` | ✅ Pass | YYYY-MM-DD |
| ✅ 2.1 | [What was done] | `ghi9012` | ✅ Pass | YYYY-MM-DD |

---

## In Progress

> What is actively being worked on.

| Task | Description | Started | Progress |
|------|-------------|---------|----------|
| 🔄 2.2 | [What is being done] | YYYY-MM-DD | [50%] |

---

## Next Steps (explicit)

> What will be done next. MUST be specific and actionable.

| Priority | Task | Description | Blocked By |
|----------|------|-------------|------------|
| ⏭️ 1 | [Task ID] | [What to do] | [Nothing / Blocker ID] |
| ⏭️ 2 | [Task ID] | [What to do] | [Nothing / Blocker ID] |
| ⏭️ 3 | [Task ID] | [What to do] | [Nothing / Blocker ID] |

---

## Decisions Made During Execution

> New decisions made during implementation. Reference discovery.md for initial decisions.

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| YYYY-MM-DD | [Decision] | [Why] | [What changes] |

---

## Known Debt / Follow-ups

> Things intentionally deferred or discovered during execution.

| ID | Item | Severity | Ticket/Issue |
|----|------|----------|--------------|
| ⚠️ D1 | [Technical debt] | Low/Med/High | [Link or "To be filed"] |
| ⚠️ D2 | [Future enhancement] | Low/Med/High | [Link or "To be filed"] |

---

## Test Results (latest run)

> Summary of most recent test run. REQUIRED before any PR.

| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| type-check | ✅ | - | - |
| phase83-tools | 32/32 | 0 | 0 |
| unit tests | [N] | 0 | [N] |
| materials tests | [N] | 0 | 0 |
| build | ✅ | - | - |

---

## Gates Before Merge

> Checklist for merge readiness.

- [ ] All planned tasks complete
- [ ] All tests passing
- [ ] Build succeeds
- [ ] No blockers
- [ ] Known debt documented
- [ ] PR reviewed (or CI-only for solo dev)
- [ ] Latest commit hash in this document

---

## Document Status

- [ ] Current status accurate
- [ ] All completed tasks have commits
- [ ] Next steps defined
- [ ] Debt documented
- [ ] Ready for merge (all boxes checked above)
