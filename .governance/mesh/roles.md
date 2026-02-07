# Agent Mesh Roles & Permissions

> **Version:** 1.0.0
> **Parent:** [MESH_GOVERNANCE.md](./MESH_GOVERNANCE.md)

## Overview

The mesh operates with a **maintainer model**: all agents can contribute, but one role (Integrator) has merge authority. This prevents split-brain decisions while preserving parallel work.

---

## Role Definitions

### Integrator

**Purpose:** Single merge authority for decisions and canonical documents.

**Permissions:**
- ✅ Issue `DECISION` messages
- ✅ Broadcast to `ALL`
- ✅ Write to `#decisions` channel
- ✅ Accept/reject `PROPOSAL`
- ✅ Resolve `CONFLICT`
- ✅ Update all four canonical docs

**Responsibilities:**
- Own `plan.md` and `progress.md`
- Review proposals within 1 cycle
- Apply decision rubric consistently
- Land decisions into docs within same cycle
- Broadcast `SYNC` after landing

**Constraints:**
- Cannot ignore BLOCKER for > 2 cycles
- Must document rationale for every DECISION
- Cannot self-approve proposals without explicit rationale

---

### Researcher

**Purpose:** Gather domain knowledge, prior art, and technical constraints.

**Permissions:**
- ✅ Issue `REQUEST`, `PROPOSAL`, `FYI`, `SYNC`
- ✅ Write to `#discovery`, `#research`
- ✅ Read all channels
- ❌ Issue `DECISION`
- ❌ Broadcast to `ALL`
- ❌ Write to `#decisions`

**Responsibilities:**
- Complete assigned research tracks
- Document findings in `research.md`
- Submit `PROPOSAL` for architectural decisions
- Flag conflicts between findings

**Typical Assignments:**
- UI/UX + accessibility patterns
- Performance constraints + optimization tactics
- Security/compliance implications
- Repo archaeology (existing components, prior art)

---

### Builder

**Purpose:** Implementation, tests, and code delivery.

**Permissions:**
- ✅ Issue `REQUEST`, `PROPOSAL`, `BLOCKER`, `SYNC`
- ✅ Write to `#build`, `#architecture`
- ✅ Read all channels
- ❌ Issue `DECISION`
- ❌ Broadcast to `ALL`
- ❌ Write to `#decisions`

**Responsibilities:**
- Implement according to `plan.md` tasks
- Write tests before implementation (TDD)
- Report `BLOCKER` when stuck
- Update `progress.md` with commit refs (via Integrator)

**Constraints:**
- Cannot implement without approved task in plan
- Must request `PROPOSAL` for scope changes
- Cannot merge without Integrator approval

---

### Reviewer

**Purpose:** Quality gates, compliance checks, and verification.

**Permissions:**
- ✅ Issue `CONFLICT`, `BLOCKER`, `FYI`, `SYNC`
- ✅ Write to `#qa`
- ✅ Read all channels
- ❌ Issue `DECISION`
- ❌ Broadcast to `ALL`
- ❌ Write to `#decisions`

**Responsibilities:**
- Verify implementation matches plan
- Check compliance (WCAG, FISMA, performance budgets)
- Raise `CONFLICT` when implementation deviates
- Confirm acceptance criteria met

**Authority:**
- Can block merge via `BLOCKER` on compliance grounds
- Compliance BLOCKER cannot be overridden without explicit governance exception

---

## Role Assignment

### Single-Agent Session

When one agent operates alone:
- Agent assumes **Integrator** role
- All permissions available
- Still must follow doc-first law

### Multi-Agent Session

When multiple agents operate in parallel:
- **One** agent is designated Integrator (typically the orchestrating agent)
- Other agents assigned based on task type:
  - Discovery phase → Researcher roles
  - Implementation phase → Builder + Reviewer roles
- Role can change between phases

### Assignment Protocol

At session start:
1. Integrator broadcasts `SYNC` to `#decisions`:
   ```
   SESSION_START: Phase [X], Integrator = [agent-id]
   Researchers: [agent-ids]
   Builders: [agent-ids]
   Reviewers: [agent-ids]
   ```
2. All agents acknowledge with `FYI`
3. Work begins

---

## Permission Matrix

| Action | Integrator | Researcher | Builder | Reviewer |
|--------|------------|------------|---------|----------|
| Send REQUEST | ✅ | ✅ | ✅ | ✅ |
| Send PROPOSAL | ✅ | ✅ | ✅ | ❌ |
| Send DECISION | ✅ | ❌ | ❌ | ❌ |
| Send CONFLICT | ✅ | ✅ | ✅ | ✅ |
| Send BLOCKER | ✅ | ✅ | ✅ | ✅ |
| Send FYI | ✅ | ✅ | ✅ | ✅ |
| Send SYNC | ✅ | ✅ | ✅ | ✅ |
| Broadcast to ALL | ✅ | ❌ | ❌ | ❌ |
| Write #decisions | ✅ | ❌ | ❌ | ❌ |
| Write #discovery | ✅ | ✅ | ❌ | ❌ |
| Write #research | ✅ | ✅ | ❌ | ❌ |
| Write #architecture | ✅ | ✅ | ✅ | ❌ |
| Write #build | ✅ | ❌ | ✅ | ❌ |
| Write #qa | ✅ | ❌ | ❌ | ✅ |
| Read all channels | ✅ | ✅ | ✅ | ✅ |
| Update discovery.md | ✅ | ✅* | ❌ | ❌ |
| Update research.md | ✅ | ✅* | ❌ | ❌ |
| Update plan.md | ✅ | ❌ | ❌ | ❌ |
| Update progress.md | ✅ | ❌ | ❌ | ❌ |

*Via Integrator DECISION landing

---

## Escalation Paths

### Researcher → Integrator
- `PROPOSAL`: Recommend architectural decision
- `REQUEST`: Need clarification on scope
- `CONFLICT`: Research findings contradict plan

### Builder → Integrator
- `BLOCKER`: Cannot proceed without decision
- `PROPOSAL`: Scope change needed
- `REQUEST`: Need research input

### Reviewer → Integrator
- `CONFLICT`: Implementation doesn't match plan
- `BLOCKER`: Compliance violation detected
- `FYI`: Quality metrics report

### Any → Any (lateral)
- `REQUEST`: Need info from peer
- `FYI`: Share relevant finding
- Must route through channel, not direct

---

## Role Violations

Attempting unauthorized actions:
1. Message is rejected by mesh
2. Violation logged (without content)
3. Integrator notified via `#decisions`
4. Repeated violations → session audit

---

## Related Documents

- [MESH_GOVERNANCE.md](./MESH_GOVERNANCE.md) - Full specification
- [message-schema.json](./message-schema.json) - Message format
- [conflict-resolution.md](./conflict-resolution.md) - Disagreement protocol
