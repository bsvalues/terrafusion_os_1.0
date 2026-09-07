import { getToken } from '../auth/authStorage';

export interface WorkflowStudy { studyId: string; taxYear: number; status: string; baselineVersion: string }
export interface WorkflowDraft { draftId: string; studyId: string; countyId: string; taxYear: number; revision: string; artifactCount: number; createdAt: string; receipt?: WorkflowReceipt | null }
export interface WorkflowExport {
  packageRef: string; payloadRef: string; countyId: string; taxYear: number;
  draftId: string | null; revision: string | null; artifactCount: number;
  artifacts: Array<{ name: string; sha256: string; mediaType: string; sourceId: string }>;
  contentHash: string; downloadUrl: string; createdAt: string; status: 'complete'; certification: false;
  receipt?: WorkflowReceipt | null;
}
export interface WorkflowReceipt {
  receiptId: string; schemaVersion: '1.0'; correlationId: string; requestId: string;
  actorId: string; countyId: string; taxYear: number;
  operation: 'assessment_draft.create' | 'export_equalization_package' | 'export_audit_bundle'; reasonCode: string | null;
  inputs: Record<string, unknown>;
  outputs: { recordId: string; studyId: string | null; draftId: string | null; packageRef: string | null; sourceRevision: string | null; artifactCount: number; artifacts: WorkflowExport['artifacts'] };
  recordedAt: string;
  timing: { startedAt: string; elapsedMs: number; measurement: 'api-start-to-precommit-receipt' };
  system: { assemblyVersion: string; informationalVersion: string; moduleVersionId: string; environment: string };
  executionEvidence: { source: 'application-db'; auditLogId: string; payloadRef: string };
  traceReference: { correlationId: string; payloadRef: string; provider: 'pilot'; availability: 'not_verified' };
}
export interface WorkflowReceiptEvidence {
  countyId: string; taxYear: number; receipt: WorkflowReceipt;
  executionEvidence: { auditLogId: string; source: string; type: string; actorId: string; recordedAt: string; data: Record<string, unknown> };
}
export interface WorkflowMetrics {
  operation: string; correlationId: string; durationMs: number; measurement: 'pilot-request-to-response';
  environment: string; ok: boolean; errorCode: string | null;
}
export interface WorkflowHttpEvidence { correlationId: string; elapsedActionMs: number; errorCode?: string }
export type WorkflowObserver = (evidence: WorkflowHttpEvidence) => void;
export function sameWorkflowValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const left = Object.keys(a).sort(), right = Object.keys(b).sort();
  return left.length === right.length && left.every((key, i) => key === right[i]
    && sameWorkflowValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}
export function workflowMetrics(value: unknown, operation: string, correlationId: string | undefined, ok: boolean, errorCode?: string): WorkflowMetrics | undefined {
  const m = value as WorkflowMetrics | null;
  return m && !!correlationId && m.correlationId === correlationId && m.operation === operation && m.ok === ok
    && Number.isFinite(m.durationMs) && m.durationMs >= 0 && m.measurement === 'pilot-request-to-response'
    && typeof m.environment === 'string' && !!m.environment && (ok ? m.errorCode == null : m.errorCode === errorCode)
    ? m : undefined;
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
  constructor(message: string, public readonly correlationId?: string, public readonly errorCode = 'WORKFLOW_FAILED') { super(message); }
}
const base = '/api/dossier/workflows';

