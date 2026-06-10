import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CUForge from '../CUForge';
import { useCUForgeWorkspaceStore, type Classification } from '../cuForgeWorkspaceStore';

const apiFetchJsonMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: apiFetchJsonMock,
}));

const classification = (
  id: string,
  code: string,
  taxSavings: number,
): Classification => ({
  id,
  parcelId: `1-0000-${id}`,
  classificationCode: code,
  description: `${code} enrollment`,
  enrollmentDate: '2015-01-01',
  status: 'Active',
  acreage: 10,
  currentMarketValue: 100_000,
  currentUseValue: 50_000,
  taxSavings,
  countyId: 'benton-wa',
});

describe('CUForge review regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCUForgeWorkspaceStore.setState({
      activeTab: 'classifications',
      taxYear: 2026,
      stats: null,
      statsLoading: false,
      statsError: null,
      classifications: [],
      classificationsTotal: 0,
      classificationsPage: 1,
      classificationsLoading: false,
      classificationsError: null,
      rollbackResult: null,
      rollbackLoading: false,
      rollbackError: null,
      interestRates: [],
      interestRatesLoading: false,
      interestRatesError: null,
      removals: [],
      removalsLoading: false,
      removalsError: null,
    });
  });

  it('derives county stats from every classifications page, not only the first page', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path === '/currentuse/classifications?page=1&pageSize=1000') {
        return Promise.resolve({
          total: 1001,
          page: 1,
          pageSize: 1000,
          items: [classification('0001', 'DFL', 1)],
        });
      }
      if (path === '/currentuse/classifications?page=2&pageSize=1000') {
        return Promise.resolve({
          total: 1001,
          page: 2,
          pageSize: 1000,
          items: [classification('0002', 'CUFA', 2)],
        });
      }
      if (path === '/currentuse/interest-rates') {
        return Promise.resolve([{ year: 2026, rate: 0.09, source: 'WA DOR', effectiveDate: '2026-01-01' }]);
      }
      if (path === '/currentuse/removals') {
        return Promise.resolve([{ id: 'r1', status: 'Pending' }]);
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await useCUForgeWorkspaceStore.getState().fetchStats();

    expect(apiFetchJsonMock).toHaveBeenCalledWith(
      '/currentuse/classifications?page=2&pageSize=1000',
      expect.any(Object),
    );
    expect(useCUForgeWorkspaceStore.getState().stats).toMatchObject({
      totalEnrolled: 2,
      dflCount: 1,
      cufaCount: 1,
      totalTaxBenefit: 3,
      pendingRemovals: 1,
      currentInterestRate: 9,
    });
  });

  it('sends a 10-year rollback value window for non-DFL current use programs', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path.startsWith('/currentuse/classifications')) {
        return Promise.resolve({ total: 0, page: 1, pageSize: 50, items: [] });
      }
      if (path === '/currentuse/interest-rates') {
        return Promise.resolve([]);
      }
      if (path === '/currentuse/removals') {
        return Promise.resolve([]);
      }
      if (path === '/currentuse/rollback/calculate') {
        return Promise.resolve({
          totalRollbackTax: 0,
          totalInterest: 0,
          totalPenalty: 0,
          grandTotal: 0,
          yearBreakdowns: [],
          penaltyApplied: false,
          penaltyExceptionApplied: false,
          exceptionCode: null,
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await act(async () => {
      render(<CUForge />);
    });

    await screen.findByText('Total Enrolled');

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Rollback' }));
    });
    const programSelect = await screen.findByLabelText('Program');

    await act(async () => {
      fireEvent.change(programSelect, { target: { value: 'CUFA' } });
      fireEvent.click(screen.getByRole('button', { name: 'Calculate Rollback' }));
    });

    await waitFor(() => {
      expect(apiFetchJsonMock).toHaveBeenCalledWith(
        '/currentuse/rollback/calculate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const rollbackCall = apiFetchJsonMock.mock.calls.find(([path]) => path === '/currentuse/rollback/calculate');
    const body = JSON.parse(String(rollbackCall?.[1]?.body));

    expect(body.classificationCode).toBe('CUFA');
    expect(Object.keys(body.marketValues).map(Number).sort((a, b) => a - b)).toEqual([
      2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
    ]);
    expect(Object.keys(body.currentUseValues).map(Number).sort((a, b) => a - b)).toEqual([
      2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
    ]);
  });
});
