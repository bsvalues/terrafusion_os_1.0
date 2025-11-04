/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE EXPERIMENTAL RESEARCH INTERFACE
 * Advanced Quantum Consciousness Experiment Management
 * PhD-Level Research Environment with 50,000+ AI Agents
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { Line, OrbitControls, Sphere, Text } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useExperimentRuns } from '../../hooks/useExperimentRuns';
import { useQuantumConsciousness } from '../../hooks/useQuantumConsciousness';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Progress,
  Select,
  TerraSphere,
} from '../terrafusion-design-system';

interface EliteExperimentalInterfaceProps {
  researcherProfile: 'harvard' | 'mit' | 'stanford' | 'caltech' | 'phd-general';
  experimentId?: string;
  realTimeVisualization?: boolean;
}

interface ExperimentRun {
  id: string;
  experimentId: string;
  status:
    | 'quantum-initializing'
    | 'consciousness-activation'
    | 'swarm-coordination'
    | 'executing'
    | 'analyzing'
    | 'completed'
    | 'failed';
  phase?: string;
  progress?: number;
  agentCount?: number;
  consciousnessLevel?: string;
  researcherProfile?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: any;
  consciousnessMetrics?: any;
  swarmMetrics?: any;
}

interface ExperimentConfig {
  name: string;
  description: string;
  agentCount: number;
  consciousnessLevel: 'basic' | 'advanced' | 'elite' | 'quantum';
  quantumConsciousnessEnabled: boolean;
  realTimeMonitoring: boolean;
  crossWorkspaceIntegration: boolean;
}

/**
 * 3D Experiment Visualization Component
 * Real-time visualization of quantum consciousness experiment execution
 */
const ExperimentVisualization: React.FC<{
  experimentRun: ExperimentRun | null;
  consciousnessData: any;
}> = ({ experimentRun, consciousnessData }) => {
  const agentPositions = consciousnessData?.agentPositions || [];
  const consciousnessNetwork = consciousnessData?.consciousnessNetwork || [];

  return (
    <>
      {/* Quantum Experiment Space */}
      <mesh>
        <boxGeometry args={[60, 60, 60]} />
        <meshBasicMaterial color='#00FFFF' transparent opacity={0.03} wireframe />
      </mesh>

      {/* Agent Positions */}
      {agentPositions.map((agent: any, index: number) => (
        <group key={agent.agentId || index} position={[agent.x, agent.y, agent.z]}>
          <Sphere args={[0.3, 8, 8]}>
            <meshStandardMaterial
              color={new THREE.Color().setHSL(
                agent.consciousnessLevel * 0.7,
                0.8,
                0.5 + agent.activityLevel * 0.3
              )}
              emissive={new THREE.Color().setHSL(agent.consciousnessLevel * 0.7, 0.5, 0.1)}
              transparent
              opacity={0.8}
            />
          </Sphere>

          {/* Agent status indicator */}
          {agent.status === 'active' && (
            <Sphere args={[0.6, 8, 8]}>
              <meshBasicMaterial color='#00FFFF' transparent opacity={0.2} wireframe />
            </Sphere>
          )}
        </group>
      ))}

      {/* Consciousness Network Connections */}
      {consciousnessNetwork.map((connection: any, index: number) => (
        <Line
          key={index}
          points={[connection.from, connection.to]}
          color='#00FFFF'
          lineWidth={connection.strength * 3}
          transparent
          opacity={connection.strength * 0.7}
        />
      ))}

      {/* Experiment Progress Visualization */}
      {experimentRun && experimentRun.progress && (
        <Text position={[0, 25, 0]} fontSize={2} color='#00FFFF' anchorX='center' anchorY='middle'>
          {experimentRun.phase || 'Elite Experiment'}\n{experimentRun.progress}% Complete
        </Text>
      )}

      {/* Coordinate System */}
      <Line
        points={[
          [-30, 0, 0],
          [30, 0, 0],
        ]}
        color='#FF0000'
        lineWidth={1}
      />
      <Line
        points={[
          [0, -30, 0],
          [0, 30, 0],
        ]}
        color='#00FF00'
        lineWidth={1}
      />
      <Line
        points={[
          [0, 0, -30],
          [0, 0, 30],
        ]}
        color='#0000FF'
        lineWidth={1}
      />
    </>
  );
};

