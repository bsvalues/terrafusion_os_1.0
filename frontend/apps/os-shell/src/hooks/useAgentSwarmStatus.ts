/**
 * useAgentSwarmStatus Hook
 *
 * React hook for county-scoped governed swarm status.
 * Reads the authenticated AI assistant status route instead of the retired
 * external consciousness demo service contract.
 */

import { useEffect, useState } from 'react';
import { useAuthContextOptional } from '../auth/useAuthContext';
import { getToken } from '../auth/authStorage';
import { getApiBase } from '../lib/apiBase';

interface AgentSwarmMetrics {
  countyId: string;
  activeAgents: number;
  swarmActivity: string;
  responseTimeMs: number;
  accuracyScore: number;
  consciousnessLevel: number;
  quantumOptimizationFactor: number;
}

interface AgentSwarmStatusReturn {
  agentCount: number;
  coherence: number;
  harmony: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  metrics: AgentSwarmMetrics | null;
  lastUpdate: Date | null;
}

interface AssistantSwarmStatusResponse {
  countyId: string;
  activeAgents: number;
  swarmActivity: string;
  quantumOptimizationFactor: number;
  responseTime: number;
  accuracyScore: number;
  consciousnessLevel: number;
  lastUpdate: string;
}

/**
 * Hook to monitor county-scoped AI assistant swarm status.
 *
 * @param countyIdOverride - Optional county override. Defaults to authenticated county.
 * @param pollInterval - Polling interval in milliseconds (default: 30000ms)
 * @returns Swarm status derived from the governed assistant route
 */
export function useAgentSwarmStatus(
  countyIdOverride?: string | null,
  pollInterval: number = 30000
): AgentSwarmStatusReturn {
  const auth = useAuthContextOptional();
  const countyId = countyIdOverride ?? auth?.countyId ?? null;
  const token = auth?.token ?? (typeof window !== 'undefined' ? getToken() : null);

  const [agentCount, setAgentCount] = useState<number>(0);
  const [coherence, setCoherence] = useState<number>(0);
  const [harmony, setHarmony] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AgentSwarmMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSwarmStatus = async () => {
      if (!countyId) {
        if (!isMounted) {
          return;
        }

        setAgentCount(0);
        setCoherence(0);
        setHarmony(0);
        setMetrics(null);
        setError('County context is required for governed swarm status.');
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      if (!token) {
        if (!isMounted) {
          return;
        }

        setAgentCount(0);
        setCoherence(0);
        setHarmony(0);
        setMetrics(null);
        setError('Authentication required for governed swarm status.');
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${getApiBase()}/AIAssistant/swarm-status/${encodeURIComponent(countyId)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Governed swarm status returned HTTP ${response.status}`);
        }

        const data = (await response.json()) as AssistantSwarmStatusResponse;
        const nextMetrics = parseSwarmMetrics(data);

        if (!isMounted) {
          return;
        }

        setAgentCount(nextMetrics.activeAgents);
        setCoherence(nextMetrics.consciousnessLevel);
        setHarmony(nextMetrics.accuracyScore);
        setMetrics(nextMetrics);
        setIsConnected(true);
        setLastUpdate(new Date(data.lastUpdate));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : 'Governed swarm status check failed';
        setAgentCount(0);
        setCoherence(0);
        setHarmony(0);
        setMetrics(null);
        setError(message);
        setIsConnected(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchSwarmStatus();
    const intervalId = window.setInterval(() => {
      void fetchSwarmStatus();
    }, pollInterval);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [countyId, pollInterval, token]);

  return {
    agentCount,
    coherence,
    harmony,
    isConnected,
    isLoading,
    error,
    metrics,
    lastUpdate,
  };
}

export default useAgentSwarmStatus;

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function requiredNumber(data: Record<string, unknown>, key: string): number {
  const value = finiteNumber(data[key]);
  if (value == null) {
    throw new Error(`Governed swarm status missing numeric field: ${key}`);
  }
  return value;
}

function parseSwarmMetrics(payload: unknown): AgentSwarmMetrics {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Governed swarm status response was not an object');
  }

  const data = payload as Record<string, unknown>;
  const countyId = typeof data.countyId === 'string' ? data.countyId : null;
  const swarmActivity = typeof data.swarmActivity === 'string' ? data.swarmActivity : null;

  if (!countyId || !swarmActivity) {
    throw new Error('Governed swarm status response missing countyId or swarmActivity');
  }

  return {
    countyId,
    activeAgents: requiredNumber(data, 'activeAgents'),
    swarmActivity,
    responseTimeMs: requiredNumber(data, 'responseTime'),
    accuracyScore: requiredNumber(data, 'accuracyScore'),
    consciousnessLevel: requiredNumber(data, 'consciousnessLevel'),
    quantumOptimizationFactor: requiredNumber(data, 'quantumOptimizationFactor'),
  };
}
