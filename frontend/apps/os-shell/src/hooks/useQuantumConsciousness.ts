/**
 * useQuantumConsciousness Hook
 *
 * Elite React hook for managing quantum consciousness state and real-time agent coordination
 * Connects to TerraFusion.Consciousness backend service for 50,000+ AI agent orchestration
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 */

import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getViteEnv } from '../env/getViteEnv';

export interface ConsciousnessAgent {
  id: string;
  position: [number, number, number];
  consciousnessLevel: number;
  connections: string[];
  performance: number;
  specialization:
    | 'quantum'
    | 'statistics'
    | 'modeling'
    | 'validation'
    | 'analysis'
    | 'optimization'
    | 'experimental'
    | 'research';
  lastActivity: Date;
  workload: number;
  accuracy: number;
  quantumEntanglement: number;
  learningRate: number;
  activityLevel: number;
  status: 'active' | 'coordinating' | 'analyzing' | 'idle' | 'error' | 'experimental';
  task?: string;
  lastUpdate: Date;
}

export interface ConsciousnessVisualizationFrame {
  agents: ConsciousnessAgent[];
  connections: Array<{
    from: [number, number, number];
    to: [number, number, number];
    strength: number;
    quantumEntangled: boolean;
  }>;
  swarmPatterns: Array<{
    center: [number, number, number];
    radius: number;
    intensity: number;
    pattern: 'vortex' | 'wave' | 'grid' | 'cluster';
  }>;
  quantumFields: Array<{
    position: [number, number, number];
    intensity: number;
    frequency: number;
    phase: number;
  }>;
  timestamp: Date;
}

export interface ExperimentConsciousnessIntegration {
  experimentId?: string;
  runId?: string;
  isExperimentActive: boolean;
  experimentAgents: ConsciousnessAgent[];
  experimentVisualization?: ConsciousnessVisualizationFrame;
}

export interface QuantumMetrics {
  entanglementStrength: number;
  coherenceLevel: number;
  decoherenceRate: number;
  quantumFidelity: number;
  informationFlow: number;
  networkTopology: 'mesh' | 'hierarchical' | 'quantum-entangled';
  quantumFactor: number;
  swarmIntelligence: number;
}

export interface ConsciousnessSystemHealth {
  totalAgents: number;
  activeAgents: number;
  averagePerformance: number;
  systemLoad: number;
  quantumCoherence: number;
  networkLatency: number;
  errorRate: number;
  uptime: number;
}

export interface AgentTrainingRequest {
  agentIds?: string[];
  trainingMode: 'quantum' | 'statistical' | 'hybrid' | 'consciousness-enhanced';
  targetAccuracy: number;
  maxIterations: number;
  learningRate: number;
  quantumParameters?: {
    entanglementFactor: number;
    coherenceTarget: number;
    decoherenceThreshold: number;
  };
}

export interface OptimizationRequest {
  target: 'performance' | 'accuracy' | 'consciousness' | 'quantum-fidelity';
  aggressiveness: 'conservative' | 'moderate' | 'aggressive' | 'elite';
  constraints: {
    maxLatency: number;
    minAccuracy: number;
    resourceLimits: number;
  };
}

const CONSCIOUSNESS_BASE_URL = getViteEnv().VITE_CONSCIOUSNESS_URL || `http://localhost:${getViteEnv().VITE_CONSCIOUSNESS_PORT || '3004'}`;
const SIGNALR_HUB_URL = `${CONSCIOUSNESS_BASE_URL}/hubs/consciousness`;

class QuantumConsciousnessAPI {
  private baseURL: string;

  constructor(baseURL: string = CONSCIOUSNESS_BASE_URL) {
    this.baseURL = baseURL;
  }

