import { useEffect } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { segmentSetApi, cohortApi, scenarioApi } from '../countyStudyApi';

/**
 * Watches activeStudy in the store. When it changes, loads:
 *   - segments from the active segment set
 *   - cohorts
 *   - scenarios
 * Clears all three when study is set to null.
 */
export function useStudyData() {
  const { activeStudy, setSegments, setCohorts, setScenarios } = useCountyStudioStore();

  useEffect(() => {
    if (!activeStudy) {
      setSegments([]);
      setCohorts([]);
      setScenarios([]);
      return;
    }

    const studyId = activeStudy.studyId;
    const segmentSetId = activeStudy.activeSegmentSetId;

    // Load in parallel; do not block on each other
    const loadSegments = async () => {
      if (!segmentSetId) {
        // Fall back to first baseline set if activeSegmentSetId not set
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
    };

    const loadCohorts = () =>
      cohortApi.list(studyId).then(setCohorts).catch(() => setCohorts([]));

    const loadScenarios = () =>
      scenarioApi.list(studyId).then(setScenarios).catch(() => setScenarios([]));

    void loadSegments().catch(() => setSegments([]));
    void loadCohorts();
    void loadScenarios();
  }, [activeStudy?.studyId]); // eslint-disable-line react-hooks/exhaustive-deps
}
