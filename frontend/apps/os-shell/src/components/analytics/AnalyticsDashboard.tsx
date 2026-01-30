/**
 * AnalyticsDashboard - Real-time Analytics & Reporting Dashboard
 *
 * Comprehensive analytics interface with real-time data aggregation, trend analysis,
 * custom reporting, predictive insights, and visual analytics.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 2 Day 2
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Server,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Cpu,
  RefreshCw,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface AnalyticsSummary {
  timeRange: string;
  generatedAt: string;
  startTime: string;
  endTime: string;
  userAnalytics: UserAnalytics;
  systemAnalytics: SystemAnalytics;
  countyAnalytics: CountyAnalytics;
  aiAnalytics: AIAnalytics;
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  totalSessions: number;
  bounceRate: number;
  conversionRate: number;
}

interface SystemAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  peakResponseTime: number;
  errorRate: number;
  uptime: number;
}

interface CountyAnalytics {
  totalCounties: number;
  activeCounties: number;
  totalProperties: number;
  propertiesAssessed: number;
  averageProcessingTime: number;
  complianceRate: number;
}

interface AIAnalytics {
  totalAgents: number;
  activeAgents: number;
  tasksCompleted: number;
  averageTaskTime: number;
  successRate: number;
  totalInferences: number;
}

interface TrendData {
  timestamp: string;
  value: number;
  label: string;
}

interface TrendAnalysis {
  metricName: string;
  timeRange: string;
  analysisDate: string;
  dataPoints: TrendData[];
  trendDirection: string;
  trendStrength: number;
  average: number;
  minimum: number;
  maximum: number;
  standardDeviation: number;
  forecast: TrendData[];
}

interface DataAggregation {
  groupName: string;
  value: number;
  percentage: number;
  count: number;
  trend: string;
}

interface Prediction {
  period: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface AnomalyDetection {
  timestamp: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: string;
  description: string;
}

interface PredictiveInsights {
  metricName: string;
  generatedAt: string;
  confidenceLevel: number;
  predictions: Prediction[];
  anomaliesDetected: AnomalyDetection[];
  recommendations: string[];
}

interface ReportSection {
  sectionName: string;
  content: string;
  metrics: Record<string, any>;
  recommendations: string[];
}

interface CustomReport {
  reportId: string;
  reportName: string;
  reportType: string;
  generatedAt: string;
  timeRange: string;
  sections: ReportSection[];
  summary: string;
}

interface UserActivityReport {
  timeRange: string;
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  peakHour: string;
  topUsers: Array<{ userId: string; sessions: number; duration: number }>;
  hourlyActivity: Array<{ hour: number; sessions: number }>;
  dailyActivity: Array<{ date: string; sessions: number }>;
}

interface SystemUsageReport {
  timeRange: string;
  totalRequests: number;
  uniqueEndpoints: number;
  topEndpoints: Array<{ endpoint: string; requests: number; avgResponseTime: number }>;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  errorBreakdown: Array<{ errorType: string; count: number; percentage: number }>;
}

// ==================== MAIN COMPONENT ====================

export function AnalyticsDashboard() {
  // State management
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [aggregations, setAggregations] = useState<DataAggregation[]>([]);
  const [insights, setInsights] = useState<PredictiveInsights | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivityReport | null>(null);
  const [systemUsage, setSystemUsage] = useState<SystemUsageReport | null>(null);
  const [customReport, setCustomReport] = useState<CustomReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load analytics summary
      const summaryResponse = await fetch(`/api/analytics/summary?timeRange=${selectedTimeRange}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      // Load trend analysis
      const trendsResponse = await fetch(`/api/analytics/trends/${selectedMetric}?timeRange=${selectedTimeRange}`);
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setTrends(trendsData);
      }

      // Load aggregations
      const aggregationsResponse = await fetch(`/api/analytics/aggregations?groupBy=county&timeRange=${selectedTimeRange}`);
      if (aggregationsResponse.ok) {
        const aggregationsData = await aggregationsResponse.json();
        setAggregations(aggregationsData);
      }

      // Load predictive insights
      const insightsResponse = await fetch(`/api/analytics/insights/${selectedMetric}`);
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData);
      }

      // Load user activity
      const userActivityResponse = await fetch(`/api/analytics/users/activity?timeRange=${selectedTimeRange}`);
      if (userActivityResponse.ok) {
        const userActivityData = await userActivityResponse.json();
        setUserActivity(userActivityData);
      }

      // Load system usage
      const systemUsageResponse = await fetch(`/api/analytics/system/usage?timeRange=${selectedTimeRange}`);
      if (systemUsageResponse.ok) {
        const systemUsageData = await systemUsageResponse.json();
        setSystemUsage(systemUsageData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, selectedMetric]);

  // Generate custom report
  const generateCustomReport = async (reportType: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName: `${reportType} Report`,
          reportType: reportType,
          timeRange: selectedTimeRange,
          metrics: ['all'],
          format: 'json'
        })
      });

      if (response.ok) {
        const reportData = await response.json();
        setCustomReport(reportData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadAnalytics();

    if (autoRefresh) {
      const interval = setInterval(loadAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadAnalytics]);

  // Helper functions
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes.toFixed(0)}m`;
    return `${(minutes / 60).toFixed(1)}h`;
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-900/20 border-red-500/30 text-red-400';
      case 'high':
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-900/20 border-gray-500/30 text-gray-400';
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
          <h1 className="text-3xl font-bold text-terra-cyan">Analytics Dashboard</h1>
          <p className="text-terra-silver mt-1">Real-time analytics and reporting engine</p>
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
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-terra-dark border border-terra-cyan/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {summary && (
            <>
              {/* User Analytics */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Users className="w-5 h-5" />
                    User Analytics
                  </CardTitle>
                  <CardDescription className="text-terra-silver">
                    User engagement and activity metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Total Users</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(summary.userAnalytics.totalUsers)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Active Users</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatNumber(summary.userAnalytics.activeUsers)}
                      </div>
                      <div className="text-xs text-terra-silver mt-1">
                        {formatPercent((summary.userAnalytics.activeUsers / summary.userAnalytics.totalUsers) * 100)} active
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">New Users</div>
                      <div className="text-2xl font-bold text-blue-400 mt-1">
                        {formatNumber(summary.userAnalytics.newUsers)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Avg Session</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatDuration(summary.userAnalytics.averageSessionDuration)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Total Sessions</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(summary.userAnalytics.totalSessions)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Bounce Rate</div>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">
                        {formatPercent(summary.userAnalytics.bounceRate)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Conversion Rate</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatPercent(summary.userAnalytics.conversionRate)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Returning Users</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(summary.userAnalytics.returningUsers)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Analytics */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Server className="w-5 h-5" />
                    System Analytics
                  </CardTitle>
                  <CardDescription className="text-terra-silver">
                    System performance and reliability metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Total Requests</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(summary.systemAnalytics.totalRequests)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Success Rate</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatPercent((summary.systemAnalytics.successfulRequests / summary.systemAnalytics.totalRequests) * 100)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Avg Response</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {summary.systemAnalytics.averageResponseTime.toFixed(1)}ms
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Uptime</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatPercent(summary.systemAnalytics.uptime)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Failed Requests</div>
                      <div className="text-2xl font-bold text-red-400 mt-1">
                        {formatNumber(summary.systemAnalytics.failedRequests)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Error Rate</div>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">
                        {formatPercent(summary.systemAnalytics.errorRate)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Peak Response</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {summary.systemAnalytics.peakResponseTime.toFixed(1)}ms
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Successful</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatNumber(summary.systemAnalytics.successfulRequests)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* County Analytics */}
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <Database className="w-5 h-5" />
                      County Analytics
                    </CardTitle>
                    <CardDescription className="text-terra-silver">
                      County property and compliance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Total Counties</span>
                        <span className="text-terra-cyan font-bold">{summary.countyAnalytics.totalCounties}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Active Counties</span>
                        <span className="text-green-400 font-bold">{summary.countyAnalytics.activeCounties}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Total Properties</span>
                        <span className="text-terra-cyan font-bold">{formatNumber(summary.countyAnalytics.totalProperties)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Properties Assessed</span>
                        <span className="text-green-400 font-bold">{formatNumber(summary.countyAnalytics.propertiesAssessed)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Avg Processing Time</span>
                        <span className="text-terra-cyan font-bold">{summary.countyAnalytics.averageProcessingTime.toFixed(1)}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Compliance Rate</span>
                        <span className="text-green-400 font-bold">{formatPercent(summary.countyAnalytics.complianceRate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analytics */}
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <Cpu className="w-5 h-5" />
                      AI Analytics
                    </CardTitle>
                    <CardDescription className="text-terra-silver">
                      AI swarm performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Total Agents</span>
                        <span className="text-terra-cyan font-bold">{summary.aiAnalytics.totalAgents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Active Agents</span>
                        <span className="text-green-400 font-bold">{summary.aiAnalytics.activeAgents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Tasks Completed</span>
                        <span className="text-terra-cyan font-bold">{formatNumber(summary.aiAnalytics.tasksCompleted)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Avg Task Time</span>
                        <span className="text-terra-cyan font-bold">{summary.aiAnalytics.averageTaskTime.toFixed(1)}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Success Rate</span>
                        <span className="text-green-400 font-bold">{formatPercent(summary.aiAnalytics.successRate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-terra-silver">Total Inferences</span>
                        <span className="text-terra-cyan font-bold">{formatNumber(summary.aiAnalytics.totalInferences)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 bg-terra-dark border border-terra-cyan/30 rounded-lg text-terra-cyan"
            >
              <option value="users">Users</option>
              <option value="requests">Requests</option>
              <option value="performance">Performance</option>
              <option value="errors">Errors</option>
            </select>
          </div>

          {trends.map((trend, index) => (
            <Card key={index} className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-terra-cyan">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    {trend.metricName} Trend Analysis
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trend.trendDirection)}
                    <Badge variant="outline" className="text-terra-cyan">
                      Strength: {formatPercent(trend.trendStrength * 100)}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-terra-silver">
                  Analysis for {trend.timeRange} period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Average</div>
                    <div className="text-xl font-bold text-terra-cyan">{trend.average.toFixed(0)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Minimum</div>
                    <div className="text-xl font-bold text-blue-400">{trend.minimum.toFixed(0)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Maximum</div>
                    <div className="text-xl font-bold text-green-400">{trend.maximum.toFixed(0)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Std Deviation</div>
                    <div className="text-xl font-bold text-yellow-400">{trend.standardDeviation.toFixed(1)}</div>
                  </div>
                </div>

                {/* Data Points Visualization (simplified) */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-terra-silver">Recent Data Points</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {trend.dataPoints.slice(-8).map((point, i) => (
                      <div key={i} className="p-2 bg-terra-midnight rounded border border-terra-cyan/20">
                        <div className="text-xs text-terra-silver">{point.label}</div>
                        <div className="text-sm font-bold text-terra-cyan">{point.value.toFixed(0)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forecast */}
                {trend.forecast && trend.forecast.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-terra-silver">Forecast</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {trend.forecast.map((point, i) => (
                        <div key={i} className="p-2 bg-blue-900/20 rounded border border-blue-500/30">
                          <div className="text-xs text-blue-400">{point.label}</div>
                          <div className="text-sm font-bold text-blue-300">{point.value.toFixed(0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Data Aggregations */}
          {aggregations.length > 0 && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-terra-cyan">
                  <PieChart className="w-5 h-5" />
                  Data Aggregations
                </CardTitle>
                <CardDescription className="text-terra-silver">
                  Data grouped by county
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aggregations.map((agg, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-terra-cyan font-medium">{agg.groupName}</span>
                          {getTrendIcon(agg.trend)}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-terra-silver text-sm">Count: {formatNumber(agg.count)}</span>
                          <span className="text-terra-cyan font-bold">{formatNumber(agg.value)}</span>
                        </div>
                      </div>
                      <Progress value={agg.percentage} className="h-2" />
                      <div className="text-xs text-terra-silver">{formatPercent(agg.percentage)} of total</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {insights && (
            <>
              {/* Predictions */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-terra-cyan">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Predictive Insights
                    </div>
                    <Badge variant="outline" className="text-green-400">
                      Confidence: {formatPercent(insights.confidenceLevel * 100)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-terra-silver">
                    Predictions for {insights.metricName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.predictions.map((pred, index) => (
                      <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-terra-cyan">{pred.period}</span>
                          <Badge variant="outline" className="text-blue-400">
                            {formatPercent(pred.confidence * 100)} confidence
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-terra-silver">Lower Bound</div>
                            <div className="text-sm font-bold text-yellow-400">{formatNumber(pred.lowerBound)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Predicted</div>
                            <div className="text-lg font-bold text-terra-cyan">{formatNumber(pred.predictedValue)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Upper Bound</div>
                            <div className="text-sm font-bold text-green-400">{formatNumber(pred.upperBound)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Anomalies */}
              {insights.anomaliesDetected && insights.anomaliesDetected.length > 0 && (
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <AlertTriangle className="w-5 h-5" />
                      Anomalies Detected
                    </CardTitle>
                    <CardDescription className="text-terra-silver">
                      Unusual patterns and deviations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.anomaliesDetected.map((anomaly, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{anomaly.description}</span>
                            <Badge variant="outline" className={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-xs opacity-70">Actual Value</div>
                              <div className="font-bold">{formatNumber(anomaly.value)}</div>
                            </div>
                            <div>
                              <div className="text-xs opacity-70">Expected Value</div>
                              <div className="font-bold">{formatNumber(anomaly.expectedValue)}</div>
                            </div>
                            <div>
                              <div className="text-xs opacity-70">Deviation</div>
                              <div className="font-bold">{formatPercent(anomaly.deviation)}</div>
                            </div>
                          </div>
                          <div className="text-xs opacity-70 mt-2">
                            {new Date(anomaly.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <CheckCircle className="w-5 h-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {insights.recommendations.map((rec, index) => (
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

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Button
              onClick={() => generateCustomReport('executive')}
              disabled={loading}
              className="bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan border border-terra-cyan/30"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Executive Report
            </Button>
            <Button
              onClick={() => generateCustomReport('operational')}
              disabled={loading}
              className="bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan border border-terra-cyan/30"
            >
              <Activity className="w-4 h-4 mr-2" />
              Operational Report
            </Button>
            <Button
              onClick={() => generateCustomReport('compliance')}
              disabled={loading}
              className="bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan border border-terra-cyan/30"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Compliance Report
            </Button>
            <Button
              onClick={() => generateCustomReport('performance')}
              disabled={loading}
              className="bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan border border-terra-cyan/30"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance Report
            </Button>
          </div>

          {customReport && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-terra-cyan">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    {customReport.reportName}
                  </div>
                  <Badge variant="outline" className="text-terra-cyan">
                    {customReport.reportType.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-terra-silver">
                  Generated: {new Date(customReport.generatedAt).toLocaleString()} | Time Range: {customReport.timeRange}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Report Summary */}
                  <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <h3 className="text-sm font-medium text-terra-silver mb-2">Summary</h3>
                    <p className="text-terra-cyan">{customReport.summary}</p>
                  </div>

                  {/* Report Sections */}
                  {customReport.sections.map((section, index) => (
                    <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <h3 className="text-lg font-bold text-terra-cyan mb-3">{section.sectionName}</h3>
                      <p className="text-terra-silver mb-4">{section.content}</p>

                      {/* Section Metrics */}
                      {section.metrics && Object.keys(section.metrics).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {Object.entries(section.metrics).map(([key, value]) => (
                            <div key={key} className="p-2 bg-terra-dark rounded">
                              <div className="text-xs text-terra-silver">{key}</div>
                              <div className="text-sm font-bold text-terra-cyan">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section Recommendations */}
                      {section.recommendations && section.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-terra-silver mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {section.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                                <span className="text-sm text-terra-silver">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* User Activity */}
          {userActivity && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-terra-cyan">
                  <Users className="w-5 h-5" />
                  User Activity Report
                </CardTitle>
                <CardDescription className="text-terra-silver">
                  Time Range: {userActivity.timeRange}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Total Sessions</div>
                    <div className="text-xl font-bold text-terra-cyan">{formatNumber(userActivity.totalSessions)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Unique Users</div>
                    <div className="text-xl font-bold text-green-400">{formatNumber(userActivity.uniqueUsers)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Avg Duration</div>
                    <div className="text-xl font-bold text-terra-cyan">{formatDuration(userActivity.averageSessionDuration)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Peak Hour</div>
                    <div className="text-xl font-bold text-yellow-400">{userActivity.peakHour}</div>
                  </div>
                </div>

                {/* Top Users */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-terra-silver">Top Users</h4>
                  <div className="space-y-2">
                    {userActivity.topUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-terra-midnight rounded-lg">
                        <span className="text-terra-cyan">{user.userId}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-terra-silver">{user.sessions} sessions</span>
                          <span className="text-sm text-terra-cyan">{formatDuration(user.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Usage */}
          {systemUsage && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-terra-cyan">
                  <Server className="w-5 h-5" />
                  System Usage Report
                </CardTitle>
                <CardDescription className="text-terra-silver">
                  Time Range: {systemUsage.timeRange}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Total Requests</div>
                    <div className="text-xl font-bold text-terra-cyan">{formatNumber(systemUsage.totalRequests)}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Unique Endpoints</div>
                    <div className="text-xl font-bold text-green-400">{systemUsage.uniqueEndpoints}</div>
                  </div>
                  <div className="p-3 bg-terra-midnight rounded-lg">
                    <div className="text-sm text-terra-silver">Resource Usage</div>
                    <div className="text-xl font-bold text-terra-cyan">
                      CPU: {formatPercent(systemUsage.resourceUsage.cpu)}
                    </div>
                  </div>
                </div>

                {/* Top Endpoints */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-sm font-medium text-terra-silver">Top Endpoints</h4>
                  <div className="space-y-2">
                    {systemUsage.topEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-terra-midnight rounded-lg">
                        <span className="text-terra-cyan text-sm font-mono">{endpoint.endpoint}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-terra-silver">{formatNumber(endpoint.requests)} requests</span>
                          <span className="text-sm text-yellow-400">{endpoint.avgResponseTime.toFixed(1)}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Breakdown */}
                {systemUsage.errorBreakdown && systemUsage.errorBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-terra-silver">Error Breakdown</h4>
                    <div className="space-y-2">
                      {systemUsage.errorBreakdown.map((error, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-red-400">{error.errorType}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-terra-silver">{error.count}</span>
                              <span className="text-sm text-yellow-400">{formatPercent(error.percentage)}</span>
                            </div>
                          </div>
                          <Progress value={error.percentage} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
