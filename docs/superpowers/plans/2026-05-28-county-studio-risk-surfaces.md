# County Studio Risk Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorient County Studio around Benton valuation risk surfaces and a unified command queue instead of city-first drill analytics.

**Architecture:** Add a focused frontend derivation utility that transforms active `CountySegmentDto` rows into risk board rows and ledger rows. Render the board on the county landing surface ahead of parcel evidence drill-down, leaving backend APIs, Sync, and DB seeding untouched.

**Tech Stack:** React 18, TypeScript, Zustand, Vitest, Testing Library.

---

## Files

- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/utils/riskSurfaces.ts`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/riskSurfaces.test.ts`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/DrillBreadcrumb.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx`
- Modify: `frontend/apps/os-shell/src/stores/countyStudioStore.ts`

## Task 1: Risk Surface Derivation

- [x] Write failing tests in `riskSurfaces.test.ts` for reval, neighborhood, model group, district, value tier, and unified ledger aggregation.
- [x] Run `pnpm -C frontend exec vitest run apps/os-shell/src/pages/forge/county-studio/__tests__/riskSurfaces.test.ts` and verify the module is missing.
- [x] Implement `riskSurfaces.ts` with null-safe weighted metric aggregation, board generation, contract gap detection, and ledger ranking.
- [x] Re-run the same Vitest command and verify it passes.

## Task 2: County Landing Command Center

- [x] Add a failing `CountyStudyPage.test.tsx` assertion that county landing renders `Revaluation Cycle Risk`, `Neighborhood Risk`, `Model Group Risk`, `Taxing District Exposure`, `Value Tier Equity`, and `Unified Risk Ledger`.
- [x] Add a failing assertion that `Kennewick` city rollup is not the primary county landing table.
- [x] Implement `RiskSurfaceCommandCenter.tsx` and replace the county landing city table in `CountyStudyPage.tsx`.
- [x] Re-run `pnpm -C frontend exec vitest run apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx`.

## Task 3: Drill Copy And Store Compatibility

- [x] Add failing tests that the breadcrumb exposes `Risk Surface` copy after selecting a neighborhood risk object.
- [x] Update the breadcrumb comments and visible copy so the primary path reads as county risk surface to parcel evidence.
- [x] Keep city drill methods for compatibility, but update comments to state they are legacy/reference-only.
- [x] Re-run County Studio focused tests.

## Task 4: Verification

- [x] Run `pnpm -C frontend exec vitest run apps/os-shell/src/pages/forge/county-studio/__tests__/riskSurfaces.test.ts apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx apps/os-shell/src/pages/forge/county-studio/__tests__/DrillBreadcrumb.test.tsx`.
- [x] Run `pnpm -C frontend run type-check`.
- [x] Inspect `git diff --stat` and confirm no Sync or DB seeding files changed.
