/**
 * LiveAnalyticsChart - Real-Time Analytics Streaming Component
 *
 * Production-ready component for live data visualization with streaming updates,
 * progress tracking, and statistical overlays.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 4
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAnalyticsHub } from '../../hooks/useAnalyticsHub';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// ==================== TYPES ====================

export interface LiveAnalyticsChartProps {
  analysisId?: number;
  streamId?: string;
  chartType?: 'line' | 'bar' | 'area';
  title?: string;
  description?: string;
  maxDataPoints?: number;
  refreshInterval?: number;
  showProgress?: boolean;
  showStats?: boolean;
}

interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  [key: string]: any;
}

// ==================== COMPONENT ====================

export function LiveAnalyticsChart({
  analysisId,
  streamId,
  chartType = 'line',
  title = 'Live Analytics',
  description,
  maxDataPoints = 100,
  refreshInterval = 1000,
  showProgress = true,
  showStats = true,
}: LiveAnalyticsChartProps) {
  // ==================== HOOKS ====================

  const { state, actions } = useAnalyticsHub(true);

  // ==================== STATE ====================

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar' | 'area'>(chartType);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // ==================== EFFECTS ====================

  // Subscribe to analysis on mount
  useEffect(() => {
    if (analysisId) {
      actions.subscribeToAnalysis(analysisId).catch(console.error);
      return () => {
        actions.unsubscribeFromAnalysis(analysisId).catch(console.error);
      };
    }
  }, [analysisId, actions]);

  // Subscribe to data stream on mount
  useEffect(() => {
    if (streamId) {
      actions.subscribeToDataStream(streamId).catch(console.error);
      return () => {
        actions.unsubscribeFromDataStream(streamId).catch(console.error);
      };
    }
  }, [streamId, actions]);

  // Update chart data from data stream
  useEffect(() => {
    if (streamId && state.dataStreams.has(streamId)) {
      const streamData = state.dataStreams.get(streamId) || [];

      const formattedData: ChartDataPoint[] = streamData.map((point) => ({
        timestamp: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value,
        ...point.metadata,
      }));

      // Limit data points for performance
      const limitedData = formattedData.slice(-maxDataPoints);

      setChartData(limitedData);
    }
  }, [state.dataStreams, streamId, maxDataPoints]);

  // ==================== COMPUTED VALUES ====================

  const analysisProgress = useMemo(() => {
    if (!analysisId) return null;
    return state.activeAnalyses.get(analysisId);
  }, [state.activeAnalyses, analysisId]);

  const statistics = useMemo(() => {
    if (!analysisId) return [];
    return state.statistics.filter((stat) => stat.analysisId === analysisId);
  }, [state.statistics, analysisId]);

  const chartStats = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 0, avg: 0, latest: 0 };
    }

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];

    return { min, max, avg, latest };
  }, [chartData]);

  // ==================== RENDER HELPERS ====================

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Waiting for data...</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--tf-transcend-cyan)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="var(--tf-transcend-cyan)" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--tf-transcend-cyan)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--tf-transcend-cyan)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--tf-transcend-cyan)"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  // ==================== RENDER ====================

  if (state.connecting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Spinner className="mr-2" />
          <span>Connecting to analytics stream...</span>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <span className="font-semibold">Connection Error</span>
        <p>{state.error}</p>
      </Alert>
    );
  }

  return (
    <div className="live-analytics-chart space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <Badge variant={state.connected ? 'success' : 'secondary'}>
                {state.connected ? '🟢 Live' : '🔴 Offline'}
              </Badge>

              {/* Data Points */}
              <Badge variant="outline">{chartData.length} points</Badge>

              {/* Auto-Scroll Toggle */}
              <Button
                size="sm"
                variant={autoScroll ? 'default' : 'outline'}
                onClick={() => setAutoScroll(!autoScroll)}
              >
                {autoScroll ? '🔄 Auto' : '⏸️ Pause'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Progress */}
      {showProgress && analysisProgress && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {analysisProgress.currentStep}
                </span>
                <Badge
                  variant={
                    analysisProgress.status === 'completed'
                      ? 'success'
                      : analysisProgress.status === 'failed'
                        ? 'destructive'
                        : 'default'
                  }
                >
                  {analysisProgress.status}
                </Badge>
              </div>
              <Progress value={analysisProgress.progress * 100} />
              <p className="text-xs text-muted-foreground">
                {(analysisProgress.progress * 100).toFixed(1)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <Tabs value={selectedChart} onValueChange={(v) => setSelectedChart(v as any)}>
            <TabsList>
              <TabsTrigger value="line">📈 Line</TabsTrigger>
              <TabsTrigger value="bar">📊 Bar</TabsTrigger>
              <TabsTrigger value="area">🌊 Area</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>

      {/* Statistics */}
      {showStats && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Latest</p>
                <p className="text-lg font-semibold">{chartStats.latest.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-lg font-semibold">{chartStats.avg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-lg font-semibold">{chartStats.min.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-lg font-semibold">{chartStats.max.toFixed(2)}</p>
              </div>
            </div>

            {/* Statistical Results */}
            {statistics.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Analysis Results:</p>
                {statistics.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stat.statistic}:</span>
                    <span className="font-mono">
                      {stat.value.toFixed(4)}
                      {stat.pValue && ` (p=${stat.pValue.toFixed(4)})`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LiveAnalyticsChart;
