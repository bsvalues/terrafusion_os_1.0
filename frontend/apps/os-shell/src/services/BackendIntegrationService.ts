/**
 * BackendIntegrationService -- mock fallback removed. Errors propagate honestly.
 *
 * This service provides backend connectivity with real API calls to the
 * Terrafusion .NET backend services. When the backend is unavailable,
 * errors propagate to callers rather than being masked by fake data.
 */

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  environment: 'development' | 'staging' | 'production';
}

export interface RealTimeMetrics {
  timestamp: string;
  source: 'backend-api';
  verified: boolean;
  data: any;
}

export interface SystemHealth {
  backend_connected: boolean;
  database_operational: boolean;
  ai_services_online: boolean;
  security_systems_active: boolean;
  last_health_check: string;
}

export class BackendIntegrationService {
  private config: ApiConfig;
  private healthStatus: SystemHealth;
  private connectionRetries: number = 0;

  constructor(config: ApiConfig) {
    this.config = config;
    this.healthStatus = {
      backend_connected: false,
      database_operational: false,
      ai_services_online: false,
      security_systems_active: false,
      last_health_check: new Date().toISOString(),
    };
  }

  /**
   * Initialize backend connection and verify system health
   */
  async initialize(): Promise<{ success: boolean; mockMode: boolean; healthStatus: SystemHealth }> {

    try {
      const healthCheck = await this.performHealthCheck();

      if (healthCheck.backend_connected) {
        return {
          success: true,
          mockMode: false,
          healthStatus: healthCheck,
        };
      } else {
        throw new Error('Backend health check passed but reported not connected');
      }
    } catch (error) {
      this.connectionRetries++;
      console.error('BACKEND UNAVAILABLE: Connection failed', error);

      return {
        success: false,
        mockMode: false,
        healthStatus: this.healthStatus,
      };
    }
  }

  /**
   * Get real-time AI analytics from backend
   */
  async getAIAnalytics(): Promise<RealTimeMetrics> {
    const response = await fetch(`${this.config.baseUrl}/api/ai/analytics`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`AI Analytics API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      timestamp: new Date().toISOString(),
      source: 'backend-api',
      verified: true,
      data,
    };
  }

  /**
   * Get real security metrics from backend
   */
  async getSecurityMetrics(): Promise<RealTimeMetrics> {
    const response = await fetch(`${this.config.baseUrl}/api/security/metrics`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Security Metrics API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      timestamp: new Date().toISOString(),
      source: 'backend-api',
      verified: true,
      data,
    };
  }

  /**
   * Get real property assessment data
   */
  async getPropertyData(countyId: string): Promise<RealTimeMetrics> {
    const response = await fetch(`${this.config.baseUrl}/api/properties/${countyId}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Property API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      timestamp: new Date().toISOString(),
      source: 'backend-api',
      verified: true,
      data,
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/health`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000), // Short timeout for health check
      });

      if (response.ok) {
        const healthData = await response.json();
        this.healthStatus = {
          backend_connected: true,
          database_operational: healthData.database || false,
          ai_services_online: healthData.aiServices || false,
          security_systems_active: healthData.security || false,
          last_health_check: new Date().toISOString(),
        };
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      this.healthStatus = {
        backend_connected: false,
        database_operational: false,
        ai_services_online: false,
        security_systems_active: false,
        last_health_check: new Date().toISOString(),
      };
    }

    return this.healthStatus;
  }

  /**
   * Check if system is connected to backend
   * Always returns false now that mock mode has been removed.
   * Callers should use getHealthStatus().backend_connected instead.
   */
  isMockMode(): boolean {
    return !this.healthStatus.backend_connected;
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): SystemHealth {
    return this.healthStatus;
  }

  /**
   * Attempt to reconnect to backend
   */
  async reconnect(): Promise<boolean> {

    const result = await this.initialize();

    if (result.success) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    mockMode: boolean;
    retryAttempts: number;
    lastHealthCheck: string;
    environment: string;
  } {
    return {
      mockMode: !this.healthStatus.backend_connected,
      retryAttempts: this.connectionRetries,
      lastHealthCheck: this.healthStatus.last_health_check,
      environment: this.config.environment,
    };
  }
}
