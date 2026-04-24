import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { act } from 'react';
import { LeftRail } from '../components/LeftRail';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type {
  CountyCohortDto,
  CountyScenarioDto,
  CountyStudySessionDto,
} from '../types/countyStudio.types';

vi.mock('../countyStudyApi', () => ({
  segmentSetApi: {
    list: vi.fn(),
    segments: vi.fn(),
    derive: vi.fn(),
  },
  studyApi: {
    get: vi.fn(),
  },
}));

// Stub the data-loading hook so it does not reset store state mid-test.
const retrySegmentsMock = vi.fn(async () => {});
vi.mock('../hooks/useStudyData', () => ({
  useStudyData: () => ({
    retrySegments: retrySegmentsMock,
    retryCohorts: vi.fn(),
    retryScenarios: vi.fn(),
    retryAll: vi.fn(),
  }),
}));

import { segmentSetApi, studyApi } from '../countyStudyApi';

const MOCK_COHORT: CountyCohortDto = {
  cohortId: 'c1', studyId: 'study-1', name: 'West Side',
  selectionType: 'Visual', parcelCount: 80, isHybrid: false, createdAt: '',
};

const MOCK_SCENARIO: CountyScenarioDto = {
  scenarioId: 'sc1', studyId: 'study-1', cohortId: 'c1',
  adjustmentType: 'PercentageIncrease', parameters: {}, rationale: '',
  status: 'Draft', createdAt: '',
};

const MOCK_STUDY: CountyStudySessionDto = {
  studyId: 'study-1',
  countyId: 'benton',
  taxYear: 2026,
  studyType: 'RatioStudy',
  status: 'Active',
  baselineVersion: null,
  activeSegmentSetId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'admin',
  updatedBy: 'admin',
};