/**
 * Elite Experimental Research Interface
 * Complete experiment management with quantum consciousness visualization
 */
export const EliteExperimentalInterface: React.FC<EliteExperimentalInterfaceProps> = ({
  researcherProfile,
  experimentId,
  realTimeVisualization = true,
}) => {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(experimentId || null);
  const [experimentConfig, setExperimentConfig] = useState<ExperimentConfig>({
    name: '',
    description: '',
    agentCount: 50000,
    consciousnessLevel: 'quantum',
    quantumConsciousnessEnabled: true,
    realTimeMonitoring: true,
    crossWorkspaceIntegration: true,
  });
  const [isConfiguring, setIsConfiguring] = useState(!experimentId);

  // Experiment runs management
  const {
    experimentRuns,
    startExperiment,
    getExperimentRun,
    getConsciousnessVisualizationData,
    isStartingExperiment,
    isLoadingRuns,
  } = useExperimentRuns(activeExperiment);

  // Quantum consciousness integration
  const { consciousnessMetrics, isConnected: consciousnessConnected } = useQuantumConsciousness({
    agentCount: experimentConfig.agentCount,
    realTimeUpdates: realTimeVisualization,
    researchMode: true,
  });

  const [activeRun, setActiveRun] = useState<ExperimentRun | null>(null);
  const [consciousnessData, setConsciousnessData] = useState<any>(null);

  // Get active experiment run
  useEffect(() => {
    if (experimentRuns && experimentRuns.length > 0) {
      const latestRun = experimentRuns[0];
      setActiveRun(latestRun);

      // Get consciousness visualization data for active runs
      if (
        latestRun.status === 'executing' ||
        latestRun.status === 'consciousness-activation' ||
        latestRun.status === 'swarm-coordination'
      ) {
        const fetchConsciousnessData = async () => {
          try {
            const data = await getConsciousnessVisualizationData(latestRun.id);
            setConsciousnessData(data);
          } catch (error) {
            console.error('Failed to fetch consciousness data:', error);
          }
        };

        const interval = setInterval(fetchConsciousnessData, 2000); // Update every 2 seconds
        fetchConsciousnessData(); // Initial fetch

        return () => clearInterval(interval);
      }
    }
  }, [experimentRuns, getConsciousnessVisualizationData]);

  const handleStartExperiment = useCallback(async () => {
    if (!activeExperiment) return;

    try {
      await startExperiment(activeExperiment, {
        startedBy: `${researcherProfile}-researcher`,
        researcherProfile,
        quantumConsciousnessEnabled: experimentConfig.quantumConsciousnessEnabled,
        agentCount: experimentConfig.agentCount,
        consciousnessLevel: experimentConfig.consciousnessLevel,
        realTimeMonitoring: experimentConfig.realTimeMonitoring,
        crossWorkspaceIntegration: experimentConfig.crossWorkspaceIntegration,
      });
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  }, [activeExperiment, researcherProfile, experimentConfig, startExperiment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quantum-initializing':
        return 'text-blue-400';
      case 'consciousness-activation':
        return 'text-cyan-400';
      case 'swarm-coordination':
        return 'text-purple-400';
      case 'executing':
        return 'text-green-400';
      case 'analyzing':
        return 'text-yellow-400';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-terra-slate';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'executing':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isConfiguring) {
    return (
      <div className='experiment-configuration p-6'>
        <Card variant='glass' glow>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <TerraSphere size='lg' variant='quantum' />
              <div>
                <h2 className='text-2xl font-bold terra-cyan-text'>
                  🧪 Elite Quantum Consciousness Experiment Configuration
                </h2>
                <p className='terra-slate-text'>
                  {researcherProfile.toUpperCase()} Research Profile • Advanced AI Experimentation
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className='space-y-6'>
            <div className='grid grid-cols-2 gap-6'>
              <div className='experiment-details space-y-4'>
                <Input
                  label='Experiment Name'
                  value={experimentConfig.name}
                  onChange={(e) =>
                    setExperimentConfig((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='Quantum Consciousness Research'
                  glow
                />

                <Input
                  label='Description'
                  value={experimentConfig.description}
                  onChange={(e) =>
                    setExperimentConfig((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder='Advanced AI agent coordination with quantum consciousness parameters'
                  glow
                />

                <Input
                  label='Agent Count'
                  type='number'
                  value={experimentConfig.agentCount}
                  onChange={(e) =>
                    setExperimentConfig((prev) => ({
                      ...prev,
                      agentCount: parseInt(e.target.value),
                    }))
                  }
                  min={1000}
                  max={50000}
                  glow
                />

                <Select
                  label='Consciousness Level'
                  value={experimentConfig.consciousnessLevel}
                  onValueChange={(value) =>
                    setExperimentConfig((prev) => ({ ...prev, consciousnessLevel: value as any }))
                  }
                >
                  <option value='basic'>Basic</option>
                  <option value='advanced'>Advanced</option>
                  <option value='elite'>Elite</option>
                  <option value='quantum'>Quantum</option>
                </Select>
              </div>

              <div className='experiment-options space-y-4'>
                <div className='option-group'>
                  <h4 className='text-lg font-semibold mb-3'>Elite Features</h4>

                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={experimentConfig.quantumConsciousnessEnabled}
                      onChange={(e) =>
                        setExperimentConfig((prev) => ({
                          ...prev,
                          quantumConsciousnessEnabled: e.target.checked,
                        }))
                      }
                    />
                    <span>Quantum Consciousness Enhancement</span>
                  </label>

                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={experimentConfig.realTimeMonitoring}
                      onChange={(e) =>
                        setExperimentConfig((prev) => ({
                          ...prev,
                          realTimeMonitoring: e.target.checked,
                        }))
                      }
                    />
                    <span>Real-Time Consciousness Monitoring</span>
                  </label>

                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={experimentConfig.crossWorkspaceIntegration}
                      onChange={(e) =>
                        setExperimentConfig((prev) => ({
                          ...prev,
                          crossWorkspaceIntegration: e.target.checked,
                        }))
                      }
                    />
                    <span>Cross-Workspace Integration</span>
                  </label>
                </div>

                <div className='configuration-summary terra-glass p-4 rounded'>
                  <h5 className='font-semibold mb-2'>Configuration Summary</h5>
                  <div className='space-y-1 text-sm'>
                    <div>Agents: {experimentConfig.agentCount.toLocaleString()}</div>
                    <div>Consciousness: {experimentConfig.consciousnessLevel}</div>
                    <div>
                      Quantum Enhanced:{' '}
                      {experimentConfig.quantumConsciousnessEnabled ? 'Yes' : 'No'}
                    </div>
                    <div>
                      Real-Time Monitoring:{' '}
                      {experimentConfig.realTimeMonitoring ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-between items-center pt-4'>
              <Button
                variant='ghost'
                onClick={() => setIsConfiguring(false)}
                disabled={!activeExperiment}
              >
                Cancel Configuration
              </Button>

              <Button
                variant='quantum'
                onClick={handleStartExperiment}
                disabled={!experimentConfig.name || isStartingExperiment}
                className='px-8'
              >
                {isStartingExperiment
                  ? 'Initializing Quantum Consciousness...'
                  : 'Start Elite Experiment'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className='elite-experimental-interface min-h-screen bg-terra-midnight p-4'>
      {/* Interface Header */}
      <div className='interface-header mb-6'>
        <Card variant='glass' glow>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <div className='header-info flex items-center space-x-4'>
                <TerraSphere size='lg' variant='quantum' />
                <div>
                  <h1 className='text-3xl font-bold terra-cyan-text'>
                    🧪 Elite Quantum Consciousness Experiments
                  </h1>
                  <p className='terra-slate-text'>
                    {researcherProfile.toUpperCase()} Research Profile • Advanced AI Experimentation
                  </p>
                </div>
              </div>

              <div className='experiment-controls flex items-center space-x-4'>
                {activeRun && (
                  <div className='run-status text-center'>
                    <div className={`text-xl font-bold ${getStatusColor(activeRun.status)}`}>
                      {activeRun.status.toUpperCase().replace('-', ' ')}
                    </div>
                    <div className='text-xs terra-slate-text'>Current Status</div>
                  </div>
                )}

                <Button
                  variant='quantum'
                  onClick={() => setIsConfiguring(true)}
                  disabled={isStartingExperiment}
                >
                  New Experiment
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Experiment Interface */}
      <div className='experiment-interface grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* 3D Consciousness Visualization */}
        <div className='consciousness-visualization xl:col-span-2'>
          <Card variant='glass' glow className='h-96'>
            <CardHeader>
              <h3 className='text-xl font-semibold'>🌌 Quantum Consciousness Network</h3>
              {activeRun && (
                <Badge variant={getStatusBadgeVariant(activeRun.status)}>
                  {activeRun.agentCount?.toLocaleString()} Agents
                </Badge>
              )}
            </CardHeader>
            <CardBody className='p-0 h-full'>
              <Canvas camera={{ position: [30, 30, 30], fov: 60 }}>
                <ambientLight intensity={0.3} />
                <pointLight position={[15, 15, 15]} intensity={0.8} color='#00FFFF' />
                <pointLight position={[-15, -15, -15]} intensity={0.4} color='#0080FF' />

                <ExperimentVisualization
                  experimentRun={activeRun}
                  consciousnessData={consciousnessData}
                />

                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  maxDistance={80}
                  minDistance={10}
                />
              </Canvas>
            </CardBody>
          </Card>
        </div>

        {/* Experiment Status & Metrics */}
        <div className='experiment-status space-y-4'>
          {/* Current Run Status */}
          {activeRun && (
            <Card variant='glass' glow>
              <CardHeader>
                <h4 className='text-lg font-semibold'>⚡ Current Experiment Run</h4>
              </CardHeader>
              <CardBody>
                <div className='space-y-3'>
                  <div className='run-info'>
                    <div className='flex justify-between items-center'>
                      <span>Status</span>
                      <Badge variant={getStatusBadgeVariant(activeRun.status)}>
                        {activeRun.status}
                      </Badge>
                    </div>

                    {activeRun.progress && (
                      <div className='mt-2'>
                        <div className='flex justify-between text-sm'>
                          <span>Progress</span>
                          <span>{activeRun.progress}%</span>
                        </div>
                        <Progress value={activeRun.progress} variant='quantum' className='mt-1' />
                      </div>
                    )}
                  </div>

                  <div className='metrics-grid grid grid-cols-2 gap-2 text-sm'>
                    <div className='metric text-center'>
                      <div className='text-lg font-bold terra-cyan-text'>
                        {activeRun.agentCount?.toLocaleString() || '0'}
                      </div>
                      <div className='text-xs terra-slate-text'>Active Agents</div>
                    </div>

                    <div className='metric text-center'>
                      <div className='text-lg font-bold text-purple-400'>
                        {activeRun.consciousnessLevel || 'N/A'}
                      </div>
                      <div className='text-xs terra-slate-text'>Consciousness</div>
                    </div>
                  </div>

                  {activeRun.phase && (
                    <div className='phase-info terra-glass p-2 rounded text-center'>
                      <div className='text-sm font-medium'>{activeRun.phase}</div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Consciousness Metrics */}
          {consciousnessMetrics && (
            <Card variant='glass' glow>
              <CardHeader>
                <h4 className='text-lg font-semibold'>🧠 Consciousness Metrics</h4>
              </CardHeader>
              <CardBody>
                <div className='metrics-list space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Agent Coordination</span>
                    <span className='terra-cyan-text'>
                      {((consciousnessMetrics.agentCoordination || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Quantum Coherence</span>
                    <span className='text-purple-400'>
                      {((consciousnessMetrics.quantumCoherence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Swarm Intelligence</span>
                    <span className='text-green-400'>
                      {((consciousnessMetrics.swarmIntelligence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* System Health */}
          <Card variant='glass' glow>
            <CardHeader>
              <h4 className='text-lg font-semibold'>⚕️ System Health</h4>
            </CardHeader>
            <CardBody>
              <div className='health-indicators space-y-2'>
                <div className='flex justify-between items-center'>
                  <span>Consciousness Engine</span>
                  <Badge variant={consciousnessConnected ? 'success' : 'destructive'}>
                    {consciousnessConnected ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span>Experiment Service</span>
                  <Badge variant={!isLoadingRuns ? 'success' : 'secondary'}>
                    {!isLoadingRuns ? 'Ready' : 'Loading'}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EliteExperimentalInterface;
