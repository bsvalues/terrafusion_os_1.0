/**
 * useTraceStats.test.tsx
 *
 * Lane J: Tests for global trace-store diagnostics hook.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTraceStats } from '../../hooks/useTraceStats';
import type { PilotTraceStatsResponse } from '../../api/pilotApi';

const mockGetTraceStats = vi.fn<Promise<PilotTraceStatsResponse>, []>();

vi.mock('../../api/pilotApi', async () => ({
  ...await vi.importActual('../../api/pilotApi'),
  getTraceStats: () => mockGetTraceStats(),
}));

describe('useTraceStats', () => {
  beforeEach(() => {
    mockGetTraceStats.mockReset();
  });

  it('maps successful API response to diagnostics fields', async () => {
    mockGetTraceStats.mockResolvedValueOnce({
      totalEvents: 900,
      oldestTimestamp: '2026-01-01T00:00:00.000Z',
      newestTimestamp: '2026-03-03T10:00:00.000Z',
      perParcelCap: 2000,
      cappedParcelsCount: 2,
      maxEventsInParcel: 1500,
    });

    const { result } = renderHook(() => useTraceStats({ enabled: true }));

    await waitFor(() => {
      expect(result.current.diagnostics).not.toBeNull();
    });

    expect(result.current.fetchFailed).toBe(false);
    expect(result.current.lastFetchedAt).not.toBeNull();
    expect(result.current.diagnostics).toEqual({
      perParcelCap: 2000,
      cappedParcelsCount: 2,
      maxEventsInParcel: 1500,
      oldestEventTimestamp: '2026-01-01T00:00:00.000Z',
      newestEventTimestamp: '2026-03-03T10:00:00.000Z',
    });
  });

  it('sets fetchFailed=true and null diagnostics when stats endpoint fails (e.g., 403)', async () => {
    mockGetTraceStats.mockRejectedValueOnce(
      new Error('Failed to get trace stats (403): {"error":"ACCESS_DENIED"}')
    );

    const { result } = renderHook(() => useTraceStats({ enabled: true }));

    await waitFor(() => {
      expect(result.current.fetchFailed).toBe(true);
    });

    expect(result.current.diagnostics).toBeNull();
  });
});

