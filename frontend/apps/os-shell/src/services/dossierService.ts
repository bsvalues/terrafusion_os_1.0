/**
 * TerraDossier API Service — Evidence & Document Management
 * =================================================================
 * Write-lane owner: Dossier owns evidence files, chain-of-custody,
 * attachments, photo metadata.
 *
 * @see config/suiteRegistry.ts — Constitutional Suite: dossier
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';
import type { DossierDetailsOptions, DossierDetailsResponse } from '@/contracts/dossierDetails';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const DOSSIER_API = `${API_BASE_URL}/api/dossier`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DocumentType =
  | 'deed'
  | 'photo'
  | 'appraisal'
  | 'appeal'
  | 'correspondence'
  | 'sketch'
  | 'report';

export type DocumentStatus = 'active' | 'archived' | 'sealed';

export type EvidenceType =
  | 'market-data'
  | 'field-inspection'
  | 'cost-analysis'
  | 'income-analysis'
  | 'appeal-evidence'
  | 'regulatory';

export type IntegrityStatus = 'verified' | 'pending' | 'disputed';

export interface DossierDocument {
  id: string;
  name: string;
  type: DocumentType;
  parcelId: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  status: DocumentStatus;
  custodyChain: number;
  mimeType?: string;
  hash?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  parcelId: string;
  evidenceType: EvidenceType;
  createdBy: string;
  createdAt: string;
  integrity: IntegrityStatus;
  chainLength: number;
  lastAction: string;
}

export interface ChainEvent {
  timestamp: string;
  actor: string;
  action: string;
  hash: string;
}

export interface DocumentSearchRequest {
  query?: string;
  type?: DocumentType | 'all';
  status?: DocumentStatus | 'all';
  parcelId?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentSearchResponse {
  results: DossierDocument[];
  total: number;
  hasMore: boolean;
}

export interface EvidenceSearchRequest {
  parcelId?: string;
  evidenceType?: EvidenceType | 'all';
  integrity?: IntegrityStatus | 'all';
  limit?: number;
  offset?: number;
}

export interface EvidenceSearchResponse {
  results: EvidenceItem[];
  total: number;
  hasMore: boolean;
}

export interface DossierStats {
  totalDocuments: number;
  activeDocuments: number;
  sealedRecords: number;
  archivedDocuments: number;
  documentTypes: number;
  totalEvidence: number;
  verifiedEvidence: number;
  pendingEvidence: number;
  disputedEvidence: number;
}

// ============================================================================
// CX-25: Evidence Snapshot Types (backend contract)
// ============================================================================

export interface EvidenceSnapshotResourceLinks {
  self: string;
  summary: string | null;
  details: string | null;
  notes: string;
  casefile: string;
}

export interface EvidencePropertySummary {
  propertyId: string;
  parcelNumber: string;
  address: string;
  propertyType: string | null;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
  marketValue: number;
  taxYear: number;
  assessmentDate: string;
}

export interface EvidenceValuationSummary {
  totalValue: number;
  categoryCount: number;
}

export interface EvidenceLevySummary {
  totalCount: number;
  includedCount: number;
  totalLevyAmount: number;
}

export interface EvidenceNoteSummary {
  totalCount: number;
  includedCount: number;
  noteTypes: string[];
}

/**
 * CX-25 evidence snapshot — self-contained, hash-verifiable evidence
 * document for a parcel. Suitable for audit, appeals, regulatory handoff.
 *
 * IMPORTANT: `contentHash` is a **snapshot hash**, NOT a content-only
 * digest. It includes `snapshotTimestamp`, so two requests for the same
 * parcel at different times will produce different hashes even if the
 * underlying data has not changed. This is by design — the hash proves
 * "this exact data at this exact time."
 */
export interface EvidenceSnapshot {
  parcelId: string;
  countyId: string;
  snapshotTimestamp: string;
  correlationId: string;
  contentHash: string;
  property: EvidencePropertySummary;
  valuation: EvidenceValuationSummary | null;
  levies: EvidenceLevySummary;
  notes: EvidenceNoteSummary;
  links: EvidenceSnapshotResourceLinks;
}

