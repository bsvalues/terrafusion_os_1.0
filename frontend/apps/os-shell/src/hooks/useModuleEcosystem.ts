import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

/**
 * Enhanced React Hook for Module Ecosystem Management
 * Provides real-time integration with 33+ module orchestration system
 */

export interface ModuleEcosystemStatus {
  totalModules: number;
  activeModules: number;
  healthyModules: number;
  warningModules: number;
  criticalModules: number;
  averagePerformance: number;
  totalMemoryUsage: number;
  totalComponentCount: number;
  lastUpdate: string;
  moduleHealthStatuses: ModuleHealthStatus[];
}

export interface ModuleHealthStatus {
  moduleId: string;
  health: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  healthChecks: string[];
  healthMetrics: Record<string, any>;
  lastHealthCheck: string;
  uptime: string;
  issues: string[];
}

export interface ModulePerformanceMetrics {
  moduleId: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeRequests: number;
  averageResponseTime: number;
  errorRate: number;
  throughputPerSecond: number;
  lastMetricsUpdate: string;
  customMetrics: Record<string, number>;
}

export interface ModuleRegistration {
  moduleId: string;
  name: string;
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  capabilities: string[];
  dependencies: string[];
  configuration: {
    settings: Record<string, any>;
    requiredServices: string[];
    resources: {
      minCpuCores: number;
      minMemoryMB: number;
      minDiskMB: number;
      maxInstances: number;
    };
    security: {
      requiredPermissions: string[];
      requiresIsolation: boolean;
      securityLevel: string;
    };
  };
  version: string;
  componentCount: number;
  memoryRequirement: number;
}

export interface EcosystemPerformanceSummary {
  totalModules: number;
  activeModules: number;
  healthyModules: number;
  warningModules: number;
  criticalModules: number;
  averagePerformance: number;
  totalMemoryUsage: number;
  totalComponentCount: number;
  systemUptime: string;
  lastUpdated: string;
  moduleDistribution: Record<string, number>;
  performanceTrend: string;
  recommendedActions: string[];
}

export interface ModuleCommunicationLog {
  id: string;
  sourceModule: string;
  targetModule: string;
  messageType: string;
  content: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Main hook for module ecosystem management
 */
export const useModuleEcosystem = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get ecosystem status
  const {
    data: ecosystemStatus,
    error: statusError,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<ModuleEcosystemStatus>(
    'ecosystem-status',
    () => axios.get('/api/ecosystem/status').then((res) => res.data),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchIntervalInBackground: true,
      onError: (error) => {
        console.error('Error fetching ecosystem status:', error);
      },
    }
  );

  // Get performance summary
  const { data: performanceSummary, isLoading: performanceLoading } =
    useQuery<EcosystemPerformanceSummary>(
      'performance-summary',
      () => axios.get('/api/ecosystem/performance/summary').then((res) => res.data),
      {
        refetchInterval: 60000, // Refresh every minute
      }
    );

  // Initialize ecosystem mutation
  const initializeEcosystemMutation = useMutation(
    () => axios.post('/api/ecosystem/initialize').then((res) => res.data),
    {
      onMutate: () => {
        setIsInitializing(true);
        setInitializationError(null);
      },
      onSuccess: (_data) => {
        setIsInitializing(false);
        queryClient.invalidateQueries('ecosystem-status');
        queryClient.invalidateQueries('performance-summary');
      },
      onError: (error: any) => {
        setIsInitializing(false);
        setInitializationError(error.response?.data?.message || 'Failed to initialize ecosystem');
      },
    }
  );

  // Register module mutation
  const registerModuleMutation = useMutation(
    (registration: ModuleRegistration) =>
      axios.post('/api/ecosystem/modules/register', registration).then((res) => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ecosystem-status');
      },
    }
  );

  // Scale module mutation
  const scaleModuleMutation = useMutation(
    ({ moduleId, targetInstances }: { moduleId: string; targetInstances: number }) =>
      axios
        .post(`/api/ecosystem/modules/${moduleId}/scale`, { targetInstances })
        .then((res) => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ecosystem-status');
      },
    }
  );

  // Helper functions
  const initializeEcosystem = useCallback(() => {
    initializeEcosystemMutation.mutate();
  }, [initializeEcosystemMutation]);

  const registerModule = useCallback(
    (registration: ModuleRegistration) => {
      return registerModuleMutation.mutateAsync(registration);
    },
    [registerModuleMutation]
  );

  const scaleModule = useCallback(
    (moduleId: string, targetInstances: number) => {
      return scaleModuleMutation.mutateAsync({ moduleId, targetInstances });
    },
    [scaleModuleMutation]
  );

  const getModulesByTier = useCallback(
    (tier: 'Tier1' | 'Tier2' | 'Tier3') => {
      if (!ecosystemStatus) return [];
      return ecosystemStatus.moduleHealthStatuses.filter((module) => {
        // Simple tier classification based on module naming
        if (tier === 'Tier1') {
          return (
            module.moduleId.startsWith('government-') ||
            module.moduleId.startsWith('ai-') ||
            module.moduleId === 'marketplace-champion'
          );
        }
        if (tier === 'Tier2') {
          return (
            module.moduleId.startsWith('terra-') ||
            module.moduleId === 'unified-system' ||
            module.moduleId.includes('sync')
          );
        }
        if (tier === 'Tier3') {
          return (
            module.moduleId.startsWith('commercial-') ||
            module.moduleId.includes('tools') ||
            module.moduleId.includes('specialized')
          );
        }
        return false;
      });
    },
    [ecosystemStatus]
  );

  const getHealthyModulesCount = useCallback(() => {
    return ecosystemStatus?.healthyModules || 0;
  }, [ecosystemStatus]);

  const getCriticalModules = useCallback(() => {
    if (!ecosystemStatus) return [];
    return ecosystemStatus.moduleHealthStatuses.filter((m) => m.health === 'Critical');
  }, [ecosystemStatus]);

  const getSystemHealthScore = useCallback(() => {
    if (!ecosystemStatus) return 0;
    const { totalModules, healthyModules, warningModules } = ecosystemStatus;
    if (totalModules === 0) return 0;

    // Weight: Healthy = 1.0, Warning = 0.5, Critical = 0.0
    const score = (healthyModules * 1.0 + warningModules * 0.5) / totalModules;
    return Math.round(score * 100);
  }, [ecosystemStatus]);

  return {
    // Data
    ecosystemStatus,
    performanceSummary,

    // Loading states
    isLoading: statusLoading || performanceLoading,
    isInitializing,

    // Error states
    error: statusError || initializationError,

    // Actions
    initializeEcosystem,
    registerModule,
    scaleModule,
    refetchStatus,

    // Helper functions
    getModulesByTier,
    getHealthyModulesCount,
    getCriticalModules,
    getSystemHealthScore,

    // Mutation states
    isRegisteringModule: registerModuleMutation.isLoading,
    isScalingModule: scaleModuleMutation.isLoading,
  };
};

