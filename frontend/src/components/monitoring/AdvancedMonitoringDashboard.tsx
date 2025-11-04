/**
 * AdvancedMonitoringDashboard - Enterprise Monitoring & Observability UI
 *
 * Production-grade monitoring dashboard with real-time metrics, performance charts,
 * service health visualization, resource monitoring, and automated alerting.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 2 Day 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Alert } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

// ==================== TYPES ====================

export interface SystemMetrics {
  timestamp: string;
  uptime: string;
  uptimeSeconds: number;
  cpuUsagePercent: number;
  cpuCores: number;
  memoryUsedMB: number;
  memoryAvailableMB: number;
  memoryUsagePercent: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  requestsPerSecond: number;
  threadCount: number;
  gen0Collections: number;
  gen1Collections: number;
  gen2Collections: number;
  totalMemoryMB: number;
  machineName: string;
  processorArchitecture: string;
  operatingSystem: string;
}

export interface ServiceHealthMetric {
  serviceName: string;
  status: string;
  uptime: string;
  responseTimeMs: number;
  requestsPerSecond: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsageMB: number;
  lastHealthCheck: string;
}

export interface ResourceUtilization {
  timestamp: string;
  cpuUsagePercent: number;
  cpuCores: number;
  cpuUsagePerCore: number[];
  memoryUsedGB: number;
  memoryTotalGB: number;
  memoryUsagePercent: number;
  diskUsedGB: number;
  diskTotalGB: number;
  diskUsagePercent: number;
  diskReadMBps: number;
  diskWriteMBps: number;
  networkInboundMBps: number;
  networkOutboundMBps: number;
  activeConnections: number;
  aiAgentsActive: number;
  aiAgentsTotal: number;
  aiSwarmUtilization: number;
}

export interface AlertItem {
  id: string;
  severity: string;
  title: string;
  message: string;
  source: string;
  timestamp: string;
  isAcknowledged: boolean;
}

export interface PerformanceMetrics {
  timeRange: string;
  collectedAt: string;
  apiMetrics: {
    averageResponseTimeMs: number[];
    p50ResponseTimeMs: number;
    p95ResponseTimeMs: number;
    p99ResponseTimeMs: number;
    requestsPerMinute: number[];
    errorsPerMinute: number[];
    successRate: number;
  };
  databaseMetrics: {
    averageQueryTimeMs: number[];
    activeConnections: number;
    maxConnections: number;
    connectionPoolUsage: number;
    queriesPerSecond: number;
    slowQueries: number;
    deadlockCount: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    hits: number;
    misses: number;
    evictions: number;
    entriesCount: number;
    memoryUsedMB: number;
  };
  aiMetrics: {
    activeAgents: number;
    totalAgents: number;
    agentUtilization: number;
    averageProcessingTimeMs: number[];
    tasksProcessedPerMinute: number;
    swarmCoordinationLatencyMs: number;
  };
}

export interface MonitoringDashboard {
  generatedAt: string;
  refreshInterval: number;
  overallHealth: string;
  healthScore: number;
  servicesHealthy: number;
  servicesTotal: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  systemMetrics: SystemMetrics;
  performanceMetrics: PerformanceMetrics;
  serviceHealth: ServiceHealthMetric[];
  resourceUtilization: ResourceUtilization;
  activeAlerts: AlertItem[];
}

export interface AdvancedMonitoringDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ==================== COMPONENT ====================

export function AdvancedMonitoringDashboard({
  autoRefresh = true,
  refreshInterval = 5000,
}: AdvancedMonitoringDashboardProps) {
  // ==================== STATE ====================

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ==================== LOAD DASHBOARD ====================

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/monitoring/dashboard');
      if (!response.ok) {
        throw new Error('Failed to load monitoring dashboard');
      }

      const data: MonitoringDashboard = await response.json();
      setDashboard(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading monitoring dashboard:', err);
      setError('Failed to load monitoring data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== AUTO-REFRESH ====================

  useEffect(() => {
    loadDashboard();

    if (autoRefresh) {
      const interval = setInterval(loadDashboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadDashboard]);

  // ==================== RENDER HELPERS ====================

  const getHealthColor = (health: string): string => {
    switch (health.toLowerCase()) {
      case 'healthy':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'unhealthy':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-900/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30';
      case 'info':
        return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (mb: number): string => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  // ==================== RENDER ====================

  if (isLoading && !dashboard) {
    return (
      <Card className="monitoring-dashboard border-terra-cyan/30">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <p className="text-sm text-muted-foreground">Loading monitoring dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !dashboard) {
    return (
      <Card className="monitoring-dashboard border-terra-cyan/30">
        <CardContent className="p-4">
          <Alert className="border-red-500/30 bg-red-900/10">
            <p className="text-sm text-red-400">{error}</p>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <Card className="monitoring-dashboard border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>=Ê</span>
              <span>Advanced Monitoring & Observability</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Real-time system metrics, performance monitoring, and health tracking
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={getHealthColor(dashboard.overallHealth)}>
              {dashboard.overallHealth.toUpperCase()} - {dashboard.healthScore.toFixed(1)}%
            </Badge>
            <Button size="sm" variant="outline" onClick={loadDashboard} disabled={isLoading}>
              = Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services ({dashboard.servicesHealthy}/{dashboard.servicesTotal})</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({dashboard.activeAlertsCount})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* System Health */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-terra-cyan">
                        {dashboard.healthScore.toFixed(1)}%
                      </span>
                      <Badge className={getHealthColor(dashboard.overallHealth)}>
                        {dashboard.overallHealth}
                      </Badge>
                    </div>

                    <Progress value={dashboard.healthScore} className="h-2" />

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-semibold text-terra-cyan">
                          {formatUptime(dashboard.systemMetrics.uptimeSeconds)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Services</p>
                        <p className="font-semibold text-green-400">
                          {dashboard.servicesHealthy}/{dashboard.servicesTotal}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU Usage:</span>
                      <span className="font-semibold">
                        {dashboard.systemMetrics.cpuUsagePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory:</span>
                      <span className="font-semibold">
                        {dashboard.systemMetrics.memoryUsagePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requests/sec:</span>
                      <span className="font-semibold text-terra-cyan">
                        {dashboard.systemMetrics.requestsPerSecond.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Error Rate:</span>
                      <span className="font-semibold text-green-400">
                        {dashboard.systemMetrics.errorRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Agents:</span>
                      <span className="font-semibold text-purple-400">
                        {dashboard.resourceUtilization.aiAgentsActive}/{dashboard.resourceUtilization.aiAgentsTotal}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-background/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-terra-cyan">
                      {dashboard.systemMetrics.totalRequests.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Total Requests</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {dashboard.performanceMetrics.apiMetrics.successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Success Rate</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {dashboard.performanceMetrics.apiMetrics.p95ResponseTimeMs.toFixed(0)}ms
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">P95 Response Time</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {dashboard.performanceMetrics.cacheMetrics.hitRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Cache Hit Rate</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts Preview */}
            {dashboard.activeAlerts.length > 0 && (
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Active Alerts ({dashboard.activeAlertsCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.activeAlerts.slice(0, 3).map((alert) => (
                      <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <span className="text-sm font-semibold">{alert.title}</span>
                            </div>
                            <p className="text-xs mt-1">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.source} " {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {dashboard.serviceHealth.map((service, idx) => (
                  <Card key={idx} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg ${service.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                              {service.status === 'healthy' ? '' : ''}
                            </span>
                            <div>
                              <h4 className="text-sm font-semibold">{service.serviceName}</h4>
                              <p className="text-xs text-muted-foreground">
                                Uptime: {formatUptime(new Date(service.uptime).getTime() / 1000)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Response Time</p>
                              <p className="font-semibold">{service.responseTimeMs.toFixed(0)}ms</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Requests/sec</p>
                              <p className="font-semibold">{service.requestsPerSecond.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Error Rate</p>
                              <p className="font-semibold text-green-400">{service.errorRate.toFixed(2)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Memory</p>
                              <p className="font-semibold">{formatBytes(service.memoryUsageMB)}</p>
                            </div>
                          </div>
                        </div>

                        <Badge className={getHealthColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* CPU */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">CPU Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-terra-cyan">
                        {dashboard.resourceUtilization.cpuUsagePercent.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard.resourceUtilization.cpuCores} Cores
                      </span>
                    </div>
                    <Progress value={dashboard.resourceUtilization.cpuUsagePercent} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Memory */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Memory Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-400">
                        {dashboard.resourceUtilization.memoryUsagePercent.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard.resourceUtilization.memoryUsedGB.toFixed(1)}/{dashboard.resourceUtilization.memoryTotalGB.toFixed(1)} GB
                      </span>
                    </div>
                    <Progress value={dashboard.resourceUtilization.memoryUsagePercent} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Disk */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Disk Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-400">
                        {dashboard.resourceUtilization.diskUsagePercent.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard.resourceUtilization.diskUsedGB.toFixed(1)}/{dashboard.resourceUtilization.diskTotalGB.toFixed(1)} GB
                      </span>
                    </div>
                    <Progress value={dashboard.resourceUtilization.diskUsagePercent} className="h-2" />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Read</p>
                        <p className="font-semibold">{dashboard.resourceUtilization.diskReadMBps.toFixed(1)} MB/s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Write</p>
                        <p className="font-semibold">{dashboard.resourceUtilization.diskWriteMBps.toFixed(1)} MB/s</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Network Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Inbound</p>
                        <p className="text-xl font-bold text-green-400">
                          {dashboard.resourceUtilization.networkInboundMBps.toFixed(1)} MB/s
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outbound</p>
                        <p className="text-xl font-bold text-blue-400">
                          {dashboard.resourceUtilization.networkOutboundMBps.toFixed(1)} MB/s
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Active Connections</p>
                      <p className="text-lg font-semibold">{dashboard.resourceUtilization.activeConnections}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Swarm */}
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-sm">AI Agent Swarm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active Agents</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {dashboard.resourceUtilization.aiAgentsActive}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Agents</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {dashboard.resourceUtilization.aiAgentsTotal}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Utilization</p>
                    <p className="text-2xl font-bold text-terra-cyan">
                      {dashboard.resourceUtilization.aiSwarmUtilization.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress value={dashboard.resourceUtilization.aiSwarmUtilization} className="h-2 mt-3" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* API Performance */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">API Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P50 Response Time:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.apiMetrics.p50ResponseTimeMs.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P95 Response Time:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.apiMetrics.p95ResponseTimeMs.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P99 Response Time:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.apiMetrics.p99ResponseTimeMs.toFixed(0)}ms</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-semibold text-green-400">
                        {dashboard.performanceMetrics.apiMetrics.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Performance */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Database Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queries/sec:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.databaseMetrics.queriesPerSecond.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Connections:</span>
                      <span className="font-semibold">
                        {dashboard.performanceMetrics.databaseMetrics.activeConnections}/{dashboard.performanceMetrics.databaseMetrics.maxConnections}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool Usage:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.databaseMetrics.connectionPoolUsage.toFixed(1)}%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slow Queries:</span>
                      <span className="font-semibold text-yellow-400">
                        {dashboard.performanceMetrics.databaseMetrics.slowQueries}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cache Performance */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Cache Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hit Rate:</span>
                      <span className="font-semibold text-green-400">
                        {dashboard.performanceMetrics.cacheMetrics.hitRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Miss Rate:</span>
                      <span className="font-semibold text-yellow-400">
                        {dashboard.performanceMetrics.cacheMetrics.missRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entries:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.cacheMetrics.entriesCount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory Used:</span>
                      <span className="font-semibold">{formatBytes(dashboard.performanceMetrics.cacheMetrics.memoryUsedMB)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Performance */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">AI Swarm Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Agents:</span>
                      <span className="font-semibold text-purple-400">
                        {dashboard.performanceMetrics.aiMetrics.activeAgents}/{dashboard.performanceMetrics.aiMetrics.totalAgents}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilization:</span>
                      <span className="font-semibold text-terra-cyan">
                        {dashboard.performanceMetrics.aiMetrics.agentUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasks/min:</span>
                      <span className="font-semibold">{dashboard.performanceMetrics.aiMetrics.tasksProcessedPerMinute.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coordination Latency:</span>
                      <span className="font-semibold text-green-400">
                        {dashboard.performanceMetrics.aiMetrics.swarmCoordinationLatencyMs.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {dashboard.activeAlerts.length > 0 ? (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {dashboard.activeAlerts.map((alert) => (
                    <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-sm font-semibold">{alert.title}</span>
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Source: {alert.source}</span>
                            <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        {!alert.isAcknowledged && (
                          <Button size="sm" variant="outline" className="text-xs">
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert className="border-green-500/30 bg-green-900/10">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400"></span>
                  <p className="text-sm text-green-400">No active alerts. System operating normally.</p>
                </div>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {lastRefresh && (
          <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            Last refreshed: {lastRefresh.toLocaleTimeString()} " Auto-refresh: {autoRefresh ? `ON (${refreshInterval / 1000}s)` : 'OFF'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdvancedMonitoringDashboard;
