# Phase 31: Shell Chrome Integration + PropertySearch Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the persistent shell chrome hosts all OS routes correctly via contract tests, harden PropertySearch UX for missing states, and run a regression gate — all in parallel across three independent agents.

**Architecture:** Three fully independent workstreams (A, B, C) run in parallel, then converge at a mandatory vitest gate. Agent A writes shell integration tests only (one new file). Agent B writes PropertySearch improvements only (one edit + one new test file). Agent C runs the regression sweep only (no file writes). Phase 32 (TerraCanon live) is date-gated 2026-03-25 and runs after the gate as a single sequential agent.

**Tech Stack:** React 18.3, TypeScript 5.3, Vitest + React Testing Library, react-router-dom v6, `pnpm run test --run` for suite, `pnpm exec tsc --noEmit` for type-check.

**Working directory for all commands:** `C:\Users\bsval\terrafusion_os_1.0\frontend`

---

## Parallel Dispatch Map

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 31 — Three agents launch simultaneously                       │
│                                                                       │
│  Agent A ──► Task 1: shellChromeIntegration.contract.test.tsx        │
│              NEW file in __tests__/shell/ — 8 tests                  │
│              READ-ONLY on all existing files                          │
│                                                                       │
│  Agent B ──► Task 2: PropertySearch depth                            │
│              EDIT pages/PropertySearch.tsx (add missing states)       │
│              ADD __tests__/workbench/propertySearch.contract.test.tsx │
│                                                                       │
│  Agent C ──► Task 3: Regression sweep (READ-ONLY, zero writes)       │
│              run vitest, tsc, ESLint — report actual baseline count   │
│                                                                       │
│  ────────────────────── CONVERGENCE GATE ───────────────────────    │
│  All 3 return → integrate → full suite → baseline + 14 new tests     │
│                                                                       │
│  Phase 32 (TerraCanon live, 2026-03-25) ──► Sequential after gate   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Map

| File | Agent | Action |
|------|-------|--------|
| `apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx` | A | **CREATE** — 8 shell chrome integration contract tests |
| `apps/os-shell/src/shell/desktop/Desktop.tsx` | A | READ-ONLY — confirm `shell-routed-content`, `isHome` |
| `apps/os-shell/src/__tests__/desktop/DesktopRouteLandmarkContract.test.tsx` | A | READ-ONLY — copy mock patterns |
| `apps/os-shell/src/Router.tsx` | A | READ-ONLY — verify route nesting under `<App />` |
| `apps/os-shell/src/pages/PropertySearch.tsx` | B | **EDIT** — add error state, button loading guard, `data-testid` attributes |
| `apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx` | B | **CREATE** — 6 PropertySearch contract tests |
| No files | C | READ-ONLY — run suite + report actual test count |

**File ownership is strict. No agent writes to files listed under another agent.**

---

## Task 1 (Agent A): Shell Chrome Integration Contract Tests

**Scope:** Prove `shell-routed-content` container appears on non-home routes; prove home route renders StageZeroState (no `shell-routed-content`); prove taskbar-equivalent chrome is intact on routed surfaces.

**Context Agent A needs (self-contained):**

```
You are adding shell chrome integration contract tests to TerraFusion OS.

Key facts about the codebase:
- Desktop.tsx at apps/os-shell/src/shell/desktop/Desktop.tsx lines 519–540:
  - When pathname === '/': renders StageZeroState + DesktopIconGrid (no shell-routed-content)
  - When pathname !== '/': renders <div data-testid="shell-routed-content" style={{zIndex:2}}>
    which wraps <Outlet /> — this is the persistent shell chrome container
- Router.tsx nests ALL OS routes under <Route path="/" element={<App />}>
  Routes include: /forge, /atlas, /dais, /dossier, /gpt, /property, /property/:parcelId/*
- App.tsx renders <DesktopWithErrorBoundary /> which renders Desktop
- TopBar, Taskbar, WindowManager render unconditionally inside Desktop (always mounted)
- shell-routed-content is positioned: absolute left-0 right-0 top-12 bottom-12 zIndex:2

What you must create:
  apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx

The __tests__/shell/ directory already exists. Do NOT create it.

Mock reference: Read DesktopRouteLandmarkContract.test.tsx at
apps/os-shell/src/__tests__/desktop/DesktopRouteLandmarkContract.test.tsx
Copy its vi.mock setup for react-router-dom (MemoryRouter swap), authStorage,
authBridge, signalR, and any window mocks. That file is the authoritative pattern.

Do NOT modify any existing files. Only create the new test file.
```

