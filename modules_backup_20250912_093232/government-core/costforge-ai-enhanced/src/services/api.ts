/**
 * CostForge API Service - Frontend to Backend Integration
 * Connects React frontend to Flask backend API
 * Part of Terrafusion Ecosystem Integration
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:\${{TF_SERVICE_8002_PORT:-8002}}';

// API Response Types
export interface CostEstimateRequest {
  projectName: string;
  buildingType: string;
  squareFootage: number;
  stories: number;
  qualityClass: string;
  region: string;
  yearBuilt: number;
  constructionType: string;
  occupancyType: string;
  notes?: string;
}

export interface CostEstimateResponse {
  estimate: {
    totalCost: number;
    costPerSquareFoot: number;
    breakdown: {
      foundation: number;
      framing: number;
      roofing: number;
      exterior: number;
      interior: number;
      electrical: number;
      plumbing: number;
      hvac: number;
      permits: number;
      contingency: number;
    };
    factors: {
      baseCost: number;
      qualityMultiplier: number;
      regionMultiplier: number;
      constructionMultiplier: number;
    };
  };
  project: CostEstimateRequest;
  metadata: {
    timestamp: string;
    version: string;
  };
}

export interface CostFactorsResponse {
  baseRates: Record<string, number>;
  qualityFactors: Record<string, number>;
  regionFactors: Record<string, number>;
  constructionFactors: Record<string, number>;
  buildingTypes: string[];
  regions: string[];
  lastUpdated: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  database: string;
  components: {
    costEngine: string;
    database: string;
    auth: string;
  };
}

class CostForgeAPIService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic API request handler with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Health check - verify backend connectivity
   */
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  /**
   * Get cost factors and configurations
   */
  async getCostFactors(): Promise<CostFactorsResponse> {
    return this.request<CostFactorsResponse>('/api/cost-factors');
  }

  /**
   * Submit cost estimation request
   */
  async estimateCost(request: CostEstimateRequest): Promise<CostEstimateResponse> {
    return this.request<CostEstimateResponse>('/api/cost-estimate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get service information
   */
  async getServiceInfo(): Promise<any> {
    return this.request('/api/info');
  }

  /**
   * Test backend connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const costForgeAPI = new CostForgeAPIService();

// Export utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export default CostForgeAPIService;
