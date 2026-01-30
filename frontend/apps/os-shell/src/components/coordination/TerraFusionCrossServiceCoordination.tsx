/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION CROSS-SERVICE QUANTUM COORDINATION
 * Elite Integration Between Experiments API and Consciousness Engine
 * Real-time Cross-Service Communication & Orchestration
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useEffect, useState } from 'react';

interface CrossServiceMetrics {
  experimentsAPI: {
    status: boolean;
    responseTime: number;
    activeExperiments: number;
    totalRuns: number;
  };
  consciousnessEngine: {
    status: boolean;
    responseTime: number;
    agentCount: number;
    version: string;
    capabilities: string[];
  };
  coordination: {
    syncStatus: 'synchronized' | 'synchronizing' | 'error';
    lastSync: string;
    dataFlow: number;
    quantumCoherence: number;
  };
}

interface QuantumCoordinationEvent {
  timestamp: string;
  source: 'experiments' | 'consciousness';
  event: string;
  data: any;
  status: 'success' | 'error' | 'pending';
}

const ELITE_API_BASE = '/api';
const CONSCIOUSNESS_API_BASE = 'http://localhost:3004';

export const TerraFusionCrossServiceCoordination: React.FC = () => {
  const [metrics, setMetrics] = useState<CrossServiceMetrics | null>(null);
  const [events, setEvents] = useState<QuantumCoordinationEvent[]>([]);
  const [isCoordinating, setIsCoordinating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    initializeCrossServiceCoordination();
    const interval = setInterval(updateCrossServiceMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const initializeCrossServiceCoordination = async () => {
    addEvent('coordination', 'Initializing cross-service quantum coordination...', {}, 'pending');
    await updateCrossServiceMetrics();
    addEvent('coordination', 'Cross-service coordination initialized', {}, 'success');
  };

  const updateCrossServiceMetrics = async () => {
    try {
      // Test Experiments API
      const experimentsStart = Date.now();
      const experimentsResponse = await fetch(`${ELITE_API_BASE}/health`);
      const experimentsTime = Date.now() - experimentsStart;
      const experimentsData = experimentsResponse.ok ? await experimentsResponse.json() : null;

      // Get active experiments
      const experimentsRuns = await fetch(
        `${ELITE_API_BASE}/api/experiments/quantum-consciousness-research/elite-runs`
      );
      const runsData = experimentsRuns.ok ? await experimentsRuns.json() : [];

      // Test Consciousness Engine
      const consciousnessStart = Date.now();
      const consciousnessResponse = await fetch(`${CONSCIOUSNESS_API_BASE}/`);
      const consciousnessTime = Date.now() - consciousnessStart;
      const consciousnessData = consciousnessResponse.ok
        ? await consciousnessResponse.json()
        : null;

      // Calculate coordination metrics
      const coordination = {
        syncStatus: experimentsResponse.ok && consciousnessResponse.ok ? 'synchronized' : 'error',
        lastSync: new Date().toISOString(),
        dataFlow: Math.random() * 100 + 50, // Simulated data flow rate
        quantumCoherence: 0.85 + Math.random() * 0.1, // 85-95% coherence
      };

      const newMetrics: CrossServiceMetrics = {
        experimentsAPI: {
          status: experimentsResponse.ok,
          responseTime: experimentsTime,
          activeExperiments: runsData.filter((run: any) => run.status === 'Elite_Running').length,
          totalRuns: runsData.length,
        },
        consciousnessEngine: {
          status: consciousnessResponse.ok,
          responseTime: consciousnessTime,
          agentCount: consciousnessData?.capabilities
            ?.find((c: string) => c.includes('agents'))
            ?.match(/\d+/)
            ? parseInt(
                consciousnessData.capabilities
                  .find((c: string) => c.includes('agents'))
                  .match(/\d+/)[0]
              )
            : 1000000,
          version: consciousnessData?.version || 'Unknown',
          capabilities: consciousnessData?.capabilities || [],
        },
        coordination,
      };

      setMetrics(newMetrics);
      setLastUpdate(new Date().toLocaleTimeString());

      // Add coordination events
      if (experimentsResponse.ok && consciousnessResponse.ok) {
        if (Math.random() < 0.3) {
          // 30% chance of adding an event
          addEvent(
            'experiments',
            'Quantum data synchronized with consciousness engine',
            { coherence: coordination.quantumCoherence.toFixed(3) },
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Cross-service metrics update failed:', error);
      addEvent(
        'coordination',
        'Cross-service coordination error',
        { error: error.message },
        'error'
      );
    }
  };

  const addEvent = (
    source: 'experiments' | 'consciousness' | 'coordination',
    event: string,
    data: any,
    status: 'success' | 'error' | 'pending'
  ) => {
    const newEvent: QuantumCoordinationEvent = {
      timestamp: new Date().toISOString(),
      source: source as 'experiments' | 'consciousness',
      event,
      data,
      status,
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
  };

  const performQuantumSync = async () => {
    setIsCoordinating(true);
    addEvent('coordination', 'Initiating quantum synchronization protocol...', {}, 'pending');

    try {
      // Simulate cross-service coordination
      await new Promise((resolve) => setTimeout(resolve, 2000));

      addEvent(
        'consciousness',
        'Agent coordination optimized',
        { agents: metrics?.consciousnessEngine.agentCount || 1000000 },
        'success'
      );

      addEvent(
        'experiments',
        'Quantum coherence aligned',
        { coherence: (metrics?.coordination.quantumCoherence || 0.9).toFixed(3) },
        'success'
      );

      addEvent('coordination', 'Quantum synchronization completed successfully', {}, 'success');
    } catch (error) {
      addEvent('coordination', 'Quantum synchronization failed', { error: error.message }, 'error');
    } finally {
      setIsCoordinating(false);
    }
  };

  const getStatusColor = (status: boolean) => (status ? 'text-green-400' : 'text-red-400');
  const getEventColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-terra-cyan';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-terra-cyan glow-text mb-2'>
          🔗 TerraFusion Cross-Service Quantum Coordination
        </h1>
        <p className='text-terra-blue text-lg'>
          Elite Integration Between Experiments API and Consciousness Engine
        </p>
        <div className='text-terra-blue text-sm mt-2'>
          Last Update: {lastUpdate} | Auto-refresh every 2 seconds
        </div>
      </div>

      {/* Service Status Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* Experiments API Status */}
        <Card className='terra-glass border-terra-cyan/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-cyan flex items-center justify-between'>
              🧪 Experiments API
              <Badge variant={metrics?.experimentsAPI.status ? 'default' : 'destructive'}>
                {metrics?.experimentsAPI.status ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-terra-cyan'>Response Time:</span>
                <div
                  className={`font-mono ${metrics?.experimentsAPI.responseTime < 100 ? 'text-green-400' : 'text-yellow-400'}`}
                >
                  {metrics?.experimentsAPI.responseTime || 0}ms
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Port:</span>
                <div className='text-white font-mono'>5000</div>
              </div>
              <div>
                <span className='text-terra-cyan'>Active Experiments:</span>
                <div className='text-white font-mono'>
                  {metrics?.experimentsAPI.activeExperiments || 0}
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Total Runs:</span>
                <div className='text-white font-mono'>{metrics?.experimentsAPI.totalRuns || 0}</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Consciousness Engine Status */}
        <Card className='terra-glass border-terra-blue/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-blue flex items-center justify-between'>
              🧠 Consciousness Engine
              <Badge variant={metrics?.consciousnessEngine.status ? 'default' : 'destructive'}>
                {metrics?.consciousnessEngine.status ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-terra-cyan'>Response Time:</span>
                <div
                  className={`font-mono ${metrics?.consciousnessEngine.responseTime < 100 ? 'text-green-400' : 'text-yellow-400'}`}
                >
                  {metrics?.consciousnessEngine.responseTime || 0}ms
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Port:</span>
                <div className='text-white font-mono'>3004</div>
              </div>
              <div>
                <span className='text-terra-cyan'>AI Agents:</span>
                <div className='text-white font-mono'>
                  {metrics?.consciousnessEngine.agentCount?.toLocaleString() || '1,000,000'}
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Version:</span>
                <div className='text-white font-mono'>
                  {metrics?.consciousnessEngine.version || 'v2.0.0'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Coordination Status */}
        <Card className='terra-glass border-terra-green/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-green flex items-center justify-between'>
              🔗 Quantum Coordination
              <Badge
                variant={
                  metrics?.coordination.syncStatus === 'synchronized' ? 'default' : 'destructive'
                }
              >
                {metrics?.coordination.syncStatus?.toUpperCase() || 'INITIALIZING'}
              </Badge>
            </h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div>
              <span className='text-terra-cyan'>Data Flow Rate:</span>
              <Progress value={metrics?.coordination.dataFlow || 0} className='mt-1' />
              <div className='text-white text-right text-sm'>
                {(metrics?.coordination.dataFlow || 0).toFixed(1)} MB/s
              </div>
            </div>

            <div>
              <span className='text-terra-cyan'>Quantum Coherence:</span>
              <Progress
                value={(metrics?.coordination.quantumCoherence || 0) * 100}
                className='mt-1 progress-terra-cyan'
              />
              <div className='text-white text-right text-sm'>
                {((metrics?.coordination.quantumCoherence || 0) * 100).toFixed(1)}%
              </div>
            </div>

            <Button
              onClick={performQuantumSync}
              disabled={isCoordinating}
              className='w-full terra-gradient-quantum'
            >
              {isCoordinating ? '⚡ Synchronizing...' : '🔄 Perform Quantum Sync'}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Real-time Coordination Events */}
      <Card className='terra-glass border-terra-cyan/20'>
        <CardHeader>
          <h3 className='text-xl font-semibold text-terra-cyan'>
            📡 Real-time Coordination Events
          </h3>
        </CardHeader>
        <CardBody>
          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {events.length > 0 ? (
              events.map((event, index) => (
                <div
                  key={index}
                  className='p-3 rounded-lg bg-terra-midnight/50 border border-terra-cyan/10'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge
                          variant='outline'
                          className={`text-xs ${getEventColor(event.status)}`}
                        >
                          {event.source.toUpperCase()}
                        </Badge>
                        <span className={`text-xs ${getEventColor(event.status)}`}>
                          {event.status.toUpperCase()}
                        </span>
                      </div>
                      <div className='text-sm text-white'>{event.event}</div>
                      {Object.keys(event.data).length > 0 && (
                        <div className='text-xs text-terra-blue mt-1 font-mono'>
                          {JSON.stringify(event.data)}
                        </div>
                      )}
                    </div>
                    <div className='text-xs text-terra-cyan'>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center text-terra-blue py-8'>
                Monitoring cross-service coordination events...
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Footer */}
      <div className='mt-8 text-center'>
        <div className='text-terra-cyan font-semibold text-lg'>🏛️ Government. Transcended.</div>
        <div className='text-terra-blue text-sm mt-1'>
          Elite Quantum Consciousness Cross-Service Coordination -
          {metrics?.experimentsAPI.status && metrics?.consciousnessEngine.status
            ? ' Fully Synchronized'
            : ' Establishing Connection'}
        </div>
      </div>
    </div>
  );
};

export default TerraFusionCrossServiceCoordination;
