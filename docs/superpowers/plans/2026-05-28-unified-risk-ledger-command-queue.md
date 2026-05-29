# Unified Risk Ledger Command Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the Unified Risk Ledger into County Studio's primary sortable command queue.

**Architecture:** Keep risk aggregation in `utils/riskSurfaces.ts`, keep ledger rendering inside `RiskSurfaceCommandCenter.tsx`, and preserve the existing store drill method for city-free neighborhood evidence. The five boards remain supporting decomposition below the command queue.

**Tech Stack:** React, Zustand store, Vitest, Testing Library, TypeScript.

---

### Task 1: Risk Surface Ledger Semantics

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/utils/riskSurfaces.ts`
- Test: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/riskSurfaces.test.ts`

- [x] Add a failing test proving severity bands are `Critical`, `High`, `Medium`, `Low`.
- [x] Add a failing test proving district exposure groups by taxing district even when segments carry different city metadata.
- [x] Change `RiskLevel` and threshold mapping from `Moderate/Healthy` to `Medium/Low`.
- [x] Run `pnpm -C frontend exec vitest run apps/os-shell/src/pages/forge/county-studio/__tests__/riskSurfaces.test.ts`.

### Task 2: Ledger Command UI

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx`
- Test: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx`

- [x] Add a failing test proving the ledger appears before the supporting boards.
- [x] Add a failing test proving severity filtering hides nonmatching rows.
- [x] Add a failing test proving parcel exposure sorting can move a larger exposure row above a higher-risk row.
- [x] Add stateful filter/sort controls scoped to the ledger component.
- [x] Keep all action buttons drilling through `drillToRiskSurfaceNeighborhood`.

### Task 3: Verification And Publish

**Files:**
- Modify: PR branch only.

- [x] Run focused County Studio tests.
- [x] Run `pnpm -C frontend run type-check`.
- [x] Run browser smoke for `/forge/county-studio`.
- [x] Run `pnpm -C frontend run build`.
- [x] Run `git diff --check`.
- [x] Commit the slice.
- [x] Push the existing PR branch.
