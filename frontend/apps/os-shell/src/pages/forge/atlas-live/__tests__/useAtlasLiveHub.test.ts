import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Hoisted vi.mock so the @microsoft/signalr import resolves to the same
// mock whether the test runs through frontend/vitest.config.ts (which
// has a resolve.alias) or the root vitest.config.ts (whose alias may
// be bypassed by Vite's dep-optimizer pre-bundling). Mirrors
// frontend/__mocks__/@microsoft/signalr.ts and the same pattern used
// in pages/forge/county-studio/__tests__/useCountyStudyHub.test.ts.
const { mockConnection } = vi.hoisted(() => {
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
  return { mockConnection: conn };
});

vi.mock('@microsoft/signalr', () => {
  const HubConnectionBuilder = vi.fn().mockImplementation(() => ({
    withUrl: vi.fn().mockReturnThis(),
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
  };
});

import { useAtlasLiveHub } from '../hooks/useAtlasLiveHub';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import { getMockConnection } from '@microsoft/signalr';

describe('useAtlasLiveHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAtlasLiveStore.getState().setSyncState('DISCONNECTED');
      useAtlasLiveStore.getState().clearOverlays();
    });
  });

  it('joins the study group when studyId is provided', async () => {
    renderHook(() => useAtlasLiveHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => {
      await Promise.resolve();
    });
    expect(conn.invoke).toHaveBeenCalledWith('JoinStudy', 'study-abc');
  });

  it('sets syncState to LIVE after hub connects', async () => {
    renderHook(() => useAtlasLiveHub('study-xyz'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(useAtlasLiveStore.getState().syncState).toBe('LIVE');
  });

  it('registers ReceiveProjection handler', async () => {
    renderHook(() => useAtlasLiveHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => {
      await Promise.resolve();
    });
    const events = (conn.on as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(events).toContain('ReceiveProjection');
  });

  it('does not connect when studyId is null', () => {
    const conn = getMockConnection();
    renderHook(() => useAtlasLiveHub(null));
    expect(conn.start).not.toHaveBeenCalled();
  });

  it('sendSelection invokes hub with selection:parcel-ids event type', async () => {
    const { result } = renderHook(() => useAtlasLiveHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.sendSelection({
        type: 'selection:parcel-ids',
        studyId: 'study-abc',
        parcelIds: ['p1', 'p2'],
        source: 'click',
      });
    });
    expect(conn.invoke).toHaveBeenCalledWith(
      'SendSelection',
      'study-abc',
      expect.objectContaining({ type: 'selection:parcel-ids' })
    );
  });
});
