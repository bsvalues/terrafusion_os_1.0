/**
 * CostForge AI Enhanced API Service
 * Advanced TypeScript integration layer for TerraFusion CostForge AI
 *
 * Features:
 * - Quantum-enhanced property valuation
 * - Real-time AI swarm coordination
 * - Harris PACS integration
 * - Batch processing capabilities
 * - Performance monitoring
 */

// API Configuration
const COSTFORGE_CONFIG = {
  API_BASE_URL: (import.meta as any).env?.VITE_COSTFORGE_API_URL || 'http://localhost:8002',
  BACKEND_URL: (import.meta as any).env?.VITE_TERRAFUSION_BACKEND_URL || 'http://localhost:5000',
  QUANTUM_FACTOR: 949,
  TARGET_ACCURACY: 99.5,
  DEFAULT_TIMEOUT: 30000,
  BATCH_SIZE_LIMIT: 100
};

// Enhanced Type Definitions
export interface PropertyValuationRequest {
  parcel_id: string;
  county_id: string;
  square_footage: number;
  lot_size: number;
  year_built: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  zoning: string;
  latitude: number;
  longitude: number;
}

export interface PropertyValuationResponse {
  parcel_id: string;
  estimated_value: number;
  land_value: number;
  improvement_value: number;
  confidence_score: number;
  calculation_method: string;
  factors_considered: string[];
  comparable_properties: Record<string, number>;
  market_analysis: {
    market_trend: 'appreciating' | 'stable' | 'declining';
    price_change_12m: number;
    days_on_market: number;
    inventory_level: 'low' | 'normal' | 'high';
    buyer_demand: number;
    economic_indicators: {
      employment_rate: number;
      median_income: number;
      interest_rates: number;
    };
  };
  risk_assessment: {
    environmental_risk: number;
    natural_disaster_risk: number;
    market_volatility_risk: number;
    location_risk: number;
    structural_risk: number;
    overall_risk_score: number;
  };
  processing_time_ms: number;
  timestamp: string;
}

export interface BatchValuationRequest {
  properties: PropertyValuationRequest[];
  max_concurrency?: number;
}

export interface BatchValuationResponse {
  total_requested: number;
  successful_valuations: number;
  failed_valuations: number;
  processing_time_ms: number;
  results: PropertyValuationResponse[];
  errors: string[];
}

export interface CostForgeStatus {
  service_name: string;
  version: string;
  status: 'optimal' | 'operational' | 'degraded' | 'critical';
  quantum_factor: number;
  target_accuracy: number;
  models_loaded: number;
  active_inferences: number;
  total_inferences: number;
  avg_processing_time_ms: number;
  avg_confidence_score: number;
  uptime_seconds: number;
}

export interface AIAgentStatus {
  total_agents: number;
  active_agents: number;
  idle_agents: number;
  busy_agents: number;
  average_utilization: number;
  agents: AgentDetails[];
}

export interface AgentDetails {
  agent_id: string;
  status: 'active' | 'idle' | 'busy';
  current_task: string;
  tasks_completed: number;
  performance_score: number;
  last_activity: string;
}

export interface PerformanceMetrics {
  total_metrics: number;
  recent_metrics_count: number;
  avg_processing_time_ms: number;
  avg_confidence_score: number;
  quantum_factor: number;
  target_accuracy: number;
  recent_metrics: Array<{
    timestamp: string;
    parcel_id: string;
    processing_time_ms: number;
    confidence_score: number;
    estimated_value: number;
    quantum_factor: number;
  }>;
}

export interface HarrisPACSSync {
  county_id: string;
  status: 'completed' | 'running' | 'failed';
  records_processed: number;
  records_updated: number;
  sync_duration_ms: number;
  timestamp: string;
  errors?: string[];
}

// API Response wrapper
export interface APIResponse<T> {
  data?: T;
  error?: {
    code: number;
    message: string;
    timestamp: string;
  };
  success: boolean;
  processing_time_ms?: number;
}

// Enhanced CostForge API Service Class
export class CostForgeAIService {
  private baseURL: string;
  private backendURL: string;
  private timeout: number;

  constructor(
    baseURL: string = COSTFORGE_CONFIG.API_BASE_URL,
    backendURL: string = COSTFORGE_CONFIG.BACKEND_URL
  ) {
    this.baseURL = baseURL;
    this.backendURL = backendURL;
    this.timeout = COSTFORGE_CONFIG.DEFAULT_TIMEOUT;
  }

