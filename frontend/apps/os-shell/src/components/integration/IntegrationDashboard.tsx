/**
 * IntegrationDashboard - Multi-System Integration Orchestration Interface
 *
 * Comprehensive integration dashboard with real-time system monitoring,
 * sync operations, health tracking, and multi-system coordination.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 3 Day 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Link,
  GitBranch,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  RefreshCw,
  Play,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Gauge,
  Network,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Settings,
  BarChart3,
  History
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface IntegrationStatus {
  timestamp: string;
  uptime: {
    days: number;
    hours: number;
    minutes: number;
  };
  uptimeSeconds: number;
  totalSystems: number;
  connectedSystems: number;
  disconnectedSystems: number;
  activeSyncs: number;
  totalSyncOperations: number;
  successfulSyncs: number;
  failedSyncs: number;
  syncSuccessRate: number;
  averageSyncTime: number;
  totalRecordsSynced: number;
  averageResponseTime: number;
  healthStatus: string;
  integrationScore: number;
  systemsByType: Record<string, number>;
  warnings: string[];
  alerts: string[];
}

interface SystemConnector {
  systemId: string;
  systemName: string;
  systemType: string;
  status: string;
  version: string;
  endpoint: string;
  lastSync: string;
  nextSync: string;
  syncInterval: number;
  syncIntervalFormatted: string;
  totalRecords: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  averageResponseTime: number;
  healthScore: number;
  dataFlowDirection: string;
  priority: number;
  features: string[];
  isHealthy: boolean;
  lastError?: string;
  errorCount: number;
}

interface SyncOperation {
  operationId: string;
  systemId: string;
  systemName: string;
  syncType: string;
  status: string;
  startTime: string;
  endTime?: string;
  recordsToSync: number;
  recordsSynced: number;
  progressPercentage: number;
  message: string;
}

interface SyncHistory {
  operationId: string;
  systemId: string;
  systemName: string;
  syncType: string;
  status: string;
  startTime: string;
  endTime?: string;
  recordsSynced: number;
  duration: number;
  message: string;
}

interface IntegrationHealth {
  timestamp: string;
  overallHealth: string;
  healthScore: number;
  connectedSystems: number;
  totalSystems: number;
  connectionHealthPercentage: number;
  recentSyncSuccessRate: number;
  averageSyncDuration: number;
  syncsLast24Hours: number;
  failedSyncsLast24Hours: number;
  averageResponseTime: number;
  slowestSystem: string;
  fastestSystem: string;
  systemHealth: SystemHealthDetail[];
  recommendations: string[];
}

interface SystemHealthDetail {
  systemId: string;
  systemName: string;
  status: string;
  healthScore: number;
  lastSync: string;
  failedSyncs: number;
  responseTime: number;
}

interface IntegrationMetric {
  metricName: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trend: string;
  timeRange: string;
}

// ==================== MAIN COMPONENT ====================

export function IntegrationDashboard() {
  // State management
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [connectors, setConnectors] = useState<SystemConnector[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [metrics, setMetrics] = useState<IntegrationMetric[]>([]);
  const [activeSync, setActiveSync] = useState<SyncOperation | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(15000); // 15 seconds
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Load integration data
  const loadIntegrationData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load integration status
      const statusResponse = await fetch('/api/integration/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }

      // Load system connectors
      const connectorsResponse = await fetch('/api/integration/connectors');
      if (connectorsResponse.ok) {
        const connectorsData = await connectorsResponse.json();
        setConnectors(connectorsData);
      }

      // Load sync history
      const historyResponse = await fetch('/api/integration/sync/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setSyncHistory(historyData);
      }

      // Load integration health
      const healthResponse = await fetch('/api/integration/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData);
      }

      // Load integration metrics
      const metricsResponse = await fetch(`/api/integration/metrics?timeRange=${selectedTimeRange}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integration data');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  // Initiate sync
  const initiateSync = async (systemId: string, syncType: string = 'full') => {
    setLoading(true);
    try {
      const response = await fetch('/api/integration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: systemId,
          syncType: syncType,
          parameters: {}
        })
      });

      if (response.ok) {
        const syncData = await response.json();
        setActiveSync(syncData);
        // Reload data after sync
        setTimeout(() => loadIntegrationData(), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate sync');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadIntegrationData();

    if (autoRefresh) {
      const interval = setInterval(loadIntegrationData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadIntegrationData]);

  // Helper functions
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getHealthColor = (health: string): string => {
    switch (health.toLowerCase()) {
      case 'healthy':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'connected':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'disconnected':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'connecting':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getDataFlowIcon = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'inbound':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'outbound':
        return <ArrowLeft className="w-4 h-4 text-purple-400" />;
      case 'bidirectional':
        return <ArrowLeftRight className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (error) {
    return (
      <Alert className="bg-red-900/20 border-red-500/30">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-terra-midnight min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-terra-cyan flex items-center gap-3">
            <Link className="w-8 h-8" />
            Integration Orchestration
          </h1>
          <p className="text-terra-silver mt-1">Multi-system coordination and data synchronization</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 bg-terra-dark border border-terra-cyan/30 rounded-lg text-terra-cyan"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Auto-refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadIntegrationData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Health Status</p>
                  <Badge className={`mt-2 ${getHealthColor(status.healthStatus)}`}>
                    {status.healthStatus.toUpperCase()}
                  </Badge>
                </div>
                <CheckCircle className={`w-8 h-8 ${getHealthColor(status.healthStatus)}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Connected Systems</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {status.connectedSystems} / {status.totalSystems}
                  </p>
                </div>
                <Server className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Integration Score</p>
                  <p className="text-2xl font-bold text-terra-cyan mt-1">
                    {formatPercent(status.integrationScore)}
                  </p>
                </div>
                <Gauge className="w-8 h-8 text-terra-cyan" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Sync Success Rate</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {formatPercent(status.syncSuccessRate)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts and Warnings */}
      {status && (status.alerts.length > 0 || status.warnings.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {status.alerts.length > 0 && (
            <Alert className="bg-red-900/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {status.alerts.map((alert, index) => (
                    <div key={index} className="text-red-400">{alert}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status.warnings.length > 0 && (
            <Alert className="bg-yellow-900/20 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {status.warnings.map((warning, index) => (
                    <div key={index} className="text-yellow-400">{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList className="bg-terra-dark border border-terra-cyan/30">
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="sync">Sync Operations</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Systems Tab */}
        <TabsContent value="systems" className="space-y-6">
          {status && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-terra-cyan">
                  <GitBranch className="w-5 h-5" />
                  System Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="text-sm text-terra-silver">Total Syncs</div>
                    <div className="text-2xl font-bold text-terra-cyan mt-1">
                      {formatNumber(status.totalSyncOperations)}
                    </div>
                  </div>
                  <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="text-sm text-terra-silver">Records Synced</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">
                      {formatNumber(status.totalRecordsSynced)}
                    </div>
                  </div>
                  <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="text-sm text-terra-silver">Avg Response</div>
                    <div className="text-2xl font-bold text-terra-cyan mt-1">
                      {status.averageResponseTime.toFixed(0)}ms
                    </div>
                  </div>
                  <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="text-sm text-terra-silver">Uptime</div>
                    <div className="text-lg font-bold text-green-400 mt-1">
                      {formatUptime(status.uptimeSeconds)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Connectors */}
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Network className="w-5 h-5" />
                System Connectors
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Real-time connection status for all integrated systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectors.map((connector) => (
                  <div key={connector.systemId} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-terra-cyan" />
                        <div>
                          <h4 className="font-medium text-terra-cyan">{connector.systemName}</h4>
                          <p className="text-xs text-terra-silver">{connector.systemType} v{connector.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(connector.status)}>
                          {connector.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-terra-silver">
                          Priority: {connector.priority}
                        </Badge>
                        {getDataFlowIcon(connector.dataFlowDirection)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-terra-silver">Total Records</div>
                        <div className="text-sm font-bold text-terra-cyan">{formatNumber(connector.totalRecords)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Success Rate</div>
                        <div className="text-sm font-bold text-green-400">{formatPercent(connector.successRate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Response Time</div>
                        <div className="text-sm font-bold text-terra-cyan">{connector.averageResponseTime.toFixed(0)}ms</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Health Score</div>
                        <div className="text-sm font-bold text-green-400">{formatPercent(connector.healthScore)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Sync Interval</div>
                        <div className="text-sm font-bold text-terra-cyan">{connector.syncIntervalFormatted}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-terra-silver">
                          Last Sync: {new Date(connector.lastSync).toLocaleString()}
                        </span>
                        <span className="text-terra-silver">
                          Next Sync: {new Date(connector.nextSync).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => initiateSync(connector.systemId)}
                        disabled={loading || connector.status !== 'connected'}
                        className="gap-2"
                      >
                        <Play className="w-3 h-3" />
                        Sync Now
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {connector.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-blue-400">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Operations Tab */}
        <TabsContent value="sync" className="space-y-6">
          {activeSync && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-terra-cyan">
                  <Activity className="w-5 h-5 animate-pulse" />
                  Active Sync Operation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-terra-cyan">{activeSync.systemName}</h4>
                      <p className="text-sm text-terra-silver">{activeSync.syncType} sync</p>
                    </div>
                    <Badge className={getStatusColor(activeSync.status)}>
                      {activeSync.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-terra-silver">Progress</span>
                      <span className="text-sm text-terra-cyan">
                        {activeSync.recordsSynced} / {activeSync.recordsToSync} records
                      </span>
                    </div>
                    <Progress value={activeSync.progressPercentage} className="h-2" />
                    <p className="text-xs text-terra-silver mt-1">{activeSync.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Clock className="w-5 h-5" />
                Sync Queue
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Pending sync operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status && status.activeSyncs > 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
                  <p className="text-terra-cyan font-medium">{status.activeSyncs} active sync operations</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-terra-silver">No pending sync operations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          {health && (
            <>
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <CheckCircle className="w-5 h-5" />
                    Integration Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-6 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver mb-2">Overall Health</div>
                      <Badge className={`text-lg ${getHealthColor(health.overallHealth)}`}>
                        {health.overallHealth.toUpperCase()}
                      </Badge>
                      <div className="text-3xl font-bold text-green-400 mt-3">
                        {formatPercent(health.healthScore)}
                      </div>
                      <Progress value={health.healthScore} className="h-2 mt-3" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-terra-silver">Connection Health</span>
                        <span className="text-green-400 font-bold">{formatPercent(health.connectionHealthPercentage)}</span>
                      </div>
                      <Progress value={health.connectionHealthPercentage} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-terra-silver">Sync Success Rate</span>
                        <span className="text-green-400 font-bold">{formatPercent(health.recentSyncSuccessRate)}</span>
                      </div>
                      <Progress value={health.recentSyncSuccessRate} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-terra-midnight rounded">
                        <div className="text-xs text-terra-silver">Syncs (24h)</div>
                        <div className="text-xl font-bold text-terra-cyan">{formatNumber(health.syncsLast24Hours)}</div>
                      </div>
                      <div className="p-3 bg-terra-midnight rounded">
                        <div className="text-xs text-terra-silver">Failed (24h)</div>
                        <div className="text-xl font-bold text-red-400">{formatNumber(health.failedSyncsLast24Hours)}</div>
                      </div>
                      <div className="p-3 bg-terra-midnight rounded">
                        <div className="text-xs text-terra-silver">Avg Duration</div>
                        <div className="text-xl font-bold text-terra-cyan">{health.averageSyncDuration.toFixed(0)}ms</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Fastest System</span>
                      </div>
                      <p className="text-lg font-bold text-green-300">{health.fastestSystem}</p>
                    </div>
                    <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400">Slowest System</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-300">{health.slowestSystem}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health Details */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Server className="w-5 h-5" />
                    Per-System Health Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {health.systemHealth.map((system, index) => (
                      <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-terra-cyan">{system.systemName}</span>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(system.status)}>
                              {system.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-green-400 font-bold">
                              {formatPercent(system.healthScore)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-terra-silver">Last Sync: </span>
                            <span className="text-terra-cyan">{new Date(system.lastSync).toLocaleTimeString()}</span>
                          </div>
                          <div>
                            <span className="text-terra-silver">Failed Syncs: </span>
                            <span className="text-red-400">{system.failedSyncs}</span>
                          </div>
                          <div>
                            <span className="text-terra-silver">Response Time: </span>
                            <span className="text-terra-cyan">{system.responseTime.toFixed(0)}ms</span>
                          </div>
                        </div>
                        <Progress value={system.healthScore} className="h-1 mt-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {health.recommendations.length > 0 && (
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <Settings className="w-5 h-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {health.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-terra-silver">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <BarChart3 className="w-5 h-5" />
                Integration Metrics
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Performance trends for {selectedTimeRange}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-terra-cyan">{metric.metricName}</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <Badge variant="outline" className={metric.changePercentage >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {metric.changePercentage >= 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-terra-silver">Current</div>
                        <div className="text-2xl font-bold text-terra-cyan">
                          {metric.metricName.includes('Rate') || metric.metricName.includes('Success')
                            ? formatPercent(metric.currentValue)
                            : formatNumber(Math.round(metric.currentValue))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Previous</div>
                        <div className="text-lg font-bold text-terra-silver">
                          {metric.metricName.includes('Rate') || metric.metricName.includes('Success')
                            ? formatPercent(metric.previousValue)
                            : formatNumber(Math.round(metric.previousValue))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <History className="w-5 h-5" />
                Sync History
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Recent sync operations (last 100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncHistory.slice(0, 20).map((history) => (
                  <div key={history.operationId} className="p-3 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-terra-cyan">{history.systemName}</span>
                        <Badge variant="outline" className="text-xs">
                          {history.syncType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(history.status)}>
                          {history.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-terra-silver">
                          {formatDuration(history.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-terra-silver">
                        {new Date(history.startTime).toLocaleString()}
                      </span>
                      <span className="text-terra-cyan">
                        {formatNumber(history.recordsSynced)} records
                      </span>
                    </div>
                    {history.status === 'failed' && (
                      <p className="text-xs text-red-400 mt-2">{history.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IntegrationDashboard;
