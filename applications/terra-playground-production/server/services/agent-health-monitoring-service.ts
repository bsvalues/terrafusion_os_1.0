/**
 * Agent Health Monitoring Service
 *
 * This service is responsible for monitoring and tracking the health and performance
 * of agents in the system. It collects metrics related to CPU usage, memory usage,
 * request latency, and other performance indicators.
 */

import { EventEmitter } from 'events';
import { AgentSystem } from './agent-system';
import { IStorage } from '../storage';
import { logger } from '../utils/logger';

// Define types for the health monitoring service
export type AgentHealth = {
  agentId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  requestLatency: number;
  tokenConsumption: number;
  apiCalls: number;
  errorRate: number;
  lastActivityTimestamp: string;
  messages: number;
  totalTokens: number;
  consecutiveErrors: number;
  initStatus: 'initializing' | 'initialized' | 'failed' | 'unknown';
  initTimestamp: string | null;
  lastHealthCheck: string;
  metricHistory: AgentMetricHistory;
};

export type AgentMetricHistory = {
  cpuUsage: number[];
  memoryUsage: number[];
  requestLatency: number[];
  tokenConsumption: number[];
  apiCalls: number[];
  errorRate: number[];
};

export type SystemHealth = {
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown';
  agentCount: number;
  healthyAgents: number;
  degradedAgents: number;
  criticalAgents: number;
  unknownAgents: number;
  totalCpuUsage: number;
  totalMemoryUsage: number;
  averageLatency: number;
  totalErrors: number;
  totalApiCalls: number;
  timestamp: string;
};

export type AgentAlert = {
  agentId: string;
  alertType:
    | 'high-cpu'
    | 'high-memory'
    | 'high-latency'
    | 'high-error-rate'
    | 'timeout'
    | 'initialization-failed';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedTimestamp: string | null;
  metricValue: number | null;
  thresholdValue: number | null;
};

export type AgentMetrics = {
  cpuUsage: number[];
  memoryUsage: number[];
  requestLatency: number[];
  errorRate: number[];
  apiCalls: number[];
  tokenUsage: number[];
  messageCount: number[];
  timestamps: string[];
};

/**
 * Service for monitoring and tracking agent health and performance
 */
class AgentHealthMonitoringService extends EventEmitter {
  private static instance: AgentHealthMonitoringService;
  private storage: IStorage | null = null;
  private agentSystem: AgentSystem | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private intervalMs: number = 30000; // Default to 30 seconds
  private _isInitialized: boolean = false;

  // Singleton pattern
  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AgentHealthMonitoringService {
    if (!AgentHealthMonitoringService.instance) {
      AgentHealthMonitoringService.instance = new AgentHealthMonitoringService();
    }
    return AgentHealthMonitoringService.instance;
  }

  /**
   * Initialize the health monitoring service
   */
  public initialize(storage: IStorage, agentSystem: AgentSystem, intervalMs: number = 30000): void {
    if (this._isInitialized) {
      logger.warn({
        component: 'AgentHealthMonitoringService',
        message: 'Service already initialized',
      });
      return;
    }

    this.storage = storage;
    this.agentSystem = agentSystem;
    this.intervalMs = intervalMs;

    // Start monitoring interval
    this.startMonitoring();

    // Subscribe to agent system events
    this.subscribeToEvents();

    this._isInitialized = true;

    logger.info({
      component: 'AgentHealthMonitoringService',
      message: 'Agent Health Monitoring started',
      interval: this.intervalMs,
    });

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Check if the service is initialized
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Start periodic health monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.intervalMs);

