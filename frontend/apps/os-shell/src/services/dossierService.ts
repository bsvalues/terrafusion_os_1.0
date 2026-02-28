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
// DEFAULT DATA (fallback when API is offline)
// ============================================================================

const DEFAULT_DOCUMENTS: DossierDocument[] = [
  { id: '1', name: 'Warranty Deed - 3210 W Clearwater Ave.pdf', type: 'deed', parcelId: '104841000002000', uploadedBy: 'County Recorder', uploadedAt: '2026-01-15 09:22', size: '245 KB', status: 'active', custodyChain: 3 },
  { id: '2', name: 'Exterior Photo Set - Front/Side/Rear.jpg', type: 'photo', parcelId: '104841000002000', uploadedBy: 'Field Appraiser B. Smith', uploadedAt: '2026-02-10 14:35', size: '8.2 MB', status: 'active', custodyChain: 2 },
  { id: '3', name: 'Cost Approach Worksheet - 2026 Reval.xlsx', type: 'appraisal', parcelId: '104841000002000', uploadedBy: 'Appraiser D. Wilson', uploadedAt: '2026-02-18 11:14', size: '156 KB', status: 'active', custodyChain: 1 },
  { id: '4', name: 'BOE Appeal Petition #2026-042.pdf', type: 'appeal', parcelId: '104841000015200', uploadedBy: 'Property Owner', uploadedAt: '2026-03-01 16:45', size: '342 KB', status: 'active', custodyChain: 4 },
  { id: '5', name: 'Sales Verification Letter.pdf', type: 'correspondence', parcelId: '104841000016300', uploadedBy: 'Appraiser M. Lee', uploadedAt: '2026-01-28 10:30', size: '89 KB', status: 'active', custodyChain: 2 },
  { id: '6', name: 'Floor Plan Sketch - Main Level.svg', type: 'sketch', parcelId: '104841000002000', uploadedBy: 'Field Appraiser B. Smith', uploadedAt: '2026-02-10 15:12', size: '45 KB', status: 'active', custodyChain: 1 },
  { id: '7', name: 'Annual Assessment Report - District 12.pdf', type: 'report', parcelId: '-', uploadedBy: 'Chief Appraiser', uploadedAt: '2025-12-15 17:00', size: '1.8 MB', status: 'sealed', custodyChain: 5 },
  { id: '8', name: 'Previous Owner Deed - Transfer 2019.pdf', type: 'deed', parcelId: '104841000002000', uploadedBy: 'County Recorder', uploadedAt: '2019-06-22 09:10', size: '198 KB', status: 'archived', custodyChain: 6 },
];

const DEFAULT_EVIDENCE: EvidenceItem[] = [
  { id: 'E-2026-001', title: 'Comparable Sales Grid \u2014 3210 W Clearwater', parcelId: '104841000002000', evidenceType: 'market-data', createdBy: 'Appraiser D. Wilson', createdAt: '2026-02-15', integrity: 'verified', chainLength: 4, lastAction: 'Supervisor review complete' },
  { id: 'E-2026-002', title: 'Field Inspection Report \u2014 3210 W Clearwater', parcelId: '104841000002000', evidenceType: 'field-inspection', createdBy: 'Field Appraiser B. Smith', createdAt: '2026-02-10', integrity: 'verified', chainLength: 3, lastAction: 'Photos attached & geotagged' },
  { id: 'E-2026-003', title: 'RCNLD Worksheet \u2014 3210 W Clearwater', parcelId: '104841000002000', evidenceType: 'cost-analysis', createdBy: 'CostForge AI', createdAt: '2026-02-18', integrity: 'verified', chainLength: 2, lastAction: 'AI model output verified by appraiser' },
  { id: 'E-2026-004', title: 'BOE Appeal Defense Packet \u2014 #2026-042', parcelId: '104841000015200', evidenceType: 'appeal-evidence', createdBy: 'Appraiser M. Lee', createdAt: '2026-03-01', integrity: 'pending', chainLength: 6, lastAction: 'Defense packet assembled, pending review' },
  { id: 'E-2026-005', title: 'Income Approach \u2014 810 N Morain (Commercial)', parcelId: '104841000018500', evidenceType: 'income-analysis', createdBy: 'Appraiser K. Patel', createdAt: '2026-01-28', integrity: 'verified', chainLength: 3, lastAction: 'Cap rate verified against market' },
  { id: 'E-2026-006', title: 'DOR Ratio Study Compliance \u2014 District 12', parcelId: '-', evidenceType: 'regulatory', createdBy: 'Chief Appraiser', createdAt: '2026-02-20', integrity: 'verified', chainLength: 5, lastAction: 'Filed with WA DOR' },
  { id: 'E-2026-007', title: 'Sales Verification \u2014 5501 W Canal Dr', parcelId: '104841000017400', evidenceType: 'market-data', createdBy: 'Appraiser D. Wilson', createdAt: '2026-01-22', integrity: 'disputed', chainLength: 7, lastAction: 'Owner disputes sale conditions' },
];

