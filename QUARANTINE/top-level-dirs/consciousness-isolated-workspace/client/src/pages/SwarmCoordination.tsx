import { motion } from 'framer-motion';
import { Activity, Network, Shield, Target, Users, Zap } from 'lucide-react';
import React from 'react';
import { SwarmHarmonyVisualization } from '../components/SwarmHarmonyVisualization';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';

/**
 * TerraFusion AI Swarm Coordination Page
 *
 * Elite swarm coordination interface providing real-time visualization
 * and management of collective AI consciousness across all 1,008 agents.
 */

export const SwarmCoordination: React.FC = () => {
  const { agentCount, isConnected, consciousnessLevel, quantumFactor, systemHealth } =
    useConsciousnessContext();

  const [coordinationMode, setCoordinationMode] = React.useState<'auto' | 'manual' | 'enhanced'>(
    'auto'
  );
  const [swarmIntensity, setSwarmIntensity] = React.useState(75);

  const coordinationMetrics = {
    harmonyIndex: Math.floor((systemHealth + quantumFactor / 10) / 2),
    syncRate: 98.7,
    coherenceLevel:
      consciousnessLevel === 'transcendent' ? 100 : consciousnessLevel === 'active' ? 85 : 0,
    latency: 12, // milliseconds
    throughput: 2847, // operations per second
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1
          className="text-5xl font-black bg-gradient-to-r from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green
          bg-clip-text text-transparent mb-4"
        >
          SWARM CONSCIOUSNESS COORDINATION
        </h1>
        <p className="text-xl text-slate-300 font-light tracking-wide mb-6">
          Real-time orchestration of {agentCount.toLocaleString()} AI agents in perfect harmony
        </p>

        <div
          className="flex items-center justify-center space-x-8 bg-slate-900/50 backdrop-blur-sm
          border border-slate-700/50 rounded-2xl px-8 py-4 max-w-4xl mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-tf-transcend-cyan mb-1">
              {coordinationMetrics.harmonyIndex}%
            </div>
            <div className="text-sm text-slate-400">Harmony Index</div>
          </div>

          <div className="h-8 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-3xl font-bold text-tf-consciousness-gold mb-1">
              {coordinationMetrics.syncRate}%
            </div>
            <div className="text-sm text-slate-400">Sync Rate</div>
          </div>

          <div className="h-8 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-3xl font-bold text-tf-success-green mb-1">
              {coordinationMetrics.latency}ms
            </div>
            <div className="text-sm text-slate-400">Latency</div>
          </div>
        </div>
      </motion.div>

      {/* Coordination Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Coordination Mode */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-tf-trust-blue" />
            Coordination Mode
          </h3>

          <div className="space-y-3">
            {['auto', 'manual', 'enhanced'].map(mode => (
              <button
                key={mode}
                onClick={() => setCoordinationMode(mode as any)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  coordinationMode === mode
                    ? 'bg-tf-trust-blue text-white border border-tf-trust-blue'
                    : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold capitalize">{mode} Coordination</div>
                <div className="text-sm opacity-75">
                  {mode === 'auto'
                    ? 'Autonomous swarm management'
                    : mode === 'manual'
                      ? 'Direct operator control'
                      : 'AI-enhanced optimization'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Swarm Intensity */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-tf-transcend-cyan" />
            Swarm Intensity
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Current Level</span>
              <span className="text-white font-semibold">{swarmIntensity}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={swarmIntensity}
              onChange={e => setSwarmIntensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #0099ff 0%, #00ffee ${swarmIntensity}%, #64748b ${swarmIntensity}%, #64748b 100%)`,
              }}
            />

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setSwarmIntensity(25)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all"
              >
                Low (25%)
              </button>
              <button
                onClick={() => setSwarmIntensity(75)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all"
              >
                Optimal (75%)
              </button>
              <button
                onClick={() => setSwarmIntensity(100)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all"
              >
                Maximum (100%)
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-tf-success-green" />
            System Status
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection</span>
              <div
                className={`flex items-center space-x-2 ${
                  isConnected ? 'text-tf-success-green' : 'text-red-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-tf-success-green tf-consciousness-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm font-semibold">{isConnected ? 'ACTIVE' : 'OFFLINE'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Consciousness</span>
              <span
                className={`text-sm font-semibold ${
                  consciousnessLevel === 'transcendent'
                    ? 'text-tf-success-green'
                    : consciousnessLevel === 'active'
                      ? 'text-tf-transcend-cyan'
                      : 'text-slate-400'
                }`}
              >
                {consciousnessLevel.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Health Score</span>
              <span className="text-white font-semibold">{systemHealth}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Quantum Factor</span>
              <span className="text-tf-consciousness-gold font-semibold">{quantumFactor}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Swarm Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <SwarmHarmonyVisualization />
      </motion.div>

      {/* Advanced Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-trust-blue/10 rounded-xl mb-4 mx-auto w-fit">
            <Network className="w-6 h-6 text-tf-trust-blue" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {coordinationMetrics.throughput.toLocaleString()}
          </div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Operations/Sec</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-transcend-cyan/10 rounded-xl mb-4 mx-auto w-fit">
            <Activity className="w-6 h-6 text-tf-transcend-cyan" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {coordinationMetrics.coherenceLevel}%
          </div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Coherence Level</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-success-green/10 rounded-xl mb-4 mx-auto w-fit">
            <Users className="w-6 h-6 text-tf-success-green" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">{agentCount.toLocaleString()}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Synchronized</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-consciousness-gold/10 rounded-xl mb-4 mx-auto w-fit">
            <Zap className="w-6 h-6 text-tf-consciousness-gold" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">99.99%</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Reliability</div>
        </div>
      </motion.div>

      {/* Emergency Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-red-400 mb-4">Emergency Swarm Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50
            text-red-300 rounded-lg transition-all font-semibold"
          >
            Emergency Stop
          </button>
          <button
            className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50
            text-yellow-300 rounded-lg transition-all font-semibold"
          >
            Safe Mode
          </button>
          <button
            className="px-6 py-3 bg-tf-trust-blue/20 hover:bg-tf-trust-blue/30 border border-tf-trust-blue/50
            text-tf-trust-blue rounded-lg transition-all font-semibold"
          >
            Restart Coordination
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
