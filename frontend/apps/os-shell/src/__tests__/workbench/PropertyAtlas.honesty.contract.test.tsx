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

import { PropertyAtlas } from '../../pages/workbench/tabs/PropertyAtlas';

describe('PropertyAtlas source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge at idle state showing unavailable', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('discloses that full GIS geometry is not available on this route', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    expect(screen.getByTestId('atlas-geometry-disclosure')).toBeInTheDocument();
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
