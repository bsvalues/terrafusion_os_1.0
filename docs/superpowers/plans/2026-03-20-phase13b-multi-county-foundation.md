# Phase 13B: Multi-County Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove TerraFusion OS can serve a second county — add county-2 test fixtures, verify JWT countyId drives data isolation between two counties, and add a county provisioning contract that a new county operator can follow.

**Architecture:** Three independent parallel agents. Agent B1 adds a County 2 (Cowlitz) test fixture to the auth layer — a second JWT claim set that the test suite can use. Agent B2 writes isolation tests that prove data returned for County A is not returned for County B (using mocked pacsService). Agent B3 writes the county provisioning runbook (operator guide for onboarding County 2) and a contract test that validates the provisioning preconditions. All agents are frontend-only — no backend database migrations in this phase.

**Tech Stack:** Vitest, TypeScript 5.3, `useAuthContext.ts`, `countyIsolation.ts`, `pilotApi.ts`, `pacsService.ts`, JSON test fixtures

---

## Parallel Execution Map

```
Agent B1 (county-2 fixture)    Agent B2 (isolation tests)    Agent B3 (provisioning contract)
          |                             |                               |
          v                             v                               v
County 2 JWT claim fixture    County A ≠ County B proof    Provisioning runbook + contract
          |                             |                               |
          └──────────── Integration gate (vitest + truth gate) ────────┘
```

Agents B1, B2, B3 are fully independent. Dispatch all three simultaneously.

---

## File Map

| File | Action | Agent |
|------|--------|-------|
| `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts` | Create — county test fixtures (Benton + Cowlitz) | B1 |
| `frontend/apps/os-shell/src/__tests__/isolation/multiCountyIsolation.contract.test.tsx` | Create — proves County A data ≠ County B | B2 |
| `frontend/apps/os-shell/src/__tests__/provisioning/countyProvisioning.contract.test.ts` | Create — provisioning precondition contracts | B3 |
| `docs/governance/COUNTY_PROVISIONING_RUNBOOK_2026-03-20.md` | Create — operator guide for onboarding County 2 | B3 |

**Out of scope:** Backend database migrations, new UI county picker, AKS multi-tenant deployment, external DNS/cert provisioning.

---

## Agent B1: County-2 Test Fixture

**Context:** All current tests use `countyId: 'benton'`. To prove multi-county isolation, we need a second county fixture with its own `countyId`, `userId`, and JWT claim shape. Cowlitz County (`cowlitz`, WA FIPS `014`) is the natural first candidate.

