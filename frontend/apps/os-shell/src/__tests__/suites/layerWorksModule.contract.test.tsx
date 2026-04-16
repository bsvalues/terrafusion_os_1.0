import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LayerWorksModule from '../../pages/suites/modules/LayerWorksModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    getLayers: vi.fn().mockResolvedValue([
      { id: 'parcels', name: 'Parcels', category: 'base', enabled: true, opacity: 92, source: 'Benton County ArcGIS FeatureServer', type: 'geojson', url: 'https://example.test/parcels' },
      { id: 'zoning', name: 'Zoning', category: 'overlay', enabled: true, opacity: 70, source: 'Benton County ArcGIS FeatureServer', type: 'geojson', url: 'https://example.test/zoning' },
      { id: 'flood-100yr', name: 'Flood Zones', category: 'analysis', enabled: false, opacity: 70, source: 'Benton County ArcGIS FeatureServer', type: 'geojson', url: 'https://example.test/flood' },
    ]),
    getLayerConfigs: vi.fn().mockResolvedValue({
      count: 2,
      source: 'terra-playground-production arcgis-service.ts',
      baseUrl: 'https://example.test/arcgis',
      layers: [
        {
          Id: 'zoning',
          Name: 'Zoning Districts',
          FeatureServerPath: 'Zoning_Districts/FeatureServer/0',
          serviceUrl: 'https://example.test/zoning',
          queryUrl: 'https://example.test/zoning/query',
          Fields: ['ZONE_CODE', 'ZONE_NAME'],
          GeometryType: 'polygon',
          SpatialCapabilities: ['intersect', 'envelope'],
        },
        {
          Id: 'flood-zones',
          Name: 'Flood Zones',
          FeatureServerPath: 'Flood_Zones/FeatureServer/0',
          serviceUrl: 'https://example.test/flood',
          queryUrl: 'https://example.test/flood/query',
          Fields: ['FLD_ZONE', 'FIRM_PANEL'],
          GeometryType: 'polygon',
          SpatialCapabilities: ['intersect'],
        },
      ],
    }),
    getParcelSpatialProfile: vi.fn().mockResolvedValue({
      parcelId: 'P-100',
      workflow: 'spatial-profile',
      overlayLayers: ['zoning', 'flood-zones'],
      expectedResults: {
        zoningDistrict: 'Zone code, name, permitted uses',
        floodZone: 'FEMA zone designation, SFHA status',
      },
      source: 'Benton County ArcGIS — full overlay analysis from terra-playground-production',
      steps: [
        { step: 1, action: 'Fetch parcel geometry', url: 'https://example.test/parcels/query' },
        {
          step: 2,
          action: 'Run spatial intersections',
          overlayCount: 2,
          overlays: [
            { layerId: 'zoning', layerName: 'Zoning Districts', queryUrl: 'https://example.test/zoning/query', fields: ['ZONE_CODE'], note: 'Pass parcel geometry from step 1 as geometry parameter' },
          ],
        },
      ],
    }),
  },
}));

describe('LayerWorksModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-layer-001',
      result: {
        output: JSON.stringify({
          narrative: 'Boundary mismatches are concentrated in Benton County overlay seams and require GIS verification before valuation action.',
          hotspotCount: 6,
          recommendedAction: 'Route geometry repair to Workbench and only escalate county patterns to TerraForge after GIS verification.',
        }),
      },
    });
  });

  it('renders governed layer audit surface', async () => {
    render(<LayerWorksModule />);

    expect(await screen.findByTestId('layerworks-governed-brief')).toBeInTheDocument();
    expect(await screen.findByText(/live benton arcgis layer composition and overlay workflow assembly/i)).toBeInTheDocument();
  });

  it('runs governed layer anomaly routing', async () => {
    render(<LayerWorksModule />);

    fireEvent.click(await screen.findByRole('button', { name: /explain layer anomaly/i }));

    await waitFor(() => {
      expect(screen.getByText(/Boundary mismatches are concentrated in Benton County overlay seams/i)).toBeInTheDocument();
      expect(screen.getByText(/Route geometry repair to Workbench and only escalate county patterns to TerraForge after GIS verification\./i)).toBeInTheDocument();
      expect(screen.getByText(/corr-layer-001/i)).toBeInTheDocument();
    });
  });
});
