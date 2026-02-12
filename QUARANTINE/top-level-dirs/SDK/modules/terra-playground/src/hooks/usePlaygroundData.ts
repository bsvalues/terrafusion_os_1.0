/**
 * TerraFusion Playground - API Integration Hooks
 * Championship-level React Query integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PlaygroundScenario,
  ScenarioExecution,
  PlaygroundSession,
  CodeExecutionRequest,
  CodeExecutionResult,
  PlaygroundStats,
} from '../types';

const API_BASE = '/api/playground';

/**
 * Fetch all available playground scenarios
 */
export function usePlaygroundScenarios() {
  return useQuery<PlaygroundScenario[]>({
    queryKey: ['playground-scenarios'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/scenarios`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetch a specific scenario by ID
 */
export function useScenario(scenarioId: string | undefined) {
  return useQuery<PlaygroundScenario>({
    queryKey: ['playground-scenario', scenarioId],
    queryFn: async () => {
      if (!scenarioId) throw new Error('Scenario ID required');
      const response = await fetch(`${API_BASE}/scenarios/${scenarioId}`);
      if (!response.ok) throw new Error('Failed to fetch scenario');
      return response.json();
    },
    enabled: !!scenarioId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Execute code in playground sandbox
 */
export function useExecuteCode() {
  const queryClient = useQueryClient();

  return useMutation<CodeExecutionResult, Error, CodeExecutionRequest>({
    mutationFn: async (request) => {
      const response = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Code execution failed');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate stats after execution
      queryClient.invalidateQueries({ queryKey: ['playground-stats'] });
    },
  });
}

/**
 * Start a playground scenario
 */
export function useStartScenario() {
  const queryClient = useQueryClient();

  return useMutation<ScenarioExecution, Error, string>({
    mutationFn: async (scenarioId) => {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      if (!response.ok) throw new Error('Failed to start scenario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playground-session'] });
    },
  });
}

/**
 * Complete a playground scenario
 */
export function useCompleteScenario() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { scenarioId: string; success: boolean }>({
    mutationFn: async ({ scenarioId, success }) => {
      const response = await fetch(`${API_BASE}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, success }),
      });
      if (!response.ok) throw new Error('Failed to complete scenario');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playground-session'] });
      queryClient.invalidateQueries({ queryKey: ['playground-stats'] });
    },
  });
}

/**
 * Fetch current playground session
 */
export function usePlaygroundSession() {
  return useQuery<PlaygroundSession>({
    queryKey: ['playground-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/session`);
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    staleTime: 30_000, // Cache for 30 seconds
  });
}

/**
 * Fetch playground statistics
 */
export function usePlaygroundStats() {
  return useQuery<PlaygroundStats>({
    queryKey: ['playground-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    staleTime: 60_000, // Cache for 1 minute
  });
}

/**
 * Fetch scenario execution results
 */
export function useScenarioResults(scenarioId: string | undefined) {
  return useQuery<ScenarioExecution[]>({
    queryKey: ['scenario-results', scenarioId],
    queryFn: async () => {
      if (!scenarioId) throw new Error('Scenario ID required');
      const response = await fetch(`${API_BASE}/results/${scenarioId}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
    enabled: !!scenarioId,
    staleTime: 30_000,
  });
}
