import { useCallback, useEffect } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { segmentSetApi, cohortApi, scenarioApi, rollupApi, healthApi } from '../countyStudyApi';

/**
 * Watches activeStudy in the store. When it changes, loads:
 *   - segments from the active segment set (falls back to first baseline set)
 *   - cohorts
 *   - scenarios
 *
 * Each resource's load status is tracked via setLoadStatus('segments'|'cohorts'|'scenarios', …).
 * Errors surface in the store (loadErrors) instead of being swallowed. Components render
 * "Couldn't load — retry" when loadStatus === 'error'.
 *
 * Returns a retry function that the UI can wire to a retry button.
 */
export function useStudyData() {
  const {
    activeStudy,
    setSegments,
    setCohorts,
    setScenarios,
    setLoadStatus,
    setCityRollup,
    setNeighborhoodRollup,
    setHealthSummary,
  } = useCountyStudioStore();

  const studyId = activeStudy?.studyId ?? null;
  const segmentSetId = activeStudy?.activeSegmentSetId ?? null;

  // Stable load fns — a user-visible Retry button can call these.
  const loadSegments = useCallback(async () => {
    if (!studyId) return;
    setLoadStatus('segments', 'loading');
    try {
      if (!segmentSetId) {
        // Fall back to first baseline set if activeSegmentSetId not set.
        const sets = await segmentSetApi.list(studyId);
        const baseline = sets.find((s) => s.isBaseline) ?? sets[0];
        if (baseline) {
          const segs = await segmentSetApi.segments(baseline.segmentSetId);
          setSegments(segs);
        } else {
          setSegments([]);
        }
      } else {
        const segs = await segmentSetApi.segments(segmentSetId);
        setSegments(segs);
      }
      setLoadStatus('segments', 'success');
    } catch (err) {
      setSegments([]);
      setLoadStatus('segments', 'error', describeError(err, 'segments'));
    }
  }, [studyId, segmentSetId, setSegments, setLoadStatus]);

  const loadCohorts = useCallback(async () => {
    if (!studyId) return;
    setLoadStatus('cohorts', 'loading');
    try {
      const rows = await cohortApi.list(studyId);
      setCohorts(rows);
      setLoadStatus('cohorts', 'success');
    } catch (err) {
      setCohorts([]);
      setLoadStatus('cohorts', 'error', describeError(err, 'cohorts'));
    }
  }, [studyId, setCohorts, setLoadStatus]);

  const loadScenarios = useCallback(async () => {
    if (!studyId) return;
    setLoadStatus('scenarios', 'loading');
    try {
      const rows = await scenarioApi.list(studyId);
      setScenarios(rows);
      setLoadStatus('scenarios', 'success');
    } catch (err) {
      setScenarios([]);
      setLoadStatus('scenarios', 'error', describeError(err, 'scenarios'));
    }
  }, [studyId, setScenarios, setLoadStatus]);

  const loadCityRollup = useCallback(async () => {
    if (!studyId) return;
    setLoadStatus('cityRollup', 'loading');
    try {
      const rows = await rollupApi.cities(studyId);
      setCityRollup(rows);
      setLoadStatus('cityRollup', 'success');
    } catch (err) {
      // 409 (no active segment set) is an expected state before deriving —
      // surface the message but don't scream in the console.
      setCityRollup([]);
      setLoadStatus('cityRollup', 'error', describeError(err, 'cityRollup'));
    }
  }, [studyId, setCityRollup, setLoadStatus]);

  const loadNeighborhoodRollup = useCallback(async () => {
    if (!studyId) return;
    setLoadStatus('neighborhoodRollup', 'loading');
    try {
      const rows = await rollupApi.neighborhoods(studyId);
      setNeighborhoodRollup(rows);
      setLoadStatus('neighborhoodRollup', 'success');
    } catch (err) {
      setNeighborhoodRollup([]);
      setLoadStatus('neighborhoodRollup', 'error', describeError(err, 'neighborhoodRollup'));
    }
  }, [studyId, setNeighborhoodRollup, setLoadStatus]);

  const loadHealthSummary = useCallback(async () => {
    if (!studyId) return;
    setLoadStatus('healthSummary', 'loading');
    try {
      const summary = await healthApi.summary(studyId);
      setHealthSummary(summary);
      setLoadStatus('healthSummary', 'success');
    } catch (err) {
      // 409 (no active segment set) maps to "empty state — derive first" in UI.
      // Other errors surface via loadErrors.healthSummary.
      setHealthSummary(null);
      setLoadStatus('healthSummary', 'error', describeError(err, 'healthSummary'));
    }
  }, [studyId, setHealthSummary, setLoadStatus]);

  const retryAll = useCallback(() => {
    void loadSegments();
    void loadCohorts();
    void loadScenarios();
    void loadCityRollup();
    void loadNeighborhoodRollup();
    void loadHealthSummary();
  }, [loadSegments, loadCohorts, loadScenarios, loadCityRollup, loadNeighborhoodRollup, loadHealthSummary]);

  useEffect(() => {
    if (!studyId) {
      // No study — clear data and reset status to idle.
      setSegments([]);
      setCohorts([]);
      setScenarios([]);
      setCityRollup([]);
      setNeighborhoodRollup([]);
      setHealthSummary(null);
      setLoadStatus('segments', 'idle');
      setLoadStatus('cohorts', 'idle');
      setLoadStatus('scenarios', 'idle');
      setLoadStatus('cityRollup', 'idle');
      setLoadStatus('neighborhoodRollup', 'idle');
      setLoadStatus('healthSummary', 'idle');
      return;
    }
    retryAll();
  }, [
    studyId, retryAll,
    setSegments, setCohorts, setScenarios,
    setCityRollup, setNeighborhoodRollup, setHealthSummary,
    setLoadStatus,
  ]);

  return {
    retryAll,
    retrySegments: loadSegments,
    retryCohorts: loadCohorts,
    retryScenarios: loadScenarios,
    retryCityRollup: loadCityRollup,
    retryNeighborhoodRollup: loadNeighborhoodRollup,
    retryHealthSummary: loadHealthSummary,
  };
}

/**
 * Produces a user-facing error message. Hides technical noise (stacks) but preserves
 * the actionable part ("HTTP 400: countyId 'benton' is not a valid Guid.").
 */
function describeError(err: unknown, resource: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return `Failed to load ${resource}`;
  }
}
