import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

/**
 * Valid building types
 */
export const VALID_BUILDING_TYPES = [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'institutional'
];

/**
 * Valid reval areas (Benton County WA PACS Cycle areas)
 */
export const VALID_REGIONS = [
  'Reval 1',
  'Reval 2',
  'Reval 3',
  'Reval 4',
  'Reval 5',
  'Reval 6',
];

/**
 * Valid building conditions
 */
export const VALID_CONDITIONS = [
  'excellent',
  'good',
  'average',
  'fair',
  'poor'
];

/**
 * Cost prediction request parameters
 */
interface CostPredictionParams {
  buildingType: string;
  squareFootage: number;
  revalArea: string;
  yearBuilt?: number;
  condition?: string;
  complexity?: number;
  features?: string[];
}

/**
 * Cost prediction response
 */
export interface CostPredictionResponse {
  totalCost: number;
  costPerSquareFoot: number;
  confidenceScore: number;
  explanation: string;
  dataQualityScore?: number;
  anomalies?: string[];
  rawResponse?: string;
  
  // Additional fields to match the display
  baseCost?: number;
  revalAreaFactor?: number | string;
  complexityFactor?: number | string;
  costPerSqft?: number;
}

/**
 * Matrix analysis request parameters
 */
interface MatrixAnalysisParams {
  matrixData: any;
}

/**
 * Calculation explanation request parameters
 */
interface CalculationExplanationParams {
  calculationData: any;
}

/**
 * MCP status response
 */
interface MCPStatusResponse {
  status: "ready" | "api_key_missing" | "error";
  message: string;
}

/**
 * Hook for interacting with the Model Content Protocol (MCP) API
 * 
 * This hook provides functions to interact with the MCP endpoints for
 * cost prediction, matrix analysis, and calculation explanation.
 */
export function useMCP() {
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Query for checking MCP/AI module status via TerraFusion OS AI infrastructure
   * Real endpoint: GET /api/aimodules/status (AIModulesController → IAIModuleOrchestrator)
   */
  const statusQuery = useQuery({
    queryKey: ['/api/aimodules/status'],
    queryFn: async () => {
      const res = await fetch('/api/aimodules/status');
      if (!res.ok) return { status: 'error' as const, message: 'AI modules unavailable' };
      const data = await res.json();
      // Normalize TF response to MCPStatusResponse shape
      return {
        status: 'ready' as const,
        message: `${data.TotalModules ?? data.totalModules ?? 0} modules active`,
        raw: data,
      };
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });
  
  /**
   * Mutation for cost prediction
   */
  const costPredictionMutation = useMutation({
    mutationFn: async (params: CostPredictionParams) => {
      setError(null);
      
      try {
        // Route to TerraFusion OS cost estimate endpoint
        const response = await fetch('/api/costforge/cost-estimate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error predicting cost');
        }
        
        return response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(message);
        throw error;
      }
    }
  });
  
  /**
   * Mutation for matrix analysis
   */
  const matrixAnalysisMutation = useMutation({
    mutationFn: async (params: MatrixAnalysisParams) => {
      setError(null);
      
      try {
        // Route to TerraFusion OS AI module orchestrator
        const response = await fetch('/api/aimodules/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ module: 'matrix-analyzer', command: 'analyze', parameters: params }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error analyzing matrix');
        }
        
        return response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(message);
        throw error;
      }
    }
  });
  
  /**
   * Mutation for calculation explanation
   */
  const calculationExplanationMutation = useMutation({
    mutationFn: async (params: CalculationExplanationParams) => {
      setError(null);
      
      try {
        // Route to TerraFusion OS AI module orchestrator
        const response = await fetch('/api/aimodules/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ module: 'calculation-explainer', command: 'explain', parameters: params }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error explaining calculation');
        }
        
        return response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(message);
        throw error;
      }
    }
  });
  
  return {
    // Status
    mcpStatus: statusQuery.data as MCPStatusResponse | undefined,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError || !!error,
    error,
    
    // Mutations
    predictCost: costPredictionMutation.mutate,
    isPredicting: costPredictionMutation.isPending,
    
    analyzeMatrix: matrixAnalysisMutation.mutate,
    isAnalyzing: matrixAnalysisMutation.isPending,
    
    explainCalculation: calculationExplanationMutation.mutate,
    isExplaining: calculationExplanationMutation.isPending,
  };
}