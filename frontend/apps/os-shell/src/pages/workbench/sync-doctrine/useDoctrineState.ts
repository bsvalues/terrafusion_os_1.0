/**
 * DASHBOARD-1: TanStack Query hook for the Sync Doctrine Console.
 *
 * Distinct from useSyncReadiness (which deliberately disables
 * polling per OPS-1 hard-guard "no probes on page load"). This
 * dashboard reads canonical pipeline state from TerraFusion's
 * own DB — polling is appropriate because:
 *
 *   - The data is canonical pipeline output, not a live PACS probe
 *   - DB reads are cheap (9 COUNT(*) aggregates + a few queries)
 *   - The operator wants live freshness without clicking
 *
 * Refresh cadence: 30s. Operator can also force-refresh via the
 * page's button which calls refetch() directly.
 */

import { useQuery } from '@tanstack/react-query';
import { getDoctrineState, type DoctrineState } from '@/api/syncDoctrine';

export const DOCTRINE_STATE_REFETCH_MS = 30_000;

export function useDoctrineState() {
  return useQuery<DoctrineState>({
    queryKey: ['sync-doctrine-state'],
    queryFn: ({ signal }) => getDoctrineState(25, signal),
    refetchInterval: DOCTRINE_STATE_REFETCH_MS,
    refetchOnWindowFocus: false,
    staleTime: DOCTRINE_STATE_REFETCH_MS / 2,
    retry: 1,
  });
}