**Files:**
- Read: `apps/os-shell/src/__tests__/desktop/DesktopRouteLandmarkContract.test.tsx` (mock patterns)
- Read: `apps/os-shell/src/shell/desktop/Desktop.tsx` lines 230–545
- Create: `apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx`

- [ ] **Step 1.1: Read DesktopRouteLandmarkContract.test.tsx for mock patterns**

  Run: read `apps/os-shell/src/__tests__/desktop/DesktopRouteLandmarkContract.test.tsx`

  Copy ALL `vi.mock(...)` calls — especially `react-router-dom` (MemoryRouter swap), `authStorage`, `authBridge`, `signalR`, any window or global mocks. You will paste these verbatim into the new test file.

- [ ] **Step 1.2: Read Desktop.tsx to confirm shell-routed-content exact location**

  Run: read `apps/os-shell/src/shell/desktop/Desktop.tsx` lines 230–545

  Confirm: `data-testid='shell-routed-content'` inside the `isHome ? ... : ...` branch. Note the exact condition used for `isHome`.

- [ ] **Step 1.3: Write the test file**

  Create `apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx`:

  ```tsx
  /**
   * shellChromeIntegration.contract.test.tsx
   *
   * Phase 31-A — Shell Chrome Integration Contract
   *
   * Contract: Desktop chrome persists across all OS routes.
   * Non-home routes render content inside shell-routed-content.
   * Home route renders StageZeroState (no shell-routed-content).
   *
   * Phase 22 proved routes exist.
   * Phase 25 proved routes render landmarks.
   * Phase 31-A proves the shell chrome wrapping is correct on every surface.
   */
  import { vi, describe, it, expect, afterEach } from 'vitest';
  import { cleanup, render, screen } from '@testing-library/react';
  import React from 'react';

  // ── PASTE ALL MOCKS FROM DesktopRouteLandmarkContract.test.tsx HERE ──
  // (react-router-dom MemoryRouter swap, authStorage, authBridge, signalR, etc.)
  let memoryRouterEntries: string[] = ['/'];
  // ... (copy verbatim from landmark test)

  import App from '../../App';

  afterEach(() => {
    cleanup();
    memoryRouterEntries = ['/'];
  });

  describe('Shell Chrome Integration — persistent chrome across OS routes', () => {

    it('home route / renders StageZeroState, NOT shell-routed-content', () => {
      memoryRouterEntries = ['/'];
      render(<App />);
      expect(screen.queryByTestId('shell-routed-content')).toBeNull();
    });

    it('/forge renders inside shell-routed-content', async () => {
      memoryRouterEntries = ['/forge'];
      render(<App />);
      await screen.findByTestId('shell-routed-content');
    });

    it('/atlas renders inside shell-routed-content', async () => {
      memoryRouterEntries = ['/atlas'];
      render(<App />);
      await screen.findByTestId('shell-routed-content');
    });

    it('/dais renders inside shell-routed-content', async () => {
      memoryRouterEntries = ['/dais'];
      render(<App />);
      await screen.findByTestId('shell-routed-content');
    });

    it('/dossier renders inside shell-routed-content', async () => {
      memoryRouterEntries = ['/dossier'];
      render(<App />);
      await screen.findByTestId('shell-routed-content');
    });

    it('/gpt renders inside shell-routed-content', async () => {
      memoryRouterEntries = ['/gpt'];
      render(<App />);
      await screen.findByTestId('shell-routed-content');
    });

    it('/property renders inside shell-routed-content', async () => {
      memoryRouterEntries = ['/property'];
      render(<App />);
      await screen.findByTestId('shell-routed-content');
    });

    it('shell-routed-content is absent on home — only appears on non-home routes', () => {
      // Final assertion: home does not have the container, confirming chrome partitioning
      memoryRouterEntries = ['/'];
      const { unmount } = render(<App />);
      expect(screen.queryByTestId('shell-routed-content')).toBeNull();
      unmount();

      // Then a non-home route has it
      memoryRouterEntries = ['/forge'];
      render(<App />);
      expect(screen.queryByTestId('shell-routed-content')).not.toBeNull();
    });

  });
  ```

  **Important:** Replace the mock comment with the actual vi.mock calls copied from DesktopRouteLandmarkContract.test.tsx. The test will not compile without them.

