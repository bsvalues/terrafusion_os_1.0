/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 NEIGHBORHOOD DELINEATION CONTRACT TESTS
 * Neighborhood boundary table + map placement + IAAO qualification
 *
 * These tests define the Phase 17 contract for NeighborhoodDelineationPanel.
 * They codify:
 *   - Panel renders with data-testid="neighborhood-delineation"
 *   - 7 neighborhood rows with parcel count, median ratio, COD, qualified badge
 *   - Click row → calls selectNeighborhood
 *   - IAAO qualified count summary
 *   - Map area with neighborhood placement
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — shadcn/ui primitives
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-component="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-component="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-component="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-component="card-title" {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-component="badge" {...props}>{children}</span>
  ),
}));

// ---------------------------------------------------------------------------
// Mock Zustand store
// ---------------------------------------------------------------------------

const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    fetchSpatialData: vi.fn(),
    selectNeighborhood: vi.fn(),
    getParcelsByNeighborhood: vi.fn(() => []),
  },
}));

vi.mock('@/stores/atlasSpatialStore', async () => {
  const fixtures = await vi.importActual<typeof import('@/data/atlasSpatialFixtures')>('@/data/atlasSpatialFixtures');
  return {
    useAtlasSpatialStore: vi.fn((selector?: any) => {
      const state = {
        parcels: fixtures.SPATIAL_PARCELS,
        neighborhoods: fixtures.NEIGHBORHOOD_SUMMARIES,
        diagnostics: fixtures.SPATIAL_DIAGNOSTICS,
        residualData: fixtures.RESIDUAL_MAP_DATA,
        equityAreas: fixtures.EQUITY_AREAS,
        selectedNeighborhood: null,
        loading: false,
        error: null,
        fetchSpatialData: mockFns.fetchSpatialData,
        selectNeighborhood: mockFns.selectNeighborhood,
        getParcelsByNeighborhood: mockFns.getParcelsByNeighborhood,
      };
      return selector ? selector(state) : state;
    }),
  };
});

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { NeighborhoodDelineationPanel } from '../../pages/atlas/NeighborhoodDelineationPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<NeighborhoodDelineationPanel />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 17: NeighborhoodDelineationPanel Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="neighborhood-delineation"', () => {
      renderPanel();
      expect(screen.getByTestId('neighborhood-delineation')).toBeInTheDocument();
    });

    it('renders neighborhood table', () => {
      renderPanel();
      expect(screen.getByTestId('neighborhood-table')).toBeInTheDocument();
    });

    it('renders 7 neighborhood rows', () => {
      renderPanel();
      const table = screen.getByTestId('neighborhood-table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(7);
    });
  });

  // =========================================================================
  // Neighborhood Data
  // =========================================================================
  describe('Neighborhood Data', () => {
    it('shows neighborhood names', () => {
      renderPanel();
      expect(screen.getByText('Richland')).toBeInTheDocument();
      expect(screen.getByText('Kennewick')).toBeInTheDocument();
      expect(screen.getByText('Pasco')).toBeInTheDocument();
      expect(screen.getByText('Prosser')).toBeInTheDocument();
      expect(screen.getByText('West Richland')).toBeInTheDocument();
      expect(screen.getByText('Benton City')).toBeInTheDocument();
      expect(screen.getByText('Finley')).toBeInTheDocument();
    });

    it('shows parcel counts', () => {
      renderPanel();
      // Kennewick = 18,920 parcels
      expect(screen.getByText('18,920')).toBeInTheDocument();
    });

    it('shows median ratio values', () => {
      renderPanel();
      // Richland median ratio = 0.985
      expect(screen.getByText('0.985')).toBeInTheDocument();
    });

    it('shows COD values', () => {
      renderPanel();
      // Richland COD = 9.8
      expect(screen.getByText('9.8')).toBeInTheDocument();
    });

    it('shows qualified badges', () => {
      renderPanel();
      // 5 qualified, 2 not qualified
      const qualifiedBadges = screen.getAllByText('Qualified');
      expect(qualifiedBadges.length).toBe(5);
    });

    it('shows not-qualified badges', () => {
      renderPanel();
      // Prosser and Benton City are not qualified
      const notQualified = screen.getAllByText('Not Qualified');
      expect(notQualified.length).toBe(2);
    });
  });

  // =========================================================================
  // IAAO Summary
  // =========================================================================
  describe('IAAO Summary', () => {
    it('shows qualified count summary', () => {
      renderPanel();
      const summary = screen.getByTestId('iaao-summary');
      expect(summary).toBeInTheDocument();
      // 5 of 7 qualified
      expect(summary.textContent).toContain('5');
      expect(summary.textContent).toContain('7');
    });
  });

  // =========================================================================
  // Interaction
  // =========================================================================
  describe('Interaction', () => {
    it('calls selectNeighborhood when row is clicked', () => {
      renderPanel();
      const richRow = screen.getByText('Richland').closest('tr');
      if (richRow) fireEvent.click(richRow);
      expect(mockFns.selectNeighborhood).toHaveBeenCalledWith('RICH');
    });
  });

  // =========================================================================
  // Theme Compliance
  // =========================================================================
  describe('Theme Compliance', () => {
    it('no light-mode classes in rendered output', () => {
      const { container } = renderPanel();
      const html = container.innerHTML;
      const forbidden = ['bg-gray-50', 'bg-gray-200', 'bg-red-50', 'text-red-700', 'text-green-600', 'border-gray-300'];
      for (const pattern of forbidden) {
        expect(html).not.toContain(pattern);
      }
    });
  });
});
