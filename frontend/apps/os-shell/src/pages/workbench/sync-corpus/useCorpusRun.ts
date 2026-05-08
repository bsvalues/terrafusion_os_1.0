/**
 * SYNC-UX-1C: TanStack Query hook for a single corpus run.
 *
 * Auto-refresh policy:
 *   - Queued | Running   → poll every 10s
 *   - Completed | Failed | Interrupted | Resumed → poll disabled
 *     (operator must hit refresh manually)
 *
 * The status-aware refetchInterval keeps backend load down once a
 * run is terminal while still showing live progress for in-flight
 * 6+ hour drains.
 */

import { useQuery } from '@tanstack/react-query';
import { getCorpusStatus, type CorpusStatusResponse, type RunStatus } from '@/api/syncCorpus';

export const CORPUS_RUN_REFETCH_MS = 10_000;

const ACTIVE_STATUSES = new Set<RunStatus>(['Queued', 'Running', 'Resumed']);

export function isActiveStatus(status: RunStatus | undefined): boolean {
  return !!status && ACTIVE_STATUSES.has(status);
}

export function useCorpusRun(runId: string | undefined) {
  return useQuery<CorpusStatusResponse>({
    queryKey: ['sync-corpus-run', runId],
    queryFn: ({ signal }) => getCorpusStatus(runId!, signal),
    enabled: !!runId,
    refetchInterval: (q) => {
      const data = q.state.data as CorpusStatusResponse | undefined;
      return isActiveStatus(data?.run.status) ? CORPUS_RUN_REFETCH_MS : false;
    },
    refetchOnWindowFocus: false,
    staleTime: CORPUS_RUN_REFETCH_MS / 2,
    retry: 1,
  });
}
