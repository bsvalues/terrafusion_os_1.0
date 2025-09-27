import { useState, useEffect, useCallback } from 'react';
import { executiveDashboardService } from '../services/ExecutiveDashboardService';

interface KPIData {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  format?: 'currency' | 'percentage' | 'number';
  target?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  color?: string;
}

interface StrategicInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  recommendations: string[];
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'contained' | 'outlined' | 'text';
  }>;
}

interface PerformanceMetric {
  title: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

interface DashboardData {
  revenueData: Array<{
    month: string;
    actual: number;
    forecast: number;
    target: number;
  }>;
  complianceData: Array<{
    framework: string;
    status: 'compliant' | 'warning' | 'non-compliant';
    score: number;
    lastAudit: string;
    issues: number;
  }>;
  aiPerformanceData: Array<{
    time: string;
    activeAgents: number;
    processingTasks: number;
  }>;
  aiStats: {
    totalAgents: number;
    activeAgents: number;
    avgResponseTime: number;
    successRate: number;
  };
}

export const useExecutiveDashboard = (jurisdiction: string, refreshInterval: number = 30000) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [strategicInsights, setStrategicInsights] = useState<StrategicInsight[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshDashboard = useCallback(
    async (timeRange: string = '30d') => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          dashboardResponse,
          kpiResponse,
          insightsResponse,
          alertsResponse,
          performanceResponse,
        ] = await Promise.all([
          executiveDashboardService.getDashboardData(jurisdiction, timeRange),
          executiveDashboardService.getKPIData(jurisdiction, timeRange),
          executiveDashboardService.getStrategicInsights(jurisdiction),
          executiveDashboardService.getAlerts(jurisdiction),
          executiveDashboardService.getPerformanceMetrics(jurisdiction),
        ]);

        setDashboardData(dashboardResponse);
        setKpiData(kpiResponse);
        setStrategicInsights(insightsResponse);
        setAlerts(alertsResponse);
        setPerformanceMetrics(performanceResponse);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    },
    [jurisdiction]
  );

  const exportDashboard = useCallback(
    async (format: 'pdf' | 'excel') => {
      try {
        const downloadUrl = await executiveDashboardService.exportDashboard(jurisdiction, format);
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `executive-dashboard-${jurisdiction}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to export dashboard');
      }
    },
    [jurisdiction]
  );

  const updateSettings = useCallback(
    async (settings: any) => {
      try {
        await executiveDashboardService.updateSettings(jurisdiction, settings);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to update settings');
      }
    },
    [jurisdiction]
  );

  // Auto-refresh effect
  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      refreshDashboard();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshDashboard, refreshInterval]);

  return {
    dashboardData,
    kpiData,
    strategicInsights,
    alerts,
    performanceMetrics,
    isLoading,
    error,
    lastUpdated,
    refreshDashboard,
    exportDashboard,
    updateSettings,
  };
};
