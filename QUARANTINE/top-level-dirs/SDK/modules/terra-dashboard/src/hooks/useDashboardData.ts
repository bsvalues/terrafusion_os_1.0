/**
 * TerraFusion Dashboard - React Query Hooks
 * Government. Transcended. - Championship Data Integration
 * 
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { 
  DashboardConfig, 
  SystemMetrics, 
  TerraFusionModuleStats, 
  GovernmentServiceMetrics,
  AIInsight,
  HealthStatus,
  ChartData,
  QueryParams,
  ApiResponse,
  PaginatedResponse
} from '../types';

// === QUERY KEYS ===
export const dashboardKeys = {
  all: ['dashboard'] as const,
  configs: () => [...dashboardKeys.all, 'configs'] as const,
  config: (id: string) => [...dashboardKeys.configs(), id] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  systemMetrics: (params?: QueryParams) => [...dashboardKeys.metrics(), 'system', params] as const,
  moduleStats: (moduleId?: string) => [...dashboardKeys.metrics(), 'modules', moduleId] as const,
  governmentMetrics: (countyId?: string) => [...dashboardKeys.metrics(), 'government', countyId] as const,
  aiInsights: (type?: string) => [...dashboardKeys.all, 'ai-insights', type] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
  chartData: (widgetId: string, params?: QueryParams) => [...dashboardKeys.charts(), widgetId, params] as const
};

// === API BASE URL ===
const API_BASE = '/api/dashboard';

// === DASHBOARD CONFIGURATION HOOKS ===

/**
 * Get all dashboard configurations
 */
export const useDashboardConfigs = (
  options?: UseQueryOptions<DashboardConfig[], Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.configs(),
    queryFn: async (): Promise<DashboardConfig[]> => {
      const response = await fetch(`${API_BASE}/configs`);
      if (!response.ok) throw new Error('Failed to fetch dashboard configs');
      const result: ApiResponse<DashboardConfig[]> = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

/**
 * Get specific dashboard configuration
 */
export const useDashboardConfig = (
  id: string,
  options?: UseQueryOptions<DashboardConfig, Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.config(id),
    queryFn: async (): Promise<DashboardConfig> => {
      const response = await fetch(`${API_BASE}/configs/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch dashboard config: ${id}`);
      const result: ApiResponse<DashboardConfig> = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Create new dashboard configuration
 */
export const useCreateDashboard = (
  options?: UseMutationOptions<DashboardConfig, Error, Partial<DashboardConfig>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboard: Partial<DashboardConfig>): Promise<DashboardConfig> => {
      const response = await fetch(`${API_BASE}/configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard)
      });
      if (!response.ok) throw new Error('Failed to create dashboard');
      const result: ApiResponse<DashboardConfig> = await response.json();
      return result.data;
    },
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.configs() });
      queryClient.setQueryData(dashboardKeys.config(newDashboard.id), newDashboard);
    },
    ...options
  });
};

/**
 * Update dashboard configuration
 */
export const useUpdateDashboard = (
  options?: UseMutationOptions<DashboardConfig, Error, { id: string; dashboard: Partial<DashboardConfig> }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dashboard }): Promise<DashboardConfig> => {
      const response = await fetch(`${API_BASE}/configs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard)
      });
      if (!response.ok) throw new Error('Failed to update dashboard');
      const result: ApiResponse<DashboardConfig> = await response.json();
      return result.data;
    },
    onSuccess: (updatedDashboard) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.configs() });
      queryClient.setQueryData(dashboardKeys.config(updatedDashboard.id), updatedDashboard);
    },
    ...options
  });
};

// === SYSTEM METRICS HOOKS ===

/**
 * Get real-time system metrics with quantum optimization
 */
