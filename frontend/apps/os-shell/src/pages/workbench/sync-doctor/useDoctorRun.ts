// WORKBENCH-V0.3 SLICE-J: TanStack Query v5 mutation hook for doctor runs.
// POST /api/sync/workbench/doctor/run

import { useMutation } from '@tanstack/react-query';
import { type DoctorRunResponse, runDoctor } from '@/api/syncDoctor';

export interface UseDoctorRunResult {
  /** Fire the doctor run. Returns the raw response for the page to parse. */
  run: () => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: DoctorRunResponse | undefined;
  /** Reset mutation state back to idle. */
  reset: () => void;
}

export function useDoctorRun(): UseDoctorRunResult {
  const mutation = useMutation({
    mutationFn: async (): Promise<DoctorRunResponse> => {
      return runDoctor();
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
