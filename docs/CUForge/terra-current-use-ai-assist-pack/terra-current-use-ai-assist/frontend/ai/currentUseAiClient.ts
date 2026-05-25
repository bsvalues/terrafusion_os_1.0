import type { CurrentUseAiRequest, CurrentUseAiResponse } from './currentUseAiTypes';

export async function requestCurrentUseAiAssist(
  request: CurrentUseAiRequest,
): Promise<CurrentUseAiResponse> {
  const response = await fetch('/api/forge/current-use/ai/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to request Current Use AI assist.');
  }

  return response.json();
}

export async function requestCurrentUseAiAssistMock(
  request: CurrentUseAiRequest,
): Promise<CurrentUseAiResponse> {
  return {
    responseId: crypto.randomUUID(),
    action: request.action,
    text: buildMockResponse(request),
    confidence: 'MEDIUM',
    citations: [],
    disclaimer:
      'AI-assisted review support only. Final classification, removal, penalty, and tax determinations must be made by authorized county staff.',
    createdAt: new Date().toISOString(),
  };
}

function buildMockResponse(request: CurrentUseAiRequest): string {
  switch (request.action) {
    case 'EXPLAIN_CALCULATION':
      return [
        'The rollback calculation compares taxes that were levied under Current Use value against taxes that would have been levied under true and fair value.',
        'The difference is computed for each rollback year, then interest is estimated.',
        'Penalty is shown separately and may be suppressed only when a valid statutory or procedural reason is selected by staff.',
      ].join('\n\n');
    case 'IDENTIFY_MISSING_EVIDENCE':
      return [
        'Potential missing evidence detected:',
        '- Income proof for parcel under 20 acres.',
        '- Lease agreement because owner and operator differ.',
        '- Staff review note confirming continued commercial agricultural use.',
      ].join('\n');
    case 'SUMMARIZE_TIMELINE':
      return 'The parcel was classified in 2019, received an updated farm plan in 2025, and was moved into monitoring in 2026 due to missing income proof.';
    case 'DRAFT_NOTICE_LANGUAGE':
      return 'Draft language should state the reason for review, response deadline, contact information, and that final determinations are made by authorized staff.';
    default:
      return 'AI assist response placeholder for Current Use review support.';
  }
}
