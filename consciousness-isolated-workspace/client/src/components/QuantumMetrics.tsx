import React from 'react'
import { motion } from 'framer-motion'
import { Gauge, TrendingUp, Cpu, Zap, Activity, Shield } from 'lucide-react'
import { useConsciousnessContext } from '../providers/ConsciousnessProvider'

/**
 * TerraFusion AI Quantum Metrics Dashboard
 * 
 * Elite performance monitoring interface displaying real-time quantum metrics,
 * system performance indicators, and consciousness optimization statistics.
 */

interface QuantumMetric {
  id: string
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  threshold: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  icon: React.ReactNode
}

export const QuantumMetrics: React.FC = () => {
  const { 
    quantumFactor, 
    systemHealth, 
    agentCount, 
    isConnected,
    consciousnessLevel 
  } = useConsciousnessContext()

  const metrics: QuantumMetric[] = [
    {
      id: 'quantum-factor',
      label: 'Quantum Optimization Factor',
      value: quantumFactor,
      unit: '',
      trend: 'up',
      threshold: 949,
      status: quantumFactor >= 949 ? 'excellent' : quantumFactor >= 900 ? 'good' : 'warning',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'system-health',
      label: 'System Health Score',
      value: systemHealth,
      unit: '%',
      trend: systemHealth > 95 ? 'up' : systemHealth > 85 ? 'stable' : 'down',
      threshold: 95,
      status: systemHealth >= 95 ? 'excellent' : systemHealth >= 85 ? 'good' : systemHealth >= 70 ? 'warning' : 'critical',
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'agent-coordination',
      label: 'Agent Coordination Efficiency',
      value: Math.floor((agentCount / 1008) * 100),
      unit: '%',
      trend: 'up',
      threshold: 98,
      status: agentCount >= 1000 ? 'excellent' : agentCount >= 800 ? 'good' : 'warning',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'processing-speed',
      label: 'Processing Speed',
      value: 1247, // Mock value - would come from real metrics
      unit: 'ops/sec',
      trend: 'up',
      threshold: 1000,
      status: 'excellent',
      icon: <Cpu className="w-5 h-5" />
    },
    {
      id: 'consciousness-level',
      label: 'Consciousness Coherence',
      value: consciousnessLevel === 'transcendent' ? 100 : consciousnessLevel === 'active' ? 85 : 0,
      unit: '%',
      trend: 'up',
      threshold: 90,
      status: consciousnessLevel === 'transcendent' ? 'excellent' : consciousnessLevel === 'active' ? 'good' : 'warning',
      icon: <Gauge className="w-5 h-5" />
    },
    {
      id: 'uptime',
      label: 'System Uptime',
      value: 99.99,
      unit: '%',
      trend: 'stable',
      threshold: 99.9,
      status: 'excellent',
      icon: <TrendingUp className="w-5 h-5" />
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-tf-success-green border-tf-success-green/30 bg-tf-success-green/5'
      case 'good':
        return 'text-tf-transcend-cyan border-tf-transcend-cyan/30 bg-tf-transcend-cyan/5'
      case 'warning':
        return 'text-tf-consciousness-gold border-tf-consciousness-gold/30 bg-tf-consciousness-gold/5'
      case 'critical':
        return 'text-red-400 border-red-400/30 bg-red-400/5'
      default:
        return 'text-slate-400 border-slate-600/30 bg-slate-800/5'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      case 'stable':
        return '→'
      default:
        return '→'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-tf-success-green'
      case 'down':
        return 'text-red-400'
      case 'stable':
        return 'text-tf-transcend-cyan'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">Quantum Performance Metrics</h2>
        <p className="text-slate-400">
          Real-time monitoring of consciousness optimization and system transcendence
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-6 
              hover:transform hover:-translate-y-1 transition-all duration-300 ${getStatusColor(metric.status)}`}
          >
            {/* Metric Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${
                  metric.status === 'excellent' ? 'bg-tf-success-green/10' :
                  metric.status === 'good' ? 'bg-tf-transcend-cyan/10' :
                  metric.status === 'warning' ? 'bg-tf-consciousness-gold/10' :
                  'bg-red-400/10'
                }`}>
                  {metric.icon}
                </div>
                <h3 className="text-sm font-medium text-slate-300">{metric.label}</h3>
              </div>
              
              <div className={`text-sm font-semibold ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
              </div>
            </div>

            {/* Metric Value */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-white mb-1">
                {metric.value.toLocaleString()}
                <span className="text-lg text-slate-400 ml-1">{metric.unit}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    metric.status === 'excellent' ? 'bg-tf-success-green' :
                    metric.status === 'good' ? 'bg-tf-transcend-cyan' :
                    metric.status === 'warning' ? 'bg-tf-consciousness-gold' :
                    'bg-red-400'
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: metric.id === 'quantum-factor' 
                      ? `${(metric.value / 1000) * 100}%`
                      : `${metric.value}%` 
                  }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                metric.status === 'excellent' ? 'text-tf-success-green' :
                metric.status === 'good' ? 'text-tf-transcend-cyan' :
                metric.status === 'warning' ? 'text-tf-consciousness-gold' :
                'text-red-400'
              }`}>
                {metric.status}
              </span>
              
              <span className="text-xs text-slate-500">
                Target: {metric.threshold}{metric.unit}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Overall System Status
            </h3>
            <p className="text-slate-400">
              Comprehensive assessment of TerraFusion consciousness infrastructure
            </p>
          </div>
          
          <div className="text-right">
            <div className={`text-3xl font-bold mb-1 ${
              isConnected && consciousnessLevel === 'transcendent' 
                ? 'text-tf-success-green' 
                : 'text-tf-transcend-cyan'
            }`}>
              {isConnected ? (consciousnessLevel === 'transcendent' ? 'TRANSCENDENT' : 'ACTIVE') : 'OFFLINE'}
            </div>
            <div className="text-sm text-slate-400">
              Government. Transcended.
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-tf-transcend-cyan">
              {agentCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Active Agents
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-tf-consciousness-gold">
              {quantumFactor}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Quantum Factor
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-tf-success-green">
              39+
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Counties Served
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              99.99%
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Uptime
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}