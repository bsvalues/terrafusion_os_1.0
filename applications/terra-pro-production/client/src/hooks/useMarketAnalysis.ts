import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MarketAnalysis, InsertMarketAnalysis } from "@shared/schema";

/**
 * Hook for working with market analysis data in the application
 */
export function useMarketAnalysis(reportId?: number) {
  const queryClient = useQueryClient();

  // Fetch all market analyses for a report
  const analysesQuery = useQuery({
    queryKey: reportId ? ["/api/reports", reportId, "market-analyses"] : null,
    queryFn: async () => {
      if (!reportId) return [];
      const response = await apiRequest(`/api/reports/${reportId}/market-analyses`);
      return response.json();
    },
    enabled: !!reportId,
  });

  // Fetch a specific type of market analysis for a report
  const getAnalysisByType = (type: string) => {
    return useQuery({
      queryKey: reportId ? ["/api/reports", reportId, "market-analysis", type] : null,
      queryFn: async () => {
        if (!reportId) return null;
        const response = await apiRequest(`/api/reports/${reportId}/market-analysis/${type}`);
        return response.json();
      },
      enabled: !!reportId && !!type,
    });
  };

  // Fetch a single market analysis by ID
  const getAnalysisById = (analysisId: number) => {
    return useQuery({
      queryKey: ["/api/market-analyses", analysisId],
      queryFn: async () => {
        const response = await apiRequest(`/api/market-analyses/${analysisId}`);
        return response.json();
      },
      enabled: !!analysisId,
    });
  };

  // Create a new market analysis
  const createAnalysisMutation = useMutation({
    mutationFn: async (analysis: InsertMarketAnalysis) => {
      const response = await apiRequest("/api/market-analyses", {
        method: "POST",
        body: JSON.stringify(analysis),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (reportId) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "market-analyses"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "market-analysis", data.analysisType],
        });
      }
    },
  });

  // Update an existing market analysis
  const updateAnalysisMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMarketAnalysis> }) => {
      const response = await apiRequest(`/api/market-analyses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/market-analyses", data.id] });
      if (reportId) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "market-analyses"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "market-analysis", data.analysisType],
        });
      }
    },
  });

  // Delete a market analysis
  const deleteAnalysisMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/market-analyses/${id}`, {
        method: "DELETE",
      });
      return id;
    },
    onSuccess: (_, variables, context: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/market-analyses", variables] });
      if (reportId) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "market-analyses"] });
        if (context?.analysisType) {
          queryClient.invalidateQueries({
            queryKey: ["/api/reports", reportId, "market-analysis", context.analysisType],
          });
        }
      }
    },
  });

  // Generate market analysis using AI
  const generateMarketAnalysisMutation = useMutation({
    mutationFn: async ({
      reportId,
      location,
      propertyType,
      aiProvider = "auto",
    }: {
      reportId: number;
      location: string;
      propertyType: string;
      aiProvider?: "auto" | "openai" | "anthropic";
    }) => {
      // First, get the AI to generate the analysis
      const aiResponse = await apiRequest("/api/ai/generate-market-analysis", {
        method: "POST",
        body: JSON.stringify({
          location,
          propertyType,
          aiProvider,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const analysisData = await aiResponse.json();

      // Then create a market analysis record with the results
      const createResponse = await apiRequest("/api/market-analyses", {
        method: "POST",
        body: JSON.stringify({
          reportId,
          analysisType: analysisData.analysisType || "trend",
          description: analysisData.description || `Market analysis for ${location}`,
          data: analysisData,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return createResponse.json();
    },
    onSuccess: (data) => {
      if (reportId) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "market-analyses"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/reports", reportId, "market-analysis", data.analysisType],
        });
      }
    },
  });

  return {
    // Queries
    analyses: (analysesQuery.data as MarketAnalysis[]) || [],
    isLoadingAnalyses: analysesQuery.isLoading,
    getAnalysisByType,
    getAnalysisById,

    // Mutations
    createAnalysis: createAnalysisMutation.mutate,
    isCreatingAnalysis: createAnalysisMutation.isPending,
    updateAnalysis: updateAnalysisMutation.mutate,
    isUpdatingAnalysis: updateAnalysisMutation.isPending,
    deleteAnalysis: deleteAnalysisMutation.mutate,
    isDeletingAnalysis: deleteAnalysisMutation.isPending,
    generateMarketAnalysis: generateMarketAnalysisMutation.mutate,
    isGeneratingMarketAnalysis: generateMarketAnalysisMutation.isPending,
  };
}
