/**
 * useParcelCount hook unit tests (W3A/W3C)
 *
 * Proves:
 *  1. Happy path — fetches /api/government/stats and returns totalParcels
 *  2. Network error — hook enters error state (callers should fall back to ?? 89_247)
 *  3. HTTP error — non-ok response also throws
 *  4. Invariant B — fetch URL is /api/government/stats (NOT /government/stats)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ParcelCountStats } from '../useParcelCount';
import { useParcelCount } from '../useParcelCount';

// ── helpers ────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { Wrapper, qc };
}

const MOCK_STATS: ParcelCountStats = {
  totalParcels: 112_056,
  dataSource: 'LIVE_DB',
  stubbed: false,
};

// ── test suite ─────────────────────────────────────────────────────────────

describe('useParcelCount', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns totalParcels from /api/government/stats on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(MOCK_STATS), { status: 200 })
    );

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useParcelCount(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalParcels).toBe(112_056);
    expect(result.current.data?.dataSource).toBe('LIVE_DB');
    expect(result.current.data?.stubbed).toBe(false);
  });

  it('calls fetch with /api/government/stats URL (Invariant B)', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(MOCK_STATS), { status: 200 })
    );
    globalThis.fetch = mockFetch;

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useParcelCount(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check only the URL argument — init is undefined when no options passed
    expect(mockFetch.mock.calls[0][0]).toContain('/api/government/stats');
  });

  it('enters error state when fetch rejects (callers must ?? 89_247)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useParcelCount(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('enters error state on non-2xx HTTP response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('Service Unavailable', { status: 503 })
    );

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useParcelCount(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain('503');
  });

  it('is initially loading (no cached data)', () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(MOCK_STATS), { status: 200 })
    );

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useParcelCount(), { wrapper: Wrapper });

    // Before the promise resolves, isLoading should be true
    expect(result.current.isLoading).toBe(true);
  });
});
