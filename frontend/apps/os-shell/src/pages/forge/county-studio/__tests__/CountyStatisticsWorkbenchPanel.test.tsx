import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { vi } from 'vitest';
import { CountyStatisticsWorkbenchPanel } from '../components/CountyStatisticsWorkbenchPanel';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

const forgeStatsState = {
  studyResult: {
    medianRatio: 0.927,
    meanRatio: 0.94,
    weightedMeanRatio: 0.959,
    cod: 41.3,
    prd: 1.399,
    prb: 0.12,
    cov: 0.2,
    sampleSize: 525,
    outlierCount: 12,
    tierMedians: { q1: 0.9, q2: 0.93, q3: 0.95, q4: 0.98 },
    tierSlope: -0.04,
    iaaoCompliant: false,
    complianceNotes: [],
    computedAt: '2026-04-29T00:00:00Z',
    params: {
      taxYear: 2026,
      salesWindowMonths: 12,
      outlierMethod: 'iqr',
    },
  },
  fetchStudy: vi.fn(),
  setFilter: vi.fn(),
  loadComparison: vi.fn(),
  loading: false,
};

const apiFetchMock = vi.hoisted(() =>
  vi.fn((url: string) => Promise.resolve({
    json: () => Promise.resolve(
      url.includes('income-approach/market-data/benton')
        ? {
            county: 'Benton',
            state: 'WA',
            medianHouseholdIncome: 87500,
            unemploymentRate: 3.1,
            populationGrowthRate: 1.8,
            medianHomePrice: 485000,
            medianPricePerSqft: 218,
            medianDaysOnMarket: 18,
            monthsOfInventory: 2.8,
            employmentSectors: [],
            effectiveDate: '2025-01-01',
            source: 'US Census ACS 2024, WA ESD, Benton-Franklin Trends',
          }
        : [],
    ),
  })),
);

vi.mock('@/stores/forgeStatisticsStore', () => ({
  useForgeStatisticsStore: (selector: (state: typeof forgeStatsState) => unknown) =>
    selector(forgeStatsState),
}));

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: vi.fn(() => Promise.resolve({
    studyId: 'study-1',
    countyId: '19190019-1919-1919-1919-191919191919',
    taxYear: 2026,
    mode: 'StatisticsCompat',
    contractId: 'statistics_ratio_study_compat_v1',
    population: 'qualified sale ratio rows',
    identityJoin: 'ComparableSales.ParcelId -> Properties.ParcelNumber',
    saleWindow: {
      taxYear: 2026,
      lookbackStart: '2024-01-01T00:00:00Z',
      lookbackEndExclusive: '2026-01-01T00:00:00Z',
      rule: 'SalesYear=2026, or null SalesYear with SaleDate >= 2024-01-01 and < 2026-01-01',
    },
    qualificationPolicy: 'QualificationDecision == qualified',
    suppressionPolicy: 'Exclude SuppressOnRatioRptCd=T and IncludeNoCalc=true.',
    outlierPolicy: 'Report countWithRatio before trimming; compute stats on Tukey/IQR-trimmed rows.',
    trustPosture: ['Production Provisional', 'Sync-Derived', 'Converted Legacy Sensitive'],
    totalSales: 36,
    countWithRatio: 36,
    outliersExcluded: 1,
    trimmedCount: 35,
    medianRatio: 0.7224,
    meanRatio: 0.6519,
    weightedMeanRatio: 0.3053,
    cod: 40.24,
    prd: 2.1352,
    prb: -0.1672,
    cov: 52.21,
    tierSlope: -0.1672,
    tierMedians: { q1: 0.7046, q2: 0.9319, q3: 0.9422, q4: 0.1866 },
    conversionSensitiveCounts: {
      candidateRows: 52,
      decisionQualifiedRows: 0,
      recommendationQualifiedRows: 36,
      recommendationNullDefaultQualifiedRows: 0,
      saleQualificationOnlyQualifiedRows: 0,
      suppressedExcludedRows: 0,
      includeNoCalcExcludedRows: 0,
      salesYearAssignedRows: 52,
      nullSalesYearWindowRows: 0,
    },
    parcelIdentityReconciliation: {
      joinMode: 'ComparableSales.ParcelId -> Properties.ParcelNumber',
      saleRows: 36,
      distinctSaleParcelIds: 36,
      matchedPropertyRows: 36,
      countWithRatio: 36,
      unmatchedSaleRows: 0,
    },
    computedAt: '2026-04-30T00:00:00Z',
  })),
  apiFetch: apiFetchMock,
}));

vi.mock('../../statistics/RatioStudyPanel', () => ({
  default: () => <div data-testid="mock-ratio-panel">ratio study capability</div>,
}));

