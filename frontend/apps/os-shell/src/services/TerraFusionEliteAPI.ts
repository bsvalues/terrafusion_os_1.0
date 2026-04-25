/**
 * TerraFusion API Service
 *
 * Backend-first API abstraction. It may return fresh cached evidence when a
 * prior backend response exists, but it does not fabricate operational metrics.
 */

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /**
   * Provenance of the returned payload. Disclosed to operators so the UI
   * can render a DemoDataBanner whenever the source is QUANTUM_SIMULATION.
   *
   * - BACKEND: live response from the governed API
   * - ELITE_CACHE: fresh cached response (still derived from a prior live call)
   * - QUANTUM_SIMULATION: simulated/unavailable; payload is not authoritative
   */
  source: 'BACKEND' | 'ELITE_CACHE' | 'QUANTUM_SIMULATION';
  timestamp: number;
}

interface GovernmentMetrics {
  propertyAssessment: {
    accuracy: number;
    avgResponseTime: number;
    completedAssessments: number;
  };
  citizenServices: {
    satisfactionScore: number;
    avgWaitTime: number;
    servicesCompleted: number;
  };
  budgetAnalysis: {
    efficiencyScore: number;
    costSavings: number;
    budgetCompliance: number;
  };
  complianceReporting: {
    complianceScore: number;
    reportsGenerated: number;
    auditReadiness: number;
  };
  emergencyResponse: {
    responseTime: number;
    incidentsHandled: number;
    systemReadiness: number;
  };
}

class TerraFusionEliteAPIService {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private isBackendAvailable = false;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000;

  async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isBackendAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const healthEndpoints = ['/health', '/api/health'];

      let backendFound = false;
      for (const endpoint of healthEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });

          if (response.ok) {
            backendFound = true;
            break;
          }
        } catch {
          // Try the next published health endpoint.
        }
      }

      clearTimeout(timeoutId);
      this.isBackendAvailable = backendFound;
      this.lastHealthCheck = now;
      return this.isBackendAvailable;
    } catch {
      this.isBackendAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  async makeEliteAPICall<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const timestamp = Date.now();
    const backendHealthy = await this.checkBackendHealth();

    if (backendHealthy) {
      try {
        const response = await fetch(endpoint, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-TerraFusion-Client': 'TerraFusion-OS',
            ...options?.headers,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as T;
          this.cache.set(cacheKey, { data, timestamp });

          return {
            success: true,
            data,
            source: 'BACKEND',
            timestamp,
          };
        }
      } catch {
        // Fall through to cache/unavailable response.
      }
    }

    const cached = this.cache.get(cacheKey);
    if (cached && timestamp - cached.timestamp < 300000) {
      return {
        success: true,
        data: cached.data as T,
        source: 'ELITE_CACHE',
        timestamp: cached.timestamp,
      };
    }

    return {
      success: false,
      error: 'Backend unavailable and no fresh cached evidence exists for this endpoint.',
      source: 'QUANTUM_SIMULATION',
      timestamp,
    };
  }

  async getGovernmentMetrics() {
    return this.makeEliteAPICall<GovernmentMetrics>('/api/government/excellence');
  }

  async getPropertyAssessmentData() {
    return this.makeEliteAPICall('/api/government/excellence');
  }

  async getCitizenServicesData() {
    return this.makeEliteAPICall('/api/government/excellence');
  }

  async getBudgetAnalysisData() {
    return this.makeEliteAPICall('/api/government/excellence');
  }

  async getComplianceReportingData() {
    return this.makeEliteAPICall('/api/government/excellence');
  }

  async getEmergencyResponseData() {
    return this.makeEliteAPICall('/api/government/excellence');
  }

  async getSystemHealth() {
    return this.makeEliteAPICall('/health');
  }

  async getConsciousnessData() {
    return this.makeEliteAPICall('/api/ai/consciousness');
  }

  async getConsciousnessStatus() {
    return this.makeEliteAPICall('/api/ai/consciousness');
  }

  async getEnhancedConsciousnessData() {
    return this.makeEliteAPICall('/api/ai/consciousness/enhanced');
  }

  async getTerraGaiaConsciousnessStatus() {
    return this.makeEliteAPICall('/api/ai/consciousness/status');
  }

  getOperationalMode(): 'BACKEND_CONNECTED' | 'CACHE_AVAILABLE' | 'UNAVAILABLE' {
    if (this.isBackendAvailable) return 'BACKEND_CONNECTED';
    if (this.cache.size > 0) return 'CACHE_AVAILABLE';
    return 'UNAVAILABLE';
  }

  getCacheStatus() {
    return {
      cacheSize: this.cache.size,
      backendAvailable: this.isBackendAvailable,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      operationalMode: this.getOperationalMode(),
    };
  }
}

export const terraFusionAPI = new TerraFusionEliteAPIService();
export type { APIResponse, GovernmentMetrics };
export default terraFusionAPI;
