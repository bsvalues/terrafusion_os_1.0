import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

vi.mock('../hooks/useCountyStudyHub', () => ({ useCountyStudyHub: () => ({}) }));
vi.mock('../hooks/useStudyData', () => ({ useStudyData: () => ({ retryAll: vi.fn() }) }));
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

  it('county level renders Benton valuation risk surfaces instead of a city-first table', () => {
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