vi.mock('../../statistics/StratifiedStudyPanel', () => ({
  StratifiedStudyPanel: ({ countyScopeOverride }: { countyScopeOverride?: { countyId: string | null } }) => (
    <div data-testid="mock-stratified-panel">stratified {countyScopeOverride?.countyId}</div>
  ),
}));

vi.mock('../../statistics/VEIDashboard', () => ({
  default: ({
    selectedTaxYear,
    onTaxYearChange,
  }: {
    selectedTaxYear: number;
    onTaxYearChange: (year: number) => void;
  }) => (
    <div data-testid="mock-vei-panel">
      equity capability
      <span data-testid="mock-vei-tax-year">{selectedTaxYear}</span>
      <button type="button" data-testid="mock-vei-tax-year-2025" onClick={() => onTaxYearChange(2025)}>
        2025
      </button>
    </div>
  ),
}));

vi.mock('../../statistics/charts/CODTrendChart', () => ({
  default: () => <div data-testid="mock-cod-trend">cod trend</div>,
}));

vi.mock('../../statistics/charts/PRDTrendChart', () => ({
  default: () => <div data-testid="mock-prd-trend">prd trend</div>,
}));

vi.mock('../../statistics/OutlierReviewPanel', () => ({
  OutlierReviewPanel: () => <div data-testid="mock-outliers-panel">outliers capability</div>,
}));

vi.mock('../../statistics/ModelComparisonPanel', () => ({
  ModelComparisonPanel: () => <div data-testid="mock-comparison-panel">comparison capability</div>,
}));

vi.mock('../../statistics/AssessmentIntelligence', () => ({
  default: ({
    outliers,
    appealRisk,
  }: {
    outliers: { totalOutliers: number } | null;
    appealRisk: Array<{ risk: string; count: number }>;
  }) => (
    <div data-testid="mock-assessment-intelligence">
      exceptions {outliers?.totalOutliers ?? 0} · risk buckets {appealRisk.length}
    </div>
  ),
}));

vi.mock('../../statistics/QualityControlPanel', () => ({
  default: ({ dimensions }: { dimensions: Array<{ name: string; score: number }> }) => (
    <div data-testid="mock-quality-control">quality dimensions {dimensions.length}</div>
  ),
}));

vi.mock('../../statistics/MarketAnalyticsDashboard', () => ({
  default: ({ metrics }: { metrics: Array<{ label: string }> }) => (
    <div data-testid="mock-market-analytics">market metrics {metrics.length}</div>
  ),
}));

vi.mock('../../statistics/MarketDashboard', () => ({
  default: ({ status }: { status: { condition: string } | null }) => (
    <div data-testid="mock-market-dashboard">market {status?.condition ?? 'none'}</div>
  ),
}));

vi.mock('../../statistics/EconomicIndicators', () => ({
  default: ({ metrics }: { metrics: Array<{ label: string }> }) => (
    <div data-testid="mock-economic-indicators">economic metrics {metrics.length}</div>
  ),
}));

vi.mock('../../statistics/ValueDriverPanel', () => ({
  ValueDriverPanel: ({ countyScopeOverride }: { countyScopeOverride?: { countyId: string | null } }) => (
    <div data-testid="mock-value-driver-panel">value drivers {countyScopeOverride?.countyId}</div>
  ),
}));

vi.mock('../../cost/CostRatioAnalysis', () => ({
  CostRatioAnalysis: () => <div data-testid="mock-cost-ratio-panel">calibration matrix</div>,
}));

vi.mock('../../cost/CostForgeDashboard', () => ({
  CostForgeDashboard: () => <div data-testid="mock-cost-dashboard">cost analytics</div>,
}));

vi.mock('../../statistics/panels/DiagnosticsTab', () => ({
  DiagnosticsTab: () => <div data-testid="mock-diagnostics-panel">diagnostics</div>,
}));

vi.mock('../../statistics/panels/SpatialTemporalTab', () => ({
  SpatialTemporalTab: () => <div data-testid="mock-spatial-temporal-panel">spatial temporal</div>,
}));