const DEFAULT_CHAIN: ChainEvent[] = [
  { timestamp: '2026-02-15 09:14:22', actor: 'CostForge AI', action: 'Evidence created \u2014 AI-generated comparable grid', hash: 'a3f2...c891' },
  { timestamp: '2026-02-15 14:30:05', actor: 'Appraiser D. Wilson', action: 'Human review \u2014 adjustments verified', hash: 'b7e1...d432' },
  { timestamp: '2026-02-16 10:22:18', actor: 'Supervisor R. Chen', action: 'Supervisory review \u2014 approved', hash: 'c5a8...e765' },
  { timestamp: '2026-02-18 08:00:00', actor: 'TerraTrace', action: 'Evidence sealed \u2014 immutable audit record', hash: 'd912...f098' },
];

// ============================================================================
// DOSSIER SERVICE
// ============================================================================

export const dossierService = {
  /**
   * Search documents
   */
  searchDocuments: async (request: DocumentSearchRequest): Promise<DocumentSearchResponse> => {
    try {
      return await dossierPost<DocumentSearchResponse>('/documents/search', request);
    } catch {
      let results = DEFAULT_DOCUMENTS;
      if (request.query) {
        const q = request.query.toLowerCase();
        results = results.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.parcelId.includes(q) ||
            d.uploadedBy.toLowerCase().includes(q)
        );
      }
      if (request.type && request.type !== 'all') {
        results = results.filter((d) => d.type === request.type);
      }
      if (request.status && request.status !== 'all') {
        results = results.filter((d) => d.status === request.status);
      }
      return { results, total: results.length, hasMore: false };
    }
  },

  /**
   * Get document by ID
   */
  getDocument: async (id: string): Promise<DossierDocument | null> => {
    try {
      return await dossierGet<DossierDocument>(`/documents/${id}`);
    } catch {
      return DEFAULT_DOCUMENTS.find((d) => d.id === id) ?? null;
    }
  },

  /**
   * Search evidence items
   */
  searchEvidence: async (request: EvidenceSearchRequest): Promise<EvidenceSearchResponse> => {
    try {
      return await dossierPost<EvidenceSearchResponse>('/evidence/search', request);
    } catch {
      let results = DEFAULT_EVIDENCE;
      if (request.parcelId) {
        results = results.filter((e) => e.parcelId === request.parcelId);
      }
      if (request.evidenceType && request.evidenceType !== 'all') {
        results = results.filter((e) => e.evidenceType === request.evidenceType);
      }
      if (request.integrity && request.integrity !== 'all') {
        results = results.filter((e) => e.integrity === request.integrity);
      }
      return { results, total: results.length, hasMore: false };
    }
  },

  /**
   * Get evidence chain-of-custody events
   */
  getChainOfCustody: async (evidenceId: string): Promise<ChainEvent[]> => {
    try {
      return await dossierGet<ChainEvent[]>(`/evidence/${evidenceId}/chain`);
    } catch {
      return DEFAULT_CHAIN;
    }
  },

  /**
   * Get dossier statistics
   */
  getStats: async (): Promise<DossierStats> => {
    try {
      return await dossierGet<DossierStats>('/stats');
    } catch {
      const docs = DEFAULT_DOCUMENTS;
      const evid = DEFAULT_EVIDENCE;
      return {
        totalDocuments: docs.length,
        activeDocuments: docs.filter((d) => d.status === 'active').length,
        sealedRecords: docs.filter((d) => d.status === 'sealed').length,
        archivedDocuments: docs.filter((d) => d.status === 'archived').length,
        documentTypes: new Set(docs.map((d) => d.type)).size,
        totalEvidence: evid.length,
        verifiedEvidence: evid.filter((e) => e.integrity === 'verified').length,
        pendingEvidence: evid.filter((e) => e.integrity === 'pending').length,
        disputedEvidence: evid.filter((e) => e.integrity === 'disputed').length,
      };
    }
  },
};

export default dossierService;
