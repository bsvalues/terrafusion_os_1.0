import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ParcelLensModule from '../../pages/suites/modules/ParcelLensModule';

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    searchParcels: vi.fn().mockResolvedValue({
      results: [
        {
          parcelId: '104841000002000',
          address: '123 Benton Ave',
          owner: 'Benton Owner',
          zoning: 'R-1',
          acreage: 0.25,
          assessedValue: 450000,
          landUse: 'Residential',
        },
      ],
    }),
    getParcelLensRecord: vi.fn().mockResolvedValue({
      parcelId: '104841000002000',
      address: '123 Benton Ave',
      owner: 'Benton Owner',
      zoning: 'R-1',
      acreage: 0.25,
      legalDescription: 'LOT 7 BENTON HEIGHTS',
      taxCode: 'KEN15',
      pin: '104841000002000',
      apn: '104841000002000',
      landValue: 120000,
      improvementValue: 330000,
      totalValue: 450000,
      assessedValue: 450000,
      landUse: 'Residential',
      source: 'ArcGIS REST API query pattern from bcbs-gis-pro-production',
      queryUrl: 'https://example.test/arcgis/query',
    }),
    getParcelSpatialProfile: vi.fn().mockResolvedValue({
      parcelId: '104841000002000',
      workflow: 'spatial-profile',
      overlayLayers: ['zoning', 'flood-100yr'],
      expectedResults: {
        zoningDistrict: 'Zone code, name, permitted uses',
        floodZone: 'FEMA zone designation, SFHA status',
      },
      source: 'Benton County ArcGIS — full overlay analysis from terra-playground-production',
      steps: [
        {
          step: 1,
          action: 'Fetch parcel geometry',
          url: 'https://example.test/parcel-geometry',
        },
        {
          step: 2,
          action: 'Run spatial intersections',
          overlayCount: 2,
          overlays: [
            {
              layerId: 'zoning',
              layerName: 'Zoning Districts',
              queryUrl: 'https://example.test/zoning',
              fields: ['ZONE_CODE', 'NAME'],
              note: 'Pass parcel geometry as geometry parameter',
            },
          ],
        },
      ],
    }),
  },
}));

describe('ParcelLensModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the live parcel atlas profile after a parcel is selected', async () => {
    render(<ParcelLensModule />);

    fireEvent.click(await screen.findByRole('button', { name: /104841000002000/i }));

    expect(await screen.findByTestId('parcel-lens-governed-brief')).toBeInTheDocument();
  });

  it('shows live routing guidance and spatial profile overlays for the selected parcel', async () => {
    render(<ParcelLensModule />);

    fireEvent.click(await screen.findByRole('button', { name: /104841000002000/i }));

    await waitFor(() => {
      expect(screen.getByText(/This parcel resolves against 2 live Benton overlay layers/i)).toBeInTheDocument();
      expect(screen.getByText(/LOT 7 BENTON HEIGHTS/i)).toBeInTheDocument();
      expect(screen.getByText(/Zoning Districts/i)).toBeInTheDocument();
      expect(screen.getByText(/No fabricated bedrooms, bathrooms, or improvement rows are injected into the record\./i)).toBeInTheDocument();
    });
  });
});
