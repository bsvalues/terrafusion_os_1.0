/**
 * AnalyticsDashboard - Comprehensive Code Analytics Visualization
 *
 * Production-ready analytics dashboard displaying code metrics, usage patterns,
 * performance insights, and trends with interactive visualizations.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 3
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// ==================== TYPES ====================

export interface CodeMetrics {
  totalCells: number;
  codeCells: number;
  markdownCells: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  codeComplexity: number;
  importStatements: number;
  functionDefinitions: number;
  classDefinitions: number;
  languages: string[];
  libraryUsage: Record<string, number>;
}

export interface UsageMetrics {
  userId: string;
  notebookId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  editsCount: number;
  completionsAccepted: number;
  errorsFixed: number;
  firstActivity: string;
  lastActivity: string;
  sessionDuration: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'performance' | 'quality' | 'security' | 'efficiency';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
  impact: number;
  confidence: number;
  cellIndex?: string;
  tags: string[];
}

export interface AnalyticsDashboardData {
  codeMetrics: CodeMetrics;
  usageMetrics: UsageMetrics;
  insights: PerformanceInsight[];
  topLibraries: Record<string, number>;
  complexityByCell: Record<string, number>;
  recentExecutions: ExecutionHistoryEntry[];
  errorFrequency: Record<string, number>;
  codeTrends: TrendDataPoint[];
}

export interface ExecutionHistoryEntry {
  timestamp: string;
  cellIndex: number;
  success: boolean;
  duration: number;
  errorType?: string;
}

export interface TrendDataPoint {
  timestamp: string;
  totalLines: number;
  functionCount: number;
  complexity: number;
  executionCount: number;
}

export interface AnalyticsDashboardProps {
  notebookId: string;
  userId: string;
  onRefresh?: () => void;
  refreshInterval?: number;
}

// ==================== COMPONENT ====================

export function AnalyticsDashboard({
  notebookId,
  userId,
  onRefresh,
  refreshInterval = 30000,
}: AnalyticsDashboardProps) {
  // ==================== STATE ====================

  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<PerformanceInsight | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [notebookId, userId, refreshInterval]);

  // ==================== HANDLERS ====================

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result: AnalyticsDashboardData = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
    onRefresh?.();
  };

  // ==================== RENDER HELPERS ====================

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getComplexityColor = (complexity: number): string => {
    if (complexity < 10) return 'text-green-400';
    if (complexity < 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getInsightIcon = (type: PerformanceInsight['type']): string => {
    switch (type) {
      case 'performance':
        return '🚀';
      case 'quality':
        return '✨';
      case 'security':
        return '🔒';
      case 'efficiency':
        return '⚡';
      default:
        return '💡';
    }
  };

  const getSeverityColor = (severity: PerformanceInsight['severity']): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'warning':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      case 'info':
        return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-900/10';
    }
  };

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string = 'text-terra-cyan') => (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
          </div>
          <span className="text-4xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderBarChart = (data: Record<string, number>, title: string, maxBars: number = 10) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxBars);

    const maxValue = Math.max(...sortedData.map(([, v]) => v));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedData.map(([label, value]) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-terra-cyan">{value}</span>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div
                    className="bg-terra-cyan h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {sortedData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ==================== RENDER ====================

  if (isLoading && !data) {
    return (
      <Card className="analytics-dashboard">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin text-4xl">⚙️</div>
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="analytics-dashboard space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive insights into your notebook's code quality and performance
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code">Code Metrics</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="insights">Insights ({data.insights.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard('Total Cells', data.codeMetrics.totalCells, '📝')}
            {renderMetricCard('Lines of Code', data.codeMetrics.codeLines, '💻')}
            {renderMetricCard(
              'Complexity',
              data.codeMetrics.codeComplexity.toFixed(1),
              '🧮',
              getComplexityColor(data.codeMetrics.codeComplexity)
            )}
            {renderMetricCard(
              'Success Rate',
              formatPercentage(data.usageMetrics.successRate),
              '✅',
              data.usageMetrics.successRate > 90 ? 'text-green-400' : 'text-yellow-400'
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderBarChart(data.topLibraries, '📚 Top Libraries Used')}
            {renderBarChart(data.complexityByCell, '🧮 Complexity by Cell', 5)}
          </div>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🎯 Top Performance Insights</CardTitle>
              <CardDescription>Most impactful improvements for your notebook</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.insights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border cursor-pointer ${getSeverityColor(insight.severity)}`}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.impact}% impact
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {data.insights.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block">🎉</span>
                    <p className="text-sm text-green-400 font-semibold">Excellent!</p>
                    <p className="text-xs text-muted-foreground">No major issues detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Metrics Tab */}
        <TabsContent value="code" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cell Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Code Cells</span>
                    <span className="font-semibold text-blue-400">{data.codeMetrics.codeCells}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Markdown Cells</span>
                    <span className="font-semibold text-purple-400">{data.codeMetrics.markdownCells}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold text-terra-cyan">{data.codeMetrics.totalCells}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Line Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Code Lines</span>
                    <span className="font-semibold text-green-400">{data.codeMetrics.codeLines}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Comment Lines</span>
                    <span className="font-semibold text-gray-400">{data.codeMetrics.commentLines}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Blank Lines</span>
                    <span className="font-semibold text-gray-500">{data.codeMetrics.blankLines}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Code Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Functions</span>
                    <span className="font-semibold text-yellow-400">{data.codeMetrics.functionDefinitions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Classes</span>
                    <span className="font-semibold text-cyan-400">{data.codeMetrics.classDefinitions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Imports</span>
                    <span className="font-semibold text-purple-400">{data.codeMetrics.importStatements}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderBarChart(data.topLibraries, '📚 Library Usage')}
            {renderBarChart(data.complexityByCell, '🧮 Cyclomatic Complexity by Cell')}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard('Total Executions', data.usageMetrics.totalExecutions, '▶️')}
            {renderMetricCard('Successful', data.usageMetrics.successfulExecutions, '✅', 'text-green-400')}
            {renderMetricCard('Failed', data.usageMetrics.failedExecutions, '❌', 'text-red-400')}
            {renderMetricCard('Edits', data.usageMetrics.editsCount, '✏️')}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⏱️ Execution Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Average</span>
                      <span className="font-semibold text-terra-cyan">
                        {formatDuration(data.usageMetrics.averageExecutionTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-semibold text-blue-400">
                        {formatDuration(data.usageMetrics.totalExecutionTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Session Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Session Duration</span>
                    <p className="font-semibold text-terra-cyan">
                      {formatDuration(data.usageMetrics.sessionDuration)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground">AI Completions Accepted</span>
                    <p className="font-semibold text-green-400">{data.usageMetrics.completionsAccepted}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Errors Fixed</span>
                    <p className="font-semibold text-yellow-400">{data.usageMetrics.errorsFixed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {data.errorFrequency && Object.keys(data.errorFrequency).length > 0 && (
            renderBarChart(data.errorFrequency, '❌ Most Common Errors')
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Performance Insights</h3>
              <p className="text-sm text-muted-foreground">
                Actionable recommendations to improve your code
              </p>
            </div>
            <Badge variant="secondary">{data.insights.length} insights</Badge>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {data.insights.map((insight) => (
                <Card
                  key={insight.id}
                  className={`cursor-pointer transition-all ${
                    selectedInsight?.id === insight.id ? 'ring-2 ring-terra-cyan' : ''
                  }`}
                  onClick={() =>
                    setSelectedInsight(selectedInsight?.id === insight.id ? null : insight)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getInsightIcon(insight.type)}</span>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{insight.title}</h4>
                            {insight.cellIndex && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Cell {insight.cellIndex}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(insight.severity)}>
                              {insight.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.impact}% impact
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.confidence}% confident
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">{insight.description}</p>

                        {selectedInsight?.id === insight.id && (
                          <div className="pt-3 border-t border-border space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-green-400 mb-1">
                                💡 Recommendation:
                              </p>
                              <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                            </div>

                            {insight.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {insight.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {data.insights.length === 0 && (
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🎉</span>
                      <h3 className="text-lg font-semibold text-green-400 mb-2">
                        Excellent Code Quality!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No performance insights or recommendations at this time.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
