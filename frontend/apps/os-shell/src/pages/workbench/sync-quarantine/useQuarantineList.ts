/**
 * SYNC-UX-1A: TanStack Query hook for the imprv-attr quarantine page.
 *
 * Mirrors useDoctrineState's polling shape. The list endpoint reads
 * doctrine quarantine rows joined with the optional triage decision
 * table; both are TerraFusion DB reads, so 30s staleTime + window-
 * focus refetch matches the operator's "have I missed anything?"
 * mental model without hammering the server.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  listQuarantineImprvAttr,
  type QuarantineListParams,
  type QuarantineListResponse,
} from '@/api/syncQuarantine';

export const QUARANTINE_LIST_STALE_MS = 30_000;

export function useQuarantineList(
  params: QuarantineListParams,
): UseQueryResult<QuarantineListResponse, Error> {
  // Only the server-side filters belong in the queryKey. The
  // client-only `status` filter is applied over the fetched rows
  // by the page; including it here would cause a needless refetch.
  const serverKey = {
    reason: params.reason ?? '',
    universe: params.universe ?? '',
    propId: params.propId ?? null,
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
  };

  return useQuery<QuarantineListResponse, Error>({
    queryKey: ['sync-quarantine-imprv-attr', serverKey],
    queryFn: ({ signal }) =>
      listQuarantineImprvAttr(
        {
          reason: params.reason,
          universe: params.universe,
          propId: params.propId,
          limit: serverKey.limit,
          offset: serverKey.offset,
        },
        signal,
      ),
    staleTime: QUARANTINE_LIST_STALE_MS,
    refetchOnWindowFocus: true,
    // Surface fetch failures to the operator immediately. The page renders an
    // error panel with a retry button; silently retrying once would mask
    // network failures and skip the UI's intentional retry surface.
    retry: false,
  });
}
