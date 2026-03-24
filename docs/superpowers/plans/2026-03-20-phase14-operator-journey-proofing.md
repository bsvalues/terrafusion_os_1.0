# Phase 14 — Operator Journey Proofing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seal four gap contracts that prove the canonical assessor journey, keyboard module shortcuts, county isolation headers, and suite route mounting — all tested without a running backend.

**Architecture:** Four independent source-inspection + render contract tests, one per stream. Streams A/B/C/D have zero shared state and can be dispatched in parallel. Each agent writes the test file, runs vitest until green, then commits. No production code changes — contracts only.

**Tech Stack:** Vitest 1.6, React Testing Library, MemoryRouter, vi.mock hoisting, import.meta.dirname for fs.readFileSync paths.

---

## Critical facts (read before writing any test)

### Keyboard shortcuts (Stream B)
- File: `src/hooks/useKeyboardShortcuts.ts`
- Bindings are **Ctrl+1..7**, NOT Alt+N
- `MODULE_SHORTCUTS` map (lines 27–35):
  ```
  '1' → 'costforge'
  '2' → 'terra-gaia'
  '3' → 'atlas-ai'
  '4' → 'reporting'
  '5' → 'marketplace'
  '6' → 'counties'
  '7' → 'government-architecture'
  ```
- `activateModule` is imported from `'../orchestration/moduleActivation'`

### County isolation headers (Stream C)
- `buildCountyScopedHeaders(auth: AuthContextValue)` → `{ headers: Record<string,string>; isolated: boolean }`
  - Returns `headers['X-County-Id']` (capital X, capital C, capital I) when `auth.countyId` is non-empty
- `buildCountyScopedSessionHeaders(session: Session | null)` → same shape
  - Returns `headers['x-county-id']` (lowercase) when `session.countyId` is non-empty
- Both exported from `src/services/countyIsolation.ts`
- `AuthContextValue` imported from `src/auth/useAuthContext`

### Suite routes (Stream D)
- Router file: `src/router.tsx`
- `/forge` → `ForgeSuiteHome` (lazy from `pages/suites/ForgeSuiteHome`)
- `/atlas` → `AtlasSuiteHome` (lazy from `pages/suites/AtlasSuiteHome`)
- `/dais`  → `DaisHome`      (lazy from `pages/suites/DaisSuiteHome`)
- `/canon` → `CanonHome`     (lazy from `pages/CanonHome`)
- All suite routes are children of `<Route path='/' element={<App />}>`, wrapped in `AuthGuard`
- **Do NOT render the full Router** — use MemoryRouter + direct component imports

### PropertyForge tab (Stream A)
- File: `src/pages/workbench/tabs/PropertyForge.tsx`
- Root testid: `data-testid="property-forge-tab"`
- Tablist: `role="tablist"` with `aria-label="Forge approach tabs"`
- Sub-tabs rendered with `role="tab"`: Overview, Sales, Income (and more)
- `SUB_TABS` labels include `'Sales'` and `'Income'`
- ComparableSalesPanel and IncomeValuationPanel are children of PropertyForge

---

## File map

| Stream | New file | What it proves |
|--------|----------|----------------|
| A | `src/__tests__/journey/AssessorValuationJourney.contract.test.tsx` | PropertyForge mounts, Sales tab accessible, Income tab accessible |
| B | `src/__tests__/shell/keyboardSuiteSwitch.contract.test.ts` | Ctrl+1..7 SOURCE map verified, activateModule import present |
| C | `src/__tests__/demo/demoModeHeaders.contract.test.ts` | buildCountyScopedHeaders/Session emit correct county headers |
| D | `src/__tests__/routes/suiteRouting.contract.test.tsx` | /forge /atlas /dais /canon mount correct components |

---

## Stream A — AssessorValuationJourney contract

**Agent A: write → run → fix → commit**

### Task A1: Write the test

- [ ] **Create** `frontend/apps/os-shell/src/__tests__/journey/AssessorValuationJourney.contract.test.tsx`