vi.mock('../../statistics/panels/CalibrationEngineTab', () => ({
  CalibrationEngineTab: () => <div data-testid="mock-calibration-engine-panel">calibration engine</div>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('CountyStatisticsWorkbenchPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1',
        countyId: '19190019-1919-1919-1919-191919191919',
        countyName: 'Benton County',
        taxYear: 2026,
        studyType: 'RatioStudy',
        status: 'Active',
        baselineVersion: null,
        activeSegmentSetId: null,
        createdAt: '',
        updatedAt: '',
        createdBy: '',
        updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([
        {
          segmentId: 'segment-1',
          segmentSetId: 'set-1',
          name: 'NBHD-101 · R1 · STANDARD',
          segmentType: 'Residential',
          geographyRef: '101',
          revalArea: 3,
          buildingType: 'R1',
          qualityGrade: 'STANDARD',
          parcelCount: 100,
          medianRatio: 0.88,
          cod: 22,
          prd: 1.08,
          stabilityScore: 55,
          riskScore: 82,
          exceptionCount: 11,
          ratioCount: 20,
          salesCount: 20,
        },
      ]);
      useCountyStudioStore.getState().setHealthSummary({
        studyId: 'study-1',
        countyId: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
        parcelCount: 100,
        ratioCount: 20,
        medianRatio: 0.88,
        cod: 22,
        prd: 1.08,
        stabilityScore: 55,
        riskScore: 82,
        exceptionCount: 11,
        complianceStatus: 'NonCompliant',
        topAlerts: [],
        criticalCount: 1,
        warningCount: 0,
        healthyCount: 0,
        derivedAt: '2026-04-29T00:00:00Z',
      });
    });
  });

  it('renders County Studio-owned analytics modes instead of an embedded Statistics Studio shell', () => {
    render(<CountyStatisticsWorkbenchPanel />, { wrapper });

    expect(screen.getByTestId('county-studio-statistics-workbench')).toBeInTheDocument();
    expect(screen.getByText('Study Analytics')).toBeInTheDocument();
    expect(screen.getByText('Ratio Study Evidence')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ratio-panel')).toHaveTextContent('ratio study capability');
    expect(screen.getByTestId('county-analytics-stratified')).toBeInTheDocument();
    expect(screen.getByTestId('county-analytics-equity')).toBeInTheDocument();
    expect(screen.getByTestId('county-analytics-assessment-intelligence')).toBeInTheDocument();
    expect(screen.getByTestId('county-analytics-quality-control')).toBeInTheDocument();
    expect(screen.getByTestId('county-analytics-market-context')).toBeInTheDocument();
    expect(screen.queryByTestId('statistics-studio')).not.toBeInTheDocument();
  });

  it('keeps statistics capability scoped to the active County Studio study', () => {
    render(<CountyStatisticsWorkbenchPanel />, { wrapper });

    fireEvent.click(screen.getByTestId('county-analytics-stratified'));

    expect(screen.getByTestId('mock-stratified-panel')).toHaveTextContent(
      '19190019-1919-1919-1919-191919191919',
    );
    expect(forgeStatsState.setFilter).toHaveBeenCalledWith({
      taxYear: 2026,
      countyId: '19190019-1919-1919-1919-191919191919',
    });
  });

  it('lets County Studio VEI explore another tax year without changing the study-scoped statistics filter', async () => {
    render(<CountyStatisticsWorkbenchPanel />, { wrapper });

    fireEvent.click(screen.getByTestId('county-analytics-equity'));

    expect(await screen.findByTestId('mock-vei-panel')).toBeInTheDocument();
    expect(screen.getByTestId('mock-vei-tax-year')).toHaveTextContent('2026');

    fireEvent.click(screen.getByTestId('mock-vei-tax-year-2025'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-vei-tax-year')).toHaveTextContent('2025');
      expect(apiFetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/terraforge/comparison-snapshots?taxYear=2025'),
        expect.any(Object),
      );
    });
    expect(forgeStatsState.setFilter).not.toHaveBeenCalledWith({
      taxYear: 2025,
      countyId: '19190019-1919-1919-1919-191919191919',
    });
  });

  it('derives intelligence and quality panels from active study health and segment data', () => {
    render(<CountyStatisticsWorkbenchPanel />, { wrapper });

    fireEvent.click(screen.getByTestId('county-analytics-assessment-intelligence'));
    expect(screen.getByTestId('mock-assessment-intelligence')).toHaveTextContent('exceptions 11');
    expect(screen.getByTestId('mock-assessment-intelligence')).toHaveTextContent('risk buckets 1');

    fireEvent.click(screen.getByTestId('county-analytics-quality-control'));
    expect(screen.getByTestId('mock-quality-control')).toHaveTextContent('quality dimensions 4');
  });

  it('surfaces market context from the county data endpoint inside County Analytics', async () => {
    render(<CountyStatisticsWorkbenchPanel />, { wrapper });

    fireEvent.click(screen.getByTestId('county-analytics-market-context'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-market-analytics')).toHaveTextContent('market metrics 4');
      expect(screen.getByTestId('mock-market-dashboard')).toHaveTextContent('market Warm');
      expect(screen.getByTestId('mock-economic-indicators')).toHaveTextContent('economic metrics 4');
    });
  });
});