describe('LeftRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(segmentSetApi.list).mockResolvedValue([]);
    vi.mocked(segmentSetApi.segments).mockResolvedValue([]);
    vi.mocked(studyApi.get).mockResolvedValue(MOCK_STUDY);
    act(() => {
      useCountyStudioStore.getState().setStudy(null);
      useCountyStudioStore.getState().setCohorts([MOCK_COHORT]);
      useCountyStudioStore.getState().setScenarios([MOCK_SCENARIO]);
      useCountyStudioStore.getState().setActiveCohort(null);
      useCountyStudioStore.getState().setActiveScenario(null);
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'idle', scenarios: 'idle' },
        loadErrors: { segments: null, cohorts: null, scenarios: null },
      });
    });
  });

  it('clicking a cohort sets activeCohortId in the store', () => {
    render(<LeftRail />);
    fireEvent.click(screen.getByText('West Side'));
    expect(useCountyStudioStore.getState().activeCohortId).toBe('c1');
  });

  it('highlights the active cohort', () => {
    act(() => { useCountyStudioStore.getState().setActiveCohort('c1'); });
    render(<LeftRail />);
    const btn = screen.getByText('West Side').closest('button');
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute('data-active')).toBe('true');
  });

  it('clicking a scenario sets activeScenario in the store', () => {
    render(<LeftRail />);
    fireEvent.click(screen.getByText('PercentageIncrease'));
    expect(useCountyStudioStore.getState().activeScenario?.scenarioId).toBe('sc1');
  });

  // ── Loading / error affordances ──────────────────────────────────────

  it('renders cohorts skeleton while loadStatus.cohorts is loading', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'loading', scenarios: 'idle' },
      });
    });
    render(<LeftRail />);
    expect(screen.getByTestId('left-rail-cohorts-loading')).toBeInTheDocument();
    expect(screen.queryByText('West Side')).not.toBeInTheDocument();
  });

  it('renders scenarios skeleton while loadStatus.scenarios is loading', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'idle', scenarios: 'loading' },
      });
    });
    render(<LeftRail />);
    expect(screen.getByTestId('left-rail-scenarios-loading')).toBeInTheDocument();
    expect(screen.queryByText('PercentageIncrease')).not.toBeInTheDocument();
  });

  it('renders inline error when cohorts load fails', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'error', scenarios: 'idle' },
        loadErrors: { segments: null, cohorts: 'backend 500', scenarios: null },
      });
    });
    render(<LeftRail />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveAttribute('title', 'backend 500');
  });

  // ── Snapshots section removed (was a prototype placeholder) ──────────

  it('does NOT render a Snapshots section (placeholder removed)', () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    render(<LeftRail />);
    expect(screen.queryByText(/snapshots/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/none saved/i)).not.toBeInTheDocument();
  });

  // ── Derive Segment Metrics button ────────────────────────────────────

  it('does not render the Derive button when no study is active', () => {
    render(<LeftRail />);
    expect(screen.queryByTestId('derive-segments-btn')).not.toBeInTheDocument();
  });

  it('renders the Derive button when a study is active', () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    render(<LeftRail />);
    expect(screen.getByTestId('derive-segments-btn')).toBeInTheDocument();
    expect(screen.getByTestId('derive-segments-btn')).toHaveTextContent(/derive segment metrics/i);
  });

  it('shows loading state and spinner while deriving', async () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    // Pending promise so we can observe the "deriving" phase.
    let resolve: (v: unknown) => void = () => {};
    vi.mocked(segmentSetApi.derive).mockImplementation(
      () => new Promise((r) => { resolve = r; })
    );

    render(<LeftRail />);
    fireEvent.click(screen.getByTestId('derive-segments-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('derive-spinner')).toBeInTheDocument();
    });
    expect(screen.getByTestId('derive-segments-btn')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('derive-segments-btn')).toBeDisabled();

    // Resolve so the test does not dangle.
    resolve({
      segmentSetId: 'new-set',
      segmentCount: 3,
      totalParcels: 10,
      segmentsWithRatios: 2,
      segmentsWithIaaoExceptions: 0,
    });
    await waitFor(() => {
      expect(screen.queryByTestId('derive-spinner')).not.toBeInTheDocument();
    });
  });

  it('shows success summary and refreshes study + segments after derive', async () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    vi.mocked(segmentSetApi.derive).mockResolvedValue({
      segmentSetId: 'new-set',
      segmentCount: 7,
      totalParcels: 42,
      segmentsWithRatios: 5,
      segmentsWithIaaoExceptions: 1,
    });
    const refreshed: CountyStudySessionDto = { ...MOCK_STUDY, activeSegmentSetId: 'new-set' };
    vi.mocked(studyApi.get).mockResolvedValue(refreshed);

    render(<LeftRail />);
    fireEvent.click(screen.getByTestId('derive-segments-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('derive-success')).toBeInTheDocument();
    });
    expect(screen.getByTestId('derive-success')).toHaveTextContent(/7 segments/);
    expect(screen.getByTestId('derive-success')).toHaveTextContent(/5 with ratios/);

    expect(segmentSetApi.derive).toHaveBeenCalledWith('study-1');
    expect(studyApi.get).toHaveBeenCalledWith('study-1');
    // Segment refetch was invoked so the SegmentTable picks up the new metrics.
    expect(retrySegmentsMock).toHaveBeenCalled();
    // Study in the store was updated with the refreshed copy (new activeSegmentSetId).
    expect(useCountyStudioStore.getState().activeStudy?.activeSegmentSetId).toBe('new-set');
  });

  it('shows error state when derivation fails', async () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    vi.mocked(segmentSetApi.derive).mockRejectedValue(new Error('HTTP 500: derive failed'));

    render(<LeftRail />);
    fireEvent.click(screen.getByTestId('derive-segments-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('derive-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('derive-error')).toHaveTextContent(/derive failed/i);
    // Button returns to enabled state with a retry label.
    const btn = screen.getByTestId('derive-segments-btn');
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveTextContent(/retry derive/i);
  });
});
