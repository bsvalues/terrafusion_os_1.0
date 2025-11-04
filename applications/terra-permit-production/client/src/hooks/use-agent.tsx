/**
 * Agent Hooks
 * 
 * This module provides React hooks for interacting with the specialized agent API,
 * leveraging React Query for data fetching and caching.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  analyzePermit, 
  analyzeNeighborhood, 
  askQuestion, 
  analyzeDecisionImpact,
  analyzeBulkPermits,
  PermitAnalysisResponse,
  NeighborhoodAnalysisResponse,
  QuestionResponse,
  DecisionImpactResponse,
  BulkPermitAnalysisResponse
} from "@/services/agent.service";

/**
 * Hook to analyze a permit in depth
 * @param permitId The ID of the permit to analyze
 * @param options Additional query options
 */
export function usePermitAnalysis(permitId: number, options = {}) {
  return useQuery<PermitAnalysisResponse>({
    queryKey: ['/api/ai/agent/analyze-permit', permitId],
    queryFn: () => analyzePermit(permitId),
    enabled: Boolean(permitId),
    ...options
  });
}

/**
 * Hook to analyze neighborhood patterns
 * @param code The neighborhood code
 * @param options Additional query options
 */
export function useNeighborhoodAnalysis(code: string | null, options = {}) {
  return useQuery<NeighborhoodAnalysisResponse>({
    queryKey: ['/api/ai/agent/neighborhood', code],
    queryFn: () => analyzeNeighborhood(code as string),
    enabled: Boolean(code),
    ...options
  });
}

/**
 * Hook to ask a permit-related question
 */
export function useAskQuestion() {
  return useMutation({
    mutationFn: ({ question, permitId }: { question: string, permitId?: number }) => 
      askQuestion(question, permitId),
    onSuccess: () => {
      // Could invalidate related queries if needed
    }
  });
}

/**
 * Hook to analyze decision impact
 */
export function useDecisionImpact() {
  return useMutation({
    mutationFn: ({ permitId, decision }: { permitId: number, decision?: boolean }) => 
      analyzeDecisionImpact(permitId, decision),
    onSuccess: (data) => {
      // Optionally invalidate other queries that might be affected by this analysis
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agent/analyze-permit', data.permitId] });
    }
  });
}

/**
 * Hook to analyze multiple permits in bulk
 * @param options Additional query options
 */
export function useBulkPermitAnalysis(permitIds: number[] = [], options = {}) {
  return useQuery<BulkPermitAnalysisResponse>({
    queryKey: ['/api/ai/agent/bulk-analyze', ...permitIds],
    queryFn: () => analyzeBulkPermits(permitIds),
    enabled: permitIds.length > 0,
    ...options
  });
}

/**
 * Hook to submit permits for bulk analysis
 */
export function useSubmitBulkAnalysis() {
  return useMutation({
    mutationFn: ({ permitIds, optimizationLevel }: { 
      permitIds: number[], 
      optimizationLevel?: 'speed' | 'depth' | 'balanced' 
    }) => analyzeBulkPermits(permitIds, optimizationLevel),
    onSuccess: (data) => {
      // Invalidate any related queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agent/bulk-analyze'] });
      // Also invalidate individual permit queries if needed
      data.results.forEach(result => {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/ai/agent/analyze-permit', result.permitId] 
        });
      });
    }
  });
}