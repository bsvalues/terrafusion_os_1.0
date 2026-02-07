# Discovery Document Template

> **Purpose:** Capture intent, constraints, and domain understanding BEFORE implementation.
> This is a REQUIRED artifact for any non-trivial change (feature/refactor/UX).

---

* **Project:** [Name of initiative]
* **Owner:** [Human owner or responsible party]
* **Branch/PR:** [Branch name or PR #]
* **Date:** [YYYY-MM-DD]

---

## A. Objectives (non-negotiable)

> What MUST this change accomplish? Be specific and measurable.

1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

---

## B. Constraints

> What limits or requirements constrain the solution?

* **Security / Compliance:**
  - [e.g., FISMA-HIGH, no PII in logs, audit trail required]
* **Performance Budgets:**
  - [e.g., LCP < 2500ms, no idle polling, 60fps animations]
* **Accessibility:**
  - [e.g., WCAG 2.1 AA, prefers-reduced-motion compliance]
* **Governance/Paths:**
  - [e.g., cannot modify specialized/**, must pass SEAL]
* **Timeline:**
  - [e.g., must ship by YYYY-MM-DD]

---

## C. Current State (observed, not assumed)

> What is the actual situation RIGHT NOW? Include evidence.

* **What exists:**
  - [Describe current components, files, behavior]
* **What is broken:**
  - [Specific failure modes, not vague complaints]
* **Telemetry/Log Evidence:**
  - [Paste actual error messages, metrics, test failures]

---

## D. Q/A Transcript (minimum 30 questions)

> Ask clarifying questions. Do not assume. Document answers.

**Q1:** What is the primary user persona for this change?
**A1:** [Answer]

**Q2:** What success looks like in production?
**A2:** [Answer]

**Q3:** What existing code/components does this touch?
**A3:** [Answer]

**Q4:** Are there prior attempts at this? What failed?
**A4:** [Answer]

**Q5:** What telemetry will prove success/failure?
**A5:** [Answer]

**Q6:** What is the rollback strategy if this fails?
**A6:** [Answer]

**Q7:** Who needs to approve this change?
**A7:** [Answer]

**Q8:** What are the security implications?
**A8:** [Answer]

**Q9:** What are the accessibility requirements?
**A9:** [Answer]

**Q10:** What performance budgets apply?
**A10:** [Answer]

**Q11:** [Continue with domain-specific questions...]
**A11:** [Answer]

<!-- Add Q12-Q30+ as needed for complete understanding -->

---

## E. Decisions Made

> Document key decisions with rationale.

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| [Decision 1] | [Why] | [What else was considered] |
| [Decision 2] | [Why] | [What else was considered] |

---

## F. Open Questions

> What still needs answers before proceeding?

- [ ] [Open question 1]
- [ ] [Open question 2]
- [ ] [Open question 3]

---

## Document Status

- [ ] Objectives defined
- [ ] Constraints documented
- [ ] Current state verified with evidence
- [ ] Q/A transcript complete (30+ questions)
- [ ] Key decisions documented
- [ ] Open questions identified
- [ ] Ready for research phase
