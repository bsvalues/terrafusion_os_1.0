/**
 * SYNC-UX-1B: TanStack Query hook for a single commit's full detail.
 *
 * Disabled until a commit is selected. The detail payload includes
 * the decision-link rows for the table; ~few-KB JSON typical so a
 * single fetch is fine.
 */

import { useQuery } from '@tanstack/react-query';
import { getCommit, type CommitDetailResponse } from '@/api/syncCommits';

export function useCommitDetail(commitId: string | null) {
  return useQuery<CommitDetailResponse>({
    queryKey: ['sync-workbench-commit', commitId ?? 'none'],
    queryFn: ({ signal }) => getCommit(commitId as string, signal),
    enabled: Boolean(commitId),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    retry: 1,
  });
}