- [ ] **Step 1.4: Run the test file — expect failures or mock errors first**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm exec vitest run apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx --reporter=verbose 2>&1
  ```

  If you get mock errors: go back to Step 1.1 and copy missing mocks. Iterate until all 8 tests are green.

- [ ] **Step 1.5: Confirm all 8 tests pass**

  Expected output: `✓ shellChromeIntegration.contract.test.tsx (8 tests) — 8 passed`

- [ ] **Step 1.6: Commit (specific files only — do not use git add -A)**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  git add apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx
  git commit -m "test(shell): Phase 31-A — 8 shell chrome integration contract tests

  Proves shell-routed-content wraps /forge, /atlas, /dais, /dossier, /gpt, /property.
  Home route / confirmed to NOT render shell-routed-content (StageZeroState only).
  Chrome partitioning invariant established as contract."
  ```

---

## Task 2 (Agent B): PropertySearch Depth Pass

**Scope:** Read PropertySearch.tsx first to understand its ACTUAL current state — what states already exist and what is genuinely missing. Then add only what is missing (error state, button disabled guard, `data-testid` testability hooks). Write 6 contract tests using TDD.

**Context Agent B needs (self-contained):**

```
You are hardening the PropertySearch surface for TerraFusion OS.

Canonical file: apps/os-shell/src/pages/PropertySearch.tsx
This is the page mounted at route '/property' in Router.tsx.
Ignore: apps/os-shell/src/pages/forge/property/PropertySearch.tsx (legacy path, do not touch)

The search service is: import { getPacsProperties } from '../services/pacsService'
The component already uses a mountedRef cancellation pattern — do NOT introduce AbortController.
The component already has an empty state UI — do NOT add a duplicate.

READ THE FILE FIRST (Step 2.1) before writing any code.

Your job is to find and fix what is ACTUALLY missing:
- If error state is missing: add <div data-testid="search-error-state"> with error message
- If button lacks disabled/aria-busy while loading: add those attributes
- If result items lack data-testid: add data-testid="search-result-{index}" or "search-result-item"
- If empty state lacks data-testid="search-empty-state": add it
- Only add what is genuinely absent

Test file to CREATE: apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx
Use getPacsProperties mock from: ../../services/pacsService

Pattern reference: apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx (lines 1–80)
for vi.mock setup and TestWrapper pattern.

Do NOT touch: Desktop.tsx, Router.tsx, any file in __tests__/shell/ — those are read-only here.
Do NOT touch: PropertyAtlas.tsx, PropertyClerk.tsx, PropertyTreasury.tsx, PropertyAudit.tsx.
```

**Files:**
- Read: `apps/os-shell/src/pages/PropertySearch.tsx` ← **READ FIRST, before writing any tests**
- Read: `apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx` lines 1–80 (mock patterns)
- Edit: `apps/os-shell/src/pages/PropertySearch.tsx` (add only what is missing)
- Create: `apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx`

- [ ] **Step 2.1: Read PropertySearch.tsx — audit what states already exist**

  Run: read `apps/os-shell/src/pages/PropertySearch.tsx`

  Audit checklist (note ✅ present / ❌ missing for each):
  - [ ] Empty state when results.length === 0: has `data-testid="search-empty-state"`?
  - [ ] Error state when API throws: has `data-testid="search-error-state"` with error message?
  - [ ] Submit button: `disabled={isLoading}` and `aria-busy={isLoading}`?
  - [ ] Result list items: have `data-testid` for test selectability?
  - [ ] Loading indicator: has `role="status"` or `data-testid="search-loading"`?

  Write down your audit before proceeding.