async function request<T>(path: string, token: string, init: RequestInit = {}, bytes = false, observe?: WorkflowObserver): Promise<T> {
  if (!token || getToken() !== token) throw new WorkflowRequestError('Session changed. Reload the workflow context.');
  const started = performance.now();
  let correlationId: string = crypto.randomUUID();
  let errorCode: string | undefined;
  try {
    const response = await fetch(`${base}${path}`, {
    ...init, redirect: 'error',
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}`, 'X-Correlation-ID': correlationId },
  });
  correlationId = response.headers.get('X-Correlation-ID') || correlationId;
  if (!response.ok) {
    let message = response.status === 403 || response.status === 401 ? 'Workflow access denied.'
      : response.status === 404 ? 'The saved record is unavailable.' : `Workflow request failed (${response.status}).`;
    errorCode = `HTTP_${response.status}`;
    const body: unknown = await response.json().catch(() => null);
    if (body && typeof body === 'object' && 'code' in body && typeof body.code === 'string' && /^[A-Z_]{1,80}$/.test(body.code)) {
      errorCode = body.code;
      if (response.status !== 401 && response.status !== 403 && 'error' in body && typeof body.error === 'string') message = body.error;
    }
    throw new WorkflowRequestError(message, correlationId, errorCode);
  }
  return await (bytes ? response.arrayBuffer() : response.json()) as T;
  } catch (error) {
    errorCode ??= error instanceof TypeError ? 'NETWORK_ERROR' : 'RESPONSE_ERROR';
    throw error instanceof WorkflowRequestError ? error : new WorkflowRequestError(error instanceof Error ? error.message : 'Workflow request failed.', correlationId, errorCode);
  } finally { observe?.({ correlationId, elapsedActionMs: performance.now() - started, errorCode }); }
}

export function requireWorkflowReceipt(value: unknown, county: string, taxYear: number, recordId: string): WorkflowReceipt {
  const r = value as WorkflowReceipt | null;
  const object = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
  const text = (v: unknown) => typeof v === 'string' && v.length > 0;
  if (!r || r.schemaVersion !== '1.0' || r.receiptId !== recordId || r.countyId !== county || r.taxYear !== taxYear
    || !text(r.correlationId) || !text(r.actorId) || !text(r.requestId)
    || !['assessment_draft.create', 'export_equalization_package', 'export_audit_bundle'].includes(r.operation)
    || !(r.reasonCode === null || text(r.reasonCode)) || !object(r.inputs) || r.outputs?.recordId !== recordId
    || !Array.isArray(r.outputs.artifacts) || r.outputs.artifactCount !== r.outputs.artifacts.length
    || !Number.isFinite(Date.parse(r.recordedAt)) || !Number.isFinite(Date.parse(r.timing?.startedAt))
    || !Number.isFinite(r.timing?.elapsedMs) || r.timing.elapsedMs < 0 || r.timing.measurement !== 'api-start-to-precommit-receipt'
    || !text(r.system?.assemblyVersion) || !text(r.system.informationalVersion) || !text(r.system.moduleVersionId) || !text(r.system.environment)
    || r.executionEvidence?.source !== 'application-db' || !text(r.executionEvidence.auditLogId)
    || r.executionEvidence.payloadRef !== `${base}/receipts/${encodeURIComponent(recordId)}?county=${encodeURIComponent(county)}`
    || r.traceReference?.correlationId !== r.correlationId || r.traceReference.provider !== 'pilot' || r.traceReference.availability !== 'not_verified'
    || r.traceReference.payloadRef !== `/api/pilot/trace/${encodeURIComponent(r.correlationId)}`) {
    throw new WorkflowRequestError('The persisted receipt does not match the selected record or complete receipt contract.');
  }
  return r;
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
  appealPacketContent: (token: string, county: string, taxYear: number, appealId: string, parcelId: string, observe?: WorkflowObserver) => {
    const query = new URLSearchParams({ county, taxYear: String(taxYear), parcelId });
    return request<ArrayBuffer>(`/appeals/${encodeURIComponent(appealId)}/packet?${query}`, token, {}, true, observe);
  },
  context: (token: string, county: string, taxYear?: number, parcelId?: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ county });
    if (taxYear !== undefined) query.set('taxYear', String(taxYear));
    if (parcelId) query.set('parcelId', parcelId);
    return request<WorkflowContext>(`/context${query.size ? `?${query}` : ''}`, token, { signal });
  },
  saveDraft: (token: string, county: string, studyId: string, requestId: string, observe?: WorkflowObserver) => request<WorkflowDraft>('/drafts', token, { method: 'POST', body: JSON.stringify({ county, studyId, requestId }) }, false, observe),
  draft: (token: string, county: string, id: string) => request<WorkflowDraft>(`/drafts/${encodeURIComponent(id)}?county=${encodeURIComponent(county)}`, token),
  export: (token: string, county: string, id: string, observe?: WorkflowObserver) => request<WorkflowExport>(`/exports/${encodeURIComponent(id)}?county=${encodeURIComponent(county)}`, token, {}, false, observe),
  // Build local URLs from the persisted ID; never forward a bearer token to a returned remote URL.
  content: (token: string, county: string, id: string, observe?: WorkflowObserver) => request<ArrayBuffer>(`/exports/${encodeURIComponent(id)}/content?county=${encodeURIComponent(county)}`, token, {}, true, observe),
  receipt: (token: string, county: string, taxYear: number, receipt: WorkflowReceipt, observe?: WorkflowObserver) => {
    requireWorkflowReceipt(receipt, county, taxYear, receipt.receiptId);
    // Only the exact same-origin, county-scoped receipt URL above is authorized.
    return request<WorkflowReceiptEvidence>(receipt.executionEvidence.payloadRef.slice(base.length), token, {}, false, observe);
  },
};
