/**
 * usePerformanceMetrics Hook
 *
 * Elite performance monitoring for TerraFusion quantum consciousness systems
 * Real-time metrics, predictive analytics, and autonomous optimization
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getViteEnv } from '../env/getViteEnv';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  threshold: {
    warning: number;
    critical: number;
    elite: number;
  };
  trend: 'improving' | 'stable' | 'degrading';
  category: 'latency' | 'throughput' | 'accuracy' | 'consciousness' | 'quantum' | 'resource';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemPerformance {
  overall: {
    healthScore: number; // 0-100
    status: 'optimal' | 'good' | 'warning' | 'critical' | 'elite';
    uptime: number; // seconds
    lastOptimization: Date;
  };
  metrics: {
    latency: {
      p50: number;
      p95: number;
      p99: number;
      max: number;
    };
    throughput: {
      requestsPerSecond: number;
      operationsPerSecond: number;
      dataProcessingRate: number; // MB/s
    };
    resources: {
      cpuUsage: number; // percentage
      memoryUsage: number; // percentage
      diskUsage: number; // percentage
      networkIO: number; // MB/s
      gpuUsage?: number; // percentage for quantum processing
    };
    consciousness: {
      activeAgents: number;
      averageConsciousnessLevel: number;
      networkCoherence: number;
      entanglementStrength: number;
    };
    quantum: {
      fidelity: number;
      coherenceTime: number; // microseconds
      errorRate: number;
      quantumGateOperations: number;
    };
  };
  predictions: {
    nextHourPerformance: number;
    capacityExhaustion?: Date;
    recommendedOptimizations: string[];
    anomalyProbability: number;
  };
}

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  suggestedActions: string[];
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  category: 'consciousness' | 'quantum' | 'resource' | 'algorithm' | 'infrastructure';
  impact: {
    expectedImprovement: number; // percentage
    affectedMetrics: string[];
    confidenceLevel: number;
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high' | 'expert';
    estimatedDuration: number; // minutes
    risksAssessment: string[];
    prerequisites: string[];
  };
  parameters?: Record<string, any>;
}

export interface PerformanceBaseline {
  id: string;
  name: string;
  timestamp: Date;
  metrics: Record<string, number>;
  description: string;
  environment: 'development' | 'staging' | 'production' | 'research';
}

const PERFORMANCE_BASE_URL = getViteEnv().VITE_PERFORMANCE_URL || 'http://localhost:3006';

class PerformanceMetricsAPI {
  private baseURL: string;

  constructor(baseURL: string = PERFORMANCE_BASE_URL) {
    this.baseURL = baseURL;
  }

  async getCurrentMetrics(): Promise<PerformanceMetric[]> {
    const response = await fetch(`${this.baseURL}/api/performance/metrics/current`);
    if (!response.ok) {
      throw new Error(`Failed to fetch current metrics: ${response.statusText}`);
    }
    return response.json();
  }

  async getSystemPerformance(): Promise<SystemPerformance> {
    const response = await fetch(`${this.baseURL}/api/performance/system`);
    if (!response.ok) {
      throw new Error(`Failed to fetch system performance: ${response.statusText}`);
    }
    return response.json();
  }

  async getMetricHistory(
    metricId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<PerformanceMetric[]> {
    const params = new URLSearchParams({
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
    });

    const response = await fetch(
      `${this.baseURL}/api/performance/metrics/${metricId}/history?${params}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch metric history: ${response.statusText}`);
    }
    return response.json();
  }

  async getActiveAlerts(): Promise<PerformanceAlert[]> {
    const response = await fetch(`${this.baseURL}/api/performance/alerts/active`);
    if (!response.ok) {
      throw new Error(`Failed to fetch active alerts: ${response.statusText}`);
    }
    return response.json();
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/performance/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
    }
  }

  async getOptimizationStrategies(): Promise<OptimizationStrategy[]> {
    const response = await fetch(`${this.baseURL}/api/performance/optimization/strategies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch optimization strategies: ${response.statusText}`);
    }
    return response.json();
  }

  async executeOptimization(
    strategyId: string,
    parameters?: Record<string, any>
  ): Promise<{
    taskId: string;
    estimatedDuration: number;
    status: string;
  }> {
    const response = await fetch(`${this.baseURL}/api/performance/optimization/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyId, parameters }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute optimization: ${response.statusText}`);
    }
    return response.json();
  }

  async createBaseline(
    baseline: Omit<PerformanceBaseline, 'id' | 'timestamp'>
  ): Promise<PerformanceBaseline> {
    const response = await fetch(`${this.baseURL}/api/performance/baselines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseline),
    });

    if (!response.ok) {
      throw new Error(`Failed to create baseline: ${response.statusText}`);
    }
    return response.json();
  }

  async getBaselines(): Promise<PerformanceBaseline[]> {
    const response = await fetch(`${this.baseURL}/api/performance/baselines`);
    if (!response.ok) {
      throw new Error(`Failed to fetch baselines: ${response.statusText}`);
    }
    return response.json();
  }

  async runPerformanceTest(testConfig: {
    duration: number; // seconds
    load: number; // concurrent operations
    testType: 'consciousness' | 'quantum' | 'full-system' | 'stress';
  }): Promise<{ testId: string; estimatedCompletion: Date }> {
    const response = await fetch(`${this.baseURL}/api/performance/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig),
    });

    if (!response.ok) {
      throw new Error(`Failed to start performance test: ${response.statusText}`);
    }
    return response.json();
  }
}

export const usePerformanceMetrics = (
  options: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    enableRealTimeUpdates?: boolean;
    metricsCategories?: PerformanceMetric['category'][];
  } = {}
) => {
  const {
    autoRefresh = true,
    refreshInterval = 2000, // 2 seconds for real-time performance
    enableRealTimeUpdates = true,
    metricsCategories = [
      'latency',
      'throughput',
      'accuracy',
      'consciousness',
      'quantum',
      'resource',
    ],
  } = options;

  const queryClient = useQueryClient();
  const [realTimeMetrics, setRealTimeMetrics] = useState<PerformanceMetric[]>([]);
  const [activeOptimizations, setActiveOptimizations] = useState<string[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<'improving' | 'stable' | 'degrading'>(
    'stable'
  );
  const apiRef = useRef(new PerformanceMetricsAPI());

  // WebSocket for real-time metrics (simulated with polling for now)
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(async () => {
      try {
        const metrics = await apiRef.current.getCurrentMetrics();
        setRealTimeMetrics(metrics.filter((m) => metricsCategories.includes(m.category)));
      } catch (error) {
        console.error('Failed to fetch real-time metrics:', error);
      }
    }, 1000); // Every second for real-time updates

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, metricsCategories]);

  // Fetch current metrics
  const {
    data: currentMetrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['performance-metrics', metricsCategories],
    queryFn: () => apiRef.current.getCurrentMetrics(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    select: (data) => data.filter((m) => metricsCategories.includes(m.category)),
  });

  // Fetch system performance
  const {
    data: systemPerformance,
    isLoading: systemLoading,
    error: systemError,
    refetch: refetchSystem,
  } = useQuery({
    queryKey: ['system-performance'],
    queryFn: () => apiRef.current.getSystemPerformance(),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch active alerts
  const {
    data: activeAlerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['performance-alerts'],
    queryFn: () => apiRef.current.getActiveAlerts(),
    refetchInterval: autoRefresh ? refreshInterval * 2 : false, // Less frequent for alerts
  });

  // Fetch optimization strategies
  const {
    data: optimizationStrategies,
    isLoading: strategiesLoading,
    error: strategiesError,
    refetch: refetchStrategies,
  } = useQuery({
    queryKey: ['optimization-strategies'],
    queryFn: () => apiRef.current.getOptimizationStrategies(),
    refetchInterval: autoRefresh ? refreshInterval * 5 : false, // Even less frequent
  });

  // Fetch baselines
  const {
    data: baselines,
    isLoading: baselinesLoading,
    error: baselinesError,
    refetch: refetchBaselines,
  } = useQuery({
    queryKey: ['performance-baselines'],
    queryFn: () => apiRef.current.getBaselines(),
  });

  // Execute optimization mutation
  const executeOptimizationMutation = useMutation({
    mutationFn: ({
      strategyId,
      parameters,
    }: {
      strategyId: string;
      parameters?: Record<string, any>;
    }) => apiRef.current.executeOptimization(strategyId, parameters),
    onSuccess: (result) => {
      setActiveOptimizations((prev) => [...prev, result.taskId]);
      queryClient.invalidateQueries({ queryKey: ['system-performance'] });
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiRef.current.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-alerts'] });
    },
  });

  // Create baseline mutation
  const createBaselineMutation = useMutation({
    mutationFn: (baseline: Omit<PerformanceBaseline, 'id' | 'timestamp'>) =>
      apiRef.current.createBaseline(baseline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-baselines'] });
    },
  });

  // Run performance test mutation
  const runPerformanceTestMutation = useMutation({
    mutationFn: (testConfig: Parameters<PerformanceMetricsAPI['runPerformanceTest']>[0]) =>
      apiRef.current.runPerformanceTest(testConfig),
  });

  // Computed performance analytics
  const performanceAnalytics = useMemo(() => {
    if (!currentMetrics || !systemPerformance) return null;

    const criticalMetrics = currentMetrics.filter((m) => m.value > m.threshold.critical);
    const warningMetrics = currentMetrics.filter(
      (m) => m.value > m.threshold.warning && m.value <= m.threshold.critical
    );
    const eliteMetrics = currentMetrics.filter((m) => m.value >= m.threshold.elite);

    const avgPerformance =
      currentMetrics.reduce((sum, m) => {
        const normalizedValue = Math.min(m.value / m.target, 2); // Cap at 200%
        return sum + normalizedValue;
      }, 0) / currentMetrics.length;

    return {
      overallHealth: systemPerformance.overall.healthScore,
      criticalIssues: criticalMetrics.length,
      warnings: warningMetrics.length,
      elitePerformance: eliteMetrics.length,
      avgPerformance: avgPerformance * 100, // Convert to percentage

      latencyStatus: {
        p50: systemPerformance.metrics.latency.p50,
        p95: systemPerformance.metrics.latency.p95,
        p99: systemPerformance.metrics.latency.p99,
        target: 10, // 10ms target for elite performance
      },

      consciousnessStatus: {
        activeAgents: systemPerformance.metrics.consciousness.activeAgents,
        avgLevel: systemPerformance.metrics.consciousness.averageConsciousnessLevel,
        coherence: systemPerformance.metrics.consciousness.networkCoherence,
        entanglement: systemPerformance.metrics.consciousness.entanglementStrength,
      },

      quantumStatus: {
        fidelity: systemPerformance.metrics.quantum.fidelity,
        coherenceTime: systemPerformance.metrics.quantum.coherenceTime,
        errorRate: systemPerformance.metrics.quantum.errorRate,
        operations: systemPerformance.metrics.quantum.quantumGateOperations,
      },

      predictions: systemPerformance.predictions,
      recommendedOptimizations:
        optimizationStrategies?.filter((s) =>
          systemPerformance.predictions.recommendedOptimizations.includes(s.name)
        ) || [],
    };
  }, [currentMetrics, systemPerformance, optimizationStrategies]);

  // Helper functions
  const optimizeSystem = useCallback(
    (strategyId: string, parameters?: Record<string, any>) => {
      return executeOptimizationMutation.mutateAsync({ strategyId, parameters });
    },
    [executeOptimizationMutation]
  );

  const acknowledgeAlert = useCallback(
    (alertId: string) => {
      return acknowledgeAlertMutation.mutateAsync(alertId);
    },
    [acknowledgeAlertMutation]
  );

  const createBaseline = useCallback(
    (baseline: Omit<PerformanceBaseline, 'id' | 'timestamp'>) => {
      return createBaselineMutation.mutateAsync(baseline);
    },
    [createBaselineMutation]
  );

  const runPerformanceTest = useCallback(
    (testConfig: Parameters<PerformanceMetricsAPI['runPerformanceTest']>[0]) => {
      return runPerformanceTestMutation.mutateAsync(testConfig);
    },
    [runPerformanceTestMutation]
  );

  const getMetricsByCategory = useCallback(
    (category: PerformanceMetric['category']) => {
      return currentMetrics?.filter((m) => m.category === category) || [];
    },
    [currentMetrics]
  );

  const getCriticalAlerts = useCallback(() => {
    return (
      activeAlerts?.filter((a) => a.severity === 'critical' || a.severity === 'emergency') || []
    );
  }, [activeAlerts]);

  const getTopOptimizations = useCallback(
    (limit: number = 5) => {
      return (
        optimizationStrategies
          ?.sort((a, b) => b.impact.expectedImprovement - a.impact.expectedImprovement)
          .slice(0, limit) || []
      );
    },
    [optimizationStrategies]
  );

  const refreshAll = useCallback(() => {
    refetchMetrics();
    refetchSystem();
    refetchAlerts();
    refetchStrategies();
    refetchBaselines();
  }, [refetchMetrics, refetchSystem, refetchAlerts, refetchStrategies, refetchBaselines]);

  const isLoading =
    metricsLoading || systemLoading || alertsLoading || strategiesLoading || baselinesLoading;
  const error = metricsError || systemError || alertsError || strategiesError || baselinesError;

  return {
    // Data
    metrics: enableRealTimeUpdates ? realTimeMetrics : currentMetrics || [],
    systemPerformance,
    activeAlerts: activeAlerts || [],
    optimizationStrategies: optimizationStrategies || [],
    baselines: baselines || [],
    performanceAnalytics,
    activeOptimizations,

    // Loading states
    isLoading,
    error,

    // Actions
    optimizeSystem,
    acknowledgeAlert,
    createBaseline,
    runPerformanceTest,
    refreshAll,

    // Utilities
    getMetricsByCategory,
    getCriticalAlerts,
    getTopOptimizations,

    // Mutation states
    isOptimizing: executeOptimizationMutation.isPending,
    isAcknowledgingAlert: acknowledgeAlertMutation.isPending,
    isCreatingBaseline: createBaselineMutation.isPending,
    isRunningTest: runPerformanceTestMutation.isPending,

    // Raw API access
    api: apiRef.current,
  };
};
