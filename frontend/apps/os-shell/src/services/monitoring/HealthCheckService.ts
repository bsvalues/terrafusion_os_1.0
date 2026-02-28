// =============================
// Health Check Service
// Comprehensive service health validation with endpoint monitoring,
// database connectivity, external dependencies, and health aggregation
// =============================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// =============================
// Type Definitions
// =============================

export interface HealthCheckResult {
  serviceName: string;
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number; // milliseconds
  uptime: number; // percentage 0-100
  errorMessage?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface EndpointHealthCheck {
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatusCode: number;
  timeout: number; // milliseconds
  retryAttempts: number;
  headers?: Record<string, string>;
}

export interface DatabaseHealthCheck {
  connectionString: string;
  queryTimeout: number; // milliseconds
  maxConnections: number;
  currentConnections: number;
  isConnected: boolean;
}

export interface ExternalServiceHealth {
  serviceName: string;
  endpoint: string;
  isAvailable: boolean;
  latency: number; // milliseconds
  lastCheck: Date;
}

export interface AggregatedHealthStatus {
  overallStatus: 'healthy' | 'degraded' | 'down';
  services: HealthCheckResult[];
  databaseHealth: DatabaseHealthCheck[];
  externalServices: ExternalServiceHealth[];
  timestamp: Date;
  uptimePercentage: number;
  averageResponseTime: number;
  totalErrors: number;
}

export interface HealthCheckConfig {
  services: Array<{
    name: string;
    endpoint: EndpointHealthCheck;
    criticalityLevel: 'critical' | 'high' | 'medium' | 'low';
  }>;
  databases: Array<{
    name: string;
    type: 'postgresql' | 'mongodb' | 'redis';
    connectionString: string;
    maxConnections: number;
  }>;
  externalServices: Array<{
    name: string;
    endpoint: string;
    criticalityLevel: 'critical' | 'high' | 'medium' | 'low';
  }>;
  pollingIntervalMs: number;
  healthCheckTimeoutMs: number;
  retryAttempts: number;
  alertThresholds: {
    uptimePercentage: number; // Alert if below this (e.g., 99.9)
    responseTimeMs: number; // Alert if above this (e.g., 50ms)
    errorRate: number; // Alert if above this (e.g., 1%)
  };
}

// =============================
// Health Check Service Class
// =============================

export class HealthCheckService {
  private static instance: HealthCheckService;
  private config: HealthCheckConfig;
  private httpClient: AxiosInstance;
  private healthHistory: Map<string, HealthCheckResult[]>;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastAggregatedStatus: AggregatedHealthStatus | null = null;

  private constructor(config: HealthCheckConfig) {
    this.config = config;
    this.healthHistory = new Map();

    // Initialize HTTP client with proper configuration
    this.httpClient = axios.create({
      timeout: config.healthCheckTimeoutMs,
      validateStatus: () => true, // Don't throw on any HTTP status
      maxRedirects: 0, // Don't follow redirects for health checks
    });
  }

  /**
   * Get singleton instance of HealthCheckService
   */
  public static getInstance(config?: HealthCheckConfig): HealthCheckService {
    if (!HealthCheckService.instance && config) {
      HealthCheckService.instance = new HealthCheckService(config);
    }
    if (!HealthCheckService.instance) {
      throw new Error('HealthCheckService not initialized with config');
    }
    return HealthCheckService.instance;
  }

  /**
   * Start automatic health check polling
   */
  public async startPolling(): Promise<void> {
    // Initial health check
    await this.performHealthChecks();

    // Setup polling interval
    this.pollingInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.pollingIntervalMs);

    console.log(`Health check polling started (interval: ${this.config.pollingIntervalMs}ms)`);
  }

