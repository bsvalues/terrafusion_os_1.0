/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 SPATIAL DIAGNOSTICS CONTRACT TESTS
 * Moran's I summary, hotspot/coldspot counts, autocorrelation status
 *
 * These tests define the Phase 17 contract for SpatialDiagnosticsPanel.
 * They codify:
 *   - Panel renders with data-testid="spatial-diagnostics"
 *   - Shows Moran's I value, interpretation badge, p-value
 *   - Shows hotspot/coldspot counts
 *   - Shows autocorrelation status
 *   - Shows total parcels
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
        fetchSpatialData: vi.fn(),
        selectNeighborhood: vi.fn(),
        getParcelsByNeighborhood: vi.fn(() => []),
      };
      return selector ? selector(state) : state;
    }),
  };
});

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { SpatialDiagnosticsPanel } from '../../pages/atlas/SpatialDiagnosticsPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<SpatialDiagnosticsPanel />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 17: SpatialDiagnosticsPanel Contract', () => {
  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="spatial-diagnostics"', () => {
      renderPanel();
      expect(screen.getByTestId('spatial-diagnostics')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Moran's I
  // =========================================================================
  describe("Moran's I", () => {
    it('shows Moran\'s I value', () => {
      renderPanel();
      expect(screen.getByText('0.42')).toBeInTheDocument();
    });

    it('shows interpretation badge', () => {
      renderPanel();
      expect(screen.getByText(/clustered/i)).toBeInTheDocument();
    });

    it('shows p-value', () => {
      renderPanel();
      expect(screen.getByText('0.001')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Hotspot / Coldspot
  // =========================================================================
  describe('Hotspot / Coldspot', () => {
    it('shows hotspot count', () => {
      renderPanel();
      const hotspot = screen.getByTestId('hotspot-count');
      expect(hotspot).toBeInTheDocument();
      expect(hotspot.textContent).toContain('3');
    });

    it('shows coldspot count', () => {
      renderPanel();
      const coldspot = screen.getByTestId('coldspot-count');
      expect(coldspot).toBeInTheDocument();
      expect(coldspot.textContent).toContain('2');
    });
  });

  // =========================================================================
  // Autocorrelation Status
  // =========================================================================
  describe('Autocorrelation Status', () => {
    it('shows spatially autocorrelated status', () => {
      renderPanel();
      expect(screen.getByText(/autocorrelated/i)).toBeInTheDocument();
    });

    it('shows total parcels', () => {
      renderPanel();
      expect(screen.getByText(/64,620/)).toBeInTheDocument();
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
