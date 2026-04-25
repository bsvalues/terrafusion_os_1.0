import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { BuildingCost, InsertBuildingCost } from '@/types/api';

// Type for the calculation request
export interface CalculationRequest {
  revalArea: string;
  buildingType: string;
  propertyClass?: string;
  squareFootage: number;
  complexityMultiplier?: number;
  complexityFactor?: string;
  taxLotId?: string;
  propertyId?: string;
  assessmentYear?: number;
  yearBuilt?: number;
  condition?: string;
}

// Type for the calculation response
export interface CalculationResponse {
  revalArea: string;
  buildingType: string;
  propertyClass?: string;
  squareFootage: number;
  baseCost: number;
  revalAreaFactor: number;
  complexityFactor: number;
  costPerSqft: number;
  totalCost: number;
  taxLotId?: string;
  propertyId?: string;
  assessmentYear?: number;
  yearBuilt?: number;
  condition?: string;
  conditionFactor?: number;
  depreciationAmount?: number;
  assessedValue?: number;
}

// Material in a breakdown
export interface Material {
  id: number;
  materialTypeId: number;
  materialName: string;
  materialCode: string;
  percentage: number;
  costPerUnit: number;
  quantity: number;
  totalCost: number;
}

// Type for the materials breakdown response
export interface MaterialsBreakdownResponse extends CalculationResponse {
  materials: Material[];
}

export function useBuildingCosts() {
  // NOTE: /api/costforge/building-costs is a placeholder — no CRUD endpoint exists yet.
  // Fails gracefully via React Query (isError: true, data: undefined).
  const { data: buildingCosts, isLoading: isLoadingCosts, error: costsError } = useQuery<BuildingCost[]>({
    queryKey: ["/api/costforge/building-costs"],
  });

  const getBuildingCost = (id: number) => {
    return useQuery<BuildingCost>({
      queryKey: ["/api/costforge/building-costs", id],
      enabled: !!id,
    });
  };

  const createBuildingCost = useMutation({
    mutationFn: (cost: InsertBuildingCost) =>
      apiRequest("/api/costforge/building-costs", { method: "POST", body: JSON.stringify(cost) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/building-costs"] });
    }
  });

  const updateBuildingCost = useMutation({
    mutationFn: ({ id, cost }: { id: number, cost: Partial<InsertBuildingCost> }) =>
      apiRequest(`/api/costforge/building-costs/${id}`, { method: "PATCH", body: JSON.stringify(cost) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/building-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/building-costs", variables.id] });
    }
  });

  const deleteBuildingCost = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/costforge/building-costs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/building-costs"] });
    }
  });

  // Real .NET endpoint: POST /api/costforge/calculate
  const calculateCost = useMutation({
    mutationFn: (params: CalculationRequest) =>
      apiRequest("/api/costforge/calculate", { method: "POST", body: JSON.stringify(params) }),
  });

  // Real .NET endpoint: POST /api/costforge/calculate (materials breakdown variant)
  const calculateMaterialsBreakdown = useMutation({
    mutationFn: (params: CalculationRequest) =>
      apiRequest("/api/costforge/calculate", { method: "POST", body: JSON.stringify(params) }),
  });

  const getBuildingCostMaterials = (id: number) => {
    return useQuery({
      queryKey: ["/api/costforge/building-costs", id, "materials"],
      enabled: !!id,
    });
  };

  const calculateBuildingCost = async (params: CalculationRequest): Promise<any> => {
    try {
      return await calculateCost.mutateAsync(params);
    } catch (error) {
      console.error("Error calculating building cost:", error);
      throw error;
    }
  };

  return {
    buildingCosts,
    isLoadingCosts,
    costsError,
    getBuildingCost,
    createBuildingCost,
    updateBuildingCost,
    deleteBuildingCost,
    calculateCost,
    calculateBuildingCost,
    calculateMaterialsBreakdown,
    getBuildingCostMaterials
  };
}
