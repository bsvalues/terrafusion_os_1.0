# Regression Studio Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate Regression Studio as a live runtime-proven TerraForge module using existing county-scoped backend endpoints.

**Architecture:** Keep the slice frontend-only. Replace the dead `/api/regression/*` analysis path with a normalized TerraForge regression hook that uses `apiFetch`, county-scoped session headers, and existing `/terraforge/regression`, `/terraforge/ratio-study/hedonic-regression`, and `/terraforge/ratio-study/cross-validation` routes.

**Tech Stack:** React 18, TypeScript, TanStack Query, Vitest, Testing Library, TerraFusion `apiFetch`, Zustand-adjacent existing store patterns.

---

### Task 1: Launcher Contract

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx`
- Modify later: `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`

- [ ] **Step 1: Write the failing launcher test**

Change the queued specialist test so Regression Studio is expected to be enabled, while TerraGAMA and Coefficient Preview remain queued:

```ts
it('Regression Studio is enabled as a live specialist module while planned apps remain queued', () => {
  renderForge();

  expect(screen.getByText('Regression Studio')).toBeInTheDocument();
  expect(screen.getByText('TerraGAMA')).toBeInTheDocument();
  expect(screen.getByText('Coefficient Preview')).toBeInTheDocument();

  expect(screen.getByText('Regression Studio').closest('button')).not.toBeDisabled();
  expect(screen.getByText('TerraGAMA').closest('button')).toBeDisabled();
  expect(screen.getByText('Coefficient Preview').closest('button')).toBeDisabled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C frontend exec vitest run apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx`

Expected: FAIL because the Regression Studio button is still disabled.

- [ ] **Step 3: Write minimal implementation**

In `ForgeSuiteHome.tsx`, remove `truthState: 'queued'` from the `regression-studio` module and change its `chipLabel` to `Live regression`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C frontend exec vitest run apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx`

Expected: PASS.

### Task 2: Live Regression Analysis Hook Contract

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/__tests__/useRegressionAnalysis.test.tsx`
- Modify later: `frontend/apps/os-shell/src/hooks/useRegressionAnalysis.ts`

- [ ] **Step 1: Write failing hook tests**

Create tests that mock `apiFetch`, `getSession`, and `buildCountyScopedSessionHeaders`, then render the hook inside a `QueryClientProvider`.

Required assertions:

- `useRegressionAnalysis(2026)` calls `/terraforge/regression?taxYear=2026&countyId=benton-wa`.
- request options include county headers from `buildCountyScopedSessionHeaders`.
- TerraForge `model.beta` and residual payloads normalize into existing `RegressionResult` fields.
- `{ insufficientData: true, usedForFit: 3, minimumRequired: 5 }` normalizes into a result with `unavailableReason`.
- `useRunRegressionAnalysis` invalidates `['regression-analysis', 2026, 'benton-wa']` without POSTing to `/regression/run`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C frontend exec vitest run apps/os-shell/src/hooks/__tests__/useRegressionAnalysis.test.tsx`

Expected: FAIL because the hook still expects string study period IDs and calls `/regression/analysis`.

- [ ] **Step 3: Implement the hook**

Modify `useRegressionAnalysis.ts` to:

- accept `taxYear?: number`;
- resolve county scope using `getSession` and `buildCountyScopedSessionHeaders`;
- call `/terraforge/regression?taxYear=${taxYear}&countyId=${countyId}`;
- call hedonic and cross-validation endpoints in the same query function;
- normalize coefficient rows, model stats, residual diagnostic points, neighborhood effects, and unavailable states;
- make `useRunRegressionAnalysis` invalidate the live query key instead of POSTing.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C frontend exec vitest run apps/os-shell/src/hooks/__tests__/useRegressionAnalysis.test.tsx`

Expected: PASS.

### Task 3: Regression Studio UI Binding

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudioDashboard.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/regression/MultipleRegressionPanel.tsx`

- [ ] **Step 1: Write failing UI contract**

Extend `frontend/apps/os-shell/src/__tests__/forge/forgeRegressionStudio.contract.test.tsx` to assert:

- the advanced lab has no `Study Period ID` input;
- it shows `Tax Year` controls;
- unavailable live results show the insufficient sample message.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C frontend exec vitest run apps/os-shell/src/__tests__/forge/forgeRegressionStudio.contract.test.tsx`

Expected: FAIL because the UI still renders `Study Period ID`.

- [ ] **Step 3: Implement UI binding**

Update `RegressionStudioDashboard` to use numeric tax year state, pass it to `useRegressionAnalysis`, and remove study period wording. Update `MultipleRegressionPanel` to render `result.unavailableReason` when present.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C frontend exec vitest run apps/os-shell/src/__tests__/forge/forgeRegressionStudio.contract.test.tsx`

Expected: PASS.

### Task 4: Verification And Runtime Proof

**Files:**
- No production edits unless tests reveal a localized issue.

- [ ] **Step 1: Run focused frontend tests**

Run:

```powershell
pnpm -C frontend exec vitest run apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx apps/os-shell/src/hooks/__tests__/useRegressionAnalysis.test.tsx apps/os-shell/src/__tests__/forge/forgeRegressionStudio.contract.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run required governance gates**

Run:

```powershell
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Run frontend build or type check**

Run: `pnpm -C frontend run type-check`

Expected: PASS. If the repo baseline fails outside touched files, record the exact failures and run focused verification instead.

- [ ] **Step 4: Runtime browser verification**

Start backend with seeders skipped:

```powershell
pnpm run dev:backend:api
```

Start frontend:

```powershell
pnpm -C frontend run dev
```

Open the local frontend, launch Forge Suite, open Regression Studio, switch to Advanced, and verify Regression Studio displays live TerraForge regression output or an honest backend insufficient-data state.

### Task 5: Commit, Push, PR, And Merge

**Files:**
- All modified files from Tasks 1-4.

- [ ] **Step 1: Inspect diff**

Run: `git status --short && git diff --stat`

Expected: only scoped Regression Studio/frontend docs files changed.

- [ ] **Step 2: Commit**

Run:

```powershell
git add docs/superpowers/specs/2026-05-24-regression-studio-runtime-design.md docs/superpowers/plans/2026-05-24-regression-studio-runtime.md frontend/apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx frontend/apps/os-shell/src/hooks/useRegressionAnalysis.ts frontend/apps/os-shell/src/hooks/__tests__/useRegressionAnalysis.test.tsx frontend/apps/os-shell/src/pages/forge/regression/RegressionStudioDashboard.tsx frontend/apps/os-shell/src/pages/forge/regression/MultipleRegressionPanel.tsx frontend/apps/os-shell/src/__tests__/forge/forgeRegressionStudio.contract.test.tsx
git commit -m "feat(regression-studio): activate live runtime module"
```

- [ ] **Step 3: Push and create PR**

Run:

```powershell
git push -u origin codex/regression-studio-runtime
gh pr create --title "feat(regression-studio): activate live runtime module" --body "Activates Regression Studio against existing TerraForge regression endpoints with county-scoped runtime proof."
```

- [ ] **Step 4: Monitor gates and merge when clean**

Run: `gh pr checks --watch`

Expected: required checks pass. Merge only through PR after gates are clean.
