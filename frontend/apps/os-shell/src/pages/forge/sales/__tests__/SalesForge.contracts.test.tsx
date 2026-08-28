import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { RunningStatsPanel } from '../components/RunningStatsPanel';
import { RatioAuditPanel } from '../panels/RatioAuditPanel';
import { useSalesForgeStore } from '../salesForgeStore';
import { SALESFORGE_STATISTICS_CONTRACT } from '../salesForgeTypes';
import { statisticsAPI, statisticsApiContractMetadata } from '../../../../services/forge/statisticsAPI';

vi.mock('@/auth/session', () => ({
  getSession: () => ({ countyId: 'benton', countyCode: '005' }),
}));

vi.mock('@/services/countyIsolation', () => ({
  buildCountyScopedSessionHeaders: () => ({
    headers: { 'X-TerraFusion-County': 'benton' },
    isolated: true,
  }),
}));

function resetStore(fetchRunningStats = vi.fn().mockResolvedValue(undefined)) {
  useSalesForgeStore.setState({
    taxYear: 2025,
    committedFilters: {
      countyCode: '005',
      hood: null,
      propertyType: null,
      saleDateFrom: null,
      saleDateTo: null,
      minPrice: null,
      maxPrice: null,
    },
    runningStats: {
      taxYear: 2025,
      filters: { hood: null, propertyType: null },
      counts: {
        total: 36,
        qualified: 36,
        nonQualified: 0,
        pending: 0,
        withRatio: 36,
      },
      stats: {
        medianRatio: 0.7224,
        meanRatio: 0.7331,
        weightedMeanRatio: 0.7019,
        cod: 40.24,
        prd: 2.1352,
        prb: -0.1672,
      },
      iaaoCompliant: {
        median: false,
        cod: false,
        prd: false,
        prb: false,
      },
    },
    statsLoading: false,
    statsError: null,
    fetchRunningStats,
    selectedSaleId: null,
    saleDetail: null,
    detailLoading: false,
  });
}

describe('SalesForge contract posture', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetStore();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces Statistics Compat lineage on running stats', () => {
    const fetchRunningStats = vi.fn().mockResolvedValue(undefined);
    resetStore(fetchRunningStats);

    render(<RunningStatsPanel />);

    const lineage = screen.getByTestId('salesforge-running-stats-contract');
    expect(lineage).toHaveAttribute('data-contract-id', SALESFORGE_STATISTICS_CONTRACT.contractId);
    expect(lineage).toHaveAttribute(
      'data-implementation-contract-id',
      SALESFORGE_STATISTICS_CONTRACT.implementationContractId,
    );
    expect(lineage).toHaveTextContent(SALESFORGE_STATISTICS_CONTRACT.population);
    expect(lineage).toHaveTextContent('Parity-compatible');
    expect(fetchRunningStats).toHaveBeenCalledTimes(1);
  });

  it('renders unavailable IAAO compliance as unknown instead of failed', () => {
    const runningStats = useSalesForgeStore.getState().runningStats;
    useSalesForgeStore.setState({
      runningStats: runningStats ? { ...runningStats, iaaoCompliant: null } : null,
    });

    render(<RunningStatsPanel />);

    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(document.querySelectorAll('.sf-iaao-badge--fail')).toHaveLength(0);
  });

  it('surfaces Statistics Compat lineage on ratio audit', async () => {
    render(<RatioAuditPanel />);

    const lineage = screen.getByTestId('salesforge-ratio-audit-contract');
    expect(lineage).toHaveAttribute('data-contract-id', SALESFORGE_STATISTICS_CONTRACT.contractId);
    expect(lineage).toHaveAttribute(
      'data-implementation-contract-id',
      SALESFORGE_STATISTICS_CONTRACT.implementationContractId,
    );
    expect(lineage).toHaveTextContent(SALESFORGE_STATISTICS_CONTRACT.outlierPolicy);

    expect(await screen.findByText('No qualified sales in current filter window.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/terraforge/sale-qualification?'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-TerraFusion-County': 'benton' }),
      }),
    );
  });

  it('keeps the legacy statistics client contract-declared without changing method shapes', () => {
    expect(statisticsApiContractMetadata.contractId).toBe('terraforge_statistics_compat_v1');
    expect(statisticsApiContractMetadata.implementationContractId).toBe('statistics_ratio_study_compat_v1');
    expect(statisticsAPI.contractMetadata).toBe(statisticsApiContractMetadata);
    expect(typeof statisticsAPI.getStrata).toBe('function');
    expect(typeof statisticsAPI.getOutliers).toBe('function');
  });
});
