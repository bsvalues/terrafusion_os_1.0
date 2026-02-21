import { getViteEnv } from '@/env/getViteEnv';

export interface WorkbenchCompareAssessedValueHistoryNormalized {
  trend: Array<{ year: number; av: number; tv?: number }>;
  narrative: string;
  flags?: string[];
}

export interface WorkbenchCompareAssessedValueHistoryResponse {
  tool: string;
  version: number;
  startedAt: string;
  dryRun: boolean;
  overallOk: boolean;
  error?: string;
  stderr?: string;
  rawStdout?: string;
  rawStderr?: string;
  normalized?: WorkbenchCompareAssessedValueHistoryNormalized | null;
  raw?: unknown;
}

export interface WorkbenchCompareAssessedValueHistoryInput {
  county?: string;
  parcelId?: string;
  years?: number[];
  includeBreakdown?: boolean;
}

const API_BASE_URL = getViteEnv().VITE_API_URL || 'http://localhost:5000';

function failureResponse(error: string): WorkbenchCompareAssessedValueHistoryResponse {
  return {
    tool: 'compare_assessed_value_history',
    version: 1,
    startedAt: new Date().toISOString(),
    dryRun: false,
    overallOk: false,
    error,
    normalized: null,
    raw: null,
  };
}

export async function runWorkbenchCompareAssessedValueHistory(
  input: WorkbenchCompareAssessedValueHistoryInput = {}
): Promise<WorkbenchCompareAssessedValueHistoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/pilot/workbench/compare-assessed-value-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return failureResponse('workbench compare_assessed_value_history returned empty body');
    }

    try {
      return JSON.parse(bodyText) as WorkbenchCompareAssessedValueHistoryResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return failureResponse(
        `workbench compare_assessed_value_history returned invalid JSON: ${message}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(`workbench compare_assessed_value_history request failed: ${message}`);
  }
}
