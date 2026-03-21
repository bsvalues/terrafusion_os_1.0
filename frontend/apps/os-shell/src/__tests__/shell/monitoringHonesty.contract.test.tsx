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
  it('discloses workspace simulation instead of claiming live swarm telemetry', () => {
    render(<Monitoring />);

    expect(
      screen.getByText(/Workspace simulation of swarm telemetry and control patterns, not live county agent telemetry/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AI Swarm Monitoring is displaying sample fixtures, not live county data/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Simulated Performance Metrics/i)).toBeInTheDocument();
    expect(screen.queryByText(/Supreme Commander Claude/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Real-Time Performance Metrics/i)).not.toBeInTheDocument();
  });
});