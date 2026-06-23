import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Hoisted vi.mock so the @microsoft/signalr import resolves to the same
// mock whether the test runs through frontend/vitest.config.ts (which
// has a resolve.alias) or the root vitest.config.ts (which can fail to
// honour the alias when Vite's dep-optimizer pre-bundles the real
// package). The mock mirrors frontend/__mocks__/@microsoft/signalr.ts.
const { mockConnection, mockWithUrl } = vi.hoisted(() => {
  const conn = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    invoke: vi.fn().mockResolvedValue(undefined),
    onreconnected: vi.fn(),
    onreconnecting: vi.fn(),
    onclose: vi.fn(),
    state: 'Connected',
    connectionId: 'mock-connection-id',
  };
  return { mockConnection: conn, mockWithUrl: vi.fn().mockReturnThis() };
});

vi.mock('@microsoft/signalr', () => {
  const HubConnectionBuilder = vi.fn().mockImplementation(() => ({
    withUrl: mockWithUrl,
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(mockConnection),
  }));
  return {
    HubConnectionBuilder,
    HubConnectionState: {
      Connected: 'Connected',
      Connecting: 'Connecting',
      Disconnected: 'Disconnected',
      Disconnecting: 'Disconnecting',
      Reconnecting: 'Reconnecting',
    },
    getMockConnection: () => mockConnection,
    getMockWithUrl: () => mockWithUrl,
  };
});

vi.mock('../countyStudyScope', () => ({
  getCountyStudyScope: () => ({
    countyId: 'benton',
    headers: { 'x-county-id': 'benton' },
    isolated: true,
  }),
}));

import { getCountyStudyHubUrl, useCountyStudyHub } from '../hooks/useCountyStudyHub';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { clearToken, setToken } from '@/auth/authStorage';
import { getMockConnection, getMockWithUrl } from '@microsoft/signalr';

async function flushHubStart() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
  });
}

describe('useCountyStudyHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearToken();
    act(() => {
      useCountyStudioStore.getState().setSyncState('DISCONNECTED');
    });
  });

  it('joins the study group when studyId is provided', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await flushHubStart();
    expect(conn.invoke).toHaveBeenCalledWith('JoinStudy', 'study-abc');
  });

  it('connects to the backend county study hub route without the API prefix', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const withUrl = getMockWithUrl();
    await flushHubStart();

    expect(withUrl.mock.calls[0][0]).toEqual(expect.stringMatching(/\/hubs\/county-study\?countyId=benton$/));
    expect(withUrl.mock.calls[0][0]).not.toContain(['/api', '/hubs/county-study'].join(''));
  });

  it('passes the stored auth token to the county study hub', async () => {
    setToken('hub-token');
    renderHook(() => useCountyStudyHub('study-abc'));
    const withUrl = getMockWithUrl();
    await flushHubStart();

    expect(withUrl.mock.calls[0][1]?.accessTokenFactory()).toBe('hub-token');
  });

  it('resolves relative API dev base to the real hub route', () => {
    expect(getCountyStudyHubUrl('/api')).toBe('/hubs/county-study');
  });

  it('strips an API suffix from absolute API bases for hub routing', () => {
    const originalWindow = globalThis.window;
    // Exercise the server/non-browser branch explicitly. Browser runtime must
    // use the same-origin proxy so SignalR does not bypass Vite and trip CORS.
    // @ts-expect-error test-only global override
    delete globalThis.window;
    try {
      expect(getCountyStudyHubUrl('https://example.test/api')).toBe('https://example.test/hubs/county-study');
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it('keeps browser hub routing same-origin even when VITE_API_URL is absolute', () => {
    expect(getCountyStudyHubUrl('http://127.0.0.1:5000')).toBe('/hubs/county-study');
  });

  it('sets syncState to LIVE after hub connects', async () => {
    renderHook(() => useCountyStudyHub('study-xyz'));
    await flushHubStart();
    expect(useCountyStudioStore.getState().syncState).toBe('LIVE');
  });

  it('registers ReceiveSelection handler', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await flushHubStart();
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
    await flushHubStart();

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
    await flushHubStart();

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
    await flushHubStart();

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

  it('cancels a StrictMode cleanup before starting hub negotiation', async () => {
    const { unmount } = renderHook(() => useCountyStudyHub('study-abc'));

    unmount();
    await flushHubStart();

    const conn = getMockConnection();
    expect(conn.start).not.toHaveBeenCalled();
    expect(conn.invoke).not.toHaveBeenCalledWith('JoinStudy', 'study-abc');
    expect(conn.invoke).not.toHaveBeenCalledWith('LeaveStudy', 'study-abc');
  });
});
