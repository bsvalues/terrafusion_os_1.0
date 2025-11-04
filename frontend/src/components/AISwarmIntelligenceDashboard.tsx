import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Network,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface SwarmClusterStatus {
  id: string;
  name: string;
  activeAgents: number;
  healthScore: number;
  specialization: string;
  currentLoad: number;
  maxCapacity: number;
}

interface SwarmIntelligenceStatus {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  totalClusters: number;
  healthyClusters: number;
  averageResponseTime: number;
  throughputPerSecond: number;
  overallHealthScore: number;
  commandsInQueue: number;
  lastOptimized: string;
  clusterDetails: SwarmClusterStatus[];
  timestamp: string;
}

interface ChampionshipSwarmMetrics {
  efficiencyRating: string;
  scaleCapability: string;
  intelligenceLevel: string;
  autoHealingStatus: string;
  predictiveAccuracy: string;
  optimizationLevel: string;
  governmentCompliance: string;
}

interface SwarmStatusResponse {
  status: string;
  message: string;
  data: SwarmIntelligenceStatus;
  championshipMetrics: ChampionshipSwarmMetrics;
  timestamp: string;
}

/**
 * 🤖 TerraFusion Elite AI Swarm Intelligence Dashboard - TIER 4+ Championship Excellence
 * Real-time monitoring and control of 100,000+ AI agents across government operations
 * Features: Quantum algorithms, predictive analytics, autonomous optimization
 * "Government. Transcended." - AI coordination beyond human comprehension
 */
