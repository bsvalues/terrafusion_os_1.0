# Research Document Template

> **Purpose:** Gather domain knowledge, prior art, and technical constraints BEFORE planning.
> This is a REQUIRED artifact for any non-trivial change (feature/refactor/UX).

---

* **Project:** [Name of initiative]
* **Branch/PR:** [Branch name or PR #]
* **Date:** [YYYY-MM-DD]
* **Discovery Link:** [Link to discovery.md or section refs]

---

## Sub-agent Assignments (parallel research)

> Assign research tasks to parallel tracks. Each produces verbatim notes.

| Agent | Focus Area | Status |
|-------|------------|--------|
| Agent A | UI/UX patterns + accessibility | ⏳ Pending |
| Agent B | Performance constraints + optimization tactics | ⏳ Pending |
| Agent C | Security/compliance implications | ⏳ Pending |
| Agent D | Repo archaeology (existing components, prior art) | ⏳ Pending |

---

## Verbatim Research Notes

> Copy/paste actual findings. Do not summarize prematurely. Include sources.

### Agent A Notes: UI/UX + Accessibility

**Files examined:**
- [List files]

**Patterns found:**
```
[Paste code snippets, component APIs, etc.]
```

**Accessibility considerations:**
- [WCAG requirements]
- [prefers-reduced-motion handling]
- [Contrast requirements]

**Sources:**
- [Links to docs, issues, prior PRs]

---

### Agent B Notes: Performance + Optimization

**Files examined:**
- [List files]

**Performance budgets discovered:**
- [LCP, FCP, bundle size limits]
- [Animation frame budgets]
- [Memory constraints]

**Existing optimizations:**
```
[Paste relevant code]
```

**Sources:**
- [Links to perf docs, benchmarks]

---

### Agent C Notes: Security + Compliance

**Files examined:**
- [List files]

**Security requirements:**
- [Authentication patterns]
- [Data handling rules]
- [Audit requirements]

**Compliance constraints:**
- [FISMA, WCAG, etc.]

**Sources:**
- [Links to security docs, policies]

---

### Agent D Notes: Repo Archaeology

**Existing components that do similar things:**
- [Component 1]: [What it does, where it lives]
- [Component 2]: [What it does, where it lives]

**Prior attempts at this problem:**
- PR #XXX: [What was tried, outcome]
- Issue #XXX: [What was requested]

**Dependencies this would affect:**
- [List affected modules]

**Code patterns to follow:**
```
[Paste existing patterns to maintain consistency]
```

**Sources:**
- [Links to prior PRs, issues, code]

---

## Research Conclusions

> Synthesize findings. Do NOT make new decisions here—that's for the plan.

### Key Findings

1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

### Risks Identified

| Risk | Severity | Source |
|------|----------|--------|
| [Risk 1] | High/Med/Low | [Which research track] |
| [Risk 2] | High/Med/Low | [Which research track] |

### Recommended Approaches

> Based on research, NOT guessing.

1. [Approach 1]: [Why research supports this]
2. [Approach 2]: [Why research supports this]
3. [Avoid]: [What research says NOT to do]

---

## Document Status

- [ ] All research tracks assigned
- [ ] Agent A notes complete
- [ ] Agent B notes complete
- [ ] Agent C notes complete
- [ ] Agent D notes complete
- [ ] Findings synthesized
- [ ] Risks documented
- [ ] Ready for planning phase
