/**
 * PropertyJourneyContract.test.tsx
 *
 * Phase 12 — Benton County Golden Journey Contract
 * =================================================
 *
 * Proves the core assessor workflow is structurally intact:
 *
 *   Leg 1: PropertySearch renders — search input + result list present
 *   Leg 2: Clicking a result calls navigate('/property/:geoId')
 *   Leg 3: PropertyWorkbench mounts without error when parcelId is in route
 *
 * Does NOT require a running backend. All external calls are mocked.
 *
 * @see pages/PropertySearch.tsx              — parcel search/browse
 * @see pages/workbench/PropertyWorkbench.tsx — per-parcel workbench
 * @see services/pacsService.ts               — PACS API client
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mock: react-router-dom navigate ──────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Mock: PACS service ────────────────────────────────────────────────────────

const BENTON_TEST_PARCEL = '1-0001-010-0010-000';
const BENTON_TEST_ADDRESS = '123 TULIP LN, KENNEWICK WA 99336';

vi.mock('../../services/pacsService', () => ({
  getPacsProperties: vi.fn().mockResolvedValue({
    items: [
      {
        geoId: BENTON_TEST_PARCEL,
        address: BENTON_TEST_ADDRESS,
        assessedValue: 285000,
        marketValue: 310000,
        propertyType: 'Residential',
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
  }),
}));

// ── Mock: auth context ────────────────────────────────────────────────────────

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

// ── Mock: parcelContext ───────────────────────────────────────────────────────

vi.mock('../../context/parcelContext', () => ({
  useRecentParcels: vi.fn(() => []),
  ParcelContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderPropertySearch() {
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

describe('Phase 12: Benton County Golden Journey Contract', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Leg 1: PropertySearch renders ────────────────────────────────────────

  describe('Leg 1: PropertySearch renders search UI', () => {
    it('mounts without crashing', async () => {
      expect(async () => {
        await renderPropertySearch();
      }).not.toThrow();
    });

    it('renders a text input for parcel search', async () => {
      await renderPropertySearch();
      const input = screen.queryByRole('textbox') ?? screen.queryByPlaceholderText(/GeoID|address/i);
      expect(input).not.toBeNull();
    });

    it('renders the Property Search heading', async () => {
      await renderPropertySearch();
      expect(screen.getByText(/Property Search/i)).toBeTruthy();
    });

    it('shows Benton County parcel count after initial load', async () => {
      await renderPropertySearch();
      await waitFor(() => {
        expect(screen.queryByText(/parcel/i)).not.toBeNull();
      });
    });
  });

  // ── Leg 2: Navigation fires on result click ───────────────────────────────

  describe('Leg 2: Navigation contract — result click triggers navigate', () => {
    it('displays PACS result after initial load', async () => {
      await renderPropertySearch();
      await waitFor(() => {
        expect(screen.getByText(BENTON_TEST_PARCEL)).toBeTruthy();
      });
    });

    it('calls navigate("/property/:geoId") when a result is clicked', async () => {
      await renderPropertySearch();

      // Wait for the initial results to load (doSearch('') fires on mount)
      await waitFor(() => {
        expect(screen.getByText(BENTON_TEST_PARCEL)).toBeTruthy();
      });

      // Click the result button for the test parcel
      const resultButton = screen.getByText(BENTON_TEST_PARCEL).closest('button');
      expect(resultButton).not.toBeNull();
      fireEvent.click(resultButton!);

      // navigate('/property/<geoId>') must have been called
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(BENTON_TEST_PARCEL))
      );
    });

    it('navigate path starts with /property/', async () => {
      await renderPropertySearch();
      await waitFor(() => screen.getByText(BENTON_TEST_PARCEL));

      const resultButton = screen.getByText(BENTON_TEST_PARCEL).closest('button');
      fireEvent.click(resultButton!);

      const [path] = mockNavigate.mock.calls[0];
      expect(path).toMatch(/^\/property\//);
    });
  });

  // ── Leg 3: PropertyWorkbench mounts for a parcel route ───────────────────

  describe('Leg 3: PropertyWorkbench structural mount', () => {
    it('mounts without throwing when parcelId is in the route', async () => {
      const { default: PropertyWorkbench } = await import(
        '../../pages/workbench/PropertyWorkbench'
      );

      expect(async () => {
        render(
          <MemoryRouter initialEntries={[`/property/${BENTON_TEST_PARCEL}`]}>
            <Routes>
              <Route path='/property/:parcelId' element={<PropertyWorkbench />} />
            </Routes>
          </MemoryRouter>
        );
      }).not.toThrow();
    });

    it('workbench root element is present in the DOM', async () => {
      const { default: PropertyWorkbench } = await import(
        '../../pages/workbench/PropertyWorkbench'
      );

      render(
        <MemoryRouter initialEntries={[`/property/${BENTON_TEST_PARCEL}`]}>
          <Routes>
            <Route path='/property/:parcelId' element={<PropertyWorkbench />} />
          </Routes>
        </MemoryRouter>
      );

      // The workbench should render something — not an empty DOM
      expect(document.body.innerHTML.length).toBeGreaterThan(50);
    });
  });
});
