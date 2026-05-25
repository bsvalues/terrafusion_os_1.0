import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CUForge from '../CUForge';
import { useCUForgeWorkspaceStore, type Classification, type Removal } from '../cuForgeWorkspaceStore';

const apiFetchJsonMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: apiFetchJsonMock,
}));

const classification = (
  id: string,
  code: string,
  taxSavings: number,
  overrides: Partial<Classification> = {},
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
  ...overrides,
});

const removal = (
  id: string,
  parcelId: string,
  status: string,
  overrides: Partial<Removal> = {},
): Removal => ({
  id,
  parcelId,
  classificationCode: 'CUFA',
  reason: 'Failure to meet requirements',
  initiatedDate: '2026-03-01',
  status,
  removalDate: null,
  rollbackAmount: 125_000,
  interestAmount: 18_000,
  penaltyAmount: 25_000,
  totalDue: 168_000,
  ...overrides,
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
        return Promise.resolve({
          total: 1,
          page: 1,
          pageSize: 50,
          items: [
            classification('0003', 'CUFA', 2_000, {
              parcelId: '1-0234-100-0001',
              enrollmentDate: '2015-01-01',
              currentMarketValue: 300_000,
              currentUseValue: 60_000,
              description: 'Farm and agriculture continuance',
            }),
          ],
        });
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

    await screen.findByText('Farm and agriculture continuance');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Calculate worksheet' }));
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

  it('renders the operational case desk with work queues derived from live current use records', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path === '/currentuse/classifications?page=1&pageSize=1000') {
        return Promise.resolve({
          total: 3,
          page: 1,
          pageSize: 1000,
          items: [
            classification('1001', 'CUFA', 0, {
              parcelId: '1-1111-100-0001',
              acreage: null,
              currentUseValue: null,
              description: 'Orchard continuance missing acreage evidence',
            }),
            classification('1002', 'DFL', 58_000, {
              parcelId: '1-2222-200-0002',
              acreage: 42,
              currentMarketValue: 620_000,
              currentUseValue: 80_000,
              description: 'Designated forest land removal review',
            }),
            classification('1003', 'CUOS', 12_000, {
              parcelId: '1-3333-300-0003',
              acreage: 7,
              description: 'Open space continuance',
            }),
          ],
        });
      }
      if (path === '/currentuse/classifications?page=1&pageSize=50') {
        return Promise.resolve({
          total: 3,
          page: 1,
          pageSize: 50,
          items: [
            classification('1001', 'CUFA', 0, {
              parcelId: '1-1111-100-0001',
              acreage: null,
              currentUseValue: null,
              description: 'Orchard continuance missing acreage evidence',
            }),
            classification('1002', 'DFL', 58_000, {
              parcelId: '1-2222-200-0002',
              acreage: 42,
              currentMarketValue: 620_000,
              currentUseValue: 80_000,
              description: 'Designated forest land removal review',
            }),
            classification('1003', 'CUOS', 12_000, {
              parcelId: '1-3333-300-0003',
              acreage: 7,
              description: 'Open space continuance',
            }),
          ],
        });
      }
      if (path === '/currentuse/interest-rates') {
        return Promise.resolve([{ year: 2026, rate: 0.05, source: 'WA DOR', effectiveDate: '2026-01-01' }]);
      }
      if (path === '/currentuse/removals') {
        return Promise.resolve([
          removal('r1', '1-2222-200-0002', 'Pending', { classificationCode: 'DFL' }),
        ]);
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await act(async () => {
      render(<CUForge />);
    });

    expect(await screen.findByRole('heading', { name: 'Current Use Case Desk' })).toBeInTheDocument();
    expect(screen.getByText('Case Desk derived from live Current Use records.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Missing Evidence 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inspection Required 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rollback Incomplete 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pending Owner Response 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notice Ready 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pending Chief Review 2/i })).toBeInTheDocument();
    expect(screen.getAllByText('Orchard continuance missing acreage evidence').length).toBeGreaterThan(0);
    expect(screen.getByText('Compliance Checklist')).toBeInTheDocument();
    expect(screen.getByText('Evidence gap: acreage missing')).toBeInTheDocument();
    expect(screen.getByText('Chief Appraiser Review Queue')).toBeInTheDocument();
    expect(screen.getByText('High-dollar rollback')).toBeInTheDocument();
    expect(screen.getByText('Case Status')).toBeInTheDocument();
    expect(screen.getByText('Assigned To')).toBeInTheDocument();
    expect(screen.getByText('Aging')).toBeInTheDocument();
  });

  it('supports assessor-grade local case transitions without claiming persistence', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path.startsWith('/currentuse/classifications')) {
        return Promise.resolve({
          total: 2,
          page: 1,
          pageSize: 50,
          items: [
            classification('3001', 'CUFA', 0, {
              parcelId: '1-5555-500-0005',
              acreage: null,
              currentUseValue: null,
              description: 'Missing farm plan continuance',
            }),
            classification('3002', 'DFL', 92_000, {
              parcelId: '1-6666-600-0006',
              acreage: 67,
              currentMarketValue: 840_000,
              currentUseValue: 110_000,
              description: 'Forest land withdrawal review',
            }),
          ],
        });
      }
      if (path === '/currentuse/interest-rates') {
        return Promise.resolve([{ year: 2026, rate: 0.05, source: 'WA DOR', effectiveDate: '2026-01-01' }]);
      }
      if (path === '/currentuse/removals') {
        return Promise.resolve([
          removal('r3', '1-6666-600-0006', 'Pending', {
            classificationCode: 'DFL',
            reason: 'Owner withdrawal; penalty exception requested',
          }),
        ]);
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await act(async () => {
      render(<CUForge />);
    });

    await screen.findByRole('heading', { name: 'Current Use Case Desk' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Rollback Incomplete 1/i }));
    });

    expect(screen.getByRole('heading', { name: 'ROLLBACK_REVIEW' })).toBeInTheDocument();
    expect(screen.getByText('Penalty suppression review')).toBeInTheDocument();
    expect(screen.getByText('Statutory exception claimed')).toBeInTheDocument();
    expect(screen.getByText('Staged locally until case persistence is added.')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Advance case' }));
    });

    expect(screen.getByRole('heading', { name: 'NOTICE_PENDING_APPROVAL' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Return to monitoring' }));
    });

    expect(screen.getByRole('heading', { name: 'MONITORING' })).toBeInTheDocument();
  });

  it('uses the existing rollback endpoint to produce an assessor-grade worksheet for the selected case', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path.startsWith('/currentuse/classifications')) {
        return Promise.resolve({
          total: 1,
          page: 1,
          pageSize: 50,
          items: [
            classification('2001', 'CUFA', 72_000, {
              parcelId: '1-4444-400-0004',
              enrollmentDate: '2016-01-01',
              currentMarketValue: 500_000,
              currentUseValue: 44_000,
              description: 'Farm and agriculture rollback review',
            }),
          ],
        });
      }
      if (path === '/currentuse/interest-rates') {
        return Promise.resolve([{ year: 2026, rate: 0.05, source: 'WA DOR', effectiveDate: '2026-01-01' }]);
      }
      if (path === '/currentuse/removals') {
        return Promise.resolve([
          removal('r2', '1-4444-400-0004', 'Pending', { classificationCode: 'CUFA' }),
        ]);
      }
      if (path === '/currentuse/rollback/calculate') {
        return Promise.resolve({
          totalRollbackTax: 12_500,
          totalInterest: 1_100,
          totalPenalty: 2_500,
          grandTotal: 16_100,
          penaltyApplied: true,
          penaltyExceptionApplied: false,
          exceptionCode: null,
          yearBreakdowns: [
            {
              year: 2026,
              marketValue: 500_000,
              currentUseValue: 44_000,
              difference: 456_000,
              interestRate: 0.05,
              interestAmount: 1_100,
              subtotal: 13_600,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await act(async () => {
      render(<CUForge />);
    });

    await screen.findByText('Farm and agriculture rollback review');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Calculate worksheet' }));
    });

    await waitFor(() => {
      expect(apiFetchJsonMock).toHaveBeenCalledWith(
        '/currentuse/rollback/calculate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const rollbackCall = apiFetchJsonMock.mock.calls.find(([path]) => path === '/currentuse/rollback/calculate');
    const body = JSON.parse(String(rollbackCall?.[1]?.body));

    expect(body.parcelId).toBe('1-4444-400-0004');
    expect(body.classificationCode).toBe('CUFA');
    expect(screen.getByText('Tax Year 2026')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'CU Value' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'TFV' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Difference' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Levy' })).toBeInTheDocument();
    expect(screen.getByText('Additional Tax')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Penalty' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Print worksheet' })).toBeInTheDocument();
    expect(screen.getByText('$16,100.00')).toBeInTheDocument();
  });
});
