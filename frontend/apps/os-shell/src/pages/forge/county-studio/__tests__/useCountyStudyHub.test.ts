import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useCountyStudyHub } from '../hooks/useCountyStudyHub';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { getMockConnection } from '@microsoft/signalr';

describe('useCountyStudyHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useCountyStudioStore.getState().setSyncState('DISCONNECTED');
    });
  });

  it('joins the study group when studyId is provided', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => {
      await Promise.resolve();
    });
    expect(conn.invoke).toHaveBeenCalledWith('JoinStudy', 'study-abc');
  });

  it('sets syncState to LIVE after hub connects', async () => {
    renderHook(() => useCountyStudyHub('study-xyz'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(useCountyStudioStore.getState().syncState).toBe('LIVE');
  });

  it('registers ReceiveSelection handler', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => {
      await Promise.resolve();
    });
    const registeredEvents = (conn.on as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(registeredEvents).toContain('ReceiveSelection');
  });

  it('does not connect when studyId is null', () => {
    const conn = getMockConnection();
    renderHook(() => useCountyStudyHub(null));
    expect(conn.start).not.toHaveBeenCalled();
  });

  // ── Chunk 5: live Atlas connect — presence/projection receive handlers ──

  it('ReceivePresence handler pushes event into store peerPresence', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => { await Promise.resolve(); });

    // Find the registered ReceivePresence callback and invoke it with a payload.
    const onCalls = (conn.on as ReturnType<typeof vi.fn>).mock.calls;
    const presenceCall = onCalls.find((c: unknown[]) => c[0] === 'ReceivePresence');
    expect(presenceCall).toBeDefined();
    const handler = presenceCall![1] as (event: unknown) => void;

    act(() => {
      useCountyStudioStore.getState().peerPresence = [];
    });
    act(() => {
      handler({
        type: 'presence:segment-hover',
        payload: { studyId: 'study-abc', segmentId: 'seg-123', actorId: 'user-2' },
      });
    });

    const entries = useCountyStudioStore.getState().peerPresence;
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('presence:segment-hover');
    expect(entries[0].segmentId).toBe('seg-123');
    expect(entries[0].actorId).toBe('user-2');
    expect(typeof entries[0].at).toBe('number');
  });

  it('ReceiveProjection handler pushes event into store incomingProjections', async () => {
    renderHook(() => useCountyStudyHub('study-xyz'));
    const conn = getMockConnection();
    await act(async () => { await Promise.resolve(); });

    const onCalls = (conn.on as ReturnType<typeof vi.fn>).mock.calls;
    const projCall = onCalls.find((c: unknown[]) => c[0] === 'ReceiveProjection');
    expect(projCall).toBeDefined();
    const handler = projCall![1] as (event: unknown) => void;

    act(() => {
      useCountyStudioStore.getState().clearIncomingProjections();
    });
    act(() => {
      handler({
        type: 'metric-overlay',
        payload: { metric: 'cod', segments: [] },
      });
    });

    const proj = useCountyStudioStore.getState().incomingProjections;
    expect(proj).toHaveLength(1);
    expect(proj[0].type).toBe('metric-overlay');
  });

  it('ReceiveProjection with type=clear flushes the ring buffer', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => { await Promise.resolve(); });

    const handler = (conn.on as ReturnType<typeof vi.fn>).mock.calls
      .find((c: unknown[]) => c[0] === 'ReceiveProjection')![1] as (event: unknown) => void;

    act(() => {
      useCountyStudioStore.getState().clearIncomingProjections();
    });
    act(() => {
      handler({ type: 'metric-overlay', payload: {} });
      handler({ type: 'scenario-delta', payload: {} });
      handler({ type: 'clear', payload: {} });
    });

    expect(useCountyStudioStore.getState().incomingProjections).toHaveLength(0);
  });
});
