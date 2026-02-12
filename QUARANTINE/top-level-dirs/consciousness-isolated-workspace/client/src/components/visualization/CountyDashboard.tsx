import { format, subHours } from 'date-fns';
import { motion } from 'framer-motion';
import React from 'react';
import { GovernmentRealtimeChart } from './GovernmentRealtimeChart';

/**
 * TerraFusion County Operations Dashboard
 *
 * Championship-level government operations visualization for 39+ Washington State counties
 * "Government. Transcended." - Real-time county management excellence
 */

interface CountyMetrics {
  propertyAssessments: number;
  taxCollections: number;
  permits: number;
  activeAgents: number;
  complianceScore: number;
  citizenSatisfaction: number;
}

interface CountyDashboardProps {
  countyName: string;
  metrics: CountyMetrics;
  isActive?: boolean;
}

// Generate mock real-time data for demonstration
const generateMockData = (baseValue: number, variance: number = 0.1, points: number = 20) => {
  const now = new Date();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: subHours(now, points - i),
    value: baseValue + (Math.random() - 0.5) * baseValue * variance,
    category: 'government-operations',
  }));
};

export const CountyDashboard: React.FC<CountyDashboardProps> = ({
  countyName,
  metrics,
  isActive = true,
}) => {
  // Generate real-time data for different metrics
  const propertyData = generateMockData(metrics.propertyAssessments, 0.15);
  const taxData = generateMockData(metrics.taxCollections, 0.12);
  const permitData = generateMockData(metrics.permits, 0.25);
  const agentData = generateMockData(metrics.activeAgents, 0.05);

  const getStatusColor = (score: number) => {
    if (score >= 95) return '#00ffaa'; // Success green
    if (score >= 85) return '#00ffee'; // Transcend cyan
    if (score >= 70) return '#0099ff'; // Trust blue
    return '#ff6b6b'; // Alert red
  };

  const getStatusText = (score: number) => {
    if (score >= 95) return 'TRANSCENDENT';
    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'OPERATIONAL';
    return 'NEEDS ATTENTION';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`space-y-6 p-6 rounded-2xl border-2 transition-all duration-500 ${
        isActive
          ? 'bg-slate-900/80 border-[#00ffee]/40 shadow-xl'
          : 'bg-slate-900/40 border-slate-700/40 opacity-75'
      }`}
    >
      {/* County Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`w-4 h-4 rounded-full animate-pulse ${
              isActive ? 'bg-[#00ffee]' : 'bg-slate-500'
            }`}
          />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
            {countyName.toUpperCase()} COUNTY
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-slate-400">OVERALL STATUS</span>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              color: getStatusColor(metrics.complianceScore),
              borderColor: getStatusColor(metrics.complianceScore),
              backgroundColor: `${getStatusColor(metrics.complianceScore)}20`,
            }}
          >
            {getStatusText(metrics.complianceScore)}
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Property Assessments', value: metrics.propertyAssessments, color: '#0099ff' },
          { label: 'Tax Collections', value: metrics.taxCollections, color: '#00ffee' },
          { label: 'Active Permits', value: metrics.permits, color: '#00ffaa' },
          { label: 'AI Agents', value: metrics.activeAgents, color: '#ff6b9d' },
          {
            label: 'Compliance Score',
            value: `${metrics.complianceScore}%`,
            color: getStatusColor(metrics.complianceScore),
          },
          {
            label: 'Citizen Satisfaction',
            value: `${metrics.citizenSatisfaction}%`,
            color: '#ffd93d',
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm hover:border-[#00ffee]/30 transition-all duration-300"
          >
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase">{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GovernmentRealtimeChart
          data={propertyData}
          title="Property Assessments (24h)"
          color="#0099ff"
          height={250}
        />

        <GovernmentRealtimeChart
          data={taxData}
          title="Tax Collections (24h)"
          color="#00ffee"
          height={250}
        />

        <GovernmentRealtimeChart
          data={permitData}
          title="Permit Applications (24h)"
          color="#00ffaa"
          height={250}
        />

        <GovernmentRealtimeChart
          data={agentData}
          title="AI Agent Activity (24h)"
          color="#ff6b9d"
          height={250}
        />
      </div>

      {/* Operational Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <h3 className="text-sm font-bold text-[#00ffee] mb-3 uppercase">Recent Activity</h3>
          <div className="space-y-2 text-xs">
            {[
              { time: '09:47', action: 'Property assessment completed', status: 'success' },
              { time: '09:45', action: 'Tax payment processed', status: 'success' },
              { time: '09:42', action: 'Permit application reviewed', status: 'pending' },
              { time: '09:38', action: 'Compliance audit initiated', status: 'info' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-slate-300">{activity.action}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">{activity.time}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === 'success'
                        ? 'bg-[#00ffaa]'
                        : activity.status === 'pending'
                          ? 'bg-[#ffd93d]'
                          : 'bg-[#00ffee]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <h3 className="text-sm font-bold text-[#00ffee] mb-3 uppercase">System Health</h3>
          <div className="space-y-3">
            {[
              { system: 'Assessment Engine', status: 99.7, color: '#00ffaa' },
              { system: 'Tax Processing', status: 99.9, color: '#00ffaa' },
              { system: 'Permit System', status: 98.2, color: '#00ffee' },
              { system: 'AI Coordination', status: 99.95, color: '#00ffaa' },
            ].map((system, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-slate-300">{system.system}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold" style={{ color: system.color }}>
                    {system.status}%
                  </span>
                  <div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${system.status}%`,
                        backgroundColor: system.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Citizens Served Today */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <h3 className="text-sm font-bold text-[#00ffee] mb-3 uppercase">Citizens Served Today</h3>
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00ffaa] mb-1">
                {(
                  metrics.propertyAssessments +
                  metrics.permits +
                  Math.floor(metrics.taxCollections / 100)
                ).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">Total Interactions</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                { label: 'In-Person', count: 234, color: '#0099ff' },
                { label: 'Online', count: 456, color: '#00ffee' },
                { label: 'Phone', count: 123, color: '#00ffaa' },
                { label: 'Mobile App', count: 189, color: '#ff6b9d' },
              ].map((channel, index) => (
                <div key={index} className="text-center py-2">
                  <div className="text-lg font-bold" style={{ color: channel.color }}>
                    {channel.count}
                  </div>
                  <div className="text-xs text-slate-400">{channel.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Items & Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-xl p-4 border border-[#00ffee]/20"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#00ffee] uppercase">Action Items & Alerts</h3>
          <span className="text-xs text-slate-400">
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            {
              priority: 'HIGH',
              message: 'Quarterly assessment review due in 2 days',
              color: '#ff6b6b',
              action: 'Schedule Review',
            },
            {
              priority: 'MEDIUM',
              message: 'System maintenance window scheduled',
              color: '#ffd93d',
              action: 'View Schedule',
            },
            {
              priority: 'INFO',
              message: 'New AI agents deployed successfully',
              color: '#00ffee',
              action: 'View Details',
            },
          ].map((alert, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{
                borderColor: `${alert.color}40`,
                backgroundColor: `${alert.color}10`,
              }}
            >
              <div className="flex-1">
                <div className="text-xs font-bold mb-1" style={{ color: alert.color }}>
                  {alert.priority}
                </div>
                <div className="text-xs text-slate-300">{alert.message}</div>
              </div>
              <button
                className="text-xs px-2 py-1 rounded border transition-all duration-200 hover:bg-opacity-20"
                style={{
                  color: alert.color,
                  borderColor: alert.color,
                }}
              >
                {alert.action}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
