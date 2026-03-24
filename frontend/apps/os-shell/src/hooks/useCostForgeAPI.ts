import { useCallback, useState } from 'react';
import { getViteEnv } from '../env/getViteEnv';

interface CostForgeAPIConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

interface CostCalculationRequest {
  propertyId?: string;
  parcelNumber?: string;
  region: string;
  buildingType: string;
  additionalParameters?: Record<string, unknown>;
}

interface CostAnalysis {
  propertyId: string;
  totalCost: number;
  landValue: number;
  improvementValue: number;
  marketAdjustment: number;
  confidenceScore: number;
  analysisDate: string;
  analysisMethod: string;
  components: CostComponent[];
}

interface CostComponent {
  name: string;
  amount: number;
  unit: string;
  quantity: number;
  unitCost: number;
}

interface CostBreakdown {
  propertyId: string;
  totalValue: number;
  categories: CostCategory[];
}

interface CostCategory {
  name: string;
  amount: number;
  percentage: number;
  components: CostComponent[];
}

interface CostComparison {
  property1: CostAnalysis;
  property2: CostAnalysis;
  varianceAmount: number;
  variancePercentage: number;
  keyDifferences: string[];
}

interface CostForecast {
  propertyId: string;
  forecastYears: number;
  currentValue: number;
  projectedValue: number;
  annualAppreciationRate: number;
  yearlyForecasts: YearlyForecast[];
}

interface YearlyForecast {
  year: number;
  projectedValue: number;
  confidenceLevel: number;
}

interface CostFactor {
  name: string;
  factor: number;
  description: string;
  region: string;
  effectiveDate: string;
}

interface CostMatrix {
  buildingType: string;
  region: string;
  baseCostPerSquareFoot: number;
  qualityFactors: Record<string, number>;
  locationFactors: Record<string, number>;
  lastUpdated: string;
}

interface SystemStatus {
  status: string;
  activeAgents: number;
  performanceScore: number;
  lastUpdate: string;
  systemMetrics: Record<string, unknown>;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerSecond: number;
  accuracyRate: number;
  totalCalculations: number;
  detailedMetrics: Record<string, number>;
}

/** Minimal response shape for /api/costforge/batch-calculate */
interface BatchCalculateResult {
  results: CostAnalysis[];
  processed: number;
  failed: number;
  countyId: string;
}

/** Minimal response shape for /api/costforge/agents/status */
interface AgentStatusResult {
  activeAgents: number;
  totalAgents: number;
  healthyAgents: number;
  agentDetails: Array<{ id: string; status: string; lastActivity: string }>;
}

/** Minimal response shape for /api/costforge/agents/scale */
interface AgentScaleResult {
  previousCount: number;
  targetCount: number;
  currentCount: number;
  scalingStatus: string;
}

/** Minimal response shape for /api/costforge/sync/county-data */
interface CountyDataSyncResult {
  countyId: string;
  syncType: string;
  recordsSynced: number;
  recordsFailed: number;
  syncStarted: string;
  syncCompleted: string;
  status: string;
}

/** @deprecated Use CountyDataSyncResult */
type HarrisPACSSyncResult = CountyDataSyncResult;

/**
 * TerraFusion CostForge API Integration Hook
 * Championship-level backend connectivity for government-grade precision
 * Implements <150ms performance SLA with JWT authentication
 */