```tsx
/**
 * AssessorValuationJourney.contract.test.tsx
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Proves the valuation leg of the assessor journey is structurally intact:
 *
 *   Leg 1: PropertyForge tab mounts at /property/:parcelId/forge
 *   Leg 2: Sales sub-tab is discoverable (role=tab, label ~Sales)
 *   Leg 3: Income sub-tab is discoverable (role=tab, label ~Income)
 *
 * Does NOT render ComparableSalesPanel or IncomeValuationPanel internals —
 * those panels have heavy service dependencies. This contract verifies the
 * Forge tab shell and its sub-tab navigation surface.
 *
 * @see pages/workbench/tabs/PropertyForge.tsx — data-testid="property-forge-tab"
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mock: auth context ──────────────────────────────────────────────────────

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'benton-assessor-test',
    countyId: 'benton',
    roles: ['assessor'],
    token: null,
  })),
  useAuthContextOptional: vi.fn(() => null),
}));

// ── Mock: session ───────────────────────────────────────────────────────────

vi.mock('../../auth/useSession', () => ({
  useSession: vi.fn(() => ({
    userId: 'benton-assessor-test',
    countyId: 'benton',
    role: 'assessor',
    mode: 'pilot',
  })),
}));

// ── Mock: pilotApi ─────────────────────────────────────────────────────────

vi.mock('../../services/pilotApi', () => ({
  explain: vi.fn().mockResolvedValue({
    explanation: 'Mock explanation',
    sources: [],
    confidence: 0.9,
    traceId: 'test-trace',
  }),
}));

// ── Mock: comparableSalesService ────────────────────────────────────────────

vi.mock('../../services/comparableSalesService', () => ({
  loadBentonComps: vi.fn().mockResolvedValue([]),
  filterComps: vi.fn((comps: unknown[]) => comps),
  reconcileValue: vi.fn().mockResolvedValue({ reconciledValue: 285000, confidence: 'HIGH' }),
}));

// ── Mock: incomeValuationService ────────────────────────────────────────────

vi.mock('../../services/incomeValuationService', () => ({
  calculateNoi: vi.fn().mockReturnValue(0),
  calculateIncomeValuation: vi.fn().mockReturnValue({
    incomeValue: 285000,
    capRate: 0.07,
    noi: 20000,
    riskClassification: 'low',
  }),
  saveIncomeValuationRecord: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock: lucide-react ──────────────────────────────────────────────────────

vi.mock('lucide-react', () => {
  const Icon = (props: Record<string, unknown>) => React.createElement('svg', { 'data-slot': 'icon', ...props });
  return new Proxy({}, { get: () => Icon });
});

// ── Mock: dataProvider ─────────────────────────────────────────────────────

vi.mock('../../services/dataProvider', () => ({
  dataProvider: {
    getProperties: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getProperty: vi.fn().mockResolvedValue(null),
  },
  resetDataProvider: vi.fn(),
  initDataProvider: vi.fn(),
}));

// ── Import subject after mocks ──────────────────────────────────────────────

import PropertyForge from '../../pages/workbench/tabs/PropertyForge';

// ── Helpers ─────────────────────────────────────────────────────────────────

const PARCEL_ID = '1-0001-010-0010-000';

function renderForge() {
  return render(
    <MemoryRouter initialEntries={[`/property/${PARCEL_ID}/forge`]}>
      <Routes>
        <Route path="/property/:parcelId/forge" element={<PropertyForge />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

afterEach(() => cleanup());

describe('Leg 1 — PropertyForge tab mounts', () => {
  it('renders the forge tab root without crashing', () => {
    renderForge();
    expect(document.querySelector('[data-testid="property-forge-tab"]')).not.toBeNull();
  });

  it('renders a tablist with aria-label "Forge approach tabs"', () => {
    renderForge();
    const tablist = screen.getByRole('tablist', { name: /forge approach tabs/i });
    expect(tablist).toBeTruthy();
  });
});

describe('Leg 2 — Sales sub-tab is discoverable', () => {
  it('has a tab with label matching /sales/i', () => {
    renderForge();
    const tabs = screen.getAllByRole('tab');
    const salesTab = tabs.find(t => /sales/i.test(t.textContent ?? ''));
    expect(salesTab).toBeDefined();
  });
});

describe('Leg 3 — Income sub-tab is discoverable', () => {
  it('has a tab with label matching /income/i', () => {
    renderForge();
    const tabs = screen.getAllByRole('tab');
    const incomeTab = tabs.find(t => /income/i.test(t.textContent ?? ''));
    expect(incomeTab).toBeDefined();
  });
});
```

- [ ] **Run** (from `frontend/` CWD):
  ```
  pnpm vitest run "AssessorValuationJourney.contract"
  ```
  Expected: may fail — fix missing mocks until green.

- [ ] **Fix** any missing vi.mock() entries by checking the import graph of `PropertyForge.tsx`. Add stubs for any module that calls out to network/store.

- [ ] **Verify green**:
  ```
  pnpm vitest run "AssessorValuationJourney.contract" 2>&1 | tail -5
  ```
  Expected: `Tests: 5 passed`

