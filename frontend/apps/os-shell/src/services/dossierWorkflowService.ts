import { getToken } from '../auth/authStorage';

export interface WorkflowStudy { studyId: string; taxYear: number; status: string; baselineVersion: string }
export interface WorkflowDraft { draftId: string; studyId: string; countyId: string; taxYear: number; revision: string; artifactCount: number; createdAt: string }
export interface WorkflowExport {
  packageRef: string; payloadRef: string; countyId: string; taxYear: number;
  draftId: string | null; revision: string | null; artifactCount: number;
  artifacts: Array<{ name: string; sha256: string; mediaType: string; sourceId: string }>;
  contentHash: string; downloadUrl: string; createdAt: string; status: 'complete'; certification: false;
}
export interface WorkflowContext {
  countyId: string; taxYears: number[]; studies: WorkflowStudy[]; drafts: WorkflowDraft[]; exports: WorkflowExport[];
}
export interface WorkflowRecord {
  sourceTable: string; sourceId: string; countyId: string; taxYear: number;
  artifactType: 'persisted-record-metadata'; record: Record<string, unknown>;
}
export interface WorkflowAppealPacket {
  countyId: string; taxYear: number; appealId: string; parcelId: string; packetRef: string; payloadRef: string;
  packet: WorkflowRecord & { items: WorkflowRecord[] };
  documents: WorkflowRecord[]; evidence: WorkflowRecord[]; custody: WorkflowRecord[];
}
export class WorkflowRequestError extends Error {
  constructor(message: string, public readonly correlationId?: string) { super(message); }
}
const base = '/api/dossier/workflows';

async function request<T>(path: string, token: string, init: RequestInit = {}, bytes = false): Promise<T> {
  if (!token || getToken() !== token) throw new WorkflowRequestError('Session changed. Reload the workflow context.');
  const response = await fetch(`${base}${path}`, {
    ...init, redirect: 'error',
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const message = response.status === 403 || response.status === 401 ? 'Workflow access denied.'
      : response.status === 404 ? 'The saved record is unavailable.' : `Workflow request failed (${response.status}).`;
    throw new WorkflowRequestError(message, response.headers.get('X-Correlation-ID') ?? undefined);
  }
  return (bytes ? response.arrayBuffer() : response.json()) as Promise<T>;
}

export function requireWorkflowExport(value: unknown, countyId: string, taxYear: number, draft?: WorkflowDraft): WorkflowExport {
  const result = value as WorkflowExport | null;
  if (!result || result.status !== 'complete' || result.certification !== false || result.countyId !== countyId || result.taxYear !== taxYear
      || !Array.isArray(result.artifacts) || result.artifactCount !== result.artifacts.length || !/^[a-f0-9]{64}$/i.test(result.contentHash) || !result.packageRef
      || result.artifacts.some(item => !item || !item.name || !item.mediaType || !item.sourceId || !/^[a-f0-9]{64}$/i.test(item.sha256))
      || (draft && (result.draftId !== draft.draftId || result.revision !== draft.revision))) {
    throw new WorkflowRequestError('The returned export does not match the selected scope or a completed artifact.');
  }
  return result;
}

export function requireWorkflowAppealPacket(value: unknown, countyId: string, taxYear: number, appealId: string, parcelId?: string, packetRef?: string): WorkflowAppealPacket {
  const result = value as WorkflowAppealPacket | null;
  const validRecord = (item: WorkflowRecord, table: string) => item && item.sourceTable === table && !!item.sourceId
    && item.countyId === countyId && item.taxYear === taxYear && item.artifactType === 'persisted-record-metadata'
    && item.record && item.record.id === item.sourceId && (table === 'DossierPacketItems' || item.record.countyId === countyId);
  if (!result || result.countyId !== countyId || result.taxYear !== taxYear || result.appealId !== appealId
      || !result.packetRef || !result.parcelId || (parcelId !== undefined && result.parcelId !== parcelId)
      || (packetRef !== undefined && result.packetRef !== packetRef)
      || !validRecord(result.packet, 'DossierPackets') || result.packet.sourceId !== result.packetRef
      || result.packet.record.appealId !== appealId || result.packet.record.taxYear !== taxYear || result.packet.record.parcelId !== result.parcelId
      || !Array.isArray(result.packet.items) || !Array.isArray(result.documents) || !Array.isArray(result.evidence) || !Array.isArray(result.custody)
      || result.packet.items.some(item => !validRecord(item, 'DossierPacketItems') || item.record.packetId !== result.packetRef)
      || result.documents.some(item => !validRecord(item, 'DossierDocuments'))
      || result.evidence.some(item => !validRecord(item, 'DossierEvidenceItems'))
      || result.custody.some(item => !validRecord(item, 'DossierCustodyEvents'))) {
    throw new WorkflowRequestError('The returned packet does not match the selected scope or persisted packet identity.');
  }
  const documentIds = new Set(result.documents.map(item => item.sourceId));
  const linkedDocumentIds = new Set(result.packet.items.map(item => item.record.documentId));
  const evidenceIds = new Set(result.evidence.map(item => item.sourceId));
  if (result.documents.some(item => !linkedDocumentIds.has(item.sourceId))
      || result.packet.items.some(item => item.record.documentId != null && !documentIds.has(String(item.record.documentId)))
      || result.evidence.some(item => !documentIds.has(String(item.record.documentId)))
      || result.custody.some(item => !evidenceIds.has(String(item.record.evidenceId)))) {
    throw new WorkflowRequestError('The returned packet does not match its persisted document and evidence links.');
  }
  return result;
}

export const dossierWorkflowService = {
  appealPacketContent: (token: string, county: string, taxYear: number, appealId: string, parcelId: string) => {
    const query = new URLSearchParams({ county, taxYear: String(taxYear), parcelId });
    return request<ArrayBuffer>(`/appeals/${encodeURIComponent(appealId)}/packet?${query}`, token, {}, true);
  },
  context: (token: string, county: string, taxYear?: number, parcelId?: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ county });
    if (taxYear !== undefined) query.set('taxYear', String(taxYear));
    if (parcelId) query.set('parcelId', parcelId);
    return request<WorkflowContext>(`/context${query.size ? `?${query}` : ''}`, token, { signal });
  },
  saveDraft: (token: string, county: string, studyId: string, requestId: string) => request<WorkflowDraft>('/drafts', token, { method: 'POST', body: JSON.stringify({ county, studyId, requestId }) }),
  draft: (token: string, county: string, id: string) => request<WorkflowDraft>(`/drafts/${encodeURIComponent(id)}?county=${encodeURIComponent(county)}`, token),
  export: (token: string, county: string, id: string) => request<WorkflowExport>(`/exports/${encodeURIComponent(id)}?county=${encodeURIComponent(county)}`, token),
  // Build local URLs from the persisted ID; never forward a bearer token to a returned remote URL.
  content: (token: string, county: string, id: string) => request<ArrayBuffer>(`/exports/${encodeURIComponent(id)}/content?county=${encodeURIComponent(county)}`, token, {}, true),
};
