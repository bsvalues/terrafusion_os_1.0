import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';
import {
  PiltApiError,
  getPiltDistricts,
  getPiltReceipts,
  getPiltStatus,
} from '../../services/piltService';

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

vi.mock('../../services/piltService', async () => {
  const actual = await vi.importActual('../../services/piltService');
  return {
    ...actual,
    getPiltStatus: vi.fn(),
    getPiltDistricts: vi.fn(),
    getPiltReceipts: vi.fn(),
  };
});

vi.mock('../../services/levyService', () => ({
  calculateLevyRate: vi.fn(),
}));

const mockGetPiltStatus = getPiltStatus as vi.MockedFunction<typeof getPiltStatus>;
const mockGetPiltDistricts = getPiltDistricts as vi.MockedFunction<typeof getPiltDistricts>;
const mockGetPiltReceipts = getPiltReceipts as vi.MockedFunction<typeof getPiltReceipts>;

function renderSuite() {
  return render(
    <MemoryRouter initialEntries={['/dais']}>
      <DaisSuiteHome />
    </MemoryRouter>,
  );
}

async function openPiltTab() {
  fireEvent.click(screen.getByRole('tab', { name: /PILT Admin/i }));
  await waitFor(() => {
    expect(mockGetPiltStatus).toHaveBeenCalledTimes(1);
    expect(mockGetPiltDistricts).toHaveBeenCalledTimes(1);
    expect(mockGetPiltReceipts).toHaveBeenCalledTimes(1);
  });
}

describe('DaisSuiteHome PILT module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders live Benton snapshot data when PILT endpoints succeed', async () => {
    mockGetPiltStatus.mockResolvedValue({
      status: 'active',
      fiscalYear: 2025,
      totalPayments: 1842500,
      districts: 5,
      federalAcres: 1123800,
      averageRate: 1.64,
    });
    mockGetPiltDistricts.mockResolvedValue({
      count: 2,
      districts: [
        { id: 'dist-benton-county', name: 'Benton County', type: 'county' },
        { id: 'dist-port-benton', name: 'Port of Benton', type: 'port' },
      ],
    });
    mockGetPiltReceipts.mockResolvedValue({
      count: 2,
      receipts: [
        { id: 'rcpt-1', fiscalYear: 2025, source: 'Federal PILT Base Disbursement', amount: 1245800, status: 'received' },
        { id: 'rcpt-2', fiscalYear: 2025, source: 'Secure Rural Schools Transfer', amount: 318400, status: 'distributed' },
      ],
    });

    renderSuite();
    await openPiltTab();

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText(/Federal Receipts/i)).toBeInTheDocument();
      expect(screen.getByText(/Receiving Districts/i)).toBeInTheDocument();
      expect(screen.getByText(/Federal PILT Base Disbursement/i)).toBeInTheDocument();
      expect(screen.getByText(/Port of Benton/i)).toBeInTheDocument();
      expect(screen.getByText(/Reference Land Categories/i)).toBeInTheDocument();
    });
  });

  it('shows deferred state when PILT is explicitly Post-R1', async () => {
    const deferredError = new PiltApiError('PILT backend is deferred', 'corr-pilt-deferred-001', 501, true);
    mockGetPiltStatus.mockRejectedValue(deferredError);
    mockGetPiltDistricts.mockRejectedValue(deferredError);
    mockGetPiltReceipts.mockRejectedValue(deferredError);

    renderSuite();
    await openPiltTab();

    await waitFor(() => {
      expect(screen.getByText('Deferred')).toBeInTheDocument();
      expect(
        screen.getByText(/PILT live data integration deferred to R2/i),
      ).toBeInTheDocument();
    });
  });

  it('shows correlation-aware error state for real PILT failures', async () => {
    const authError = new PiltApiError(
      'PILT endpoints require an authenticated county context before county-scoped data can be returned.',
      'corr-pilt-auth-001',
      401,
      false,
    );
    mockGetPiltStatus.mockRejectedValue(authError);
    mockGetPiltDistricts.mockRejectedValue(authError);
    mockGetPiltReceipts.mockRejectedValue(authError);

    renderSuite();
    await openPiltTab();

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/PILT live data is currently unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/corr-pilt-auth-001/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Showing Benton County reference data for layout preview only/i),
    ).not.toBeInTheDocument();
  });
});
