import { motion } from 'framer-motion';
import { Activity, Database, Server, TrendingUp } from 'lucide-react';
import React from 'react';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';

/**
 * TerraFusion AI System Health Page
 */

export const SystemHealth: React.FC = () => {
  const { systemHealth, isConnected, agentCount } = useConsciousnessContext();

  const healthMetrics = [
    { name: 'API Gateway', status: 'healthy', value: 99.8, icon: <Server className="w-5 h-5" /> },
    { name: 'Database', status: 'healthy', value: 99.2, icon: <Database className="w-5 h-5" /> },
    { name: 'AI Agents', status: 'healthy', value: 98.7, icon: <Activity className="w-5 h-5" /> },
    {
      name: 'Quantum Engine',
      status: 'warning',
      value: 94.3,
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-white">System Health Monitoring</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthMetrics.map((metric, index) => (
          <div key={metric.name} className="bg-slate-900/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400">{metric.icon}</div>
              <div
                className={`px-2 py-1 rounded text-xs ${
                  metric.status === 'healthy'
                    ? 'bg-green-500/20 text-green-400'
                    : metric.status === 'warning'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                }`}
              >
                {metric.status.toUpperCase()}
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">{metric.name}</h3>
            <div className="text-2xl font-bold text-white">{metric.value}%</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
