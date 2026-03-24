import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TraceHome } from '../../pages/TraceHome';

vi.mock('../../components/standalone', () => ({
  StandaloneHomeShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='standalone-shell'>{children}</div>
  ),
}));

vi.mock('../../components/Trace/ActionStreamModule', () => ({
  ActionStreamModule: () => <div data-testid='action-stream-module'>Action Stream Module</div>,
}));

vi.mock('../../components/Trace/PolicyPanel', () => ({
  PolicyPanel: () => <div data-testid='policy-panel'>Policy Panel</div>,
}));

describe('TraceHome telemetry honesty contract', () => {
  it('describes mixed live and polling behavior instead of page-wide real-time observability', async () => {
    const telemetryStore = {
      list: vi.fn().mockResolvedValue([]),
    } as any;

    render(<TraceHome telemetryStore={telemetryStore} />);

    expect(screen.getByTestId('standalone-shell')).toBeInTheDocument();
    expect(screen.getByText('System Telemetry')).toBeInTheDocument();
    expect(
      screen.getByText(/Live action stream with 15-second telemetry refresh and audit trail visualization\./i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('action-stream-module')).toBeInTheDocument();
    expect(screen.queryByText(/Real-time observability and audit trail visualization\./i)).not.toBeInTheDocument();
  });
});