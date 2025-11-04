import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdjustmentModel, InsertAdjustmentModel, ModelAdjustment } from "@shared/schema";

/**
 * Hook for working with adjustment models in the application
 */
export function useAdjustmentModels(reportId?: number) {
  const queryClient = useQueryClient();

  // Fetch all adjustment models for a report
  const modelsQuery = useQuery({
    queryKey: reportId ? ["/api/reports", reportId, "adjustment-models"] : null,
    queryFn: async () => {
      if (!reportId) return [];
      const response = await apiRequest(`/api/reports/${reportId}/adjustment-models`);
      return response.json();
    },
    enabled: !!reportId,
  });

  // Fetch a single adjustment model by ID
  const getModelById = (modelId: number) => {
    return useQuery({
      queryKey: ["/api/adjustment-models", modelId],
      queryFn: async () => {
        const response = await apiRequest(`/api/adjustment-models/${modelId}`);
        return response.json();
      },
    });
  };

  // Create a new adjustment model
  const createModelMutation = useMutation({
    mutationFn: async (model: InsertAdjustmentModel) => {
      const response = await apiRequest("/api/adjustment-models", {
        method: "POST",
        body: JSON.stringify(model),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "adjustment-models"],
        });
      }
    },
  });

  // Update an existing adjustment model
  const updateModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAdjustmentModel> }) => {
      const response = await apiRequest(`/api/adjustment-models/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/adjustment-models", data.id] });
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "adjustment-models"],
        });
      }
    },
  });

  // Delete an adjustment model
  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/adjustment-models/${id}`, {
        method: "DELETE",
      });
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/adjustment-models", id] });
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "adjustment-models"],
        });
      }
    },
  });

  // Generate an AI adjustment model
  const generateAIModelMutation = useMutation({
    mutationFn: async ({
      reportId,
      propertyId,
      aiProvider = "auto",
    }: {
      reportId: number;
      propertyId?: number;
      aiProvider?: "auto" | "openai" | "anthropic";
    }) => {
      const response = await apiRequest("/api/ai/generate-adjustment-model", {
        method: "POST",
        body: JSON.stringify({
          reportId,
          propertyId,
          useOrchestrator: true,
          aiProvider,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "adjustment-models"],
        });
      }
    },
  });

  // Get model adjustments for a specific model
  const getModelAdjustments = (modelId: number) => {
    return useQuery({
      queryKey: ["/api/adjustment-models", modelId, "adjustments"],
      queryFn: async () => {
        const response = await apiRequest(`/api/adjustment-models/${modelId}/adjustments`);
        return response.json();
      },
      enabled: !!modelId,
    });
  };

  // Get model adjustments for a comparable
  const getComparableAdjustments = (comparableId: number, modelId?: number) => {
    const queryString = modelId ? `?modelId=${modelId}` : "";

    return useQuery({
      queryKey: modelId
        ? ["/api/comparables", comparableId, "model-adjustments", modelId]
        : ["/api/comparables", comparableId, "model-adjustments"],
      queryFn: async () => {
        const response = await apiRequest(
          `/api/comparables/${comparableId}/model-adjustments${queryString}`
        );
        return response.json();
      },
      enabled: !!comparableId,
    });
  };

  // Create model adjustment
  const createAdjustmentMutation = useMutation({
    mutationFn: async (adjustment: Omit<ModelAdjustment, "id" | "createdAt" | "updatedAt">) => {
      const response = await apiRequest("/api/model-adjustments", {
        method: "POST",
        body: JSON.stringify(adjustment),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/adjustment-models", data.modelId, "adjustments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/comparables", data.comparableId, "model-adjustments"],
      });
    },
  });

  // Update model adjustment
  const updateAdjustmentMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<ModelAdjustment, "id" | "createdAt" | "updatedAt">>;
    }) => {
      const response = await apiRequest(`/api/model-adjustments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-adjustments", data.id] });
      queryClient.invalidateQueries({
        queryKey: ["/api/adjustment-models", data.modelId, "adjustments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/comparables", data.comparableId, "model-adjustments"],
      });
    },
  });

  // Delete model adjustment
  const deleteAdjustmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/model-adjustments/${id}`, {
        method: "DELETE",
      });
      return id;
    },
    onSuccess: (_, variables, context: any) => {
      if (context?.modelId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/adjustment-models", context.modelId, "adjustments"],
        });
      }
      if (context?.comparableId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/comparables", context.comparableId, "model-adjustments"],
        });
      }
    },
  });

  return {
    // Queries
    models: (modelsQuery.data as AdjustmentModel[]) || [],
    isLoadingModels: modelsQuery.isLoading,
    getModelById,
    getModelAdjustments,
    getComparableAdjustments,

    // Mutations
    createModel: createModelMutation.mutate,
    isCreatingModel: createModelMutation.isPending,
    updateModel: updateModelMutation.mutate,
    isUpdatingModel: updateModelMutation.isPending,
    deleteModel: deleteModelMutation.mutate,
    isDeletingModel: deleteModelMutation.isPending,
    generateAIModel: generateAIModelMutation.mutate,
    isGeneratingAIModel: generateAIModelMutation.isPending,
    createAdjustment: createAdjustmentMutation.mutate,
    isCreatingAdjustment: createAdjustmentMutation.isPending,
    updateAdjustment: updateAdjustmentMutation.mutate,
    isUpdatingAdjustment: updateAdjustmentMutation.isPending,
    deleteAdjustment: deleteAdjustmentMutation.mutate,
    isDeletingAdjustment: deleteAdjustmentMutation.isPending,
  };
}
