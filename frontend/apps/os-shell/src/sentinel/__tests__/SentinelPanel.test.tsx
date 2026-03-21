import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SentinelPanel } from '../SentinelPanel';
import { useAgentFeed } from '../useAgentFeed';
import { useSentinel } from '../useSentinel';

vi.mock('../useSentinel', () => ({
  useSentinel: vi.fn(),
}));

vi.mock('../useAgentFeed', () => ({
  useAgentFeed: vi.fn(),
}));

const mockUseSentinel = vi.mocked(useSentinel);
const mockUseAgentFeed = vi.mocked(useAgentFeed);

describe('SentinelPanel', () => {
  it('reports auto-scroll state without claiming the feed is live', () => {
    mockUseSentinel.mockReturnValue({
      status: 'healthy',
      lastPingAt: Date.now(),
      latencyMs: 42,
      apiBase: '/api',
      endpoint: '/api/health',
      buildSha: 'dev-sha',
      env: 'workspace',
      warnings: [],
      intentFilter: null,
      moduleCountTotal: 10,
      moduleCountActive: 8,
      moduleCountFilteredOut: 0,
      systemComponents: { api: true },
    });

    mockUseAgentFeed.mockReturnValue({
      status: {
        executionMode: 'workspace',
        totalAgents: 1008,
        activeAgents: 987,
        queueDepth: 4,
        lastActivityUtc: new Date().toISOString(),
      },
      statusWarnings: [],
      events: [],
      eventsWarnings: [],
      cursor: 0,
      gapDetected: false,
      paused: false,
      autoScroll: true,
      setPaused: vi.fn(),
      setAutoScroll: vi.fn(),
      clearEvents: vi.fn(),
      clearGap: vi.fn(),
    });

    render(<SentinelPanel open={true} onClose={vi.fn()} />);

    // Switch to the NEURAL FEED tab where auto-scroll indicator lives
    fireEvent.click(screen.getByText('NEURAL FEED'));

    expect(screen.getByText('AUTO-SCROLL')).toBeInTheDocument();
    expect(screen.queryByText(/^LIVE$/)).not.toBeInTheDocument();
  });
});