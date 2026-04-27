// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/SegmentFilters.nullGuard.test.tsx
//
// Regression tests for the null-guard on CountyStudyPage's severity tab
// filters. Task A flagged that the original `seg.cod > 20` predicate crashed
// on sparse-sample segments where cod === null. Task C rewrites every tab
// filter to null-guard every numeric comparison and adds a "Needs Data"
// bucket so sparse-sample segments have a home.

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import { beforeEach, vi } from 'vitest';
import { CountyStudyPage } from '../CountyStudyPage';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto, CountyStudySessionDto } from '../types/countyStudio.types';

// Capture the store's pristine initial state at module-load time, before any
// test has had a chance to mutate it. The `beforeEach` hook below uses this
// snapshot to fully reset state — Zustand stores are module-singletons and
// would otherwise carry mutations from one sibling test into the next, which
// caused the "Needs Data filter" assertion to see a partially-stale drillLevel
// during the convergence merge (TODO(convergence-followup) referenced this).
const PRISTINE_STORE_STATE = useCountyStudioStore.getState();

// Stub every data-loading hook so the page renders without kicking off real fetches.
vi.mock('../hooks/useStudyData', () => ({
  useStudyData: () => ({
    retrySegments: vi.fn(async () => {}),
    retryCohorts: vi.fn(async () => {}),
    retryScenarios: vi.fn(async () => {}),
    retryCityRollup: vi.fn(async () => {}),
    retryNeighborhoodRollup: vi.fn(async () => {}),
    retryHealthSummary: vi.fn(async () => {}),
    retryAll: vi.fn(async () => {}),
  }),
}));

vi.mock('../hooks/useCountyStudyHub', () => ({
  useCountyStudyHub: () => {},
}));

const MOCK_STUDY: CountyStudySessionDto = {
  studyId: 'study-1', countyId: 'benton', taxYear: 2026,
  studyType: 'RatioStudy', status: 'Draft',
  baselineVersion: null, activeSegmentSetId: 'set-1',
  createdAt: '', updatedAt: '', createdBy: 'test', updatedBy: 'test',
};

/** Sparse-sample segment: cod/prd/medianRatio all null. */
// StabilityScore is ABOVE the critical threshold (80+) so the Critical filter
// only fires if the null-metric paths (cod>20 / median out-of-band / prd out-of-band)
// incorrectly classify a null as a breach. If the null-guard holds, sparse
// stays out of the Critical bucket. ExceptionCount is 0 and parcelCount is 2,
// so the exception-fence trigger cannot fire either (`> max(1, floor(2*0.1))`
// = `> 1` requires > 1 exception, sparse has 0).
const sparseSegment: CountySegmentDto = {
  segmentId: 'sparse', segmentSetId: 'set-1', name: 'Tiny Neighborhood',
  segmentType: 'Residential', parcelCount: 2,
  medianRatio: null, cod: null, prd: null,
  stabilityScore: 85, riskScore: 20, exceptionCount: 0,
  geographyRef: 'NBHD-TINY',
};

const healthySegment: CountySegmentDto = {
  segmentId: 'ok', segmentSetId: 'set-1', name: 'Healthy Neighborhood',
  segmentType: 'Residential', parcelCount: 200,
  medianRatio: 0.98, cod: 10, prd: 1.01,
  stabilityScore: 88, riskScore: 18, exceptionCount: 0,
  geographyRef: 'NBHD-OK',
};

const criticalSegment: CountySegmentDto = {
  segmentId: 'bad', segmentSetId: 'set-1', name: 'Bad Neighborhood',
  segmentType: 'Residential', parcelCount: 150,
  medianRatio: 0.82, cod: 28, prd: 1.05,
  stabilityScore: 40, riskScore: 80, exceptionCount: 25,
  geographyRef: 'NBHD-BAD',
};