    logger.info({
      component: 'AgentHealthMonitoringService',
      message:
        'Agent Health Monitoring Service initialized with interval ' + this.intervalMs + 'ms',
    });
  }

  /**
   * Perform a health check across all agents
   * This method is made public to allow manual health checks
   */
  public async performHealthCheck(): Promise<void> {
    if (!this.agentSystem || !this.storage) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Cannot perform health check - service not properly initialized',
      });
      return;
    }

    try {
      // Get list of all registered agents
      const agentStatus = this.agentSystem.getSystemStatus();
      const agentIds = Object.keys(agentStatus.agents);

      // Process each agent
      for (const agentId of agentIds) {
        await this.checkAgentHealth(agentId);
      }

      logger.debug({
        component: 'AgentHealthMonitoringService',
        message: `Completed health check for ${agentIds.length} agents`,
      });

      // Emit event that health check is complete
      this.emit('health-check-complete', {
        timestamp: new Date().toISOString(),
        agentCount: agentIds.length,
      });
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error performing health check',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check health of a specific agent
   */
  private async checkAgentHealth(agentId: string): Promise<void> {
    if (!this.agentSystem || !this.storage) return;

    try {
      // Get current agent status from agent system
      const agentStatus = this.agentSystem.getAgentStatus(agentId);

      if (!agentStatus) {
        logger.warn({
          component: 'AgentHealthMonitoringService',
          message: `Agent not found for health check: ${agentId}`,
        });
        return;
      }

      // Get existing health record if any
      let agentHealth = await this.storage.getAgentHealthByAgentId(agentId);

      // Get performance metrics
      const metrics = this.collectAgentMetrics(agentId);

      // Calculate health status
      const healthStatus = this.determineHealthStatus(metrics);

      const now = new Date().toISOString();

      // Update or create health record
      if (agentHealth) {
        // Update existing record
        agentHealth = {
          ...agentHealth,
          status: healthStatus,
          timestamp: now,
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          requestLatency: metrics.requestLatency,
          tokenConsumption: metrics.tokenConsumption,
          apiCalls: metrics.apiCalls,
          errorRate: metrics.errorRate,
          lastActivityTimestamp: agentStatus.lastActivity || now,
          lastHealthCheck: now,
          // Add to metric history
          metricHistory: {
            cpuUsage: [...(agentHealth.metricHistory?.cpuUsage || []).slice(-9), metrics.cpuUsage],
            memoryUsage: [
              ...(agentHealth.metricHistory?.memoryUsage || []).slice(-9),
              metrics.memoryUsage,
            ],
            requestLatency: [
              ...(agentHealth.metricHistory?.requestLatency || []).slice(-9),
              metrics.requestLatency,
            ],
            tokenConsumption: [
              ...(agentHealth.metricHistory?.tokenConsumption || []).slice(-9),
              metrics.tokenConsumption,
            ],
            apiCalls: [...(agentHealth.metricHistory?.apiCalls || []).slice(-9), metrics.apiCalls],
            errorRate: [
              ...(agentHealth.metricHistory?.errorRate || []).slice(-9),
              metrics.errorRate,
            ],
          },
        };

        await this.storage.updateAgentHealth(agentHealth);

        logger.debug({
          component: 'AgentHealthMonitoringService',
          message: `Updated health record for agent ${agentId}`,
        });
      } else {
        // Create new health record
        agentHealth = {
          agentId,
          status: healthStatus,
          timestamp: now,
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          requestLatency: metrics.requestLatency,
          tokenConsumption: metrics.tokenConsumption,
          apiCalls: metrics.apiCalls,
          errorRate: metrics.errorRate,
          lastActivityTimestamp: agentStatus.lastActivity || now,
          messages: 0,
          totalTokens: 0,
          consecutiveErrors: 0,
          initStatus: agentStatus.initialized ? 'initialized' : 'initializing',
          initTimestamp: agentStatus.initTimestamp || null,
          lastHealthCheck: now,
          metricHistory: {
            cpuUsage: [metrics.cpuUsage],
            memoryUsage: [metrics.memoryUsage],
            requestLatency: [metrics.requestLatency],
            tokenConsumption: [metrics.tokenConsumption],
            apiCalls: [metrics.apiCalls],
            errorRate: [metrics.errorRate],
          },
        };

        await this.storage.createAgentHealth(agentHealth);

        logger.debug({
          component: 'AgentHealthMonitoringService',
          message: `Created health record for agent ${agentId}`,
        });
      }

      // Check for alerts
      this.checkForAlerts(agentHealth);

      // Emit health status changed event
      this.emit('health-status-changed', {
        agentId,
        status: healthStatus,
        timestamp: now,
        metrics,
      });
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error checking agent health',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Collect performance metrics for an agent
   */
  private collectAgentMetrics(agentId: string): {
    cpuUsage: number;
    memoryUsage: number;
    requestLatency: number;
    tokenConsumption: number;
    apiCalls: number;
    errorRate: number;
  } {
    // In a real implementation, these metrics would be collected from
    // monitoring systems, agent telemetry, or performance counters

    // For now, use simulated data
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 512, // MB
      requestLatency: Math.random() * 1000, // ms
      tokenConsumption: Math.floor(Math.random() * 5000),
      apiCalls: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 10,
    };
  }

  /**
   * Determine health status based on metrics
   */
  private determineHealthStatus(metrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestLatency: number;
    errorRate: number;
  }): 'healthy' | 'degraded' | 'critical' | 'unknown' {
    if (metrics.cpuUsage > 90 || metrics.memoryUsage > 480 || metrics.errorRate > 8) {
      return 'critical';
    } else if (
      metrics.cpuUsage > 70 ||
      metrics.memoryUsage > 384 ||
      metrics.requestLatency > 800 ||
      metrics.errorRate > 5
    ) {
      return 'degraded';
    } else if (metrics.cpuUsage !== undefined) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  }

  /**
   * Check for alertable conditions
   */
  private async checkForAlerts(agentHealth: AgentHealth): Promise<void> {
    if (!this.storage) return;

    const alerts: AgentAlert[] = [];

    // Check CPU usage
    if (agentHealth.cpuUsage > 90) {
      alerts.push({
        agentId: agentHealth.agentId,
        alertType: 'high-cpu',
        severity: 'critical',
        message: `Agent ${agentHealth.agentId} has critical CPU usage: ${agentHealth.cpuUsage.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolvedTimestamp: null,
        metricValue: agentHealth.cpuUsage,
        thresholdValue: 90,
      });
    } else if (agentHealth.cpuUsage > 70) {
      alerts.push({
        agentId: agentHealth.agentId,
        alertType: 'high-cpu',
        severity: 'warning',
        message: `Agent ${agentHealth.agentId} has high CPU usage: ${agentHealth.cpuUsage.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolvedTimestamp: null,
        metricValue: agentHealth.cpuUsage,
        thresholdValue: 70,
      });
    }

    // Check memory usage
    if (agentHealth.memoryUsage > 480) {
      alerts.push({
        agentId: agentHealth.agentId,
        alertType: 'high-memory',
        severity: 'critical',
        message: `Agent ${agentHealth.agentId} has critical memory usage: ${agentHealth.memoryUsage.toFixed(1)}MB`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolvedTimestamp: null,
        metricValue: agentHealth.memoryUsage,
        thresholdValue: 480,
      });
    } else if (agentHealth.memoryUsage > 384) {
      alerts.push({
        agentId: agentHealth.agentId,
        alertType: 'high-memory',
        severity: 'warning',
        message: `Agent ${agentHealth.agentId} has high memory usage: ${agentHealth.memoryUsage.toFixed(1)}MB`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolvedTimestamp: null,
        metricValue: agentHealth.memoryUsage,
        thresholdValue: 384,
      });
    }

    // Create alerts in storage
    for (const alert of alerts) {
      try {
        // Check if similar alert already exists
        const existingAlerts = await this.storage.getActiveAlertsForAgent(agentHealth.agentId);
        const similarAlert = existingAlerts.find(
          a =>
            a.alertType === alert.alertType && a.severity === alert.severity && !a.resolvedTimestamp
        );

        if (!similarAlert) {
          await this.storage.createAgentAlert(alert);

          // Emit alert event
          this.emit('agent-alert', alert);

          logger.warn({
            component: 'AgentHealthMonitoringService',
            message: `Created alert for agent ${agentHealth.agentId}: ${alert.message}`,
          });
        }
      } catch (error) {
        logger.error({
          component: 'AgentHealthMonitoringService',
          message: 'Error creating agent alert',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Get performance metrics for an agent over time
   */
  public async getAgentPerformanceMetrics(agentId: string): Promise<AgentMetrics | null> {
    if (!this.storage) return null;

    try {
      // Retrieve metric history from storage
      const metrics = await this.storage.getAgentPerformanceMetrics(agentId);
      return metrics;
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving agent performance metrics',
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get the message history for an agent
   */
  public async getAgentMessages(agentId: string): Promise<any[]> {
    if (!this.storage) return [];

    try {
      // Get recent messages from storage
      return await this.storage.getAgentMessages(agentId, 50);
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving agent messages',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get agent metadata and initialization status
   */
  public async getAgentMetadata(agentId: string): Promise<any> {
    if (!this.agentSystem || !this.storage) return null;

    try {
      const agentStatus = this.agentSystem.getAgentStatus(agentId);
      const metadata = await this.storage.getAgentMetadata(agentId);
      const latestActivity = await this.storage.getLatestAgentActivity(agentId);

      return {
        ...metadata,
        status: agentStatus,
        latestActivity,
      };
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving agent metadata',
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Calculate health statistics across all agents
   */
  public async getHealthStatistics(): Promise<{
    totalAgents: number;
    healthyCount: number;
    degradedCount: number;
    criticalCount: number;
    unknownCount: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    averageLatency: number;
    totalErrors: number;
    timestamp: string;
  }> {
    if (!this.storage) {
      return {
        totalAgents: 0,
        healthyCount: 0,
        degradedCount: 0,
        criticalCount: 0,
        unknownCount: 0,
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        averageLatency: 0,
        totalErrors: 0,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Get all agent health records
      const healthRecords = await this.storage.getAllAgentHealth();

      if (!healthRecords || healthRecords.length === 0) {
        return {
          totalAgents: 0,
          healthyCount: 0,
          degradedCount: 0,
          criticalCount: 0,
          unknownCount: 0,
          averageCpuUsage: 0,
          averageMemoryUsage: 0,
          averageLatency: 0,
          totalErrors: 0,
          timestamp: new Date().toISOString(),
        };
      }

      // Calculate counts by status
      const healthyCount = healthRecords.filter(h => h.status === 'healthy').length;
      const degradedCount = healthRecords.filter(h => h.status === 'degraded').length;
      const criticalCount = healthRecords.filter(h => h.status === 'critical').length;
      const unknownCount = healthRecords.filter(h => h.status === 'unknown').length;

      // Calculate averages
      const averageCpuUsage =
        healthRecords.reduce((sum, h) => sum + h.cpuUsage, 0) / healthRecords.length;
      const averageMemoryUsage =
        healthRecords.reduce((sum, h) => sum + h.memoryUsage, 0) / healthRecords.length;
      const averageLatency =
        healthRecords.reduce((sum, h) => sum + h.requestLatency, 0) / healthRecords.length;

      // Calculate totals
      const totalErrors = healthRecords.reduce((sum, h) => sum + h.errorRate * 100, 0);

      return {
        totalAgents: healthRecords.length,
        healthyCount,
        degradedCount,
        criticalCount,
        unknownCount,
        averageCpuUsage,
        averageMemoryUsage,
        averageLatency,
        totalErrors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error calculating health statistics',
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        totalAgents: 0,
        healthyCount: 0,
        degradedCount: 0,
        criticalCount: 0,
        unknownCount: 0,
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        averageLatency: 0,
        totalErrors: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get initialization status for an agent
   */
  public async getAgentInitStatus(agentId: string): Promise<{
    initStatus: 'initializing' | 'initialized' | 'failed' | 'unknown';
    initTimestamp: string | null;
    initDuration: number | null;
  } | null> {
    if (!this.storage) return null;

    try {
      const agentHealth = await this.storage.getAgentHealthByAgentId(agentId);
      if (!agentHealth) return null;

      let initDuration = null;
      if (agentHealth.initStatus === 'initialized' && agentHealth.initTimestamp) {
        initDuration =
          new Date(agentHealth.timestamp).getTime() - new Date(agentHealth.initTimestamp).getTime();
      }

      return {
        initStatus: agentHealth.initStatus,
        initTimestamp: agentHealth.initTimestamp,
        initDuration,
      };
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving agent initialization status',
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get active alerts for all agents
   */
  public async getActiveAlerts(): Promise<AgentAlert[]> {
    if (!this.storage) return [];

    try {
      // Get all agents
      const healthRecords = await this.storage.getAllAgentHealth();

      if (!healthRecords || healthRecords.length === 0) {
        return [];
      }

      const alerts: AgentAlert[] = [];

      // For each agent, check if there are active alerts
      for (const health of healthRecords) {
        try {
          const agentAlerts = await this.storage.getActiveAlertsForAgent(health.agentId);
          alerts.push(...agentAlerts);
        } catch (error) {
          logger.error({
            component: 'AgentHealthMonitoringService',
            message: `Error retrieving alerts for agent ${health.agentId}`,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving active alerts',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Subscribe to agent system events
   */
  private subscribeToEvents(): void {
    if (!this.agentSystem) return;

    // Since AgentSystem doesn't implement EventEmitter, we'll manually check for agent status changes
    // during our health check intervals instead of using event subscriptions

    logger.info({
      component: 'AgentHealthMonitoringService',
      message: 'Agent event monitoring initialized with polling',
    });
  }

  /**
   * Track agent initialization status
   */
  private async trackAgentInitialization(
    agentId: string,
    status: 'initializing' | 'initialized' | 'failed' | 'unknown'
  ): Promise<void> {
    if (!this.storage) return;

    try {
      // Get existing health record if any
      let agentHealth = await this.storage.getAgentHealthByAgentId(agentId);

      const now = new Date().toISOString();

      if (agentHealth) {
        // Update existing record
        agentHealth = {
          ...agentHealth,
          initStatus: status,
          initTimestamp: status === 'initializing' ? now : agentHealth.initTimestamp,
          timestamp: now,
        };

        await this.storage.updateAgentHealth(agentHealth);
      } else {
        // Create new health record with initialization status
        agentHealth = {
          agentId,
          status: 'unknown',
          timestamp: now,
          cpuUsage: 0,
          memoryUsage: 0,
          requestLatency: 0,
          tokenConsumption: 0,
          apiCalls: 0,
          errorRate: 0,
          lastActivityTimestamp: now,
          messages: 0,
          totalTokens: 0,
          consecutiveErrors: 0,
          initStatus: status,
          initTimestamp: status === 'initializing' ? now : null,
          lastHealthCheck: now,
          metricHistory: {
            cpuUsage: [],
            memoryUsage: [],
            requestLatency: [],
            tokenConsumption: [],
            apiCalls: [],
            errorRate: [],
          },
        };

        await this.storage.createAgentHealth(agentHealth);
      }

      // Emit initialization status event
      this.emit('health-status-initialized', {
        agentId,
        status,
        timestamp: now,
      });

      logger.info({
        component: 'AgentHealthMonitoringService',
        message: `Agent ${agentId} initialization status: ${status}`,
      });
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error tracking agent initialization',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get health status for all agents
   */
  public async getAllAgentHealth(): Promise<AgentHealth[]> {
    if (!this.storage) {
      return [];
    }

    try {
      return await this.storage.getAllAgentHealth();
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving all agent health records',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get health status for a specific agent
   */
  public async getAgentHealthByAgentId(agentId: string): Promise<AgentHealth | null> {
    if (!this.storage) {
      return null;
    }

    try {
      return await this.storage.getAgentHealthByAgentId(agentId);
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving agent health record',
        agentId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get overall system health
   */
  public async getSystemHealth(): Promise<SystemHealth> {
    if (!this.storage) {
      return {
        overallStatus: 'unknown',
        agentCount: 0,
        healthyAgents: 0,
        degradedAgents: 0,
        criticalAgents: 0,
        unknownAgents: 0,
        totalCpuUsage: 0,
        totalMemoryUsage: 0,
        averageLatency: 0,
        totalErrors: 0,
        totalApiCalls: 0,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Get all agent health records
      const healthRecords = await this.storage.getAllAgentHealth();

      if (!healthRecords || healthRecords.length === 0) {
        return {
          overallStatus: 'unknown',
          agentCount: 0,
          healthyAgents: 0,
          degradedAgents: 0,
          criticalAgents: 0,
          unknownAgents: 0,
          totalCpuUsage: 0,
          totalMemoryUsage: 0,
          averageLatency: 0,
          totalErrors: 0,
          totalApiCalls: 0,
          timestamp: new Date().toISOString(),
        };
      }

      // Count agents by status
      const healthyAgents = healthRecords.filter(h => h.status === 'healthy').length;
      const degradedAgents = healthRecords.filter(h => h.status === 'degraded').length;
      const criticalAgents = healthRecords.filter(h => h.status === 'critical').length;
      const unknownAgents = healthRecords.filter(h => h.status === 'unknown').length;

      // Calculate totals
      const totalCpuUsage = healthRecords.reduce((sum, h) => sum + h.cpuUsage, 0);
      const totalMemoryUsage = healthRecords.reduce((sum, h) => sum + h.memoryUsage, 0);
      const averageLatency =
        healthRecords.reduce((sum, h) => sum + h.requestLatency, 0) / healthRecords.length;
      const totalErrors = healthRecords.reduce((sum, h) => sum + h.errorRate * 100, 0);
      const totalApiCalls = healthRecords.reduce((sum, h) => sum + h.apiCalls, 0);

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown' = 'healthy';

      if (criticalAgents > 0) {
        overallStatus = 'critical';
      } else if (degradedAgents > healthyAgents) {
        overallStatus = 'degraded';
      } else if (healthyAgents === 0 && unknownAgents === healthRecords.length) {
        overallStatus = 'unknown';
      }

      return {
        overallStatus,
        agentCount: healthRecords.length,
        healthyAgents,
        degradedAgents,
        criticalAgents,
        unknownAgents,
        totalCpuUsage,
        totalMemoryUsage,
        averageLatency,
        totalErrors,
        totalApiCalls,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({
        component: 'AgentHealthMonitoringService',
        message: 'Error retrieving system health',
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        overallStatus: 'unknown',
        agentCount: 0,
        healthyAgents: 0,
        degradedAgents: 0,
        criticalAgents: 0,
        unknownAgents: 0,
        totalCpuUsage: 0,
        totalMemoryUsage: 0,
        averageLatency: 0,
        totalErrors: 0,
        totalApiCalls: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Stop health monitoring
   */
  public shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this._isInitialized = false;

    logger.info({
      component: 'AgentHealthMonitoringService',
      message: 'Agent Health Monitoring service shutdown',
    });
  }
}

// Export singleton instance
export const agentHealthMonitoringService = AgentHealthMonitoringService.getInstance();