- [ ] **Step 2.2: Write 6 failing contract tests (TDD — write tests before implementing)**

  Create `apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx`.

  Use the ACTUAL mock target you found in Step 2.1 (`getPacsProperties` from `pacsService`):

  ```tsx
  /**
   * propertySearch.contract.test.tsx
   * Phase 31-B: PropertySearch surface contract
   * Tests: loading, empty, error, results, navigation, button-guard
   */
  import React from 'react';
  import { vi, describe, it, expect, beforeEach } from 'vitest';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';

  // Mock navigation
  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
  });

  // Mock the ACTUAL search service (confirmed from reading PropertySearch.tsx in Step 2.1)
  vi.mock('../../services/pacsService', () => ({
    getPacsProperties: vi.fn(),
  }));

  import PropertySearch from '../../pages/PropertySearch';
  import { getPacsProperties } from '../../services/pacsService';

  const mockSearch = getPacsProperties as vi.MockedFunction<typeof getPacsProperties>;

  const renderSearch = () =>
    render(<MemoryRouter><PropertySearch /></MemoryRouter>);

  const fillAndSubmit = (query: string) => {
    const input = screen.getByRole('searchbox') ??
                  screen.getByPlaceholderText(/search|parcel|address/i);
    fireEvent.change(input, { target: { value: query } });
    fireEvent.submit(input.closest('form')!);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  describe('PropertySearch contract', () => {

    it('renders search input', () => {
      renderSearch();
      expect(
        screen.queryByRole('searchbox') ??
        screen.queryByPlaceholderText(/search|parcel|address/i)
      ).not.toBeNull();
    });

    it('shows loading state while search is in-flight', async () => {
      // Never resolve — keeps loading state visible
      mockSearch.mockReturnValue(new Promise(() => {}));
      renderSearch();
      fillAndSubmit('123 Main');
      await waitFor(() => {
        // Accept either aria-busy on button OR a loading indicator
        const busy = document.querySelector('[aria-busy="true"]');
        const loading = screen.queryByTestId('search-loading') ??
                        screen.queryByRole('status');
        expect(busy ?? loading).not.toBeNull();
      });
    });

    it('shows empty state when search returns no results', async () => {
      mockSearch.mockResolvedValue([]);
      renderSearch();
      fillAndSubmit('ZZZNORESULTS');
      await screen.findByTestId('search-empty-state');
    });

    it('shows error state when search throws', async () => {
      mockSearch.mockRejectedValue(new Error('PACS connection failed'));
      renderSearch();
      fillAndSubmit('500 Error Blvd');
      await screen.findByTestId('search-error-state');
      expect(screen.getByTestId('search-error-state')).toHaveTextContent(/failed|error/i);
    });

    it('renders result list when search returns results', async () => {
      mockSearch.mockResolvedValue([
        { parcelId: 'BEN-001', address: '123 Main St', ownerName: 'Smith' },
      ]);
      renderSearch();
      fillAndSubmit('123 Main');
      await screen.findByText(/123 Main/i);
    });

    it('navigates to /property/:parcelId on result click', async () => {
      mockSearch.mockResolvedValue([
        { parcelId: 'BEN-001', address: '123 Main St', ownerName: 'Smith' },
      ]);
      renderSearch();
      fillAndSubmit('123 Main');
      const result = await screen.findByText(/123 Main/i);
      fireEvent.click(result.closest('[data-testid]') ?? result);
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('BEN-001'));
    });

  });
  ```

  **Important:** The mock return type for `getPacsProperties` must match what PropertySearch.tsx actually expects. Read Step 2.1 results to confirm the shape (parcelId, address, ownerName, etc.) and adjust the mock data accordingly.

