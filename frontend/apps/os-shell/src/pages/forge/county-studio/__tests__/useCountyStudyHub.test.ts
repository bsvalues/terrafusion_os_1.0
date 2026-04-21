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
});
