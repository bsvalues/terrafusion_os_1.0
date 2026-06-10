// WORKBENCH-V0.3 SLICE-K: TanStack Query v5 mutation hook for pack validator runs.
// POST /api/sync/workbench/source-pack/run

import { useMutation } from '@tanstack/react-query';
import { type PackValidatorRunResponse, runPackValidator } from '@/api/syncPackValidator';

export interface UsePackValidatorRunResult {
  /** Fire the pack validator run. Returns the raw response for the page to parse. */
  run: () => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: PackValidatorRunResponse | undefined;
  /** Reset mutation state back to idle. */
  reset: () => void;
}

export function usePackValidatorRun(): UsePackValidatorRunResult {
  const mutation = useMutation({
    mutationFn: async (): Promise<PackValidatorRunResponse> => {
      return runPackValidator();
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
