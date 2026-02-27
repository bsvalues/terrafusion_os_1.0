import { getViteEnv } from '@/env/getViteEnv';

export interface CanonDoctorResponse {
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

function failureResponse(error: string): CanonDoctorResponse {
  return {
    tool: 'terracanon-doctor',
    version: 1,
    startedAt: new Date().toISOString(),
    dryRun: false,
    overallOk: false,
    error,
    raw: null,
  };
}

export async function runCanonDoctor(): Promise<CanonDoctorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/pilot/canon/doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return failureResponse('canon doctor returned empty body');
    }

    try {
      return JSON.parse(bodyText) as CanonDoctorResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return failureResponse(`canon doctor returned invalid JSON: ${message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(`canon doctor request failed: ${message}`);
  }
}
