import { useCallback, useEffect } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { segmentSetApi, cohortApi, scenarioApi } from '../countyStudyApi';

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

  const retryAll = useCallback(() => {
    void loadSegments();
    void loadCohorts();
    void loadScenarios();
  }, [loadSegments, loadCohorts, loadScenarios]);

  useEffect(() => {
    if (!studyId) {
      // No study — clear data and reset status to idle.
      setSegments([]);
      setCohorts([]);
      setScenarios([]);
      setLoadStatus('segments', 'idle');
      setLoadStatus('cohorts', 'idle');
      setLoadStatus('scenarios', 'idle');
      return;
    }
    retryAll();
  }, [studyId, retryAll, setSegments, setCohorts, setScenarios, setLoadStatus]);

  return {
    retryAll,
    retrySegments: loadSegments,
    retryCohorts: loadCohorts,
    retryScenarios: loadScenarios,
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
