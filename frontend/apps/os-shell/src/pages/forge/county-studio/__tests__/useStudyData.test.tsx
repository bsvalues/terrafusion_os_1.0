import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { useStudyData } from '../hooks/useStudyData';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  segmentSetApi: {
    list: vi.fn(),
    segments: vi.fn(),
  },
  cohortApi: { list: vi.fn() },
  scenarioApi: { list: vi.fn() },
}));

import { segmentSetApi, cohortApi, scenarioApi } from '../countyStudyApi';

const MOCK_STUDY = {
  studyId: 'study-1', countyId: 'benton', taxYear: 2026,
  studyType: 'RatioStudy' as const, status: 'Active' as const,
  baselineVersion: null, activeSegmentSetId: 'ss-1',
  createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
};

const MOCK_SEGMENT_SET = {
  segmentSetId: 'ss-1', studyId: 'study-1', name: 'Baseline',
  sourceType: 'PACS', version: '1', isBaseline: true, segmentCount: 2, createdAt: '',
};

const MOCK_SEGMENTS = [
  { segmentId: 's1', segmentSetId: 'ss-1', name: 'R1', segmentType: 'Residential',
    parcelCount: 100, medianRatio: 0.97, cod: 14.2, prd: 1.01,
    stabilityScore: 72, riskScore: 35, exceptionCount: 0, geographyRef: null },
];

const MOCK_COHORTS = [
  { cohortId: 'c1', studyId: 'study-1', name: 'West Side', selectionType: 'Visual' as const,
    parcelCount: 80, isHybrid: false, createdAt: '' },
];

const MOCK_SCENARIOS = [
  { scenarioId: 'sc1', studyId: 'study-1', cohortId: 'c1',
    adjustmentType: 'PercentageIncrease' as const, parameters: {}, rationale: '',
    status: 'Draft' as const, createdAt: '' },
];

describe('useStudyData', () => {
  beforeEach(() => {
    vi.mocked(segmentSetApi.list).mockResolvedValue([MOCK_SEGMENT_SET]);
    vi.mocked(segmentSetApi.segments).mockResolvedValue(MOCK_SEGMENTS);
    vi.mocked(cohortApi.list).mockResolvedValue(MOCK_COHORTS);
    vi.mocked(scenarioApi.list).mockResolvedValue(MOCK_SCENARIOS);
    act(() => {
      useCountyStudioStore.getState().setStudy(null);
      useCountyStudioStore.getState().setSegments([]);
      useCountyStudioStore.getState().setCohorts([]);
      useCountyStudioStore.getState().setScenarios([]);
    });
  });

  it('loads segments, cohorts, and scenarios when activeStudy is set', async () => {
    renderHook(() => useStudyData());
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    await waitFor(() => {
      expect(useCountyStudioStore.getState().segments).toHaveLength(1);
      expect(useCountyStudioStore.getState().cohorts).toHaveLength(1);
      expect(useCountyStudioStore.getState().scenarios).toHaveLength(1);
    });
  });

  it('clears data when activeStudy is set to null', async () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    renderHook(() => useStudyData());
    await waitFor(() => {
      expect(useCountyStudioStore.getState().segments).toHaveLength(1);
    });
    act(() => { useCountyStudioStore.getState().setStudy(null); });
    await waitFor(() => {
      expect(useCountyStudioStore.getState().segments).toHaveLength(0);
    });
  });

  it('calls segmentSetApi.segments with the activeSegmentSetId', async () => {
    renderHook(() => useStudyData());
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    await waitFor(() => {
      expect(vi.mocked(segmentSetApi.segments)).toHaveBeenCalledWith('ss-1');
    });
  });

  it('sets loadStatus=success after happy-path loads complete', async () => {
    renderHook(() => useStudyData());
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    await waitFor(() => {
      const { loadStatus } = useCountyStudioStore.getState();
      expect(loadStatus.segments).toBe('success');
      expect(loadStatus.cohorts).toBe('success');
      expect(loadStatus.scenarios).toBe('success');
    });
  });

  it('surfaces API errors via loadStatus="error" + loadErrors message', async () => {
    vi.mocked(cohortApi.list).mockRejectedValueOnce(new Error('HTTP 500: /county-study/studies/study-1/cohorts'));
    renderHook(() => useStudyData());
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    await waitFor(() => {
      const { loadStatus, loadErrors, cohorts } = useCountyStudioStore.getState();
      expect(loadStatus.cohorts).toBe('error');
      expect(loadErrors.cohorts).toMatch(/HTTP 500/);
      expect(cohorts).toEqual([]); // cleared on error — distinguishable via loadStatus
    });
  });

  it('retry function re-fetches the failed resource', async () => {
    vi.mocked(cohortApi.list).mockRejectedValueOnce(new Error('transient fail'));
    const { result } = renderHook(() => useStudyData());
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    await waitFor(() => {
      expect(useCountyStudioStore.getState().loadStatus.cohorts).toBe('error');
    });
    // Retry now — mock is back to resolving MOCK_COHORTS after the 1 failed attempt.
    await act(async () => { await result.current.retryCohorts(); });
    expect(useCountyStudioStore.getState().loadStatus.cohorts).toBe('success');
    expect(useCountyStudioStore.getState().cohorts).toHaveLength(1);
  });

  it('resets loadStatus to idle when study is set to null', async () => {
    act(() => { useCountyStudioStore.getState().setStudy(MOCK_STUDY); });
    renderHook(() => useStudyData());
    await waitFor(() => {
      expect(useCountyStudioStore.getState().loadStatus.segments).toBe('success');
    });
    act(() => { useCountyStudioStore.getState().setStudy(null); });
    await waitFor(() => {
      const { loadStatus, loadErrors } = useCountyStudioStore.getState();
      // Task B extended loadStatus to include city + neighborhood rollups.
      expect(loadStatus).toEqual({
        segments: 'idle', cohorts: 'idle', scenarios: 'idle',
        cityRollup: 'idle', neighborhoodRollup: 'idle',
      });
      expect(loadErrors).toEqual({
        segments: null, cohorts: null, scenarios: null,
        cityRollup: null, neighborhoodRollup: null,
      });
    });
  });
});
