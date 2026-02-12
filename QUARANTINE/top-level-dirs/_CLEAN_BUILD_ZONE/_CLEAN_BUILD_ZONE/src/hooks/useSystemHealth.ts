import { useQuery } from 'react-query';

import { systemAPI } from '../services/systemAPI';

interface SystemHealth {
  memory: number;
  memoryStatus: 'healthy' | 'warning' | 'error';
  cpu: number;
  cpuStatus: 'healthy' | 'warning' | 'error';
  notifications: number;
  uptime: number;
  activeModules: number;
  totalModules: number;
  lastUpdated: string;
}

export const useSystemHealth = () => {
  const {
    data: systemHealth,
    isLoading,
    error,
  } = useQuery<SystemHealth>('systemHealth', systemAPI.getSystemHealth, {
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });

  const defaultHealth: SystemHealth = {
    memory: 45,
    memoryStatus: 'healthy',
    cpu: 12,
    cpuStatus: 'healthy',
    notifications: 0,
    uptime: 0,
    activeModules: 4,
    totalModules: 32,
    lastUpdated: new Date().toISOString(),
  };

  return {
    systemHealth: systemHealth || defaultHealth,
    isLoading,
    error,
  };
};