- [ ] **Step 2.3: Run tests — confirm they fail (not all states may exist yet)**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm exec vitest run apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx --reporter=verbose 2>&1
  ```

  Expected: Some tests fail for `search-empty-state`, `search-error-state`, or `aria-busy` not found. That is correct — proceed to Step 2.4 to implement the missing pieces.

  If ALL 6 pass already: the component was complete — skip Step 2.4, proceed directly to Step 2.5.

- [ ] **Step 2.4: Implement only the states that are genuinely missing (from your audit in Step 2.1)**

  Apply ONLY what was marked ❌ missing in the audit. Do not touch code that already works.

  **Error state (if missing):**
  ```tsx
  {error && (
    <div data-testid="search-error-state" role="alert"
         className="tf-status-error rounded-lg p-4 mt-4">
      <p className="font-medium">Search failed</p>
      <p className="text-sm tf-text-secondary">{error.message}</p>
    </div>
  )}
  ```

  **Empty state data-testid (if `data-testid="search-empty-state"` is missing from existing empty UI):**
  Add `data-testid="search-empty-state"` to the existing empty state container. Do not replace the existing UI — just add the attribute.

  **Button loading guard (if missing):**
  ```tsx
  <button
    type="submit"
    disabled={isLoading}
    aria-busy={isLoading}
    className="... disabled:opacity-50"
  >
    {isLoading ? 'Searching...' : 'Search'}
  </button>
  ```

  **Result item data-testid (if missing):**
  Add `data-testid="search-result-item"` to each result row's container element.

  Use the existing `mountedRef` pattern — do NOT add AbortController.

- [ ] **Step 2.5: Run all 6 tests green**

  ```bash
  pnpm exec vitest run apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx --reporter=verbose 2>&1
  ```

  Expected: `✓ propertySearch.contract.test.tsx (6 tests) — 6 passed`

- [ ] **Step 2.6: Type-check**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm exec tsc --noEmit 2>&1
  ```

  Expected: EXIT 0

- [ ] **Step 2.7: Commit (specific files only)**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  git add apps/os-shell/src/pages/PropertySearch.tsx
  git add apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx
  git commit -m "feat(search): Phase 31-B — PropertySearch depth + 6 contract tests

  Added: error state UI (data-testid=search-error-state) when PACS throws.
  Added: aria-busy + disabled on submit while in-flight (loading guard).
  Added: data-testid attributes for test selectability.
  6 contract tests: loading, empty, error, results, navigation, button-guard."
  ```

---

## Task 3 (Agent C): Regression Sweep (READ-ONLY)

**Scope:** Run the full test suite and report the ACTUAL current test count. This is the authoritative baseline for the convergence gate. Do not write or modify any files.

**Context Agent C needs (self-contained):**

```
You are running the Phase 31 regression sweep for TerraFusion OS.

This is READ-ONLY. Do NOT modify any files.

Run these three commands and report results:
1. Full Vitest suite (reports exact pass/fail count)
2. TypeScript type-check
3. ESLint (zero-error check)

Working directory: C:\Users\bsval\terrafusion_os_1.0\frontend

Return your results in this exact format:
  REGRESSION SWEEP REPORT — Phase 31
  Vitest: NNN/NNN PASS, N FAIL
  TypeScript: EXIT N (N errors if any)
  ESLint: N errors, N warnings
  Status: GREEN / RED
  Baseline for convergence gate: NNN (the actual passing test count)
  New failures vs prior seal (6168 expected): [list specific test names or "none"]
```

**Files:** None — run commands only.

- [ ] **Step 3.1: Run full Vitest suite**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm run test --run 2>&1 | tail -25
  ```

  Capture: exact pass count, fail count.

- [ ] **Step 3.2: Run TypeScript type-check**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm exec tsc --noEmit 2>&1 | tail -10
  ```

  Capture: exit code, any errors.

- [ ] **Step 3.3: Run ESLint**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm exec eslint apps/os-shell/src --ext .ts,.tsx 2>&1 | tail -5
  ```

  Capture: error count.

- [ ] **Step 3.4: Return the report**

  Format:
  ```
  REGRESSION SWEEP REPORT — Phase 31
  Vitest: NNN/NNN PASS, N FAIL
  TypeScript: EXIT N
  ESLint: N errors
  Status: GREEN / RED
  Baseline for convergence gate: NNN
  New failures: [none or list]
  ```