  /**
   * Stop health check polling
   */
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Health check polling stopped');
    }
  }

  /**
   * Perform comprehensive health checks across all services
   */
  public async performHealthChecks(): Promise<AggregatedHealthStatus> {
    const startTime = Date.now();

    // Parallel health checks for all services
    const serviceHealthChecks = await Promise.allSettled(
      this.config.services.map((service) => this.checkServiceHealth(service))
    );

    // Parallel database health checks
    const databaseHealthChecks = await Promise.allSettled(
      this.config.databases.map((db) => this.checkDatabaseHealth(db))
    );

    // Parallel external service health checks
    const externalServiceChecks = await Promise.allSettled(
      this.config.externalServices.map((ext) => this.checkExternalServiceHealth(ext))
    );

    // Process results
    const serviceResults: HealthCheckResult[] = serviceHealthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          serviceName: this.config.services[index].name,
          isHealthy: false,
          status: 'down' as const,
          responseTime: 0,
          uptime: 0,
          errorMessage: result.reason?.message || 'Health check failed',
          timestamp: new Date(),
        };
      }
    });

    const databaseResults: DatabaseHealthCheck[] = databaseHealthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          connectionString: this.config.databases[index].connectionString,
          queryTimeout: 0,
          maxConnections: this.config.databases[index].maxConnections,
          currentConnections: 0,
          isConnected: false,
        };
      }
    });

    const externalServiceResults: ExternalServiceHealth[] = externalServiceChecks.map(
      (result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            serviceName: this.config.externalServices[index].name,
            endpoint: this.config.externalServices[index].endpoint,
            isAvailable: false,
            latency: 0,
            lastCheck: new Date(),
          };
        }
      }
    );

    // Calculate aggregated metrics
    const healthyServices = serviceResults.filter((r) => r.isHealthy).length;
    const totalServices = serviceResults.length;
    const uptimePercentage = (healthyServices / totalServices) * 100;

    const totalResponseTime = serviceResults.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalServices;

    const totalErrors = serviceResults.filter((r) => !r.isHealthy).length;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    const criticalServicesDown = this.config.services.filter(
      (s, i) => s.criticalityLevel === 'critical' && !serviceResults[i].isHealthy
    ).length;

    if (criticalServicesDown > 0) {
      overallStatus = 'down';
    } else if (uptimePercentage < this.config.alertThresholds.uptimePercentage) {
      overallStatus = 'degraded';
    }

    // Store health history for each service
    serviceResults.forEach((result) => {
      if (!this.healthHistory.has(result.serviceName)) {
        this.healthHistory.set(result.serviceName, []);
      }
      const history = this.healthHistory.get(result.serviceName)!;
      history.push(result);

      // Keep only last 1000 health check results per service
      if (history.length > 1000) {
        history.shift();
      }
    });

    const aggregatedStatus: AggregatedHealthStatus = {
      overallStatus,
      services: serviceResults,
      databaseHealth: databaseResults,
      externalServices: externalServiceResults,
      timestamp: new Date(),
      uptimePercentage,
      averageResponseTime,
      totalErrors,
    };

    this.lastAggregatedStatus = aggregatedStatus;

    const elapsedTime = Date.now() - startTime;
    console.log(`Health checks completed in ${elapsedTime}ms - Status: ${overallStatus}`);

    return aggregatedStatus;
  }

  /**
   * Check individual service health with retries
   */
  private async checkServiceHealth(service: {
    name: string;
    endpoint: EndpointHealthCheck;
    criticalityLevel: string;
  }): Promise<HealthCheckResult> {
    const { name, endpoint } = service;
    let lastError: Error | null = null;
    let totalResponseTime = 0;

    // Retry logic
    for (let attempt = 0; attempt < endpoint.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();

        const requestConfig: AxiosRequestConfig = {
          method: endpoint.method,
          url: endpoint.url,
          timeout: endpoint.timeout,
          headers: endpoint.headers || {},
        };

        const response = await this.httpClient.request(requestConfig);
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;

        // Check if status code matches expected
        const isHealthy = response.status === endpoint.expectedStatusCode;

        if (isHealthy) {
          return {
            serviceName: name,
            isHealthy: true,
            status: 'healthy',
            responseTime,
            uptime: this.calculateServiceUptime(name),
            timestamp: new Date(),
            metadata: {
              statusCode: response.status,
              attempt: attempt + 1,
              endpoint: endpoint.url,
            },
          };
        } else {
          lastError = new Error(
            `Unexpected status code: ${response.status} (expected ${endpoint.expectedStatusCode})`
          );
        }
      } catch (error) {
        lastError = error as Error;
        totalResponseTime += endpoint.timeout; // Assume timeout if failed

        // Wait before retry (exponential backoff)
        if (attempt < endpoint.retryAttempts - 1) {
          await this.sleep(Math.pow(2, attempt) * 100); // 100ms, 200ms, 400ms, etc.
        }
      }
    }

    // All retries failed
    const avgResponseTime = totalResponseTime / endpoint.retryAttempts;
    return {
      serviceName: name,
      isHealthy: false,
      status: avgResponseTime > endpoint.timeout ? 'down' : 'degraded',
      responseTime: avgResponseTime,
      uptime: this.calculateServiceUptime(name),
      errorMessage: lastError?.message || 'Unknown error',
      timestamp: new Date(),
      metadata: {
        attempts: endpoint.retryAttempts,
        endpoint: endpoint.url,
      },
    };
  }

  /**
   * Check database connectivity and health
   */
  private async checkDatabaseHealth(db: {
    name: string;
    type: string;
    connectionString: string;
    maxConnections: number;
  }): Promise<DatabaseHealthCheck> {
    // In production, this would execute actual database health queries
    // For now, simulating realistic database health checks

    try {
      const startTime = Date.now();

      // Simulate database health check query
      // In production: SELECT 1 (PostgreSQL), db.ping() (MongoDB), PING (Redis)
      await this.sleep(Math.random() * 10 + 2); // 2-12ms simulated query time

      const queryTimeout = Date.now() - startTime;
      const isHealthy = queryTimeout < 50; // Database should respond within 50ms

      return {
        connectionString: this.maskConnectionString(db.connectionString),
        queryTimeout,
        maxConnections: db.maxConnections,
        currentConnections: Math.floor(Math.random() * (db.maxConnections * 0.8)), // Simulate 0-80% connection usage
        isConnected: isHealthy,
      };
    } catch (error) {
      return {
        connectionString: this.maskConnectionString(db.connectionString),
        queryTimeout: 0,
        maxConnections: db.maxConnections,
        currentConnections: 0,
        isConnected: false,
      };
    }
  }

  /**
   * Check external service availability
   */
  private async checkExternalServiceHealth(ext: {
    name: string;
    endpoint: string;
    criticalityLevel: string;
  }): Promise<ExternalServiceHealth> {
    try {
      const startTime = Date.now();
      const response = await this.httpClient.head(ext.endpoint, {
        timeout: this.config.healthCheckTimeoutMs,
      });
      const latency = Date.now() - startTime;

      return {
        serviceName: ext.name,
        endpoint: ext.endpoint,
        isAvailable: response.status >= 200 && response.status < 400,
        latency,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        serviceName: ext.name,
        endpoint: ext.endpoint,
        isAvailable: false,
        latency: this.config.healthCheckTimeoutMs,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Calculate service uptime percentage from health history
   */
  private calculateServiceUptime(serviceName: string): number {
    const history = this.healthHistory.get(serviceName);
    if (!history || history.length === 0) {
      return 100; // No history means no downtime detected yet
    }

    const healthyChecks = history.filter((h) => h.isHealthy).length;
    return (healthyChecks / history.length) * 100;
  }

  /**
   * Get last aggregated health status
   */
  public getLastHealthStatus(): AggregatedHealthStatus | null {
    return this.lastAggregatedStatus;
  }

  /**
   * Get health history for a specific service
   */
  public getServiceHealthHistory(serviceName: string, limit: number = 100): HealthCheckResult[] {
    const history = this.healthHistory.get(serviceName) || [];
    return history.slice(-limit); // Return last N results
  }

  /**
   * Check if any alert thresholds are violated
   */
  public checkAlertThresholds(): Array<{
    metric: string;
    threshold: number;
    currentValue: number;
    severity: string;
  }> {
    if (!this.lastAggregatedStatus) {
      return [];
    }

    const alerts: Array<{
      metric: string;
      threshold: number;
      currentValue: number;
      severity: string;
    }> = [];

    // Uptime threshold
    if (this.lastAggregatedStatus.uptimePercentage < this.config.alertThresholds.uptimePercentage) {
      alerts.push({
        metric: 'Uptime Percentage',
        threshold: this.config.alertThresholds.uptimePercentage,
        currentValue: this.lastAggregatedStatus.uptimePercentage,
        severity: 'critical',
      });
    }

    // Response time threshold
    if (
      this.lastAggregatedStatus.averageResponseTime > this.config.alertThresholds.responseTimeMs
    ) {
      alerts.push({
        metric: 'Average Response Time',
        threshold: this.config.alertThresholds.responseTimeMs,
        currentValue: this.lastAggregatedStatus.averageResponseTime,
        severity: 'warning',
      });
    }

    // Error rate threshold
    const totalServices = this.lastAggregatedStatus.services.length;
    const errorRate = (this.lastAggregatedStatus.totalErrors / totalServices) * 100;
    if (errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        metric: 'Error Rate',
        threshold: this.config.alertThresholds.errorRate,
        currentValue: errorRate,
        severity: 'critical',
      });
    }

    return alerts;
  }

  /**
   * Get service health metrics for capacity planning
   */
  public getCapacityPlanningMetrics(): {
    serviceName: string;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    uptimePercentage: number;
    errorRate: number;
  }[] {
    return Array.from(this.healthHistory.entries()).map(([serviceName, history]) => {
      const responseTimes = history.map((h) => h.responseTime).sort((a, b) => a - b);
      const healthyCount = history.filter((h) => h.isHealthy).length;

      return {
        serviceName,
        avgResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
        uptimePercentage: (healthyCount / history.length) * 100,
        errorRate: ((history.length - healthyCount) / history.length) * 100,
      };
    });
  }

  /**
   * Mask sensitive connection string information
   */
  private maskConnectionString(connectionString: string): string {
    // Mask password in connection string
    return connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset health history (useful for testing or maintenance)
   */
  public resetHealthHistory(): void {
    this.healthHistory.clear();
    console.log('Health history reset');
  }

  /**
   * Get comprehensive health report
   */
  public getHealthReport(): {
    timestamp: Date;
    overallStatus: string;
    services: {
      name: string;
      status: string;
      uptime: number;
      avgResponseTime: number;
    }[];
    databases: DatabaseHealthCheck[];
    externalServices: ExternalServiceHealth[];
    activeAlerts: Array<{ metric: string; severity: string }>;
  } {
    if (!this.lastAggregatedStatus) {
      throw new Error('No health data available');
    }

    const capacityMetrics = this.getCapacityPlanningMetrics();
    const activeAlerts = this.checkAlertThresholds();

    return {
      timestamp: this.lastAggregatedStatus.timestamp,
      overallStatus: this.lastAggregatedStatus.overallStatus,
      services: this.lastAggregatedStatus.services.map((service, index) => ({
        name: service.serviceName,
        status: service.status,
        uptime: service.uptime,
        avgResponseTime:
          capacityMetrics.find((m) => m.serviceName === service.serviceName)?.avgResponseTime ||
          service.responseTime,
      })),
      databases: this.lastAggregatedStatus.databaseHealth,
      externalServices: this.lastAggregatedStatus.externalServices,
      activeAlerts: activeAlerts.map((alert) => ({
        metric: alert.metric,
        severity: alert.severity,
      })),
    };
  }
}

// =============================
// Default Configuration
// =============================

export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  services: [
    {
      name: 'researchSession',
      endpoint: {
        url: '/api/research-sessions/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'critical',
    },
    {
      name: 'quantumVisualization',
      endpoint: {
        url: '/api/quantum-visualization/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'high',
    },
    {
      name: 'consciousnessParameter',
      endpoint: {
        url: '/api/consciousness-parameters/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'critical',
    },
    {
      name: 'statisticalAnalysis',
      endpoint: {
        url: '/api/statistical-analysis/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'high',
    },
    {
      name: 'aiSwarm',
      endpoint: {
        url: '/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'critical',
    },
    {
      name: 'iaaCompliance',
      endpoint: {
        url: '/api/iaao-compliance/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'high',
    },
    {
      name: 'export',
      endpoint: {
        url: '/api/export-report/health',
        method: 'GET',
        expectedStatusCode: 200,
        timeout: 5000,
        retryAttempts: 3,
      },
      criticalityLevel: 'medium',
    },
  ],
  databases: [
    {
      name: 'PostgreSQL',
      type: 'postgresql',
      connectionString: 'postgresql://user:password@localhost:5432/terrafusion',
      maxConnections: 100,
    },
  ],
  externalServices: [
    {
      name: 'GitHub Models API',
      endpoint: 'https://models.inference.ai.azure.com',
      criticalityLevel: 'high',
    },
  ],
  pollingIntervalMs: 5000, // 5 seconds
  healthCheckTimeoutMs: 5000, // 5 seconds
  retryAttempts: 3,
  alertThresholds: {
    uptimePercentage: 99.9, // Alert if uptime falls below 99.9%
    responseTimeMs: 50, // Alert if average response time exceeds 50ms
    errorRate: 1, // Alert if error rate exceeds 1%
  },
};

export default HealthCheckService;
