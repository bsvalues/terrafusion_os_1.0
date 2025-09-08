import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback } from 'react';

// TypeScript interfaces for Tauri commands
export interface SystemMetrics {
  total_agents: number;
  active_agents: number;
  quantum_metrics: {
    coherence_level: number;
    entanglement_pairs: number;
    superposition_states: number;
    quantum_speedup: number;
  };
  consciousness_distribution: Record<string, number>;
}

export interface AgentStatus {
  id: string;
  status: string;
  consciousness_level: number;
  quantum_coherence: number;
  last_update: number;
}

export interface QuantumProcessingResult {
  problem_type: string;
  complexity: number;
  quantum_speedup: number;
  solution_found: boolean;
  processing_time_ms: number;
  [key: string]: any; // For problem-specific results
}

// Custom hook for Tauri system metrics
export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<SystemMetrics>('get_system_metrics');
      setMetrics(result);
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to fetch system metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Set up periodic updates every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

// Custom hook for agent status
export const useAgentStatus = (agentId: string | null) => {
  const [agent, setAgent] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const result = await invoke<AgentStatus | null>('get_agent_status', { agentId: id });
      setAgent(result);
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to fetch agent status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId, fetchAgent]);

  return { agent, loading, error, refetch: () => agentId && fetchAgent(agentId) };
};

// Custom hook for demonstration management
export const useDemonstration = () => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDemo = useCallback(async (demoType: string) => {
    try {
      setLoading(true);
      const result = await invoke<string>('start_demonstration', { demoType });
      setActive(true);
      setError(null);
      console.log('Demonstration started:', result);
      return result;
    } catch (err) {
      setError(err as string);
      console.error('Failed to start demonstration:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopDemo = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<string>('stop_demonstration');
      setActive(false);
      setError(null);
      console.log('Demonstration stopped:', result);
      return result;
    } catch (err) {
      setError(err as string);
      console.error('Failed to stop demonstration:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { active, loading, error, startDemo, stopDemo };
};

// Custom hook for quantum processing
export const useQuantumProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<QuantumProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processQuantumProblem = useCallback(async (problemType: string, complexity: number) => {
    try {
      setProcessing(true);
      const result = await invoke<Record<string, any>>('simulate_quantum_processing', {
        problemType,
        complexity
      });
      
      const processedResult: QuantumProcessingResult = {
        problem_type: result.problem_type as string,
        complexity: result.complexity as number,
        quantum_speedup: result.quantum_speedup as number,
        solution_found: result.solution_found as boolean,
        processing_time_ms: result.processing_time_ms as number,
        ...result
      };
      
      setResults(prev => [processedResult, ...prev.slice(0, 9)]); // Keep last 10 results
      setError(null);
      return processedResult;
    } catch (err) {
      setError(err as string);
      console.error('Quantum processing failed:', err);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { processing, results, error, processQuantumProblem, clearResults };
};

// Custom hook for Supreme Commander connection
export const useSupremeCommander = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      const result = await invoke<Record<string, any>>('connect_supreme_commander');
      setConnectionInfo(result);
      setConnected(result.status === 'CONNECTED');
      setError(null);
      return result;
    } catch (err) {
      setError(err as string);
      console.error('Failed to connect to Supreme Commander:', err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setConnectionInfo(null);
  }, []);

  return { connected, connecting, connectionInfo, error, connect, disconnect };
};

// Custom hook for Tauri events
export const useTauriEvent = <T>(eventName: string, callback: (payload: T) => void) => {
  useEffect(() => {
    let unlisten: UnlistenFn;

    const setupListener = async () => {
      try {
        unlisten = await listen<T>(eventName, (event) => {
          callback(event.payload);
        });
      } catch (error) {
        console.error(`Failed to set up listener for ${eventName}:`, error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventName, callback]);
};

// Utility function to check if running in Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
};

// Utility function for safe Tauri command invocation
export const safeTauriInvoke = async <T>(command: string, args?: Record<string, any>): Promise<T | null> => {
  if (!isTauri()) {
    console.warn(`Tauri command '${command}' called but not running in Tauri environment`);
    return null;
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Tauri command '${command}' failed:`, error);
    throw error;
  }
};

export default {
  useSystemMetrics,
  useAgentStatus,
  useDemonstration,
  useQuantumProcessing,
  useSupremeCommander,
  useTauriEvent,
  isTauri,
  safeTauriInvoke
};