---

## Convergence Gate (Orchestrator — runs after all 3 agents return)

- [ ] **Gate 0: Verify Agent C baseline**

  Read Agent C's report. Record `BASELINE = Agent C's actual passing count`.

  If Agent C reported RED (failures): investigate before continuing. Do not proceed with a broken baseline.

- [ ] **Gate 1: Confirm agent commits**

  Run:
  ```bash
  git -C "C:\Users\bsval\terrafusion_os_1.0" log --oneline | head -5
  ```

  Expect two commits from Agent A and Agent B above the prior HEAD.

- [ ] **Gate 2: Run full suite including new tests**

  ```bash
  cd C:\Users\bsval\terrafusion_os_1.0\frontend
  pnpm run test --run 2>&1 | tail -10
  ```

  Expected: `BASELINE + 14` tests passing (8 from Agent A + 6 from Agent B), 0 failures.

  If count is lower than `BASELINE + 14`: some new tests may have been skipped or some existing tests regressed. Investigate before sealing.

- [ ] **Gate 3: Final type-check**

  ```bash
  pnpm exec tsc --noEmit
  ```

  Expected: EXIT 0.

- [ ] **Gate 4: Seal commit (stage specific files only — no git add -A)**

  ```bash
  git -C "C:\Users\bsval\terrafusion_os_1.0" add \
    frontend/apps/os-shell/src/__tests__/shell/shellChromeIntegration.contract.test.tsx \
    frontend/apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx \
    frontend/apps/os-shell/src/pages/PropertySearch.tsx
  git -C "C:\Users\bsval\terrafusion_os_1.0" commit -m "chore(seal): Phase 31 — shell chrome integration + PropertySearch depth — gate GREEN

  Agent A: 8 shell chrome integration tests — shell-routed-content proved on all OS routes
  Agent B: 6 PropertySearch contract tests — error/loading states hardened
  Agent C: regression sweep PASS — BASELINE+14/BASELINE+14 tests, 0 errors
  Gate: type-check EXIT 0, ESLint 0 errors"
  ```

- [ ] **Gate 5: Write Phase 31 governance seal**

  Create `.governance/workflow/CP24_PHASE31_POLISH_SPRINT_2026-03-21.md`:

  ```markdown
  # CP24 — Phase 31 Polish Sprint Seal

  Date: 2026-03-21
  Status: ✅ SEALED

  ## Evidence
  - Phase 31-A: 8 shell chrome integration contract tests — PASS
  - Phase 31-B: 6 PropertySearch contract tests — depth hardened
  - Phase 31-C: Regression sweep — PASS (BASELINE + 14 tests)
  - Type-check: EXIT 0
  - ESLint: 0 errors

  ## Invariants Maintained
  - shell-routed-content: z-index 2, present on all non-home OS routes
  - Home route /: StageZeroState only, no shell-routed-content
  - No modification to routing contracts (Phases 13–18 invariants intact)
  ```

---

## Phase 32: TerraCanon Live Wire (Date-Gated: 2026-03-25)

> Run ONLY on or after 2026-03-25. Single sequential agent. Do not dispatch before that date.

**Condition:** Codex API must be reachable (`curl $TF_CODEX_API_URL/health`). If not reachable, stop immediately and document TC-D as BLOCKED.

**Context:**
- Phase 29 static seal: 29/29 canon tests PASS (committed `82247fc27`)
- Governance doc: `.governance/workflow/CP23_TERRACANON_CODEX_2026-03-21.md`
- TC-D: Wire CodexController to live `TF_CODEX_API_URL` env var
- TC-E: Co-edit collaborative session end-to-end test (delta sync confirmed)
- Backend controller: search `backend/TerraFusion.API/Controllers/` for `Codex*` — may need to be created if absent

**Files:**
- Read: `.governance/workflow/CP23_TERRACANON_CODEX_2026-03-21.md` (TC-D, TC-E conditions)
- Find/Read or Create: `backend/TerraFusion.API/Controllers/CodexController.cs`
- Edit: `.governance/workflow/CP23_TERRACANON_CODEX_2026-03-21.md` (TC-D/TC-E → LIVE PASS)
- Edit: `docs/superpowers/artifacts/cp19/residual-risk-signoff.md` (close canon risk)

- [ ] **Step 32.1: Verify Codex API is reachable**

  ```bash
  curl -s $TF_CODEX_API_URL/health 2>&1 | head -5
  ```

  If not reachable → STOP. Document `TC-D: BLOCKED — API unreachable`. Do not proceed.

- [ ] **Step 32.2: Find or create CodexController**

  ```bash
  find C:\Users\bsval\terrafusion_os_1.0\backend -name "Codex*Controller.cs" 2>/dev/null
  ```

  If found: read it, find where the API URL is configured, replace any hardcoded localhost/mock with `config["TF_CODEX_API_URL"]`.

  If NOT found: create `backend/TerraFusion.API/Controllers/CodexController.cs` with a minimal HTTP proxy to `TF_CODEX_API_URL`. Follow the pattern of existing controllers.

- [ ] **Step 32.3: Prove co-edit session (TC-E)**

  Using the Codex369Hub (`Codex369Hub.cs` or equivalent SignalR hub):
  - Simulate two connections via `dotnet test` or integration script
  - Session A sends edit delta → Session B receives `ReceiveChanges` within 2s

  If live browser test: navigate two windows to `/canon`, make an edit, confirm delta arrives.

- [ ] **Step 32.4: Update governance artifacts**

  - In `CP23_TERRACANON_CODEX_2026-03-21.md`: update TC-D and TC-E from DEFERRED to LIVE PASS
  - In `residual-risk-signoff.md`: TerraCanon row → ✅ RESOLVED 2026-03-25

- [ ] **Step 32.5: Commit Phase 32 seal**

  ```bash
  git commit -m "feat(canon): Phase 32 — TerraCanon live wire — TC-D/TC-E LIVE PASS

  CodexController wired to TF_CODEX_API_URL env var.
  Co-edit delta sync: <2s confirmed.
  CP23 live seal complete. TerraCanon risk RESOLVED."
  ```

---

## Agent Dispatch Instructions (for Orchestrator)

### Launching Parallel Agents (Phase 31)

Send a **single message** with three `Agent` tool invocations — all three run concurrently:

```
Agent A (description: "Shell chrome integration tests"):
  - Read DesktopRouteLandmarkContract.test.tsx first for mock patterns
  - Create shellChromeIntegration.contract.test.tsx with 8 tests
  - Stage and commit that single file only
  - Return: commit SHA + "8/8 tests passing"

