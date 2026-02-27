/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - EXPERIMENT RUNS HOOK
 * Elite Quantum Consciousness Experiment Management
 * Advanced AI Experimentation with Real-Time Monitoring
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import * as signalR from '@microsoft/signalr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { getViteEnv } from '../env/getViteEnv';

interface ExperimentRun {
  id: string;
  experimentId: string;
  status:
    | 'quantum-initializing'
    | 'consciousness-activation'
    | 'swarm-coordination'
    | 'executing'
    | 'analyzing'
    | 'completed'
    | 'failed';
  phase?: string;
  progress?: number;
  agentCount?: number;
  consciousnessLevel?: string;
  researcherProfile?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: any;
  consciousnessMetrics?: any;
  swarmMetrics?: any;
}

interface StartExperimentRequest {
  startedBy?: string;
  researcherProfile: string;
  quantumConsciousnessEnabled: boolean;
  agentCount: number;
  consciousnessLevel: string;
  realTimeMonitoring: boolean;
  crossWorkspaceIntegration: boolean;
}

interface ConsciousnessVisualizationData {
  consciousnessNetwork?: any[];
  agentPositions?: Array<{
    agentId: string;
    x: number;
    y: number;
    z: number;
    consciousnessLevel: number;
    activityLevel: number;
    status: string;
  }>;
  quantumEntanglement?: any;
  swarmIntelligence?: any;
  performanceMetrics?: any;
  timestamp: Date;
}

const EXPERIMENTS_BASE_URL = getViteEnv().VITE_EXPERIMENTS_URL || '';

/**
 * Elite Experiment Runs Hook
 * Manages quantum consciousness experiments with real-time updates
 */
