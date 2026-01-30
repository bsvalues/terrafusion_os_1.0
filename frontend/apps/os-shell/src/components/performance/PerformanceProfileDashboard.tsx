/**
 * PerformanceProfileDashboard - Performance Analysis & Bottleneck Detection
 *
 * Production-ready dashboard for code performance profiling with
 * interactive charts, bottleneck visualization, and optimization recommendations.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 8 Day 1
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { Alert } from '../ui/alert';
import { Separator } from '../ui/separator';

// ==================== TYPES ====================

export interface ExecutionProfile {
  functionName: string;
  lineStart: number;
  lineEnd: number;
  executionTimeMs: number;
  memoryUsageMB: number;
  callCount: number;
  percentageOfTotal: number;
  isBottleneck: boolean;
  calledBy: string[];
  calls: string[];
}

export interface BottleneckAnalysis {
  location: string;
  type: 'cpu' | 'memory' | 'io' | 'network';
  description: string;
  impactScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  code: string;
  lineNumber: number;
}

export interface PerformanceMetrics {
  totalExecutionTimeMs: number;
  peakMemoryUsageMB: number;
  averageMemoryUsageMB: number;
  totalFunctionCalls: number;
  linesExecuted: number;
  cpuUtilization: number;
  timeBreakdown: Record<string, number>;
}

export interface OptimizationRecommendation {
  category: string;
  title: string;
  description: string;
  currentApproach: string;
  suggestedApproach: string;
  expectedImprovement: number;
  priority: number;
  complexity: 'easy' | 'medium' | 'hard';
}

export interface ProfilingResult {
  functionProfiles: ExecutionProfile[];
  bottlenecks: BottleneckAnalysis[];
  metrics: PerformanceMetrics;
  recommendations: OptimizationRecommendation[];
  lineTimings: Record<number, number>;
  profilingDuration: number;
}

export interface PerformanceProfileDashboardProps {
  code: string;
  language?: string;
  onOptimize?: (recommendation: OptimizationRecommendation) => void;
  autoProfile?: boolean;
}

// ==================== COMPONENT ====================

export function PerformanceProfileDashboard({
  code,
  language = 'python',
  onOptimize,
  autoProfile = false,
}: PerformanceProfileDashboardProps) {
  // ==================== STATE ====================

  const [result, setResult] = useState<ProfilingResult | null>(null);
  const [isProfiling, setIsProfiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ExecutionProfile | null>(null);
  const [selectedBottleneck, setSelectedBottleneck] = useState<BottleneckAnalysis | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoProfile && code.trim().length > 0) {
      profileCode();
    }
  }, [code, autoProfile]);

  // ==================== HANDLERS ====================

  const profileCode = async () => {
    try {
      setIsProfiling(true);
      setError(null);

      const response = await fetch('/api/ai/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          enableMemoryProfiling: true,
          enableBottleneckDetection: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to profile code');
      }

      const data: ProfilingResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Profiling error:', err);
      setError('Failed to profile code');
    } finally {
      setIsProfiling(false);
    }
  };

  // ==================== RENDER HELPERS ====================

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'high':
        return 'text-orange-400 border-orange-500/30 bg-orange-900/10';
      case 'medium':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      case 'low':
        return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-900/10';
    }
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      cpu: '💻',
      memory: '🧠',
      io: '💾',
      network: '🌐',
    };
    return icons[type] || '⚡';
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (ms: number): string => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms.toFixed(2)}ms`;
  };

  const formatMemory = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)}GB`;
    }
    return `${mb.toFixed(2)}MB`;
  };

  // ==================== RENDER ====================

  if (!code && !result) {
    return (
      <Card className="performance-profile-dashboard border-terra-cyan/30">
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <span className="text-4xl">⚡</span>
            <p className="text-sm text-muted-foreground">Run code to see performance profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="performance-profile-dashboard border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>⚡</span>
              <span>Performance Profile</span>
              {isProfiling && <span className="animate-pulse text-xs">Profiling...</span>}
            </CardTitle>
            {result && (
              <CardDescription className="mt-1">
                {result.functionProfiles.length} functions • {result.bottlenecks.length} bottlenecks •{' '}
                {result.recommendations.length} recommendations
              </CardDescription>
            )}
          </div>

          <Button size="sm" onClick={profileCode} disabled={isProfiling}>
            {result ? 'Re-profile' : 'Profile Code'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-500/30 bg-red-900/10">
            <p className="text-sm text-red-400">{error}</p>
          </Alert>
        )}

        {result && (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="functions">Functions ({result.functionProfiles.length})</TabsTrigger>
              <TabsTrigger value="bottlenecks">Bottlenecks ({result.bottlenecks.length})</TabsTrigger>
              <TabsTrigger value="recommendations">Tips ({result.recommendations.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Total Time</p>
                    <p className="text-2xl font-bold mt-1 text-terra-cyan">
                      {formatTime(result.metrics.totalExecutionTimeMs)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Peak Memory</p>
                    <p className="text-2xl font-bold mt-1 text-purple-400">
                      {formatMemory(result.metrics.peakMemoryUsageMB)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground">CPU Usage</p>
                    <p className="text-2xl font-bold mt-1 text-orange-400">
                      {(result.metrics.cpuUtilization * 100).toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Time Breakdown */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Time Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(result.metrics.timeBreakdown).map(([category, percentage]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="capitalize">{category}</span>
                        <span className="font-semibold">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Bottlenecks */}
              {result.bottlenecks.length > 0 && (
                <Card className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Top Bottlenecks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.bottlenecks.slice(0, 3).map((bottleneck, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-background rounded border border-border"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getTypeIcon(bottleneck.type)}</span>
                          <div>
                            <p className="text-xs font-semibold">{bottleneck.location}</p>
                            <p className="text-xs text-muted-foreground">{bottleneck.description}</p>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(bottleneck.severity)}>{bottleneck.severity}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Function Calls</p>
                    <p className="text-xl font-bold mt-1">{result.metrics.totalFunctionCalls.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Lines Executed</p>
                    <p className="text-xl font-bold mt-1">{result.metrics.linesExecuted.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Functions Tab */}
            <TabsContent value="functions" className="space-y-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {result.functionProfiles
                    .sort((a, b) => b.executionTimeMs - a.executionTimeMs)
                    .map((profile, idx) => (
                      <Card
                        key={idx}
                        className={`cursor-pointer transition-all ${
                          selectedProfile?.functionName === profile.functionName ? 'ring-2 ring-terra-cyan' : ''
                        } ${profile.isBottleneck ? 'border-red-500/30' : ''}`}
                        onClick={() =>
                          setSelectedProfile(
                            selectedProfile?.functionName === profile.functionName ? null : profile
                          )
                        }
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-semibold font-mono">{profile.functionName}</p>
                                  {profile.isBottleneck && (
                                    <Badge variant="outline" className="text-xs text-red-400">
                                      Bottleneck
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Lines {profile.lineStart}-{profile.lineEnd} • {profile.callCount} calls
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-bold text-terra-cyan">{formatTime(profile.executionTimeMs)}</p>
                                <p className="text-xs text-muted-foreground">{profile.percentageOfTotal.toFixed(1)}%</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <Progress value={profile.percentageOfTotal} className="h-1.5" />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatMemory(profile.memoryUsageMB)}
                              </span>
                            </div>

                            {selectedProfile?.functionName === profile.functionName && (
                              <div className="pt-3 border-t border-border space-y-2">
                                {profile.calledBy.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-blue-400 mb-1">Called By:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {profile.calledBy.map((caller, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {caller}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {profile.calls.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-green-400 mb-1">Calls:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {profile.calls.map((callee, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {callee}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Bottlenecks Tab */}
            <TabsContent value="bottlenecks" className="space-y-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {result.bottlenecks.map((bottleneck, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all ${
                        selectedBottleneck?.lineNumber === bottleneck.lineNumber ? 'ring-2 ring-terra-cyan' : ''
                      }`}
                      onClick={() =>
                        setSelectedBottleneck(
                          selectedBottleneck?.lineNumber === bottleneck.lineNumber ? null : bottleneck
                        )
                      }
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <span className="text-3xl">{getTypeIcon(bottleneck.type)}</span>

                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-semibold">{bottleneck.location}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{bottleneck.description}</p>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                  <Badge className={getSeverityColor(bottleneck.severity)}>{bottleneck.severity}</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {bottleneck.impactScore.toFixed(0)}% impact
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-2">
                                <pre className="text-xs bg-background p-2 rounded border border-border font-mono overflow-x-auto">
                                  {bottleneck.code}
                                </pre>
                              </div>

                              {selectedBottleneck?.lineNumber === bottleneck.lineNumber &&
                                bottleneck.recommendations.length > 0 && (
                                  <div className="pt-3 border-t border-border">
                                    <p className="text-xs font-semibold text-green-400 mb-2">
                                      💡 Recommendations:
                                    </p>
                                    <ul className="space-y-1">
                                      {bottleneck.recommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex items-start">
                                          <span className="mr-2">•</span>
                                          <span>{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.bottlenecks.length === 0 && (
                    <Alert className="border-green-500/30 bg-green-900/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-semibold text-sm text-green-400">No Bottlenecks Detected</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Code appears to be well-optimized
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-sm font-semibold">{rec.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Priority {rec.priority}
                                </Badge>
                                <Badge className={getComplexityColor(rec.complexity)}>{rec.complexity}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{rec.description}</p>
                            </div>

                            <Badge className="text-xs text-green-400 ml-4">
                              +{rec.expectedImprovement}% faster
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-red-400 mb-1">❌ Current:</p>
                              <p className="text-xs text-muted-foreground">{rec.currentApproach}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-400 mb-1">✅ Suggested:</p>
                              <p className="text-xs text-muted-foreground">{rec.suggestedApproach}</p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOptimize?.(rec)}
                            disabled={!onOptimize}
                            className="w-full"
                          >
                            Apply Optimization
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-sm">Execution Timeline (Line by Line)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-1">
                      {Object.entries(result.lineTimings)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 20)
                        .map(([line, time]) => (
                          <div key={line} className="flex items-center space-x-3 py-1">
                            <span className="text-xs font-mono text-muted-foreground w-12">
                              Line {line}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Progress
                                  value={(time / Math.max(...Object.values(result.lineTimings))) * 100}
                                  className="h-1.5 flex-1"
                                />
                                <span className="text-xs font-semibold text-terra-cyan w-16 text-right">
                                  {formatTime(time)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {result && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Profiled in <span className="text-terra-cyan font-semibold">{result.profilingDuration.toFixed(0)}ms</span>
              </span>
              <span className="text-green-400">⚡ AI-Powered Performance Analysis</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceProfileDashboard;
