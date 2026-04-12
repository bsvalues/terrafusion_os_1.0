import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CostFactor, InsertCostFactor } from '@/types/api';

// NOTE: No /api/cost-factors endpoint exists in TerraFusion.API yet.
// Queries will return empty via React Query error state (graceful degradation).

export function useCostFactors() {
  const { data: costFactors, isLoading: isLoadingFactors, error: factorsError } = useQuery<CostFactor[]>({
    queryKey: ["/api/costforge/cost-factors"],
  });

  const getCostFactorByRevalAreaAndType = (revalArea: string, buildingType: string) => {
    return useQuery<CostFactor>({
      queryKey: ["/api/costforge/cost-factors", revalArea, buildingType],
      queryFn: () => apiRequest(`/api/costforge/cost-factors/${encodeURIComponent(revalArea)}/${encodeURIComponent(buildingType)}`),
      enabled: !!(revalArea && buildingType),
    });
  };

  const createCostFactor = useMutation({
    mutationFn: (factor: InsertCostFactor) =>
      apiRequest("/api/costforge/cost-factors", { method: "POST", body: JSON.stringify(factor) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-factors"] });
    }
  });

  const updateCostFactor = useMutation({
    mutationFn: ({ id, factor }: { id: number, factor: Partial<InsertCostFactor> }) =>
      apiRequest(`/api/costforge/cost-factors/${id}`, { method: "PATCH", body: JSON.stringify(factor) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-factors"] });
    }
  });

  const deleteCostFactor = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/costforge/cost-factors/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-factors"] });
    }
  });

  return {
    costFactors,
    isLoadingFactors,
    factorsError,
    getCostFactorByRevalAreaAndType,
    createCostFactor,
    updateCostFactor,
    deleteCostFactor
  };
}