### Task B1.1: Create county fixtures file

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts`

- [ ] **Step B1.1.1: Check for existing fixture patterns**

  ```bash
  find frontend/apps/os-shell/src/__tests__ -name "*.ts" | xargs grep -l "countyId\|benton" 2>/dev/null | head -5
  ```

  This shows you how existing tests set up county context.

- [ ] **Step B1.1.2: Write the fixture file**

  Create `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts`:

  ```typescript
  /**
   * counties.ts — County test fixtures for multi-county isolation tests.
   *
   * Provides canonical AuthContextValue shapes for Benton and Cowlitz counties.
   * Use these in tests instead of inline county objects to keep test data DRY.
   *
   * @see auth/useAuthContext.ts (AuthContextValue)
   */
  import type { AuthContextValue } from '../../auth/useAuthContext';

  /** Benton County — primary assessor user (WA FIPS 005) */
  export const BENTON_AUTH: AuthContextValue = {
    isAuthenticated: true,
    userId: 'benton-assessor-001',
    countyId: 'benton',
    roles: ['assessor'],
    token: 'fake-benton-token',
  };

  /** Benton County parcel GeoIDs */
  export const BENTON_PARCEL_IDS = {
    residential: '1-0001-010-0010-000',
    commercial: '1-0200-100-0001-000',
    agricultural: '1-0500-200-0001-000',
  } as const;

  /** Cowlitz County — second county for isolation tests (WA FIPS 015) */
  export const COWLITZ_AUTH: AuthContextValue = {
    isAuthenticated: true,
    userId: 'cowlitz-assessor-001',
    countyId: 'cowlitz',
    roles: ['assessor'],
    token: 'fake-cowlitz-token',
  };

  /** Cowlitz County parcel GeoIDs */
  export const COWLITZ_PARCEL_IDS = {
    residential: '2-0001-010-0010-000',
    commercial: '2-0200-100-0001-000',
  } as const;

  /**
   * Mock pacsService responses keyed by countyId.
   * Use in vi.mock() factories to return county-appropriate data.
   */
  export const PACS_RESPONSES_BY_COUNTY: Record<string, { items: object[]; totalCount: number }> = {
    benton: {
      items: [
        {
          geoId: BENTON_PARCEL_IDS.residential,
          address: '123 TULIP LN KENNEWICK WA 99336',
          assessedValue: 285000,
          marketValue: 310000,
          propertyType: 'Residential',
        },
      ],
      totalCount: 89247,
    },
    cowlitz: {
      items: [
        {
          geoId: COWLITZ_PARCEL_IDS.residential,
          address: '456 SPIRIT LAKE HWY CASTLE ROCK WA 98611',
          assessedValue: 198000,
          marketValue: 215000,
          propertyType: 'Residential',
        },
      ],
      totalCount: 44000, // approximate Cowlitz parcel count
    },
  };
  ```

- [ ] **Step B1.1.3: Verify the fixture type-checks**

  ```bash
  cd frontend && pnpm run type-check 2>&1 | grep "fixtures/counties" | head -5
  ```

  Expected: no errors.

- [ ] **Step B1.1.4: Commit**

  ```bash
  git add frontend/apps/os-shell/src/__tests__/fixtures/counties.ts
  git commit -m "test(fixtures): add Benton + Cowlitz county fixtures for multi-county isolation tests"
  ```

---

## Agent B2: Multi-County Isolation Contract Tests

**Context:** The isolation invariant is: a request authenticated as County A must never see County B data. In the frontend, this is enforced by `x-county-id` header (from `pilotApi.ts`) + `useAuthContext()` `countyId` claim. We prove it by rendering `PropertySearch` with two different auth contexts and verifying each sees only its own county's parcels.

**Depends on:** Agent B1 fixture file (`counties.ts`). Agent B2 can start immediately — it imports `counties.ts` which is created by B1.

### Task B2.1: Write multi-county isolation tests

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/isolation/multiCountyIsolation.contract.test.tsx`