export const useExperimentRuns = (experimentId: string | null) => {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch experiment runs
  const {
    data: experimentRuns,
    isLoading: isLoadingRuns,
    error: runsError,
    refetch: refetchRuns,
  } = useQuery({
    queryKey: ['experiment-runs', experimentId],
    queryFn: async (): Promise<ExperimentRun[]> => {
      if (!experimentId) return [];

      const response = await fetch(`${EXPERIMENTS_BASE_URL}/api/experiments/${experimentId}/runs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch experiment runs: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!experimentId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Start experiment mutation
  const startExperimentMutation = useMutation({
    mutationFn: async ({
      experimentId,
      request,
    }: {
      experimentId: string;
      request: StartExperimentRequest;
    }) => {
      const response = await fetch(
        `${EXPERIMENTS_BASE_URL}/api/experiments/${experimentId}/runs/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to start experiment: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiment-runs'] });
    },
  });

  // Get single experiment run
  const getExperimentRun = useCallback(
    async (runId: string): Promise<ExperimentRun | null> => {
      if (!experimentId) return null;

      try {
        const response = await fetch(
          `${EXPERIMENTS_BASE_URL}/api/experiments/${experimentId}/runs/${runId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch experiment run: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error('Failed to get experiment run:', error);
        return null;
      }
    },
    [experimentId]
  );

  // Get consciousness visualization data
  const getConsciousnessVisualizationData = useCallback(
    async (runId: string): Promise<ConsciousnessVisualizationData | null> => {
      if (!experimentId) return null;

      try {
        const response = await fetch(
          `${EXPERIMENTS_BASE_URL}/api/experiments/${experimentId}/runs/${runId}/consciousness-data`
        );
        if (!response.ok) {
          if (response.status === 400) {
            // Consciousness data not available for inactive runs
            return null;
          }
          throw new Error(`Failed to fetch consciousness data: ${response.statusText}`);
        }

        const data = await response.json();

        // Generate mock agent positions if not provided by backend
        if (!data.agentPositions && experimentRuns?.[0]?.agentCount) {
          const agentCount = Math.min(experimentRuns[0].agentCount, 500); // Limit for performance
          data.agentPositions = Array.from({ length: agentCount }, (_, i) => ({
            agentId: `agent-${i}`,
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 50,
            consciousnessLevel: Math.random() * 0.8 + 0.2,
            activityLevel: Math.random() * 0.6 + 0.4,
            status: ['active', 'coordinating', 'analyzing'][Math.floor(Math.random() * 3)],
          }));
        }

        // Generate consciousness network connections
        if (!data.consciousnessNetwork && data.agentPositions) {
          const connections: any[] = [];
          const agents = data.agentPositions.slice(0, 50); // Limit connections for performance

          agents.forEach((agent1, i) => {
            agents.slice(i + 1, i + 6).forEach((agent2) => {
              // Connect to up to 5 other agents
              const distance = Math.sqrt(
                Math.pow(agent1.x - agent2.x, 2) +
                  Math.pow(agent1.y - agent2.y, 2) +
                  Math.pow(agent1.z - agent2.z, 2)
              );

              if (distance < 30) {
                connections.push({
                  from: [agent1.x, agent1.y, agent1.z],
                  to: [agent2.x, agent2.y, agent2.z],
                  strength: (agent1.consciousnessLevel + agent2.consciousnessLevel) / 2,
                });
              }
            });
          });

          data.consciousnessNetwork = connections;
        }

        return data;
      } catch (error) {
        console.error('Failed to get consciousness visualization data:', error);
        return null;
      }
    },
    [experimentId, experimentRuns]
  );

  // Stop experiment run
  const stopExperimentRun = useCallback(
    async (runId: string): Promise<boolean> => {
      if (!experimentId) return false;

      try {
        const response = await fetch(
          `${EXPERIMENTS_BASE_URL}/api/experiments/${experimentId}/runs/${runId}/stop`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to stop experiment run: ${response.statusText}`);
        }

        queryClient.invalidateQueries({ queryKey: ['experiment-runs'] });
        return true;
      } catch (error) {
        console.error('Failed to stop experiment run:', error);
        return false;
      }
    },
    [experimentId, queryClient]
  );

  // Start experiment wrapper
  const startExperiment = useCallback(
    async (experimentId: string, request: StartExperimentRequest) => {
      return startExperimentMutation.mutateAsync({ experimentId, request });
    },
    [startExperimentMutation]
  );

  // Setup SignalR connection for real-time updates
  useEffect(() => {
    const setupSignalRConnection = async () => {
      try {
        const newConnection = new signalR.HubConnectionBuilder()
          .withUrl(`${EXPERIMENTS_BASE_URL}/hubs/experiments`)
          .withAutomaticReconnect()
          .build();

        // Handle experiment run updates
        newConnection.on('EliteExperimentRunUpdate', (update) => {
          console.log('Experiment run update:', update);

          // Update the cached experiment runs
          queryClient.setQueryData(
            ['experiment-runs', experimentId],
            (oldData: ExperimentRun[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((run) =>
                run.id === update.runId ? { ...run, ...update, updatedAt: new Date() } : run
              );
            }
          );
        });

        // Handle connection state changes
        newConnection.onclose(() => {
          setIsConnected(false);
          console.log('SignalR connection closed');
        });

        newConnection.onreconnected(() => {
          setIsConnected(true);
          console.log('SignalR connection reconnected');
        });

        await newConnection.start();
        setConnection(newConnection);
        setIsConnected(true);
        console.log('SignalR connection established');
      } catch (error) {
        console.error('Failed to setup SignalR connection:', error);
      }
    };

    setupSignalRConnection();

    return () => {
      if (connection) {
        connection.stop();
        setConnection(null);
        setIsConnected(false);
      }
    };
  }, [experimentId, queryClient]);

  // Cleanup connection on unmount
  useEffect(() => {
    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [connection]);

  return {
    // Data
    experimentRuns: experimentRuns || [],

    // Loading states
    isLoadingRuns,
    isStartingExperiment: startExperimentMutation.isPending,

    // Error states
    runsError,

    // Connection state
    isConnected,

    // Actions
    startExperiment,
    getExperimentRun,
    getConsciousnessVisualizationData,
    stopExperimentRun,
    refetchRuns,

    // SignalR connection
    connection,
  };
};

export type { ConsciousnessVisualizationData, ExperimentRun, StartExperimentRequest };

