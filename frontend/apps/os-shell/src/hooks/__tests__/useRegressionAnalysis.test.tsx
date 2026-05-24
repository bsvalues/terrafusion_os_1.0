import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const getTokenMock = vi.hoisted(() => vi.fn());
const buildHeadersMock = vi.hoisted(() => vi.fn());

vi.mock('../../lib/apiBase', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('../../auth/session', () => ({
  getSession: getSessionMock,
}));

vi.mock('../../auth/authStorage', () => ({
  getToken: getTokenMock,
}));

vi.mock('../../services/countyIsolation', () => ({
  buildCountyScopedSessionHeaders: buildHeadersMock,
}));

import { useRegressionAnalysis, useRunRegressionAnalysis } from '../useRegressionAnalysis';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  };
}

describe('useRegressionAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReturnValue({ countyId: 'benton-wa' });
    getTokenMock.mockReturnValue(null);
    buildHeadersMock.mockReturnValue({
      isolated: true,
      headers: { 'X-TerraFusion-County': 'benton-wa' },
    });
  });

  it('calls live TerraForge regression endpoints with county scoped headers', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    apiFetchMock.mockImplementation((path: string) => {
      if (path.startsWith('/terraforge/regression?')) {
        return Promise.resolve(jsonResponse({
          taxYear: 2026,
          totalPool: 42,
          usedForFit: 40,
          excludedCount: 2,
          insufficientData: false,
          singularMatrix: false,
          model: {
            predictors: ['intercept', 'GLA_sqft', 'LotSizeSqft', 'YearBuilt'],
            beta: [120000, 145.25, 0.42, 950],
            rSquared: 0.8123,
            rSquaredAdj: 0.7931,
            rmse: 18500,
            n: 40,
          },
          residuals: [
            { parcelId: 'P-1', fitted: 300000, residual: 12000, salePrice: 312000 },
          ],
        }));
      }

      if (path.startsWith('/terraforge/ratio-study/hedonic-regression?')) {
        return Promise.resolve(jsonResponse({
          taxYear: 2026,
          sampleSize: 40,
          rSquared: 0.82,
          adjustedRSquared: 0.8,
          mse: 0.03,
          coefficients: [
            { feature: 'Log(GLA)', coefficient: 0.62, stdError: 0.08, tStat: 7.75, pValue: 0.0001 },
          ],
          interpretation: 'Hedonic fit complete.',
        }));
      }

      if (path.startsWith('/terraforge/ratio-study/cross-validation?')) {
        return Promise.resolve(jsonResponse({
          taxYear: 2026,
          sampleSize: 55,
          folds: 5,
          meanRmse: 0.12,
          meanRSquared: 0.74,
          stdDevRmse: 0.01,
          foldResults: [
            { fold: 1, trainSize: 44, testSize: 11, rmse: 0.11, rSquared: 0.75 },
          ],
          interpretation: 'Cross validation complete.',
        }));
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const { result } = renderHook(() => useRegressionAnalysis(2026 as never), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/terraforge/regression?taxYear=2026&countyId=benton-wa',
      { headers: { 'X-TerraFusion-County': 'benton-wa' } },
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/terraforge/ratio-study/hedonic-regression?taxYear=2026&countyId=benton-wa',
      { headers: { 'X-TerraFusion-County': 'benton-wa' } },
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/terraforge/ratio-study/cross-validation?taxYear=2026&countyId=benton-wa',
      { headers: { 'X-TerraFusion-County': 'benton-wa' } },
    );

    expect(result.current.data?.modelStats.rSquared).toBe(0.8123);
    expect(result.current.data?.modelStats.rSquaredAdj).toBe(0.7931);
    expect(result.current.data?.coefficients[1]).toMatchObject({
      variable: 'GLA_sqft',
      coefficient: 145.25,
    });
    expect(result.current.data?.diagnosticPlots.residualsVsFitted[0]).toMatchObject({
      x: 300000,
      y: 12000,
      label: 'P-1',
    });
    expect(result.current.data?.crossValidation?.meanRSquared).toBe(0.74);
  });

  it('normalizes insufficient data responses into an honest unavailable result', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    apiFetchMock.mockResolvedValue(jsonResponse({
      taxYear: 2026,
      totalPool: 4,
      usedForFit: 3,
      excludedCount: 1,
      insufficientData: true,
      minimumRequired: 5,
      model: null,
      residuals: [],
    }));

    const { result } = renderHook(() => useRegressionAnalysis(2026 as never), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.unavailableReason).toBe(
      'Insufficient observations for regression: 3 available, 5 required.',
    );
    expect(result.current.data?.modelStats.n).toBe(3);
    expect(result.current.data?.coefficients).toEqual([]);
  });

  it('does not POST a run request and invalidates the live TerraForge query key', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRunRegressionAnalysis(2026 as never), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync();

    expect(apiFetchMock).not.toHaveBeenCalledWith('/regression/run', expect.anything());
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['regression-analysis', 2026, 'benton-wa'],
    });
  });
});