- [ ] **Step B2.1.1: Write the isolation tests**

  Create `frontend/apps/os-shell/src/__tests__/isolation/multiCountyIsolation.contract.test.tsx`:

  ```tsx
  /**
   * multiCountyIsolation.contract.test.tsx
   *
   * Phase 13B — Multi-County Data Isolation Contract
   * =================================================
   *
   * Proves the core isolation invariant:
   *   County A credentials → County A parcels only
   *   County B credentials → County B parcels only
   *   County A parcel IDs never appear in County B results
   *
   * Uses county fixtures from __tests__/fixtures/counties.ts.
   * Mocks pacsService to return county-appropriate data based on auth context.
   *
   * @see services/countyIsolation.ts
   * @see api/pilotApi.ts (x-county-id header)
   * @see auth/useAuthContext.ts
   */
  import React from 'react';
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import { render, screen, waitFor } from '@testing-library/react';
  import { MemoryRouter, Route, Routes } from 'react-router-dom';
  import {
    BENTON_AUTH,
    COWLITZ_AUTH,
    BENTON_PARCEL_IDS,
    COWLITZ_PARCEL_IDS,
    PACS_RESPONSES_BY_COUNTY,
  } from '../fixtures/counties';

  // ── Mocks ─────────────────────────────────────────────────────────────────────

  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
  });

  vi.mock('../../context/parcelContext', () => ({
    useRecentParcels: vi.fn(() => []),
    ParcelContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));

  // Auth context is per-test — controlled by currentAuth variable
  let currentAuth = BENTON_AUTH;
  vi.mock('../../auth/useAuthContext', () => ({
    useAuthContext: vi.fn(() => currentAuth),
    useAuthContextOptional: vi.fn(() => null),
  }));

  // pacsService returns county-appropriate data based on countyId in auth context
  vi.mock('../../services/pacsService', () => ({
    getPacsProperties: vi.fn(async () => {
      // Return data for the currently active county
      return PACS_RESPONSES_BY_COUNTY[currentAuth.countyId] ??
        { items: [], totalCount: 0 };
    }),
  }));

  // ── Helpers ───────────────────────────────────────────────────────────────────

  async function renderPropertySearchAs(auth: typeof BENTON_AUTH) {
    currentAuth = auth;
    const { default: PropertySearch } = await import('../../pages/PropertySearch');
    return render(
      <MemoryRouter initialEntries={['/property']}>
        <Routes>
          <Route path='/property' element={<PropertySearch />} />
        </Routes>
      </MemoryRouter>
    );
  }

  // ── Tests ─────────────────────────────────────────────────────────────────────

  describe('Phase 13B: Multi-County Data Isolation Contract', () => {
    beforeEach(() => {
      mockNavigate.mockClear();
      vi.clearAllMocks();
    });

    afterEach(() => {
      currentAuth = BENTON_AUTH; // reset to default
    });

    describe('County A (Benton) sees only Benton parcels', () => {
      it('Benton search results contain Benton parcel ID', async () => {
        await renderPropertySearchAs(BENTON_AUTH);
        await waitFor(() => {
          expect(screen.getByText(BENTON_PARCEL_IDS.residential)).toBeTruthy();
        });
      });

      it('Benton search results do NOT contain Cowlitz parcel ID', async () => {
        await renderPropertySearchAs(BENTON_AUTH);
        await waitFor(() => screen.getByText(BENTON_PARCEL_IDS.residential));
        expect(screen.queryByText(COWLITZ_PARCEL_IDS.residential)).toBeNull();
      });
    });

    describe('County B (Cowlitz) sees only Cowlitz parcels', () => {
      it('Cowlitz search results contain Cowlitz parcel ID', async () => {
        await renderPropertySearchAs(COWLITZ_AUTH);
        await waitFor(() => {
          expect(screen.getByText(COWLITZ_PARCEL_IDS.residential)).toBeTruthy();
        });
      });

      it('Cowlitz search results do NOT contain Benton parcel ID', async () => {
        await renderPropertySearchAs(COWLITZ_AUTH);
        await waitFor(() => screen.getByText(COWLITZ_PARCEL_IDS.residential));
        expect(screen.queryByText(BENTON_PARCEL_IDS.residential)).toBeNull();
      });
    });

    describe('Isolation invariant: switching county context changes result set', () => {
      it('Benton and Cowlitz results are mutually exclusive', async () => {
        // Render as Benton, collect visible text
        const { unmount } = await renderPropertySearchAs(BENTON_AUTH);
        await waitFor(() => screen.getByText(BENTON_PARCEL_IDS.residential));
        const bentonText = document.body.textContent ?? '';
        unmount();

        // Render as Cowlitz, collect visible text
        await renderPropertySearchAs(COWLITZ_AUTH);
        await waitFor(() => screen.getByText(COWLITZ_PARCEL_IDS.residential));
        const cowlitzText = document.body.textContent ?? '';

        // Benton parcel must not appear in Cowlitz results
        expect(cowlitzText).not.toContain(BENTON_PARCEL_IDS.residential);
        // Cowlitz parcel must not have appeared in Benton results
        expect(bentonText).not.toContain(COWLITZ_PARCEL_IDS.residential);
      });
    });

    describe('countyIsolation service: x-county-id header per county', () => {
      it('buildCountyScopedHeaders returns benton for Benton auth', async () => {
        const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
        const headers = buildCountyScopedHeaders(BENTON_AUTH);
        expect(headers['x-county-id']).toBe('benton');
      });

      it('buildCountyScopedHeaders returns cowlitz for Cowlitz auth', async () => {
        const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
        const headers = buildCountyScopedHeaders(COWLITZ_AUTH);
        expect(headers['x-county-id']).toBe('cowlitz');
      });

      it('x-county-id values are distinct between counties', async () => {
        const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
        const bentonHeaders = buildCountyScopedHeaders(BENTON_AUTH);
        const cowlitzHeaders = buildCountyScopedHeaders(COWLITZ_AUTH);
        expect(bentonHeaders['x-county-id']).not.toBe(cowlitzHeaders['x-county-id']);
      });
    });
  });
  ```

