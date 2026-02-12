import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Custom hook to interact with the AI assistant API endpoints
 */
export function useAIAssistant() {
  // Analyze property
  const analyzePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const res = await apiRequest("POST", "/api/ai/analyze-property", { propertyId });
      return await res.json();
    },
  });

  // Analyze comparables
  const analyzeComparablesMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await apiRequest("POST", "/api/ai/analyze-comparables", { reportId });
      return await res.json();
    },
  });

  // Generate narrative
  const generateNarrativeMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await apiRequest("POST", "/api/ai/generate-narrative", { reportId });
      return await res.json();
    },
  });

  // Validate UAD compliance
  const validateUADMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await apiRequest("POST", "/api/ai/validate-uad", { reportId });
      return await res.json();
    },
  });

  // Smart search for comparables
  const smartSearchMutation = useMutation({
    mutationFn: async ({
      searchQuery,
      propertyId,
    }: {
      searchQuery: string;
      propertyId: number;
    }) => {
      const res = await apiRequest("POST", "/api/ai/smart-search", { searchQuery, propertyId });
      return await res.json();
    },
  });

  // Chat with AI assistant
  const chatQueryMutation = useMutation({
    mutationFn: async ({ question, reportId }: { question: string; reportId?: number }) => {
      const res = await apiRequest("POST", "/api/ai/chat", { question, reportId });
      return await res.json();
    },
  });

  // Market-based adjustment analysis
  const marketAdjustmentsMutation = useMutation({
    mutationFn: async ({ marketArea, salesData }: { marketArea: string; salesData: any[] }) => {
      const res = await apiRequest("POST", "/api/ai/market-adjustments", { marketArea, salesData });
      return await res.json();
    },
  });

  return {
    analyzeProperty: analyzePropertyMutation.mutateAsync,
    analyzeComparables: analyzeComparablesMutation.mutateAsync,
    generateNarrative: generateNarrativeMutation.mutateAsync,
    validateUAD: validateUADMutation.mutateAsync,
    smartSearch: smartSearchMutation.mutateAsync,
    chatQuery: chatQueryMutation.mutateAsync,
    marketAdjustments: marketAdjustmentsMutation.mutateAsync,

    // Loading states
    isAnalyzingProperty: analyzePropertyMutation.isPending,
    isAnalyzingComparables: analyzeComparablesMutation.isPending,
    isGeneratingNarrative: generateNarrativeMutation.isPending,
    isValidatingUAD: validateUADMutation.isPending,
    isSearching: smartSearchMutation.isPending,
    isChatQuerying: chatQueryMutation.isPending,
    isAnalyzingMarketAdjustments: marketAdjustmentsMutation.isPending,

    // Reset states
    resetAnalyzeProperty: analyzePropertyMutation.reset,
    resetAnalyzeComparables: analyzeComparablesMutation.reset,
    resetGenerateNarrative: generateNarrativeMutation.reset,
    resetValidateUAD: validateUADMutation.reset,
    resetSmartSearch: smartSearchMutation.reset,
    resetChatQuery: chatQueryMutation.reset,
    resetMarketAdjustments: marketAdjustmentsMutation.reset,
  };
}
