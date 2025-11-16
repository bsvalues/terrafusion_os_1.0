/**
 * TerraFusion Swarm Transparency Engine
 *
 * Implements "Elegant Transparency" - progressive disclosure of system complexity.
 *
 * Core concept: The same underlying data (AgentActions) is presented differently
 * based on user sophistication and current transparency layer.
 *
 * Layers:
 * - Surface: "Build succeeded" (citizens, novices)
 * - Hint: "Build succeeded in 2.3s, 0 warnings" (intermediate users)
 * - Depth: "15 projects compiled, 3 warnings in TerraFusion.Core" (power users)
 * - Expert: Full logs, metrics, agent coordination details (developers, ops)
 */

import { TransparencyBus, UnsubscribeFunction } from './bus';
import {
  AgentAction,
  OperationalContext,
  PerformanceMetrics,
  ServiceMetrics,
  SystemDecisionLog,
  TerraFusionService,
  TransparencyLayer,
  UserCapabilityModel,
} from './types';

/**
 * Display model variants for each transparency layer
 */
export type DisplayModel =
  | SurfaceDisplayModel
  | HintDisplayModel
  | DepthDisplayModel
  | ExpertDisplayModel;

export interface SurfaceDisplayModel {
  type: 'surface';
  /** Last 10 high-level summaries */
  activitySummary: Array<{
    timestamp: string;
    service: string;
    phase: string;
    summary: string;
  }>;
}

export interface HintDisplayModel {
  type: 'hint';
  /** Actions grouped by service */
  buckets: Record<string, AgentAction[]>;
  /** Light metrics */
  quickStats: {
    totalActions: number;
    errorCount: number;
    activeAgents: number;
  };
}

export interface DepthDisplayModel {
  type: 'depth';
  /** Last 200 actions */
  timeline: AgentAction[];
  /** Detailed metrics by service */
  metrics: Record<string, { count: number; errors: number; avgDuration: number }>;
  /** Agent pool status */
  agentPool: {
    total: number;
    active: number;
    idle: number;
    error: number;
  };
}

export interface ExpertDisplayModel {
  type: 'expert';
  /** Full action history */
  fullActions: AgentAction[];
  /** System decision log */
  decisionLog: SystemDecisionLog[];
  /** Complete performance metrics */
  performanceMetrics: PerformanceMetrics;
  /** Raw telemetry */
  rawTelemetry: Record<string, unknown>;
}

/**
 * SwarmTransparencyEngine
 *
 * Main orchestrator for the transparency system.
 */
export class SwarmTransparencyEngine {
  private currentLayer: TransparencyLayer;
  private actions: AgentAction[] = [];
  private decisionLog: SystemDecisionLog[] = [];
  private unsubscribe?: UnsubscribeFunction;
  private readonly maxActionsBufferSize = 5000;

  constructor(
    private user: UserCapabilityModel,
    private context: OperationalContext,
    private bus: TransparencyBus
  ) {
    this.currentLayer = this.resolveInitialLayer(user);

    // Subscribe to transparency bus
    this.unsubscribe = bus.subscribe(action => {
      this.onActionReceived(action);
    });
  }

  /**
   * Determine initial transparency layer based on user profile
   */
  private resolveInitialLayer(user: UserCapabilityModel): TransparencyLayer {
    // Explicit preference takes precedence
    if (user.lastLayer) {
      return user.lastLayer;
    }

    // Role-based defaults
    if (user.role === 'citizen') return 'surface';
    if (user.role === 'staff') return 'hint';
    if (user.role === 'developer') return 'depth';
    if (user.role === 'admin') return 'expert';

    // Minimal UI preference
    if (user.prefersMinimalUI) {
      return 'surface';
    }

    // Experience-based
    if (user.weeksOfUse >= 8 && user.experienceLevel === 'power') {
      return 'expert';
    }
    if (user.weeksOfUse >= 4) {
      return 'depth';
    }
    if (user.weeksOfUse >= 1) {
      return 'hint';
    }

    return 'surface';
  }

