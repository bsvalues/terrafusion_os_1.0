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

export const dossierWorkflowService = {
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
