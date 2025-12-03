/**
 * Tests for useSystemActivity hook.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemWorkspaceActivityItem } from '../types';
import { useSystemActivity } from '../useSystemActivity';
import type { WorkspaceActivityProvider } from '../WorkspaceActivityProvider';
import {
  resetWorkspaceActivityProvider,
  setWorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

describe('useSystemActivity', () => {
  beforeEach(() => {
    resetWorkspaceActivityProvider();
  });

  afterEach(() => {
    resetWorkspaceActivityProvider();
  });

  it('returns loading true initially', () => {
    const { result } = renderHook(() => useSystemActivity());
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns items after loading when provider supports getAllRecentActivity', async () => {
    const mockItems: SystemWorkspaceActivityItem[] = [
      {
        workspaceId: 'ws-1',
        item: {
          id: 'act-1',
          timestamp: new Date().toISOString(),
          summary: 'Test activity 1',
          type: 'info',
        },
      },
      {
        workspaceId: 'ws-2',
        item: {
          id: 'act-2',
          timestamp: new Date().toISOString(),
          summary: 'Test activity 2',
          type: 'warning',
        },
      },
    ];

    const mockProvider: WorkspaceActivityProvider = {
      getRecentActivity: vi.fn().mockResolvedValue([]),
      recordActivity: vi.fn().mockResolvedValue(undefined),
      getAllRecentActivity: vi.fn().mockResolvedValue(mockItems),
    };

    setWorkspaceActivityProvider(mockProvider);

    const { result } = renderHook(() => useSystemActivity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItems);
    expect(result.current.error).toBeNull();
    expect(mockProvider.getAllRecentActivity).toHaveBeenCalledWith({
      limitPerWorkspace: undefined,
    });
  });

  it('passes limitPerWorkspace option to provider', async () => {
    const mockProvider: WorkspaceActivityProvider = {
      getRecentActivity: vi.fn().mockResolvedValue([]),
      recordActivity: vi.fn().mockResolvedValue(undefined),
      getAllRecentActivity: vi.fn().mockResolvedValue([]),
    };

    setWorkspaceActivityProvider(mockProvider);

    const { result } = renderHook(() => useSystemActivity({ limitPerWorkspace: 25 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockProvider.getAllRecentActivity).toHaveBeenCalledWith({
      limitPerWorkspace: 25,
    });
  });

  it('returns error when provider does not support getAllRecentActivity', async () => {
    const limitedProvider: WorkspaceActivityProvider = {
      getRecentActivity: vi.fn().mockResolvedValue([]),
      recordActivity: vi.fn().mockResolvedValue(undefined),
      // No getAllRecentActivity method
    };

    setWorkspaceActivityProvider(limitedProvider);

    const { result } = renderHook(() => useSystemActivity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('System activity not supported by current provider');
  });

  it('returns error when provider.getAllRecentActivity rejects', async () => {
    const failingProvider: WorkspaceActivityProvider = {
      getRecentActivity: vi.fn().mockResolvedValue([]),
      recordActivity: vi.fn().mockResolvedValue(undefined),
      getAllRecentActivity: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    setWorkspaceActivityProvider(failingProvider);

    const { result } = renderHook(() => useSystemActivity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('handles non-Error rejection gracefully', async () => {
    const failingProvider: WorkspaceActivityProvider = {
      getRecentActivity: vi.fn().mockResolvedValue([]),
      recordActivity: vi.fn().mockResolvedValue(undefined),
      getAllRecentActivity: vi.fn().mockRejectedValue('string error'),
    };

    setWorkspaceActivityProvider(failingProvider);

    const { result } = renderHook(() => useSystemActivity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Unknown error');
  });
});
