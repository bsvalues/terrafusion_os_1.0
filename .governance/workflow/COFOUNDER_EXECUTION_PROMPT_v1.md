# TerraFusion Co-Founder Execution Prompt v1

> **Purpose:** Give TerraFusion a single-slice execution prompt that preserves co-founder rigor without breaking the bounded doctrine in `CODEX_DIRECTIVE_PACK_v1.md`.

---

* **Date:** 2026-03-18
* **Status:** v1, TerraFusion-specific, documentation-only
* **Depends on:** [`CODEX_DIRECTIVE_PACK_v1.md`](./CODEX_DIRECTIVE_PACK_v1.md)
* **Scope:** Operator prompt guidance only; no promotion into `.github/AGENT_ENTRYPOINT.md` in this version

---

## Operating Stance

- This prompt is for **bounded execution after the target is already chosen**.
- It does **not** replace the TerraFusion workflow canon in `discovery.md`, `research.md`, `plan.md`, and `progress.md`.
- It does **not** replace the Codex directive pack. It is a tighter operator wrapper for single-slice execution.
- Codex remains an implementation partner, proof runner, and regression defender. Humans retain scope, governance exceptions, architecture, and merge judgment.

## What This Keeps From The Original Idea

- Ruthless scope containment
- TDD-first posture
- Zero-`TODO` bounded implementation
- Regression defense before closure
- Explicit save-state handoff for the next session

## What TerraFusion Changes

- Core reasoning must stay clear, technical, and evidence-based.
- "Ralph Wiggum mode" is **not** allowed to degrade architecture, status, or proof reporting.
- If desired, allow **one** absurd solo-dev line only:
  - at the end of the status report, or
  - as a light suffix on the commit message
- The prompt must use the same **input contract** as the Codex directive pack.
- The save state must land in a real workflow artifact when the slice warrants it.

## Required Input Contract

Use the same field order as [`CODEX_DIRECTIVE_PACK_v1.md`](./CODEX_DIRECTIVE_PACK_v1.md):

1. `Objective`
2. `Allowed files`
3. `Forbidden`
4. `Acceptance criteria`
5. `Proof`
6. `Non-goals`
7. `Output`

If any field is missing, the prompt is incomplete.

## Execution Loop

### Phase 1: Scope Containment And TDD

- Restate the minimum success criteria for the current slice.
- Name the exact allowed files and forbidden areas.
- Lock non-goals before implementation starts.
- Write or update the smallest test suite that proves the slice.
- Do not widen the task while tests are being written.

### Phase 2: Complete Implementation

- Implement the slice fully inside the allowed surface.
- Do not leave placeholders, fake completions, or `TODO`s.
- Do not "fix nearby things" unless they are required to satisfy the stated acceptance criteria.
- Prefer narrow adapters and proof-oriented changes over broad refactors.

### Phase 3: Regression Defense

- Run the required proof commands plus the targeted slice tests.
- Call out warnings, weak spots, and residual risks explicitly.
- Do not claim broader system health than the evidence supports.
- Preserve routing, governance, fairness infrastructure, and host-boundary behavior unless the slice explicitly changes them.

### Phase 4: Version Control

- If files changed, produce one evidence-based commit message.
- If no files changed, say so explicitly instead of forcing a commit.
- Optional style rule: append one short absurd solo-dev observation only if it does not reduce readability.

### Phase 5: Save State

- Leave a precise handoff for the next session.
- When the slice is workflow-significant, append the handoff to `progress.md` or the named workflow artifact for the initiative.
- The save state must include:
  - what landed
  - what remains open
  - the exact next step
  - active risks or blockers
  - any important runtime/test facts that the next session would otherwise have to rediscover

## Output Contract

Every response using this prompt should render these four sections in this order:

1. `Co-Founder Status Report`
2. `The Code / Test Suite`
3. `Version Control`
4. `Save State`

### Section Rules

#### 1. Co-Founder Status Report

- Brief recap of what was done
- Clear statement of scope held or scope refused
- Proof posture summarized plainly
- Optional: one absurd solo-dev line, but only one

#### 2. The Code / Test Suite

- Summarize the actual implementation
- List or reference the tests written or updated
- Include exact proof commands and outcomes
- No vague "should work" language

#### 3. Version Control

- Provide a single commit string if changes were made
- If no changes were made, state `No commit: no file changes`

#### 4. Save State

- State the exact next action
- Name any blockers
- Name the workflow artifact updated, if any
- If no workflow artifact was updated, say why

## TerraFusion Guardrails

- Do not invent governance exceptions.
- Do not widen into backend, frontend, and workflow work all at once unless that exact breadth was authorized.
- Do not silently absorb unrelated worktree noise.
- Do not treat "production-ready" as permission for broad cleanup.
- Do not re-implement valuation math when the authoritative service or contract should be tested instead.
- Do not let persona override evidence.

## Save-State Targets

Use the smallest real artifact that preserves continuity:

- `progress.md` for initiative status, next steps, and execution notes
- `plan.md` when acceptance criteria or phase structure changed
- `REMEDIATION_PLAN_v1.md` only when the remediation canon itself changed
- A bounded initiative note only when the slice already has one

## Ready-To-Paste Template

```text
Objective:
<single bounded slice only>

Allowed files:
- <exact paths only>

Forbidden:
- <exact forbidden areas>

Acceptance criteria:
- <minimum success criteria>
- <required behavior preserved>
- <save-state target if this slice requires workflow updates>

Proof:
- <required repo-wide gates>
- <targeted tests>

Non-goals:
- <explicit exclusions>
- no architecture changes
- no governance exceptions
- no unrelated cleanup

Output:
1. Co-Founder Status Report
2. The Code / Test Suite
3. Version Control
4. Save State
```

## Example Commit Style

```text
git commit -m "test(forge): seal income and comparable-sales host proof bundles. The tech debt keeps asking where I live."
```

## Alignment Rule

If this prompt conflicts with [`CODEX_DIRECTIVE_PACK_v1.md`](./CODEX_DIRECTIVE_PACK_v1.md), the directive pack wins.
