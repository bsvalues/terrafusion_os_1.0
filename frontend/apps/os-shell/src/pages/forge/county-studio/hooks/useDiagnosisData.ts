// frontend/apps/os-shell/src/pages/forge/county-studio/hooks/useDiagnosisData.ts
//
// Task E — Diagnosis data hook.
// Loads the segment-level diagnosis on segmentId change. 409 (no derived
// metrics) is surfaced as a distinct notDerived state so the panel can
// render an honest "derive first" nudge instead of a generic error.

import { useCallback, useEffect, useRef, useState } from 'react';
import { diagnosisApi } from '../countyStudyApi';
import type { SegmentDiagnosisDto } from '../types/countyStudio.types';

export interface UseDiagnosisDataResult {
  diagnosis: SegmentDiagnosisDto | null;
  loading: boolean;
  error: string | null;
  /** True when the backend returned 409 — the user should derive metrics first. */
  notDerived: boolean;
  retry: () => void;
}

export function useDiagnosisData(segmentId: string | null): UseDiagnosisDataResult {
  const [diagnosis, setDiagnosis] = useState<SegmentDiagnosisDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notDerived, setNotDerived] = useState(false);

  // Race-guard against out-of-order responses when user clicks A → B → A.
  const activeIdRef = useRef<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setNotDerived(false);
    try {
      const dto = await diagnosisApi.segment(id);
      if (activeIdRef.current !== id) return;
      setDiagnosis(dto);
    } catch (err) {
      if (activeIdRef.current !== id) return;
      setDiagnosis(null);
      // apiFetchJson throws Error with the response body appended — check for 409.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('409') || msg.toLowerCase().includes('no derived metrics')) {
        setNotDerived(true);
      } else {
        setError(msg || 'Failed to load diagnosis');
      }
    } finally {
      if (activeIdRef.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    activeIdRef.current = segmentId;
    if (!segmentId) {
      setDiagnosis(null);
      setError(null);
      setLoading(false);
      setNotDerived(false);
      return;
    }
    void load(segmentId);
  }, [segmentId, load]);

  const retry = useCallback(() => {
    if (segmentId) void load(segmentId);
  }, [segmentId, load]);

  return { diagnosis, loading, error, notDerived, retry };
}
