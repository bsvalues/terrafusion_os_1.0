import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from './testServer';
import { http, HttpResponse } from 'msw';
import { useLevyScenarios } from '../hooks/useLevyData';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useLevyScenarios', () => {
  it('returns scenarios for a measure (happy path)', async () => {
    const { result } = renderHook(() => useLevyScenarios('m1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items?.[0].levyMeasureId).toBe('m1');
  });

  it('returns empty list when no measureId', async () => {
    const { result } = renderHook(() => useLevyScenarios(undefined), { wrapper });
    // Query is disabled; should not load
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles server error', async () => {
    server.use(
      http.get('http://localhost:5000/levy/scenarios', () => HttpResponse.text('boom', { status: 500 }))
    );
    const { result } = renderHook(() => useLevyScenarios('m1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(String(result.current.error)).toMatch(/API Error: 500/);
  });
});
