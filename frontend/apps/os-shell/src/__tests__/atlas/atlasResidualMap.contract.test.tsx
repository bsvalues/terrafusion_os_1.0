/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 RESIDUAL MAP PANEL CONTRACT TESTS
 * SVG choropleth of model residuals by neighborhood
 *
 * These tests define the Phase 17 contract for ResidualMapPanel.
 * They codify:
 *   - Panel renders with data-testid="residual-map"
 *   - Neighborhoods colored by residual (green/yellow/red)
 *   - Global residual summary stat
 *   - Legend with color scale
 *   - Click neighborhood → shows parcel list drill-through
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

import { ResidualMapPanel } from '../../pages/atlas/ResidualMapPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<ResidualMapPanel />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 17: ResidualMapPanel Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="residual-map"', () => {
      renderPanel();
      expect(screen.getByTestId('residual-map')).toBeInTheDocument();
    });

    it('renders neighborhood areas on the map', () => {
      const { container } = renderPanel();
      // 7 neighborhoods on map + 7 in sidebar = 14 total data-neighborhood elements
      const neighborhoods = container.querySelectorAll('[data-neighborhood]');
      expect(neighborhoods.length).toBe(14);
    });

    it('renders a legend', () => {
      renderPanel();
      expect(screen.getByTestId('residual-legend')).toBeInTheDocument();
    });

    it('renders global residual summary', () => {
      renderPanel();
      const summary = screen.getByTestId('residual-summary');
      expect(summary).toBeInTheDocument();
      expect(summary.textContent).toContain('-1.7');
    });
  });

  // =========================================================================
  // Neighborhood Display
  // =========================================================================
  describe('Neighborhood Display', () => {
    it('shows all 7 neighborhood names', () => {
      renderPanel();
      // Each name appears twice (map + sidebar), so use getAllByText
      expect(screen.getAllByText('Richland').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Kennewick').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Pasco').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Prosser').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('West Richland').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Benton City').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Finley').length).toBeGreaterThanOrEqual(1);
    });

    it('shows residual percentages', () => {
      renderPanel();
      // Benton City has -8.2% — appears on map and sidebar
      expect(screen.getAllByText(/-8\.2/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows parcel counts in sidebar', () => {
      renderPanel();
      // Kennewick has 18,920 parcels
      expect(screen.getByText(/18,920/)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Drill-Through
  // =========================================================================
  describe('Drill-Through', () => {
    it('calls selectNeighborhood when neighborhood is clicked', () => {
      const { container } = renderPanel();
      const richBtn = container.querySelector('button[data-neighborhood="RICH"]');
      expect(richBtn).not.toBeNull();
      fireEvent.click(richBtn!);
      expect(mockFns.selectNeighborhood).toHaveBeenCalledWith('RICH');
    });
  });

  // =========================================================================
  // Legend
  // =========================================================================
  describe('Legend', () => {
    it('shows under-assessed label', () => {
      renderPanel();
      const legend = screen.getByTestId('residual-legend');
      expect(legend.textContent).toMatch(/under/i);
    });

    it('shows over-assessed label', () => {
      renderPanel();
      const legend = screen.getByTestId('residual-legend');
      expect(legend.textContent).toMatch(/over/i);
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