  /**
   * Handle incoming agent action
   */
  private onActionReceived(action: AgentAction): void {
    this.actions.push(action);

    // Constrain buffer size (FIFO)
    if (this.actions.length > this.maxActionsBufferSize) {
      this.actions.splice(0, this.actions.length - this.maxActionsBufferSize);
    }
  }

  /**
   * Get current transparency layer
   */
  getLayer(): TransparencyLayer {
    return this.currentLayer;
  }

  /**
   * Set transparency layer explicitly
   */
  setLayer(layer: TransparencyLayer): void {
    this.currentLayer = layer;
    // Could persist this to user profile
  }

  /**
   * Increase transparency (show more detail)
   */
  elevate(): void {
    if (this.currentLayer === 'surface') this.currentLayer = 'hint';
    else if (this.currentLayer === 'hint') this.currentLayer = 'depth';
    else if (this.currentLayer === 'depth') this.currentLayer = 'expert';
  }

  /**
   * Decrease transparency (simplify view)
   */
  reduce(): void {
    if (this.currentLayer === 'expert') this.currentLayer = 'depth';
    else if (this.currentLayer === 'depth') this.currentLayer = 'hint';
    else if (this.currentLayer === 'hint') this.currentLayer = 'surface';
  }

  /**
   * Get display model for current layer
   */
  getDisplayModel(): DisplayModel {
    switch (this.currentLayer) {
      case 'surface':
        return this.surfaceView();
      case 'hint':
        return this.hintView();
      case 'depth':
        return this.depthView();
      case 'expert':
        return this.expertView();
    }
  }

  /**
   * Surface layer: Minimal summaries only
   */
  private surfaceView(): SurfaceDisplayModel {
    const recent = this.actions.slice(-10);
    return {
      type: 'surface',
      activitySummary: recent.map(a => ({
        timestamp: a.timestamp,
        service: a.service,
        phase: a.phase,
        summary: a.summary,
      })),
    };
  }

  /**
   * Hint layer: Group by service, light stats
   */
  private hintView(): HintDisplayModel {
    const recent = this.actions.slice(-50);
    const buckets = this.groupByService(recent);

    return {
      type: 'hint',
      buckets,
      quickStats: {
        totalActions: recent.length,
        errorCount: recent.filter(a => a.phase === 'error').length,
        activeAgents: new Set(recent.map(a => a.agentId)).size,
      },
    };
  }

  /**
   * Depth layer: Timeline + detailed metrics
   */
  private depthView(): DepthDisplayModel {
    const recent = this.actions.slice(-200);
    const metrics = this.computeMetrics(recent);
    const agentPool = this.computeAgentPoolStatus(recent);

    return {
      type: 'depth',
      timeline: recent,
      metrics,
      agentPool,
    };
  }

  /**
   * Expert layer: Everything
   */
  private expertView(): ExpertDisplayModel {
    return {
      type: 'expert',
      fullActions: this.actions,
      decisionLog: this.decisionLog,
      performanceMetrics: this.computeFullMetrics(this.actions),
      rawTelemetry: {
        bufferSize: this.actions.length,
        oldestAction: this.actions[0]?.timestamp,
        newestAction: this.actions[this.actions.length - 1]?.timestamp,
        subscriberCount: this.bus.getSubscriberCount(),
        totalPublished: this.bus.getTotalActionsPublished(),
      },
    };
  }

  /**
   * Group actions by service
   */
  private groupByService(actions: AgentAction[]): Record<string, AgentAction[]> {
    const map: Record<string, AgentAction[]> = {};
    for (const action of actions) {
      if (!map[action.service]) map[action.service] = [];
      map[action.service].push(action);
    }
    return map;
  }