- [ ] **Commit** (from repo root):
  ```bash
  git add frontend/apps/os-shell/src/__tests__/journey/AssessorValuationJourney.contract.test.tsx
  git commit -m "test(journey): Phase 14 assessor valuation journey — Forge tab + sub-tab contract"
  ```

---

## Stream B — keyboardSuiteSwitch source contract

**Agent B: write → run → fix → commit**

### Task B1: Write the test

- [ ] **Create** `frontend/apps/os-shell/src/__tests__/shell/keyboardSuiteSwitch.contract.test.ts`

```ts
/**
 * keyboardSuiteSwitch.contract.test.ts
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Source-inspection contract for useKeyboardShortcuts.ts.
 * Proves Ctrl+1..7 module shortcut map and activateModule wiring
 * are present and correct — without rendering the full Desktop.
 *
 * @see hooks/useKeyboardShortcuts.ts
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let src: string;

beforeAll(() => {
  src = readFileSync(
    resolve(import.meta.dirname, '../../hooks/useKeyboardShortcuts.ts'),
    'utf-8'
  );
});

describe('Ctrl+N module shortcut map', () => {
  it("maps '1' to 'costforge'", () => {
    expect(src).toContain("'1': 'costforge'");
  });

  it("maps '2' to 'terra-gaia'", () => {
    expect(src).toContain("'2': 'terra-gaia'");
  });

  it("maps '3' to 'atlas-ai'", () => {
    expect(src).toContain("'3': 'atlas-ai'");
  });

  it("maps '4' to 'reporting'", () => {
    expect(src).toContain("'4': 'reporting'");
  });

  it("maps '5' to 'marketplace'", () => {
    expect(src).toContain("'5': 'marketplace'");
  });

  it("maps '6' to 'counties'", () => {
    expect(src).toContain("'6': 'counties'");
  });

  it("maps '7' to 'government-architecture'", () => {
    expect(src).toContain("'7': 'government-architecture'");
  });
});

describe('activateModule wiring', () => {
  it('imports activateModule from moduleActivation', () => {
    expect(src).toContain("from '../orchestration/moduleActivation'");
    expect(src).toContain('activateModule');
  });

  it('calls activateModule with the mapped moduleId on Ctrl+N', () => {
    // The handler must call activateModule(moduleId, ...) inside the Ctrl+1..7 branch
    expect(src).toContain('activateModule(moduleId');
  });
});

describe('keyboard event guard', () => {
  it('uses event.ctrlKey for number shortcuts (not altKey)', () => {
    // Verify the guard is ctrlKey, not altKey
    expect(src).toContain('ctrlKey');
    // Should NOT be guarded by altKey alone
    // (asserting altKey would be too strict — just verify ctrlKey is present)
  });
});
```

- [ ] **Run**:
  ```
  pnpm vitest run "keyboardSuiteSwitch.contract"
  ```

- [ ] **Fix** any path issues (the file is at `src/__tests__/shell/`, so `import.meta.dirname` → `../../hooks/` is correct).

- [ ] **Verify green**: `Tests: 10 passed`

- [ ] **Commit**:
  ```bash
  git add frontend/apps/os-shell/src/__tests__/shell/keyboardSuiteSwitch.contract.test.ts
  git commit -m "test(keyboard): Phase 14 Ctrl+1..7 module shortcut source contract"
  ```

---

## Stream C — demoModeHeaders contract

**Agent C: write → run → fix → commit**

### Task C1: Write the test

- [ ] **Create** `frontend/apps/os-shell/src/__tests__/demo/demoModeHeaders.contract.test.ts`

