/**
 * usePilotTraceList.test.tsx
 *
 * Lane A: Tests for the parcel-scoped trace list hook.
 *
 * Verifies:
 *   - idle when no parcelId
 *   - loading → ready on initial fetch
 *   - incremental poll merges + dedupes
 *   - error state on fetch failure
 *   - refresh resets and re-fetches
 *   - newest-first ordering maintained
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePilotTraceList } from '../../hooks/usePilotTraceList';
import type { PilotTraceEvent, PilotTraceListResponse } from '../../api/pilotApi';

// ============================================================================
// Mock the API
// ============================================================================

const mockListPilotTraces = vi.fn<Promise<PilotTraceListResponse>, [unknown]>();

vi.mock('../../api/pilotApi', async () => ({
  ...await vi.importActual('../../api/pilotApi'),
  listPilotTraces: (...args: unknown[]) => mockListPilotTraces(args[0]),
}));

// ============================================================================
// Helpers
// ============================================================================

function makeEvent(overrides: Partial<PilotTraceEvent> & { eventId: string; timestamp: string }): PilotTraceEvent {
  return {
    type: 'tool_invoked',
    toolId: 'test-tool',
    correlationId: 'corr-1',
    summary: 'test',
    context: { countyId: 'benton', userId: 'u-1', mode: 'pilot' as const },
    ...overrides,
  };
}

const evt1: PilotTraceEvent = makeEvent({ eventId: 'e1', timestamp: '2026-03-01T10:00:00.000Z', correlationId: 'c1' });
const evt2: PilotTraceEvent = makeEvent({ eventId: 'e2', timestamp: '2026-03-01T11:00:00.000Z', correlationId: 'c2' });
const evt3: PilotTraceEvent = makeEvent({ eventId: 'e3', timestamp: '2026-03-01T12:00:00.000Z', correlationId: 'c3' });

// ============================================================================
// Tests
// ============================================================================

describe('usePilotTraceList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockListPilotTraces.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays idle when parcelId is null', () => {
    const { result } = renderHook(() =>
      usePilotTraceList({ parcelId: null, pollMs: 0 }),
    );
    expect(result.current.phase).toBe('idle');
    expect(result.current.events).toEqual([]);
    expect(mockListPilotTraces).not.toHaveBeenCalled();
  });

  it('transitions loading → ready on initial fetch', async () => {
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt2, evt1], // newest first
      pagination: { offset: 0, limit: 50, returned: 2 },
    });

    const { result } = renderHook(() =>
      usePilotTraceList({ parcelId: 'P-001', pollMs: 0 }),
    );

    // Should be loading initially
    expect(result.current.phase).toBe('loading');

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].eventId).toBe('e2'); // newest first
    expect(mockListPilotTraces).toHaveBeenCalledWith(
      expect.objectContaining({ parcelId: 'P-001', limit: 50 }),
    );
  });

  it('shows error on fetch failure', async () => {
    mockListPilotTraces.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      usePilotTraceList({ parcelId: 'P-001', pollMs: 0 }),
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('error');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.events).toEqual([]);
  });

  it('merges new events on incremental poll (dedupes by eventId)', async () => {
    // Initial fetch returns evt2, evt1
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt2, evt1],
      pagination: { offset: 0, limit: 50, returned: 2 },
    });

    const { result } = renderHook(() =>
      usePilotTraceList({ parcelId: 'P-001', pollMs: 5000 }),
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });
    expect(result.current.events).toHaveLength(2);

    // Set up incremental response: evt3 is new, evt2 is duplicate
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt3, evt2], // evt2 is duplicate
      pagination: { offset: 0, limit: 50, returned: 2 },
    });

    // Advance timer to trigger poll
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3); // e3 + e2 + e1, no dupe
    });

    // Verify newest-first ordering
    expect(result.current.events[0].eventId).toBe('e3');
    expect(result.current.events[1].eventId).toBe('e2');
    expect(result.current.events[2].eventId).toBe('e1');

    // Verify incremental poll used from= parameter
    expect(mockListPilotTraces).toHaveBeenCalledTimes(2);
    const secondCall = mockListPilotTraces.mock.calls[1][0] as Record<string, unknown>;
    expect(secondCall).toHaveProperty('from', evt2.timestamp);
  });

  it('refresh does full re-fetch', async () => {
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt1],
      pagination: { offset: 0, limit: 50, returned: 1 },
    });

    const { result } = renderHook(() =>
      usePilotTraceList({ parcelId: 'P-001', pollMs: 0 }),
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });

    // Set up next response
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt3, evt2, evt1],
      pagination: { offset: 0, limit: 50, returned: 3 },
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3);
    });

    // Refresh should NOT use from= (full re-fetch)
    const refreshCall = mockListPilotTraces.mock.calls[1][0] as Record<string, unknown>;
    expect(refreshCall).not.toHaveProperty('from');
  });

  it('resets on parcelId change', async () => {
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt1],
      pagination: { offset: 0, limit: 50, returned: 1 },
    });

    const { result, rerender } = renderHook(
      ({ pid }: { pid: string }) => usePilotTraceList({ parcelId: pid, pollMs: 0 }),
      { initialProps: { pid: 'P-001' } },
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });
    expect(result.current.events).toHaveLength(1);

    // Change parcelId
    mockListPilotTraces.mockResolvedValueOnce({
      events: [evt3],
      pagination: { offset: 0, limit: 50, returned: 1 },
    });

    rerender({ pid: 'P-002' });

    // Should reset to loading
    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].eventId).toBe('e3');
  });

  it('passes toolId to API when provided', async () => {
    mockListPilotTraces.mockResolvedValueOnce({
      events: [],
      pagination: { offset: 0, limit: 50, returned: 0 },
    });

    renderHook(() =>
      usePilotTraceList({ parcelId: 'P-001', toolId: 'run_valuation_model', pollMs: 0 }),
    );

    await waitFor(() => {
      expect(mockListPilotTraces).toHaveBeenCalled();
    });

    expect(mockListPilotTraces).toHaveBeenCalledWith(
      expect.objectContaining({ parcelId: 'P-001', toolId: 'run_valuation_model' }),
    );
  });
});
