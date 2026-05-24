# Coefficient Preview Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate Coefficient Preview as a live read-only Forge module backed by TerraForge/MassAppraisal API data.

**Architecture:** Keep the module self-contained. Replace raw fetch/model-registry logic with county-scoped `apiFetchJson` calls, normalize two regression responses plus one comparison response into the existing preview display model, and keep apply operations blocked.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, TerraFusion `apiFetchJson`, county isolation/session helpers.

---

## File Structure

- Modify `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx`: live API calls, normalization, unavailable state, read-only apply messaging.
- Modify `frontend/apps/os-shell/src/pages/forge/batch/__tests__/CoefficientPreview.test.tsx`: red/green tests for live endpoints and unavailable state.
- Modify `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`: remove queued state from Coefficient Preview and update chip.
- Modify `frontend/apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx`: assert Coefficient Preview is enabled and TerraGAMA remains queued.

## Tasks

### Task 1: Prove Live Preview Contract

- [ ] Write failing tests in `CoefficientPreview.test.tsx` that mock `apiFetchJson`, session, token, and county headers.
- [ ] Assert Generate Preview calls `/terraforge/regression` for 2026 and 2025 and `/MassAppraisal/compare` with county headers.
- [ ] Assert coefficient deltas render for `intercept` and `GLA_sqft`.
- [ ] Run `pnpm -C frontend exec vitest run apps/os-shell/src/pages/forge/batch/__tests__/CoefficientPreview.test.tsx`; expected failure because current component uses raw fetch and model registry.

### Task 2: Implement Live Preview

- [ ] Replace raw `fetch` usage in `CoefficientPreview.tsx` with `apiFetchJson`.
- [ ] Build request headers from `getSession`, `getToken`, and `buildCountyScopedSessionHeaders`.
- [ ] Normalize source/candidate regression responses into coefficient delta rows.
- [ ] Normalize `MassAppraisal/compare` into COD, PRD, median ratio, and sample-size deltas.
- [ ] Run the CoefficientPreview test and confirm it passes.

### Task 3: Activate Launcher

- [ ] Update `ForgeSuiteHome.tsx` to remove `truthState: 'queued'` from Coefficient Preview and set `chipLabel: 'Live preview'`.
- [ ] Update the Forge suite module-list test to expect Coefficient Preview enabled while TerraGAMA remains queued.
- [ ] Run `pnpm -C frontend exec vitest run apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx`; confirm pass.

### Task 4: Verify Slice

- [ ] Run focused tests for Coefficient Preview and ForgeSuiteHome.
- [ ] Run `pnpm run type-check`.
- [ ] Run `node --test os-platform/core/tests/phase83-tools.test.mjs`.
- [ ] Run `pnpm -C frontend run type-check`.
- [ ] Run `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj -p:DotNetWatchBuild=true`.
- [ ] Run `pnpm -C frontend run build`.
- [ ] Start local backend/frontend, open `/forge`, launch Coefficient Preview, and prove live data renders.

### Task 5: Publish

- [ ] Commit the design and plan.
- [ ] Commit implementation separately.
- [ ] Push branch `codex/coefficient-preview-runtime`.
- [ ] Open PR and enable squash auto-merge.
- [ ] Watch CI; fix any actionable failures or review threads.
