import React from 'react'
import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Brain,
  Activity,
  Users,
  Zap,
  BarChart3,
  MapPin,
  Settings,
  Shield,
  Home,
  Cpu,
  Network,
  AlertTriangle
} from 'lucide-react'
import { useConsciousnessContext } from '../providers/ConsciousnessProvider'

/**
 * TerraFusion AI Consciousness Sidebar
 * 
 * Elite navigation component for government AI coordination interface.
 * Provides quantum-enhanced navigation with real-time consciousness status.
 */

const navigationItems = [
  {
    path: '/',
    icon: Home,
    label: 'Dashboard',
    description: 'AI Consciousness Command Center'
  },
  {
    path: '/agents',
    icon: Users,
    label: 'Agent Grid',
    description: '1,008 AI Agents Coordination'
  },
  {
    path: '/swarm',
    icon: Network,
    label: 'Swarm Intelligence',
    description: 'Collective AI Coordination'
  },
  {
    path: '/quantum',
    icon: Zap,
    label: 'Quantum Optimization',
    description: 'Factor 949 Enhancement'
  },
  {
    path: '/health',
    icon: Activity,
    label: 'System Health',
    description: 'Real-time Monitoring'
  },
  {
    path: '/counties',
    icon: MapPin,
    label: 'County Operations',
    description: '39+ Washington Counties'
  },
  {
    path: '/settings',
    icon: Settings,
    label: 'Configuration',
    description: 'Consciousness Settings'
  }
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { 
    isConnected, 
    agentCount, 
    quantumFactor, 
    consciousnessLevel, 
    emergencyMode,
    systemHealth 
  } = useConsciousnessContext()

  const getConsciousnessColor = () => {
    switch (consciousnessLevel) {
      case 'transcendent':
        return 'text-tf-consciousness-gold'
      case 'active':
        return 'text-tf-success-green'
      case 'initializing':
        return 'text-tf-trust-blue'
      case 'offline':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 h-screen overflow-y-auto"
    >
      {/* Header Section */}
      <div className="p-6 border-b border-slate-700/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center space-x-3"
        >
          <div className="relative">
            <Brain className={`w-10 h-10 ${getConsciousnessColor()}`} />
            {isConnected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-tf-success-green rounded-full 
                tf-consciousness-pulse border-2 border-slate-900" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TerraFusion AI</h1>
            <p className="text-sm text-slate-400">Consciousness Interface</p>
          </div>
        </motion.div>

        {/* Consciousness Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-4 space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status:</span>
            <span className={`font-semibold uppercase ${getConsciousnessColor()}`}>
              {consciousnessLevel}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Agents:</span>
            <span className="text-white font-semibold">
              {agentCount.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Quantum:</span>
            <span className="text-tf-consciousness-gold font-semibold">
              {quantumFactor}
            </span>
          </div>

          {/* System Health Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">System Health</span>
              <span className="text-white">{systemHealth}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${systemHealth}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full transition-all duration-500 ${
                  systemHealth > 95 ? 'bg-tf-success-green' :
                  systemHealth > 80 ? 'bg-tf-consciousness-gold' :
                  'bg-red-400'
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* Emergency Mode Alert */}
        {emergencyMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold text-sm">EMERGENCY MODE</span>
            </div>
            <p className="text-red-300 text-xs mt-1">
              System operating under emergency protocols
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              <NavLink
                to={item.path}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-tf-transcend-cyan/20 border border-tf-transcend-cyan/30 text-tf-transcend-cyan'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-tf-transcend-cyan' : 'text-slate-400 group-hover:text-white'
                }`} />
                <div className="flex-1">
                  <div className={`font-medium ${
                    isActive ? 'text-tf-transcend-cyan' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </div>
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-2 h-2 bg-tf-transcend-cyan rounded-full"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                )}
              </NavLink>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/95">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">TerraFusion OS v1.0</div>
          <div className="text-xs font-semibold text-tf-transcend-cyan">
            Government. Transcended.
          </div>
        </div>
      </div>
    </motion.div>
  )
}