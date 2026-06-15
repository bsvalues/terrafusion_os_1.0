import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCostApproach,
  useParcelYears,
  useCommitReconciliation,
  usePatchSaleQualification,
} from '../useForgeValuation';

const mockFetch = vi.fn() as vi.MockedFunction<typeof fetch>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function headersFromCall(index = 0): Headers {
  const init = mockFetch.mock.calls[index]?.[1] as RequestInit | undefined;
  return new Headers(init?.headers);
}

describe('useForgeValuation auth headers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    localStorage.clear();
    localStorage.setItem('authToken', 'production-jwt');
  });

  it('attaches Authorization to parcel-scoped Forge approach requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ parcelId: '101040000000000', taxYear: 2026 }),
    } as Response);

    renderHook(() => useCostApproach('101040000000000', 2026), { wrapper: createWrapper() });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    expect(mockFetch.mock.calls[0][0]).toBe('/api/forge/101040000000000/cost?taxYear=2026');
    expect(headersFromCall().get('Authorization')).toBe('Bearer production-jwt');
  });

  it('attaches Authorization to parcel year discovery', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ parcelId: '101040000000000', layers: [], defaultYear: null }),
    } as Response);

    renderHook(() => useParcelYears('101040000000000'), { wrapper: createWrapper() });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    expect(mockFetch.mock.calls[0][0]).toBe('/api/forge/101040000000000/years');
    expect(headersFromCall().get('Authorization')).toBe('Bearer production-jwt');
  });

  it('attaches Authorization to reconciliation commits', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        flagId: 7,
        parcelId: '101040000000000',
        finalValue: 238600,
        method: 'weighted_average',
        status: 'RECONCILIATION_PENDING',
        createdAt: '2026-06-15T00:00:00Z',
      }),
    } as Response);

    const { result } = renderHook(() => useCommitReconciliation('101040000000000'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        method: 'weighted_average',
        finalValue: 238600,
        taxYear: 2026,
        approaches: [],
      });
    });

    expect(mockFetch.mock.calls[0][0]).toBe('/api/forge/101040000000000/reconciliation/commit');
    expect(headersFromCall().get('Authorization')).toBe('Bearer production-jwt');
    expect(headersFromCall().get('Content-Type')).toBe('application/json');
  });

  it('attaches Authorization to sale qualification overrides', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        saleId: 'sale-1',
        qualificationDecision: 'qualified',
        decisionBy: 'operator',
        decisionAt: '2026-06-15T00:00:00Z',
        decisionSource: 'AssessorOverride',
      }),
    } as Response);

    const { result } = renderHook(() => usePatchSaleQualification('101040000000000', 2026), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ saleId: 'sale-1', decision: 'qualified' });
    });

    expect(mockFetch.mock.calls[0][0]).toBe('/api/forge/sales/sale-1/qualification');
    expect(headersFromCall().get('Authorization')).toBe('Bearer production-jwt');
    expect(headersFromCall().get('Content-Type')).toBe('application/json');
  });
});
