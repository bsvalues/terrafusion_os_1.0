# Current Use Case Desk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend-only Current Use Case Desk in the canonical OS shell CUForge module.

**Architecture:** Keep the existing Zustand store and live CurrentUse endpoints. Add derived case-desk helpers and focused React components under `frontend/apps/os-shell/src/pages/forge/current-use/*`, then replace the previous tabbed view with the case desk.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Testing Library, existing `apiFetchJson` CurrentUse API wrapper.

---

### Task 1: Case Desk Contract Tests

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/current-use/__tests__/CUForge.review.test.tsx`

- [x] Add tests that render CUForge with live-derived classifications/removals and assert the case desk identity, queue derivation, selected case file, chief review, and rollback worksheet.
- [x] Run `npx vitest run frontend/apps/os-shell/src/pages/forge/current-use/__tests__/CUForge.review.test.tsx --reporter=verbose`.
- [x] Verify the new tests fail because case desk components do not exist yet.

### Task 2: Derived Case Model

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/current-use/currentUseCaseDeskModel.ts`
- Test: `frontend/apps/os-shell/src/pages/forge/current-use/__tests__/CUForge.review.test.tsx`

- [x] Implement deterministic derived case helpers from `Classification[]`, `Removal[]`, and optional `InterestRate[]`.
- [x] Include queue categories for appraiser and chief workloads.
- [x] Keep all labels honest: derived from live records, no persistence claims.
- [x] Run the CUForge review test and verify model-driven assertions pass or progress to component failures.

### Task 3: Case Desk Components

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/current-use/CurrentUseCaseDeskPage.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/current-use/CUForge.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/current-use/CUForge.css`

- [x] Build `CurrentUseCaseDeskPage`, `CurrentUseWorkQueue`, `CurrentUseCaseFile`, `CurrentUseChecklist`, `CurrentUseRollbackWorksheet`, `CurrentUseNoticeActionPanel`, and `CurrentUseChiefReviewPanel`.
- [x] Replace old CUForge tab rendering with the case desk host.
- [x] Reuse existing store fetches and rollback calculation action.
- [x] Run the CUForge review test and verify it passes.

### Task 4: Verification

**Files:**
- No new files.

- [x] Run targeted CUForge tests.
- [x] Run relevant forge contract tests.
- [x] Run `pnpm run type-check`.
- [x] Run `node --test os-platform/core/tests/phase83-tools.test.mjs`.
- [x] Run `git diff --check`.
- [x] Run `pnpm -C frontend run build`.
- [x] Runtime-launch TerraForge -> CUForge and verify the Case Desk with CurrentUse-shaped API responses.