/**
 * Hook for specific module health monitoring
 */
export const useModuleHealth = (moduleId: string) => {
  const {
    data: healthStatus,
    error,
    isLoading,
    refetch,
  } = useQuery<ModuleHealthStatus>(
    ['module-health', moduleId],
    () => axios.get(`/api/ecosystem/modules/${moduleId}/health`).then((res) => res.data),
    {
      enabled: !!moduleId,
      refetchInterval: 15000, // Refresh every 15 seconds
    }
  );

  return {
    healthStatus,
    error,
    isLoading,
    refetch,
    isHealthy: healthStatus?.health === 'Healthy',
    isCritical: healthStatus?.health === 'Critical',
    hasIssues: (healthStatus?.issues?.length || 0) > 0,
  };
};

/**
 * Hook for module performance metrics
 */
export const useModuleMetrics = (moduleId: string) => {
  const {
    data: metrics,
    error,
    isLoading,
  } = useQuery<ModulePerformanceMetrics>(
    ['module-metrics', moduleId],
    () => axios.get(`/api/ecosystem/modules/${moduleId}/metrics`).then((res) => res.data),
    {
      enabled: !!moduleId,
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  );

  const getPerformanceGrade = useCallback(() => {
    if (!metrics) return 'Unknown';

    const { cpuUsage, errorRate, averageResponseTime } = metrics;

    // Calculate composite score
    const cpuScore = Math.max(0, 100 - cpuUsage) / 100;
    const errorScore = Math.max(0, 100 - errorRate * 100) / 100;
    const responseScore = Math.max(0, (500 - averageResponseTime) / 500); // 500ms baseline

    const compositeScore = (cpuScore + errorScore + responseScore) / 3;

    if (compositeScore >= 0.9) return 'Excellent';
    if (compositeScore >= 0.8) return 'Good';
    if (compositeScore >= 0.6) return 'Fair';
    if (compositeScore >= 0.4) return 'Poor';
    return 'Critical';
  }, [metrics]);

  return {
    metrics,
    error,
    isLoading,
    performanceGrade: getPerformanceGrade(),
    isHighCpu: (metrics?.cpuUsage || 0) > 80,
    isHighError: (metrics?.errorRate || 0) > 0.05,
    isSlowResponse: (metrics?.averageResponseTime || 0) > 200,
  };
};

/**
 * Hook for communication logs
 */
export const useCommunicationLogs = (count: number = 100) => {
  const {
    data: logs,
    error,
    isLoading,
  } = useQuery<ModuleCommunicationLog[]>(
    ['communication-logs', count],
    () => axios.get(`/api/ecosystem/communication/logs?count=${count}`).then((res) => res.data),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const getSuccessRate = useCallback(() => {
    if (!logs || logs.length === 0) return 100;
    const successfulLogs = logs.filter((log) => log.success);
    return Math.round((successfulLogs.length / logs.length) * 100);
  }, [logs]);

  const getRecentErrors = useCallback(() => {
    if (!logs) return [];
    return logs.filter((log) => !log.success).slice(0, 10);
  }, [logs]);

  return {
    logs,
    error,
    isLoading,
    successRate: getSuccessRate(),
    recentErrors: getRecentErrors(),
  };
};

/**
 * Hook for real-time module ecosystem updates
 */
export const useRealTimeEcosystem = () => {
  const [realtimeStatus, setRealtimeStatus] = useState<ModuleEcosystemStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  useEffect(() => {
    // In a real implementation, this would connect to SignalR hub for real-time updates
    // For now, we'll simulate real-time updates with polling
    let interval: ReturnType<typeof setInterval>;

    const connectToRealTime = async () => {
      setConnectionStatus('connecting');

      try {
        // Simulate connection delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setConnectionStatus('connected');

        // Start polling for updates
        interval = setInterval(async () => {
          try {
            const response = await axios.get('/api/ecosystem/status');
            setRealtimeStatus(response.data);
          } catch (error) {
            console.error('Real-time update failed:', error);
          }
        }, 5000); // Update every 5 seconds
      } catch (error) {
        setConnectionStatus('disconnected');
        console.error('Failed to connect to real-time updates:', error);
      }
    };

    connectToRealTime();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      setConnectionStatus('disconnected');
    };
  }, []);

  return {
    realtimeStatus,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  };
};
