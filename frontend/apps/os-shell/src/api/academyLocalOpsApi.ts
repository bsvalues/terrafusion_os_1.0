import { apiFetch } from '../lib/apiBase';
import type { LocalOpsViewModel } from '../components/localops/LocalOpsPanel';

export type AcademyLocalOpsQuestionId =
  | 'localops-safety-boundary'
  | 'source-grounded-evidence'
  | 'localops-panel-diagnostic';

export interface AcademyLocalOpsRequest {
  questionId: AcademyLocalOpsQuestionId;
}

export interface AcademyLocalOpsSource {
  sourceFile: string;
  heading?: string;
  snippet: string;
}

export interface AcademyLocalOpsSuccess {
  ok: true;
  status: 'success';
  journey: 'academy-localops' | 'localops-diagnostic-panel';
  question: { id: AcademyLocalOpsQuestionId; label: string };
  answer: {
    text: string;
    grounded: true;
    sources: AcademyLocalOpsSource[];
  };
  provider: { name: string; model?: string; boundary: 'hermes-ssh-tunnel' };
  safety: {
    externalCalls: false;
    allowWeb: false;
    allowShell: false;
    allowMutation: false;
    requireTrace: true;
    requireSources: true;
  };
  trace: { eventCount: number };
  viewModel?: LocalOpsViewModel;
}

export interface AcademyLocalOpsFailure {
  ok: false;
  status: 'disabled' | 'unavailable' | 'misconfigured' | 'failed' | 'refused';
  reasonCode: string;
  message: string;
  safeAlternatives?: string[];
}

export type AcademyLocalOpsResponse = AcademyLocalOpsSuccess | AcademyLocalOpsFailure;

export async function askAcademyLocalOps(
  request: AcademyLocalOpsRequest
): Promise<AcademyLocalOpsResponse> {
  const response = await apiFetch('/pilot/localops/academy/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = (await response.json()) as AcademyLocalOpsResponse;
  if (typeof payload !== 'object' || payload === null || typeof payload.ok !== 'boolean') {
    throw new Error('LocalOps Academy returned an invalid response.');
  }
  return payload;
}
