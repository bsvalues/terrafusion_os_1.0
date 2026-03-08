/**
 * DAIS Service — District Assessment & Information System API
 * =================================================================
 * Covers certification status, exemption impact analysis,
 * BOE packet assembly, notice drafting, and sales comps rationale.
 *
 * Backend: DaisController (/api/dais/*)
 * Auth: [Authorize] + [RequiresPermission] on all endpoints
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const DAIS_API = `${API_BASE_URL}/api/dais`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CertificationStatus {
  year: number;
  status: string;
  totalParcels: number;
  certifiedParcels: number;
  percentComplete: number;
  lastUpdated: string;
}

export interface ExemptionImpact {
  county: string;
  program: string;
  year: number;
  exemptValue: number;
  levyImpact: number;
  parcelsAffected: number;
  tiers: Array<{
    tier: string;
    incomeLimit: number;
    exemptionPercent: number;
    parcels: number;
  }>;
}

export interface AssignTaskRequest {
  taskType: string;
  assigneeId: string;
  parcelId?: string;
  priority?: string;
  description?: string;
}

export interface DraftNoticeRequest {
  noticeType: string;
  parcelId: string;
  reason?: string;
  effectiveDate?: string;
}

export interface DraftAppealResponseRequest {
  responseType: string;
  findings?: string;
  recommendation?: string;
}

export interface GenerateMemoRequest {
  memoType: string;
  subject: string;
  context?: Record<string, unknown>;
}

export interface AssembleBoePacketRequest {
  caseId: string;
  parcelId: string;
  includeSections?: string[];
}

export interface SalesCompsRationale {
  subjectId: string;
  comparables: Array<{
    parcelId: string;
    address: string;
    salePrice: number;
    saleDate: string;
    adjustedPrice?: number;
    similarity: number;
  }>;
  rationale: string;
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

async function daisGet<T>(path: string): Promise<T> {
  const response = await fetch(`${DAIS_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`DAIS API error: ${response.statusText}`);
  return response.json();
}

async function daisPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${DAIS_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`DAIS API error: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// DAIS SERVICE
// ============================================================================

export const daisService = {
  // Read endpoints (R2 Wave 3 — real DB queries)

  /** Get certification status for a given year */
  getCertificationStatus: async (year?: number): Promise<CertificationStatus> => {
    const qs = year ? `?year=${year}` : '';
    return daisGet<CertificationStatus>(`/certification/status${qs}`);
  },

  /** Get senior exemption impact analysis */
  getExemptionImpact: async (
    county: string,
    options?: { program?: string; year?: number }
  ): Promise<ExemptionImpact> => {
    const params = new URLSearchParams();
    if (options?.program) params.set('program', options.program);
    if (options?.year) params.set('year', String(options.year));
    const qs = params.toString();
    return daisGet<ExemptionImpact>(
      `/exemptions/${encodeURIComponent(county)}/impact${qs ? `?${qs}` : ''}`
    );
  },

  /** Get sales comparables rationale for a subject property */
  getSalesCompsRationale: async (
    subjectId: string,
    options?: { compIds?: string; adjustments?: boolean }
  ): Promise<SalesCompsRationale> => {
    const params = new URLSearchParams();
    if (options?.compIds) params.set('compIds', options.compIds);
    if (options?.adjustments) params.set('adjustments', 'true');
    const qs = params.toString();
    return daisGet<SalesCompsRationale>(
      `/comps/${encodeURIComponent(subjectId)}/rationale${qs ? `?${qs}` : ''}`
    );
  },

  /** Synthesize evidence for a dossier */
  synthesizeEvidence: async (dossierId: string): Promise<unknown> => {
    return daisGet<unknown>(`/evidence/${encodeURIComponent(dossierId)}/synthesize`);
  },

  // Write endpoints

  /** Assign a task to a user */
  assignTask: async (request: AssignTaskRequest): Promise<unknown> => {
    return daisPost<unknown>('/tasks/assign', request);
  },

  /** Assemble a BOE appeal packet */
  assembleBoePacket: async (request: AssembleBoePacketRequest): Promise<unknown> => {
    return daisPost<unknown>('/packets/assemble', request);
  },

  /** Draft a value change notice or other notice */
  draftNotice: async (request: DraftNoticeRequest): Promise<unknown> => {
    return daisPost<unknown>('/notices/draft', request);
  },

  /** Draft an appeal response for a case */
  draftAppealResponse: async (
    caseId: string,
    request: DraftAppealResponseRequest
  ): Promise<unknown> => {
    return daisPost<unknown>(`/appeals/${encodeURIComponent(caseId)}/draft-response`, request);
  },

  /** Generate a commissioner memo */
  generateCommissionerMemo: async (request: GenerateMemoRequest): Promise<unknown> => {
    return daisPost<unknown>('/memos/generate', request);
  },

  /** Request trace redaction */
  requestTraceRedaction: async (request: {
    traceId: string;
    reason: string;
    fields: string[];
  }): Promise<unknown> => {
    return daisPost<unknown>('/redaction', request);
  },

  /** Get levy rate components (history) for a county */
  getLevyRateComponents: async (options?: {
    taxYear?: number;
    districtId?: string;
  }): Promise<unknown> => {
    const params = new URLSearchParams();
    if (options?.taxYear) params.set('taxYear', String(options.taxYear));
    if (options?.districtId) params.set('districtId', options.districtId);
    const qs = params.toString();
    // Levy endpoint is on a separate controller route
    const API_BASE_URL = getViteEnv().VITE_API_URL || '';
    const response = await fetch(
      `${API_BASE_URL}/api/levy-calculation/history${qs ? `?${qs}` : ''}`,
      { headers: authHeaders() }
    );
    if (!response.ok) throw new Error(`Levy API error: ${response.statusText}`);
    return response.json();
  },
};

export default daisService;
