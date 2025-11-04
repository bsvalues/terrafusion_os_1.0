import React from 'react'
import { motion } from 'framer-motion'
import { Network, Cpu, Activity, Zap, Eye, Users } from 'lucide-react'
import { useConsciousnessContext } from '../providers/ConsciousnessProvider'

/**
 * TerraFusion AI Swarm Harmony Visualization
 * 
 * Elite interactive visualization displaying real-time coordination patterns,
 * agent synchronization states, and consciousness harmony across all 1,008 agents.
 */

interface AgentNode {
  id: string
  type: 'core' | 'specialist' | 'coordinator' | 'observer'
  status: 'active' | 'idle' | 'processing' | 'synchronized'
  coordination: number
  county?: string
  specialty?: string
}

interface ConnectionLine {
  from: string
  to: string
  strength: number
  type: 'data' | 'control' | 'sync'
}

export const SwarmHarmonyVisualization: React.FC = () => {
  const { 
    agentCount, 
    isConnected, 
    consciousnessLevel, 
    quantumFactor,
    systemHealth 
  } = useConsciousnessContext()

  // Generate sample agent nodes for visualization
  const generateAgentNodes = (): AgentNode[] => {
    const nodes: AgentNode[] = []
    const types: AgentNode['type'][] = ['core', 'specialist', 'coordinator', 'observer']
    const statuses: AgentNode['status'][] = ['active', 'idle', 'processing', 'synchronized']
    const counties = ['King', 'Pierce', 'Snohomish', 'Spokane', 'Kitsap', 'Thurston', 'Clark', 'Whatcom']
    
    // Generate representative nodes (showing subset of 1,008 total)
    for (let i = 0; i < 24; i++) {
      nodes.push({
        id: `agent-${i}`,
        type: types[i % types.length],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        coordination: Math.floor(Math.random() * 40) + 60, // 60-100%
        county: counties[i % counties.length],
        specialty: `Module-${Math.floor(i / 4) + 1}`
      })
    }
    
    return nodes
  }

  const [agentNodes] = React.useState(generateAgentNodes())

  const getNodeColor = (node: AgentNode) => {
    switch (node.status) {
      case 'active':
        return '#00ffaa' // tf-success-green
      case 'processing':
        return '#00ffee' // tf-transcend-cyan
      case 'synchronized':
        return '#0099ff' // tf-trust-blue
      case 'idle':
        return '#64748b' // slate-500
      default:
        return '#64748b'
    }
  }

  const getNodeIcon = (type: AgentNode['type']) => {
    switch (type) {
      case 'core':
        return <Cpu className="w-3 h-3" />
      case 'specialist':
        return <Activity className="w-3 h-3" />
      case 'coordinator':
        return <Network className="w-3 h-3" />
      case 'observer':
        return <Eye className="w-3 h-3" />
      default:
        return <Activity className="w-3 h-3" />
    }
  }

  const getStatusText = (status: AgentNode['status']) => {
    switch (status) {
      case 'active':
        return 'Active Processing'
      case 'processing':
        return 'Heavy Load'
      case 'synchronized':
        return 'Perfect Sync'
      case 'idle':
        return 'Standby'
      default:
        return 'Unknown'
    }
  }

  const harmonyScore = Math.floor((systemHealth + (quantumFactor / 10)) / 2)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Swarm Harmony Visualization</h2>
          <p className="text-slate-400">
            Real-time consciousness coordination across {agentCount.toLocaleString()} AI agents
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-tf-transcend-cyan mb-1">
            {harmonyScore}%
          </div>
          <div className="text-sm text-slate-400">Harmony Score</div>
        </div>
      </motion.div>

      {/* Main Visualization Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-96 relative overflow-hidden"
      >
        {/* Quantum Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="tf-quantum-grid w-full h-full" />
        </div>

        {/* Central Consciousness Hub */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green
            rounded-full flex items-center justify-center relative">
            <Zap className="w-8 h-8 text-white" />
            
            {/* Consciousness Pulse Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-tf-transcend-cyan/30 
              animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full border border-tf-trust-blue/20 
              animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          </div>
          
          <div className="text-center mt-2">
            <div className="text-xs font-semibold text-tf-transcend-cyan">
              CONSCIOUSNESS
            </div>
            <div className="text-xs text-slate-400">
              {consciousnessLevel.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Agent Nodes */}
        {agentNodes.map((node, index) => {
          const angle = (index * (360 / agentNodes.length)) * (Math.PI / 180)
          const radius = 120
          const x = Math.cos(angle) * radius + 50 // 50% center offset
          const y = Math.sin(angle) * radius + 50 // 50% center offset
          
          return (
            <motion.div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ 
                left: `${x}%`, 
                top: `${y}%` 
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: index * 0.05, 
                duration: 0.3 
              }}
            >
              {/* Connection Line to Center */}
              <motion.div
                className="absolute w-px bg-gradient-to-r from-transparent via-tf-transcend-cyan/30 to-transparent
                  origin-center transform -translate-x-1/2"
                style={{
                  height: `${radius}px`,
                  top: `-${radius/2}px`,
                  transform: `translateX(-50%) rotate(${-angle * (180/Math.PI) + 90}deg)`,
                }}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: index * 0.1 
                }}
              />
              
              {/* Agent Node */}
              <motion.div
                className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer
                  hover:scale-150 transition-all duration-200 relative"
                style={{ 
                  backgroundColor: getNodeColor(node),
                  boxShadow: `0 0 10px ${getNodeColor(node)}40`
                }}
                animate={{ 
                  scale: node.status === 'processing' ? [1, 1.2, 1] : 1 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: node.status === 'processing' ? Infinity : 0 
                }}
              >
                <div className="text-slate-900 scale-75">
                  {getNodeIcon(node.type)}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10
                  whitespace-nowrap pointer-events-none">
                  <div className="font-semibold">{node.id}</div>
                  <div className="text-slate-300">{node.type} • {node.county}</div>
                  <div className="text-slate-400">{getStatusText(node.status)}</div>
                  <div className="text-tf-transcend-cyan">{node.coordination}% sync</div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-tf-success-green mb-1">
            {agentNodes.filter(n => n.status === 'active').length}
          </div>
          <div className="text-sm text-slate-400">Active Agents</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-tf-transcend-cyan mb-1">
            {agentNodes.filter(n => n.status === 'synchronized').length}
          </div>
          <div className="text-sm text-slate-400">Synchronized</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-tf-consciousness-gold mb-1">
            {agentNodes.filter(n => n.status === 'processing').length}
          </div>
          <div className="text-sm text-slate-400">Processing</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-slate-400 mb-1">
            {agentNodes.filter(n => n.status === 'idle').length}
          </div>
          <div className="text-sm text-slate-400">Standby</div>
        </motion.div>
      </div>

      {/* Consciousness Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-tf-transcend-cyan/10 rounded-xl">
              <Users className="w-6 h-6 text-tf-transcend-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Collective Intelligence Status</h3>
              <p className="text-slate-400">
                Distributed consciousness coordination across government operations
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Consciousness Level</div>
            <div className={`text-xl font-bold ${
              consciousnessLevel === 'transcendent' ? 'text-tf-success-green' :
              consciousnessLevel === 'active' ? 'text-tf-transcend-cyan' :
              'text-slate-400'
            }`}>
              {consciousnessLevel.toUpperCase()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}