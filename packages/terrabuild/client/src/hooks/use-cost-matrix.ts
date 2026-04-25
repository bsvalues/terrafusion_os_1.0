import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CostMatrix } from '@/types/api';
import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * Hook for interacting with the cost matrix API
 */
export function useCostMatrix() {
  // Real .NET endpoint: GET /api/costforge/cost-matrices
  const getAll = useQuery({
    queryKey: ["/api/costforge/cost-matrices"],
  });

  // Get cost matrix entry by ID
  const getById = (id: number) => {
    return useQuery({
      queryKey: ["/api/costforge/cost-matrices", id],
      enabled: !!id,
    });
  };

  // Get cost matrix entries by Reval Area (PACS Cycle)
  const getByRevalArea = (revalArea: string) => {
    return useQuery({
      queryKey: ["/api/costforge/cost-matrices", { revalArea }],
      queryFn: () =>
        apiRequest(`/api/costforge/cost-matrices?revalArea=${encodeURIComponent(revalArea)}`),
      enabled: !!revalArea,
    });
  };

  // Get cost matrix entries by building type
  const getByBuildingType = (buildingType: string) => {
    return useQuery({
      queryKey: ["/api/costforge/cost-matrices", { buildingType }],
      queryFn: () =>
        apiRequest(`/api/costforge/cost-matrices?buildingType=${encodeURIComponent(buildingType)}`),
      enabled: !!buildingType,
    });
  };

  // Get cost matrix entry by Reval Area and building type
  const getByRevalAreaAndBuildingType = (revalArea: string, buildingType: string) => {
    return useQuery({
      queryKey: ["/api/costforge/cost-matrices", { revalArea, buildingType }],
      queryFn: () =>
        apiRequest(`/api/costforge/cost-matrices?revalArea=${encodeURIComponent(revalArea)}&buildingType=${encodeURIComponent(buildingType)}`),
      enabled: !!revalArea && !!buildingType,
    });
  };

  // Import cost matrix entries from JSON
  const importFromJson = useMutation({
    mutationFn: async (data: any[]) => {
      return apiRequest("/api/costforge/cost-matrices/import", {
        method: "POST",
        body: JSON.stringify({ data })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-matrices"] });
      toast({
        title: "Cost matrix imported",
        description: "The cost matrix entries have been successfully imported.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import cost matrix entries.",
        variant: "destructive",
      });
    },
  });

  // Update cost matrix entry
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CostMatrix> }) => {
      return apiRequest(`/api/costforge/cost-matrices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-matrices"] });
      toast({
        title: "Cost matrix updated",
        description: "The cost matrix entry has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update cost matrix entry.",
        variant: "destructive",
      });
    },
  });

  // Delete cost matrix entry
  const remove = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/costforge/cost-matrices/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-matrices"] });
      toast({
        title: "Cost matrix deleted",
        description: "The cost matrix entry has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete cost matrix entry.",
        variant: "destructive",
      });
    },
  });

  // Create a new cost matrix entry
  const create = useMutation({
    mutationFn: async (data: Omit<CostMatrix, "id" | "createdAt" | "updatedAt">) => {
      return apiRequest("/api/costforge/cost-matrices", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costforge/cost-matrices"] });
      toast({
        title: "Cost matrix created",
        description: "A new cost matrix entry has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create cost matrix entry.",
        variant: "destructive",
      });
    },
  });

  return {
    getAll,
    getById,
    getByRevalArea,
    getByBuildingType,
    getByRevalAreaAndBuildingType,
    importFromJson,
    create,
    update,
    remove,
  };
}
