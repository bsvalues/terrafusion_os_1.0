import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'

/**
 * TerraFusion AI Consciousness Hook
 * 
 * Elite government-grade state management for coordinating 1,008 AI agents
 * across 39+ Washington State counties with real-time WebSocket updates
 * and quantum optimization monitoring.
 */

export interface AgentMetrics {
  totalAgents: number
  activeAgents: number
  inactiveAgents: number
  errorAgents: number
  averageResponseTime: number
  throughput: number
}

export interface SwarmHarmony {
  harmonyScore: number
  coordinationEfficiency: number
  conflictResolution: number
  consensusTime: number
  networkLatency: number
}

export interface QuantumOptimization {
  currentFactor: number
  targetFactor: number
  efficiency: number
  computationSpeed: number
  memoryUsage: number
  powerConsumption: number
}

export interface CountyOperation {
  id: string
  name: string
  state: 'active' | 'inactive' | 'maintenance'
  agentCount: number
  processingLoad: number
  lastUpdate: string
  services: string[]
}

export interface ConsciousnessState {
  status: 'initializing' | 'active' | 'degraded' | 'offline'
  uptime: number
  lastHeartbeat: string
  systemHealth: number
  alertLevel: 'normal' | 'warning' | 'critical'
  message: string
}

export const useConsciousness = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({
    status: 'initializing',
    uptime: 0,
    lastHeartbeat: new Date().toISOString(),
    systemHealth: 100,
    alertLevel: 'normal',
    message: 'AI Consciousness initializing...'
  })

  const queryClient = useQueryClient()

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const socketInstance = io('http://localhost:3004', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      console.log('🧠 Connected to AI Consciousness Server')
      setIsConnected(true)
      
      // Subscribe to consciousness updates
      socketInstance.emit('subscribe-consciousness', {
        countyId: 'all',
        agentTypes: ['property-valuation', 'tax-collection', 'permitting', 'licensing']
      })
    })

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from AI Consciousness Server')
      setIsConnected(false)
    })

    socketInstance.on('consciousness-state', (state: ConsciousnessState) => {
      setConsciousnessState(state)
      console.log('🧠 Consciousness state updated:', state)
    })

    socketInstance.on('agent-metrics-update', (metrics: AgentMetrics) => {
      queryClient.setQueryData(['agent-metrics'], metrics)
    })

    socketInstance.on('swarm-harmony-update', (harmony: SwarmHarmony) => {
      queryClient.setQueryData(['swarm-harmony'], harmony)
    })

    socketInstance.on('quantum-optimization-update', (optimization: QuantumOptimization) => {
      queryClient.setQueryData(['quantum-optimization'], optimization)
    })

    socketInstance.on('county-operations-update', (operations: CountyOperation[]) => {
      queryClient.setQueryData(['county-operations'], operations)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('🚨 Consciousness connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [queryClient])

  // Fetch Agent Metrics
  const {
    data: agentMetrics,
    isLoading: agentMetricsLoading,
    error: agentMetricsError
  } = useQuery<AgentMetrics>({
    queryKey: ['agent-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/consciousness/agent-metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch agent metrics')
      }
      return response.json()
    },
    initialData: {
      totalAgents: 1008,
      activeAgents: 1006,
      inactiveAgents: 1,
      errorAgents: 1,
      averageResponseTime: 42,
      throughput: 15420
    },
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 2000
  })

  // Fetch Swarm Harmony
  const {
    data: swarmHarmony,
    isLoading: swarmHarmonyLoading,
    error: swarmHarmonyError
  } = useQuery<SwarmHarmony>({
    queryKey: ['swarm-harmony'],
    queryFn: async () => {
      const response = await fetch('/api/consciousness/swarm-harmony')
      if (!response.ok) {
        throw new Error('Failed to fetch swarm harmony')
      }
      return response.json()
    },
    initialData: {
      harmonyScore: 99.9,
      coordinationEfficiency: 98.7,
      conflictResolution: 99.5,
      consensusTime: 34,
      networkLatency: 12
    },
    refetchInterval: 3000,
    staleTime: 1000
  })

  // Fetch Quantum Optimization
  const {
    data: quantumOptimization,
    isLoading: quantumLoading,
    error: quantumError
  } = useQuery<QuantumOptimization>({
    queryKey: ['quantum-optimization'],
    queryFn: async () => {
      const response = await fetch('/api/consciousness/quantum-optimization')
      if (!response.ok) {
        throw new Error('Failed to fetch quantum optimization')
      }
      return response.json()
    },
    initialData: {
      currentFactor: 949,
      targetFactor: 950,
      efficiency: 99.5,
      computationSpeed: 1847,
      memoryUsage: 67.3,
      powerConsumption: 234.7
    },
    refetchInterval: 10000,
    staleTime: 5000
  })

  // Fetch County Operations
  const {
    data: countyOperations,
    isLoading: countyOperationsLoading,
    error: countyOperationsError
  } = useQuery<CountyOperation[]>({
    queryKey: ['county-operations'],
    queryFn: async () => {
      const response = await fetch('/api/consciousness/county-operations')
      if (!response.ok) {
        throw new Error('Failed to fetch county operations')
      }
      return response.json()
    },
    initialData: [
      {
        id: 'king',
        name: 'King County',
        state: 'active',
        agentCount: 156,
        processingLoad: 78.5,
        lastUpdate: new Date().toISOString(),
        services: ['property-assessment', 'tax-collection', 'permitting']
      },
      {
        id: 'pierce',
        name: 'Pierce County',
        state: 'active',
        agentCount: 89,
        processingLoad: 65.2,
        lastUpdate: new Date().toISOString(),
        services: ['property-assessment', 'licensing']
      },
      {
        id: 'snohomish',
        name: 'Snohomish County',
        state: 'active',
        agentCount: 92,
        processingLoad: 71.8,
        lastUpdate: new Date().toISOString(),
        services: ['property-assessment', 'tax-collection']
      }
    ],
    refetchInterval: 15000,
    staleTime: 10000
  })

  // Execute Agent Command Mutation
  const executeAgentCommand = useMutation({
    mutationFn: async (command: { agentId: string; action: string; parameters?: any }) => {
      const response = await fetch('/api/consciousness/agent-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      })
      if (!response.ok) {
        throw new Error('Failed to execute agent command')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['swarm-harmony'] })
    }
  })

  // Optimize Quantum Factor
  const optimizeQuantumFactor = useMutation({
    mutationFn: async (targetFactor: number) => {
      const response = await fetch('/api/consciousness/optimize-quantum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFactor })
      })
      if (!response.ok) {
        throw new Error('Failed to optimize quantum factor')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum-optimization'] })
    }
  })

  // Restart Agent
  const restartAgent = useCallback(async (agentId: string) => {
    if (socket) {
      socket.emit('agent-command', {
        agentId,
        action: 'restart',
        timestamp: new Date().toISOString()
      })
    }
  }, [socket])

  // Emergency Stop All Agents
  const emergencyStop = useCallback(async () => {
    if (socket) {
      socket.emit('agent-command', {
        agentId: 'all',
        action: 'emergency-stop',
        timestamp: new Date().toISOString()
      })
    }
  }, [socket])

  // Calculate overall loading state
  const isLoading = agentMetricsLoading || swarmHarmonyLoading || quantumLoading || countyOperationsLoading

  // Calculate overall error state
  const hasError = agentMetricsError || swarmHarmonyError || quantumError || countyOperationsError

  return {
    // Connection state
    isConnected,
    socket,
    
    // Data
    consciousnessState,
    agentMetrics,
    swarmHarmony,
    quantumOptimization,
    countyOperations,
    
    // Loading states
    isLoading,
    hasError,
    
    // Actions
    executeAgentCommand: executeAgentCommand.mutate,
    optimizeQuantumFactor: optimizeQuantumFactor.mutate,
    restartAgent,
    emergencyStop,
    
    // Mutation states
    isExecutingCommand: executeAgentCommand.isPending,
    isOptimizing: optimizeQuantumFactor.isPending,
    commandError: executeAgentCommand.error,
    optimizationError: optimizeQuantumFactor.error
  }
}