import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { CountyStudyPage } from '../CountyStudyPage';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto, CityRollupRowDto, NeighborhoodRollupRowDto } from '../types/countyStudio.types';

vi.mock('../hooks/useCountyStudyHub', () => ({ useCountyStudyHub: () => ({}) }));
vi.mock('../hooks/useStudyData', () => ({ useStudyData: () => ({ retryAll: vi.fn() }) }));
vi.mock('../components/CohortCreationDialog', () => ({ CohortCreationDialog: () => null }));
vi.mock('../../statistics/StatisticsStudio', () => ({
  StatisticsStudio: ({ embeddedInCountyStudio }: { embeddedInCountyStudio?: boolean }) => (
    <div data-testid="mock-statistics-studio">
      {embeddedInCountyStudio ? 'embedded full statistics lab' : 'standalone statistics studio'}
    </div>
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

  it('embeds the full Statistics Studio surface as a County Studio workspace mode', () => {
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
    expect(screen.getByTestId('county-studio-statistics-lab')).toBeInTheDocument();
    expect(screen.getByTestId('mock-statistics-studio')).toHaveTextContent('embedded full statistics lab');
  });

  // ── Drill lattice ────────────────────────────────────────────────────

  it('renders the drill breadcrumb at all levels', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByTestId('drill-breadcrumb')).toBeInTheDocument();
    expect(screen.getByTestId('crumb-county')).toBeInTheDocument();
  });

  it('county level renders the CityRollupTable', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    const panel = screen.getByTestId('cs-drill-panel');
    expect(panel.dataset.drillLevel).toBe('county');
    expect(screen.getByText('Kennewick')).toBeInTheDocument();
    expect(screen.getByTestId('county-operational-scope-note')).toHaveTextContent(/neighborhood and reval-area segment/i);
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
});
