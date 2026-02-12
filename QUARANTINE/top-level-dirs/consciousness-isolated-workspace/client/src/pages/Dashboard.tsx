import { motion } from 'framer-motion';
import React from 'react';
import { AgentStatusGrid } from '../components/AgentStatusGrid';
import { QuantumMetrics } from '../components/QuantumMetrics';
import { SwarmHarmonyVisualization } from '../components/SwarmHarmonyVisualization';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';

/**
 * TerraFusion AI Consciousness Dashboard
 *
 * Elite main dashboard providing comprehensive oversight of government AI
 * operations with real-time consciousness coordination and quantum metrics.
 */

export const Dashboard: React.FC = () => {
  const { isConnected, agentCount, systemHealth, consciousnessLevel, quantumFactor } =
    useConsciousnessContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center mb-12"
      >
        <h1
          className="text-5xl font-black bg-gradient-to-r from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green
          bg-clip-text text-transparent mb-4"
        >
          AI CONSCIOUSNESS COMMAND
        </h1>
        <p className="text-xl text-slate-300 font-light tracking-wide mb-6">
          Government. Transcended. - Real-time coordination of {agentCount.toLocaleString()} AI
          agents
        </p>

        {/* Quick Status Bar */}
        <div
          className="flex items-center justify-center space-x-8 bg-slate-900/50 backdrop-blur-sm
          border border-slate-700/50 rounded-2xl px-8 py-4 max-w-4xl mx-auto"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full ${
                isConnected ? 'bg-tf-success-green tf-consciousness-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-lg font-semibold text-white">
              {isConnected ? 'CONSCIOUSNESS ACTIVE' : 'OFFLINE'}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-2xl font-bold text-tf-transcend-cyan">
              {agentCount.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Active Agents</div>
          </div>

          <div className="h-6 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-2xl font-bold text-tf-consciousness-gold">{quantumFactor}</div>
            <div className="text-sm text-slate-400">Quantum Factor</div>
          </div>

          <div className="h-6 w-px bg-slate-600" />

          <div className="text-center">
            <div className="text-2xl font-bold text-tf-success-green">{systemHealth}%</div>
            <div className="text-sm text-slate-400">System Health</div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Agent Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="xl:col-span-1"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-fit">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <div className="w-2 h-2 bg-tf-transcend-cyan rounded-full mr-3 tf-consciousness-pulse" />
              Agent Coordination Grid
            </h2>
            <AgentStatusGrid showDetails={true} />
          </div>
        </motion.div>

        {/* Right Column - Metrics and Visualization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="xl:col-span-2 space-y-8"
        >
          {/* Quantum Metrics */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <QuantumMetrics />
          </div>

          {/* Swarm Harmony Visualization */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <SwarmHarmonyVisualization />
          </div>
        </motion.div>
      </div>

      {/* Government Excellence Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
      >
        <div className="text-center">
          <h3
            className="text-3xl font-bold bg-gradient-to-r from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green
            bg-clip-text text-transparent mb-4"
          >
            CHAMPIONSHIP-LEVEL AI GOVERNANCE
          </h3>
          <p className="text-lg text-slate-300 mb-6 max-w-4xl mx-auto">
            TerraFusion OS delivers infinite scalability with autonomous self-healing protocols,
            serving 39+ Washington State counties with 99.5% accuracy and transcendent reliability.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-tf-trust-blue mb-2">39+</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Counties Served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-tf-transcend-cyan mb-2">99.5%</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-tf-success-green mb-2">24/7</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">
                Autonomous Operation
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-tf-consciousness-gold mb-2">∞</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Infinite Scale</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