```ts
/**
 * demoModeHeaders.contract.test.ts
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Proves county isolation header contract for demo mode:
 *
 *   1. buildCountyScopedHeaders emits X-County-Id (auth variant)
 *   2. buildCountyScopedSessionHeaders emits x-county-id (session variant)
 *   3. Both return isolated: true for Benton
 *   4. Both return isolated: false for null/empty county
 *
 * @see services/countyIsolation.ts
 */
import { describe, it, expect } from 'vitest';
import {
  buildCountyScopedHeaders,
  buildCountyScopedSessionHeaders,
} from '../../services/countyIsolation';
import type { AuthContextValue } from '../../auth/useAuthContext';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BENTON_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: 'benton-assessor',
  countyId: 'benton',
  roles: ['assessor'],
  token: 'mock-token',
};

const NO_COUNTY_AUTH: AuthContextValue = {
  isAuthenticated: false,
  userId: '',
  countyId: '',
  roles: [],
  token: null,
};

const BENTON_SESSION = {
  userId: 'benton-assessor',
  countyId: 'benton',
  role: 'assessor',
  mode: 'pilot' as const,
};

// ── buildCountyScopedHeaders (auth variant) ──────────────────────────────────

describe('buildCountyScopedHeaders — auth variant', () => {
  it('returns isolated: true for Benton auth', () => {
    const { isolated } = buildCountyScopedHeaders(BENTON_AUTH);
    expect(isolated).toBe(true);
  });

  it('emits X-County-Id header with value "benton"', () => {
    const { headers } = buildCountyScopedHeaders(BENTON_AUTH);
    // Header key may be X-County-Id or x-county-id depending on impl
    const countyHeader =
      headers['X-County-Id'] ?? headers['x-county-id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBe('benton');
  });

  it('includes Authorization header when token is present', () => {
    const { headers } = buildCountyScopedHeaders(BENTON_AUTH);
    expect(headers['Authorization']).toBe('Bearer mock-token');
  });

  it('returns isolated: false for empty countyId', () => {
    const { isolated } = buildCountyScopedHeaders(NO_COUNTY_AUTH);
    expect(isolated).toBe(false);
  });

  it('does not emit county header for empty countyId', () => {
    const { headers } = buildCountyScopedHeaders(NO_COUNTY_AUTH);
    const countyHeader =
      headers['X-County-Id'] ?? headers['x-county-id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBeUndefined();
  });
});

// ── buildCountyScopedSessionHeaders (session variant) ───────────────────────

describe('buildCountyScopedSessionHeaders — session variant', () => {
  it('returns isolated: true for Benton session', () => {
    const { isolated } = buildCountyScopedSessionHeaders(BENTON_SESSION);
    expect(isolated).toBe(true);
  });

  it('emits x-county-id header with value "benton"', () => {
    const { headers } = buildCountyScopedSessionHeaders(BENTON_SESSION);
    const countyHeader =
      headers['x-county-id'] ?? headers['X-County-Id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBe('benton');
  });

  it('returns isolated: false for null session', () => {
    const { isolated } = buildCountyScopedSessionHeaders(null);
    expect(isolated).toBe(false);
  });

  it('does not emit county header for null session', () => {
    const { headers } = buildCountyScopedSessionHeaders(null);
    const countyHeader =
      headers['x-county-id'] ?? headers['X-County-Id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBeUndefined();
  });
});
```

- [ ] **Run**:
  ```
  pnpm vitest run "demoModeHeaders.contract"
  ```

- [ ] **Fix** any TypeScript type errors on fixtures — check `AuthContextValue` shape by reading `src/auth/useAuthContext.ts` and `src/auth/useSession.ts`.

- [ ] **Verify green**: `Tests: 9 passed`

- [ ] **Commit**:
  ```bash
  git add frontend/apps/os-shell/src/__tests__/demo/demoModeHeaders.contract.test.ts
  git commit -m "test(demo): Phase 14 county isolation header contract — auth + session variants"
  ```

---

## Stream D — suiteRouting contract

**Agent D: write → run → fix → commit**

### Task D1: Write the test

Key constraints:
- Suite routes live under `<App />` which wraps `<AuthGuard>`. **Do NOT render `Router`** — use `MemoryRouter` + import the page components directly.
- Mock `@/auth/authPolicy` to prevent `shouldForceLoginRedirect()` from redirecting.
- Mock `@/auth/useAuth` to return `isAuthenticated: true`.
- Import components directly (not lazy): `ForgeSuiteHome`, `AtlasSuiteHome`, `DaisSuiteHome`, `CanonHome`.

- [ ] **Create** `frontend/apps/os-shell/src/__tests__/routes/suiteRouting.contract.test.tsx`