  /**
   * Compute metrics for depth layer
   */
  private computeMetrics(
    actions: AgentAction[]
  ): Record<string, { count: number; errors: number; avgDuration: number }> {
    const byService: Record<string, { count: number; errors: number; durations: number[] }> = {};

    for (const action of actions) {
      if (!byService[action.service]) {
        byService[action.service] = { count: 0, errors: 0, durations: [] };
      }
      byService[action.service].count++;
      if (action.phase === 'error') byService[action.service].errors++;
      if (action.durationMs !== undefined)
        byService[action.service].durations.push(action.durationMs);
    }

    // Calculate averages
    const result: Record<string, { count: number; errors: number; avgDuration: number }> = {};
    for (const [service, data] of Object.entries(byService)) {
      result[service] = {
        count: data.count,
        errors: data.errors,
        avgDuration:
          data.durations.length > 0
            ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
            : 0,
      };
    }

    return result;
  }

  /**
   * Compute agent pool status
   */
  private computeAgentPoolStatus(actions: AgentAction[]): {
    total: number;
    active: number;
    idle: number;
    error: number;
  } {
    const uniqueAgents = new Set(actions.map(a => a.agentId));
    const activeAgents = new Set(actions.filter(a => a.phase === 'executing').map(a => a.agentId));
    const idleAgents = new Set(actions.filter(a => a.phase === 'idle').map(a => a.agentId));
    const errorAgents = new Set(actions.filter(a => a.phase === 'error').map(a => a.agentId));

    return {
      total: uniqueAgents.size,
      active: activeAgents.size,
      idle: idleAgents.size,
      error: errorAgents.size,
    };
  }

  /**
   * Compute full metrics for expert layer
   */
  private computeFullMetrics(actions: AgentAction[]): PerformanceMetrics {
    const byService = this.groupByService(actions);
    const serviceMetrics: Record<TerraFusionService, ServiceMetrics> = {} as any;

    for (const [service, serviceActions] of Object.entries(byService)) {
      const durations = serviceActions
        .map(a => a.durationMs)
        .filter((d): d is number => d !== undefined);

      serviceMetrics[service as TerraFusionService] = {
        requestCount: serviceActions.length,
        errorCount: serviceActions.filter(a => a.phase === 'error').length,
        avgResponseTime:
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        health: this.determineServiceHealth(serviceActions),
      };
    }

    const pool = this.computeAgentPoolStatus(actions);
    const recentErrors = actions.filter(a => a.phase === 'error');
    const now = Date.now();

    return {
      byService: serviceMetrics,
      agentUtilization: {
        total: pool.total,
        active: pool.active,
        idle: pool.idle,
        errorState: pool.error,
      },
      errorRate: {
        last1Minute: recentErrors.filter(a => now - new Date(a.timestamp).getTime() < 60000).length,
        last5Minutes: recentErrors.filter(a => now - new Date(a.timestamp).getTime() < 300000)
          .length,
        last15Minutes: recentErrors.filter(a => now - new Date(a.timestamp).getTime() < 900000)
          .length,
      },
      latency: this.computeLatencyPercentiles(actions),
    };
  }

  /**
   * Determine service health based on recent actions
   */
  private determineServiceHealth(actions: AgentAction[]): 'healthy' | 'degraded' | 'unhealthy' {
    const errorRate = actions.filter(a => a.phase === 'error').length / actions.length;
    if (errorRate > 0.2) return 'unhealthy';
    if (errorRate > 0.05) return 'degraded';
    return 'healthy';
  }

  /**
   * Compute latency percentiles
   */
  private computeLatencyPercentiles(actions: AgentAction[]): {
    p50: number;
    p95: number;
    p99: number;
  } {
    const durations = actions
      .map(a => a.durationMs)
      .filter((d): d is number => d !== undefined)
      .sort((a, b) => a - b);

    if (durations.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      p50: durations[p50Index] || 0,
      p95: durations[p95Index] || 0,
      p99: durations[p99Index] || 0,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