  /**
   * Generic API request handler with enhanced error handling and retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useBackend: boolean = false,
    retries: number = 3
  ): Promise<APIResponse<T>> {
    const url = `${useBackend ? this.backendURL : this.baseURL}${endpoint}`;
    const startTime = performance.now();

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Quantum-Factor': COSTFORGE_CONFIG.QUANTUM_FACTOR.toString(),
        'X-Target-Accuracy': COSTFORGE_CONFIG.TARGET_ACCURACY.toString(),
        ...options.headers,
      },
      timeout: this.timeout,
      ...options,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);
        const processingTime = performance.now() - startTime;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();

        return {
          data,
          success: true,
          processing_time_ms: processingTime
        };

      } catch (error) {
        console.error(`API request attempt ${attempt} failed:`, error);

        if (attempt === retries) {
          return {
            error: {
              code: 500,
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            },
            success: false,
            processing_time_ms: performance.now() - startTime
          };
        }

        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Health check for both Python API and C# backend
   */
  async healthCheck(): Promise<APIResponse<{ python_api: any; backend: any }>> {
    try {
      const [pythonHealth, backendHealth] = await Promise.allSettled([
        this.request('/health'),
        this.request('/health', {}, true)
      ]);

      return {
        data: {
          python_api: pythonHealth.status === 'fulfilled' ? pythonHealth.value.data : { status: 'error' },
          backend: backendHealth.status === 'fulfilled' ? backendHealth.value.data : { status: 'error' }
        },
        success: true
      };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Health check failed',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get comprehensive service status
   */
  async getServiceStatus(): Promise<APIResponse<CostForgeStatus>> {
    return this.request<CostForgeStatus>('/status');
  }

  /**
   * Calculate single property valuation with quantum enhancement
   */
  async calculatePropertyValuation(
    request: PropertyValuationRequest
  ): Promise<APIResponse<PropertyValuationResponse>> {
    console.log(`🧮 Calculating quantum valuation for parcel ${request.parcel_id}`);

    const result = await this.request<PropertyValuationResponse>(
      '/api/calculate-valuation',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    if (result.success && result.data) {
      console.log(`✅ Valuation completed: $${result.data.estimated_value.toLocaleString()} (${result.data.confidence_score.toFixed(1)}% confidence)`);
    }

    return result;
  }

  /**
   * Calculate batch property valuations with parallel processing
   */
  async batchCalculateValuations(
    request: BatchValuationRequest
  ): Promise<APIResponse<BatchValuationResponse>> {

    // Validate batch size
    if (request.properties.length > COSTFORGE_CONFIG.BATCH_SIZE_LIMIT) {
      return {
        error: {
          code: 400,
          message: `Batch size exceeds limit of ${COSTFORGE_CONFIG.BATCH_SIZE_LIMIT}`,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }

    console.log(`🚀 Starting batch valuation for ${request.properties.length} properties`);

    const result = await this.request<BatchValuationResponse>(
      '/api/batch-calculate-valuations',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    if (result.success && result.data) {
      console.log(`✅ Batch completed: ${result.data.successful_valuations}/${result.data.total_requested} successful`);
    }

    return result;
  }

  /**
   * Get AI agent status and swarm coordination metrics
   */
  async getAIAgentStatus(): Promise<APIResponse<AIAgentStatus>> {
    return this.request<AIAgentStatus>('/api/costforge/agents/status', {}, true);
  }

  /**
   * Scale AI agents dynamically
   */
  async scaleAIAgents(targetCount: number): Promise<APIResponse<{ target_count: number; current_count: number }>> {
    return this.request(
      '/api/costforge/agents/scale',
      {
        method: 'POST',
        body: JSON.stringify({ target_count: targetCount }),
      },
      true
    );
  }

  /**
   * Get performance metrics for monitoring
   */
  async getPerformanceMetrics(): Promise<APIResponse<PerformanceMetrics>> {
    return this.request<PerformanceMetrics>('/api/performance-metrics');
  }

  /**
   * Get ML models information
   */
  async getModelsInfo(): Promise<APIResponse<any>> {
    return this.request('/api/models');
  }

  /**
   * Trigger Harris PACS synchronization
   */
  async syncHarrisPACS(countyId: string): Promise<APIResponse<HarrisPACSSync>> {
    console.log(`🔄 Triggering Harris PACS sync for county ${countyId}`);

    const result = await this.request<HarrisPACSSync>(
      `/api/sync-harris-pacs?county_id=${countyId}`,
      { method: 'POST' }
    );

    if (result.success) {
      console.log(`✅ Harris PACS sync completed for ${countyId}`);
    }

    return result;
  }

  /**
   * Get system analytics and insights
   */
  async getAnalytics(startDate?: Date, endDate?: Date): Promise<APIResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());

    return this.request(`/api/costforge/analytics?${params.toString()}`, {}, true);
  }

  /**
   * Real-time monitoring connection
   */
  async connectWebSocket(onMessage: (data: any) => void): Promise<WebSocket | null> {
    try {
      const wsUrl = this.baseURL.replace('http', 'ws') + '/ws/monitoring';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔗 CostForge AI WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('🔌 CostForge AI WebSocket disconnected');
      };

      return ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      return null;
    }
  }

  /**
   * Test connectivity to all services
   */
  async testConnectivity(): Promise<{
    python_api: boolean;
    backend: boolean;
    overall: boolean;
  }> {
    try {
      const healthResponse = await this.healthCheck();

      const pythonHealthy = healthResponse.data?.python_api?.status === 'healthy';
      const backendHealthy = healthResponse.data?.backend?.status === 'healthy';

      return {
        python_api: pythonHealthy,
        backend: backendHealthy,
        overall: pythonHealthy && backendHealthy
      };
    } catch (error) {
      return {
        python_api: false,
        backend: false,
        overall: false
      };
    }
  }
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'optimal': return '#00ffaa';  // Success green
    case 'operational': return '#0099ff';  // Trust blue
    case 'degraded': return '#ffaa00';  // Warning orange
    case 'critical': return '#ff4444';  // Error red
    default: return '#666666';  // Gray
  }
};

export const calculateROI = (estimatedValue: number, currentValue: number): number => {
  return ((estimatedValue - currentValue) / currentValue) * 100;
};

export const assessAccuracy = (confidenceScore: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (confidenceScore >= 98) return 'excellent';
  if (confidenceScore >= 95) return 'good';
  if (confidenceScore >= 90) return 'fair';
  return 'poor';
};

// Export singleton instance
export const costForgeAI = new CostForgeAIService();

// Export configuration
export { COSTFORGE_CONFIG };

// Default export
export default CostForgeAIService;
