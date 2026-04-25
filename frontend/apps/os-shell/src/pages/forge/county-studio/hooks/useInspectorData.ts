// frontend/apps/os-shell/src/pages/forge/county-studio/hooks/useInspectorData.ts
//
// Task D — Inspector data hook.
// Loads the segment detail + action-context endpoints independently when the
// selectedSegmentId changes. Each endpoint has its own loading / error /
// retry state so one failure does not black out the other tab. Cleanup
// flag guards against setState on unmounted component and out-of-order
// responses (segment A click → segment B click → A's response lands last).

import { useCallback, useEffect, useRef, useState } from 'react';
import { inspectorApi } from '../countyStudyApi';
import type {
  CountySegmentDetailDto,
  SegmentActionContextDto,
} from '../types/countyStudio.types';

export interface UseInspectorDataResult {
  detail: CountySegmentDetailDto | null;
  detailLoading: boolean;
  detailError: string | null;
  retryDetail: () => void;

  context: SegmentActionContextDto | null;
  contextLoading: boolean;
  contextError: string | null;
  retryContext: () => void;
}

export function useInspectorData(segmentId: string | null): UseInspectorDataResult {
  const [detail, setDetail] = useState<CountySegmentDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [context, setContext] = useState<SegmentActionContextDto | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  // Track the most-recently-requested segment so out-of-order responses
  // are silently dropped. Avoids the "stale tab shows segment B's data
  // under segment A's header" class of bug.
  const activeIdRef = useRef<string | null>(null);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const dto = await inspectorApi.detail(id);
      if (activeIdRef.current !== id) return;
      setDetail(dto);
    } catch (err) {
      if (activeIdRef.current !== id) return;
      setDetail(null);
      setDetailError(err instanceof Error ? err.message : 'Failed to load segment detail');
    } finally {
      if (activeIdRef.current === id) setDetailLoading(false);
    }
  }, []);

  const loadContext = useCallback(async (id: string) => {
    setContextLoading(true);
    setContextError(null);
    try {
      const dto = await inspectorApi.actionContext(id);
      if (activeIdRef.current !== id) return;
      setContext(dto);
    } catch (err) {
      if (activeIdRef.current !== id) return;
      setContext(null);
      setContextError(err instanceof Error ? err.message : 'Failed to load action context');
    } finally {
      if (activeIdRef.current === id) setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    activeIdRef.current = segmentId;
    if (!segmentId) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      setContext(null);
      setContextError(null);
      setContextLoading(false);
      return;
    }
    void loadDetail(segmentId);
    void loadContext(segmentId);
  }, [segmentId, loadDetail, loadContext]);

  const retryDetail = useCallback(() => {
    if (segmentId) void loadDetail(segmentId);
  }, [segmentId, loadDetail]);

  const retryContext = useCallback(() => {
    if (segmentId) void loadContext(segmentId);
  }, [segmentId, loadContext]);

  return {
    detail, detailLoading, detailError, retryDetail,
    context, contextLoading, contextError, retryContext,
  };
}
