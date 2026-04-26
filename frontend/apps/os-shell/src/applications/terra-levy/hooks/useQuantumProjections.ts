const UNAVAILABLE_MESSAGE =
  'TerraLevy quantum projection surfaces are not backed by a governed execution contract.';

export const useQuantumProjections = () => ({
  status: 'unavailable' as const,
  error: UNAVAILABLE_MESSAGE,
  isLoading: false,
  projections: [] as never[],
  scenarios: [] as never[],
  optimizations: [] as never[],
  refresh: async () => undefined,
});
