import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import Monitoring from '../../pages/Monitoring';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='recharts-responsive'>{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
}));

describe('Monitoring honesty contract', () => {
  it('discloses governed telemetry unavailability instead of claiming live swarm telemetry', () => {
    render(<Monitoring />);

    expect(screen.getByTestId('monitoring-governed-unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/No governed county agent telemetry feed is attached to this route/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This legacy monitoring page is retained only as a guardrail\. It does not display live county agent counts, live task throughput, or live health telemetry/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Governed telemetry unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/Supreme Commander Claude/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Real-Time Performance Metrics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sample fixtures/i)).not.toBeInTheDocument();
  });
});
