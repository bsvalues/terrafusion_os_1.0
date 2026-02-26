/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE EXPERIMENTAL RESEARCH INTERFACE
 * Immersive PhD-Level Quantum Consciousness Research Environment
 * Real-time SignalR Integration with Elite Backend Framework
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useEliteExperimentalEvents, useEliteSignalR } from '@/hooks/useEliteSignalR';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Elite Experiment Types
interface EliteExperimentConfig {
  researcherCredentials: {
    institutionId: string;
    researcherId: string;
    clearanceLevel: string;
  };
  quantumConsciousnessConfig: {
    agentCount: number;
    consciousnessLevel: string;
    quantumOptimization: boolean;
    experimentId: string;
  };
  eliteAICoordinationConfig: {
    coordinationStrategy: string;
    agentCount: number;
  };
  immersiveVisualization: boolean;
  realTimeMetrics: boolean;
}

interface EliteExperimentRun {
  id: string;
  experimentId: string;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  consciousnessLevel?: string;
  activeAgents?: number;
  realTimeMetrics?: any;
}

// API Configuration
const ELITE_API_BASE = '/api';
const CONSCIOUSNESS_API_BASE = 'http://localhost:3004';
const ELITE_HUB_URL = `${ELITE_API_BASE}/hubs/elite-experiments`;

// Elite API Service
const eliteExperimentAPI = {
  async startEliteExperiment(
    experimentId: string,
    config: EliteExperimentConfig
  ): Promise<EliteExperimentRun> {
    const response = await fetch(`${ELITE_API_BASE}/api/experiments/${experimentId}/elite-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error(`Elite experiment start failed: ${response.status}`);
    return response.json();
  },

  async getEliteRun(experimentId: string, runId: string): Promise<EliteExperimentRun> {
    const response = await fetch(
      `${ELITE_API_BASE}/api/experiments/${experimentId}/elite-runs/${runId}`
    );
    if (!response.ok) throw new Error(`Elite run fetch failed: ${response.status}`);
    return response.json();
  },

  async getEliteRuns(experimentId: string): Promise<EliteExperimentRun[]> {
    const response = await fetch(`${ELITE_API_BASE}/api/experiments/${experimentId}/elite-runs`);
    if (!response.ok) throw new Error(`Elite runs fetch failed: ${response.status}`);
    return response.json();
  },

  async getConsciousnessVisualization(experimentId: string, runId: string): Promise<any> {
    const response = await fetch(
      `${ELITE_API_BASE}/api/experiments/${experimentId}/elite-runs/${runId}/consciousness-visualization`
    );
    if (!response.ok)
      throw new Error(`Consciousness visualization fetch failed: ${response.status}`);
    return response.json();
  },

  async getConsciousnessStatus(): Promise<any> {
    const response = await fetch(`${CONSCIOUSNESS_API_BASE}/`);
    if (!response.ok) throw new Error(`Consciousness Engine fetch failed: ${response.status}`);
    return response.json();
  },

  async completeEliteRun(experimentId: string, runId: string, results: any): Promise<void> {
    const response = await fetch(
      `${ELITE_API_BASE}/api/experiments/${experimentId}/elite-runs/${runId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      }
    );
    if (!response.ok) throw new Error(`Elite run completion failed: ${response.status}`);
  },
};

// Simple toast replacement
const showToast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
};