export const useSystemMetrics = (
  params?: QueryParams,
  options?: UseQueryOptions<SystemMetrics[], Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.systemMetrics(params),
    queryFn: async (): Promise<SystemMetrics[]> => {
      const searchParams = new URLSearchParams();
      if (params?.dateRange) {
        searchParams.append('start', params.dateRange.start);
        searchParams.append('end', params.dateRange.end);
      }
      if (params?.quantumOptimization) {
        searchParams.append('quantum', '949');
      }

      const response = await fetch(`${API_BASE}/metrics/system?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      const result: ApiResponse<SystemMetrics[]> = await response.json();
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 15 * 1000, // Refresh every 15 seconds
    refetchIntervalInBackground: true,
    ...options
  });
};

/**
 * Get TerraFusion module statistics
 */
export const useTerraFusionModules = (
  moduleId?: string,
  options?: UseQueryOptions<TerraFusionModuleStats[], Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.moduleStats(moduleId),
    queryFn: async (): Promise<TerraFusionModuleStats[]> => {
      const url = moduleId 
        ? `${API_BASE}/modules/${moduleId}/stats`
        : `${API_BASE}/modules/stats`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch module stats');
      const result: ApiResponse<TerraFusionModuleStats[]> = await response.json();
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    ...options
  });
};

/**
 * Get government service metrics by county
 */
export const useGovernmentMetrics = (
  countyId?: string,
  options?: UseQueryOptions<GovernmentServiceMetrics[], Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.governmentMetrics(countyId),
    queryFn: async (): Promise<GovernmentServiceMetrics[]> => {
      const url = countyId 
        ? `${API_BASE}/government/metrics?county=${countyId}`
        : `${API_BASE}/government/metrics`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch government metrics');
      const result: ApiResponse<GovernmentServiceMetrics[]> = await response.json();
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Refresh every minute
    ...options
  });
};

// === AI INSIGHTS HOOKS ===

/**
 * Get AI-generated insights
 */
export const useAIInsights = (
  type?: string,
  options?: UseQueryOptions<AIInsight[], Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.aiInsights(type),
    queryFn: async (): Promise<AIInsight[]> => {
      const url = type 
        ? `${API_BASE}/ai/insights?type=${type}`
        : `${API_BASE}/ai/insights`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      const result: ApiResponse<AIInsight[]> = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    ...options
  });
};

/**
 * Generate new AI insights
 */
export const useGenerateInsights = (
  options?: UseMutationOptions<AIInsight[], Error, { context?: string; forceRefresh?: boolean }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ context, forceRefresh = false }): Promise<AIInsight[]> => {
      const response = await fetch(`${API_BASE}/ai/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, forceRefresh, quantumFactor: 949 })
      });
      if (!response.ok) throw new Error('Failed to generate AI insights');
      const result: ApiResponse<AIInsight[]> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.aiInsights() });
    },
    ...options
  });
};

// === SYSTEM HEALTH HOOKS ===

/**
 * Get overall system health status
 */
export const useSystemHealth = (
  options?: UseQueryOptions<HealthStatus, Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: async (): Promise<HealthStatus> => {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('Failed to fetch system health');
      const result: ApiResponse<HealthStatus> = await response.json();
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 20 * 1000, // Refresh every 20 seconds
    refetchIntervalInBackground: true,
    ...options
  });
};

// === CHART DATA HOOKS ===

/**
 * Get chart data for specific widget
 */
export const useChartData = (
  widgetId: string,
  params?: QueryParams,
  options?: UseQueryOptions<ChartData, Error>
) => {
  return useQuery({
    queryKey: dashboardKeys.chartData(widgetId, params),
    queryFn: async (): Promise<ChartData> => {
      const searchParams = new URLSearchParams();
      if (params?.dateRange) {
        searchParams.append('start', params.dateRange.start);
        searchParams.append('end', params.dateRange.end);
      }
      if (params?.counties) {
        params.counties.forEach(county => searchParams.append('county', county));
      }
      if (params?.modules) {
        params.modules.forEach(module => searchParams.append('module', module));
      }
      if (params?.aggregation) {
        searchParams.append('aggregation', params.aggregation);
      }

      const response = await fetch(`${API_BASE}/charts/${widgetId}/data?${searchParams}`);
      if (!response.ok) throw new Error(`Failed to fetch chart data for widget: ${widgetId}`);
      const result: ApiResponse<ChartData> = await response.json();
      return result.data;
    },
    enabled: !!widgetId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refresh every minute
    ...options
  });
};

// === PERFORMANCE OPTIMIZATION HOOKS ===

/**
 * Get performance metrics for quantum optimization
 */
export const usePerformanceMetrics = (
  options?: UseQueryOptions<{ 
    quantumFactor: number; 
    optimizationScore: number; 
    recommendations: string[] 
  }, Error>
) => {
  return useQuery({
    queryKey: ['performance', 'quantum', 949],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/performance/quantum`);
      if (!response.ok) throw new Error('Failed to fetch performance metrics');
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

/**
 * Trigger quantum optimization
 */
export const useQuantumOptimization = (
  options?: UseMutationOptions<{ success: boolean; newFactor: number }, Error>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; newFactor: number }> => {
      const response = await fetch(`${API_BASE}/performance/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantumFactor: 949, transcendentMode: true })
      });
      if (!response.ok) throw new Error('Failed to optimize performance');
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.systemMetrics() });
    },
    ...options
  });
};

// === WEBSOCKET HOOKS FOR REAL-TIME UPDATES ===

/**
 * WebSocket connection for real-time dashboard updates
 */
export const useRealtimeUpdates = (dashboardId: string, enabled = true) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['realtime', dashboardId],
    queryFn: () => {
      const ws = new WebSocket(`ws://localhost:5009/api/dashboard/realtime/${dashboardId}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'metric-update':
            queryClient.invalidateQueries({ queryKey: dashboardKeys.systemMetrics() });
            break;
          case 'ai-insight':
            queryClient.invalidateQueries({ queryKey: dashboardKeys.aiInsights() });
            break;
          case 'system-status':
            queryClient.invalidateQueries({ queryKey: dashboardKeys.health() });
            break;
        }
      };

      return ws;
    },
    enabled: enabled && !!dashboardId,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
