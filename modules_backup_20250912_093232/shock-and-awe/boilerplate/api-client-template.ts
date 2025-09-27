// NO HARDCODED PORTS! Use environment variables.
/**
 * TerraFusion API Client Template
 * Production-ready HTTP client with authentication, caching, and error handling
 *
 * Usage:
 * const api = new TerraFusionAPIClient('http://localhost:${TF_STATIC_PORT:-8080}');
 * const assessment = await api.assessments.create(propertyData);
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  authToken?: string;
  enableCache?: boolean;
}

export interface TerraFusionResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

export interface PropertyAssessment {
  id: string;
  parcelNumber: string;
  address: string;
  landValue: number;
  improvementValue: number;
  totalAssessedValue: number;
  marketValue: number;
  confidence: number;
  lastUpdated: string;
  aiAnalysis: {
    comparableProperties: Array<{
      address: string;
      salePrice: number;
      adjustedValue: number;
      distance: number;
    }>;
    marketTrends: {
      trend: 'increasing' | 'decreasing' | 'stable';
      changePercent: number;
      timeframe: string;
    };
    riskFactors: string[];
  };
}

export interface CreateAssessmentRequest {
  parcelNumber: string;
  address: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  lotSize: number;
  buildingArea?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  requestedBy: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'assessor' | 'admin' | 'viewer';
  countyId: string;
  permissions: string[];
  lastLogin: string;
}

export class TerraFusionAPIClient {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private config: APIClientConfig;

  constructor(config: APIClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      enableCache: true,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Client-Name': 'TerraFusion-SDK',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth and logging
    this.client.interceptors.request.use(
      config => {
        if (this.config.authToken) {
          config.headers.Authorization = `Bearer ${this.config.authToken}`;
        }

        config.headers['X-Request-ID'] = this.generateRequestId();

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor - handle errors and caching
    this.client.interceptors.response.use(
      (response: AxiosResponse<TerraFusionResponse>) => {
        console.log(`[API Response] ${response.status} - ${response.config.url}`);

        // Cache successful GET requests
        if (this.config.enableCache && response.config.method === 'get') {
          const cacheKey = this.getCacheKey(response.config);
          this.cache.set(cacheKey, {
            data: response.data,
            expiry: Date.now() + 300000, // 5 minutes
          });
        }

        return response;
      },
      async error => {
        console.error(
          `[API Error] ${error.response?.status} - ${error.config?.url}:`,
          error.message
        );

        // Retry logic for transient errors
        if (this.shouldRetry(error) && error.config._retryCount < this.config.retryAttempts) {
          error.config._retryCount = (error.config._retryCount || 0) + 1;
          await this.delay(1000 * error.config._retryCount);
          return this.client.request(error.config);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ENOTFOUND' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}_${config.url}_${JSON.stringify(config.params)}`;
  }

  private formatError(error: any): Error {
    if (error.response) {
      return new Error(
        `API Error ${error.response.status}: ${error.response.data?.message || error.message}`
      );
    } else if (error.request) {
      return new Error('Network Error: No response received from server');
    } else {
      return new Error(`Request Error: ${error.message}`);
    }
  }

  public setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Assessment endpoints
  public readonly assessments = {
    create: async (data: CreateAssessmentRequest): Promise<PropertyAssessment> => {
      const response = await this.client.post<TerraFusionResponse<PropertyAssessment>>(
        '/api/assessments',
        data
      );
      return response.data.data;
    },

    getById: async (id: string): Promise<PropertyAssessment> => {
      const response = await this.client.get<TerraFusionResponse<PropertyAssessment>>(
        `/api/assessments/${id}`
      );
      return response.data.data;
    },

    getByParcel: async (parcelNumber: string): Promise<PropertyAssessment[]> => {
      const response = await this.client.get<TerraFusionResponse<PropertyAssessment[]>>(
        `/api/assessments/parcel/${parcelNumber}`
      );
      return response.data.data;
    },

    search: async (query: {
      address?: string;
      minValue?: number;
      maxValue?: number;
      propertyType?: string;
      page?: number;
      limit?: number;
    }): Promise<{
      assessments: PropertyAssessment[];
      total: number;
      page: number;
      limit: number;
    }> => {
      const response = await this.client.get<TerraFusionResponse<any>>('/api/assessments/search', {
        params: query,
      });
      return response.data.data;
    },

    update: async (
      id: string,
      data: Partial<CreateAssessmentRequest>
    ): Promise<PropertyAssessment> => {
      const response = await this.client.put<TerraFusionResponse<PropertyAssessment>>(
        `/api/assessments/${id}`,
        data
      );
      return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(`/api/assessments/${id}`);
    },
  };

  // Authentication endpoints
  public readonly auth = {
    login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
      const response = await this.client.post<TerraFusionResponse<any>>('/api/auth/login', {
        username,
        password,
      });
      const { token, user } = response.data.data;
      this.setAuthToken(token);
      return { token, user };
    },

    refresh: async (): Promise<{ token: string }> => {
      const response = await this.client.post<TerraFusionResponse<any>>('/api/auth/refresh');
      const { token } = response.data.data;
      this.setAuthToken(token);
      return { token };
    },

    logout: async (): Promise<void> => {
      await this.client.post('/api/auth/logout');
      this.config.authToken = undefined;
    },

    getCurrentUser: async (): Promise<User> => {
      const response = await this.client.get<TerraFusionResponse<User>>('/api/auth/me');
      return response.data.data;
    },
  };

  // Analytics endpoints
  public readonly analytics = {
    getMarketTrends: async (region: string, timeframe: string): Promise<any> => {
      const response = await this.client.get<TerraFusionResponse<any>>(
        '/api/analytics/market-trends',
        {
          params: { region, timeframe },
        }
      );
      return response.data.data;
    },

    getAssessmentStats: async (countyId: string): Promise<any> => {
      const response = await this.client.get<TerraFusionResponse<any>>(
        `/api/analytics/assessment-stats/${countyId}`
      );
      return response.data.data;
    },

    getPerformanceMetrics: async (): Promise<any> => {
      const response = await this.client.get<TerraFusionResponse<any>>(
        '/api/analytics/performance'
      );
      return response.data.data;
    },
  };

  // System health endpoints
  public readonly health = {
    check: async (): Promise<{
      status: string;
      services: Record<string, string>;
      timestamp: string;
    }> => {
      const response = await this.client.get<TerraFusionResponse<any>>('/api/health');
      return response.data.data;
    },

    detailed: async (): Promise<any> => {
      const response = await this.client.get<TerraFusionResponse<any>>('/api/health/detailed');
      return response.data.data;
    },
  };
}

// Export convenience functions
export const createAPIClient = (config: APIClientConfig): TerraFusionAPIClient => {
  return new TerraFusionAPIClient(config);
};

export const createDefaultClient = (baseURL: string, authToken?: string): TerraFusionAPIClient => {
  return new TerraFusionAPIClient({
    baseURL,
    authToken,
    timeout: 30000,
    retryAttempts: 3,
    enableCache: true,
  });
};

// Usage Examples:
/*
// Basic usage
const api = createDefaultClient('https://api.terrafusion.gov');

// With authentication
const api = createDefaultClient('https://api.terrafusion.gov', 'your-jwt-token');

// Custom configuration
const api = createAPIClient({
  baseURL: 'https://api.terrafusion.gov',
  timeout: 60000,
  retryAttempts: 5,
  enableCache: false
});

// Login and create assessment
try {
  const { token, user } = await api.auth.login('assessor@county.gov', 'password');
  console.log(`Logged in as ${user.username}`);
  
  const assessment = await api.assessments.create({
    parcelNumber: '12345',
    address: '123 Main St, Anytown, ST 12345',
    propertyType: 'residential',
    lotSize: 0.25,
    buildingArea: 1200,
    yearBuilt: 1995,
    bedrooms: 3,
    bathrooms: 2,
    requestedBy: user.id
  });
  
  console.log(`Assessment created: ${assessment.totalAssessedValue}`);
} catch (error) {
  console.error('API Error:', error);
}
*/
