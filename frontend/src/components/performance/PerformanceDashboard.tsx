/**
 * PerformanceDashboard - Performance Optimization & Caching Interface
 *
 * Comprehensive performance dashboard with cache statistics, query performance,
 * resource utilization, and optimization recommendations.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 3 Day 2
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Gauge,
  Clock,
  Layers,
  Target,
  Trash2
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface PerformanceStatus {
  timestamp: string;
  uptime: {
    days: number;
    hours: number;
    minutes: number;
  };
  uptimeSeconds: number;
  cacheHitRate: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  cacheSize: number;
  cacheUtilization: number;
  totalQueriesExecuted: number;
  averageQueryTime: number;
  slowestQuery: string;
  fastestQuery: string;
  memoryUsageMB: number;
  cpuUsagePercent: number;
  threadCount: number;
  totalOptimizations: number;
  lastOptimization: string;
  performanceScore: number;
  healthStatus: string;
  bottlenecks: string[];
  warnings: string[];
}

interface CacheStatistics {
  timestamp: string;
  totalEntries: number;
  totalSize: number;
  memoryUtilization: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  missRate: number;
  tierDistribution: Record<string, CacheTierStats>;
  hotKeys: CacheKeyStats[];
  expiringSoon: number;
  expired: number;
  averageAccessTime: number;
  p95AccessTime: number;
  p99AccessTime: number;
}

interface CacheTierStats {
  entryCount: number;
  totalSize: number;
  hitRate: number;
}

interface CacheKeyStats {
  key: string;
  accessCount: number;
  size: number;
  lastAccessed: string;
  cacheTier: string;
}

interface OptimizationRecommendation {
  category: string;
  priority: string;
  title: string;
  description: string;
  estimatedImpact: string;
  implementation: string[];
}

interface QueryPerformanceReport {
  timestamp: string;
  totalQueries: number;
  averageExecutionTime: number;
  queryMetrics: QueryPerformanceDetail[];
  fastQueries: number;
  moderateQueries: number;
  slowQueries: number;
  queriesRequiringOptimization: number;
  estimatedOptimizationGain: number;
}

interface QueryPerformanceDetail {
  queryName: string;
  queryText: string;
  executionCount: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  lastExecuted: string;
  performanceRating: string;
  optimizationPotential: number;
}

interface ResourceUtilizationReport {
  timestamp: string;
  memoryUsedMB: number;
  memoryAvailableMB: number;
  memoryUtilizationPercent: number;
  cpuUsagePercent: number;
  threadCount: number;
  threadPoolAvailable: number;
  cacheMemoryMB: number;
  cacheUtilizationPercent: number;
  diskReadMBps: number;
  diskWriteMBps: number;
  networkInMBps: number;
  networkOutMBps: number;
  resourceHealth: string;
  recommendations: string[];
}

// ==================== MAIN COMPONENT ====================

export function PerformanceDashboard() {
  // State management
  const [status, setStatus] = useState<PerformanceStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStatistics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [queryReport, setQueryReport] = useState<QueryPerformanceReport | null>(null);
  const [resourceReport, setResourceReport] = useState<ResourceUtilizationReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(10000); // 10 seconds

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load performance status
      const statusResponse = await fetch('/api/performance/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }

      // Load cache statistics
      const cacheResponse = await fetch('/api/performance/cache/statistics');
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        setCacheStats(cacheData);
      }

      // Load optimization recommendations
      const recsResponse = await fetch('/api/performance/recommendations');
      if (recsResponse.ok) {
        const recsData = await recsResponse.json();
        setRecommendations(recsData);
      }

      // Load query performance
      const queryResponse = await fetch('/api/performance/queries');
      if (queryResponse.ok) {
        const queryData = await queryResponse.json();
        setQueryReport(queryData);
      }

      // Load resource utilization
      const resourceResponse = await fetch('/api/performance/resources');
      if (resourceResponse.ok) {
        const resourceData = await resourceResponse.json();
        setResourceReport(resourceData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run optimization
  const runOptimization = async (strategy: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/performance/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, parameters: {} })
      });

      if (response.ok) {
        // Reload data after optimization
        await loadPerformanceData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run optimization');
    } finally {
      setLoading(false);
    }
  };

  // Invalidate cache
  const invalidateCache = async (strategy: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/performance/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      });

      if (response.ok) {
        // Reload data after invalidation
        await loadPerformanceData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate cache');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(loadPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadPerformanceData]);

  // Helper functions
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  };

  const getHealthColor = (health: string): string => {
    switch (health.toLowerCase()) {
      case 'optimal':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'good':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-900/20 border-red-500/30 text-red-400';
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-900/20 border-gray-500/30 text-gray-400';
    }
  };

  const getRatingColor = (rating: string): string => {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-blue-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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
            <Zap className="w-8 h-8" />
            Performance & Optimization
          </h1>
          <p className="text-terra-silver mt-1">Intelligent caching and resource optimization</p>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={loadPerformanceData}
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
                  <p className="text-sm text-terra-silver">Performance Score</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">
                    {formatPercent(status.performanceScore)}
                  </p>
                  <Badge className={`mt-2 ${getHealthColor(status.healthStatus)}`}>
                    {status.healthStatus.toUpperCase()}
                  </Badge>
                </div>
                <Gauge className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Cache Hit Rate</p>
                  <p className="text-3xl font-bold text-terra-cyan mt-1">
                    {formatPercent(status.cacheHitRate)}
                  </p>
                  <p className="text-xs text-terra-silver mt-1">
                    {formatNumber(status.totalCacheHits)} hits
                  </p>
                </div>
                <Database className="w-10 h-10 text-terra-cyan" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Avg Query Time</p>
                  <p className="text-3xl font-bold text-terra-cyan mt-1">
                    {status.averageQueryTime.toFixed(1)}ms
                  </p>
                </div>
                <Clock className="w-10 h-10 text-terra-cyan" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Memory Usage</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">
                    {status.memoryUsageMB}MB
                  </p>
                  <p className="text-xs text-terra-silver mt-1">
                    CPU: {formatPercent(status.cpuUsagePercent)}
                  </p>
                </div>
                <Cpu className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottlenecks and Warnings */}
      {status && (status.bottlenecks.length > 0 || status.warnings.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {status.bottlenecks.length > 0 && (
            <Alert className="bg-red-900/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Performance Bottlenecks</div>
                <div className="space-y-1">
                  {status.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="text-sm text-red-400">{bottleneck}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status.warnings.length > 0 && (
            <Alert className="bg-yellow-900/20 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Warnings</div>
                <div className="space-y-1">
                  {status.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-400">{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="cache" className="space-y-6">
        <TabsList className="bg-terra-dark border border-terra-cyan/30">
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
        </TabsList>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-6">
          {cacheStats && (
            <>
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-terra-cyan">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Cache Statistics
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => invalidateCache('expired')}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Expired
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Total Entries</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(cacheStats.totalEntries)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Total Size</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatBytes(cacheStats.totalSize)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Hit Rate</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatPercent(cacheStats.hitRate)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Avg Access Time</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {cacheStats.averageAccessTime.toFixed(1)}ms
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-silver">Memory Utilization</span>
                        <span className="text-terra-cyan font-bold">{formatPercent(cacheStats.memoryUtilization)}</span>
                      </div>
                      <Progress value={cacheStats.memoryUtilization} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                        <div className="text-sm text-green-400 mb-1">Cache Hits</div>
                        <div className="text-xl font-bold text-green-300">{formatNumber(cacheStats.totalHits)}</div>
                      </div>
                      <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
                        <div className="text-sm text-red-400 mb-1">Cache Misses</div>
                        <div className="text-xl font-bold text-red-300">{formatNumber(cacheStats.totalMisses)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tier Distribution */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-terra-silver mb-3">Cache Tier Distribution</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      {Object.entries(cacheStats.tierDistribution).map(([tier, stats]) => (
                        <div key={tier} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-terra-cyan font-medium capitalize">{tier}</span>
                            <Badge variant="outline">{formatPercent(stats.hitRate)}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-terra-silver">Entries: </span>
                              <span className="text-terra-cyan">{stats.entryCount}</span>
                            </div>
                            <div>
                              <span className="text-terra-silver">Size: </span>
                              <span className="text-terra-cyan">{formatBytes(stats.totalSize)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hot Keys */}
                  <div>
                    <h4 className="text-sm font-medium text-terra-silver mb-3">Most Accessed Keys (Top 10)</h4>
                    <div className="space-y-2">
                      {cacheStats.hotKeys.map((key, index) => (
                        <div key={index} className="p-3 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-terra-cyan font-mono text-sm">{key.key}</span>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs capitalize">{key.cacheTier}</Badge>
                              <span className="text-sm text-terra-silver">{key.accessCount} accesses</span>
                            </div>
                          </div>
                          <div className="text-xs text-terra-silver">
                            Size: {formatBytes(key.size)} | Last Accessed: {new Date(key.lastAccessed).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Queries Tab */}
        <TabsContent value="queries" className="space-y-6">
          {queryReport && (
            <>
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Activity className="w-5 h-5" />
                    Query Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                      <div className="text-sm text-green-400">Fast Queries</div>
                      <div className="text-3xl font-bold text-green-300 mt-1">{queryReport.fastQueries}</div>
                      <div className="text-xs text-green-400 mt-1">&lt;20ms</div>
                    </div>
                    <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                      <div className="text-sm text-blue-400">Moderate Queries</div>
                      <div className="text-3xl font-bold text-blue-300 mt-1">{queryReport.moderateQueries}</div>
                      <div className="text-xs text-blue-400 mt-1">20-50ms</div>
                    </div>
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                      <div className="text-sm text-red-400">Slow Queries</div>
                      <div className="text-3xl font-bold text-red-300 mt-1">{queryReport.slowQueries}</div>
                      <div className="text-xs text-red-400 mt-1">&gt;50ms</div>
                    </div>
                    <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                      <div className="text-sm text-purple-400">Optimization Gain</div>
                      <div className="text-3xl font-bold text-purple-300 mt-1">{formatPercent(queryReport.estimatedOptimizationGain)}</div>
                      <div className="text-xs text-purple-400 mt-1">Potential</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {queryReport.queryMetrics.map((query, index) => (
                      <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-terra-cyan">{query.queryName}</span>
                            <Badge className={getRatingColor(query.performanceRating)}>
                              {query.performanceRating.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-terra-silver">{query.executionCount} executions</span>
                            <span className="text-sm text-yellow-400">Potential: {formatPercent(query.optimizationPotential)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-terra-silver">Average</div>
                            <div className="text-sm font-bold text-terra-cyan">{query.averageTime.toFixed(1)}ms</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Min</div>
                            <div className="text-sm font-bold text-green-400">{query.minTime.toFixed(1)}ms</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Max</div>
                            <div className="text-sm font-bold text-red-400">{query.maxTime.toFixed(1)}ms</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Last Executed</div>
                            <div className="text-sm font-bold text-terra-cyan">{new Date(query.lastExecuted).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        <div className="text-xs text-terra-silver font-mono bg-terra-dark p-2 rounded">
                          {query.queryText}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {resourceReport && (
            <>
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Cpu className="w-5 h-5" />
                    Resource Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Memory */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-terra-silver flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Memory
                      </h4>
                      <div className="p-4 bg-terra-midnight rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-terra-silver">Memory Usage</span>
                          <span className="text-sm text-terra-cyan font-bold">
                            {resourceReport.memoryUsedMB}MB / {resourceReport.memoryAvailableMB}MB
                          </span>
                        </div>
                        <Progress value={resourceReport.memoryUtilizationPercent} className="h-2 mb-2" />
                        <div className="text-xs text-terra-silver">{formatPercent(resourceReport.memoryUtilizationPercent)} utilized</div>
                      </div>

                      <div className="p-4 bg-terra-midnight rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-terra-silver">Cache Memory</span>
                          <span className="text-sm text-terra-cyan font-bold">{resourceReport.cacheMemoryMB}MB</span>
                        </div>
                        <Progress value={resourceReport.cacheUtilizationPercent} className="h-2 mb-2" />
                        <div className="text-xs text-terra-silver">{formatPercent(resourceReport.cacheUtilizationPercent)} utilized</div>
                      </div>
                    </div>

                    {/* CPU & Threads */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-terra-silver flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        CPU & Threads
                      </h4>
                      <div className="p-4 bg-terra-midnight rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-terra-silver">CPU Usage</span>
                          <span className="text-sm text-terra-cyan font-bold">{formatPercent(resourceReport.cpuUsagePercent)}</span>
                        </div>
                        <Progress value={resourceReport.cpuUsagePercent} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-terra-midnight rounded">
                          <div className="text-xs text-terra-silver">Thread Count</div>
                          <div className="text-xl font-bold text-terra-cyan">{resourceReport.threadCount}</div>
                        </div>
                        <div className="p-3 bg-terra-midnight rounded">
                          <div className="text-xs text-terra-silver">Pool Available</div>
                          <div className="text-xl font-bold text-green-400">{resourceReport.threadPoolAvailable}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disk & Network */}
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-terra-silver flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Disk I/O
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-terra-midnight rounded-lg">
                          <div className="text-xs text-terra-silver mb-1">Read</div>
                          <div className="text-xl font-bold text-blue-400">{resourceReport.diskReadMBps} MB/s</div>
                        </div>
                        <div className="p-4 bg-terra-midnight rounded-lg">
                          <div className="text-xs text-terra-silver mb-1">Write</div>
                          <div className="text-xl font-bold text-purple-400">{resourceReport.diskWriteMBps} MB/s</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-terra-silver flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Network I/O
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-terra-midnight rounded-lg">
                          <div className="text-xs text-terra-silver mb-1">Inbound</div>
                          <div className="text-xl font-bold text-green-400">{resourceReport.networkInMBps} MB/s</div>
                        </div>
                        <div className="p-4 bg-terra-midnight rounded-lg">
                          <div className="text-xs text-terra-silver mb-1">Outbound</div>
                          <div className="text-xl font-bold text-yellow-400">{resourceReport.networkOutMBps} MB/s</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {resourceReport.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-terra-silver mb-3">Resource Recommendations</h4>
                      <ul className="space-y-2">
                        {resourceReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 p-2 bg-yellow-900/20 rounded border border-yellow-500/30">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-yellow-400">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Target className="w-5 h-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Prioritized recommendations for performance improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">{rec.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{rec.category}</Badge>
                      </div>
                    </div>

                    <p className="text-sm opacity-90 mb-3">{rec.description}</p>

                    <div className="p-3 bg-terra-dark rounded mb-3">
                      <div className="text-xs text-terra-silver mb-1">Estimated Impact</div>
                      <div className="text-sm font-bold">{rec.estimatedImpact}</div>
                    </div>

                    <div>
                      <div className="text-xs text-terra-silver mb-2">Implementation Steps:</div>
                      <ul className="space-y-1">
                        {rec.implementation.map((step, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Settings className="w-5 h-5" />
                Run Optimization
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Execute optimization strategies to improve system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Button
                  onClick={() => runOptimization('cache')}
                  disabled={loading}
                  className="bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 border border-blue-500/30 flex-col h-auto py-6"
                >
                  <Database className="w-8 h-8 mb-2" />
                  <span>Cache Optimization</span>
                  <span className="text-xs opacity-70 mt-1">Clear expired, prewarm</span>
                </Button>

                <Button
                  onClick={() => runOptimization('queries')}
                  disabled={loading}
                  className="bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 border border-purple-500/30 flex-col h-auto py-6"
                >
                  <Activity className="w-8 h-8 mb-2" />
                  <span>Query Optimization</span>
                  <span className="text-xs opacity-70 mt-1">Indexes, caching</span>
                </Button>

                <Button
                  onClick={() => runOptimization('memory')}
                  disabled={loading}
                  className="bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-500/30 flex-col h-auto py-6"
                >
                  <Cpu className="w-8 h-8 mb-2" />
                  <span>Memory Optimization</span>
                  <span className="text-xs opacity-70 mt-1">GC, pooling</span>
                </Button>

                <Button
                  onClick={() => runOptimization('full')}
                  disabled={loading}
                  className="bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 flex-col h-auto py-6"
                >
                  <Zap className="w-8 h-8 mb-2" />
                  <span>Full Optimization</span>
                  <span className="text-xs opacity-70 mt-1">All strategies</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceDashboard;