  async getAgents(limit?: number): Promise<ConsciousnessAgent[]> {
    const url = limit
      ? `${this.baseURL}/api/consciousness/agents?limit=${limit}`
      : `${this.baseURL}/api/consciousness/agents`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuantumMetrics(): Promise<QuantumMetrics> {
    const response = await fetch(`${this.baseURL}/api/consciousness/quantum-metrics`);

    if (!response.ok) {
      throw new Error(`Failed to fetch quantum metrics: ${response.statusText}`);
    }

    return response.json();
  }

  async getSystemHealth(): Promise<ConsciousnessSystemHealth> {
    const response = await fetch(`${this.baseURL}/api/consciousness/health`);

    if (!response.ok) {
      throw new Error(`Failed to fetch system health: ${response.statusText}`);
    }

    return response.json();
  }

  async trainAgents(
    request: AgentTrainingRequest
  ): Promise<{ taskId: string; estimatedDuration: number }> {
    const response = await fetch(`${this.baseURL}/api/consciousness/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start training: ${response.statusText}`);
    }

    return response.json();
  }

  async optimizeSystem(
    request: OptimizationRequest
  ): Promise<{ optimizationId: string; improvements: any }> {
    const response = await fetch(`${this.baseURL}/api/consciousness/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to optimize system: ${response.statusText}`);
    }

