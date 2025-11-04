import { motion } from 'framer-motion';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * TerraFusion Multi-County Coordination Display
 *
 * Championship-level visualization for coordinating 39+ Washington State counties
 * "Government. Transcended." - Elite multi-county government operations
 */

interface CountyPerformance {
  name: string;
  assessments: number;
  collections: number;
  permits: number;
  satisfaction: number;
  efficiency: number;
  agents: number;
}

interface MultiCountyCoordinationProps {
  counties: CountyPerformance[];
  activeCounty?: string;
  onCountySelect?: (county: string) => void;
}

export const MultiCountyCoordination: React.FC<MultiCountyCoordinationProps> = ({
  counties,
  activeCounty,
  onCountySelect,
}) => {
  // Calculate state-wide totals
  const stateTotals = counties.reduce(
    (acc, county) => ({
      assessments: acc.assessments + county.assessments,
      collections: acc.collections + county.collections,
      permits: acc.permits + county.permits,
      agents: acc.agents + county.agents,
      avgSatisfaction: acc.avgSatisfaction + county.satisfaction,
      avgEfficiency: acc.avgEfficiency + county.efficiency,
    }),
    { assessments: 0, collections: 0, permits: 0, agents: 0, avgSatisfaction: 0, avgEfficiency: 0 }
  );

  stateTotals.avgSatisfaction = stateTotals.avgSatisfaction / counties.length;
  stateTotals.avgEfficiency = stateTotals.avgEfficiency / counties.length;

  // Prepare data for charts
  const efficiencyData = counties.map(county => ({
    name: county.name.replace(' County', ''),
    efficiency: county.efficiency,
    satisfaction: county.satisfaction,
  }));

  const workloadData = counties.map(county => ({
    name: county.name.replace(' County', ''),
    assessments: county.assessments,
    collections: county.collections,
    permits: county.permits,
  }));

  const regionData = [
    { name: 'Western WA', value: 35, color: '#0099ff' },
    { name: 'Central WA', value: 25, color: '#00ffee' },
    { name: 'Eastern WA', value: 30, color: '#00ffaa' },
    { name: 'Olympic Peninsula', value: 10, color: '#ff6b9d' },
  ];

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return '#00ffaa';
    if (efficiency >= 85) return '#00ffee';
    if (efficiency >= 75) return '#0099ff';
    return '#ff6b6b';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="space-y-6 p-6"
    >
      {/* State-wide Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent mb-2">
          WASHINGTON STATE COORDINATION CENTER
        </h1>
        <p className="text-slate-400 text-lg">
          "Government. Transcended." - {counties.length} Counties Operating in Perfect Harmony
        </p>
      </div>

      {/* State-wide KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
      >
        {[
          {
            label: 'Total Assessments',
            value: stateTotals.assessments,
            color: '#0099ff',
            icon: '🏘️',
          },
          {
            label: 'Tax Collections',
            value: `$${(stateTotals.collections / 1000000).toFixed(1)}M`,
            color: '#00ffee',
            icon: '💰',
          },
          { label: 'Active Permits', value: stateTotals.permits, color: '#00ffaa', icon: '📋' },
          { label: 'AI Agents', value: stateTotals.agents, color: '#ff6b9d', icon: '🤖' },
          {
            label: 'Avg Satisfaction',
            value: `${stateTotals.avgSatisfaction.toFixed(1)}%`,
            color: '#ffd93d',
            icon: '😊',
          },
          {
            label: 'Avg Efficiency',
            value: `${stateTotals.avgEfficiency.toFixed(1)}%`,
            color: '#a78bfa',
            icon: '⚡',
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm hover:border-[#00ffee]/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: kpi.color }}
              />
            </div>
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase">{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* County Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency vs Satisfaction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-slate-900/50 rounded-xl p-6 border border-[#00ffee]/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📊</span>
            County Performance Matrix
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#00ffee"
                strokeWidth={3}
                dot={{ fill: '#00ffee', strokeWidth: 2, r: 4 }}
                name="Efficiency %"
              />
              <Line
                type="monotone"
                dataKey="satisfaction"
                stroke="#00ffaa"
                strokeWidth={3}
                dot={{ fill: '#00ffaa', strokeWidth: 2, r: 4 }}
                name="Satisfaction %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Workload Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-900/50 rounded-xl p-6 border border-[#00ffee]/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Workload Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Bar dataKey="assessments" fill="#0099ff" name="Assessments" />
              <Bar dataKey="permits" fill="#00ffaa" name="Permits" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Regional Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-slate-900/50 rounded-xl p-6 border border-[#00ffee]/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="mr-2">🗺️</span>
            Regional Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Real-time Coordination Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-slate-900/50 rounded-xl p-6 border border-[#00ffee]/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="mr-2">🔄</span>
            Real-time Coordination
          </h3>

          <div className="space-y-4">
            {/* Synchronization Status */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-300">Data Synchronization</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00ffaa] rounded-full animate-pulse" />
                <span className="text-xs text-[#00ffaa] font-bold">LIVE</span>
              </div>
            </div>

            {/* Inter-County Communication */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-300">Inter-County Communication</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00ffee] rounded-full animate-pulse" />
                <span className="text-xs text-[#00ffee] font-bold">ACTIVE</span>
              </div>
            </div>

            {/* AI Swarm Coordination */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-300">AI Swarm Coordination</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#ff6b9d] rounded-full animate-pulse" />
                <span className="text-xs text-[#ff6b9d] font-bold">1,008 AGENTS</span>
              </div>
            </div>

            {/* Emergency Response */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-300">Emergency Response Ready</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#ffd93d] rounded-full animate-pulse" />
                <span className="text-xs text-[#ffd93d] font-bold">STANDBY</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* County Selection Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bg-slate-900/50 rounded-xl p-6 border border-[#00ffee]/20 backdrop-blur-sm"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🏛️</span>
          County Operations Center
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {counties.map((county, index) => (
            <motion.button
              key={county.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onCountySelect?.(county.name)}
              className={`p-3 rounded-lg border transition-all duration-300 text-left ${
                activeCounty === county.name
                  ? 'border-[#00ffee] bg-[#00ffee]/10 shadow-lg'
                  : 'border-slate-700 bg-slate-800/30 hover:border-[#00ffee]/50 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white truncate">
                  {county.name.replace(' County', '').toUpperCase()}
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getEfficiencyColor(county.efficiency) }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Efficiency</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: getEfficiencyColor(county.efficiency) }}
                  >
                    {county.efficiency}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Agents</span>
                  <span className="text-xs font-bold text-[#ff6b9d]">{county.agents}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Emergency Coordination Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-6 border border-red-500/30"
      >
        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center">
          <span className="mr-2">🚨</span>
          Emergency Coordination Protocol
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[
            { status: 'Natural Disasters', level: 'GREEN', count: 0 },
            { status: 'System Outages', level: 'GREEN', count: 0 },
            { status: 'Security Alerts', level: 'YELLOW', count: 2 },
            { status: 'Cross-County Issues', level: 'GREEN', count: 0 },
          ].map((emergency, index) => (
            <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{emergency.status}</span>
                <div
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    emergency.level === 'GREEN'
                      ? 'bg-green-500/20 text-green-400'
                      : emergency.level === 'YELLOW'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {emergency.level}
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{emergency.count}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