export const useCostForgeAPI = (config: CostForgeAPIConfig) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> => {
      const startTime = performance.now();
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Correlation-ID': `tf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...((options.headers as Record<string, string>) || {}),
        };

        // Add JWT authentication if available
        const token =
          localStorage.getItem('terrafusion-jwt') || sessionStorage.getItem('terrafusion-jwt');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        if (config.apiKey) {
          headers['X-API-Key'] = config.apiKey;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

        const response = await fetch(`${config.baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();
        const duration = performance.now() - startTime;

        // Performance warning for SLA monitoring
        if (duration > 150) {
        }

        if (!response.ok) {
          throw new Error(
            responseData.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return {
          data: responseData,
          success: true,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);

        console.error('[CostForge API] Request failed:', errorMessage);

        return {
          data: {} as T,
          success: false,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  // Enhanced Cost Calculation - Primary CostForge operation
  const calculatePropertyCost = useCallback(
    async (request: CostCalculationRequest): Promise<APIResponse<CostAnalysis>> => {
      return apiCall<CostAnalysis>('/api/costforge/calculate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
    [apiCall]
  );

  // Batch Valuation for county-wide assessments
  const batchCalculateValuations = useCallback(
    async (propertyIds: string[], countyId: string): Promise<APIResponse<BatchCalculateResult>> => {
      return apiCall<BatchCalculateResult>('/api/costforge/batch-calculate', {
        method: 'POST',
        body: JSON.stringify({
          propertyIds,
          countyId,
          parameters: {},
        }),
      });
    },
    [apiCall]
  );

  // Cost Breakdown for detailed analysis visualization
  const getCostBreakdown = useCallback(
    async (propertyId: string): Promise<APIResponse<CostBreakdown>> => {
      return apiCall<CostBreakdown>(`/api/costforge/${propertyId}/breakdown`);
    },
    [apiCall]
  );

  // Cost Comparison for property assessment validation
  const compareCosts = useCallback(
    async (propertyId1: string, propertyId2: string): Promise<APIResponse<CostComparison>> => {
      return apiCall<CostComparison>(`/api/costforge/compare/${propertyId1}/${propertyId2}`);
    },
    [apiCall]
  );

  // Cost Forecast for multi-year projections
  const getCostForecast = useCallback(
    async (propertyId: string, years: number = 5): Promise<APIResponse<CostForecast>> => {
      return apiCall<CostForecast>(`/api/costforge/${propertyId}/forecast?years=${years}`);
    },
    [apiCall]
  );

  // Regional Cost Factors for Washington State compliance
  const getCostFactors = useCallback(
    async (region: string): Promise<APIResponse<CostFactor[]>> => {
      return apiCall<CostFactor[]>(`/api/costforge/factors/${region}`);
    },
    [apiCall]
  );

  // Cost Matrix for building type calculations
  const getCostMatrix = useCallback(
    async (buildingType: string, region: string): Promise<APIResponse<CostMatrix>> => {
      return apiCall<CostMatrix>(
        `/api/costforge/matrix?buildingType=${buildingType}&region=${region}`
      );
    },
    [apiCall]
  );

  // System Status for dashboard monitoring
  const getSystemStatus = useCallback(async (): Promise<APIResponse<SystemStatus>> => {
    return apiCall<SystemStatus>('/api/costforge/status');
  }, [apiCall]);

  // AI Agent Status for swarm monitoring
  const getAIAgentStatus = useCallback(async (): Promise<APIResponse<AgentStatusResult>> => {
    return apiCall<AgentStatusResult>('/api/costforge/agents/status');
  }, [apiCall]);

  // Scale AI Agents for performance optimization
  const scaleAIAgents = useCallback(
    async (targetCount: number): Promise<APIResponse<AgentScaleResult>> => {
      return apiCall<AgentScaleResult>('/api/costforge/agents/scale', {
        method: 'POST',
        body: JSON.stringify({ targetCount }),
      });
    },
    [apiCall]
  );

  // Performance Metrics for analytics
  const getPerformanceMetrics = useCallback(async (): Promise<APIResponse<PerformanceMetrics>> => {
    return apiCall<PerformanceMetrics>('/api/costforge/metrics');
  }, [apiCall]);

  // County data sync for government data integration
  const syncWithCountyData = useCallback(
    async (countyId: string, syncType: string = 'full'): Promise<APIResponse<CountyDataSyncResult>> => {
      return apiCall<CountyDataSyncResult>('/api/costforge/sync/county-data', {
        method: 'POST',
        body: JSON.stringify({
          countyId,
          syncType,
          lastSyncDate: null,
          propertyTypes: ['residential', 'commercial', 'industrial'],
        }),
      });
    },
    [apiCall]
  );

  /** @deprecated Use syncWithCountyData */
  const syncWithHarrisPACS = syncWithCountyData;

  // Connection health check
  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiCall<{ status: string }>('/api/health');
      return response.success;
    } catch {
      return false;
    }
  }, [apiCall]);

  return {
    // State
    loading,
    error,

    // Core CostForge Operations
    calculatePropertyCost,
    batchCalculateValuations,
    getCostBreakdown,
    compareCosts,
    getCostForecast,
    getCostFactors,
    getCostMatrix,

    // System Monitoring
    getSystemStatus,
    getAIAgentStatus,
    scaleAIAgents,
    getPerformanceMetrics,

    // External Integration
    syncWithCountyData,
    /** @deprecated Use syncWithCountyData */
    syncWithHarrisPACS,

    // Utilities
    healthCheck,
    apiCall, // Generic API call for custom operations
  };
};

/**
 * Backend Connection Hook with Auto-Reconnection
 * Government-grade reliability with autonomous recovery
 */
export const useBackendConnection = (baseUrl: string = (getViteEnv().VITE_API_URL || '')) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null);

  const costForgeAPI = useCostForgeAPI({ baseUrl });

  // Auto-reconnection with exponential backoff
  const checkConnection = useCallback(async () => {
    try {
      const healthy = await costForgeAPI.healthCheck();
      setIsConnected(healthy);
      setLastConnectionCheck(new Date());

      if (healthy) {
        setConnectionAttempts(0);
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionAttempts((prev) => prev + 1);


      // Exponential backoff reconnection
      const backoffDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
      setTimeout(checkConnection, backoffDelay);
    }
  }, [costForgeAPI.healthCheck, connectionAttempts]);

  // Initialize connection on mount
  useState(() => {
    checkConnection();

    // Periodic health checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  });

  return {
    isConnected,
    connectionAttempts,
    lastConnectionCheck,
    costForgeAPI,
    reconnect: checkConnection,
  };
};

export type {
  CostAnalysis,
  CostBreakdown,
  CostCalculationRequest,
  CostComparison,
  CostFactor,
  CostForecast,
  CostMatrix,
  PerformanceMetrics,
  SystemStatus,
};
