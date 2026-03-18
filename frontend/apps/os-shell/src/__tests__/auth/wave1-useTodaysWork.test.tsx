/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTodaysWork } from '../../hooks/useTodaysWork';
import { getQueueItems } from '../../services/suites/queueService';

vi.mock('../../services/suites/queueService', () => ({
  getQueueItems: vi.fn(),
}));

const mockedGetQueueItems = vi.mocked(getQueueItems);

describe('Wave 1 — useTodaysWork', () => {
  beforeEach(() => {
    mockedGetQueueItems.mockReset();
  });

  it('promotes to live queue tasks when the Dais queue API succeeds', async () => {
    mockedGetQueueItems.mockResolvedValue([
      {
        id: 'queue-1',
        parcelId: '10-1234-001',
        taskType: 'APPEAL_PREPARATION',
        priority: 'high',
        status: 'queued',
        assignedTo: 'chief-appraiser',
        createdAt: '2026-03-18T12:00:00Z',
      },
    ] as any);

    const { result } = renderHook(() => useTodaysWork());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSampleData).toBe(false);
    expect(result.current.tasks).toEqual([
      {
        id: 'queue-1',
        title: 'Prepare appeal for 10-1234-001',
        subtitle: 'APPEAL PREPARATION — Assigned to chief-appraiser',
        route: 'terradais',
        category: 'suite',
      },
    ]);
  });

  it('falls back to sample tasks when the live queue read fails', async () => {
    mockedGetQueueItems.mockRejectedValue(new Error('queue unavailable'));

    const { result } = renderHook(() => useTodaysWork());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSampleData).toBe(true);
    expect(result.current.tasks).toHaveLength(3);
    expect(result.current.tasks[0].title).toBe('Review 3 appeals');
  });
});
