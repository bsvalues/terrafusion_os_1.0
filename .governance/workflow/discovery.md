# Discovery: Slice 25 — Desktop Window Launch + Test Repair

> **Purpose:** Fix PR #472 test regressions and verify desktop window launch behavior.

---

* **Project:** Desktop OS Window Launch Test Repair
* **Owner:** bsval
* **Branch/PR:** fix/desktop-os-windowed-launch (PR #472)
* **Date:** 2026-02-27

---

## A. Objectives (non-negotiable)

1. **Zero test regressions**: tier0 suite must be 268+ pass, 0 fail (was 268/0 on main, now 268/4)
2. **Suite icons open as windows**: Double-clicking forge/atlas/dais/dossier/gpt activates module via `activateModule()` (opens Desktop window), not `navigate()`
3. **OS feature icons navigate**: pilot/trace/canon still use `navigate()` to standalone routes
4. **Test runner compatibility**: All tests use Jest globals (the established runner), NOT vitest imports

---

## B. Constraints

* **Test Infrastructure:** Jest is the runner for `frontend/apps/os-shell/`. Vitest is only used at the repo root for `os-platform/core/` tests. Tests must use Jest globals (`jest.fn()`, `jest.mock()`), never `import { vi } from 'vitest'`.
* **Governance/Paths:** Only modify files under `frontend/apps/os-shell/**` (Lane B: OS Shell UI)
* **Gates:** `pnpm run type-check`, `node --test os-platform/core/tests/phase83-tools.test.mjs`, `npm run test:tier0` in frontend/

---

## C. Current State (observed, not assumed)

* **What exists:**
  - PR #472 changed DesktopIconGrid: suite icons call `activateModule(id)` instead of `navigate(route)`
  - PR #472 added ModuleLoader fallback for hardcoded MODULE_REGISTRY modules
  - PR #472 added suite-* aliases in MODULE_ALIASES (forge→suite-forge, etc.)
  - PR #472 added suite-* entries in MODULE_REGISTRY and ModuleRenderer switch
  - Tests were rewritten with `import { vi } from 'vitest'` instead of Jest globals

* **What is broken:**
  - 4 test files fail to run: `SyntaxError: await is only valid in async functions` / `Vitest cannot be imported in CommonJS module`
  - Files: NavigationTruth.test.tsx, DesktopIconGrid.canonical.test.tsx, ModuleLoader.test.tsx, DesktopIntentContract.test.tsx
  - tier0 result: 268 pass, 4 fail (was 268 pass, 0 fail on main)

* **Evidence:**
  - `npm run test:tier0` output: "Test Suites: 4 failed, 10 skipped, 268 passed"
  - `git show main:...NavigationTruth.test.tsx` has NO vitest imports
  - `git show HEAD:...NavigationTruth.test.tsx` has `import { vi } from 'vitest'`
  - Core gates pass: type-check ✅, phase83-tools 32/32 ✅
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
