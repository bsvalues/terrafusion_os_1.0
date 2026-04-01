# TerraFusion — Agent Operating Model

> Effective: 2026-03-24
> Owner: Benton County Assessor (sole human)
> Ratified after Phase 33A.3 — parallel discovery phase is over.

---

## The Core Rule

**One builder. One reviewer. One branch owner. Never two builders on the same file set at the same time.**

Discovery overlap was correct during the cave-mapping phase.
That phase is over. Overlap now means:

- duplicate reads → wasted tokens
- duplicate fixes → merge conflicts
- conflicting assumptions → regressions
- branch collisions → human review overhead

The fix is operational, not technical.

---

## Agent Ownership

### Claude Code owns
- Backend controllers and services
- EF Core / PACS / valuation domain logic
- DTO contracts
- Backend tests (unit + integration)
- Repo spelunking when architecture is unclear
- Reviewing Copilot's frontend PRs for contract mismatch

### Copilot owns
- Component wiring and hooks
- View state and route integration
- UI plumbing and TypeScript compile cleanup
- Frontend tests
- Internal alpha UX iteration
- Reviewing Claude Code's backend PRs for usage ergonomics

### Neither agent does without explicit assignment
- Broad "discovery" on the same issue simultaneously
- Parallel edits to the same module
- Speculative cleanup outside sprint scope

---

## Operating Modes

### Mode A — Single-builder
*Use when the task changes logic or architecture.*
- One agent builds.
- The other agent may review but does not implement in parallel.

### Mode B — Builder + Reviewer
*Use when the task is risky (data contract, migration, auth boundary).*
- Agent 1 builds.
- Agent 2 audits: diff, tests, assumptions, regression risk.
- Agent 2 does not produce a second implementation.

### Mode C — Discovery Handoff
*Use when scope is unclear.*
- One agent explores and writes findings.
- Human chooses direction.
- One agent implements.
- The other stays off the files.
- Discovery expires once the task card is written.

---

## Task Card Format

Every sprint item uses this card. No card = no coding.

```
Task:
Owner:          [Claude Code | Copilot]
Mode:           [Single-builder | Builder+Reviewer | Discovery Handoff]
Repo:           terrafusion_os_1.0
Allowed files:
  -
Out of scope:
  -
Acceptance test:
  -
Reviewer:       [Claude Code | Copilot]
```

---

## Anti-Duplication Rules (Hard)

1. No simultaneous coding on the same task card.
2. No agent starts coding until ownership is assigned.
3. If one agent is already in files, the other becomes reviewer only.
4. Reviewer may not "also take a pass" and produce a second implementation.
5. Discovery expires once the task card is written.
6. If scope changes, stop and reassign before more edits happen.

---

## Phase 33A.4 — Staff Internal Alpha Execution

### Copilot owns
- `/alpha.html` iteration based on staff feedback
- Launcher / route-native entry cleanup
- Tab truth labeling polish (honest empty states)
- Defect form UX cleanup if needed

### Claude Code owns
- Backend support fixes found during alpha testing
- Domain correctness checks (values matching PACS)
- PACS/Forge data truth issues
- Targeted regression tests for reported defects

**Rule:** Copilot does not touch backend unless explicitly reassigned.
Claude Code does not touch frontend UX unless explicitly reassigned.