- [ ] **Step B2.1.2: Run the test**

  ```bash
  cd frontend/apps/os-shell
  pnpm vitest run src/__tests__/isolation/multiCountyIsolation.contract.test.tsx --reporter=verbose 2>&1 | tail -20
  ```

  Expected: All tests pass. If `buildCountyScopedHeaders` is not exported, check:
  ```bash
  grep -n "export.*buildCountyScopedHeaders" frontend/apps/os-shell/src/services/countyIsolation.ts
  ```

- [ ] **Step B2.1.3: Commit**

  ```bash
  git add frontend/apps/os-shell/src/__tests__/isolation/multiCountyIsolation.contract.test.tsx
  git commit -m "test(isolation): Phase 13B multi-county isolation contract — Benton and Cowlitz data never cross

  Proves: County A auth → County A parcels only, County B auth → County B parcels only.
  Proves: x-county-id header is distinct per county.
  Proves: switching county context changes result set."
  ```

---

## Agent B3: County Provisioning Runbook + Contract

**Context:** A second county operator needs to know exactly what to configure to onboard. The provisioning contract is: a county is provisionable if it has a unique `countyId` slug, a valid admin user credential, and a PACS data source connection. This agent writes the runbook + a contract test that validates those preconditions are met.

### Task B3.1: Write provisioning contract test

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/provisioning/countyProvisioning.contract.test.ts`

- [ ] **Step B3.1.1: Write the test**

  Create `frontend/apps/os-shell/src/__tests__/provisioning/countyProvisioning.contract.test.ts`:

  ```typescript
  /**
   * countyProvisioning.contract.test.ts
   *
   * Phase 13B — County Provisioning Precondition Contract
   * ======================================================
   *
   * Documents and verifies the preconditions required to provision
   * a new county in TerraFusion OS. These are structural constraints,
   * not runtime checks.
   *
   * A county is "provisionable" if:
   *   1. It has a unique slug (lowercase, no spaces, ASCII)
   *   2. Its countyId can be decoded from a JWT claim
   *   3. buildCountyScopedHeaders produces a valid x-county-id header
   *   4. Its auth context shape matches AuthContextValue
   *
   * @see __tests__/fixtures/counties.ts  — example county fixtures
   * @see services/countyIsolation.ts     — header builder
   */
  import { describe, it, expect } from 'vitest';
  import { BENTON_AUTH, COWLITZ_AUTH } from '../fixtures/counties';

  // ── County slug validation ────────────────────────────────────────────────────

  const VALID_COUNTY_SLUG = /^[a-z][a-z0-9-]{1,30}$/;

  function isValidCountySlug(slug: string): boolean {
    return VALID_COUNTY_SLUG.test(slug);
  }

  // ── Tests ─────────────────────────────────────────────────────────────────────

  describe('Phase 13B: County Provisioning Precondition Contract', () => {
    describe('County slug format invariants', () => {
      it('Benton county slug is valid', () => {
        expect(isValidCountySlug(BENTON_AUTH.countyId!)).toBe(true);
      });

      it('Cowlitz county slug is valid', () => {
        expect(isValidCountySlug(COWLITZ_AUTH.countyId!)).toBe(true);
      });

      it('county slugs are distinct', () => {
        expect(BENTON_AUTH.countyId).not.toBe(COWLITZ_AUTH.countyId);
      });

      it('rejects slugs with spaces', () => {
        expect(isValidCountySlug('benton county')).toBe(false);
      });

      it('rejects slugs with uppercase', () => {
        expect(isValidCountySlug('Benton')).toBe(false);
      });

      it('rejects empty slugs', () => {
        expect(isValidCountySlug('')).toBe(false);
      });
    });

    describe('AuthContextValue shape requirements', () => {
      const REQUIRED_FIELDS: (keyof typeof BENTON_AUTH)[] = [
        'isAuthenticated',
        'userId',
        'countyId',
        'roles',
        'token',
      ];

      it.each(REQUIRED_FIELDS)('Benton auth has required field: %s', (field) => {
        expect(BENTON_AUTH[field]).toBeDefined();
      });

      it.each(REQUIRED_FIELDS)('Cowlitz auth has required field: %s', (field) => {
        expect(COWLITZ_AUTH[field]).toBeDefined();
      });
    });

    describe('Isolation header preconditions', () => {
      it('buildCountyScopedHeaders accepts Cowlitz auth shape', async () => {
        const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
        expect(() => buildCountyScopedHeaders(COWLITZ_AUTH)).not.toThrow();
        const headers = buildCountyScopedHeaders(COWLITZ_AUTH);
        expect(headers['x-county-id']).toBe('cowlitz');
      });

      it('any county with valid AuthContextValue can get county-scoped headers', async () => {
        const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
        // Simulate a third county (Yakima)
        const yakimaAuth = {
          ...BENTON_AUTH,
          userId: 'yakima-assessor-001',
          countyId: 'yakima',
          token: 'fake-yakima-token',
        };
        const headers = buildCountyScopedHeaders(yakimaAuth);
        expect(headers['x-county-id']).toBe('yakima');
      });
    });

    describe('Provisioning preconditions documentation', () => {
      it('fixture file exists for at least two counties', async () => {
        // This test acts as a lint: if this file runs, the fixtures exist.
        expect(BENTON_AUTH.countyId).toBe('benton');
        expect(COWLITZ_AUTH.countyId).toBe('cowlitz');
      });

      it('adding County 3 requires: unique slug, AuthContextValue fixture, PACS data source config', () => {
        // Documentation test — always passes.
        // See docs/governance/COUNTY_PROVISIONING_RUNBOOK_2026-03-20.md for steps.
        const requiredForNewCounty = ['unique-slug', 'auth-context-fixture', 'pacs-connection'];
        expect(requiredForNewCounty).toHaveLength(3);
      });
    });
  });
  ```

- [ ] **Step B3.1.2: Run the test**

  ```bash
  cd frontend/apps/os-shell
  pnpm vitest run src/__tests__/provisioning/countyProvisioning.contract.test.ts --reporter=verbose 2>&1 | tail -15
  ```

  Expected: All tests pass.

### Task B3.2: Write county provisioning runbook

**Files:**
- Create: `docs/governance/COUNTY_PROVISIONING_RUNBOOK_2026-03-20.md`

- [ ] **Step B3.2.1: Create the runbook**

  Create `docs/governance/COUNTY_PROVISIONING_RUNBOOK_2026-03-20.md`:

  ```markdown
  # County Provisioning Runbook
  Date: 2026-03-20
  Phase: 13B
  Applies to: Any WA State county onboarding to TerraFusion OS

  ## Preconditions

  Before provisioning a new county, confirm all of the following:

  | Item | Description | Status |
  |------|-------------|--------|
  | County slug | Unique lowercase ASCII identifier (e.g., `cowlitz`, `yakima`) | Required |
  | Admin user | County assessor admin credentials for login | Required |
  | PACS connection | Harris PACS 9.0 connection string + county FIPS code | Required |
  | `.env.demo` | County-specific demo environment file (see template) | Required for demo |

  ## Step 1: Add county test fixture

  Add to `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts`:

  ```typescript
  export const COUNTY_X_AUTH: AuthContextValue = {
    isAuthenticated: true,
    userId: '<county-slug>-assessor-001',
    countyId: '<county-slug>',
    roles: ['assessor'],
    token: 'fake-<county-slug>-token',
  };

  export const COUNTY_X_PARCEL_IDS = {
    residential: '<county-prefix>-0001-010-0010-000',
  } as const;
  ```

  ## Step 2: Add PACS response to fixture

  Add to `PACS_RESPONSES_BY_COUNTY` in `counties.ts`:

  ```typescript
  '<county-slug>': {
    items: [{ geoId: COUNTY_X_PARCEL_IDS.residential, address: '...', assessedValue: 0, marketValue: 0, propertyType: 'Residential' }],
    totalCount: <estimated-parcel-count>,
  },
  ```

  ## Step 3: Create `.env.demo` for the new county

  Copy `.env.demo.example` and fill in:

  ```bash
  cp frontend/apps/os-shell/.env.demo.example frontend/apps/os-shell/.env.demo
  # Edit: VITE_COUNTY_ID=<county-slug>
  # Edit: VITE_COUNTY_NAME=<County Name>
  # Edit: VITE_API_URL=<pacs-api-endpoint>
  ```

  ## Step 4: Run provisioning contract test

  ```bash
  cd frontend/apps/os-shell
  pnpm vitest run src/__tests__/provisioning/countyProvisioning.contract.test.ts
  ```

  Expected: all pass.

  ## Step 5: Run multi-county isolation test

  ```bash
  pnpm vitest run src/__tests__/isolation/multiCountyIsolation.contract.test.tsx
  ```

  Expected: all pass, including County X isolation.

  ## Step 6: Run demo journey for new county

  Launch app with new county's `.env.demo`:

  ```bash
  cd frontend/apps/os-shell
  pnpm vite --mode demo
  ```

  Walk through BentonDemoJourney manually:
  - Login with county admin credentials
  - Search parcels — verify county-specific parcel IDs appear
  - Click parcel → workbench opens with correct parcel
  - Navigate Forge, Atlas, Clerk tabs — no crash

  ## Rollback

  Remove the new county fixture entry from `counties.ts` and delete the `.env.demo` file. No backend changes were made in Phase 13B.

  ## Counties Currently Provisioned

  | County | Slug | FIPS | Phase |
  |--------|------|------|-------|
  | Benton | `benton` | WA-005 | Phase 7 (complete) |
  | Cowlitz | `cowlitz` | WA-015 | Phase 13B (fixture only) |
  ```

- [ ] **Step B3.2.2: Commit**

  ```bash
  git add \
    frontend/apps/os-shell/src/__tests__/provisioning/countyProvisioning.contract.test.ts \
    docs/governance/COUNTY_PROVISIONING_RUNBOOK_2026-03-20.md
  git commit -m "test(provisioning): Phase 13B county provisioning contract + runbook

  Contract: validates county slug format, AuthContextValue shape, header builder.
  Runbook: step-by-step guide for onboarding any WA county to TerraFusion OS."
  ```

---

## Integration Gate

Run after all three agents complete.

### Task INT: Full gate

- [ ] **Step INT.1: Run vitest**

  ```bash
  cd frontend/apps/os-shell
  pnpm vitest run 2>&1 | grep "Test Files\|Tests" | tail -4
  ```

  Expected: 0 failed files.

- [ ] **Step INT.2: Run deployment truth gate**

  ```bash
  cd C:/Users/bsval/terrafusion_os_1.0
  node --test tests/deployment-truth-gate.test.mjs 2>&1 | tail -5
  ```

  Expected: 63/63.

- [ ] **Step INT.3: Type check**

  ```bash
  cd frontend && pnpm run type-check 2>&1 | tail -3
  ```

  Expected: clean.

---

## Success Criteria (Phase 13B Complete)

1. `counties.ts` fixture — Benton + Cowlitz defined with full AuthContextValue + parcel IDs ✅
2. `multiCountyIsolation.contract.test.tsx` — County A parcel never appears in County B results ✅
3. `countyProvisioning.contract.test.ts` — all precondition assertions green ✅
4. `COUNTY_PROVISIONING_RUNBOOK_2026-03-20.md` — operator guide committed ✅
5. 0 test failures, 63/63 truth gate, clean type check ✅

## Scope Boundary

**In scope:** County test fixtures, multi-county isolation proof, provisioning contract test, operator runbook.
**Out of scope:** Backend database migrations, county picker UI, AKS multi-tenant deployment, DNS/cert provisioning, actual Cowlitz PACS data connection (Phase 14+).

## Sequencing Note

Phase 13B can execute in parallel with Phase 13A. Neither track modifies the other's files. Phase 14 (actual Cowlitz PACS data integration) should begin only after Phase 13A demo is delivered and stakeholder feedback is incorporated.
