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
  usePropertyStore: vi.fn((selector: (s: { appeals: unknown[] }) => unknown) =>
    selector({ appeals: [] })
  ),
}));
vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));
vi.mock('../../components/dais/AppealDeadlinePanel', () => ({
  default: () => <div data-testid="mock-appeal-deadline" />,
}));
vi.mock('../../components/dais/AppealHearingPanel', () => ({
  default: () => <div data-testid="mock-appeal-hearing" />,
}));
vi.mock('../../components/dais/AppealNoticePanel', () => ({
  default: () => <div data-testid="mock-appeal-notice" />,
}));
vi.mock('../../components/dais/AppealCertificationPanel', () => ({
  default: () => <div data-testid="mock-appeal-certification" />,
}));

import { PropertyDais } from '../../pages/workbench/tabs/PropertyDais';

describe('PropertyDais source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge on the Queue Statistics card at idle state', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const badges = screen.getAllByTestId('workbench-source-badge');
    const unavailableBadge = badges.find(b => b.getAttribute('data-source') === 'unavailable');
    expect(unavailableBadge).toBeDefined();
    expect(unavailableBadge).toBeInTheDocument();
  });

  it('does not invoke the queue tool on mount without user action', async () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const { invokeTool } = await import('../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });

  it('does not render a result panel in success state without a tool call', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();
  });
});