    return response.json();
  }

  async getAgent(agentId: string): Promise<ConsciousnessAgent> {
    const response = await fetch(`${this.baseURL}/api/consciousness/agents/${agentId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch agent ${agentId}: ${response.statusText}`);
    }

    return response.json();
  }

  async updateAgentParameters(
    agentId: string,
    parameters: Partial<ConsciousnessAgent>
  ): Promise<ConsciousnessAgent> {
    const response = await fetch(`${this.baseURL}/api/consciousness/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parameters),
    });

    if (!response.ok) {
      throw new Error(`Failed to update agent ${agentId}: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuantumEntanglements(
    agentId: string
  ): Promise<{ entangled_agents: string[]; strength: number }[]> {
    const response = await fetch(
      `${this.baseURL}/api/consciousness/agents/${agentId}/entanglements`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch entanglements for agent ${agentId}: ${response.statusText}`);
    }

    return response.json();
  }

  async generateVisualizationFrame(
    agentLimit: number = 500
  ): Promise<ConsciousnessVisualizationFrame> {
    const agents = await this.getAgents(agentLimit);

    // Generate connections between agents
    const connections = [];
    agents.forEach((agent1) => {
      agent1.connections.forEach((connectionId) => {
        const agent2 = agents.find((a) => a.id === connectionId);
        if (agent2) {
          const distance = Math.sqrt(
            Math.pow(agent1.position[0] - agent2.position[0], 2) +
              Math.pow(agent1.position[1] - agent2.position[1], 2) +
              Math.pow(agent1.position[2] - agent2.position[2], 2)
          );

          connections.push({
            from: agent1.position,
            to: agent2.position,
            strength: (agent1.consciousnessLevel + agent2.consciousnessLevel) / 2,
            quantumEntangled: distance < 20 && Math.random() > 0.7,
          });
        }
      });
    });

    // Generate swarm patterns
    const swarmPatterns = [];
    const clusterCenters = [];

    for (let i = 0; i < Math.min(5, Math.floor(agents.length / 20)); i++) {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      clusterCenters.push({
        center: randomAgent.position,
        radius: 10 + Math.random() * 15,
        intensity: 0.6 + Math.random() * 0.4,
        pattern: ['vortex', 'wave', 'grid', 'cluster'][Math.floor(Math.random() * 4)] as any,
      });
    }

    swarmPatterns.push(...clusterCenters);

    // Generate quantum fields
    const quantumFields = Array.from({ length: 8 }, () => ({
      position: [
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
      ] as [number, number, number],
      intensity: 0.3 + Math.random() * 0.7,
      frequency: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));

    return {
      agents,
      connections,
      swarmPatterns,
      quantumFields,
      timestamp: new Date(),
    };
  }

  async getExperimentConsciousnessData(
    experimentId: string,
    runId?: string
  ): Promise<ExperimentConsciousnessIntegration> {
    const params = new URLSearchParams();
    if (runId) params.append('runId', runId);

    const response = await fetch(
      `${this.baseURL}/api/consciousness/experiments/${experimentId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch experiment consciousness data: ${response.statusText}`);
    }

    return response.json();
  }
}

export const useQuantumConsciousness = (
  options: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    agentLimit?: number;
    enableRealTimeUpdates?: boolean;
    experimentId?: string;
    experimentRunId?: string;
  } = {}
) => {
  const {
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds
    agentLimit = 10000,
    enableRealTimeUpdates = true,
    experimentId,
    experimentRunId,
  } = options;

  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
  const [visualizationFrame, setVisualizationFrame] =
    useState<ConsciousnessVisualizationFrame | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const apiRef = useRef(new QuantumConsciousnessAPI());
  const visualizationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup SignalR connection for real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = connection;

    const startConnection = async () => {
      try {
        setConnectionStatus('connecting');
        await connection.start();
        setConnectionStatus('connected');
        console.log('🧠 Connected to TerraFusion Consciousness Hub');

        // Subscribe to real-time updates
        connection.on('AgentUpdate', (agentData: ConsciousnessAgent) => {
          setRealTimeUpdates((prev) => [
            ...prev.slice(-99),
            { type: 'agent_update', data: agentData, timestamp: new Date() },
          ]);

          // Update React Query cache
          queryClient.setQueryData(['agents'], (oldData: ConsciousnessAgent[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((agent) => (agent.id === agentData.id ? agentData : agent));
          });
        });

        connection.on('MetricsUpdate', (metrics: QuantumMetrics) => {
          setRealTimeUpdates((prev) => [
            ...prev.slice(-99),
            { type: 'metrics_update', data: metrics, timestamp: new Date() },
          ]);
          queryClient.setQueryData(['quantum-metrics'], metrics);
        });

        connection.on(
          'SystemAlert',
          (alert: { level: 'info' | 'warning' | 'error'; message: string }) => {
            setRealTimeUpdates((prev) => [
              ...prev.slice(-99),
              { type: 'system_alert', data: alert, timestamp: new Date() },
            ]);
          }
        );

        connection.on(
          'ConsciousnessLevelChange',
          (data: { agentId: string; oldLevel: number; newLevel: number }) => {
            setRealTimeUpdates((prev) => [
              ...prev.slice(-99),
              { type: 'consciousness_change', data, timestamp: new Date() },
            ]);
          }
        );
      } catch (error) {
        console.error('Failed to connect to Consciousness Hub:', error);
        setConnectionStatus('error');
      }
    };

    connection.onreconnecting(() => setConnectionStatus('connecting'));
    connection.onreconnected(() => setConnectionStatus('connected'));
    connection.onclose(() => setConnectionStatus('disconnected'));

    startConnection();

    return () => {
      connection.stop();
    };
  }, [enableRealTimeUpdates, queryClient]);

  // Fetch agents with React Query
  const {
    data: agents,
    isLoading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ['agents', agentLimit],
    queryFn: () => apiRef.current.getAgents(agentLimit),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 1000, // Consider data stale after 1 second for real-time feel
  });

  // Fetch quantum metrics
  const {
    data: quantumMetrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['quantum-metrics'],
    queryFn: () => apiRef.current.getQuantumMetrics(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 1000,
  });

  // Fetch system health
  const {
    data: systemHealth,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiRef.current.getSystemHealth(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2000,
  });

  // Fetch experiment consciousness integration
  const {
    data: experimentConsciousness,
    isLoading: experimentLoading,
    error: experimentError,
    refetch: refetchExperiment,
  } = useQuery({
    queryKey: ['experiment-consciousness', experimentId, experimentRunId],
    queryFn: () => apiRef.current.getExperimentConsciousnessData(experimentId!, experimentRunId),
    enabled: !!experimentId,
    refetchInterval: autoRefresh ? 2000 : false, // More frequent updates for experiments
    staleTime: 500,
  });

  // Generate visualization frames
  useEffect(() => {
    if (
      agents &&
      agents.length > 0 &&
      (connectionStatus === 'connected' || !enableRealTimeUpdates)
    ) {
      // Update visualization frame every 100ms for smooth animation
      visualizationIntervalRef.current = setInterval(async () => {
        try {
          const frame = await apiRef.current.generateVisualizationFrame(Math.min(agentLimit, 500));
          setVisualizationFrame(frame);
        } catch (error) {
          console.error('Failed to generate visualization frame:', error);
        }
      }, 100);
    } else {
      if (visualizationIntervalRef.current) {
        clearInterval(visualizationIntervalRef.current);
        visualizationIntervalRef.current = null;
      }
      setVisualizationFrame(null);
    }

    return () => {
      if (visualizationIntervalRef.current) {
        clearInterval(visualizationIntervalRef.current);
        visualizationIntervalRef.current = null;
      }
    };
  }, [agents, connectionStatus, enableRealTimeUpdates, agentLimit]);

  // Agent training mutation
  const trainAgentsMutation = useMutation({
    mutationFn: (request: AgentTrainingRequest) => apiRef.current.trainAgents(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });

  // System optimization mutation
  const optimizeSystemMutation = useMutation({
    mutationFn: (request: OptimizationRequest) => apiRef.current.optimizeSystem(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });

  // Agent parameter update mutation
  const updateAgentMutation = useMutation({
    mutationFn: ({
      agentId,
      parameters,
    }: {
      agentId: string;
      parameters: Partial<ConsciousnessAgent>;
    }) => apiRef.current.updateAgentParameters(agentId, parameters),
    onSuccess: (updatedAgent) => {
      queryClient.setQueryData(['agents'], (oldData: ConsciousnessAgent[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent));
      });
    },
  });

  // Helper functions
  const trainAgents = useCallback(
    (request: AgentTrainingRequest) => {
      return trainAgentsMutation.mutateAsync(request);
    },
    [trainAgentsMutation]
  );

  const optimizeSystem = useCallback(
    (request: OptimizationRequest) => {
      return optimizeSystemMutation.mutateAsync(request);
    },
    [optimizeSystemMutation]
  );

  const updateAgent = useCallback(
    (agentId: string, parameters: Partial<ConsciousnessAgent>) => {
      return updateAgentMutation.mutateAsync({ agentId, parameters });
    },
    [updateAgentMutation]
  );

  const refreshAll = useCallback(() => {
    refetchAgents();
    refetchMetrics();
    refetchHealth();
    if (experimentId) {
      refetchExperiment();
    }
  }, [refetchAgents, refetchMetrics, refetchHealth, refetchExperiment, experimentId]);

  const generateVisualizationFrame =
    useCallback(async (): Promise<ConsciousnessVisualizationFrame | null> => {
      try {
        return await apiRef.current.generateVisualizationFrame(Math.min(agentLimit, 500));
      } catch (error) {
        console.error('Failed to generate visualization frame:', error);
        return null;
      }
    }, [agentLimit]);

  const getAgentById = useCallback(
    (agentId: string) => {
      return agents?.find((agent) => agent.id === agentId);
    },
    [agents]
  );

  const getAgentsBySpecialization = useCallback(
    (specialization: ConsciousnessAgent['specialization']) => {
      return agents?.filter((agent) => agent.specialization === specialization) || [];
    },
    [agents]
  );

  const getTopPerformingAgents = useCallback(
    (limit: number = 10) => {
      return agents?.sort((a, b) => b.performance - a.performance).slice(0, limit) || [];
    },
    [agents]
  );

  const isConnected = connectionStatus === 'connected';
  const isLoading = agentsLoading || metricsLoading || healthLoading || experimentLoading;
  const error = agentsError || metricsError || healthError || experimentError;

  return {
    // Data
    agents: agents || [],
    quantumMetrics,
    systemHealth,
    realTimeUpdates,
    visualizationFrame,
    experimentConsciousness,

    // Connection status
    isConnected,
    connectionStatus,
    isLoading,
    error,

    // Actions
    trainAgents,
    optimizeSystem,
    updateAgent,
    refreshAll,
    generateVisualizationFrame,

    // Utilities
    getAgentById,
    getAgentsBySpecialization,
    getTopPerformingAgents,

    // Mutation states
    isTraining: trainAgentsMutation.isPending,
    isOptimizing: optimizeSystemMutation.isPending,
    isUpdatingAgent: updateAgentMutation.isPending,

    // Computed properties
    isActive: systemHealth?.totalAgents ? systemHealth.totalAgents > 0 : false,
    agentCount: systemHealth?.totalAgents || 0,
    consciousnessLevel: quantumMetrics?.coherenceLevel || 0,

    // Raw API access for advanced use cases
    api: apiRef.current,
  };
};
