import { useQuery } from '@tanstack/react-query';

import { systemAPI } from '../services/systemAPI';

interface SystemHealth {
  memory: number | null;
  memoryStatus: 'healthy' | 'warning' | 'error' | 'unknown';
  cpu: number | null;
  cpuStatus: 'healthy' | 'warning' | 'error' | 'unknown';
  notifications: number;
  uptime: number | null;
  activeModules: number;
  totalModules: number;
  lastUpdated: string;
  status: string;
  warnings: string[];
  systemComponents: Record<string, boolean>;
}

interface SystemHealthResponse {
  status: string;
  moduleCount: number;
  healthyModules: number;
  systemComponents: Record<string, boolean>;
  warnings: string[];
  moduleCountTotal?: number | null;
  moduleCountActive?: number | null;
}

function toSystemHealth(response: SystemHealthResponse): SystemHealth {
  return {
    memory: null,
    memoryStatus: 'unknown',
    cpu: null,
    cpuStatus: 'unknown',
    notifications: response.warnings.length,
    uptime: null,
    activeModules: response.moduleCountActive ?? response.healthyModules,
    totalModules: response.moduleCountTotal ?? response.moduleCount,
    lastUpdated: new Date().toISOString(),
    status: response.status,
    warnings: response.warnings,
    systemComponents: response.systemComponents,
  };
}

export const useSystemHealth = () => {
  const {
    data: rawSystemHealth,
    isLoading,
    error,
    refetch,
  } = useQuery<SystemHealthResponse>('systemHealth', systemAPI.getSystemHealth, {
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });

  const resolved = rawSystemHealth
    ? toSystemHealth(rawSystemHealth)
    : {
        memory: null,
        memoryStatus: 'unknown' as const,
        cpu: null,
        cpuStatus: 'unknown' as const,
        notifications: 0,
        uptime: null,
        activeModules: 0,
        totalModules: 0,
        lastUpdated: '',
        status: 'Unavailable',
        warnings: [],
        systemComponents: {},
      };

  return {
    systemHealth: resolved,
    // Aliases used by ShellHome
    health: resolved,
    isLoading,
    loading: isLoading,
    error,
    refresh: refetch,
  };
};
