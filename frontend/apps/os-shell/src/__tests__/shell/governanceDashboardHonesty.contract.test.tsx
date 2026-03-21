import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { GovernanceDashboard } from '../../pages/GovernanceDashboard';

const originalFetch = global.fetch;

const summaryPayload = {
  window: '24h',
  countyId: 'benton',
  timestamp: '2026-03-21T18:00:00.000Z',
  invocations: {
    total: 42,
    byRisk: { critical: 1, high: 4, medium: 10, low: 27 },
    byMode: { pilot: 30, muse: 12 },
  },
  accessDenials: {
    total: 3,
    crossCounty: 1,
    userMismatch: 2,
  },
  topTools: [
    { toolId: 'trace.query', count: 12, risk: 'low' },
  ],
};

const highRiskPayload = {
  countyId: 'benton',
  timestamp: '2026-03-21T18:00:00.000Z',
  events: [
    {
      eventId: 'evt-1',
      toolId: 'pilot.publish',
      risk: 'high',
      timestamp: '2026-03-21T17:59:00.000Z',
      userId: 'user-1',
      action: 'publish',
      summary: 'High-risk publish action recorded',
    },
  ],
};

describe('GovernanceDashboard honesty contract', () => {
  beforeEach(() => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/pilot/metrics/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => summaryPayload,
        } as Response);
      }

      if (url.includes('/api/pilot/metrics/high-risk')) {
        return Promise.resolve({
          ok: true,
          json: async () => highRiskPayload,
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }) as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('labels the dashboard as auto-refresh polling instead of real-time metrics', async () => {
    render(<GovernanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/GovernanceLock Dashboard/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Auto-refresh metrics \(30s poll\) • County-scoped • Phase 7.4/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/TerraFusion GovernanceLock • Phase 7.4 • Auto-Refresh Metrics \(30s Poll\)/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Real-time metrics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Real-Time Metrics/i)).not.toBeInTheDocument();
  });
});