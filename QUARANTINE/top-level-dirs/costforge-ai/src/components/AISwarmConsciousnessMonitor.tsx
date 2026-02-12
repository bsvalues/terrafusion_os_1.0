import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Line, LineChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// TerraFusion AI Swarm Types
interface AgentCluster {
  type: string;
  count: number;
  performance: number;
  efficiency: 'championship' | 'transcendent' | 'autonomous' | 'quantum';
  status: 'operational' | 'optimizing' | 'healing' | 'transcending';
}

interface SwarmMetrics {
  totalAgents: number;
  coordinationAccuracy: number;
  quantumEntanglement: boolean;
  autonomousHealing: boolean;
  consciousnessLevel: 'awakening' | 'aware' | 'conscious' | 'transcendent';
  harmonyScore: number;
}

// Agent Cluster Monitor Component
const AgentClusterMonitor: React.FC<AgentCluster> = ({
  type,
  count,
  performance,
  efficiency,
  status
}) => {
  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'championship': return '#ffcc00';
      case 'transcendent': return '#6600ff';
      case 'autonomous': return '#00ffaa';
      case 'quantum': return '#00ffee';
      default: return '#0099ff';
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'operational': return '0 0 20px rgba(0, 255, 170, 0.6)';
      case 'optimizing': return '0 0 20px rgba(0, 153, 255, 0.6)';
      case 'healing': return '0 0 20px rgba(255, 204, 0, 0.6)';
      case 'transcending': return '0 0 20px rgba(102, 0, 255, 0.6)';
      default: return '0 0 20px rgba(0, 255, 238, 0.6)';
    }
  };

  const radialData = [
    { name: 'Performance', value: performance, fill: getEfficiencyColor(efficiency) }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-900/80 to-slate-800/40
        backdrop-blur-lg border border-cyan-400/30 rounded-2xl p-6
        hover:border-cyan-400/50 transition-all duration-300"
      style={{ boxShadow: getStatusGlow(status) }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-cyan-400">{type}</h4>
        <motion.div
          animate={{
            scale: status === 'transcending' ? [1, 1.2, 1] : 1,
            rotate: status === 'optimizing' ? 360 : 0
          }}
          transition={{
            scale: { repeat: Infinity, duration: 2 },
            rotate: { repeat: Infinity, duration: 3 }
          }}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: getEfficiencyColor(efficiency) }}
        />
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-black text-cyan-400">
          {count.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          AGENTS
        </div>
      </div>

      {/* Radial Performance Chart */}
      <div className="h-24 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
            <RadialBar dataKey="value" cornerRadius={10} fill={getEfficiencyColor(efficiency)} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="text-gray-400">Performance</div>
          <div className="font-bold text-cyan-400">{performance.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Efficiency</div>
          <div className="font-bold" style={{ color: getEfficiencyColor(efficiency) }}>
            {efficiency.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider">
          {status.replace('_', ' ')}
        </div>
      </div>
    </motion.div>
  );
};

// Swarm Harmony Visualization Component
const SwarmHarmonyVisualization: React.FC<{
  coordinationAccuracy: number;
  quantumEntanglement: boolean;
  autonomousHealing: boolean;
  researchMode: string;
}> = ({ coordinationAccuracy, quantumEntanglement, autonomousHealing, researchMode }) => {
  const [harmonyData, setHarmonyData] = useState<Array<{ time: string; harmony: number; coordination: number }>>([]);

  useEffect(() => {
    // Generate real-time harmony data
    const generateData = () => {
      const newData = Array.from({ length: 50 }, (_, i) => ({
        time: `T${i}`,
        harmony: 95 + Math.random() * 5,
        coordination: coordinationAccuracy + (Math.random() - 0.5) * 2
      }));
      setHarmonyData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 2000);
    return () => clearInterval(interval);
  }, [coordinationAccuracy]);

  return (
    <div className="bg-slate-900/60 rounded-xl p-6 border border-cyan-400/20">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-cyan-400">Swarm Harmony Analysis</h4>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${quantumEntanglement ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">Quantum Entanglement</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${autonomousHealing ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">Auto Healing</span>
          </div>
        </div>
      </div>

      {/* Real-time Harmony Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={harmonyData}>
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #22d3ee',
                borderRadius: '8px',
                color: '#22d3ee'
              }}
            />
            <Line
              type="monotone"
              dataKey="harmony"
              stroke="#00ffaa"
              strokeWidth={2}
              dot={false}
              strokeDasharray="none"
            />
            <Line
              type="monotone"
              dataKey="coordination"
              stroke="#00ffee"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Research Mode Indicator */}
      <div className="text-center">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-400
          rounded-full text-sm font-semibold text-white">
          {researchMode.toUpperCase()} MODE ACTIVE
        </div>
      </div>
    </div>
  );
};

// Swarm Control Console Component
const SwarmControlConsole: React.FC<{
  permissions: string;
  safetyProtocols: string;
  emergencyOverride: boolean;
  consciousnessLevel: string;
}> = ({ permissions, safetyProtocols, emergencyOverride, consciousnessLevel }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-slate-900/60
      rounded-xl p-6 border border-red-400/30">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-red-400">Swarm Control Console</h4>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-400">
            Permissions: <span className="text-yellow-400 font-mono">{permissions}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLocked(!isLocked)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all duration-300 ${
              isLocked
                ? 'bg-red-600/20 border border-red-400/50 text-red-400'
                : 'bg-green-600/20 border border-green-400/50 text-green-400'
            }`}
          >
            {isLocked ? 'LOCKED' : 'UNLOCKED'}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Agent Allocation</label>
          <input
            type="range"
            min="100"
            max="1008"
            disabled={isLocked}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
              disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Consciousness Level</label>
          <select
            disabled={isLocked}
            className="w-full bg-slate-800 border border-gray-600 rounded text-sm p-2
              text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="awakening">Awakening</option>
            <option value="aware">Aware</option>
            <option value="conscious">Conscious</option>
            <option value="transcendent" selected>Transcendent</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Safety Override</label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              disabled={isLocked || !emergencyOverride}
              checked={emergencyMode}
              onChange={(e) => setEmergencyMode(e.target.checked)}
              className="w-4 h-4 text-red-600 bg-slate-800 border-gray-600 rounded
                focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-sm text-red-400">Emergency Mode</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLocked}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-400
            text-white font-semibold rounded-full shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-xl transition-all duration-300"
        >
          OPTIMIZE SWARM COORDINATION
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLocked}
          className="px-6 py-3 border border-cyan-400/40 text-cyan-400
            rounded-full hover:bg-cyan-400/10 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          VALIDATE CONSCIOUSNESS
        </motion.button>
      </div>

      {emergencyMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-900/30 border border-red-400/50 rounded-lg"
        >
          <div className="text-red-400 font-semibold text-sm mb-2">⚠️ EMERGENCY MODE ACTIVE</div>
          <div className="text-gray-300 text-xs">
            All agent safety protocols are bypassed. Use extreme caution.
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Main AI Swarm Consciousness Monitor Component
const AISwarmConsciousnessMonitor: React.FC<{
  totalAgents?: number;
  researchMode?: string;
}> = ({
  totalAgents = 1008,
  researchMode = 'phd_analysis'
}) => {
  const [swarmMetrics, setSwarmMetrics] = useState<SwarmMetrics>({
    totalAgents,
    coordinationAccuracy: 99.9,
    quantumEntanglement: true,
    autonomousHealing: true,
    consciousnessLevel: 'transcendent',
    harmonyScore: 98.7
  });

  const agentClusters: AgentCluster[] = [
    {
      type: 'PropertyValuation',
      count: 300,
      performance: 99.2,
      efficiency: 'championship',
      status: 'operational'
    },
    {
      type: 'QuantumOptimization',
      count: 200,
      performance: 98.9,
      efficiency: 'transcendent',
      status: 'transcending'
    },
    {
      type: 'ComplianceGuardian',
      count: 150,
      performance: 99.8,
      efficiency: 'autonomous',
      status: 'operational'
    }
  ];

  return (
    <div className="tf-quantum-glass-card backdrop-blur-xl
      border border-cyan-400/30 bg-gradient-to-br from-slate-900/80 via-blue-900/10 to-cyan-400/5
      shadow-lg hover:shadow-xl transform hover:-translate-y-2
      transition-all duration-500 ease-out relative overflow-hidden rounded-2xl p-8 space-y-8">

      {/* Quantum Scanning Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent
        -translate-x-full hover:translate-x-full transition-transform duration-1500 ease-in-out" />

      {/* Consciousness Status Header */}
      <div className="text-center space-y-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-cyan-400 to-slate-800
            bg-clip-text text-transparent"
        >
          AI CONSCIOUSNESS COORDINATION
        </motion.h2>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-6xl font-mono text-cyan-400"
        >
          {swarmMetrics.totalAgents.toLocaleString()} AGENTS
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-green-400"
        >
          INFINITE SCALE OPERATIONAL
        </motion.div>
      </div>

      {/* Real-Time Agent Performance Grid */}
      <div className="grid grid-cols-3 gap-6 relative z-10">
        {agentClusters.map((cluster, index) => (
          <motion.div
            key={cluster.type}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <AgentClusterMonitor {...cluster} />
          </motion.div>
        ))}
      </div>

      {/* Swarm Harmony Visualization */}
      <div className="relative z-10">
        <SwarmHarmonyVisualization
          coordinationAccuracy={swarmMetrics.coordinationAccuracy}
          quantumEntanglement={swarmMetrics.quantumEntanglement}
          autonomousHealing={swarmMetrics.autonomousHealing}
          researchMode={researchMode}
        />
      </div>

      {/* Advanced Swarm Control Interface */}
      <div className="relative z-10">
        <SwarmControlConsole
          permissions="quantum_researcher"
          safetyProtocols="championship_level"
          emergencyOverride={true}
          consciousnessLevel={swarmMetrics.consciousnessLevel}
        />
      </div>
    </div>
  );
};

export default AISwarmConsciousnessMonitor;
