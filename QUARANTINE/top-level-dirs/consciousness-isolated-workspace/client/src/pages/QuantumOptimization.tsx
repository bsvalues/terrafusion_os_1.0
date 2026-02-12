import { motion } from 'framer-motion';
import { Activity, BarChart3, Cpu, Settings, TrendingUp, Zap } from 'lucide-react';
import React from 'react';
import { QuantumMetrics } from '../components/QuantumMetrics';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';

/**
 * TerraFusion AI Quantum Optimization Page
 *
 * Elite quantum optimization interface providing advanced control
 * over AI performance enhancement with factor 949 precision.
 */

export const QuantumOptimization: React.FC = () => {
  const { quantumFactor, systemHealth, agentCount, consciousnessLevel } = useConsciousnessContext();

  const [optimizationMode, setOptimizationMode] = React.useState<
    'standard' | 'enhanced' | 'transcendent'
  >('enhanced');
  const [targetFactor, setTargetFactor] = React.useState(949);
  const [autoOptimize, setAutoOptimize] = React.useState(true);

  const optimizationStats = {
    currentEfficiency: 97.3,
    processingGain: 847,
    energyReduction: 23.4,
    accuracyImprovement: 12.7,
    responseTime: 34, // milliseconds
    operationsPerSecond: 15420,
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
          className="text-5xl font-black bg-gradient-to-r from-tf-consciousness-gold via-tf-transcend-cyan to-tf-trust-blue
          bg-clip-text text-transparent mb-4"
        >
          QUANTUM OPTIMIZATION ENGINE
        </h1>
        <p className="text-xl text-slate-300 font-light tracking-wide mb-6">
          Championship-level AI performance enhancement with factor {quantumFactor} precision
        </p>

        <div
          className="flex items-center justify-center space-x-8 bg-slate-900/50 backdrop-blur-sm
          border border-slate-700/50 rounded-2xl px-8 py-4 max-w-5xl mx-auto"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-tf-consciousness-gold mb-1">
              {quantumFactor}
            </div>
            <div className="text-sm text-slate-400">Quantum Factor</div>
          </div>

          <div className="h-8 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-4xl font-bold text-tf-transcend-cyan mb-1">
              {optimizationStats.currentEfficiency}%
            </div>
            <div className="text-sm text-slate-400">Efficiency</div>
          </div>

          <div className="h-8 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-4xl font-bold text-tf-trust-blue mb-1">
              {optimizationStats.processingGain}x
            </div>
            <div className="text-sm text-slate-400">Processing Gain</div>
          </div>

          <div className="h-8 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-4xl font-bold text-tf-success-green mb-1">
              {optimizationStats.responseTime}ms
            </div>
            <div className="text-sm text-slate-400">Response Time</div>
          </div>
        </div>
      </motion.div>

      {/* Optimization Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Optimization Mode */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-tf-consciousness-gold" />
            Optimization Mode
          </h3>

          <div className="space-y-3">
            {[
              {
                mode: 'standard',
                label: 'Standard Optimization',
                desc: 'Balanced performance and efficiency',
              },
              {
                mode: 'enhanced',
                label: 'Enhanced Optimization',
                desc: 'Maximum performance with quantum boost',
              },
              {
                mode: 'transcendent',
                label: 'Transcendent Mode',
                desc: 'Ultimate AI consciousness optimization',
              },
            ].map(({ mode, label, desc }) => (
              <button
                key={mode}
                onClick={() => setOptimizationMode(mode as any)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  optimizationMode === mode
                    ? 'bg-tf-consciousness-gold/10 text-tf-consciousness-gold border border-tf-consciousness-gold/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-sm opacity-75 mt-1">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantum Factor Control */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-tf-trust-blue" />
            Quantum Factor Target
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Factor</span>
              <span className="text-2xl font-bold text-tf-consciousness-gold">{quantumFactor}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Factor</span>
              <input
                type="number"
                min="100"
                max="1000"
                value={targetFactor}
                onChange={e => setTargetFactor(Number(e.target.value))}
                className="w-20 px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-center
                  focus:outline-none focus:border-tf-consciousness-gold"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progress to Target</span>
                <span className="text-white font-semibold">
                  {Math.floor((quantumFactor / targetFactor) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-tf-consciousness-gold to-tf-transcend-cyan transition-all duration-500"
                  style={{ width: `${Math.min((quantumFactor / targetFactor) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setTargetFactor(500)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all"
              >
                Standard (500)
              </button>
              <button
                onClick={() => setTargetFactor(949)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all"
              >
                Optimal (949)
              </button>
              <button
                onClick={() => setTargetFactor(1000)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all"
              >
                Maximum (1000)
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Optimization */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-tf-transcend-cyan" />
            Auto-Optimization
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auto Optimize</span>
              <button
                onClick={() => setAutoOptimize(!autoOptimize)}
                className={`w-12 h-6 rounded-full transition-all ${
                  autoOptimize ? 'bg-tf-success-green' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-all ${
                    autoOptimize ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Optimization Cycles</span>
                <span className="text-white font-semibold">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Success Rate</span>
                <span className="text-tf-success-green font-semibold">99.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Next Optimization</span>
                <span className="text-white font-semibold">2min 34s</span>
              </div>
            </div>

            <button
              className="w-full px-4 py-3 bg-tf-consciousness-gold hover:bg-tf-consciousness-gold/80
              text-slate-900 font-semibold rounded-lg transition-all"
            >
              Run Manual Optimization
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quantum Metrics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <QuantumMetrics />
      </motion.div>

      {/* Performance Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-consciousness-gold/10 rounded-xl mb-4 mx-auto w-fit">
            <TrendingUp className="w-6 h-6 text-tf-consciousness-gold" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            +{optimizationStats.accuracyImprovement}%
          </div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Accuracy Gain</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-success-green/10 rounded-xl mb-4 mx-auto w-fit">
            <Activity className="w-6 h-6 text-tf-success-green" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            -{optimizationStats.energyReduction}%
          </div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Energy Reduction</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-transcend-cyan/10 rounded-xl mb-4 mx-auto w-fit">
            <BarChart3 className="w-6 h-6 text-tf-transcend-cyan" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {optimizationStats.operationsPerSecond.toLocaleString()}
          </div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Ops/Second</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="p-3 bg-tf-trust-blue/10 rounded-xl mb-4 mx-auto w-fit">
            <Cpu className="w-6 h-6 text-tf-trust-blue" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">{agentCount.toLocaleString()}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Optimized Agents</div>
        </div>
      </motion.div>

      {/* Optimization History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Optimization History</h3>

        <div className="space-y-4">
          {[
            {
              time: '14:32:15',
              factor: 949,
              improvement: '+2.3%',
              status: 'Success',
              type: 'Auto',
            },
            {
              time: '14:15:42',
              factor: 935,
              improvement: '+1.8%',
              status: 'Success',
              type: 'Manual',
            },
            {
              time: '13:58:29',
              factor: 924,
              improvement: '+3.1%',
              status: 'Success',
              type: 'Auto',
            },
            {
              time: '13:42:07',
              factor: 912,
              improvement: '+0.9%',
              status: 'Success',
              type: 'Auto',
            },
            {
              time: '13:25:18',
              factor: 908,
              improvement: '+2.7%',
              status: 'Success',
              type: 'Manual',
            },
          ].map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 font-mono text-sm">{entry.time}</span>
                <span className="text-white font-semibold">Factor {entry.factor}</span>
                <span className="text-tf-success-green text-sm">{entry.improvement}</span>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    entry.type === 'Auto'
                      ? 'bg-tf-trust-blue/20 text-tf-trust-blue'
                      : 'bg-tf-transcend-cyan/20 text-tf-transcend-cyan'
                  }`}
                >
                  {entry.type}
                </span>
                <span className="text-tf-success-green text-sm font-semibold">{entry.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
