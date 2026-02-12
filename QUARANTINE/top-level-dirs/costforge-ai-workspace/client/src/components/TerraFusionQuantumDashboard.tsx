import { Cpu, Database, Gauge, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import '../styles/terrafusion-quantum.css';

// TerraFusion Color System
const tfColors = {
  trustBlue: '#0099ff',
  transcendCyan: '#00ffee',
  successGreen: '#00ffaa',
  deepSpace: '#0b1020',
  clarity: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
};

// Mock data for quantum analytics
const quantumData = [
  { name: 'Q1', value: 98.5, efficiency: 99.2 },
  { name: 'Q2', value: 99.1, efficiency: 99.8 },
  { name: 'Q3', value: 99.8, efficiency: 99.9 },
  { name: 'Q4', value: 99.5, efficiency: 100 },
];

const agentPerformance = [
  { name: 'Assessment', agents: 12500, accuracy: 99.8 },
  { name: 'Analysis', agents: 15200, accuracy: 99.5 },
  { name: 'Calculation', agents: 8900, accuracy: 99.9 },
  { name: 'Validation', agents: 13400, accuracy: 99.7 },
];

export function TerraFusionQuantumDashboard() {
  const [activeAgents, setActiveAgents] = useState(50000);
  const [systemStatus, setSystemStatus] = useState('TRANSCENDENT');
  const [quantumEfficiency, setQuantumEfficiency] = useState(99.5);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgents(prev => prev + Math.floor(Math.random() * 100 - 50));
      setQuantumEfficiency(prev => Math.min(100, prev + (Math.random() - 0.5) * 0.1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* TerraFusion Header */}
      <div className="mb-8">
        <div
          className="tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-400/20
                        rounded-2xl p-6 relative overflow-hidden"
        >
          <div
            className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
                          via-cyan-400/20 to-transparent -translate-x-full animate-scan"
          />
          <div className="relative z-10">
            <h1
              className="text-6xl font-black bg-gradient-to-r from-blue-400 via-cyan-400
                           to-green-400 bg-clip-text text-transparent mb-2"
            >
              TERRAFUSION OS
            </h1>
            <p className="text-2xl text-cyan-400 font-semibold">Government. Transcended.</p>
            <p className="text-lg text-slate-300 mt-2">
              Infrastructure Intelligence • Infinite Scale • Championship Performance
            </p>
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Agents */}
        <div
          className="tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-400/30
                        rounded-2xl p-6 hover:shadow-2xl hover:shadow-cyan-400/20
                        hover:transform hover:-translate-y-1 transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-4">
            <Cpu className="w-8 h-8 text-cyan-400" />
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-black text-white mb-2">
            {activeAgents.toLocaleString()}+
          </div>
          <div className="text-cyan-400 font-semibold">ACTIVE AGENTS</div>
          <div className="text-xs text-slate-400 mt-1">Autonomous • Self-Healing</div>
        </div>

        {/* System Efficiency */}
        <div
          className="tf-glass-card bg-white/10 backdrop-blur-lg border border-green-400/30
                        rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-400/20
                        hover:transform hover:-translate-y-1 transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-4">
            <Gauge className="w-8 h-8 text-green-400" />
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{quantumEfficiency.toFixed(1)}%</div>
          <div className="text-green-400 font-semibold">QUANTUM EFFICIENCY</div>
          <div className="text-xs text-slate-400 mt-1">Championship Level</div>
        </div>

        {/* Data Processed */}
        <div
          className="tf-glass-card bg-white/10 backdrop-blur-lg border border-blue-400/30
                        rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-400/20
                        hover:transform hover:-translate-y-1 transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-blue-400" />
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-black text-white mb-2">2.4M</div>
          <div className="text-blue-400 font-semibold">PROPERTIES ANALYZED</div>
          <div className="text-xs text-slate-400 mt-1">Real-Time Processing</div>
        </div>

        {/* System Status */}
        <div
          className="tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-400/30
                        rounded-2xl p-6 hover:shadow-2xl hover:shadow-cyan-400/20
                        hover:transform hover:-translate-y-1 transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white mb-2">{systemStatus}</div>
          <div className="text-cyan-400 font-semibold">SYSTEM STATUS</div>
          <div className="text-xs text-slate-400 mt-1">Infinite Scale Operational</div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quantum Performance Chart */}
        <div
          className="tf-glass-card bg-gradient-to-br from-slate-900/50 to-slate-800/50
                        backdrop-blur-lg border-2 border-cyan-400/30 rounded-3xl p-8 relative"
        >
          <div className="tf-data-matrix absolute inset-0 opacity-5" />
          <div className="relative z-10">
            <h3
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400
                           to-green-400 bg-clip-text text-transparent mb-6"
            >
              QUANTUM PERFORMANCE ANALYTICS
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quantumData}>
                <defs>
                  <linearGradient id="tfGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0099ff" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#00ffee" stopOpacity={1} />
                    <stop offset="100%" stopColor="#00ffaa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[98, 100]} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#tfGlow)"
                  strokeWidth={4}
                  dot={{ fill: '#00ffee', r: 8, strokeWidth: 2, stroke: '#0099ff' }}
                  activeDot={{ r: 12, stroke: '#00ffaa', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Distribution */}
        <div
          className="tf-glass-card bg-gradient-to-br from-slate-900/50 to-slate-800/50
                        backdrop-blur-lg border-2 border-green-400/30 rounded-3xl p-8 relative"
        >
          <div className="tf-quantum-grid absolute inset-0 opacity-10" />
          <div className="relative z-10">
            <h3
              className="text-2xl font-bold bg-gradient-to-r from-green-400 via-cyan-400
                           to-blue-400 bg-clip-text text-transparent mb-6"
            >
              AI AGENT SWARM DISTRIBUTION
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Bar dataKey="agents" radius={[4, 4, 0, 0]}>
                  {agentPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index % 4 === 0
                          ? '#0099ff'
                          : index % 4 === 1
                            ? '#00ffee'
                            : index % 4 === 2
                              ? '#00ffaa'
                              : '#0088dd'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Panel */}
      <div
        className="tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-400/20
                      rounded-2xl p-6 relative overflow-hidden"
      >
        <div
          className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
                        via-cyan-400/20 to-transparent -translate-x-full animate-scan-delayed"
        />
        <div className="relative z-10 flex flex-wrap gap-4">
          <button
            className="tf-clarity-button bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500
                             text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg
                             hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300
                             border border-cyan-400/30 backdrop-blur-sm"
          >
            🚀 QUANTUM DEPLOY
          </button>
          <button
            className="tf-clarity-button bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500
                             text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg
                             hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300
                             border border-cyan-400/30 backdrop-blur-sm"
          >
            ⚡ ENHANCE AGENTS
          </button>
          <button
            className="tf-clarity-button bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500
                             text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg
                             hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300
                             border border-cyan-400/30 backdrop-blur-sm"
          >
            🎯 PRECISION CALC
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerraFusionQuantumDashboard;
