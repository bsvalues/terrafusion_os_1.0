import { getViteEnv } from '@/env/getViteEnv';

export interface CanonGateFastResponse {
  tool: string;
  version: number;
  startedAt: string;
  dryRun: boolean;
  overallOk: boolean;
  error?: string;
  stderr?: string;
  rawStdout?: string;
  rawStderr?: string;
  raw?: unknown;
}

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

function failureResponse(error: string): CanonGateFastResponse {
  return {
    tool: 'terracanon-gatefast',
    version: 1,
    startedAt: new Date().toISOString(),
    dryRun: false,
    overallOk: false,
    error,
    raw: null,
  };
}

export async function runCanonGateFast(): Promise<CanonGateFastResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/pilot/canon/gatefast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return failureResponse('canon gatefast returned empty body');
    }

    try {
      return JSON.parse(bodyText) as CanonGateFastResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return failureResponse(`canon gatefast returned invalid JSON: ${message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(`canon gatefast request failed: ${message}`);
  }
}
