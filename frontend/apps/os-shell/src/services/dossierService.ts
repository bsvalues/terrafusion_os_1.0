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
};

export default dossierService;
