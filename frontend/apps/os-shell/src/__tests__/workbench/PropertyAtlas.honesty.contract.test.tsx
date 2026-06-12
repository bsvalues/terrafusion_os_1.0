/**
 * PropertyAtlas.honesty.contract.test.tsx
 *
 * Round A source honesty contract — ensures WorkbenchSourceBadge and
 * geometry disclosure are present at idle state, and that no hardcoded
 * layer data is rendered before query_parcel_layers is invoked.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '123 Test St', owner: 'Test Owner' },
    workMode: 'assess',
  }),
}));
vi.mock('../../api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('@/api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (s: { activeParcel: null; assessments: never[]; appeals: never[] }) => unknown) =>
    selector ? selector({ activeParcel: null, assessments: [], appeals: [] }) : null
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

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    getLayers: vi.fn(async () => []),
    getLayerConfigs: vi.fn(async () => ({
      count: 0,
      source: 'test',
      baseUrl: '/api/atlas',
      layers: [],
    })),
    getParcelSpatialProfile: vi.fn(async (parcelId: string) => ({
      parcelId,
      workflow: 'live parcel overlay workflow',
      source: 'test atlas service',
      overlayLayers: [],
      expectedResults: { overlays: 'live overlay workflow' },
      steps: [
        {
          step: 1,
          action: 'Load parcel boundary and live overlay intersections',
        },
      ],
    })),
  },
}));

import { PropertyAtlas } from '../../pages/workbench/tabs/PropertyAtlas';

describe('PropertyAtlas source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge at idle state showing unavailable', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    const badges = screen.getAllByTestId('workbench-source-badge');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((badge) => badge.getAttribute('data-source') === 'unavailable')).toBe(true);
  });

  it('does not reserve full GIS geometry outside Workbench', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    expect(screen.getByTestId('atlas-geometry-disclosure')).toHaveTextContent(/live atlas gis/i);
    expect(screen.queryByText(/full gis geometry rendering is reserved/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not exposed on this route yet/i)).not.toBeInTheDocument();
  });

  it('hosts the live LayerWorks parcel workflow for the active Workbench parcel', async () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    expect(screen.getByTestId('workbench-atlas-layerworks')).toBeInTheDocument();
    expect(await screen.findByTestId('layerworks-parcel-spatial-profile')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('TEST-001')).toBeInTheDocument();
  });

  it('does not display hardcoded layer data at idle without disclosure', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();
    // No hardcoded flood zone values at idle
    expect(screen.queryByText(/Zone AE/i)).not.toBeInTheDocument();
    // No hardcoded aerial resolution values at idle
    expect(screen.queryByText(/0\.3m resolution/i)).not.toBeInTheDocument();
  });

  it('does not invoke query_parcel_layers on mount', async () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    const { invokeTool } = await import('../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });
});
