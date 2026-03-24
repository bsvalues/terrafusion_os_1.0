/**
 * PropertyAtlas.honesty.test.tsx
 *
 * Source-disclosure honesty pass for the PropertyAtlas tab.
 *
 * Ensures:
 * 1. Parcel-context cards (address, acreage, tax district, zoning) carry a
 *    WorkbenchSourceBadge disclosing that values were returned from the
 *    property store / PACS.
 * 2. The query-results section carries a source badge when results are shown.
 * 3. Centroid coordinates displayed in the map footer disclose their source.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/* ---- mocks ---- */
const mockActiveParcel = {
  parcelId: 'TEST-001',
  address: '456 Elm St',
  city: 'Kennewick',
  zip: '99336',
  landAcreage: 1.25,
  taxDistrictName: 'Kennewick',
  taxDistrictCode: 'KEN',
  landUseDescription: 'Single Family',
  propertyType: 'Residential',
};

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '456 Elm St', owner: 'Test Owner' },
    workMode: 'assess',
  }),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn(
    (selector: (s: { activeParcel: typeof mockActiveParcel; assessments: never[]; appeals: never[] }) => unknown) =>
      selector
        ? selector({ activeParcel: mockActiveParcel, assessments: [], appeals: [] })
        : null,
  ),
}));

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ DEV: false, PROD: false, MODE: 'test' }),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string } }) => (
    <div data-testid="error-display">{error.message}</div>
  ),
}));

vi.mock('../../hooks/useAtlasGis', () => ({
  useParcelBoundary: () => ({ data: null, loading: false, error: null, source: 'unavailable', refetch: vi.fn() }),
  useParcelLayers: () => ({ data: null, loading: false, error: null, source: 'unavailable', refetch: vi.fn() }),
}));

import { PropertyAtlas } from '../../pages/workbench/tabs/PropertyAtlas';
import * as pilotApi from '../../api/pilotApi';

const mockInvokeTool = pilotApi.invokeTool as ReturnType<typeof vi.fn>;

/* ---- helpers ---- */
function renderAtlas() {
  return render(
    <MemoryRouter>
      <PropertyAtlas />
    </MemoryRouter>,
  );
}

/* ================================================================== */

describe('PropertyAtlas honesty — source disclosure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* --- Parcel context cards --- */
  describe('parcel context cards', () => {
    it('renders a source badge near parcel-context data cards', () => {
      renderAtlas();
      // The parcel-context section must contain a WorkbenchSourceBadge
      const badge = screen.getByTestId('atlas-parcel-context-source');
      expect(badge).toBeInTheDocument();
    });

    it('parcel-context badge says data was returned from the property store', () => {
      renderAtlas();
      const badge = screen.getByTestId('atlas-parcel-context-source');
      expect(badge.textContent).toMatch(/returned from/i);
    });
  });

  /* --- Query results --- */
  describe('query results disclosure', () => {
    it('renders a source badge in the query-results section after a successful query', async () => {
      mockInvokeTool.mockResolvedValueOnce({
        success: true,
        correlationId: 'corr-atlas-001',
        result: {
          output: JSON.stringify({
            parcelId: 'TEST-001',
            layers: [
              { id: 'boundary', name: 'Parcel Boundary', available: true },
            ],
            centroid: { lat: 46.2856, lng: -119.2845 },
            geometryAvailable: false,
          }),
        },
      });

      renderAtlas();

      // Select a layer and click Query
      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));
      fireEvent.click(screen.getByRole('button', { name: /Query Layers/i }));

      await waitFor(() => {
        expect(screen.getByTestId('atlas-results-source')).toBeInTheDocument();
      });
    });

    it('query-results badge discloses data was returned from query_parcel_layers', async () => {
      mockInvokeTool.mockResolvedValueOnce({
        success: true,
        correlationId: 'corr-atlas-002',
        result: {
          output: JSON.stringify({
            parcelId: 'TEST-001',
            layers: [
              { id: 'boundary', name: 'Parcel Boundary', available: true },
            ],
            centroid: { lat: 46.2856, lng: -119.2845 },
            geometryAvailable: false,
          }),
        },
      });

      renderAtlas();

      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));
      fireEvent.click(screen.getByRole('button', { name: /Query Layers/i }));

      await waitFor(() => {
        const badge = screen.getByTestId('atlas-results-source');
        expect(badge.textContent).toMatch(/returned from.*query_parcel_layers/i);
      });
    });
  });

  /* --- Centroid coordinates --- */
  describe('centroid coordinates disclosure', () => {
    it('centroid display includes source disclosure after query', async () => {
      mockInvokeTool.mockResolvedValueOnce({
        success: true,
        correlationId: 'corr-atlas-003',
        result: {
          output: JSON.stringify({
            parcelId: 'TEST-001',
            layers: [
              { id: 'boundary', name: 'Parcel Boundary', available: true },
            ],
            centroid: { lat: 46.2856, lng: -119.2845 },
            geometryAvailable: false,
          }),
        },
      });

      renderAtlas();

      fireEvent.click(screen.getByTestId('layer-toggle-boundary'));
      fireEvent.click(screen.getByRole('button', { name: /Query Layers/i }));

      await waitFor(() => {
        const centroidDisclosure = screen.getByTestId('atlas-centroid-disclosure');
        expect(centroidDisclosure).toBeInTheDocument();
        expect(centroidDisclosure.textContent).toMatch(/preview/i);
      });
    });
  });
});
