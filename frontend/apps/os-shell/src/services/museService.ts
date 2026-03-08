/**
 * Muse NLP Service — AI-powered explanation engine
 * =================================================================
 * Write-lane owner: Muse owns natural language explanation generation
 * for all muse-mode tools across suites (forge, dais, dossier).
 *
 * R2.11: Template-based engine; swaps to Claude API in R3.
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const MUSE_API = `${API_BASE_URL}/api/muse`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MuseCapabilities {
  engine: string;
  aiPowered: boolean;
  supportedTypes: string[];
  audiences: string[];
}

export interface ExplanationResult {
  parcelId: string;
  explanation: string;
  drivers: string[];
  confidence: number;
  engine: string;
}

export interface DraftResult {
  parcelId: string | null;
  draft: string;
  noticeType: string;
  engine: string;
}

export interface SynthesisResult {
  parcelId: string;
  synthesis: string;
  sources: string[];
  confidence: number;
  engine: string;
}

export interface ExplainValueChangeRequest {
  parcelId: string;
  fromYear?: number;
  toYear?: number;
  fromValue?: number;
  toValue?: number;
  audience?: 'taxpayer' | 'appraiser' | 'commissioner' | 'internal';
}

export interface ExplainAssessmentRequest {
  parcelId: string;
  audience?: string;
}

export interface DraftNoticeRequest {
  parcelId: string;
  noticeType?: string;
  taxYear?: number;
}

export interface DraftAppealResponseRequest {
  parcelId: string;
  caseId: string;
  assessedValue: number;
}

export interface GenerateMemoRequest {
  topic: string;
  context?: string;
}

export interface SynthesizeEvidenceRequest {
  parcelId: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function museGet<T>(path: string): Promise<T> {
  const response = await fetch(`${MUSE_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Muse API error: ${response.statusText}`);
  return response.json();
}

async function musePost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${MUSE_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Muse API error: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// MUSE SERVICE
// ============================================================================

export const museService = {
  /**
   * Get Muse engine capabilities and supported explanation types
   */
  getCapabilities: async (): Promise<MuseCapabilities> => {
    return museGet<MuseCapabilities>('/capabilities');
  },

  /**
   * Explain a property value change in natural language
   * Supports audience-specific prose: taxpayer, appraiser, commissioner, internal
   */
  explainValueChange: async (
    request: ExplainValueChangeRequest
  ): Promise<ExplanationResult> => {
    return musePost<ExplanationResult>('/explain/value-change', request);
  },

  /**
   * Explain the current assessment for a property
   */
  explainAssessment: async (
    request: ExplainAssessmentRequest
  ): Promise<ExplanationResult> => {
    return musePost<ExplanationResult>('/explain/assessment', request);
  },

  /**
   * Draft a value change notice for a property owner
   */
  draftNotice: async (request: DraftNoticeRequest): Promise<DraftResult> => {
    return musePost<DraftResult>('/draft/notice', request);
  },

  /**
   * Draft a response to a Board of Equalization appeal
   */
  draftAppealResponse: async (
    request: DraftAppealResponseRequest
  ): Promise<DraftResult> => {
    return musePost<DraftResult>('/draft/appeal-response', request);
  },

  /**
   * Generate a commissioner memorandum
   */
  generateMemo: async (request: GenerateMemoRequest): Promise<DraftResult> => {
    return musePost<DraftResult>('/draft/memo', request);
  },

  /**
   * Synthesize evidence from multiple data sources for a parcel
   */
  synthesizeEvidence: async (
    request: SynthesizeEvidenceRequest
  ): Promise<SynthesisResult> => {
    return musePost<SynthesisResult>('/synthesize', request);
  },
};

export default museService;
