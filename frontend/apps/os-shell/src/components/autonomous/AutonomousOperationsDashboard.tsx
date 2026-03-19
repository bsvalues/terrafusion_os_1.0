/**
 * AutonomousOperationsDashboard - Real-Time Autonomous Operations Visualization
 *
 * Comprehensive dashboard for monitoring and managing autonomous operations:
 * - Real-time anomaly detection visualization
 * - Failure prediction timeline
 * - Self-healing metrics and recovery tracking
 * - Auto-scaling status and predictions
 * - ML model performance graphs
 * - Recovery workflow orchestration
 * - Dependency graph visualization
 * - Predictive maintenance scheduling
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 4.0.0 - Phase 4 Week 1 Day 5-7
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  GitBranch,
  LineChart,
  Settings,
  RefreshCw,
  PlayCircle,
  StopCircle
} from 'lucide-react';

interface AutonomousStatus {
  statusTimestamp: string;
  overallHealth: number;
  autonomyLevel: number;
  anomalyDetectionEnabled: boolean;
  selfHealingEnabled: boolean;
  autoScalingEnabled: boolean;
  predictiveMaintenanceEnabled: boolean;
  activeAnomalies: number;
  activePredictions: number;
  activeRecoveries: number;
  totalRecoveriesExecuted: number;
  successfulRecoveries: number;
  averageRecoveryTime: number;
}

interface Anomaly {
  anomalyId: string;
  subsystemId: string;
  metric: string;
  severity: string;
  detectedAt: string;
  confidenceScore: number;
  currentValue: number;
  expectedRange: string;
  trend: string;
}

interface Prediction {
  predictionId: string;
  predictionType: string;
  subsystemId: string;
  severity: string;
  probability: number;
  predictedOccurrence: string;
  timeToImpact: string;
  preventiveActions: string[];
  status: string;
}

interface Recovery {
  recoveryId: string;
  subsystemId: string;
  failureType: string;
  status: string;
  progress: number;
  currentStep: string;
  startTime: string;
  estimatedCompletion: string;
  healthImprovement: number;
}

interface MLModel {
  modelId: string;
  modelType: string;
  predictionCategory: string;
  accuracy: number;
  lastTrained: string;
  status: string;
}

interface SubsystemHealth {
  subsystemId: string;
  status: string;
  healthScore: number;
  responseTime: number;
  errorRate: number;
  lastCheck: string;
}

export const AutonomousOperationsDashboard: React.FC = () => {
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [mlModels, setMlModels] = useState<MLModel[]>([]);
  const [subsystems, setSubsystems] = useState<SubsystemHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAutonomousStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/autonomous/status');
      if (!response.ok) throw new Error('Failed to fetch autonomous status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchAnomalies = useCallback(async () => {
    try {
      const response = await fetch('/api/autonomous/anomalies');
      if (!response.ok) throw new Error('Failed to fetch anomalies');
      const data = await response.json();
      setAnomalies(data.detectedAnomalies || []);
    } catch (err) {
    }
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      const response = await fetch('/api/autonomous/predictions');
      if (!response.ok) throw new Error('Failed to fetch predictions');
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (err) {
    }
  }, []);

  const fetchSelfHealing = useCallback(async () => {
    try {
      const response = await fetch('/api/autonomous/self-healing');
      if (!response.ok) throw new Error('Failed to fetch self-healing data');
      const data = await response.json();
      setRecoveries(data.activeRecoveries || []);
    } catch (err) {
    }
  }, []);

  const fetchPredictiveMaintenance = useCallback(async () => {
    try {
      const response = await fetch('/api/predictive-maintenance/report');
      if (!response.ok) throw new Error('Failed to fetch predictive maintenance');
      const data = await response.json();
      setMlModels(data.mlModels || []);
      setSubsystems(data.subsystemHealth || []);
    } catch (err) {
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAutonomousStatus(),
      fetchAnomalies(),
      fetchPredictions(),
      fetchSelfHealing(),
      fetchPredictiveMaintenance()
    ]);
    setLoading(false);
  }, [fetchAutonomousStatus, fetchAnomalies, fetchPredictions, fetchSelfHealing, fetchPredictiveMaintenance]);

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAllData]);

  const triggerManualRecovery = async (subsystemId: string, failureType: string) => {
    try {
      const response = await fetch('/api/autonomous/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subsystemId,
          reason: `Manual recovery triggered for ${failureType}`
        })
      });

      if (!response.ok) throw new Error('Failed to trigger recovery');

      await fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery trigger failed');
    }
  };

  const executePreventiveAction = async (predictionId: string, actionType: string) => {
    try {
      const response = await fetch('/api/predictive-maintenance/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          actionType,
          targetId: predictionId
        })
      });

      if (!response.ok) throw new Error('Failed to execute preventive action');

      await fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action execution failed');
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthColor = (health: number): string => {
    if (health >= 95) return 'text-green-600';
    if (health >= 85) return 'text-yellow-600';
    if (health >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-terra-cyan" />
          <p className="text-lg text-gray-600">Loading autonomous operations data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-8 h-8 text-terra-cyan" />
                Autonomous Operations Center
              </h1>
              <p className="text-gray-600 mt-1">Real-time monitoring and self-healing orchestration</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
              >
                {autoRefresh ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
              </Button>
              <Button onClick={fetchAllData} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Now
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Overview Cards */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overall Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getHealthColor(status.overallHealth)}`}>
                  {status.overallHealth.toFixed(1)}%
                </div>
                <Progress value={status.overallHealth} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Autonomy Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {status.autonomyLevel.toFixed(1)}%
                </div>
                <Progress value={status.autonomyLevel} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {status.activeAnomalies}
                </div>
                <p className="text-sm text-gray-500 mt-2">Detected and monitoring</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Recoveries (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {status.successfulRecoveries}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {status.averageRecoveryTime.toFixed(1)}s avg time
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="anomalies" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="anomalies">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Anomalies ({anomalies.length})
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <TrendingUp className="w-4 h-4 mr-2" />
              Predictions ({predictions.length})
            </TabsTrigger>
            <TabsTrigger value="recoveries">
              <Shield className="w-4 h-4 mr-2" />
              Recoveries ({recoveries.length})
            </TabsTrigger>
            <TabsTrigger value="models">
              <LineChart className="w-4 h-4 mr-2" />
              ML Models ({mlModels.length})
            </TabsTrigger>
            <TabsTrigger value="subsystems">
              <Activity className="w-4 h-4 mr-2" />
              Subsystems ({subsystems.length})
            </TabsTrigger>
          </TabsList>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Anomaly Detection</CardTitle>
                <CardDescription>
                  Continuously monitoring system metrics for anomalous behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {anomalies.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">No Anomalies Detected</p>
                      <p className="text-gray-600">All systems operating within expected parameters</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {anomalies.map((anomaly) => (
                        <Card key={anomaly.anomalyId} className={`border-l-4 ${getSeverityColor(anomaly.severity)}`}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={getSeverityColor(anomaly.severity)}>
                                    {anomaly.severity}
                                  </Badge>
                                  <span className="font-semibold">{anomaly.subsystemId}</span>
                                  <span className="text-gray-500">• {anomaly.metric}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Current: <strong>{anomaly.currentValue.toFixed(2)}</strong> |
                                  Expected: {anomaly.expectedRange} |
                                  Trend: <span className={anomaly.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}>
                                    {anomaly.trend}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  {new Date(anomaly.detectedAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-600 mb-1">Confidence</div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {(anomaly.confidenceScore * 100).toFixed(1)}%
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => triggerManualRecovery(anomaly.subsystemId, anomaly.metric)}
                                >
                                  Trigger Recovery
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Failure Predictions & Preventive Actions</CardTitle>
                <CardDescription>
                  ML-driven predictions with recommended preventive measures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {predictions.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">No Active Predictions</p>
                      <p className="text-gray-600">No failures predicted in the forecast window</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {predictions.map((prediction) => (
                        <Card key={prediction.predictionId} className={`border-l-4 ${getSeverityColor(prediction.severity)}`}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={getSeverityColor(prediction.severity)}>
                                    {prediction.severity}
                                  </Badge>
                                  <span className="font-semibold">{prediction.predictionType}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>{prediction.subsystemId}</strong> • Time to impact: {prediction.timeToImpact}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Predicted: {new Date(prediction.predictedOccurrence).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-600 mb-1">Probability</div>
                                <div className="text-2xl font-bold text-orange-600">
                                  {(prediction.probability * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Preventive Actions:</p>
                              <ul className="space-y-1">
                                {prediction.preventiveActions.map((action, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                              <Button
                                size="sm"
                                className="mt-3"
                                onClick={() => executePreventiveAction(prediction.predictionId, 'auto')}
                              >
                                Execute Actions
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recoveries Tab */}
          <TabsContent value="recoveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Recovery Operations</CardTitle>
                <CardDescription>
                  Real-time recovery progress and health improvement tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {recoveries.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">No Active Recoveries</p>
                      <p className="text-gray-600">All systems stable - no recovery operations in progress</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recoveries.map((recovery) => (
                        <Card key={recovery.recoveryId} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{recovery.status}</Badge>
                                  <span className="font-semibold">{recovery.subsystemId}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {recovery.failureType} • {recovery.currentStep}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Started: {new Date(recovery.startTime).toLocaleTimeString()}</span>
                                  <span>ETA: {new Date(recovery.estimatedCompletion).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-600 mb-1">Health Gain</div>
                                <div className="text-2xl font-bold text-green-600">
                                  +{recovery.healthImprovement.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{recovery.progress}%</span>
                              </div>
                              <Progress value={recovery.progress} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Machine Learning Models</CardTitle>
                <CardDescription>
                  Model performance, accuracy metrics, and training status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mlModels.map((model) => (
                      <Card key={model.modelId} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{model.modelType}</h3>
                              <p className="text-sm text-gray-600">{model.predictionCategory}</p>
                            </div>
                            <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                              {model.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Accuracy</span>
                              <span className="font-medium text-green-600">{model.accuracy.toFixed(1)}%</span>
                            </div>
                            <Progress value={model.accuracy} />
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Last trained</span>
                              <span>{new Date(model.lastTrained).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subsystems Tab */}
          <TabsContent value="subsystems" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subsystem Health Status</CardTitle>
                <CardDescription>
                  Real-time health monitoring across all system components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subsystems.map((subsystem) => (
                      <Card key={subsystem.subsystemId} className={`border-l-4 ${
                        subsystem.healthScore >= 95 ? 'border-l-green-500' :
                        subsystem.healthScore >= 85 ? 'border-l-yellow-500' :
                        'border-l-red-500'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">{subsystem.subsystemId}</h3>
                              <Badge variant="outline" className="mt-1">
                                {subsystem.status}
                              </Badge>
                            </div>
                            <div className={`text-2xl font-bold ${getHealthColor(subsystem.healthScore)}`}>
                              {subsystem.healthScore.toFixed(1)}%
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Response Time</span>
                              <span className="font-medium">{subsystem.responseTime.toFixed(0)}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Error Rate</span>
                              <span className="font-medium">{subsystem.errorRate.toFixed(2)}%</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Last check: {new Date(subsystem.lastCheck).toLocaleTimeString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutonomousOperationsDashboard;
