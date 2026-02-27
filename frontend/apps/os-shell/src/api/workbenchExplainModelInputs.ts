import { getViteEnv } from '@/env/getViteEnv';

export interface WorkbenchExplainModelInputsNormalized {
  ok: boolean;
  ts: string;
  echo: string;
  toolId: string;
  inputCount: number;
}

export interface WorkbenchExplainModelInputsResponse {
  tool: string;
  version: number;
  startedAt: string;
  dryRun: boolean;
  overallOk: boolean;
  error?: string;
  stderr?: string;
  rawStdout?: string;
  rawStderr?: string;
  normalized?: WorkbenchExplainModelInputsNormalized | null;
  raw?: unknown;
}

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const DEFAULT_ECHO = 'hello';
const MAX_ECHO_LENGTH = 160;

function coerceEcho(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_ECHO;
  return trimmed.slice(0, MAX_ECHO_LENGTH);
}

function failureResponse(error: string): WorkbenchExplainModelInputsResponse {
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

export async function runWorkbenchExplainModelInputs(
  echoInput: string
): Promise<WorkbenchExplainModelInputsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/pilot/workbench/explain-model-inputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ echo: coerceEcho(echoInput) }),
    });

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return failureResponse('workbench explain_model_inputs returned empty body');
    }

    try {
      return JSON.parse(bodyText) as WorkbenchExplainModelInputsResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return failureResponse(`workbench explain_model_inputs returned invalid JSON: ${message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(`workbench explain_model_inputs request failed: ${message}`);
  }
}
