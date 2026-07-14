# TerraFusion Agent Operating Model

> **Status:** Legacy Phase 33A operating snapshot, superseded for active dispatch.
> **Current authority:** root `AGENTS.md`, `CANON_INDEX.md`, `ADR-EXEC-001`, active Brain Work Orders,
> and reservation controls.

## Preserved Collision Invariant

One builder owns any overlapping reserved file, contract, or environment surface at a time. A second
worker may review read-only, but may not produce a competing implementation in that reserved surface.
Multiple builders may operate concurrently only when their Work Orders are dependency-cleared, their
worktrees are isolated, and their path, contract, and environment reservations do not conflict.

This is a collision rule, not a global one-worker or one-Work-Order serialization rule.

## Current Dispatch Contract

- The active Work Order is the bounded execution packet. A legacy task card is not authority.
- The Brain queue and program graph establish dependencies and next routing.
- Reservations establish exclusive write, contract, and environment ownership.
- Agent product names such as Claude Code, Codex, or Copilot do not confer permanent file ownership.
- Reviewers remain independent and read-only unless a separate non-conflicting Work Order authorizes
  implementation.
- Scope expansion follows the active authority and stop-wall model; it is not decided by this file.

## Historical Disposition

The 2026-03-24 Claude/Copilot ownership table, Mode A/B/C task-card workflow, `No card = no coding`
rule, and Phase 33A.4 alpha assignments were recovery-era coordination guidance. They are retained in
Git history for provenance but no longer control active dispatch, routing, or authority.

The valid same-file-set / no-colliding-builders invariant is preserved above and is implemented by
isolated worktrees plus explicit reservations.
