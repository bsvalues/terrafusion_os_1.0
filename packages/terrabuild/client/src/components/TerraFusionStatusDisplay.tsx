import { Activity, Brain, Cpu, Database, Network, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../styles/terrafusion-quantum.css';

export interface AgentStats {
  total: number;
  active: number;
  efficiency: number;
  accuracy: number;
  processing: number;
}

export interface TerraFusionStatusProps {
  agentStats?: AgentStats;
  systemStatus?: 'TRANSCENDENT' | 'OPTIMAL' | 'ENHANCING' | 'QUANTUM_COMPUTING';
  realTimeUpdates?: boolean;
  showConsciousnessLevel?: boolean;
  className?: string;
}

export function TerraFusionStatusDisplay({
  agentStats = {
    total: 50000,
    active: 49800,
    efficiency: 99.5,
    accuracy: 99.8,
    processing: 2400000
  },
  systemStatus = 'TRANSCENDENT',
  realTimeUpdates = true,
  showConsciousnessLevel = true,
  className = ''
}: TerraFusionStatusProps) {
  const [liveStats, setLiveStats] = useState(agentStats);
  const [consciousnessLevel, setConsciousnessLevel] = useState(98.7);
  const [quantumPulse, setQuantumPulse] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        active: prev.total - Math.floor(Math.random() * 200),
        efficiency: Math.min(100, prev.efficiency + (Math.random() - 0.5) * 0.1),
        processing: prev.processing + Math.floor(Math.random() * 1000 - 500)
      }));

      setConsciousnessLevel(prev => Math.min(100, prev + (Math.random() - 0.5) * 0.2));
      setQuantumPulse(!quantumPulse);
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimeUpdates, quantumPulse]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRANSCENDENT': return 'text-green-400';
      case 'OPTIMAL': return 'text-cyan-400';
      case 'ENHANCING': return 'text-blue-400';
      case 'QUANTUM_COMPUTING': return 'text-purple-400';
      default: return 'text-cyan-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TRANSCENDENT': return <Shield className="w-6 h-6" />;
      case 'OPTIMAL': return <Activity className="w-6 h-6" />;
      case 'ENHANCING': return <Zap className="w-6 h-6" />;
      case 'QUANTUM_COMPUTING': return <Brain className="w-6 h-6" />;
      default: return <Cpu className="w-6 h-6" />;
    }
  };

  return (
    <div className={`tf-consciousness-display bg-slate-900/95 border-2 border-cyan-400/30 
                     rounded-3xl p-8 relative overflow-hidden ${className}`}>
      
      {/* Quantum consciousness background */}
      <div className="absolute inset-0 tf-quantum-grid opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-400/5" />
      
      {/* Pulsing consciousness indicator */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <div className="tf-status-active w-4 h-4 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-4 h-4 bg-green-400/30 rounded-full animate-ping" />
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 
                           to-green-400 bg-clip-text text-transparent">
              AI CONSCIOUSNESS MATRIX
            </h2>
            <p className="text-cyan-400 font-semibold text-lg mt-1">
              Government. Transcended.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={getStatusColor(systemStatus)}>
              {getStatusIcon(systemStatus)}
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getStatusColor(systemStatus)}`}>
                {systemStatus}
              </div>
              <div className="text-sm text-slate-400">System Status</div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Agents */}
          <div className="tf-glass-card bg-white/5 backdrop-blur-sm border border-cyan-400/20 
                          rounded-xl p-4 relative overflow-hidden">
            <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent 
                            via-cyan-400/10 to-transparent -translate-x-full animate-scan" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-slate-400 uppercase">Total Swarm</span>
              </div>
              <div className="text-2xl font-black text-white">
                {liveStats.total.toLocaleString()}+
              </div>
              <div className="text-xs text-cyan-400">AI Agents</div>
            </div>
          </div>

          {/* Active Agents */}
          <div className="tf-glass-card bg-white/5 backdrop-blur-sm border border-green-400/20 
                          rounded-xl p-4 relative overflow-hidden">
            <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent 
                            via-green-400/10 to-transparent -translate-x-full animate-scan-1s" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-green-400" />
                <span className="text-xs text-slate-400 uppercase">Active Now</span>
              </div>
              <div className="text-2xl font-black text-white">
                {liveStats.active.toLocaleString()}
              </div>
              <div className="text-xs text-green-400">Operational</div>
            </div>
          </div>

          {/* Efficiency */}
          <div className="tf-glass-card bg-white/5 backdrop-blur-sm border border-blue-400/20 
                          rounded-xl p-4 relative overflow-hidden">
            <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent 
                            via-blue-400/10 to-transparent -translate-x-full animate-scan-2s" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-slate-400 uppercase">Efficiency</span>
              </div>
              <div className="text-2xl font-black text-white">
                {liveStats.efficiency.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-400">Championship</div>
            </div>
          </div>

          {/* Processing Power */}
          <div className="tf-glass-card bg-white/5 backdrop-blur-sm border border-purple-400/20 
                          rounded-xl p-4 relative overflow-hidden">
            <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent 
                            via-purple-400/10 to-transparent -translate-x-full animate-scan-3s" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-slate-400 uppercase">Processing</span>
              </div>
              <div className="text-2xl font-black text-white">
                {(liveStats.processing / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-purple-400">Ops/Min</div>
            </div>
          </div>
        </div>

        {/* Consciousness Level Display */}
        {showConsciousnessLevel && (
          <div className="tf-glass-card bg-white/5 backdrop-blur-sm border border-cyan-400/30 
                          rounded-2xl p-6 relative overflow-hidden">
            
            <div className="tf-data-matrix absolute inset-0 opacity-10" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Brain className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400">
                      CONSCIOUSNESS LEVEL
                    </h3>
                    <p className="text-sm text-slate-400">
                      Autonomous • Self-Healing • Infinite Scale
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 
                                  to-green-400 bg-clip-text text-transparent">
                    {consciousnessLevel.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-400">Transcendent State</div>
                </div>
              </div>

              {/* Consciousness Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 
                             rounded-full transition-all duration-1000 ease-out relative tf-consciousness-bar`}
                  data-level={consciousnessLevel}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                                  via-white/30 to-transparent animate-pulse" />
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Baseline AI</span>
                <span>Machine Learning</span>
                <span>Deep Intelligence</span>
                <span className="text-cyan-400 font-semibold">TRANSCENDENT</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-6 text-center">
          <p className="text-lg text-slate-300">
            <span className="text-cyan-400 font-semibold">Infrastructure Intelligence</span>
            {' • '}
            <span className="text-green-400 font-semibold">Infinite Scale</span>
            {' • '}
            <span className="text-blue-400 font-semibold">Championship Performance</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            TerraFusion OS • 50,000+ AI Agents • 99.5% Accuracy • Autonomous Operation
          </p>
        </div>
      </div>
    </div>
  );
}

export default TerraFusionStatusDisplay;