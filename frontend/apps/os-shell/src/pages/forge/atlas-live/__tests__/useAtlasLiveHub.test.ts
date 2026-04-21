import { renderHook, act } from '@testing-library/react';
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
