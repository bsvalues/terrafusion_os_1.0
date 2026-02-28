/**
 * TerraFlow Quantum Command Center - Main Component
 *
 * The central hub for PhD-level AI operations and analytics.
 * Provides unified access to:
 * - 3D AI Swarm Visualization (50,000 agents)
 * - Analytics Workbench (Jupyter-style notebooks)
 * - AI Workflow Designer (visual programming)
 * - Statistical Analysis Lab (hypothesis testing, causal inference)
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

import React, { useState, useEffect } from 'react';
import { getViteEnv } from '@/shared/viteEnv';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  BarChart3,
  FlaskConical,
  Workflow,
  Cube,
  Signal,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Import child components (will be created)
import { HypothesisTestingLab } from './HypothesisTestingLab';
import { SwarmVisualization3D } from './SwarmVisualization3D';
import { AnalyticsWorkbench } from './AnalyticsWorkbench';
import { WorkflowDesigner } from './WorkflowDesigner';

// Hooks
import { useQuantumAnalyticsStatus } from '@/hooks/useQuantumAnalyticsStatus';
import { useAgentSwarmStatus } from '@/hooks/useAgentSwarmStatus';

/**
 * Main Quantum Command Center component
 */
export function QuantumCommandCenter() {
  const [activeTab, setActiveTab] = useState<string>('statistics');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Monitor backend service health
  const {
    isHealthy: analyticsHealthy,
    serviceInfo
  } = useQuantumAnalyticsStatus();

  const {
    agentCount,
    coherence,
    harmony
  } = useAgentSwarmStatus();

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${getViteEnv().VITE_QUANTUM_ANALYTICS_URL || ''}/`, { method: 'GET' });
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Cube className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  TerraFlow Quantum Command Center
                </h1>
                <p className="text-sm text-slate-400">PhD-Level AI Operations & Analytics Platform</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <Signal className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}`} />
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                  {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                </Badge>
              </div>

              {/* AI Swarm Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">{agentCount.toLocaleString()} Agents</span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-sm text-green-400">{(coherence * 100).toFixed(1)}% Coherence</span>
              </div>

              {/* Analytics Status */}
              <div className="flex items-center gap-2">
                {analyticsHealthy ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                <span className="text-sm text-slate-400">Analytics API</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Connection Warning */}
        {connectionStatus === 'disconnected' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend Connection Lost</AlertTitle>
            <AlertDescription>
              Unable to connect to QuantumAnalytics API (port 3005). Please ensure the backend service is running.
              <div className="mt-2">
                <code className="text-xs">cd backend/TerraFusion.QuantumAnalytics && dotnet run</code>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-800 p-1">
            <TabsTrigger
              value="visualization"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600"
            >
              <Cube className="w-4 h-4 mr-2" />
              3D Visualization
            </TabsTrigger>
            <TabsTrigger
              value="workbench"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Lab Workbench
            </TabsTrigger>
            <TabsTrigger
              value="workflow"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600"
            >
              <Workflow className="w-4 h-4 mr-2" />
              AI Workflow
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* 3D Visualization Tab */}
          <TabsContent value="visualization" className="mt-0">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cube className="w-5 h-5 text-cyan-400" />
                  3D Agent Swarm Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SwarmVisualization3D
                  agentCount={agentCount}
                  coherence={coherence}
                  harmony={harmony}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Workbench Tab */}
          <TabsContent value="workbench" className="mt-0">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-cyan-400" />
                  Analytics Workbench
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsWorkbench />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Workflow Tab */}
          <TabsContent value="workflow" className="mt-0">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-cyan-400" />
                  AI Workflow Designer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowDesigner />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-0">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Statistical Analysis Lab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HypothesisTestingLab
                  isConnected={connectionStatus === 'connected'}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Info Footer */}
        {serviceInfo && (
          <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  QuantumAnalytics v{serviceInfo.version} • Port {serviceInfo.port} • Status: {serviceInfo.status}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${getViteEnv().VITE_QUANTUM_ANALYTICS_URL || ''}/swagger`, '_blank')}
              >
                View API Docs
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuantumCommandCenter;
