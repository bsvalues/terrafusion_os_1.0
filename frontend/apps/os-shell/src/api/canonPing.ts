import { getViteEnv } from '@/env/getViteEnv';

export interface CanonPingNormalized {
  ok: boolean;
  ts: string;
  echo: string;
  toolId: string;
  inputCount: number;
}

export interface CanonPingResponse {
  tool: 'terracanon-ping';
  version: number;
  startedAt: string;
  dryRun: boolean;
  overallOk: boolean;
  error?: string;
  stderr?: string;
  rawStdout?: string;
  rawStderr?: string;
  normalized?: CanonPingNormalized | null;
  raw?: unknown;
}

const API_BASE_URL = getViteEnv().VITE_API_URL || 'http://localhost:5000';
const DEFAULT_ECHO = 'hello';
const MAX_ECHO_LENGTH = 160;

function coerceEcho(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_ECHO;
  return trimmed.slice(0, MAX_ECHO_LENGTH);
}

function failureResponse(error: string): CanonPingResponse {
  return {
    tool: 'terracanon-ping',
    version: 1,
    startedAt: new Date().toISOString(),
    dryRun: false,
    overallOk: false,
    error,
    normalized: null,
    raw: null,
  };
}

export async function runCanonPing(echoInput: string): Promise<CanonPingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/pilot/canon/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ echo: coerceEcho(echoInput) }),
    });

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return failureResponse('canon ping returned empty body');
    }

    try {
      return JSON.parse(bodyText) as CanonPingResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return failureResponse(`canon ping returned invalid JSON: ${message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(`canon ping request failed: ${message}`);
  }
}
