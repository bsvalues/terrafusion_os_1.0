import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TerraExportModule from '../../pages/suites/modules/TerraExportModule';

const mockGetLiveExportLayers = vi.fn();
const mockExportAtlasLayer = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:atlas-export');

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    getLiveExportLayers: (...args: unknown[]) => mockGetLiveExportLayers(...args),
    exportAtlasLayer: (...args: unknown[]) => mockExportAtlasLayer(...args),
  },
}));

describe('TerraExportModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: vi.fn(),
      }),
    );
    mockGetLiveExportLayers.mockResolvedValue([
      {
        id: 'parcels',
        name: 'Parcel Boundaries',
        serviceUrl: 'https://example.test/FeatureServer/0',
        queryUrl: 'https://example.test/FeatureServer/0/query?where=1%3D1&f=geojson',
        fields: ['PARCEL_ID', 'SITE_ADDR', 'ASSESSED_VAL'],
        geometryType: 'esriGeometryPolygon',
        featureCount: 89247,
        source: 'Benton County ArcGIS layer configs',
      },
    ]);

    mockExportAtlasLayer.mockResolvedValue({
      filename: 'parcel-boundaries.geojson',
      format: 'geojson',
      featureCount: 89247,
      source: 'Benton County ArcGIS layer configs',
      blob: new Blob(['{"type":"FeatureCollection","features":[]}'], { type: 'application/geo+json' }),
    });
  });

  it('renders live export posture surface', async () => {
    render(<TerraExportModule />);

    expect(screen.getByTestId('terraexport-governed-brief')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Selected layer:\s*Parcel Boundaries/i)).toBeInTheDocument();
      expect(screen.getByText(/89,247 features/i)).toBeInTheDocument();
    });
  });

  it('generates a live Atlas export artifact and records it in history', async () => {
    render(<TerraExportModule />);

    await waitFor(() => {
      expect(screen.getByText(/Ready to export\s+Parcel Boundaries/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Live Export/i }));

    await waitFor(() => {
      expect(screen.getByText(/Live export ready/i)).toBeInTheDocument();
      expect(screen.getAllByText(/parcel-boundaries\.geojson/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/89,247 features/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('link', { name: /Download parcel-boundaries\.geojson/i })).toBeInTheDocument();
    });
  });
});
