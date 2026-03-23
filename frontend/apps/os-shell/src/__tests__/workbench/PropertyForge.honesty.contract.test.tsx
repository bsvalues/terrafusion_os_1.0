import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const renderForge = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PropertyForge />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('PropertyForge source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders at least one WorkbenchSourceBadge', () => {
    renderForge();
    const badges = screen.getAllByTestId('workbench-source-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('all badges show unavailable or fallback at idle before any tool invocation', () => {
    renderForge();
    const badges = screen.getAllByTestId('workbench-source-badge');
    for (const badge of badges) {
      const src = badge.getAttribute('data-source');
      expect(['fallback', 'unavailable']).toContain(src);
    }
  });

  it('does not invoke valuation tools on mount without user action', async () => {
    renderForge();
    const { invokeTool } = await import('../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });

  it('does not display hardcoded final indicated values at idle', () => {
    renderForge();
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();
  });
});
