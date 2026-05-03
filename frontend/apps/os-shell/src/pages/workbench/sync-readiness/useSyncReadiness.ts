/**
 * OPS-1-B: TanStack Query hooks for the Sync Readiness Console.
 *
 * Per the OPS-1 policy hard-guard "No auto-refresh, no polling,
 * no probes on page load":
 *   - staleTime: Infinity
 *   - refetchOnWindowFocus: false
 *   - refetchInterval: false
 *
 * The query fetches once on initial render to hydrate from
 * existing artifacts. Refetch is operator-driven via the
 * useSyncReadinessRefresh() mutation, which on success seeds
 * the GET cache so the panels re-render with fresh state.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSyncReadiness,
  refreshSyncReadiness,
  type SyncReadiness,
  type SyncReadinessRefresh,
} from '@/api/workbenchSyncReadiness';

interface ScopeArgs {
  countyId: string | null;
  sourceConnectionId: string | null;
  workbookId: string | null;
}

export function useSyncReadiness(scope: ScopeArgs) {
  const enabled = Boolean(scope.countyId && scope.sourceConnectionId);
  return useQuery<SyncReadiness>({
    queryKey: [
      'workbench-sync-readiness',
      scope.countyId,
      scope.sourceConnectionId,
      scope.workbookId,
    ],
    queryFn: () =>
      getSyncReadiness({
        countyId: scope.countyId!,
        sourceConnectionId: scope.sourceConnectionId!,
        workbookId: scope.workbookId ?? undefined,
      }),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
  });
}

export function useSyncReadinessRefresh() {
  const qc = useQueryClient();
  return useMutation<
    SyncReadinessRefresh,
    Error,
    { countyId: string; sourceConnectionId: string; workbookId: string }
  >({
    mutationFn: (args) => refreshSyncReadiness(args),
    onSuccess: (data, vars) => {
      // Seed the GET cache so the panels reflect the just-captured
      // artifacts without an additional fetch.
      qc.setQueryData(
        [
          'workbench-sync-readiness',
          vars.countyId,
          vars.sourceConnectionId,
          vars.workbookId,
        ],
        data.readiness,
      );
    },
  });
}
