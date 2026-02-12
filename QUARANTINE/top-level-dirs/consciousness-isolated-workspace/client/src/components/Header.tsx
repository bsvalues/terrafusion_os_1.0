import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, User, LogOut, Cpu, Activity } from 'lucide-react'
import { useConsciousnessContext } from '../providers/ConsciousnessProvider'

/**
 * TerraFusion AI Consciousness Header
 * 
 * Elite header component displaying real-time system status,
 * notifications, and user controls for government AI coordination.
 */

export const Header: React.FC = () => {
  const { 
    isConnected, 
    agentCount, 
    quantumFactor, 
    systemHealth,
    consciousnessLevel,
    emergencyMode,
    toggleEmergencyMode 
  } = useConsciousnessContext()

  const getStatusText = () => {
    if (!isConnected) return 'DISCONNECTED'
    switch (consciousnessLevel) {
      case 'transcendent':
        return 'TRANSCENDENT CONSCIOUSNESS'
      case 'active':
        return 'AI CONSCIOUSNESS ACTIVE'
      case 'initializing':
        return 'CONSCIOUSNESS INITIALIZING'
      case 'offline':
        return 'CONSCIOUSNESS OFFLINE'
      default:
        return 'UNKNOWN STATUS'
    }
  }

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-400'
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
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Section - System Status */}
        <div className="flex items-center space-x-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center space-x-3"
          >
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-tf-success-green tf-consciousness-pulse' : 'bg-red-400'
            }`} />
            <span className={`text-sm font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="hidden md:flex items-center space-x-6 text-sm"
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-tf-transcend-cyan" />
              <span className="text-slate-300">Agents:</span>
              <span className="text-white font-semibold">
                {agentCount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-tf-consciousness-gold" />
              <span className="text-slate-300">Quantum:</span>
              <span className="text-tf-consciousness-gold font-semibold">
                {quantumFactor}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-slate-300">Health:</span>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      systemHealth > 95 ? 'bg-tf-success-green' :
                      systemHealth > 80 ? 'bg-tf-consciousness-gold' :
                      'bg-red-400'
                    }`}
                    style={{ width: `${systemHealth}%` }}
                  />
                </div>
                <span className="text-white text-xs font-semibold">
                  {systemHealth}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center Section - Search */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="hidden lg:flex items-center space-x-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents, counties, operations..."
              className="w-80 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg
                text-white placeholder-slate-400 focus:outline-none focus:border-tf-transcend-cyan
                focus:ring-1 focus:ring-tf-transcend-cyan/30 transition-all"
            />
          </div>
        </motion.div>

        {/* Right Section - Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex items-center space-x-4"
        >
          {/* Emergency Mode Toggle */}
          <button
            onClick={toggleEmergencyMode}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              emergencyMode
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {emergencyMode ? 'EMERGENCY' : 'NORMAL'}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-tf-trust-blue rounded-full" />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-white">Admin User</div>
              <div className="text-xs text-slate-400">System Administrator</div>
            </div>
            
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg
                bg-slate-800/50 hover:bg-slate-700 transition-all">
                <div className="w-8 h-8 bg-tf-transcend-cyan rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-900" />
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600
                rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
                pointer-events-none group-hover:pointer-events-auto z-50">
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-left
                    text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-left
                    text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Bar (Mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="md:hidden mt-4 flex items-center justify-between text-xs bg-slate-800/30 rounded-lg p-3"
      >
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3 text-tf-transcend-cyan" />
          <span className="text-slate-400">Agents:</span>
          <span className="text-white font-semibold">{agentCount.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-tf-consciousness-gold" />
          <span className="text-slate-400">Q:</span>
          <span className="text-tf-consciousness-gold font-semibold">{quantumFactor}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-slate-400">Health:</span>
          <span className="text-white font-semibold">{systemHealth}%</span>
        </div>
      </motion.div>
    </motion.header>
  )
}