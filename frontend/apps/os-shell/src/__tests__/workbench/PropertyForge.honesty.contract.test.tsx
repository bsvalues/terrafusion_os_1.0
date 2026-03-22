import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '123 Test St', owner: 'Test Owner' },
  }),
}));
vi.mock('../../api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector) =>
    selector ? selector({ activeParcel: null, assessments: [], appeals: [] }) : null,
  ),
}));
vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));

import { PropertyForge } from '../../pages/workbench/tabs/PropertyForge';

describe('PropertyForge source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders at least one WorkbenchSourceBadge', () => {
    render(
      <MemoryRouter>
        <PropertyForge />
      </MemoryRouter>,
    );
    const badges = screen.getAllByTestId('workbench-source-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('all badges show unavailable at idle before any tool invocation', () => {
    render(
      <MemoryRouter>
        <PropertyForge />
      </MemoryRouter>,
    );
    const badges = screen.getAllByTestId('workbench-source-badge');
    for (const badge of badges) {
      expect(badge).toHaveAttribute('data-source', 'unavailable');
    }
  });

  it('does not invoke valuation tools on mount without user action', async () => {
    render(
      <MemoryRouter>
        <PropertyForge />
      </MemoryRouter>,
    );
    const { invokeTool } = await import('../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });

  it('does not display hardcoded final indicated values at idle', () => {
    render(
      <MemoryRouter>
        <PropertyForge />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();
  });
});
