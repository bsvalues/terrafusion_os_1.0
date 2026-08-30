import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { RunningStatsPanel } from '../components/RunningStatsPanel';
import { SaleDetailPanel } from '../components/SaleDetailPanel';
import { RatioAuditPanel } from '../panels/RatioAuditPanel';
import { useSalesForgeStore } from '../salesForgeStore';
import { SALESFORGE_STATISTICS_CONTRACT, type SaleDetail } from '../salesForgeTypes';
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

  it('shows public source and quality evidence before assessor decision controls', () => {
    useSalesForgeStore.setState({
      saleDetail: {
        saleId: 'spokane-evidence-sale',
        parcelId: '063-reference-parcel',
        address: 'Reference address',
        saleDate: '2025-01-15',
        salePrice: 300_000,
        documentNumber: '00A-00127',
        grantor: 'Northwest Holdings LLC',
        grantee: 'Riverbend Housing Trust',
        dataTrustTier: 'public-reference-not-county-certified',
        sourceMode: 'public_recorder_export',
        candidateSource: 'spokane_sales_candidate_index',
        confidenceScore: 0.91,
        qualityScore: 0.78,
        qualityBand: 'review_required',
        reviewStatus: 'needs_source_confirmation',
        sourceUrl: 'https://example.wa.gov/sales',
        sourceFinalUrl: 'https://example.wa.gov/sales/record-1',
        sourcePayloadPath: 'washington/spokane/record-1.json',
        sourcePayloadSha256: 'abc123',
        candidateIndexSource: null,
        candidateRecordType: 'public_sale_candidate',
        candidateSourceOrdinal: 7,
      } as SaleDetail,
      detailLoading: false,
      detailError: null,
    });

    render(<SaleDetailPanel />);

    const transactionEvidence = screen.getByTestId('salesforge-transaction-evidence');
    expect(transactionEvidence).toHaveTextContent('Recorder document');
    expect(transactionEvidence).toHaveTextContent('00A-00127');
    expect(transactionEvidence).toHaveTextContent('Grantor');
    expect(transactionEvidence).toHaveTextContent('Northwest Holdings LLC');
    expect(transactionEvidence).toHaveTextContent('Grantee');
    expect(transactionEvidence).toHaveTextContent('Riverbend Housing Trust');

    const evidence = screen.getByTestId('salesforge-source-evidence');
    expect(evidence).toHaveTextContent('public reference not county certified');
    expect(evidence).toHaveTextContent('public recorder export');
    expect(evidence).toHaveTextContent('spokane sales candidate index');
    expect(evidence).toHaveTextContent('needs source confirmation');
    expect(evidence).toHaveTextContent('review required');
    expect(evidence).toHaveTextContent('91.0%');
    expect(evidence).toHaveTextContent('78.0%');
    expect(evidence).toHaveTextContent('https://example.wa.gov/sales/record-1');
    expect(evidence).toHaveTextContent('abc123');
    expect(evidence.querySelectorAll('.sf-null-flag')).not.toHaveLength(0);
    expect(screen.getByText(/Reference evidence only/i)).toBeInTheDocument();

    const decisionControl = screen.getByRole('textbox', { name: 'Research notes' });
    expect(
      transactionEvidence.compareDocumentPosition(decisionControl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      evidence.compareDocumentPosition(decisionControl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(evidence.querySelector('a')).toBeNull();
  });

  it('keeps the legacy statistics client contract-declared without changing method shapes', () => {
    expect(statisticsApiContractMetadata.contractId).toBe('terraforge_statistics_compat_v1');
    expect(statisticsApiContractMetadata.implementationContractId).toBe('statistics_ratio_study_compat_v1');
    expect(statisticsAPI.contractMetadata).toBe(statisticsApiContractMetadata);
    expect(typeof statisticsAPI.getStrata).toBe('function');
    expect(typeof statisticsAPI.getOutliers).toBe('function');
  });
});