/** Response wrapper for evidence fetch — includes HTTP correlation header */
export interface EvidenceSnapshotResult {
  snapshot: EvidenceSnapshot;
  /** X-Correlation-ID from response header (may differ from body correlationId) */
  headerCorrelationId: string | null;
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

async function dossierGet<T>(path: string): Promise<T> {
  const response = await fetch(`${DOSSIER_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Dossier API error: ${response.statusText}`);
  return response.json();
}

async function dossierPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${DOSSIER_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Dossier API error: ${response.statusText}`);
  return response.json();
}

/** Generate a correlation ID matching the CostForge pattern. */
function generateCorrelationId(): string {
  return `tf-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * GET with X-Correlation-ID header injection.
 * Returns both the parsed body and the correlation ID echoed by the server.
 */
async function dossierGetWithCorrelation<T>(
  path: string,
  correlationId?: string,
): Promise<{ data: T; correlationId: string }> {
  const cid = correlationId || generateCorrelationId();
  const headers: Record<string, string> = {
    ...authHeaders(),
    'X-Correlation-ID': cid,
  };

  const response = await fetch(`${DOSSIER_API}${path}`, { headers });
  if (!response.ok) {
    throw new Error(`Dossier API error: ${response.status} ${response.statusText}`);
  }

  const data: T = await response.json();

  // Prefer the server-echoed header; fall back to what we sent
  const echoed = response.headers.get('X-Correlation-ID') || cid;
  return { data, correlationId: echoed };
}

// ============================================================================
// NOTE: DEFAULT fallback data removed in CC-14 (R1 Week 3).
// All service methods now propagate errors from the real backend.
// ============================================================================

// ============================================================================
// DOSSIER SERVICE
// ============================================================================

export const dossierService = {
  /**
   * Search documents
   */
  searchDocuments: async (request: DocumentSearchRequest): Promise<DocumentSearchResponse> => {
    return dossierPost<DocumentSearchResponse>('/documents/search', request);
  },

  /**
   * Get document by ID
   */
  getDocument: async (id: string): Promise<DossierDocument | null> => {
    try {
      return await dossierGet<DossierDocument>(`/documents/${encodeURIComponent(id)}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) return null;
      throw err;
    }
  },

  /**
   * Search evidence items
   */
  searchEvidence: async (request: EvidenceSearchRequest): Promise<EvidenceSearchResponse> => {
    return dossierPost<EvidenceSearchResponse>('/evidence/search', request);
  },

  /**
   * Get evidence chain-of-custody events
   */
  getChainOfCustody: async (evidenceId: string): Promise<ChainEvent[]> => {
    return dossierGet<ChainEvent[]>(`/evidence/${encodeURIComponent(evidenceId)}/chain`);
  },

  /**
   * Get dossier statistics
   */
  getStats: async (): Promise<DossierStats> => {
    return dossierGet<DossierStats>('/stats');
  },

  /**
   * CX-25: Get structured parcel dossier details.
   * Calls GET /api/dossier/parcels/{parcelId}/details with:
   *   - X-Correlation-ID header (generated and returned alongside data)
   *   - ?include=, ?levyLimit=, ?noteLimit= query parameters
   *
   * Returns the full DossierDetailsResponse with nullable sections and
   * the generated correlationId used for the request.
   */
  getDetails: async (
    parcelId: string,
    options?: DossierDetailsOptions,
  ): Promise<{ data: DossierDetailsResponse; correlationId: string }> => {
    const params = new URLSearchParams();
    if (options?.include) params.set('include', options.include);
    if (options?.levyLimit != null) params.set('levyLimit', String(options.levyLimit));
    if (options?.noteLimit != null) params.set('noteLimit', String(options.noteLimit));

    const qs = params.toString();
    const path = `/parcels/${encodeURIComponent(parcelId)}/details${qs ? `?${qs}` : ''}`;
    return dossierGetWithCorrelation<DossierDetailsResponse>(path);
  },

  /**
   * CX-26: Fetch the evidence snapshot for a parcel.
   * Returns the snapshot data plus the X-Correlation-ID response header.
   *
   * Endpoint: GET /api/dossier/parcels/{parcelId}/evidence
   * County-isolated: cross-county → 404
   */
  getEvidenceSnapshot: async (parcelId: string): Promise<EvidenceSnapshotResult> => {
    const response = await fetch(
      `${DOSSIER_API}/parcels/${encodeURIComponent(parcelId)}/evidence`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(`Dossier API error: ${response.status} ${response.statusText}`);
    }
    const snapshot: EvidenceSnapshot = await response.json();
    const headerCorrelationId = response.headers.get('X-Correlation-ID');
    return { snapshot, headerCorrelationId };
  },
};

export default dossierService;
