/**
 * TerraFusion AI Agent Hooks - Championship Government Intelligence
 * Government. Transcended. - Elite Agent Coordination System
 *
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type {
  TerraAgent,
  AgentSwarm,
  AgentTask,
  AgentAnalytics,
  AgentQuery,
  SwarmQuery,
  TaskQuery,
  AgentPerformance,
  SwarmMetrics,
  QuantumTrendData,
  ComplianceReport,
  AgentWebSocketMessage
} from '../types';
import {
  mockTerraAgents,
  mockAgentSwarms,
  mockAgentTasks,
  mockQuantumTrendData,
  mockComplianceReport,
  mockRealTimeMetrics,
  mockAgentPerformanceChartData,
  mockTaskStatusPieData,
  mockComplianceLevels,
  mockQuantumStatus
} from '../data/mockData';

// === QUERY KEYS ===
export const agentKeys = {
  all: ['terra-agents'] as const,
  agents: () => [...agentKeys.all, 'agents'] as const,
  agent: (id: string) => [...agentKeys.agents(), id] as const,
  agentsByType: (type: string) => [...agentKeys.agents(), 'type', type] as const,
  swarms: () => [...agentKeys.all, 'swarms'] as const,
  swarm: (id: string) => [...agentKeys.swarms(), id] as const,
  tasks: () => [...agentKeys.all, 'tasks'] as const,
  task: (id: string) => [...agentKeys.tasks(), id] as const,
  tasksByAgent: (agentId: string) => [...agentKeys.tasks(), 'agent', agentId] as const,
  analytics: () => [...agentKeys.all, 'analytics'] as const,
  performance: () => [...agentKeys.analytics(), 'performance'] as const,
  compliance: () => [...agentKeys.analytics(), 'compliance'] as const,
  quantum: () => [...agentKeys.analytics(), 'quantum'] as const,
  realtime: () => [...agentKeys.all, 'realtime'] as const
};

// === API BASE URL ===
const API_BASE = '/api/terra-agent';

// === AGENT MANAGEMENT HOOKS ===

/**
 * Get all Terra agents with optional filtering
 */
