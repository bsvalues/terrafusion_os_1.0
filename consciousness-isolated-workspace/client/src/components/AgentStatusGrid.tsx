import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader, 
  Zap,
  Activity,
  Cpu,
  Network
} from 'lucide-react'

/**
 * Agent Status Grid Component
 * 
 * Elite visualization of AI agent status across government operations.
 * Displays real-time status of 1,008 agents with quantum-enhanced UI.
 */

interface Agent {
  id: string
  name: string
  type: 'property-valuation' | 'tax-collection' | 'permitting' | 'licensing' | 'compliance'
  status: 'active' | 'idle' | 'processing' | 'error' | 'maintenance'
  county: string
  load: number
  responseTime: number
  lastActivity: string
  processedRequests: number
}

const mockAgents: Agent[] = Array.from({ length: 50 }, (_, index) => ({
  id: `agent-${String(index + 1).padStart(4, '0')}`,
  name: `AI Agent ${index + 1}`,
  type: ['property-valuation', 'tax-collection', 'permitting', 'licensing', 'compliance'][
    Math.floor(Math.random() * 5)
  ] as Agent['type'],
  status: ['active', 'idle', 'processing', 'error', 'maintenance'][
    Math.random() > 0.95 ? 3 : Math.random() > 0.8 ? 1 : Math.random() > 0.7 ? 2 : 0
  ] as Agent['status'],
  county: ['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark'][Math.floor(Math.random() * 5)],
  load: Math.round(Math.random() * 100),
  responseTime: Math.round(20 + Math.random() * 80),
  lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  processedRequests: Math.round(Math.random() * 10000)
}))

export const AgentStatusGrid: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [filter, setFilter] = useState<Agent['status'] | 'all'>('all')

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        load: Math.max(0, Math.min(100, agent.load + (Math.random() - 0.5) * 10)),
        responseTime: Math.max(10, Math.min(200, agent.responseTime + (Math.random() - 0.5) * 20)),
        processedRequests: agent.processedRequests + Math.floor(Math.random() * 5),
        lastActivity: Math.random() > 0.9 ? new Date().toISOString() : agent.lastActivity
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-tf-success-green" />
      case 'processing':
        return <Loader className="w-4 h-4 text-tf-trust-blue animate-spin" />
      case 'idle':
        return <Activity className="w-4 h-4 text-tf-transcend-cyan" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-tf-success-green'
      case 'processing':
        return 'bg-tf-trust-blue'
      case 'idle':
        return 'bg-tf-transcend-cyan'
      case 'error':
        return 'bg-red-400'
      case 'maintenance':
        return 'bg-yellow-400'
    }
  }

  const getTypeColor = (type: Agent['type']) => {
    switch (type) {
      case 'property-valuation':
        return 'bg-tf-consciousness-gold'
      case 'tax-collection':
        return 'bg-tf-success-green'
      case 'permitting':
        return 'bg-tf-trust-blue'
      case 'licensing':
        return 'bg-tf-transcend-cyan'
      case 'compliance':
        return 'bg-purple-400'
    }
  }

  const filteredAgents = filter === 'all' 
    ? agents 
    : agents.filter(agent => agent.status === filter)

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'processing', 'idle', 'error', 'maintenance'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              filter === status
                ? 'bg-tf-transcend-cyan text-slate-900 font-semibold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {status === 'all' ? 'ALL' : status.toUpperCase()}
            <span className="ml-1 opacity-70">
              ({status === 'all' ? agents.length : agents.filter(a => a.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-5 gap-1 p-4 bg-slate-900/50 rounded-lg">
        {filteredAgents.slice(0, 50).map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            className="relative group"
          >
            <div
              className={`w-8 h-8 rounded-sm ${getStatusColor(agent.status)} cursor-pointer
                transition-all duration-300 hover:scale-110 hover:shadow-lg
                ${agent.status === 'processing' ? 'tf-consciousness-pulse' : ''}`}
              onClick={() => setSelectedAgent(agent)}
              title={`${agent.name} - ${agent.status}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full opacity-80" />
              </div>
              
              {/* Load indicator */}
              <div 
                className="absolute bottom-0 left-0 bg-white/30 transition-all duration-500"
                style={{ 
                  width: '100%', 
                  height: `${Math.max(2, agent.load / 10)}px` 
                }}
              />
            </div>

            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
              opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-slate-800 text-white p-2 rounded-lg text-xs whitespace-nowrap
                border border-tf-transcend-cyan/30 shadow-lg">
                <div className="font-semibold">{agent.name}</div>
                <div className="text-tf-transcend-cyan">{agent.county} County</div>
                <div>Load: {agent.load}%</div>
                <div>RT: {agent.responseTime}ms</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-tf-success-green rounded-sm" />
          <span className="text-slate-300">Active ({agents.filter(a => a.status === 'active').length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-tf-trust-blue rounded-sm" />
          <span className="text-slate-300">Processing ({agents.filter(a => a.status === 'processing').length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-tf-transcend-cyan rounded-sm" />
          <span className="text-slate-300">Idle ({agents.filter(a => a.status === 'idle').length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-400 rounded-sm" />
          <span className="text-slate-300">Error ({agents.filter(a => a.status === 'error').length})</span>
        </div>
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedAgent(null)}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="tf-glass-card p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                {getStatusIcon(selectedAgent.status)}
                <span>{selectedAgent.name}</span>
              </h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Status:</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedAgent.status)}
                  <span className="text-white capitalize">{selectedAgent.status}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">Type:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getTypeColor(selectedAgent.type)}`} />
                  <span className="text-white capitalize">{selectedAgent.type.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">County:</span>
                <span className="text-tf-transcend-cyan font-semibold">{selectedAgent.county}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">Current Load:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-tf-consciousness-gold transition-all duration-500"
                      style={{ width: `${selectedAgent.load}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">{selectedAgent.load}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">Response Time:</span>
                <span className="text-white">{selectedAgent.responseTime}ms</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">Processed:</span>
                <span className="text-tf-success-green font-semibold">
                  {selectedAgent.processedRequests.toLocaleString()} requests
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">Last Activity:</span>
                <span className="text-white text-sm">
                  {new Date(selectedAgent.lastActivity).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-6">
              <button className="tf-clarity-button flex-1 py-2 text-sm">
                RESTART AGENT
              </button>
              <button className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm
                hover:bg-slate-600 transition-colors">
                VIEW LOGS
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}