/**
 * WORKBENCH-V0.2 SLICE-I: TanStack Query hook for quarantine review browse.
 *
 * Lane fixed to imprv_attr per Slice I scope.
 * Source quarantine rows are immutable — this hook is read-only.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  browseQuarantineReview,
  QuarantineReviewBrowseResponse,
  QuarantineReviewApiError,
} from '@/api/syncQuarantineReview';

export const QUARANTINE_REVIEW_QUERY_KEY = 'sync-quarantine-review-imprv-attr';

export function useQuarantineReview(
  limit = 50,
): UseQueryResult<QuarantineReviewBrowseResponse, QuarantineReviewApiError | Error> {
  return useQuery<QuarantineReviewBrowseResponse, QuarantineReviewApiError | Error>({
    queryKey: [QUARANTINE_REVIEW_QUERY_KEY, limit],
    queryFn: ({ signal }) =>
      browseQuarantineReview({ lane: 'imprv_attr', limit }, signal),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
