# Plan Document Template

> **Purpose:** Define phases, tasks, acceptance criteria, and risk mitigation BEFORE execution.
> This is a REQUIRED artifact for any non-trivial change (feature/refactor/UX).

---

* **Project:** [Name of initiative]
* **Branch/PR:** [Branch name or PR #]
* **Date:** [YYYY-MM-DD]
* **Discovery Link:** [Link to discovery.md sections]
* **Research Link:** [Link to research.md sections]

---

## Definition of Done

> What MUST be true for this to be complete? Reference discovery objectives.

- [ ] [Criterion 1 - linked to Objective A.1]
- [ ] [Criterion 2 - linked to Objective A.2]
- [ ] [Criterion 3 - linked to Research finding]
- [ ] All tests pass (type-check, unit, phase83-tools)
- [ ] Build succeeds
- [ ] No regressions to existing harness tests
- [ ] Documentation updated

---

## Phases & Tasks

### Phase 1: [Foundation / Setup]

> First phase - typically scaffolding, tests, configuration.

#### Task 1.1: [Task name]

* **Description:** [What to do]
* **Files:** [Which files to create/modify]
* **Tests (TDD):**
  - [ ] [Test case 1]
  - [ ] [Test case 2]
* **Acceptance Criteria:**
  - [ ] [Criterion 1]
  - [ ] [Criterion 2]

#### Task 1.2: [Task name]

* **Description:** [What to do]
* **Files:** [Which files to create/modify]
* **Tests (TDD):**
  - [ ] [Test case 1]
* **Acceptance Criteria:**
  - [ ] [Criterion 1]

---

### Phase 2: [Implementation]

> Core implementation phase.

#### Task 2.1: [Task name]

* **Description:** [What to do]
* **Files:** [Which files to create/modify]
* **Tests (TDD):**
  - [ ] [Test case 1]
* **Acceptance Criteria:**
  - [ ] [Criterion 1]
* **Risk Reference:** [Link to risk register if applicable]

#### Task 2.2: [Task name]

* **Description:** [What to do]
* **Files:** [Which files to create/modify]
* **Tests (TDD):**
  - [ ] [Test case 1]
* **Acceptance Criteria:**
  - [ ] [Criterion 1]

---

### Phase 3: [Integration / Migration]

> Integration with existing systems, migration of surfaces.

#### Task 3.1: [Task name]

* **Description:** [What to do]
* **Files:** [Which files to create/modify]
* **Tests (TDD):**
  - [ ] [Test case 1]
* **Acceptance Criteria:**
  - [ ] [Criterion 1]

---

### Phase 4: [Verification / Cleanup]

> Final verification, cleanup, documentation.

#### Task 4.1: [Task name]

* **Description:** [What to do]
* **Acceptance Criteria:**
  - [ ] All gates pass
  - [ ] PR approved
  - [ ] Merged to main

---

## Risk Register

> Document known risks with mitigation and rollback strategies.

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | [Risk description] | High/Med/Low | High/Med/Low | [What to do to prevent] | [How to undo if it happens] |
| R2 | [Risk description] | High/Med/Low | High/Med/Low | [Mitigation] | [Rollback] |
| R3 | [Risk description] | High/Med/Low | High/Med/Low | [Mitigation] | [Rollback] |

---

## Git Strategy

> How commits should be structured.

1. `test(scope): [description]` - Write tests first (TDD)
2. `feat(scope): [description]` - Implement features
3. `refactor(scope): [description]` - Migrate existing code
4. `docs(scope): [description]` - Documentation updates

---

## Dependencies

> What must be true/complete before this work can proceed?

- [ ] [Dependency 1 - e.g., PR #XXX merged]
- [ ] [Dependency 2 - e.g., main branch green]
- [x] Discovery complete
- [x] Research complete

---

## Document Status

- [ ] Definition of Done complete
- [ ] All phases defined
- [ ] All tasks have acceptance criteria
- [ ] Risk register complete
- [ ] Git strategy defined
- [ ] Dependencies verified
- [ ] Ready for execution