function setup() {
  act(() => {
    const s = useCountyStudioStore.getState();
    s.setStudy(MOCK_STUDY);
    s.setSegments([sparseSegment, healthySegment, criticalSegment]);
    s.setLoadStatus('segments', 'success');
    s.setLoadStatus('cohorts', 'success');
    s.setLoadStatus('scenarios', 'success');
    s.setLoadStatus('cityRollup', 'success');
    s.setLoadStatus('neighborhoodRollup', 'success');
    s.setLoadStatus('healthSummary', 'idle');
    s.setCohorts([]);
    s.setScenarios([]);
    // Drill straight to neighborhood=NBHD-TINY so the SegmentTable renders
    // the sparse segment; null guards are tested via the severity pills.
    s.drillToNeighborhood('Kennewick', 'NBHD-TINY');
  });
  render(
    <MemoryRouter>
      <CountyStudyPage />
    </MemoryRouter>,
  );
}

describe('CountyStudyPage severity-filter null-guard', () => {
  beforeEach(() => {
    // Replace (don't merge) the entire store with the pristine snapshot so each
    // test starts from a known-good baseline. The `true` second arg to
    // setState replaces the state object wholesale.
    useCountyStudioStore.setState(PRISTINE_STORE_STATE, true);
  });

  it('compliance-style filter does not throw when cod/prd/medianRatio are null', () => {
    // Historically this would crash with "Cannot read properties of null"
    // when the filter tried `seg.cod > 20`. Guard: the render + filter toggle
    // must complete without a thrown exception.
    expect(() => {
      setup();
      fireEvent.click(screen.getByTestId('segment-filter-critical'));
    }).not.toThrow();
  });

  it('Critical filter does NOT mark sparse-sample segments as breaching', () => {
    setup();
    // Override drill so all segments are visible in SegmentTable (neighborhood
    // filter normally narrows by GeographyRef).
    act(() => { useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-TINY'); });
    // Route through all-filter + sparse geographyRef so we can assert: sparse
    // alone is the only segment in scope, and Critical filter leaves the
    // SegmentTable empty (because sparse cod=null and medianRatio=null are
    // both null-guarded — no incorrect breach).
    fireEvent.click(screen.getByTestId('segment-filter-critical'));
    const table = screen.getByRole('table');
    // sparse must not be rendered — null guard keeps it out of the critical
    // bucket. table body has 0 rows (thead still has 1 row).
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(1); // header only
  });

  it('Needs Data filter surfaces sparse-sample segments explicitly', () => {
    act(() => {
      const s = useCountyStudioStore.getState();
      s.setStudy(MOCK_STUDY);
      s.setSegments([sparseSegment, healthySegment, criticalSegment]);
      s.setLoadStatus('segments', 'success');
      s.setLoadStatus('cohorts', 'success');
      s.setLoadStatus('scenarios', 'success');
      s.setLoadStatus('cityRollup', 'success');
      s.setLoadStatus('neighborhoodRollup', 'success');
      s.setLoadStatus('healthSummary', 'idle');
      s.setCohorts([]);
      s.setScenarios([]);
      // Drill into sparse's neighborhood so the table-level geographyRef filter
      // passes it through; then Needs Data pill narrows to sparse alone.
      s.drillToNeighborhood('Kennewick', 'NBHD-TINY');
    });
    render(
      <MemoryRouter>
        <CountyStudyPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByTestId('segment-filter-needsData'));
    // SegmentTable renders `formatOperationalPrimary(identity)`, which derives
    // its display text from the segment's geographyRef ("Neighborhood NBHD-TINY")
    // — not from the raw `name` field. Scope assertions to the table itself
    // so we don't false-match the breadcrumb / right-rail scope-label which
    // also surface the active neighborhood.
    const table = screen.getByRole('table');
    expect(within(table).getByText(/NBHD-TINY/)).toBeInTheDocument();
    expect(within(table).queryByText(/NBHD-OK/)).not.toBeInTheDocument();
    expect(within(table).queryByText(/NBHD-BAD/)).not.toBeInTheDocument();
  });
});
