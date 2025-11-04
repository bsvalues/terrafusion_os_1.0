/* stylelint-disable */
/**
 * PlaygroundEnvironmentService
 * Minimal frontend client for the Playground Phase 4 endpoints
 */

export type PlaygroundHealth = {
  status: string;
  timestamp: string;
  endpoints: string[];
};

export type PlaygroundScenario = {
  id: string;
  name: string;
  description?: string;
};

const BASE = '/api/playground';

export async function getPlaygroundHealth(): Promise<PlaygroundHealth> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`Playground health failed: ${res.status}`);
  return res.json();
}

export async function listPlaygroundScenarios(): Promise<PlaygroundScenario[]> {
  const res = await fetch(`${BASE}/scenarios`);
  if (!res.ok) throw new Error(`Playground scenarios failed: ${res.status}`);
  const data = await res.json();
  return data.scenarios ?? [];
}

export async function startPlaygroundScenario(
  scenarioId: string,
  parameters?: Record<string, string>
): Promise<{
  message: string;
  scenarioId: string;
  runId: string;
  status: string;
  startedAt: string;
}> {
  const res = await fetch(`${BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, parameters: parameters ?? {} }),
  });
  if (!res.ok && res.status !== 202) {
    throw new Error(`Playground start failed: ${res.status}`);
  }
  return res.json();
}

export type PlaygroundRun = {
  id: string;
  scenarioId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  startedAt: string;
  completedAt?: string;
  parameters?: Record<string, string>;
  result?: unknown;
  error?: string;
};

export async function listPlaygroundRuns(): Promise<PlaygroundRun[]> {
  const res = await fetch(`${BASE}/runs`);
  if (!res.ok) throw new Error(`Playground runs failed: ${res.status}`);
  const data = await res.json();
  return data.runs ?? [];
}

export async function getPlaygroundRun(id: string): Promise<PlaygroundRun> {
  const res = await fetch(`${BASE}/runs/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Playground run ${id} failed: ${res.status}`);
  return res.json();
}
