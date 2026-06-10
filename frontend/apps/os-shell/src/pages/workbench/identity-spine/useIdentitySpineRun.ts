// WORKBENCH-V0.3 SLICE-L: TanStack Query v5 mutation hook for identity spine runs.
// POST /api/sync/workbench/identity-spine/run

import { useMutation } from '@tanstack/react-query';
import { type IdentitySpineRunResponse, runIdentitySpine } from '@/api/syncIdentitySpine';

export interface UseIdentitySpineRunResult {
  /** Fire the identity spine run. Returns the raw response for the page to parse. */
  run: () => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: IdentitySpineRunResponse | undefined;
  /** Reset mutation state back to idle. */
  reset: () => void;
}

export function useIdentitySpineRun(): UseIdentitySpineRunResult {
  const mutation = useMutation({
    mutationFn: async (): Promise<IdentitySpineRunResponse> => {
      return runIdentitySpine();
    },
  });

  return {
    run: () => mutation.mutate(),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
