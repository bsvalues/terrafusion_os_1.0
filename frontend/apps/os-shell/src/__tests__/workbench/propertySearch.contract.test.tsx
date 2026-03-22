/**
 * propertySearch.contract.test.tsx
 *
 * Phase 31-B: PropertySearch depth — 6 contract tests
 *
 * Covers: loading, empty, error, results, navigation, button/loading guard
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/pacsService', () => ({ getPacsProperties: vi.fn() }));

vi.mock('../../context/parcelContext', () => ({
  useRecentParcels: () => [],
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { getPacsProperties } from '../../services/pacsService';
import PropertySearch from '../../pages/PropertySearch';

const mockGetPacsProperties = getPacsProperties as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePageResult(items: { geoId: string; address: string }[]) {
  return {
    items: items.map((i) => ({
      geoId: i.geoId,
      address: i.address,
      assessedValue: 100000,
      marketValue: 120000,
      propertyType: 'Residential',
    })),
    totalCount: items.length,
  };
}

function renderSearch() {
  return render(
    <MemoryRouter>
      <PropertySearch />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PropertySearch contract (Phase 31-B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1 -----------------------------------------------------------------------
  it('renders the search input', async () => {
    mockGetPacsProperties.mockResolvedValueOnce(makePageResult([]));
    renderSearch();
    expect(screen.getByPlaceholderText(/search by geoid or address/i)).toBeInTheDocument();
  });

  // 2 -----------------------------------------------------------------------
  it('shows a loading indicator while the search is in-flight', async () => {
    // Never resolves during this test
    mockGetPacsProperties.mockReturnValue(new Promise(() => {}));
    renderSearch();

    // At least one of these must appear while loading
    await waitFor(() => {
      const byTestId = document.querySelector('[data-testid="search-loading"]');
      const byRole = document.querySelector('[role="status"]');
      const ariaBusy = document.querySelector('[aria-busy="true"]');
      expect(byTestId ?? byRole ?? ariaBusy).not.toBeNull();
    });
  });

  // 3 -----------------------------------------------------------------------
  it('shows empty state when search returns zero results', async () => {
    mockGetPacsProperties.mockResolvedValue(makePageResult([]));
    renderSearch();
    await screen.findByTestId('search-empty-state');
  });

  // 4 -----------------------------------------------------------------------
  it('shows error state when search throws', async () => {
    mockGetPacsProperties.mockRejectedValue(new Error('Search failed'));
    renderSearch();

    const errorEl = await screen.findByTestId('search-error-state');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.textContent).toMatch(/failed|error/i);
  });

  // 5 -----------------------------------------------------------------------
  it('renders result items when search returns results', async () => {
    mockGetPacsProperties.mockResolvedValue(
      makePageResult([{ geoId: 'GEO-001', address: '123 Main St' }]),
    );
    renderSearch();

    await screen.findByText('123 Main St');
    expect(screen.getByText('GEO-001')).toBeInTheDocument();
  });

  // 6 -----------------------------------------------------------------------
  it('navigates to /property/:parcelId when a result is clicked', async () => {
    mockGetPacsProperties.mockResolvedValue(
      makePageResult([{ geoId: 'GEO-002', address: '456 Oak Ave' }]),
    );
    renderSearch();

    await screen.findByText('456 Oak Ave');

    const resultItem = screen.getByTestId('search-result-GEO-002');
    await userEvent.click(resultItem);

    expect(mockNavigate).toHaveBeenCalledWith(`/property/${encodeURIComponent('GEO-002')}`);
  });
});
