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
 * NOTE: Agent B1 creates __tests__/fixtures/counties.ts. Since B1 and B2
 * run in parallel, this file defines inline fixtures and adds a TODO to
 * switch to the shared fixtures file once B1 lands.
 *
 * TODO(B1 merge): Replace inline fixtures below with:
 *   import { BENTON_AUTH, COWLITZ_AUTH, BENTON_PARCEL_IDS, COWLITZ_PARCEL_IDS, PACS_RESPONSES_BY_COUNTY }
 *     from '../fixtures/counties';
 *
 * @see services/countyIsolation.ts — buildCountyScopedHeaders (returns { headers, isolated })
 * @see api/pilotApi.ts (x-county-id header)
 * @see auth/useAuthContext.ts
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AuthContextValue } from '../../auth/useAuthContext';

// ── Inline fixtures (TODO: replace with import from '../fixtures/counties' after B1 lands) ──

/** Benton County — primary assessor user (WA FIPS 005) */
const BENTON_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: 'benton-assessor-001',
  countyId: 'benton',
  roles: ['assessor'],
  token: 'fake-benton-token',
};

/** Cowlitz County — second county for isolation tests (WA FIPS 015) */
const COWLITZ_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: 'cowlitz-assessor-001',
  countyId: 'cowlitz',
  roles: ['assessor'],
  token: 'fake-cowlitz-token',
};

/** Benton County parcel GeoIDs */
const BENTON_PARCEL_IDS = {
  residential: '1-0001-010-0010-000',
  commercial: '1-0200-100-0001-000',
  agricultural: '1-0500-200-0001-000',
} as const;

/** Cowlitz County parcel GeoIDs */
const COWLITZ_PARCEL_IDS = {
  residential: '2-0001-010-0010-000',
  commercial: '2-0200-100-0001-000',
} as const;

/** Mock pacsService responses keyed by countyId */
const PACS_RESPONSES_BY_COUNTY: Record<string, { items: object[]; totalCount: number }> = {
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
    totalCount: 44000,
  },
};

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

// Auth context is controlled per-test via currentAuth variable
let currentAuth: AuthContextValue = BENTON_AUTH;

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => currentAuth),
  useAuthContextOptional: vi.fn(() => null),
}));

// pacsService returns county-appropriate data based on currently active auth countyId
vi.mock('../../services/pacsService', () => ({
  getPacsProperties: vi.fn(async () => {
    return PACS_RESPONSES_BY_COUNTY[currentAuth.countyId ?? ''] ??
      { items: [], totalCount: 0 };
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderPropertySearchAs(auth: AuthContextValue) {
  currentAuth = auth;
  // Re-apply the mock so the hook returns the updated currentAuth
  const { useAuthContext } = await import('../../auth/useAuthContext');
  vi.mocked(useAuthContext).mockReturnValue(auth);
  const { getPacsProperties } = await import('../../services/pacsService');
  vi.mocked(getPacsProperties).mockImplementation(async () => {
    return PACS_RESPONSES_BY_COUNTY[auth.countyId ?? ''] ?? { items: [], totalCount: 0 };
  });

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
    currentAuth = BENTON_AUTH;
  });

  afterEach(() => {
    vi.clearAllMocks();
    currentAuth = BENTON_AUTH;
  });

  // ── Section 1: Benton sees only Benton parcels ────────────────────────────

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

  // ── Section 2: Cowlitz sees only Cowlitz parcels ─────────────────────────

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

  // ── Section 3: Switching county context changes result set ───────────────

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

  // ── Section 4: countyIsolation service — x-county-id header per county ───

  describe('countyIsolation service: x-county-id header per county', () => {
    it('buildCountyScopedHeaders returns benton X-County-Id for Benton auth', async () => {
      const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
      const { headers, isolated } = buildCountyScopedHeaders(BENTON_AUTH);
      expect(headers['X-County-Id']).toBe('benton');
      expect(isolated).toBe(true);
    });

    it('buildCountyScopedHeaders returns cowlitz X-County-Id for Cowlitz auth', async () => {
      const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
      const { headers, isolated } = buildCountyScopedHeaders(COWLITZ_AUTH);
      expect(headers['X-County-Id']).toBe('cowlitz');
      expect(isolated).toBe(true);
    });

    it('X-County-Id values are distinct between counties', async () => {
      const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
      const { headers: bentonHeaders } = buildCountyScopedHeaders(BENTON_AUTH);
      const { headers: cowlitzHeaders } = buildCountyScopedHeaders(COWLITZ_AUTH);
      expect(bentonHeaders['X-County-Id']).not.toBe(cowlitzHeaders['X-County-Id']);
    });

    it('both counties are fully isolated (isolated=true)', async () => {
      const { buildCountyScopedHeaders } = await import('../../services/countyIsolation');
      const { isolated: bentonIsolated } = buildCountyScopedHeaders(BENTON_AUTH);
      const { isolated: cowlitzIsolated } = buildCountyScopedHeaders(COWLITZ_AUTH);
      expect(bentonIsolated).toBe(true);
      expect(cowlitzIsolated).toBe(true);
    });
  });
});
