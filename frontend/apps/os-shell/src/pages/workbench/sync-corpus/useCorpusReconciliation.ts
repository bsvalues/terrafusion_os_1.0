/**
 * SYNC-UX-1C: TanStack Query hook for the post-drain
 * reconciliation envelope.
 *
 * Only fetches when the run is Completed; the backend returns
 * an empty array before then and there's no value polling for it.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getCorpusReconciliation,
  type CorpusReconciliationResponseEnvelope,
  type RunStatus,
} from '@/api/syncCorpus';

export function useCorpusReconciliation(
  runId: string | undefined,
  runStatus: RunStatus | undefined,
) {
  return useQuery<CorpusReconciliationResponseEnvelope>({
    queryKey: ['sync-corpus-reconciliation', runId],
    queryFn: ({ signal }) => getCorpusReconciliation(runId!, signal),
    enabled: !!runId && runStatus === 'Completed',
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 1,
  });
}
