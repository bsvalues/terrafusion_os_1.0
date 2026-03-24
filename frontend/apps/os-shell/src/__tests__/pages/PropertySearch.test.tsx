/**
 * Phase 31 — PropertySearch Contract Tests
 *
 * Proves the six behavioral contracts of the PropertySearch surface:
 *   1. Root testid is stable on mount
 *   2. Loading spinner renders during initial fetch
 *   3. Results render after successful fetch
 *   4. Empty state renders when no parcels match
 *   5. Recent parcels strip renders when available (no active query)
 *   6. Clicking a result navigates to /property/:geoId
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { PacsPropertySummary, PacsPropertiesPage } from '../../services/pacsService';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockGetPacsProperties = vi.fn();
vi.mock('../../services/pacsService', () => ({
  getPacsProperties: (...args: unknown[]) => mockGetPacsProperties(...args),
}));

let mockRecentParcels: string[] = [];
vi.mock('../../context/parcelContext', () => ({
  useRecentParcels: () => mockRecentParcels,
}));

import PropertySearch from '../../pages/PropertySearch';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePage(items: PacsPropertySummary[], totalCount = items.length): PacsPropertiesPage {
  return { items, page: 1, pageSize: 20, totalCount };
}

function makeParcel(geoId: string, address = '123 Main St'): PacsPropertySummary {
  return { propId: 1, geoId, address, assessedValue: 250000, marketValue: 300000, propertyType: 'R' };
}

function renderSearch() {
  return render(
    <MemoryRouter>
      <PropertySearch />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PropertySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentParcels = [];
    // Default: resolve immediately with empty results
    mockGetPacsProperties.mockResolvedValue(makePage([]));
  });

  it('renders the property-search-root testid on mount', async () => {
    renderSearch();
    expect(screen.getByTestId('property-search-root')).toBeInTheDocument();
  });

  it('shows loading spinner while initial fetch is in progress', () => {
    // Never resolve — keeps the loading state visible
    mockGetPacsProperties.mockReturnValue(new Promise(() => {}));
    renderSearch();
    // Loader2 is an SVG icon rendered inside the search bar during load
    // The component uses loading state to conditionally render the Loader2 icon
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders result buttons after a successful fetch', async () => {
    mockGetPacsProperties.mockResolvedValue(
      makePage([makeParcel('12345-0010'), makeParcel('99887-0020', '456 Oak Ave')])
    );

    renderSearch();

    await waitFor(() => {
      expect(screen.getByText('12345-0010')).toBeInTheDocument();
      expect(screen.getByText('99887-0020')).toBeInTheDocument();
    });
  });

  it('shows the empty-state message when no parcels match', async () => {
    mockGetPacsProperties.mockResolvedValue(makePage([]));

    renderSearch();

    await waitFor(() => {
      expect(screen.getByText(/No parcels found/i)).toBeInTheDocument();
    });
  });

  it('shows recently viewed parcels when available and query is empty', async () => {
    mockRecentParcels = ['11111-0001', '22222-0002'];
    mockGetPacsProperties.mockResolvedValue(makePage([]));

    renderSearch();

    // Recent parcels section heading
    await waitFor(() => {
      expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
      expect(screen.getByText('11111-0001')).toBeInTheDocument();
      expect(screen.getByText('22222-0002')).toBeInTheDocument();
    });
  });

  it('navigates to /property/:geoId when a result is clicked', async () => {
    const geoId = '98765-0001';
    mockGetPacsProperties.mockResolvedValue(makePage([makeParcel(geoId)]));

    renderSearch();

    const button = await screen.findByText(geoId);
    await userEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(`/property/${encodeURIComponent(geoId)}`);
  });
});