Agent B (description: "PropertySearch depth pass"):
  - READ PropertySearch.tsx first — audit which states actually exist
  - Write 6 failing tests, then implement only missing states
  - Stage and commit PropertySearch.tsx + propertySearch.contract.test.tsx
  - Return: audit findings + commit SHA + "6/6 tests passing"

Agent C (description: "Phase 31 regression sweep"):
  - Run: pnpm run test --run, tsc --noEmit, eslint
  - Write NOTHING — read-only
  - Return: REGRESSION SWEEP REPORT in the exact format specified in Task 3
```

### After All Three Return

Run Convergence Gate 0–5 in sequence (orchestrator, not agents).

### Phase 32 Dispatch (on or after 2026-03-25)

Single sequential agent with Phase 32 task above.

---

## Known Invariants (Do Not Break)

From `project_current_state.md` and Phase 13–18 seals — these contracts must not regress:

- `useSession.ts`: empty-string countyId → FALLBACK (county header never absent)
- `activateModule`: NOT called on history traversal (back/forward is URL-only)
- Standalone exemptions: ratio/calibration/batch remain standalone (no workbench routing)
- URL canonical comparison: query/hash noise stripped before identity check
- `tabPathMap` completeness (resume spine)
- Guard preventing `/property/:parcelId/undefined`
- `shell-routed-content` z-index 2; windows at z-index 10+ (windows layer above content)
- Home route `/`: StageZeroState renders; `shell-routed-content` does NOT render
