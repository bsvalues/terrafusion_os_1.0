/**
 * CostForge API Service — Non-hook wrapper for tool routing
 * =================================================================
 * R3.2: Plain async functions (NOT React hooks) wrapping the CostForge
 * backend endpoints. Required because toolServiceRouter.ts is a plain
 * module and cannot call React hooks like useCostForgeAPI.
 *
 * Mirrors the endpoints from useCostForgeAPI.ts but as standalone
 * async functions callable from any context.
 *
 * Backend: CostForgeController (/api/costforge/*)
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const COSTFORGE_API = `${API_BASE_URL}/api/costforge`;

// ============================================================================
// HELPERS
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': `tf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function forgeGet<T>(path: string): Promise<T> {
  const response = await fetch(`${COSTFORGE_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`CostForge API error: ${response.status} ${response.statusText}`);
  return response.json();
}

async function forgePost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${COSTFORGE_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`CostForge API error: ${response.status} ${response.statusText}`);
  return response.json();
}

// ============================================================================
// TYPE DEFINITIONS (matching useCostForgeAPI.ts)
// ============================================================================

export interface SalesApproachInput {
  subjectParcelId: string;
  comparables: Array<{
    parcelId: string;
    salePrice: number;
    saleDate: string;
    adjustments?: Record<string, number>;
  }>;
  adjustmentRates?: Record<string, number>;
}

export interface IncomeApproachInput {
  parcelId: string;
  grossIncome: number;
  vacancyRate: number;
  operatingExpenses: number;
  capitalizationRate: number;
  incomeType?: string;
}

export interface CostApproachInput {
  parcelId: string;
  buildingType: string;
  squareFeet: number;
  yearBuilt: number;
  quality: string;
  condition: string;
  region: string;
  landValue?: number;
}

export interface ReconciliationInput {
  parcelId: string;
  propertyType: string;
  approaches: {
    salesComparison?: { value: number; confidence: number };
    incomeCapitalization?: { value: number; confidence: number };
    costApproach?: { value: number; confidence: number };
  };
  reconciliationMethod?: string;
}

export interface CostCalculationRequest {
  propertyId?: string;
  parcelNumber?: string;
  region: string;
  buildingType: string;
  additionalParameters?: Record<string, unknown>;
}

// ============================================================================
// COSTFORGE API SERVICE (plain async functions)
// ============================================================================

export const costForgeApiService = {
  /** Run sales comparison approach — POST /api/costforge/approach/sales */
  runSalesApproach: async (input: SalesApproachInput): Promise<unknown> => {
    return forgePost('/approach/sales', input);
  },

  /** Run income capitalization approach — POST /api/costforge/approach/income */
  runIncomeApproach: async (input: IncomeApproachInput): Promise<unknown> => {
    return forgePost('/approach/income', input);
  },

  /** Run cost approach — POST /api/costforge/approach/cost */
  runCostApproach: async (input: CostApproachInput): Promise<unknown> => {
    return forgePost('/approach/cost', input);
  },

  /** Reconcile multiple approaches — POST /api/costforge/approach/reconcile */
  runReconciliation: async (input: ReconciliationInput): Promise<unknown> => {
    return forgePost('/approach/reconcile', input);
  },

  /** Get cost matrix by building type and region */
  getCostMatrix: async (buildingType: string, region: string): Promise<unknown> => {
    return forgeGet(
      `/cost-matrix/${encodeURIComponent(buildingType)}/${encodeURIComponent(region)}`
    );
  },

  /** Get cost breakdown for a property */
  getCostBreakdown: async (propertyId: string): Promise<unknown> => {
    return forgeGet(`/${encodeURIComponent(propertyId)}/breakdown`);
  },

  /** Run primary cost calculation */
  runCostCalculation: async (request: CostCalculationRequest): Promise<unknown> => {
    return forgePost('/calculate', request);
  },

  /** Get model inputs (explainability) for a property */
  getModelInputs: async (propertyId: string): Promise<unknown> => {
    return forgeGet(`/${encodeURIComponent(propertyId)}/model-inputs`);
  },
};

export default costForgeApiService;