export const useAgents = (
  query?: AgentQuery,
  options?: UseQueryOptions<TerraAgent[], Error>
) => {
  return useQuery({
    queryKey: agentKeys.agents(),
    queryFn: async (): Promise<TerraAgent[]> => {
      // In production, this would be a real API call
      // const response = await fetch(`${API_BASE}/agents`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(query)
      // });
      // if (!response.ok) throw new Error('Failed to fetch agents');
      // return response.json();

      // Mock implementation with filtering
      let agents = [...mockTerraAgents];

      if (query?.filters) {
        if (query.filters.type) {
          agents = agents.filter(agent => query.filters!.type!.includes(agent.type));
        }
        if (query.filters.status) {
          agents = agents.filter(agent => query.filters!.status!.includes(agent.status));
        }
        if (query.filters.quantumOptimized !== undefined) {
          agents = agents.filter(agent => agent.quantumOptimized === query.filters!.quantumOptimized);
        }
      }

      if (query?.sort) {
        agents.sort((a, b) => {
          const aVal = a[query.sort!.field] as any;
          const bVal = b[query.sort!.field] as any;
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return query.sort!.direction === 'desc' ? -comparison : comparison;
        });
      }

      return agents;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Get a specific Terra agent by ID
 */
export const useAgent = (
  agentId: string,
  options?: UseQueryOptions<TerraAgent, Error>
) => {
  return useQuery({
    queryKey: agentKeys.agent(agentId),
    queryFn: async (): Promise<TerraAgent> => {
      // In production: const response = await fetch(`${API_BASE}/agents/${agentId}`);
      const agent = mockTerraAgents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      return agent;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!agentId,
    ...options
  });
};

/**
 * Get agents by type
 */
export const useAgentsByType = (
  agentType: string,
  options?: UseQueryOptions<TerraAgent[], Error>
) => {
  return useQuery({
    queryKey: agentKeys.agentsByType(agentType),
    queryFn: async (): Promise<TerraAgent[]> => {
      return mockTerraAgents.filter(agent => agent.type === agentType);
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!agentType,
    ...options
  });
};

// === SWARM MANAGEMENT HOOKS ===

/**
 * Get all agent swarms
 */
export const useSwarms = (
  query?: SwarmQuery,
  options?: UseQueryOptions<AgentSwarm[], Error>
) => {
  return useQuery({
    queryKey: agentKeys.swarms(),
    queryFn: async (): Promise<AgentSwarm[]> => {
      // Mock implementation with filtering
      let swarms = [...mockAgentSwarms];

      if (query?.filters) {
        if (query.filters.status) {
          swarms = swarms.filter(swarm => query.filters!.status!.includes(swarm.status));
        }
        if (query.filters.quantumEnhanced !== undefined) {
          swarms = swarms.filter(swarm => swarm.coordinator.quantumEnhanced === query.filters!.quantumEnhanced);
        }
        if (query.filters.agentCount) {
          const { min, max } = query.filters.agentCount;
          swarms = swarms.filter(swarm => {
            const count = swarm.agents.length;
            return (!min || count >= min) && (!max || count <= max);
          });
        }
      }

      return swarms;
    },
    staleTime: 45 * 1000, // 45 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Get a specific swarm by ID
 */
export const useSwarm = (
  swarmId: string,
  options?: UseQueryOptions<AgentSwarm, Error>
) => {
  return useQuery({
    queryKey: agentKeys.swarm(swarmId),
    queryFn: async (): Promise<AgentSwarm> => {
      const swarm = mockAgentSwarms.find(s => s.id === swarmId);
      if (!swarm) {
        throw new Error(`Swarm ${swarmId} not found`);
      }
      return swarm;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!swarmId,
    ...options
  });
};

// === TASK MANAGEMENT HOOKS ===

/**
 * Get all agent tasks with filtering
 */
export const useTasks = (
  query?: TaskQuery,
  options?: UseQueryOptions<AgentTask[], Error>
) => {
  return useQuery({
    queryKey: agentKeys.tasks(),
    queryFn: async (): Promise<AgentTask[]> => {
      // Mock implementation with filtering
      let tasks = [...mockAgentTasks];

      if (query?.filters) {
        if (query.filters.type) {
          tasks = tasks.filter(task => query.filters!.type!.includes(task.type));
        }
        if (query.filters.status) {
          tasks = tasks.filter(task => query.filters!.status!.includes(task.status));
        }
        if (query.filters.assignedAgent) {
          tasks = tasks.filter(task => task.assignedAgentId === query.filters!.assignedAgent);
        }
        if (query.filters.classification) {
          tasks = tasks.filter(task => query.filters!.classification!.includes(task.governmentClassification));
        }
      }

      return tasks;
    },
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

/**
 * Get tasks assigned to a specific agent
 */
export const useTasksByAgent = (
  agentId: string,
  options?: UseQueryOptions<AgentTask[], Error>
) => {
  return useQuery({
    queryKey: agentKeys.tasksByAgent(agentId),
    queryFn: async (): Promise<AgentTask[]> => {
      return mockAgentTasks.filter(task => task.assignedAgentId === agentId);
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!agentId,
    ...options
  });
};

// === ANALYTICS & PERFORMANCE HOOKS ===

/**
 * Get agent performance analytics
 */
export const useAgentAnalytics = (
  timeRange?: { start: string; end: string },
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: agentKeys.performance(),
    queryFn: async () => {
      return {
        chartData: mockAgentPerformanceChartData,
        taskDistribution: mockTaskStatusPieData,
        realTimeMetrics: mockRealTimeMetrics,
        quantumTrends: mockQuantumTrendData
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Get quantum optimization trends
 */
export const useQuantumTrends = (
  options?: UseQueryOptions<QuantumTrendData[], Error>
) => {
  return useQuery({
    queryKey: agentKeys.quantum(),
    queryFn: async (): Promise<QuantumTrendData[]> => {
      return mockQuantumTrendData;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

/**
 * Get compliance report
 */
export const useComplianceReport = (
  options?: UseQueryOptions<ComplianceReport, Error>
) => {
  return useQuery({
    queryKey: agentKeys.compliance(),
    queryFn: async (): Promise<ComplianceReport> => {
      return mockComplianceReport;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options
  });
};

/**
 * Get real-time system metrics
 */
export const useRealTimeMetrics = (
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: agentKeys.realtime(),
    queryFn: async () => {
      return {
        ...mockRealTimeMetrics,
        complianceLevels: mockComplianceLevels,
        quantumStatus: mockQuantumStatus,
        timestamp: new Date().toISOString()
      };
    },
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    ...options
  });
};

// === MUTATION HOOKS ===

/**
 * Create a new agent task
 */
export const useCreateTask = (
  options?: UseMutationOptions<AgentTask, Error, Partial<AgentTask>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Partial<AgentTask>): Promise<AgentTask> => {
      // In production:
      // const response = await fetch(`${API_BASE}/tasks`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(taskData)
      // });
      // return response.json();

      // Mock implementation
      const newTask: AgentTask = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        type: taskData.type || 'data-processing',
        priority: taskData.priority || 'medium',
        status: 'queued',
        parameters: taskData.parameters || {},
        createdAt: new Date().toISOString(),
        governmentClassification: taskData.governmentClassification || 'internal'
      };

      return newTask;
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: agentKeys.realtime() });
    },
    ...options
  });
};

/**
 * Update agent configuration
 */
export const useUpdateAgent = (
  options?: UseMutationOptions<TerraAgent, Error, { agentId: string; updates: Partial<TerraAgent> }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, updates }): Promise<TerraAgent> => {
      // Mock implementation
      const agent = mockTerraAgents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      return { ...agent, ...updates };
    },
    onSuccess: (updatedAgent) => {
      // Update cache
      queryClient.setQueryData(agentKeys.agent(updatedAgent.id), updatedAgent);
      queryClient.invalidateQueries({ queryKey: agentKeys.agents() });
    },
    ...options
  });
};

/**
 * Control agent (start, stop, restart)
 */
export const useControlAgent = (
  options?: UseMutationOptions<TerraAgent, Error, { agentId: string; action: 'start' | 'stop' | 'restart' }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, action }): Promise<TerraAgent> => {
      // Mock implementation
      const agent = mockTerraAgents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      let newStatus = agent.status;
      switch (action) {
        case 'start':
          newStatus = 'active';
          break;
        case 'stop':
          newStatus = 'offline';
          break;
        case 'restart':
          newStatus = 'active';
          break;
      }

      return { ...agent, status: newStatus, lastActive: new Date().toISOString() };
    },
    onSuccess: (updatedAgent) => {
      queryClient.setQueryData(agentKeys.agent(updatedAgent.id), updatedAgent);
      queryClient.invalidateQueries({ queryKey: agentKeys.agents() });
      queryClient.invalidateQueries({ queryKey: agentKeys.realtime() });
    },
    ...options
  });
};

// === WEBSOCKET HOOKS ===

/**
 * WebSocket connection for real-time updates
 */
export const useAgentWebSocket = (onMessage?: (message: AgentWebSocketMessage) => void) => {
  // This would be implemented with actual WebSocket connection in production
  // For now, we'll simulate with polling

  const { data: realTimeData } = useQuery({
    queryKey: ['realTimeMetrics'],
    queryFn: async () => {
      // Mock real-time metrics data
      return {
        quantum_factor: 949,
        active_agents: Math.floor(Math.random() * 1008) + 800,
        response_time: Math.random() * 50 + 25,
        accuracy_score: 0.995 + Math.random() * 0.004,
        uptime_percentage: 0.9999,
        swarm_harmony: Math.random() * 0.05 + 0.95,
        government_compliance: 100,
        last_updated: new Date().toISOString()
      };
    },
    refetchInterval: 5000 // Poll every 5 seconds
  });

  return {
    isConnected: true,
    lastMessage: realTimeData ? {
      type: 'agent-status-update' as const,
      payload: realTimeData,
      timestamp: new Date().toISOString()
    } : null
  };
};

// === UTILITY HOOKS ===

/**
 * Get agent statistics summary
 */
export const useAgentStats = () => {
  const { data: agents } = useAgents();
  const { data: tasks } = useTasks();
  const { data: swarms } = useSwarms();

  return {
    totalAgents: agents?.length || 0,
    activeAgents: agents?.filter(a => a.status === 'active').length || 0,
    totalTasks: tasks?.length || 0,
    activeTasks: tasks?.filter(t => t.status === 'in-progress').length || 0,
    totalSwarms: swarms?.length || 0,
    activeSwarms: swarms?.filter(s => s.status === 'active').length || 0
  };
};
