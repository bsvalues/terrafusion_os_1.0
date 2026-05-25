export type CurrentUseAiAction =
  | 'SUMMARIZE_DOCUMENT'
  | 'EXPLAIN_RULE'
  | 'EXPLAIN_CALCULATION'
  | 'DRAFT_NOTICE_LANGUAGE'
  | 'IDENTIFY_MISSING_EVIDENCE'
  | 'COMPARE_OWNER_STATEMENTS'
  | 'SUMMARIZE_TIMELINE'
  | 'FLAG_POSSIBLE_INCONSISTENCY';

export type ForbiddenCurrentUseAiAction =
  | 'APPROVE_CLASSIFICATION'
  | 'DENY_CLASSIFICATION'
  | 'FINALIZE_REMOVAL'
  | 'OVERRIDE_ROLLBACK_CALCULATION'
  | 'WAIVE_PENALTY'
  | 'DETERMINE_STATUTORY_EXCEPTION'
  | 'ISSUE_FINAL_NOTICE_WITHOUT_HUMAN_REVIEW';

export interface CurrentUseAiRequest {
  action: CurrentUseAiAction;
  parcelId: string;
  countyId: string;
  promptContext: Record<string, unknown>;
  requestedBy: string;
}

export interface CurrentUseAiResponse {
  responseId: string;
  action: CurrentUseAiAction;
  text: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  citations?: string[];
  disclaimer: string;
  createdAt: string;
}
