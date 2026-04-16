import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ParcelLensModule from '../../pages/suites/modules/ParcelLensModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

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
    getParcel: vi.fn().mockResolvedValue({
      parcelId: '104841000002000',
      address: '123 Benton Ave',
      owner: 'Benton Owner',
      zoning: 'R-1',
      acreage: 0.25,
      assessedValue: 450000,
      landUse: 'Residential',
    }),
  },
}));

describe('ParcelLensModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-parcel-001',
      result: {
        output: JSON.stringify({
          narrative: 'This parcel is part of a residual cluster that suggests parcel-level data review before any county calibration.',
          hotspotCount: 1,
          recommendedAction: 'Route parcel repair to Workbench and hold county calibration until parcel facts are verified.',
        }),
      },
    });
  });

  it('renders governed parcel diagnosis after a parcel is selected', async () => {
    render(<ParcelLensModule />);

    fireEvent.click(await screen.findByRole('button', { name: /104841000002000/i }));

    expect(await screen.findByTestId('parcel-lens-governed-brief')).toBeInTheDocument();
  });

  it('analyzes parcel signal and shows routing guidance', async () => {
    render(<ParcelLensModule />);

    fireEvent.click(await screen.findByRole('button', { name: /104841000002000/i }));
    fireEvent.click(await screen.findByRole('button', { name: /analyze parcel signal/i }));

    await waitFor(() => {
      expect(screen.getByText(/parcel-level data review before any county calibration/i)).toBeInTheDocument();
      expect(screen.getByText(/Route parcel repair to Workbench and hold county calibration until parcel facts are verified\./i)).toBeInTheDocument();
      expect(screen.getByText(/corr-parcel-001/i)).toBeInTheDocument();
    });
  });
});
