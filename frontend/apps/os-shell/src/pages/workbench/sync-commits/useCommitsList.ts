/**
 * SYNC-UX-1B: TanStack Query hook for the paged commits list.
 *
 * The commit list is operator-controlled (paged manually) so we
 * don't poll. refetchOnWindowFocus is left at the QueryClient
 * default (off in os-shell) — the operator clicks "New Commit"
 * to refresh when needed.
 */

import { useQuery } from '@tanstack/react-query';
import { listCommits, type CommitListResponse } from '@/api/syncCommits';

export const COMMITS_LIST_PAGE_SIZE = 50;

export function useCommitsList(offset = 0, limit = COMMITS_LIST_PAGE_SIZE) {
  return useQuery<CommitListResponse>({
    queryKey: ['sync-workbench-commits', limit, offset],
    queryFn: ({ signal }) => listCommits(limit, offset, signal),
    refetchOnWindowFocus: false,
    staleTime: 10_000,
    retry: 1,
  });
}
