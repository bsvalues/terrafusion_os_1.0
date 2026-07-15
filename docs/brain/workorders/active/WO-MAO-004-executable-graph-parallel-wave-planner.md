# WO-MAO-004 - Executable Graph and Parallel Wave Planner

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Base:** `5660f153b810b2c25b04c59b5cfa4e8fa74ae7ed`
**Risk:** `R3`
**Merge mode:** bounded `B`
**Status:** In progress

## Objective

Compute all dependency-cleared Work Orders and emit deterministic projected waves that respect the
worker budget and MAO-003 path, contract, and environment reservations. The planner is read-only: it
does not dispatch, reserve, open PRs, merge, or mutate repository or GitHub state.

## Input Contract

- the canonical Work Order registry and scoring rules;
- one repository identity per plan;
- explicit candidate reservation claims supplied in a reservation snapshot;
- active reservations supplied from governed assignment state;
- an explicit authority ceiling and maximum-worker budget.

Allowed-file globs are not reservation authority and are never silently converted into claims.
Cross-repository waves fail closed until canonical path identity exists.

## Completion Contract

- MAO-003 is complete, MAO-004 is the only active MAO Work Order, and MAO-005 is next;
- terminal, active, blocked, unsupported, over-authority, protected-boundary, malformed, and
  reservation-conflicted nodes are excluded with deterministic reasons;
- proposed work is not dispatch-ready;
- blocked lanes do not freeze unrelated ready nodes;
- dependencies unlock only in later projected waves after prior-wave completion assumptions;
- each wave is a maximum-cardinality conflict-free set bounded by the worker budget;
- stale active reservations remain blocking and released reservations do not block;
- identical input produces byte-identical output and no input is mutated;
- one inactive, revocable PROGRAM-MAO-001 continuation-envelope proposal is prepared for owner
  ratification after this Work Order merges.

## Validation

- `node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `node docs/brain/workorders/tools/wo-wave-plan.mjs --json`
- JSON parse checks for owner decisions and planner schema
- `corepack pnpm run type-check`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
- `git diff --check`
- exact-scope review, independent exact-head assurance, required remote checks, zero unresolved threads

STOP_TYPE: MAO_004_WAVE_PLANNER_READY_FOR_VALIDATION
