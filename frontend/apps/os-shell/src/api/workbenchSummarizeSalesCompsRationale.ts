import { getViteEnv } from '@/env/getViteEnv';

export interface WorkbenchSummarizeSalesCompsRationaleNormalized {
  rationale: string;
  comps: Array<{
    id: string;
    similarity: number;
    notes: string[];
  }>;
}

export interface WorkbenchSummarizeSalesCompsRationaleResponse {
  tool: string;
  version: number;
  startedAt: string;
  dryRun: boolean;
  overallOk: boolean;
  error?: string;
  stderr?: string;
  rawStdout?: string;
  rawStderr?: string;
  normalized?: WorkbenchSummarizeSalesCompsRationaleNormalized | null;
  raw?: unknown;
}

export interface WorkbenchSummarizeSalesCompsRationaleInput {
  county?: string;
  subjectId?: string;
  compIds?: string[];
  adjustments?: boolean;
}

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

function failureResponse(error: string): WorkbenchSummarizeSalesCompsRationaleResponse {
  return {
    tool: 'summarize_sales_comps_rationale',
    version: 1,
    startedAt: new Date().toISOString(),
    dryRun: false,
    overallOk: false,
    error,
    normalized: null,
    raw: null,
  };
}

export async function runWorkbenchSummarizeSalesCompsRationale(
  input: WorkbenchSummarizeSalesCompsRationaleInput = {}
): Promise<WorkbenchSummarizeSalesCompsRationaleResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/pilot/workbench/summarize-sales-comps-rationale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return failureResponse('workbench summarize_sales_comps_rationale returned empty body');
    }

    try {
      return JSON.parse(bodyText) as WorkbenchSummarizeSalesCompsRationaleResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return failureResponse(
        `workbench summarize_sales_comps_rationale returned invalid JSON: ${message}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(`workbench summarize_sales_comps_rationale request failed: ${message}`);
  }
}

