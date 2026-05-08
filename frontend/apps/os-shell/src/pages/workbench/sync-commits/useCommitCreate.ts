/**
 * SYNC-UX-1B: TanStack Query mutation for creating a commit.
 *
 * On success invalidates the commits-list query so the new commit
 * appears at the top of the list immediately. On 409 (no pending
 * decisions) the caller surfaces a soft toast — no list refresh.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCommit,
  type CommitCreateRequest,
  type CommitCreateResponse,
  CommitApiError,
} from '@/api/syncCommits';

export interface CommitCreateOutcome {
  response: CommitCreateResponse;
  isIdempotent: boolean;
}

export function useCommitCreate() {
  const qc = useQueryClient();

  return useMutation<CommitCreateOutcome, CommitApiError, CommitCreateRequest>({
    mutationFn: async (req) => {
      const response = await createCommit(req);
      return {
        response,
        isIdempotent: response.status === 'Idempotent',
      };
    },
    onSuccess: () => {
      // Refresh paginated list — the new commit lives at the top.
      qc.invalidateQueries({ queryKey: ['sync-workbench-commits'] });
    },
  });
}
