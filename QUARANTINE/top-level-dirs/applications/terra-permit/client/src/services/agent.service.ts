/**
 * Agent Service
 * 
 * This service handles API communication with the specialized agent endpoints.
 * It provides functions for analyzing permits, neighborhoods, and handling complex questions.
 */

import { apiRequest } from "@/lib/queryClient";

export interface PermitAnalysisRequest {
  permitId: number;
}

export interface PermitAnalysisResponse {
  permitId: number;
  analysis: string;
  insights: string[];
  recommendations: string[];
  codeReferences?: string[];
  similarPermits?: any[];
  steps?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
}

export interface BulkPermitAnalysisRequest {
  permitIds: number[];
  optimizationLevel?: 'speed' | 'depth' | 'balanced';
}

export interface BulkPermitAnalysisResponse {
  results: PermitAnalysisResponse[];
  batchSummary: {
    totalPermits: number;
    processedPermits: number;
    commonInsights: string[];
    commonRecommendations: string[];
    processingTime: number;
  };
  trends: {
    categories: Record<string, number>;
    approvalRates: Record<string, number>;
    neighborhoodDistribution: Record<string, number>;
  };
}

export interface NeighborhoodAnalysisRequest {
  code: string;
}

export interface NeighborhoodAnalysisResponse {
  neighborhoodCode: string;
  summary: string;
  insights: string[];
  trends: Record<string, any>;
  recommendations: string[];
  error?: string;
}

export interface QuestionRequest {
  question: string;
  permitId?: number;
}

export interface QuestionResponse {
  question: string;
  answer: string;
  permitId: number | null;
  sources: any[];
  error?: string;
}

export interface DecisionImpactRequest {
  permitId: number;
  decision?: boolean;
}

export interface DecisionImpactResponse {
  permitId: number;
  impactAnalysis: string;
  steps?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
}

/**
 * Analyze a specific permit in depth
 * @param permitId The ID of the permit to analyze
 * @returns Analysis of the permit
 */
export async function analyzePermit(permitId: number): Promise<PermitAnalysisResponse> {
  return apiRequest<PermitAnalysisResponse>({
    url: `/api/ai/agent/analyze-permit/${permitId}`,
    method: 'GET'
  });
}

/**
 * Analyze neighborhood patterns in permit processing
 * @param code The neighborhood code to analyze
 * @returns Analysis of permit patterns in the neighborhood
 */
export async function analyzeNeighborhood(code: string): Promise<NeighborhoodAnalysisResponse> {
  return apiRequest<NeighborhoodAnalysisResponse>({
    url: `/api/ai/agent/neighborhood/${code}`,
    method: 'GET'
  });
}

/**
 * Answer a complex permit-related question
 * @param question The user's question
 * @param permitId Optional permit ID for context
 * @returns Detailed answer with supporting evidence
 */
export async function askQuestion(question: string, permitId?: number): Promise<QuestionResponse> {
  return apiRequest<QuestionResponse>({
    url: '/api/ai/agent/question',
    method: 'POST',
    body: JSON.stringify({ question, permitId })
  });
}

/**
 * Analyze the potential impact of a permit decision
 * @param permitId The ID of the permit to analyze
 * @param decision Optional decision override (true = approve, false = reject)
 * @returns Analysis of the impact of the decision
 */
export async function analyzeDecisionImpact(permitId: number, decision?: boolean): Promise<DecisionImpactResponse> {
  return apiRequest<DecisionImpactResponse>({
    url: '/api/ai/agent/decision-impact',
    method: 'POST',
    body: JSON.stringify({ permitId, decision })
  });
}

/**
 * Process multiple permits in bulk with optimized analysis
 * @param permitIds Array of permit IDs to analyze
 * @param optimizationLevel Optimization strategy for balancing speed vs. depth
 * @returns Bulk analysis results with trends and insights
 */
export async function analyzeBulkPermits(
  permitIds: number[],
  optimizationLevel: 'speed' | 'depth' | 'balanced' = 'balanced'
): Promise<BulkPermitAnalysisResponse> {
  return apiRequest<BulkPermitAnalysisResponse>({
    url: '/api/ai/agent/bulk-analyze',
    method: 'POST',
    body: JSON.stringify({ permitIds, optimizationLevel })
  });
}