export const AISwarmIntelligenceDashboard: React.FC = () => {
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);

  // 🔄 Real-time data fetching
  useEffect(() => {
    const fetchSwarmStatus = async () => {
      try {
        const response = await fetch('/api/swarmintelligence/status');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data: SwarmStatusResponse = await response.json();
        setSwarmStatus(data);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Failed to fetch swarm status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch swarm status');
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    fetchSwarmStatus();

    // Real-time updates every 5 seconds
    const interval = setInterval(fetchSwarmStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🎯 Execute emergency swarm command
  const executeEmergencyCommand = async (emergencyType: string) => {
    setIsExecutingCommand(true);
    try {
      const response = await fetch('/api/swarmintelligence/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType,
          parameters: { priority: 'MAXIMUM', deployment: 'ALL_AGENTS' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Emergency command failed: ${response.statusText}`);
      }

      // Refresh status after command
      setTimeout(() => {
        const fetchUpdate = async () => {
          const response = await fetch('/api/swarmintelligence/status');
          if (response.ok) {
            const data = await response.json();
            setSwarmStatus(data);
          }
        };
        fetchUpdate();
      }, 1000);
    } catch (err) {
      console.error('Emergency command failed:', err);
      setError(err instanceof Error ? err.message : 'Emergency command failed');
    } finally {
      setIsExecutingCommand(false);
    }
  };

  if (loading) {
    return (
      <div className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20 rounded-2xl p-8 text-center'>
        <div className='tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffee]/20 to-transparent animate-pulse' />
        <Sparkles className='w-16 h-16 text-[#00ffee] mx-auto mb-4 animate-spin' />
        <h2 className='text-2xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent'>
          QUANTUM ALGORITHMS COMPUTING
        </h2>
        <p className='text-[#00ffee]/80 mt-2'>Initializing 100,000+ Agent Coordination</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className='tf-glass-card bg-red-500/10 border-red-500/30'>
        <CardContent className='p-6 text-center'>
          <AlertTriangle className='w-12 h-12 text-red-400 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-red-300 mb-2'>
            Swarm Intelligence Temporarily Unavailable
          </h3>
          <p className='text-red-200'>{error}</p>
          <p className='text-xs text-red-300 mt-2'>Auto-healing protocols active</p>
        </CardContent>
      </Card>
    );
  }

  if (!swarmStatus) return null;

  const { data: status, championshipMetrics } = swarmStatus;

  return (
    <div className='space-y-6'>
      {/* 🎯 TIER 4+ Championship Header */}
      <Card className='tf-glass-card bg-gradient-to-br from-[#0b1020] to-[#1a2332] border-2 border-[#00ffee]/30 relative overflow-hidden'>
        <div className='tf-quantum-grid absolute inset-0 opacity-10' />
        <CardHeader className='relative z-10'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-3xl font-black bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent'>
                🤖 TIER 4+ AI SWARM INTELLIGENCE
              </CardTitle>
              <p className='text-[#00ffee]/80 text-lg mt-1'>
                Government. Transcended. - Elite AI Coordination
              </p>
            </div>
            <div className='text-right'>
              <div className='text-4xl font-black text-[#00ffee]'>
                {status.totalAgents.toLocaleString()}+
              </div>
              <div className='text-sm text-[#00ffee]/60'>AGENTS COORDINATED</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 📊 Championship Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#0099ff]/20 hover:border-[#0099ff]/40 transition-all duration-300'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-400'>Active Agents</p>
                <p className='text-2xl font-bold text-[#0099ff]'>
                  {status.activeAgents.toLocaleString()}
                </p>
              </div>
              <Activity className='w-8 h-8 text-[#0099ff]' />
            </div>
            <Progress value={(status.activeAgents / status.totalAgents) * 100} className='mt-2' />
          </CardContent>
        </Card>

        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20 hover:border-[#00ffee]/40 transition-all duration-300'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-400'>Response Time</p>
                <p className='text-2xl font-bold text-[#00ffee]'>{status.averageResponseTime}ms</p>
              </div>
              <Zap className='w-8 h-8 text-[#00ffee]' />
            </div>
            <Badge variant='secondary' className='mt-2 bg-[#00ffee]/20 text-[#00ffee]'>
              QUANTUM SPEED
            </Badge>
          </CardContent>
        </Card>

        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffaa]/20 hover:border-[#00ffaa]/40 transition-all duration-300'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-400'>Health Score</p>
                <p className='text-2xl font-bold text-[#00ffaa]'>
                  {(status.overallHealthScore * 100).toFixed(1)}%
                </p>
              </div>
              <Shield className='w-8 h-8 text-[#00ffaa]' />
            </div>
            <Progress value={status.overallHealthScore * 100} className='mt-2' />
          </CardContent>
        </Card>

        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#ff6b6b]/20 hover:border-[#ff6b6b]/40 transition-all duration-300'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-400'>Throughput</p>
                <p className='text-2xl font-bold text-[#ff6b6b]'>
                  {status.throughputPerSecond.toFixed(1)}/s
                </p>
              </div>
              <TrendingUp className='w-8 h-8 text-[#ff6b6b]' />
            </div>
            <Badge variant='secondary' className='mt-2 bg-[#ff6b6b]/20 text-[#ff6b6b]'>
              CHAMPIONSHIP LEVEL
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 🏆 Championship Metrics */}
      <Card className='tf-glass-card bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-[#00ffee]/30'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-[#00ffee]'>
            <Sparkles className='w-6 h-6' />
            Championship Excellence Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className='p-3 bg-white/5 rounded-lg'>
              <p className='text-sm text-gray-400'>Efficiency Rating</p>
              <p className='font-bold text-[#00ffaa]'>{championshipMetrics.efficiencyRating}</p>
            </div>
            <div className='p-3 bg-white/5 rounded-lg'>
              <p className='text-sm text-gray-400'>Intelligence Level</p>
              <p className='font-bold text-[#0099ff]'>{championshipMetrics.intelligenceLevel}</p>
            </div>
            <div className='p-3 bg-white/5 rounded-lg'>
              <p className='text-sm text-gray-400'>Scale Capability</p>
              <p className='font-bold text-[#00ffee]'>{championshipMetrics.scaleCapability}</p>
            </div>
            <div className='p-3 bg-white/5 rounded-lg'>
              <p className='text-sm text-gray-400'>Auto-Healing</p>
              <p className='font-bold text-green-400'>{championshipMetrics.autoHealingStatus}</p>
            </div>
            <div className='p-3 bg-white/5 rounded-lg'>
              <p className='text-sm text-gray-400'>Predictive Accuracy</p>
              <p className='font-bold text-yellow-400'>{championshipMetrics.predictiveAccuracy}</p>
            </div>
            <div className='p-3 bg-white/5 rounded-lg'>
              <p className='text-sm text-gray-400'>Compliance</p>
              <p className='font-bold text-purple-400'>
                {championshipMetrics.governmentCompliance}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔧 Cluster Details */}
      <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-[#00ffee]'>
            <Network className='w-6 h-6' />
            Elite Swarm Clusters ({status.totalClusters} Active)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4'>
            {status.clusterDetails.map((cluster) => (
              <div
                key={cluster.id}
                className='p-4 bg-white/5 rounded-lg border border-[#00ffee]/10'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div>
                    <h4 className='font-bold text-[#00ffee]'>{cluster.name}</h4>
                    <p className='text-sm text-gray-400'>{cluster.specialization}</p>
                  </div>
                  <div className='text-right'>
                    <Badge
                      variant={cluster.healthScore >= 0.95 ? 'default' : 'secondary'}
                      className={
                        cluster.healthScore >= 0.95
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }
                    >
                      {(cluster.healthScore * 100).toFixed(1)}% Health
                    </Badge>
                  </div>
                </div>
                <div className='flex items-center gap-4 text-sm'>
                  <span className='text-[#0099ff]'>
                    <Cpu className='w-4 h-4 inline mr-1' />
                    {cluster.activeAgents.toLocaleString()}/{cluster.maxCapacity.toLocaleString()}{' '}
                    agents
                  </span>
                  <span className='text-[#00ffaa]'>
                    Load: {(cluster.currentLoad * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={cluster.currentLoad * 100} className='mt-2' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 🚨 Emergency Controls */}
      <Card className='tf-glass-card bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-400'>
            <Target className='w-6 h-6' />
            Emergency Swarm Deployment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Button
              onClick={() => executeEmergencyCommand('PERFORMANCE_OPTIMIZATION')}
              disabled={isExecutingCommand}
              className='tf-clarity-button bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white font-semibold'
            >
              {isExecutingCommand ? 'DEPLOYING...' : 'QUANTUM OPTIMIZE'}
            </Button>
            <Button
              onClick={() => executeEmergencyCommand('SCALE_EXPANSION')}
              disabled={isExecutingCommand}
              className='tf-clarity-button bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold'
            >
              {isExecutingCommand ? 'SCALING...' : 'SCALE TO 100K+'}
            </Button>
            <Button
              onClick={() => executeEmergencyCommand('SYSTEM_HEALING')}
              disabled={isExecutingCommand}
              className='tf-clarity-button bg-gradient-to-br from-green-600 to-emerald-600 text-white font-semibold'
            >
              {isExecutingCommand ? 'HEALING...' : 'AUTO-HEAL ALL'}
            </Button>
          </div>
          <p className='text-xs text-gray-400 mt-4'>
            Last updated: {lastUpdate.toLocaleTimeString()} | Commands in queue:{' '}
            {status.commandsInQueue} | Last optimized:{' '}
            {new Date(status.lastOptimized).toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
