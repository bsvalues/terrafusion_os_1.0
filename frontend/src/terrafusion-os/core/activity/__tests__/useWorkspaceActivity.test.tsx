import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceActivity } from '../useWorkspaceActivity';
import {
  resetWorkspaceActivityProvider,
  setWorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

describe('useWorkspaceActivity', () => {
  beforeEach(() => {
    resetWorkspaceActivityProvider();
  });

  it('returns loading true initially', () => {
    const { result } = renderHook(() => useWorkspaceActivity('home'));

    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns items from provider after loading', async () => {
    setWorkspaceActivityProvider({
      async getRecentActivity() {
        return [
          {
            id: 'hook-test-1',
            timestamp: new Date().toISOString(),
            summary: 'Hook test event',
            type: 'info' as const,
            source: 'Test',
          },
        ];
      },
    });

    const { result } = renderHook(() => useWorkspaceActivity('home'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].summary).toBe('Hook test event');
    expect(result.current.error).toBeNull();
  });

  it('passes limit option to provider', async () => {
    const mockProvider = {
      getRecentActivity: vi
        .fn()
        .mockResolvedValue([{ id: '1', timestamp: '', summary: 'Event 1', type: 'info' as const }]),
    };

    setWorkspaceActivityProvider(mockProvider);

    const { result } = renderHook(() => useWorkspaceActivity('home', { limit: 5 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockProvider.getRecentActivity).toHaveBeenCalledWith('home', { limit: 5 });
  });

  it('handles provider errors gracefully', async () => {
    setWorkspaceActivityProvider({
      async getRecentActivity() {
        throw new Error('Provider failed');
      },
    });

    const { result } = renderHook(() => useWorkspaceActivity('home'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Provider failed');
    expect(result.current.items).toEqual([]);
  });
});
