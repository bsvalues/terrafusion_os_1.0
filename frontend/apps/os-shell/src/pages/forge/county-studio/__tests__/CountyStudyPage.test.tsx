import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { CountyStudyPage } from '../CountyStudyPage';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type {
  CountyHealthSummaryDto,
  CountySegmentDto,
  CityRollupRowDto,
  NeighborhoodRollupRowDto,
} from '../types/countyStudio.types';

const { mockNavigate, activateModuleMock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  activateModuleMock: vi.fn(),
}));

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../hooks/useCountyStudyHub', () => ({ useCountyStudyHub: () => ({}) }));
vi.mock('../hooks/useStudyData', () => ({ useStudyData: () => ({ retryAll: vi.fn() }) }));
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));
vi.mock('../countyStudyApi', async (importActual) => {
  const actual = await importActual<typeof import('../countyStudyApi')>();
  return {
    ...actual,
    exceptionApi: {
      ...actual.exceptionApi,
      listDownstreamReceipts: vi.fn(() => new Promise(() => {})),
    },
  };
});
vi.mock('../../atlas-live/hooks/useAtlasMapData', () => ({
  useAtlasMapData: () => ({
    countyContext: {
      contractId: 'county_data_trust_launch_context_v1',
      countyId: 'benton',
      countyName: 'Benton',
      countyCode: '005',
      segmentId: null,
      neighborhoodCode: null,
      studyId: 'study-1',
      taxYear: 2026,
      primarySourceMode: 'local_pacs_mirror',
      prometheusStatus: 'automated_with_review',
      latestSaleDate: '2026-01-13',
      stagedSales: 59559,
      needsReview: 730,
      detailRoute: '/launch-data/washington/counties/005.json',
      salesRoute: '/launch-data/washington/sales/by-county/005.json',
      geometryAvailability: 'compatibility',
      geometryMessage: 'Compatibility geometry feed active.',
      trustTier: 'production_provisional',
      trustLabel: 'Production Provisional',
      dataTrustBadges: ['Production Provisional'],
      databasePosture: 'TerraFusion.Benton.Operational',
      launchContextPosture: 'Benton operational/provisional lane.',
      productionClaimAllowed: false,
      dataTrustMessage: 'Benton operational geometry context.',
    },
    outlines: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[-119.4, 46.2], [-119.3, 46.2], [-119.3, 46.3], [-119.4, 46.3], [-119.4, 46.2]]] },
          properties: {
            neighborhoodCode: 'NBHD-K1',
            medianRatio: 0.84,
            saleCount: 22,
            grade: 'F',
            fillHsl: '16 55% 56% / 0.24',
            strokeHsl: '16 62% 48%',
          },
        },
      ],
    },
    parcels: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[-119.36, 46.24], [-119.35, 46.24], [-119.35, 46.25], [-119.36, 46.25], [-119.36, 46.24]]] },
          properties: {
            parcelId: 'P-100',
            neighborhoodCode: 'NBHD-K1',
            assessedValue: 420000,
            propertyClass: 'R',
            areaAcres: 0.2,
            yearBuilt: 1999,
            situsAddress: '100 Columbia Dr',
            primaryUse: 'Residential',
            saleDate: '2026-01-13',
            salePrice: 500000,
            qualDecision: 'Qualified',
            ratio: 0.84,
            nbhdMedianRatio: 0.84,
            ratioDeviation: -0.16,
            isOutlier: true,
          },
        },
      ],
    },
    loading: false,
    error: null,
    scopeMessage: 'Compatibility geometry feed active.',
  }),
}));
vi.mock('../../geo/v2/GeoForgeV2Map', () => ({
  GeoForgeV2Map: ({
    selectedNeighborhoodCode,
    onNeighborhoodClick,
    onParcelClick,
    onViewportChange,
  }: {
    selectedNeighborhoodCode: string | null;
    onNeighborhoodClick: (code: string) => void;
    onParcelClick: (parcel: unknown) => void;
    onViewportChange: (bbox: [number, number, number, number], zoom: number) => void;
  }) => (
    <div
      data-testid="mock-geoforge-v2-map"
      data-selected-neighborhood-code={selectedNeighborhoodCode ?? ''}
      role="application"
      aria-label="Mock GeoForge v2 Atlas canvas"
    >
      <button type="button" data-testid="mock-atlas-neighborhood-nbhd-k1" onClick={() => onNeighborhoodClick('NBHD-K1')}>
        Atlas neighborhood NBHD-K1
      </button>
      <button
        type="button"
        data-testid="mock-atlas-parcel-p100"
        onClick={() => onParcelClick({
          parcelId: 'P-100',
          neighborhoodCode: 'NBHD-K1',
          assessedValue: 420000,
          propertyClass: 'R',
          areaAcres: 0.2,
          yearBuilt: 1999,
          situsAddress: '100 Columbia Dr',
          primaryUse: 'Residential',
          saleDate: '2026-01-13',
          salePrice: 500000,
          qualDecision: 'Qualified',
          ratio: 0.84,
          nbhdMedianRatio: 0.84,
          ratioDeviation: -0.16,
          isOutlier: true,
        })}
      >
        Atlas parcel P-100
      </button>
      <button
        type="button"
        data-testid="mock-atlas-viewport"
        onClick={() => onViewportChange([-119.47, 46.16, -119.17, 46.39], 11.25)}
      >
        Set Atlas viewport
      </button>
    </div>
  ),
}));
vi.mock('../components/CohortCreationDialog', () => ({ CohortCreationDialog: () => null }));
vi.mock('../components/CountyStatisticsWorkbenchPanel', () => ({
  CountyStatisticsWorkbenchPanel: () => (
    <div data-testid="mock-county-analytics-workbench">native county analytics workbench</div>
  ),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

const MOCK_SEG: CountySegmentDto = {
  segmentId: 's1', segmentSetId: 'ss1', name: 'NBHD-K1 · R1 · STANDARD',
  revalArea: 2,
  buildingType: 'R1',
  qualityGrade: 'STANDARD',
  segmentType: 'Residential', parcelCount: 412, medianRatio: 0.97,
  cod: 14.2, prd: 1.01, stabilityScore: 72, riskScore: 35,
  exceptionCount: 5, geographyRef: 'NBHD-K1',
};

const FAILING_SEG: CountySegmentDto = {
  segmentId: 's2', segmentSetId: 'ss1', name: 'NBHD-K1 · R1 · GOOD',
  revalArea: 2,
  buildingType: 'R1',
  qualityGrade: 'GOOD',
  modelGroup: 'MG-12',
  valueTier: 'Upper',
  taxingDistrict: 'Kiona-Benton SD #52',
  segmentType: 'Commercial', parcelCount: 89, medianRatio: 0.84,
  cod: 22.8, prd: 1.06, stabilityScore: 48, riskScore: 78,
  exceptionCount: 22, geographyRef: 'NBHD-K1',
};

const LARGE_EXPOSURE_SEG: CountySegmentDto = {
  segmentId: 's3', segmentSetId: 'ss1', name: 'NBHD-LOW - R1 - STANDARD',
  revalArea: 7,
  buildingType: 'R1',
  qualityGrade: 'STANDARD',
  modelGroup: 'MG-LOW',
  valueTier: 'Entry',
  taxingDistrict: 'Large Rural District',
  segmentType: 'Residential', parcelCount: 2000, medianRatio: 0.98,
  cod: 10.1, prd: 1.01, stabilityScore: 90, riskScore: 18,
  exceptionCount: 0, geographyRef: 'NBHD-LOW',
};

const HIGH_RISK_SEG: CountySegmentDto = {
  segmentId: 's4', segmentSetId: 'ss1', name: 'NBHD-HIGH - R1 - AVERAGE',
  revalArea: 8,
  buildingType: 'R1',
  qualityGrade: 'AVERAGE',
  modelGroup: 'MG-HIGH',
  valueTier: 'Middle',
  taxingDistrict: 'Mid County District',
  segmentType: 'Residential', parcelCount: 120, medianRatio: 0.91,
  cod: 18.5, prd: 1.04, stabilityScore: 58, riskScore: 64,
  exceptionCount: 8, geographyRef: 'NBHD-HIGH',
};

const MOCK_CITY_ROW: CityRollupRowDto = {
  city: 'Kennewick', segmentCount: 2, parcelCount: 501,
  medianRatio: 0.95, cod: 15.0, prd: 1.02,
  exceptionCount: 27, exceptionRate: 0.054,
  worstSegmentName: 'NBHD-K1 · R1 · GOOD', worstSegmentMedianRatio: 0.84,
  worstSegmentNeighborhoodCode: 'NBHD-K1',
  worstSegmentRevalArea: 2,
  worstSegmentBuildingType: 'R1',
  worstSegmentQualityGrade: 'GOOD',
  complianceStatus: 'MarginalCompliance',
};

const MOCK_NBHD_ROW: NeighborhoodRollupRowDto = {
  neighborhoodCode: 'NBHD-K1', neighborhoodName: 'NBHD-K1', city: 'Kennewick',
  revalArea: 2,
  segmentCount: 2, parcelCount: 501, medianRatio: 0.95, cod: 15.0, prd: 1.02,
  stabilityScore: 60, riskScore: 55, exceptionCount: 27, exceptionRate: 0.054,
  complianceStatus: 'MarginalCompliance',
};

const MOCK_HEALTH: CountyHealthSummaryDto = {
  contractId: 'terraforge_operational_health_v1',
  correctionPriorityContractId: 'terraforge_correction_priority_v1',
  studyId: 'study-1',
  countyId: 'benton',
  taxYear: 2026,
  parcelCount: 501,
  ratioCount: 80,
  medianRatio: 0.95,
  cod: 18,
  prd: 1.02,
  stabilityScore: 60,
  riskScore: 55,
  exceptionCount: 27,
  complianceStatus: 'NonCompliant',
  topAlerts: [
    {
      segmentId: 's2',
      segmentName: 'NBHD-K1 · R1 · GOOD',
      neighborhoodCode: 'NBHD-K1',
      revalArea: 2,
      buildingType: 'R1',
      qualityGrade: 'GOOD',
      city: 'Kennewick',
      parcelCount: 89,
      medianRatio: 0.84,
      cod: 22.8,
      prd: 1.06,
      exceptionCount: 22,
      compositeRisk: 92,
      reasons: ['COD 22.8 exceeds IAAO ceiling (20)'],
    },
  ],
  criticalCount: 1,
  warningCount: 1,
  healthyCount: 0,
  derivedAt: '2026-04-26T00:00:00Z',
};

describe('CountyStudyPage', () => {
  beforeEach(() => {
    act(() => {
      mockNavigate.mockClear();
      activateModuleMock.mockClear();
      useCountyStudioStore.getState().setStudy(null);
      useCountyStudioStore.getState().setSegments([]);
      useCountyStudioStore.getState().setCityRollup([]);
      useCountyStudioStore.getState().setNeighborhoodRollup([]);
      useCountyStudioStore.getState().drillToCounty();
      useCountyStudioStore.getState().setLoadStatus('cityRollup', 'success');
      useCountyStudioStore.getState().setLoadStatus('neighborhoodRollup', 'success');
    });
  });

  it('renders the studio header', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByText(/TerraForge County Studio/i)).toBeInTheDocument();
  });

  it('shows "Open Study" button when no study is active', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /open study/i })).toBeInTheDocument();
  });

  it('does NOT show the pop-out map button when no study is active', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: /pop out map/i })).not.toBeInTheDocument();
  });

  it('shows the pop-out map button when a study is active', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: null, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /pop out map/i })).toBeInTheDocument();
  });

  it('page-level Atlas handoff preserves valuation context without city as a primary key', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1', 2);
      useCountyStudioStore.getState().selectSegment('s2');
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /pop out map/i }));

    const atlasHref = mockNavigate.mock.calls.at(-1)?.[0] as string;
    const params = new URLSearchParams(atlasHref.split('?')[1]);
    expect(params.get('studyId')).toBe('study-1');
    expect(params.get('countyId')).toBe('benton');
    expect(params.get('countyName')).toBe('Benton County');
    expect(params.get('taxYear')).toBe('2026');
    expect(params.get('neighborhoodCode')).toBe('NBHD-K1');
    expect(params.get('revalArea')).toBe('2');
    expect(params.get('segmentId')).toBe('s2');
    expect(params.get('source')).toBe('county-studio');
    expect(params.get('activeLayers')).toContain('parcels');
    expect(params.get('activeLayers')).toContain('taxing-districts');
    expect(params.get('activeLayers')).toContain('valuation-risk');
    expect(params.get('selectedRiskObject')).toBe('s2');
    expect(params.get('city')).toBeNull();
  });

  it('page-level Atlas handoff preserves active map bounds when the embedded map reports viewport changes', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
      useCountyStudioStore.getState().focusRiskSurfaceMapObject('NBHD-K1', null, 2);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('mock-atlas-viewport'));
    fireEvent.click(screen.getByRole('button', { name: /pop out map/i }));

    const atlasHref = mockNavigate.mock.calls.at(-1)?.[0] as string;
    const params = new URLSearchParams(atlasHref.split('?')[1]);
    expect(params.get('mapBounds')).toBe('-119.47,46.16,-119.17,46.39');
    expect(params.get('mapZoom')).toBe('11.25');
    expect(params.get('selectedRiskObject')).toBe('NBHD-K1');
  });

  it('opens the native County Studio analytics workbench mode', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: null, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('county-studio-mode-statistics'));

    expect(screen.getByTestId('cs-statistics-mode')).toBeInTheDocument();
    expect(screen.getByTestId('mock-county-analytics-workbench')).toHaveTextContent('native county analytics workbench');
  });

  // ── Drill lattice ────────────────────────────────────────────────────

  it('renders the drill breadcrumb at all levels', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByTestId('drill-breadcrumb')).toBeInTheDocument();
    expect(screen.getByTestId('crumb-county')).toBeInTheDocument();
  });

  it('county level renders Benton valuation risk surfaces instead of a city-priority table', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    const panel = screen.getByTestId('cs-drill-panel');
    expect(panel.dataset.drillLevel).toBe('county');
    expect(screen.getByTestId('risk-surface-command-center')).toBeInTheDocument();
    expect(screen.getByText('Revaluation Cycle Risk')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood Risk')).toBeInTheDocument();
    expect(screen.getByText('Model Group Risk')).toBeInTheDocument();
    expect(screen.getByText('Taxing District Exposure')).toBeInTheDocument();
    expect(screen.getByText('Value Tier Equity')).toBeInTheDocument();
    expect(screen.getByText('Unified Risk Ledger')).toBeInTheDocument();
    expect(screen.queryByText('Kennewick')).not.toBeInTheDocument();
    expect(screen.getByTestId('county-operational-scope-note')).toHaveTextContent(/valuation decisions are made and defended/i);
  });

  it('mounts embedded TerraAtlas GIS as the primary center surface above the ledger', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });

    const workspace = screen.getByTestId('county-studio-atlas-workspace');
    const canvas = screen.getByTestId('county-studio-embedded-atlas-canvas');
    const ledger = screen.getByTestId('unified-risk-ledger');

    expect(workspace).toBeInTheDocument();
    expect(canvas).toHaveAttribute('data-layout-role', 'primary-center-surface');
    expect(canvas).toHaveAttribute('data-atlas-connected', 'true');
    expect(screen.getByTestId('mock-geoforge-v2-map')).toBeInTheDocument();
    expect(workspace).toHaveTextContent('Embedded TerraAtlas GIS');
    expect(workspace).toHaveTextContent('Parcels');
    expect(workspace).toHaveTextContent('Parcel boundaries');
    expect(workspace).toHaveTextContent('Taxing districts');
    expect(workspace).toHaveTextContent('Valuation risk');
    expect(workspace).toHaveTextContent('Ratio / COD / PRD risk');
    expect(canvas.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the embedded Atlas workspace ahead of county health dashboards in the primary county view', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });

    const workspace = screen.getByTestId('county-studio-atlas-workspace');
    const health = screen.getByTestId('county-operational-scope-note');

    expect(workspace.compareDocumentPosition(health) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses a bounded county GIS stage with ledger and statistics below the map', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });

    const stage = screen.getByTestId('county-studio-gis-stage');
    const workspace = screen.getByTestId('county-studio-atlas-workspace');
    const bottomAnalytics = screen.getByTestId('county-studio-bottom-analytics');
    const ledger = screen.getByTestId('unified-risk-ledger');
    const bottomDeck = screen.getByTestId('county-studio-bottom-deck');

    expect(stage).toContainElement(workspace);
    expect(bottomAnalytics).toContainElement(ledger);
    expect(bottomAnalytics).toContainElement(bottomDeck);
    expect(workspace.compareDocumentPosition(bottomAnalytics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId('county-studio-map-inspector')).not.toBeInTheDocument();
  });

  it('map neighborhood selection focuses the ledger and object inspector without selectedCity', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('mock-atlas-neighborhood-nbhd-k1'));

    expect(useCountyStudioStore.getState().selectedCity).toBeNull();
    expect(useCountyStudioStore.getState().selectedNeighborhood).toBe('NBHD-K1');
    expect(useCountyStudioStore.getState().selectedNeighborhoodRevalArea).toBe(2);
    expect(useCountyStudioStore.getState().selectedSegmentId).toBe('s2');
    expect(screen.getByTestId('right-rail-scope-label')).toHaveTextContent('Neighborhood NBHD-K1 · Reval 2');
  });

  it('ledger row selection highlights the embedded map object without drilling through city', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG, LARGE_EXPOSURE_SEG, HIGH_RISK_SEG]);
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    const targetRow = screen.getAllByTestId('risk-ledger-row')
      .find((row) => row.textContent?.includes('Neighborhood NBHD-K1'));
    expect(targetRow).toBeTruthy();
    fireEvent.click(targetRow!);

    expect(useCountyStudioStore.getState().selectedCity).toBeNull();
    expect(useCountyStudioStore.getState().selectedNeighborhood).toBe('NBHD-K1');
    expect(screen.getByTestId('mock-geoforge-v2-map')).toHaveAttribute('data-selected-neighborhood-code', 'NBHD-K1');
    expect(targetRow).toHaveAttribute('data-focused', 'true');
  });

  it('map parcel selection routes parcel-scoped action into Property Workbench with Atlas/Forge/Dossier context', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', countyName: 'Benton County', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('mock-atlas-parcel-p100'));
    fireEvent.click(screen.getByTestId('county-studio-open-parcel-workbench'));

    expect(useCountyStudioStore.getState().selectedCity).toBeNull();
    expect(useCountyStudioStore.getState().pendingSelection?.parcelIds).toEqual(['P-100']);
    expect(activateModuleMock).toHaveBeenCalledWith('property-workbench', expect.objectContaining({
      source: 'system',
      metadata: expect.objectContaining({
        countyId: 'benton',
        taxYear: 2026,
        studyId: 'study-1',
        parcelId: 'P-100',
        segmentId: 's2',
        neighborhoodCode: 'NBHD-K1',
        revalArea: 2,
        initialTab: 'atlas',
        tabs: {
          atlas: 'parcel-gis',
          forge: 'parcel-valuation',
          dossier: 'evidence',
        },
      }),
    }));
    expect(activateModuleMock.mock.calls.at(-1)?.[1].metadata).not.toHaveProperty('city');
  });

  it('renders the unified risk ledger as the first command queue before supporting boards', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG, LARGE_EXPOSURE_SEG, HIGH_RISK_SEG]);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });

    const commandCenter = screen.getByTestId('risk-surface-command-center');
    const ledger = screen.getByTestId('unified-risk-ledger');
    const firstBoard = screen.getByTestId('risk-board-revaluation-cycle');

    expect(commandCenter.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ledger.compareDocumentPosition(firstBoard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ledger).toHaveTextContent('Critical');
    expect(ledger).toHaveTextContent('High');
    expect(ledger).toHaveTextContent('Medium');
    expect(ledger).toHaveTextContent('Low');
  });

  it('filters and sorts the unified risk ledger without introducing city grouping', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG, LARGE_EXPOSURE_SEG, HIGH_RISK_SEG]);
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });

    const ledger = screen.getByTestId('unified-risk-ledger');
    fireEvent.click(screen.getByTestId('risk-ledger-filter-critical'));

    expect(ledger).toHaveTextContent('MG-12');
    expect(ledger).not.toHaveTextContent('Neighborhood NBHD-LOW');
    expect(ledger).not.toHaveTextContent('Kennewick');

    fireEvent.click(screen.getByTestId('risk-ledger-filter-all'));
    fireEvent.click(screen.getByTestId('risk-ledger-sort-exposure'));

    const labels = within(ledger).getAllByTestId('risk-ledger-object').map((node) => node.textContent);
    expect(labels[0]).toBe('Neighborhood NBHD-LOW');
  });

  it('risk ledger opens neighborhood evidence without routing through a city crumb', () => {
    const sameNeighborhoodWrongCycle: CountySegmentDto = {
      ...MOCK_SEG,
      segmentId: 's-wrong-cycle',
      name: 'NBHD-K1 - R5 - STANDARD',
      revalArea: 5,
    };

    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG, sameNeighborhoodWrongCycle]);
      useCountyStudioStore.getState().drillToCounty();
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /open neighborhood evidence for neighborhood NBHD-K1/i }));

    const panel = screen.getByTestId('cs-drill-panel');
    expect(panel.dataset.drillLevel).toBe('neighborhood');
    expect(screen.getByTestId('crumb-risk-surface')).toHaveTextContent('Risk Surface');
    expect(screen.getByTestId('crumb-neighborhood')).toHaveTextContent(/Neighborhood NBHD-K1 · Reval 2/i);
    expect(screen.queryByTestId('crumb-city')).not.toBeInTheDocument();
    expect(screen.getByText('Commercial · R1 · GOOD')).toBeInTheDocument();
    expect(screen.queryByText('NBHD-K1 - R5 - STANDARD')).not.toBeInTheDocument();
    expect(useCountyStudioStore.getState().selectedCity).toBeNull();
    expect(useCountyStudioStore.getState().selectedNeighborhoodRevalArea).toBe(2);
  });

  it('city level renders the NeighborhoodRollupTable for selectedCity', () => {
    act(() => {
      useCountyStudioStore.getState().setNeighborhoodRollup([MOCK_NBHD_ROW]);
      useCountyStudioStore.getState().drillToCity('Kennewick');
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    const panel = screen.getByTestId('cs-drill-panel');
    expect(panel.dataset.drillLevel).toBe('city');
    expect(screen.getByText(/Neighborhood NBHD-K1/i)).toBeInTheDocument();
  });

  it('neighborhood level renders SegmentTable filtered to selectedNeighborhood', () => {
    const otherHood: CountySegmentDto = {
      ...MOCK_SEG, segmentId: 's9', name: 'Other Hood Segment', geographyRef: 'NBHD-K2', revalArea: 5,
    };
    const wrongReval: CountySegmentDto = {
      ...MOCK_SEG, segmentId: 's10', name: 'NBHD-K1 · R5 · STANDARD', revalArea: 5,
    };
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, otherHood, wrongReval]);
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1', 2);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    // Only the segment whose geographyRef and reval match the drill should render.
    expect(screen.getByText('Residential · R1 · STANDARD')).toBeInTheDocument();
    expect(screen.queryByText('Other Hood Segment')).not.toBeInTheDocument();
    expect(screen.queryByText('NBHD-K1 · R5 · STANDARD')).not.toBeInTheDocument();
  });

  it('severity filter pill (Critical) hides healthy segments at neighborhood level', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1', 2);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('segment-filter-critical'));
    // FAILING_SEG: cod=22.8 AND stability=48 → critical. MOCK_SEG: cod=14.2, stability=72 → not critical.
    expect(screen.getByText('Commercial · R1 · GOOD')).toBeInTheDocument();
    expect(screen.queryByText('Residential · R1 · STANDARD')).not.toBeInTheDocument();
  });

  it('critical severity bar opens a filtered drill on the failing segment scope', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: 'ss1', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
      useCountyStudioStore.getState().setHealthSummary(MOCK_HEALTH);
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
      useCountyStudioStore.getState().drillToCounty();
    });

    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('severity-bar-critical'));

    const panel = screen.getByTestId('cs-drill-panel');
    expect(panel.dataset.drillLevel).toBe('neighborhood');
    expect(screen.getByTestId('segment-filter-critical')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Commercial · R1 · GOOD')).toBeInTheDocument();
    expect(screen.queryByText('Residential · R1 · STANDARD')).not.toBeInTheDocument();
    expect(useCountyStudioStore.getState().selectedSegmentId).toBe('s2');
  });
});
