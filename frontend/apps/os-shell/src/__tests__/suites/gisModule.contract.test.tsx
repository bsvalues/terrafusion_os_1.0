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
      { id: 'parcels', name: 'Parcels', category: 'base', enabled: true, source: 'county', features: 89247 },
      { id: 'flood', name: 'Flood Zones', category: 'analysis', enabled: false, source: 'fema', features: 1240 },
    ]),
    searchParcels: vi.fn().mockResolvedValue({
      results: [
        {
          parcelId: 'P-100',
          address: '123 Benton Ave',
          owner: 'Benton County',
          zoning: 'R-1',
          acreage: 0.25,
          assessedValue: 450000,
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
