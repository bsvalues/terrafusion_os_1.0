import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TerraPrintModule from '../../pages/suites/modules/TerraPrintModule';

const mockGetLiveExportLayers = vi.fn();
const mockGetParcelLensRecord = vi.fn();
const mockGetParcelSpatialProfile = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:atlas-print-packet');

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    getLiveExportLayers: (...args: unknown[]) => mockGetLiveExportLayers(...args),
    getParcelLensRecord: (...args: unknown[]) => mockGetParcelLensRecord(...args),
    getParcelSpatialProfile: (...args: unknown[]) => mockGetParcelSpatialProfile(...args),
  },
}));

describe('TerraPrintModule contract', () => {
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

    mockGetParcelLensRecord.mockResolvedValue({
      parcelId: '104841000002000',
      address: '123 Main St',
      owner: 'Benton County Test Owner',
      acreage: 1.25,
      zoning: 'R-1',
      landUse: 'Residential',
      assessedValue: 425000,
      source: 'Benton County ArcGIS parcel query',
      queryUrl: 'https://example.test/FeatureServer/0/query?where=PARCEL_ID%3D104841000002000',
    });

    mockGetParcelSpatialProfile.mockResolvedValue({
      parcelId: '104841000002000',
      workflow: 'Parcel spatial audit',
      steps: [
        {
          title: 'Inspect boundary',
          description: 'Verify the parcel edge against the authoritative layer.',
        },
      ],
      overlayLayers: ['Parcel Boundaries'],
      expectedResults: {
        geometry: 'Boundary aligns with live Benton parcel geometry.',
      },
      source: 'Atlas spatial profile',
    });
  });

  it('renders governed print audit surface', async () => {
    render(<TerraPrintModule />);

    expect(await screen.findByTestId('terraprint-governed-brief')).toBeInTheDocument();
    expect(await screen.findByText(/Selected layer:\s*Parcel Boundaries/i)).toBeInTheDocument();
  });

  it('builds a live print packet and records a downloadable artifact', async () => {
    render(<TerraPrintModule />);

    await screen.findByText(/Ready to print Parcel Boundaries/i);

    fireEvent.change(screen.getByPlaceholderText(/104841000002000/i), {
      target: { value: '104841000002000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Live Print Packet/i }));

    await waitFor(() => {
      expect(screen.getByText(/Live print packet ready/i)).toBeInTheDocument();
      expect(screen.getAllByText(/field-inspection-card-104841000002000-benton-county\.html/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Target:\s*Parcel 104841000002000/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Download field-inspection-card-104841000002000-benton-county\.html/i })).toBeInTheDocument();
    });
  });
});
