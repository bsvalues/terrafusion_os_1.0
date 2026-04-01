/**
 * PropertyAtlas.test.tsx
 *
 * Phase 5.3: Property Atlas Tab - GIS/Mapping MWUX Slice
 * Tests: map view → layer selection → query_parcel_layers tool → correlationId UX
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import PropertyAtlas from '../../pages/workbench/tabs/PropertyAtlas';

// Mock the pilotApi module
vi.mock('../../api/pilotApi');

// Mock the useAtlasGis hooks — default to 'unavailable' so existing tests pass unchanged
const mockUseParcelBoundary = vi.fn().mockReturnValue({
  data: null, loading: false, error: null, source: 'unavailable', refetch: vi.fn(),
});
const mockUseParcelLayers = vi.fn().mockReturnValue({
  data: null, loading: false, error: null, source: 'unavailable', refetch: vi.fn(),
});
vi.mock('../../hooks/useAtlasGis', () => ({
  useParcelBoundary: (...args: unknown[]) => mockUseParcelBoundary(...args),
  useParcelLayers: (...args: unknown[]) => mockUseParcelLayers(...args),
}));

const mockInvokeTool = pilotApi.invokeTool as vi.MockedFunction<typeof pilotApi.invokeTool>;

// Test wrapper providing parcel context via outlet
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/atlas`]}>
      <Routes>
        <Route
          path='/property/:parcelId'
          element={
            <div>
              <Outlet context={{ parcelId }} />
            </div>
          }
        >
          <Route path='atlas' element={<PropertyAtlas />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('PropertyAtlas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-atlas-tab')).toBeInTheDocument();
      expect(screen.getByText(/TerraAtlas/i)).toBeInTheDocument();
      // ParcelId may appear in multiple places
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('displays available map layers', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Should show layer toggle options - use getAllByText for items that may appear multiple times
      expect(screen.getAllByText(/Parcel Boundary/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Zoning/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Flood/i).length).toBeGreaterThan(0);
    });

    it('displays map placeholder area', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Should have a map container
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Layer Selection', () => {
    it('toggles layer visibility on click', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Find and click a layer toggle
      const zoningLayer = screen.getByTestId('layer-toggle-zoning');

      // Initially off (or check aria-pressed)
      expect(zoningLayer).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(zoningLayer);

      await waitFor(() => {
        expect(zoningLayer).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('enables query button when at least one layer is selected', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Query button starts disabled when no layers selected
      const queryBtn = screen.getByRole('button', { name: /query layers/i });
      expect(queryBtn).toBeDisabled();

      // Select a layer
      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));

      await waitFor(() => {
        expect(queryBtn).not.toBeDisabled();
      });
    });
  });

  describe('Query Tool Invocation', () => {
    it('invokes query_parcel_layers tool successfully', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-atlas-abc123',
        result: {
          toolId: 'query_parcel_layers',
          output: JSON.stringify({
            parcelId: '12345-001',
            layers: [
              { id: 'boundary', name: 'Parcel Boundary', available: true },
              { id: 'zoning', name: 'Zoning Districts', available: true },
            ],
            geometryAvailable: false,
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      // Select layers
      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));
      fireEvent.click(screen.getByTestId('layer-toggle-zoning'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /query layers/i })).not.toBeDisabled();
      });

      // Click query
      fireEvent.click(screen.getByRole('button', { name: /query layers/i }));

      // Verify tool invoked with correct params
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'query_parcel_layers',
          params: expect.objectContaining({
            parcelId: '12345-001',
            layers: expect.arrayContaining(['boundary', 'zoning']),
          }),
          parcelId: '12345-001',
        });
      });

      // Verify success display
      await waitFor(() => {
        expect(screen.getAllByText(/Parcel Boundary/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Zoning Districts/i)).toBeInTheDocument();
        expect(screen.getByText(/Not exposed on this route yet/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Atlas layer availability is confirmed here, but the boundary and centroid shown are preview sketches/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Atlas layer availability is confirmed for this parcel, but the boundary and centroid shown on this route are preview sketches/i)
        ).toBeInTheDocument();
        expect(screen.queryByText(/Live Atlas layer truth is available/i)).not.toBeInTheDocument();
        // Truncated display shows first 16 chars
        expect(screen.getAllByText(/corr-atlas-abc/).length).toBeGreaterThan(0);
      });
    });

    it('surfaces tool error with correlationId', async () => {
      const mockError = {
        success: false,
        correlationId: 'corr-atlas-error-789',
        error: {
          code: 'GIS_SERVICE_UNAVAILABLE',
          message: 'GIS service temporarily unavailable',
          severity: 'high' as const,
        },
      };

      mockInvokeTool.mockResolvedValue(mockError);

      render(<TestWrapper parcelId='12345-001' />);

      // Select layer and query
      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /query layers/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /query layers/i }));

      // Verify error display with correlationId
      await waitFor(() => {
        expect(screen.getByText(/GIS service temporarily unavailable/i)).toBeInTheDocument();
        // Truncated display shows first portion
        expect(screen.getAllByText(/corr-atlas-error/).length).toBeGreaterThan(0);
      });
    });

    it('handles network errors gracefully', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /query layers/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /query layers/i }));

      // Should show error with client-generated correlationId
      await waitFor(() => {
        expect(screen.getByText(/network error|failed to fetch/i)).toBeInTheDocument();
        // Should have a net-* correlationId
        const correlationTexts = screen.getAllByText(/net-/);
        expect(correlationTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during query', async () => {
      // Create a delayed response
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading-test',
                  result: { toolId: 'query_parcel_layers', output: '{}' },
                }),
              100
            )
          )
      );

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /query layers/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /query layers/i }));

      // Should show loading state
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Query History', () => {
    it('tracks layer query history', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-history-test-atlas',
        result: { toolId: 'query_parcel_layers', output: '{"layers":{}}' },
      });

      render(<TestWrapper parcelId='12345-001' />);

      // First query
      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));
      await waitFor(() => screen.getByRole('button', { name: /query layers/i }));
      fireEvent.click(screen.getByRole('button', { name: /query layers/i }));

      // Wait for success - correlationId may appear truncated
      await waitFor(() => {
        expect(screen.getAllByText(/corr-history-tes/).length).toBeGreaterThan(0);
      });

      // Verify history section exists with entry
      expect(screen.getByText(/Query History/i)).toBeInTheDocument();
      expect(screen.getAllByText(/query_parcel_layers/i).length).toBeGreaterThan(0);

      // Verify there's a copy button in history
      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Phase 0A — GIS Source Behavior
  // ---------------------------------------------------------------------------
  describe('GIS Source Behavior', () => {
    /**
     * WhenLiveSourceAvailable_RendersMapCanvas
     *
     * When the GIS hook returns source:'live' with a centroid, the map area
     * MUST render a canvas element identified by data-testid="atlas-map-canvas".
     *
     * FAILS until Phase 0B wires Leaflet (atlas-map-canvas not yet added).
     * This test exists so Phase 0B has a failing target to drive toward.
     */
    it('WhenLiveSourceAvailable_RendersMapCanvas: renders map canvas for live source', () => {
      mockUseParcelBoundary.mockReturnValue({
        data: {
          parcelId: '12345-001',
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-119.498, 46.233] },
          centroid: { lat: 46.233, lng: -119.498, derivedFrom: 'geometry' },
        },
        loading: false,
        error: null,
        source: 'live',
        refetch: vi.fn(),
      });

      render(<TestWrapper parcelId='12345-001' />);

      // atlas-map-canvas: added in Phase 0B when Leaflet is wired
      expect(screen.getByTestId('atlas-map-canvas')).toBeInTheDocument();
    });

    /**
     * WhenLiveSourceUnavailable_ShowsUnavailableState
     *
     * When GIS source is 'unavailable', the map MUST show the unavailable
     * state indicator and MUST NOT show the map canvas.
     *
     * PASSES now — regression guard: Phase 0B must not break this.
     */
    it('WhenLiveSourceUnavailable_ShowsUnavailableState: shows unavailable indicator, no map canvas', () => {
      mockUseParcelBoundary.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        source: 'unavailable',
        refetch: vi.fn(),
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('atlas-boundary-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('atlas-map-canvas')).not.toBeInTheDocument();
    });
  });
});
