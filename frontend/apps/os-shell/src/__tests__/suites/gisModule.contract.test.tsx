import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GISModule from '../../pages/suites/modules/GISModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    getLayers: vi.fn().mockResolvedValue([
      { id: 'parcels', name: 'Parcels', category: 'base', enabled: true, source: 'Benton County ArcGIS FeatureServer', type: 'geojson', url: 'https://example.test/parcels' },
      { id: 'zoning', name: 'Zoning Districts', category: 'overlay', enabled: true, source: 'Benton County ArcGIS FeatureServer', type: 'geojson', url: 'https://example.test/zoning' },
      { id: 'flood-100yr', name: '100-Year Flood Zone', category: 'analysis', enabled: false, source: 'Benton County ArcGIS FeatureServer', type: 'geojson', url: 'https://example.test/flood' },
    ]),
    getMassAppraisalStats: vi.fn().mockResolvedValue({
      totalParcels: 89247,
      totalAcreage: 0,
      zoningDistrictCount: 0,
      floodZoneCount: 0,
      lastDataUpdate: '2026-04-16T00:00:00Z',
      averageMarketValue: 445000,
      typeBreakdown: [{ type: 'Residential', count: 70000 }],
    }),
    searchMassAppraisalParcels: vi.fn().mockResolvedValue({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'P-100',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-119.22, 46.24],
              [-119.2195, 46.24],
              [-119.2195, 46.2405],
              [-119.22, 46.2405],
              [-119.22, 46.24],
            ]],
          },
          properties: {
            Parcel_ID: 'P-100',
            situs_display: '123 Benton Ave',
            Property_Type: 'Residential',
            neighborhood: '150007',
            zoning: 'R-1',
            Current_Ratio: 0.97,
            TotalMarketValue: 450000,
            Shape__Area: 10890,
          },
        },
      ],
    }),
  },
}));

describe('GISModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-gis-001',
      result: {
        output: JSON.stringify({
          narrative: 'Residual clustering is concentrated in the governed Benton audit area.',
          hotspotCount: 4,
          recommendedAction: 'Route neighborhood review to TerraForge and parcel defects to Workbench.',
        }),
      },
    });
  });

  it('renders governed spatial audit strip', async () => {
    render(<GISModule />);

    expect(await screen.findByTestId('gis-governed-brief')).toBeInTheDocument();
    expect(await screen.findByText(/live benton county parcel geometry and arcgis layer services/i)).toBeInTheDocument();
  });

  it('runs governed anomaly routing from the GIS module surface', async () => {
    render(<GISModule />);

    fireEvent.click(await screen.findByRole('button', { name: /explain spatial anomaly/i }));

    await waitFor(() => {
      expect(screen.getByText(/Residual clustering is concentrated in the governed Benton audit area\./i)).toBeInTheDocument();
      expect(screen.getByText(/Route neighborhood review to TerraForge and parcel defects to Workbench\./i)).toBeInTheDocument();
      expect(screen.getByText(/corr-gis-001/i)).toBeInTheDocument();
    });
  });
});
