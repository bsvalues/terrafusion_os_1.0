/**
 * AIOrchestrationDashboard - Advanced AI Swarm Orchestration Interface
 *
 * Comprehensive AI orchestration dashboard with real-time agent monitoring,
 * task distribution, load balancing, swarm optimization, and intelligence metrics.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 2 Day 3
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Cpu,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Share2,
  GitBranch,
  Users,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Settings,
  BarChart3,
  Layers,
  Network,
  Brain,
  Sparkles,
  Gauge
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface OrchestrationStatus {
  timestamp: string;
  uptime: {
    days: number;
    hours: number;
    minutes: number;
  };
  uptimeSeconds: number;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  busyAgents: number;
  offlineAgents: number;
  totalTasksDistributed: number;
  totalTasksCompleted: number;
  tasksInQueue: number;
  taskCompletionRate: number;
  averageTaskTime: number;
  swarmEfficiency: number;
  loadBalanceScore: number;
  coordinationScore: number;
  totalOptimizations: number;
  lastOptimization: string;
  agentsByType: Record<string, number>;
  healthStatus: string;
  warnings: string[];
  alerts: string[];
}

interface AgentPerformance {
  agentId: string;
  agentType: string;
  status: string;
  currentLoad: number;
  maxCapacity: number;
  loadPercentage: number;
  tasksCompleted: number;
  tasksInProgress: number;
  successRate: number;
  failureRate: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  efficiency: number;
  utilizationRate: number;
  throughputRate: number;
  lastHeartbeat: string;
  healthScore: number;
  specializedSkills: string[];
  priority: number;
}

interface LoadBalancingMetrics {
  timestamp: string;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  utilizationPercentage: number;
  loadDistribution: Record<string, LoadDistributionData>;
  loadBalanceScore: number;
  recommendedActions: string[];
}

interface LoadDistributionData {
  agentCount: number;
  totalCapacity: number;
  usedCapacity: number;
  utilizationPercentage: number;
  averageLoad: number;
}

interface SwarmOptimizationReport {
  optimizationId: string;
  strategy: string;
  startTime: string;
  endTime: string;
  status: string;
  improvementScore: number;
  changes: OptimizationChange[];
  metrics: Record<string, number>;
  recommendations: string[];
}

interface OptimizationChange {
  changeType: string;
  description: string;
  affectedAgents: number;
  impact: string;
}

interface AgentCoordinationStatus {
  timestamp: string;
  totalCoordinators: number;
  activeCoordinators: number;
  totalFieldGenerals: number;
  activeFieldGenerals: number;
  coordinationScore: number;
  hierarchyHealth: number;
  communicationEfficiency: number;
  decisionMakingSpeed: number;
  averageTeamSize: number;
  teamsPerCoordinator: number;
  coordinationPatterns: CoordinationPattern[];
  activeDirectives: string[];
  recentDecisions: string[];
}

interface CoordinationPattern {
  patternName: string;
  frequency: number;
  effectiveness: number;
}

interface SwarmIntelligenceMetric {
  metricName: string;
  value: number;
  trend: string;
  description: string;
}

// ==================== MAIN COMPONENT ====================

export function AIOrchestrationDashboard() {
  // State management
  const [status, setStatus] = useState<OrchestrationStatus | null>(null);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<LoadBalancingMetrics | null>(null);
  const [optimizationReport, setOptimizationReport] = useState<SwarmOptimizationReport | null>(null);
  const [coordination, setCoordination] = useState<AgentCoordinationStatus | null>(null);
  const [intelligence, setIntelligence] = useState<SwarmIntelligenceMetric[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(10000); // 10 seconds

  // Load orchestration data
  const loadOrchestrationData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load orchestration status
      const statusResponse = await fetch('/api/ai/orchestration/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }

      // Load agent performance
      const agentsResponse = await fetch('/api/ai/orchestration/agents/performance');
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);
      }

      // Load load balancing metrics
      const loadResponse = await fetch('/api/ai/orchestration/load-balancing');
      if (loadResponse.ok) {
        const loadData = await loadResponse.json();
        setLoadBalancing(loadData);
      }

      // Load coordination status
      const coordResponse = await fetch('/api/ai/orchestration/coordination');
      if (coordResponse.ok) {
        const coordData = await coordResponse.json();
        setCoordination(coordData);
      }

      // Load swarm intelligence metrics
      const intelligenceResponse = await fetch('/api/ai/orchestration/intelligence');
      if (intelligenceResponse.ok) {
        const intelligenceData = await intelligenceResponse.json();
        setIntelligence(intelligenceData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orchestration data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run optimization
  const runOptimization = async (strategy: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/orchestration/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: strategy,
          parameters: {}
        })
      });

      if (response.ok) {
        const reportData = await response.json();
        setOptimizationReport(reportData);
        // Reload data after optimization
        await loadOrchestrationData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run optimization');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadOrchestrationData();

    if (autoRefresh) {
      const interval = setInterval(loadOrchestrationData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadOrchestrationData]);

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
      case 'idle':
        return 'text-gray-400';
      case 'active':
        return 'text-green-400';
      case 'busy':
        return 'text-yellow-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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

  const getImpactColor = (impact: string): string => {
    switch (impact.toLowerCase()) {
      case 'critical':
        return 'bg-purple-900/20 border-purple-500/30 text-purple-400';
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
            <Brain className="w-8 h-8" />
            AI Swarm Orchestration
          </h1>
          <p className="text-terra-silver mt-1">Advanced swarm intelligence and optimization</p>
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
            onClick={loadOrchestrationData}
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
                  <p className="text-sm text-terra-silver">Total Agents</p>
                  <p className="text-2xl font-bold text-terra-cyan mt-1">{formatNumber(status.totalAgents)}</p>
                  <p className="text-xs text-green-400 mt-1">{formatNumber(status.activeAgents)} active</p>
                </div>
                <Cpu className="w-8 h-8 text-terra-cyan" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Swarm Efficiency</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{formatPercent(status.swarmEfficiency)}</p>
                </div>
                <Gauge className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terra-silver">Uptime</p>
                  <p className="text-lg font-bold text-terra-cyan mt-1">{formatUptime(status.uptimeSeconds)}</p>
                </div>
                <Activity className="w-8 h-8 text-terra-cyan" />
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-terra-dark border border-terra-cyan/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="load-balancing">Load Balancing</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {status && (
            <>
              {/* Task Metrics */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Target className="w-5 h-5" />
                    Task Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Tasks Distributed</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(status.totalTasksDistributed)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Tasks Completed</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatNumber(status.totalTasksCompleted)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Completion Rate</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatPercent(status.taskCompletionRate)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Queue</div>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">
                        {formatNumber(status.tasksInQueue)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Distribution */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Layers className="w-5 h-5" />
                    Agent Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(status.agentsByType).map(([type, count]) => (
                      <div key={type} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="text-sm text-terra-silver">{type}</div>
                        <div className="text-2xl font-bold text-terra-cyan mt-1">{formatNumber(count)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-terra-silver">Idle Agents</span>
                      <span className="text-gray-400 font-bold">{formatNumber(status.idleAgents)}</span>
                    </div>
                    <Progress value={(status.idleAgents / status.totalAgents) * 100} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-terra-silver">Busy Agents</span>
                      <span className="text-yellow-400 font-bold">{formatNumber(status.busyAgents)}</span>
                    </div>
                    <Progress value={(status.busyAgents / status.totalAgents) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Performance Scores */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <BarChart3 className="w-5 h-5" />
                    Performance Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-silver">Swarm Efficiency</span>
                        <span className="text-green-400 font-bold">{formatPercent(status.swarmEfficiency)}</span>
                      </div>
                      <Progress value={status.swarmEfficiency} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-silver">Load Balance Score</span>
                        <span className="text-terra-cyan font-bold">{formatPercent(status.loadBalanceScore)}</span>
                      </div>
                      <Progress value={status.loadBalanceScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-silver">Coordination Score</span>
                        <span className="text-blue-400 font-bold">{formatPercent(status.coordinationScore)}</span>
                      </div>
                      <Progress value={status.coordinationScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Users className="w-5 h-5" />
                Top Performing Agents
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Showing top 10 agents by performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents.slice(0, 10).map((agent) => (
                  <div key={agent.agentId} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-terra-cyan">
                          {agent.agentId}
                        </Badge>
                        <span className="text-sm text-terra-silver">{agent.agentType}</span>
                        <span className={`text-sm ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-terra-silver">Health Score</div>
                          <div className="text-sm font-bold text-green-400">{formatPercent(agent.healthScore)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-terra-silver">Efficiency</div>
                          <div className="text-sm font-bold text-terra-cyan">{formatPercent(agent.efficiency)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-terra-silver">Tasks Completed</div>
                        <div className="text-sm font-bold text-terra-cyan">{formatNumber(agent.tasksCompleted)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Success Rate</div>
                        <div className="text-sm font-bold text-green-400">{formatPercent(agent.successRate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Avg Response</div>
                        <div className="text-sm font-bold text-terra-cyan">{agent.averageResponseTime.toFixed(1)}ms</div>
                      </div>
                      <div>
                        <div className="text-xs text-terra-silver">Utilization</div>
                        <div className="text-sm font-bold text-yellow-400">{formatPercent(agent.utilizationRate)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-terra-silver">Load</span>
                        <span className="text-xs text-terra-cyan">{agent.currentLoad} / {agent.maxCapacity}</span>
                      </div>
                      <Progress value={agent.loadPercentage} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Load Balancing Tab */}
        <TabsContent value="load-balancing" className="space-y-6">
          {loadBalancing && (
            <>
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Network className="w-5 h-5" />
                    Load Balancing Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Total Capacity</div>
                      <div className="text-2xl font-bold text-terra-cyan mt-1">
                        {formatNumber(loadBalancing.totalCapacity)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Used Capacity</div>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">
                        {formatNumber(loadBalancing.usedCapacity)}
                      </div>
                    </div>
                    <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                      <div className="text-sm text-terra-silver">Available Capacity</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        {formatNumber(loadBalancing.availableCapacity)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-terra-silver">Overall Utilization</span>
                      <span className="text-terra-cyan font-bold">{formatPercent(loadBalancing.utilizationPercentage)}</span>
                    </div>
                    <Progress value={loadBalancing.utilizationPercentage} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-terra-silver mb-3">Load Balance Score</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-terra-silver">Score</span>
                      <span className="text-green-400 font-bold text-lg">{formatPercent(loadBalancing.loadBalanceScore)}</span>
                    </div>
                    <Progress value={loadBalancing.loadBalanceScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Load Distribution by Type */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Share2 className="w-5 h-5" />
                    Load Distribution by Agent Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(loadBalancing.loadDistribution).map(([type, data]) => (
                      <div key={type} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-terra-cyan">{type}</span>
                          <Badge variant="outline" className="text-terra-silver">
                            {data.agentCount} agents
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-terra-silver">Total Capacity</div>
                            <div className="text-sm font-bold text-terra-cyan">{formatNumber(data.totalCapacity)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Used</div>
                            <div className="text-sm font-bold text-yellow-400">{formatNumber(data.usedCapacity)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-terra-silver">Avg Load</div>
                            <div className="text-sm font-bold text-terra-cyan">{formatPercent(data.averageLoad)}</div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-terra-silver">Utilization</span>
                            <span className="text-xs text-terra-cyan">{formatPercent(data.utilizationPercentage)}</span>
                          </div>
                          <Progress value={data.utilizationPercentage} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Actions */}
              {loadBalancing.recommendedActions.length > 0 && (
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <Zap className="w-5 h-5" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {loadBalancing.recommendedActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 p-3 bg-terra-midnight rounded border border-yellow-500/30">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-yellow-400">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Coordination Tab */}
        <TabsContent value="coordination" className="space-y-6">
          {coordination && (
            <>
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <GitBranch className="w-5 h-5" />
                    Coordination Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-terra-silver">Coordinators</span>
                          <Badge variant="outline" className="text-purple-400">
                            Tier 1
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                          {coordination.activeCoordinators} / {coordination.totalCoordinators}
                        </div>
                        <div className="text-xs text-terra-silver mt-1">Active coordinators</div>
                      </div>

                      <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-terra-silver">Field Generals</span>
                          <Badge variant="outline" className="text-blue-400">
                            Tier 2
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-400">
                          {coordination.activeFieldGenerals} / {coordination.totalFieldGenerals}
                        </div>
                        <div className="text-xs text-terra-silver mt-1">Active field generals</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="text-sm text-terra-silver mb-2">Average Team Size</div>
                        <div className="text-2xl font-bold text-terra-cyan">{coordination.averageTeamSize}</div>
                      </div>

                      <div className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="text-sm text-terra-silver mb-2">Teams per Coordinator</div>
                        <div className="text-2xl font-bold text-terra-cyan">{coordination.teamsPerCoordinator}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mt-6">
                    <div className="p-3 bg-terra-midnight rounded-lg">
                      <div className="text-xs text-terra-silver">Coordination Score</div>
                      <div className="text-lg font-bold text-green-400 mt-1">{formatPercent(coordination.coordinationScore)}</div>
                    </div>
                    <div className="p-3 bg-terra-midnight rounded-lg">
                      <div className="text-xs text-terra-silver">Hierarchy Health</div>
                      <div className="text-lg font-bold text-green-400 mt-1">{formatPercent(coordination.hierarchyHealth)}</div>
                    </div>
                    <div className="p-3 bg-terra-midnight rounded-lg">
                      <div className="text-xs text-terra-silver">Communication</div>
                      <div className="text-lg font-bold text-terra-cyan mt-1">{formatPercent(coordination.communicationEfficiency)}</div>
                    </div>
                    <div className="p-3 bg-terra-midnight rounded-lg">
                      <div className="text-xs text-terra-silver">Decision Speed</div>
                      <div className="text-lg font-bold text-blue-400 mt-1">{formatPercent(coordination.decisionMakingSpeed)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coordination Patterns */}
              <Card className="bg-terra-dark border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-terra-cyan">
                    <Network className="w-5 h-5" />
                    Coordination Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {coordination.coordinationPatterns.map((pattern, index) => (
                      <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-terra-cyan">{pattern.patternName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-terra-silver">Frequency: {formatNumber(pattern.frequency)}</span>
                            <span className="text-sm text-green-400">Effectiveness: {formatPercent(pattern.effectiveness)}</span>
                          </div>
                        </div>
                        <Progress value={pattern.effectiveness} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Directives */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <Target className="w-5 h-5" />
                      Active Directives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {coordination.activeDirectives.map((directive, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-terra-silver">{directive}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-terra-dark border-terra-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-terra-cyan">
                      <Activity className="w-5 h-5" />
                      Recent Decisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {coordination.recentDecisions.map((decision, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-terra-silver text-sm">{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Sparkles className="w-5 h-5" />
                Swarm Intelligence Metrics
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Advanced swarm intelligence and emergent behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {intelligence.map((metric, index) => (
                  <div key={index} className="p-4 bg-terra-midnight rounded-lg border border-terra-cyan/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-terra-cyan">{metric.metricName}</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <Badge variant="outline" className="text-terra-silver">
                          {metric.trend.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-3xl font-bold text-green-400">{formatPercent(metric.value)}</div>
                    </div>

                    <p className="text-sm text-terra-silver">{metric.description}</p>

                    <div className="mt-3">
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card className="bg-terra-dark border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terra-cyan">
                <Settings className="w-5 h-5" />
                Swarm Optimization
              </CardTitle>
              <CardDescription className="text-terra-silver">
                Run optimization strategies to improve swarm performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Button
                  onClick={() => runOptimization('auto')}
                  disabled={loading}
                  className="bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 border border-purple-500/30 flex-col h-auto py-4"
                >
                  <Sparkles className="w-6 h-6 mb-2" />
                  <span>Auto Optimize</span>
                  <span className="text-xs opacity-70 mt-1">Comprehensive</span>
                </Button>
                <Button
                  onClick={() => runOptimization('load-balance')}
                  disabled={loading}
                  className="bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan border border-terra-cyan/30 flex-col h-auto py-4"
                >
                  <Network className="w-6 h-6 mb-2" />
                  <span>Load Balance</span>
                  <span className="text-xs opacity-70 mt-1">Distribution</span>
                </Button>
                <Button
                  onClick={() => runOptimization('performance')}
                  disabled={loading}
                  className="bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-500/30 flex-col h-auto py-4"
                >
                  <Zap className="w-6 h-6 mb-2" />
                  <span>Performance</span>
                  <span className="text-xs opacity-70 mt-1">Speed</span>
                </Button>
                <Button
                  onClick={() => runOptimization('efficiency')}
                  disabled={loading}
                  className="bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 border border-blue-500/30 flex-col h-auto py-4"
                >
                  <Gauge className="w-6 h-6 mb-2" />
                  <span>Efficiency</span>
                  <span className="text-xs opacity-70 mt-1">Resource</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {optimizationReport && (
            <Card className="bg-terra-dark border-terra-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-terra-cyan">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Optimization Report
                  </div>
                  <Badge variant="outline" className="text-green-400">
                    {optimizationReport.status.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-terra-silver">
                  Strategy: {optimizationReport.strategy} | Improvement: {formatPercent(optimizationReport.improvementScore)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Changes */}
                  <div>
                    <h4 className="text-sm font-medium text-terra-silver mb-3">Optimization Changes</h4>
                    <div className="space-y-2">
                      {optimizationReport.changes.map((change, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${getImpactColor(change.impact)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{change.changeType.replace(/-/g, ' ').toUpperCase()}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getImpactColor(change.impact)}>
                                {change.impact.toUpperCase()}
                              </Badge>
                              <span className="text-sm opacity-70">{change.affectedAgents} agents</span>
                            </div>
                          </div>
                          <p className="text-sm opacity-80">{change.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  {Object.keys(optimizationReport.metrics).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-terra-silver mb-3">Performance Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(optimizationReport.metrics).map(([key, value]) => (
                          <div key={key} className="p-3 bg-terra-midnight rounded border border-terra-cyan/20">
                            <div className="text-xs text-terra-silver">{key.replace(/-/g, ' ')}</div>
                            <div className="text-lg font-bold text-terra-cyan mt-1">
                              {key.includes('improvement') || key.includes('score') ? formatPercent(value) : value.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {optimizationReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-terra-silver mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {optimizationReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-terra-silver">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIOrchestrationDashboard;
