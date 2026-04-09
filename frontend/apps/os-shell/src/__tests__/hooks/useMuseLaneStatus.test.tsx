import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMuseLaneStatus } from '../../hooks/useMuseLaneStatus';

const MOCK_RESPONSE = {
  lanes: {
    openai: { model: 'gpt-4o', endpoint: 'https://api.openai.com/v1', live: true, latencyMs: 120 },
    local: { model: 'llama-3.2', endpoint: 'http://localhost:11434/v1', live: false, latencyMs: null },
  },
  fallbackActive: false,
};

describe('useMuseLaneStatus', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts in loading state with null lanes', () => {
    const { result } = renderHook(() => useMuseLaneStatus());
    expect(result.current.loading).toBe(true);
    expect(result.current.lanes).toBeNull();
  });

  it('populates lanes and clears loading after fetch', async () => {
    const { result } = renderHook(() => useMuseLaneStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lanes).toEqual(MOCK_RESPONSE.lanes);
    expect(result.current.fallbackActive).toBe(false);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('sets error string on fetch failure, leaves lanes null', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() => useMuseLaneStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network down');
    expect(result.current.lanes).toBeNull();
  });

  it('registers a 30-second polling interval on mount', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(global, 'setInterval');
    renderHook(() => useMuseLaneStatus());
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 30_000);
    vi.useRealTimers();
  });
});
