const UNAVAILABLE_MESSAGE =
  'TerraLevy quantum research is not wired to a governed research execution contract.';

export const useQuantumResearch = (_userId: string, _department: string) => ({
  status: 'unavailable' as const,
  error: UNAVAILABLE_MESSAGE,
  isLoading: false,
  datasets: [] as never[],
  algorithms: [] as never[],
  connections: [] as never[],
  executions: [] as never[],
  models: [] as never[],
  refresh: async () => undefined,
  runResearch: async () => null,
  cancelExecution: async () => false,
});
