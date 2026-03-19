# TerraFusion Workflow Governance

> **Government. Transcended. Documented.**

## Overview

This directory contains the **canonical workflow artifacts** required for any non-trivial change to TerraFusion OS. These documents enforce a disciplined development process that is:

- **Repeatable** - Same process every time
- **Audit-friendly** - Full paper trail with commits
- **Intent-faithful** - No drift from original objectives

## The Four Documents

| Document | Purpose | When Updated |
|----------|---------|--------------|
| `discovery.md` | Capture intent, constraints, domain questions | Before any work |
| `research.md` | Gather prior art, performance data, security implications | After discovery, before planning |
| `plan.md` | Define phases, tasks, acceptance criteria | After research, before execution |
| `progress.md` | Track status, completed work, next steps | During and after execution |

## Operator Playbooks

These workflow documents remain the canonical governance artifacts. Supporting operator playbooks may sit beside them when they tighten execution without replacing the workflow itself.

- [`CODEX_DIRECTIVE_PACK_v1.md`](./CODEX_DIRECTIVE_PACK_v1.md) - TerraFusion-specific Codex operating doctrine and six bounded prompt frames for recon, execution, and review work
- [`COFOUNDER_EXECUTION_PROMPT_v1.md`](./COFOUNDER_EXECUTION_PROMPT_v1.md) - TerraFusion-ready single-slice execution wrapper that preserves save-state discipline while reusing the Codex directive pack contract

The Codex directive pack complements `discovery.md`, `research.md`, `plan.md`, and `progress.md`. It does not replace workflow governance, discovery requirements, or human merge judgment.
The co-founder execution prompt is a wrapper on top of the Codex directive pack for bounded implementation sessions. It does not create a second governance path.

## Workflow Sequence (MANDATORY)

```
Discovery → Research → Plan → Execute → Progress Updates
    ↓          ↓         ↓         ↓           ↓
  30+ Q/A   Parallel   Phases   TDD Loop   Commit refs
            sub-agents  + DoD
```

### 1. Discovery Phase

- Minimum **30 questions** asked and answered
- Objectives and constraints documented
- Current state verified with **evidence** (not assumptions)
- Decisions made with rationale and rejected alternatives

### 2. Research Phase

- **Parallel sub-agents** assigned to different domains:
  - UI/UX + accessibility
  - Performance + optimization
  - Security + compliance
  - Repo archaeology (prior art)
- **Verbatim notes** - copy/paste, don't summarize prematurely
- Conclusions synthesized from research, not guesses

### 3. Planning Phase

- **Definition of Done** tied to discovery objectives
- **Phases and tasks** with explicit acceptance criteria
- **TDD approach** - tests defined before implementation
- **Risk register** with mitigation and rollback strategies

### 4. Execution Phase

- Follow the plan task-by-task
- Update `progress.md` after each task completion
- Include **commit hashes** for audit trail
- Document any new decisions made during execution

## When These Documents Are REQUIRED

These documents are required when changes touch:

| Path Pattern | Requires Workflow Docs |
|--------------|----------------------|
| `frontend/apps/os-shell/**` | ✅ Yes |
| `frontend/**` | ✅ Yes |
| `backend/src/**` | ✅ Yes |
| `docs/architecture/**` | ✅ Yes |
| `os-platform/core/**` | ✅ Yes (for non-trivial changes) |

## Exceptions (when NOT required)

- Pure documentation updates (README, comments)
- Dependency version bumps (automated)
- CI/CD configuration tweaks
- Trivial typo fixes

## SEAL Enforcement

The SEAL governance gate will **block PRs** that:

1. Touch required paths without updated workflow docs
2. Have `progress.md` without the latest commit hash
3. Have `plan.md` without links to discovery/research
4. Have missing or empty required sections

**Failure message:**
```
❌ SEAL: Workflow governance violation
   Missing or stale workflow artifacts.
   Required: discovery.md, research.md, plan.md, progress.md
   See: .governance/workflow/README.md
```

### GOVERNANCE OUTAGE POLICY

> **If SEAL Gate 8 (workflow) or Gate 9 (entrypoint truth) fails, treat as governance outage.**
> **No feature work proceeds until restored.**

This prevents "we'll fix governance later" drift. The gates ARE the constitution.

## How to Use These Templates

### Starting a New Initiative

1. **Copy templates** to initiative-specific files:
   ```bash
   cp .governance/workflow/discovery.md .governance/workflow/initiatives/my-feature/discovery.md
   # ... repeat for other docs
   ```

2. **Or update templates in-place** for single active initiative

3. **Link to PR/branch** in document headers

### During Development

1. Update `progress.md` after each task completion
2. Add commit hashes to completed task table
3. Update blockers section if stuck
4. Keep next steps current

### Before PR

1. Verify all "Document Status" checkboxes are complete
2. Ensure latest commit hash is in `progress.md`
3. Run gates: `pnpm run type-check && node --test phase83-tools.test.mjs`

## Agent Instructions

**ALL agents working on TerraFusion MUST:**

1. Read this README before starting work
2. Follow the Discovery → Research → Plan → Execute sequence
3. Update workflow documents as work progresses
4. Never skip directly to implementation
5. Ask 30+ questions in discovery phase

**Failure to follow this workflow is a governance violation.**

## Document Templates

- [discovery.md](./discovery.md) - Intent capture template
- [research.md](./research.md) - Domain research template
- [plan.md](./plan.md) - Execution planning template
- [progress.md](./progress.md) - Status tracking template
- [CODEX_DIRECTIVE_PACK_v1.md](./CODEX_DIRECTIVE_PACK_v1.md) - Bounded Codex operator pack for TerraFusion-specific slices
- [COFOUNDER_EXECUTION_PROMPT_v1.md](./COFOUNDER_EXECUTION_PROMPT_v1.md) - Co-founder execution wrapper for single-slice implementation, proof, commit, and save-state handoff

---

**Last Updated:** 2026-03-18
**Version:** 1.1.0
**Owner:** TerraFusion Governance
