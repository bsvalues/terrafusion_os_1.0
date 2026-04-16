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
      { id: 'parcels', name: 'Parcels', category: 'base', enabled: true, opacity: 100, source: 'county', features: 89247 },
      { id: 'zoning', name: 'Zoning', category: 'overlay', enabled: true, opacity: 80, source: 'county', features: 89247 },
      { id: 'flood', name: 'Flood Zones', category: 'analysis', enabled: false, opacity: 55, source: 'fema', features: 1240 },
    ]),
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