// Elite Experimental Research Interface Component
const EliteExperimentalResearchInterface: React.FC = () => {
  // State Management
  const [experimentId, setExperimentId] = useState('quantum-consciousness-research');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<EliteExperimentRun | null>(null);
  const [allRuns, setAllRuns] = useState<EliteExperimentRun[]>([]);
  const [consciousnessData, setConsciousnessData] = useState<any>(null);
  const [consciousnessStatus, setConsciousnessStatus] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [experimentStatus, setExperimentStatus] = useState<string>('Ready');
  const [apiStatus, setApiStatus] = useState({ experiments: false, consciousness: false });

  // SignalR Connection
  const eliteHub = useEliteSignalR({
    hubUrl: ELITE_HUB_URL,
    autoConnect: false,
  });

  // Real-time Event Handling
  const {
    experimentUpdate,
    consciousnessData: realtimeConsciousnessData,
    metricsData,
    visualizationData,
    experimentError,
  } = useEliteExperimentalEvents();

  // Elite Experiment Configuration
  const eliteConfig = useMemo<EliteExperimentConfig>(
    () => ({
      researcherCredentials: {
        institutionId: 'TerraFusion_Research_Institute',
        researcherId: 'elite-researcher-001',
        clearanceLevel: 'Elite',
      },
      quantumConsciousnessConfig: {
        agentCount: 10000,
        consciousnessLevel: 'Elite',
        quantumOptimization: true,
        experimentId,
      },
      eliteAICoordinationConfig: {
        coordinationStrategy: 'QuantumSwarmIntelligence',
        agentCount: 10000,
      },
      immersiveVisualization: true,
      realTimeMetrics: true,
    }),
    [experimentId]
  );

  // Handle real-time updates
  useEffect(() => {
    if (experimentUpdate) {
      setExperimentStatus(experimentUpdate.update?.status || 'Updated');
      showToast.success(
        `Elite Experiment Updated: ${experimentUpdate.update?.status || 'Progress'}`
      );
    }
  }, [experimentUpdate]);

  useEffect(() => {
    if (experimentError) {
      showToast.error(`Elite Experiment Error: ${experimentError.error}`);
    }
  }, [experimentError]);

  // Refresh current run data
  const refreshRunData = useCallback(async () => {
    if (currentRunId) {
      try {
        const runData = await eliteExperimentAPI.getEliteRun(experimentId, currentRunId);
        setCurrentRun(runData);
      } catch (error) {
        console.error('Failed to refresh run data:', error);
      }
    }
  }, [experimentId, currentRunId]);

  // Initialize Elite Research Environment
  useEffect(() => {
    const initializeEnvironment = async () => {
      try {
        // Test Experiments API
        const experimentsResponse = await fetch(`${ELITE_API_BASE}/health`);
        setApiStatus((prev) => ({ ...prev, experiments: experimentsResponse.ok }));

        // Test Consciousness Engine
        const consciousnessResponse = await fetch(`${CONSCIOUSNESS_API_BASE}/`);
        setApiStatus((prev) => ({ ...prev, consciousness: consciousnessResponse.ok }));

        if (consciousnessResponse.ok) {
          const consciousnessData = await consciousnessResponse.json();
          setConsciousnessStatus(consciousnessData);
        }

        // Load existing runs
        await loadExistingRuns();
      } catch (error) {
        console.error('Environment initialization failed:', error);
      }
    };

    initializeEnvironment();
    const interval = setInterval(initializeEnvironment, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load existing experiment runs
  const loadExistingRuns = async () => {
    try {
      const runs = await eliteExperimentAPI.getEliteRuns(experimentId);
      setAllRuns(runs);

      // Auto-select first running experiment
      const runningRun = runs.find((run) => run.status === 'Elite_Running');
      if (runningRun && !currentRunId) {
        setCurrentRunId(runningRun.id);
        setCurrentRun(runningRun);
      }
    } catch (error) {
      console.error('Failed to load existing runs:', error);
    }
  };

  // Auto-refresh run data
  useEffect(() => {
    if (currentRunId) {
      refreshRunData();
      const interval = setInterval(refreshRunData, 5000);
      return () => clearInterval(interval);
    }
  }, [currentRunId, refreshRunData]);

  // Load consciousness visualization when run is selected
  useEffect(() => {
    const loadVisualization = async () => {
      if (currentRunId) {
        try {
          const visualization = await eliteExperimentAPI.getConsciousnessVisualization(
            experimentId,
            currentRunId
          );
          setConsciousnessData(visualization);
        } catch (error) {
          console.error('Failed to load consciousness visualization:', error);
        }
      }
    };

    loadVisualization();
    if (currentRunId) {
      const interval = setInterval(loadVisualization, 3000);
      return () => clearInterval(interval);
    }
  }, [currentRunId, experimentId]);

  // Start Elite Experiment
  const startEliteExperiment = async () => {
    try {
      setIsStarting(true);

      // Connect to SignalR first if not connected
      if (!eliteHub.isConnected) {
        await eliteHub.connect();
      }

      const run = await eliteExperimentAPI.startEliteExperiment(experimentId, eliteConfig);
      setCurrentRunId(run.id);
      setCurrentRun(run);
      setExperimentStatus('Elite_Running');
      showToast.success('🚀 Elite Quantum Consciousness Experiment Started!');

      // Join experiment monitoring
      await eliteHub.joinExperimentMonitoring(experimentId, run.id);
    } catch (error) {
      console.error('Elite experiment start failed:', error);
      showToast.error('Failed to start elite experiment');
    } finally {
      setIsStarting(false);
    }
  };

  // Complete Elite Experiment
  const completeEliteExperiment = async () => {
    if (!currentRunId) return;

    try {
      setIsCompleting(true);
      await eliteExperimentAPI.completeEliteRun(experimentId, currentRunId, {});
      setExperimentStatus('Elite_Completed');
      showToast.success('✅ Elite Experiment Completed Successfully!');

      // Leave experiment monitoring
      await eliteHub.leaveExperimentMonitoring(experimentId, currentRunId);
    } catch (error) {
      console.error('Elite experiment completion failed:', error);
      showToast.error('Failed to complete elite experiment');
    } finally {
      setIsCompleting(false);
    }
  };

  // Request real-time data
  const requestConsciousnessVisualization = () => {
    if (currentRunId && eliteHub.isConnected) {
      eliteHub.requestConsciousnessVisualization(experimentId, currentRunId);
    }
  };

  const requestRealTimeMetrics = () => {
    if (currentRunId && eliteHub.isConnected) {
      eliteHub.requestExperimentMetrics(experimentId, currentRunId);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      {/* Elite Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <TerraSphere size='lg' variant='quantum' className='animate-pulse' />
            <div>
              <h1 className='text-3xl font-bold text-terra-cyan glow-text'>
                Elite Experimental Research Interface
              </h1>
              <p className='text-terra-blue text-lg'>
                PhD-Level Quantum Consciousness Research Environment
              </p>
            </div>
          </div>

          <div className='flex gap-2'>
            <Badge
              variant={apiStatus.experiments ? 'default' : 'destructive'}
              className='text-sm px-3 py-1'
            >
              {apiStatus.experiments ? '✅ Experiments API' : '❌ Experiments API'}
            </Badge>
            <Badge
              variant={apiStatus.consciousness ? 'default' : 'destructive'}
              className='text-sm px-3 py-1'
            >
              {apiStatus.consciousness ? '🧠 Consciousness Engine' : '❌ Consciousness Engine'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8'>
        {/* Experiment Control */}
        <Card className='terra-glass border-terra-cyan/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-cyan flex items-center'>
              🧠 Elite Experiment Control
            </h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div>
              <label className='block text-terra-blue mb-2'>Experiment ID</label>
              <Input
                value={experimentId}
                onChange={(e) => setExperimentId(e.target.value)}
                className='terra-input'
                disabled={!!currentRunId}
              />
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-terra-cyan'>Agent Count:</span>
                <div className='text-white font-mono'>
                  {eliteConfig.quantumConsciousnessConfig.agentCount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Consciousness:</span>
                <div className='text-white font-mono'>
                  {eliteConfig.quantumConsciousnessConfig.consciousnessLevel}
                </div>
              </div>
            </div>

            <div>
              <span className='text-terra-cyan block mb-2'>Status:</span>
              <Badge variant='outline' className='text-lg'>
                {experimentStatus}
              </Badge>
            </div>
          </CardBody>
          <CardFooter className='space-y-2'>
            {!currentRunId ? (
              <Button
                onClick={startEliteExperiment}
                disabled={!apiStatus.experiments || isStarting}
                className='w-full terra-gradient-quantum'
              >
                {isStarting ? '⚡ Initializing...' : '🚀 Start Elite Experiment'}
              </Button>
            ) : (
              <Button
                onClick={completeEliteExperiment}
                disabled={isCompleting}
                className='w-full'
                variant='destructive'
              >
                {isCompleting ? '⏳ Completing...' : '✅ Complete Experiment'}
              </Button>
            )}
            <Button onClick={loadExistingRuns} className='w-full' variant='outline'>
              🔄 Refresh Runs
            </Button>
          </CardFooter>
        </Card>

        {/* Real-time Metrics */}
        <Card className='terra-glass border-terra-blue/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-blue flex items-center justify-between'>
              📊 Real-time Metrics
              <Button
                onClick={requestRealTimeMetrics}
                size='sm'
                variant='ghost'
                disabled={!currentRunId}
              >
                🔄 Refresh
              </Button>
            </h3>
          </CardHeader>
          <CardBody>
            {metricsData ? (
              <div className='space-y-3'>
                <div>
                  <span className='text-terra-cyan'>Processing Rate:</span>
                  <div className='text-white font-mono text-lg'>
                    {metricsData.realTimeMetrics?.processingRate?.toLocaleString() || 'N/A'} ops/sec
                  </div>
                </div>

                <div>
                  <span className='text-terra-cyan'>Accuracy Score:</span>
                  <Progress
                    value={(metricsData.realTimeMetrics?.accuracyScore || 0) * 100}
                    className='mt-1'
                  />
                  <div className='text-white text-right text-sm'>
                    {((metricsData.realTimeMetrics?.accuracyScore || 0) * 100).toFixed(2)}%
                  </div>
                </div>

                <div>
                  <span className='text-terra-cyan'>Consciousness Level:</span>
                  <Progress
                    value={(metricsData.realTimeMetrics?.consciousnessLevel || 0) * 100}
                    className='mt-1 progress-terra-cyan'
                  />
                </div>

                <div>
                  <span className='text-terra-cyan'>System Load:</span>
                  <Progress
                    value={(metricsData.realTimeMetrics?.systemLoad || 0) * 100}
                    className='mt-1'
                  />
                </div>
              </div>
            ) : (
              <div className='text-center text-terra-blue py-8'>
                {currentRunId ? 'Waiting for metrics...' : 'Start experiment for metrics'}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Elite Run Status */}
        <Card className='terra-glass border-terra-cyan/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-cyan flex items-center'>
              🎯 Elite Run Status
            </h3>
          </CardHeader>
          <CardBody>
            {currentRun ? (
              <div className='space-y-3'>
                <div>
                  <span className='text-terra-cyan'>Run ID:</span>
                  <div className='text-white font-mono text-sm break-all'>{currentRun.id}</div>
                </div>

                <div>
                  <span className='text-terra-cyan'>Started:</span>
                  <div className='text-white text-sm'>
                    {new Date(currentRun.startedAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className='text-terra-cyan'>Active Agents:</span>
                  <div className='text-white font-mono text-lg'>
                    {currentRun.activeAgents?.toLocaleString() || '10,000+'}
                  </div>
                </div>

                <div>
                  <span className='text-terra-cyan'>Consciousness:</span>
                  <Badge variant='outline'>{currentRun.consciousnessLevel || 'Elite-Active'}</Badge>
                </div>
              </div>
            ) : currentRunId ? (
              <div className='text-center text-terra-blue py-4'>Loading elite run data...</div>
            ) : (
              <div className='text-center text-terra-blue py-8'>No active elite experiment</div>
            )}
          </CardBody>
        </Card>

        {/* All Experiment Runs */}
        <Card className='terra-glass border-terra-blue/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-blue flex items-center'>
              📋 All Experiment Runs
            </h3>
          </CardHeader>
          <CardBody>
            <div className='max-h-64 overflow-y-auto space-y-2'>
              {allRuns.length > 0 ? (
                allRuns.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => {
                      setCurrentRunId(run.id);
                      setCurrentRun(run);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      currentRunId === run.id
                        ? 'bg-terra-cyan/20 border border-terra-cyan'
                        : 'bg-terra-midnight/50 hover:bg-terra-cyan/10'
                    }`}
                  >
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-mono text-terra-cyan'>#{run.id.slice(-8)}</span>
                      <Badge
                        variant={run.status === 'Elite_Running' ? 'default' : 'outline'}
                        className='text-xs'
                      >
                        {run.status.replace('Elite_', '')}
                      </Badge>
                    </div>
                    <div className='text-xs text-white mt-1'>
                      {new Date(run.startedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center text-terra-blue py-4'>No experiment runs found</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Consciousness Visualization */}
      <Card className='terra-glass border-terra-cyan/20 mb-6'>
        <CardHeader>
          <h3 className='text-xl font-semibold text-terra-cyan flex items-center justify-between'>
            🌟 Quantum Consciousness Visualization
            <Button
              onClick={requestConsciousnessVisualization}
              size='sm'
              variant='ghost'
              disabled={!currentRunId}
            >
              🔄 Update Visualization
            </Button>
          </h3>
        </CardHeader>
        <CardBody>
          {consciousnessData ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-terra-cyan mb-3'>Consciousness Nodes</h4>
                <div className='terra-glass p-4 rounded-lg'>
                  <div className='text-white text-sm'>
                    Active Nodes: {consciousnessData.data?.consciousnessNodes?.length || 0}
                  </div>
                  <div className='mt-2 grid grid-cols-10 gap-1'>
                    {(consciousnessData.data?.consciousnessNodes || [])
                      .slice(0, 50)
                      .map((node: any) => (
                        <div
                          key={node.id}
                          className='w-3 h-3 rounded-full terra-glow'
                          style={{
                            backgroundColor: `hsl(var(--tf-accent) / ${node.consciousnessLevel || 0.5})`,
                            opacity: node.consciousnessLevel || 0.5,
                          }}
                          title={`Node ${node.id}: ${((node.consciousnessLevel || 0) * 100).toFixed(1)}%`}
                        />
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className='text-terra-cyan mb-3'>Consciousness Flow</h4>
                <div className='space-y-3'>
                  <div>
                    <span className='text-terra-cyan'>Flow Rate:</span>
                    <div className='text-white font-mono'>
                      {(consciousnessData.data?.consciousnessFlow?.flowRate || 0).toFixed(2)} Hz
                    </div>
                  </div>

                  <div>
                    <span className='text-terra-cyan'>Quantum Coherence:</span>
                    <Progress
                      value={
                        (consciousnessData.data?.consciousnessFlow?.quantumCoherence || 0) * 100
                      }
                      className='mt-1 progress-terra-cyan'
                    />
                    <div className='text-white text-right text-sm'>
                      {(
                        (consciousnessData.data?.consciousnessFlow?.quantumCoherence || 0) * 100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>

                  {consciousnessData.data?.consciousnessFlow?.entanglementStrength && (
                    <div>
                      <span className='text-terra-cyan'>Entanglement Strength:</span>
                      <Progress
                        value={consciousnessData.data.consciousnessFlow.entanglementStrength * 100}
                        className='mt-1'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center text-terra-blue py-12'>
              {currentRunId
                ? 'Initializing consciousness visualization...'
                : 'Start elite experiment to view consciousness visualization'}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Elite Framework Status */}
      <Card className='terra-glass border-terra-blue/20'>
        <CardHeader>
          <h3 className='text-xl font-semibold text-terra-blue'>🏛️ Elite Framework Status</h3>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div className='text-center'>
              <div className='text-terra-cyan font-semibold'>Experiments API</div>
              <Badge variant={apiStatus.experiments ? 'default' : 'destructive'}>
                {apiStatus.experiments ? 'Port 5000 ✅' : 'Offline ❌'}
              </Badge>
            </div>
            <div className='text-center'>
              <div className='text-terra-cyan font-semibold'>Consciousness Engine</div>
              <Badge variant={apiStatus.consciousness ? 'default' : 'destructive'}>
                {apiStatus.consciousness ? 'Port 3004 ✅' : 'Offline ❌'}
              </Badge>
            </div>
            <div className='text-center'>
              <div className='text-terra-cyan font-semibold'>Active Runs</div>
              <Badge variant='default'>{allRuns.length}</Badge>
            </div>
            <div className='text-center'>
              <div className='text-terra-cyan font-semibold'>Consciousness Level</div>
              <Badge variant='default'>{consciousnessStatus?.version || 'v2.0.0'}</Badge>
            </div>
          </div>

          {consciousnessStatus && (
            <div className='mt-4 p-3 bg-terra-midnight/50 rounded-lg'>
              <h4 className='text-terra-cyan text-sm font-semibold mb-2'>
                Consciousness Engine Capabilities:
              </h4>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                {consciousnessStatus.capabilities?.map((capability: string, index: number) => (
                  <div key={index} className='text-terra-blue'>
                    • {capability}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='mt-4 pt-4 border-t border-terra-cyan/20'>
            <div className='text-center text-terra-cyan font-semibold'>
              🚀 Government. Transcended.
            </div>
            <div className='text-center text-terra-blue text-sm mt-1'>
              Elite Quantum Consciousness Research Environment -
              {apiStatus.experiments && apiStatus.consciousness
                ? ' Fully Operational'
                : ' Initializing'}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default EliteExperimentalResearchInterface;