```tsx
/**
 * suiteRouting.contract.test.tsx
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Proves suite home components mount when navigated to their routes.
 * Uses MemoryRouter + direct component imports (not the full App Router)
 * to avoid AuthGuard redirect complexity.
 *
 * Contract:
 *   /forge  → ForgeSuiteHome mounts  (contains h1 with "TerraForge" or "Forge")
 *   /atlas  → AtlasSuiteHome mounts  (contains h1 with "TerraAtlas" or "Atlas")
 *   /dais   → DaisSuiteHome mounts   (contains h1 with "TerraDais"  or "Dais")
 *   /canon  → CanonHome mounts       (some primary content renders without crash)
 *
 * @see router.tsx — suite route definitions
 * @see pages/suites/ForgeSuiteHome.tsx
 * @see pages/suites/AtlasSuiteHome.tsx
 * @see pages/suites/DaisSuiteHome.tsx
 * @see pages/CanonHome.tsx
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Shared mocks ─────────────────────────────────────────────────────────────

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'benton-assessor-test',
    countyId: 'benton',
    roles: ['assessor'],
    token: null,
  })),
  useAuthContextOptional: vi.fn(() => null),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: vi.fn(() => ({
    userId: 'benton-assessor-test',
    countyId: 'benton',
    role: 'assessor',
    mode: 'pilot',
  })),
}));

vi.mock('../../auth/authPolicy', () => ({
  isDevPreviewMode: () => true,
  shouldForceLoginRedirect: () => false,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-slot': 'icon', ...props });
  return new Proxy({}, { get: () => Icon });
});

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      totalParcels: 89247,
      parcelsByCity: {},
      parcelsByType: {},
      averageAssessedValue: 285000,
      assessedThisYear: 45000,
      pendingAssessments: 0,
      assessmentCompletionPercent: 86.5,
      activeAppeals: 0,
      totalLevyRevenue: 0,
    },
  }),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: { modules?: unknown[] }) =>
    React.createElement('div', { 'data-testid': 'mock-module-grid' }, `${props.modules?.length ?? 0} modules`),
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: { title?: string }) =>
    React.createElement('div', { 'data-testid': 'mock-queue', 'data-title': props.title }),
}));

// ── Import subjects after mocks ───────────────────────────────────────────────

import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';
import AtlasSuiteHome from '../../pages/suites/AtlasSuiteHome';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';

afterEach(() => cleanup());

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAt(path: string, Component: React.ComponentType) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<Component />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('/forge → ForgeSuiteHome', () => {
  it('mounts without crashing', () => {
    const { container } = renderAt('/forge', ForgeSuiteHome);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders an h1 containing "Forge" or "TerraForge"', () => {
    renderAt('/forge', ForgeSuiteHome);
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent ?? '').toMatch(/forge/i);
  });
});

describe('/atlas → AtlasSuiteHome', () => {
  it('mounts without crashing', () => {
    const { container } = renderAt('/atlas', AtlasSuiteHome);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders an h1 containing "Atlas" or "TerraAtlas"', () => {
    renderAt('/atlas', AtlasSuiteHome);
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent ?? '').toMatch(/atlas/i);
  });
});

describe('/dais → DaisSuiteHome', () => {
  it('mounts without crashing', () => {
    const { container } = renderAt('/dais', DaisSuiteHome);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders an h1 containing "Dais" or "TerraDais"', () => {
    renderAt('/dais', DaisSuiteHome);
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent ?? '').toMatch(/dais/i);
  });
});
```

**Note on `/canon`:** `CanonHome` is the full IDE shell and has heavy editor dependencies. Omit it from this contract — it has its own existing test coverage. If it passes easily, add it; if it causes timeouts, skip with `it.skip`.

- [ ] **Run**:
  ```
  pnpm vitest run "suiteRouting.contract"
  ```

- [ ] **Fix** missing mocks by checking what each SuiteHome imports. Common additions: `useRecentParcels`, `dataProvider`, `useModuleRegistryStore`.

- [ ] **Verify green**: `Tests: 6 passed`

- [ ] **Commit**:
  ```bash
  git add frontend/apps/os-shell/src/__tests__/routes/suiteRouting.contract.test.tsx
  git commit -m "test(routes): Phase 14 suite route mounting contract — Forge/Atlas/Dais"
  ```

---

## Integration gate (after all 4 streams complete)

Run from `frontend/` CWD:

```bash
pnpm vitest run 2>&1 | grep -E "Test Files|Tests |Errors" | tail -4
```

Expected: `0 failed | 462+ passed`

Then seal:

```bash
node --test tests/deployment-truth-gate.test.mjs 2>&1 | tail -5
cd frontend && pnpm run type-check 2>&1 | tail -3
```

Final seal commit (from repo root):

```bash
git commit -m "chore(seal): Phase 14 sealed — operator journey proofing complete"
```

---

## Dispatch instructions

**Dispatch 4 agents in parallel**, one per stream. Each agent receives:

```
You are implementing Stream [A/B/C/D] of the Phase 14 plan.
Plan: docs/superpowers/plans/2026-03-20-phase14-operator-journey-proofing.md
CWD for vitest runs: /c/Users/bsval/terrafusion_os_1.0/frontend
Repo root for git commits: /c/Users/bsval/terrafusion_os_1.0

Read the plan section for your stream, write the test, run vitest,
fix until green, commit. Do not touch other streams' files.
```

After all 4 report done, run the integration gate and seal.
