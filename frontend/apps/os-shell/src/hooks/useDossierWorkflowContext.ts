import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthContextOptional } from '../auth/useAuthContext';
import { getToken } from '../auth/authStorage';
import { invokeTool, type PilotInvokeRequest } from '../api/pilotApi';
import { dossierWorkflowService, workflowMetrics, WorkflowRequestError, type WorkflowContext, type WorkflowHttpEvidence, type WorkflowMetrics, type WorkflowObserver } from '../services/dossierWorkflowService';

type Selection = { year?: number; studyId?: string; draftId?: string };
function readSelection(key: string): Selection {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const stored = value as Selection;
    return { year: Number.isInteger(stored.year) ? stored.year : undefined,
      studyId: typeof stored.studyId === 'string' ? stored.studyId : undefined,
      draftId: typeof stored.draftId === 'string' ? stored.draftId : undefined };
  } catch { return {}; }
}

/** Monotonic generation prevents a late A response becoming current after A -> B -> A. */
export function useWorkflowGeneration(identity: string) {
  const generation = useRef({ identity, value: 0 });
  if (generation.current.identity !== identity) generation.current = { identity, value: generation.current.value + 1 };
  useEffect(() => () => { generation.current.value += 1; }, []);
  return generation;
}

export function useDossierWorkflowContext(parcelId?: string) {
  const auth = useAuthContextOptional();
  const token = auth?.token ?? '';
  const countyId = auth?.countyId ?? '';
  const userId = auth?.userId ?? '';
  const authenticated = !!(auth?.isAuthenticated && token && countyId && userId);
  const identity = JSON.stringify([token, countyId, userId, auth?.isAuthenticated, auth?.roles ?? [], parcelId]);
  const storageKey = `tf.dossier.workflow:${countyId}:${userId}:${parcelId ?? ''}`;
  const restored = useMemo(() => readSelection(storageKey), [storageKey, identity]);
  const [selection, setSelection] = useState<{ identity: string; value: Selection }>({ identity, value: restored });
  const selected = selection.identity === identity ? selection.value : restored;
  const queryIdentity = JSON.stringify([identity, selected.year]);
  const queryGeneration = useWorkflowGeneration(queryIdentity);
  const [loaded, setLoaded] = useState<{ identity: string; query: string; data?: WorkflowContext; error?: string; loading: boolean }>({ identity, query: queryIdentity, loading: authenticated });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const ticket = ++queryGeneration.current.value;
    if (!authenticated) return () => controller.abort();
    setLoaded(previous => ({ identity, query: queryIdentity, data: previous.identity === identity ? previous.data : undefined, loading: true }));
    dossierWorkflowService.context(token, countyId, selected.year, parcelId, controller.signal).then(data => {
      if (ticket !== queryGeneration.current.value || getToken() !== token) return;
      if (data.countyId !== countyId || !Array.isArray(data.taxYears) || !Array.isArray(data.studies) || !Array.isArray(data.drafts) || !Array.isArray(data.exports)) throw new Error('Workflow context does not match the authenticated county.');
      setLoaded({ identity, query: queryIdentity, data, loading: false });
    }).catch(error => {
      if (ticket !== queryGeneration.current.value || controller.signal.aborted) return;
      setLoaded({ identity, query: queryIdentity, loading: false, error: error instanceof Error ? error.message : 'Workflow context unavailable.' });
    });
    return () => { controller.abort(); queryGeneration.current.value += 1; };
  }, [queryIdentity, refresh]);

  const data = loaded.identity === identity ? loaded.data : undefined;
  const years = (data?.taxYears ?? []).filter(year => Number.isInteger(year) && year > 0);
  const taxYear = years.includes(selected.year!) ? selected.year : years[0];
  const studies = (data?.studies ?? []).filter(study => study.taxYear === taxYear);
  const studyId = studies.some(study => study.studyId === selected.studyId) ? selected.studyId : studies[0]?.studyId;
  const drafts = (data?.drafts ?? []).filter(draft => draft.countyId === countyId && draft.taxYear === taxYear && draft.studyId === studyId);
  const draft = drafts.find(draft => draft.draftId === selected.draftId) ?? drafts[0];
  const generation = useWorkflowGeneration(JSON.stringify([identity, taxYear, studyId, draft?.draftId, draft?.revision, selected.year]));
  const epoch = generation.current.value;
  const [saveState, setSaveState] = useState<{ epoch: number; loading: boolean; error?: string; evidence?: WorkflowActionState }>({ epoch, loading: false });
  const saveRequest = useRef<{ epoch: number; id: string; busy: boolean }>();
  const select = (value: Selection) => {
    generation.current.value += 1;
    setSelection({ identity, value });
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* selection still works without storage */ }
  };
  const loading = authenticated && (loaded.identity !== identity || loaded.query !== queryIdentity || loaded.loading);
  const ready = authenticated && !loading && !!data && taxYear !== undefined;

  const saveDraft = async () => {
    if (!ready || !studyId) return;
    const ticket = generation.current.value;
    if (saveRequest.current?.epoch === ticket && saveRequest.current.busy) return;
    saveRequest.current = { epoch: ticket, id: saveRequest.current?.epoch === ticket ? saveRequest.current.id : crypto.randomUUID(), busy: true };
    setSaveState({ epoch: ticket, loading: true });
    const started = performance.now();
    let http: WorkflowHttpEvidence | undefined;
    try {
      const saved = await dossierWorkflowService.saveDraft(token, countyId, studyId, saveRequest.current.id, value => { http = value; });
      if (generation.current.value !== ticket || getToken() !== token) return;
      if (saved.countyId !== countyId || saved.taxYear !== taxYear || saved.studyId !== studyId || !saved.draftId || !saved.revision) throw new Error('Saved snapshot does not match the selected study.');
      setLoaded(previous => ({ ...previous, data: previous.data ? { ...previous.data, drafts: [...previous.data.drafts.filter(d => d.draftId !== saved.draftId), saved] } : undefined }));
      select({ year: taxYear, studyId, draftId: saved.draftId });
      // Adopt only this successful save's new selection; all older actions were invalidated by select.
      generation.current.identity = JSON.stringify([identity, taxYear, studyId, saved.draftId, saved.revision, taxYear]);
      setSaveState({ epoch: generation.current.value, loading: false, evidence: { status: 'success', operation: 'assessment_draft.create', correlationId: http?.correlationId, elapsedActionMs: performance.now() - started } });
    } catch (error) {
      if (generation.current.value === ticket && getToken() === token) setSaveState({ epoch: ticket, loading: false, error: error instanceof Error ? error.message : 'Snapshot save failed.',
        evidence: { status: 'error', operation: 'assessment_draft.create', correlationId: http?.correlationId, elapsedActionMs: performance.now() - started,
          error: { message: error instanceof Error ? error.message : 'Snapshot save failed.', code: http?.errorCode ?? 'RESPONSE_ERROR' } } });
    } finally {
      if (saveRequest.current?.epoch === ticket) saveRequest.current.busy = false;
    }
  };

  return { countyId, userId, token, identity, parcelId, authenticated, ready, loading,
    error: authenticated ? (loaded.identity === identity ? loaded.error : undefined) : 'Sign in with a county-scoped identity to use workflows.',
    years, taxYear, studies, studyId, drafts, draft, exports: (data?.exports ?? []).filter(item => item.countyId === countyId && item.taxYear === taxYear),
    generation, epoch, saveDraft, saving: saveState.epoch === epoch && saveState.loading, saveError: saveState.epoch === epoch ? saveState.error : undefined,
    saveEvidence: saveState.epoch === epoch ? saveState.evidence : undefined,
    selectYear: (year: number) => { if (years.includes(year)) select({ year }); },
    selectStudy: (id: string) => { if (studies.some(study => study.studyId === id)) select({ year: taxYear, studyId: id }); },
    selectDraft: (id: string) => { if (drafts.some(draft => draft.draftId === id)) select({ year: taxYear, studyId, draftId: id }); },
    reload: () => setRefresh(value => value + 1),
  };
}
export type DossierWorkflowContext = ReturnType<typeof useDossierWorkflowContext>;

export type WorkflowActionState = { status: 'idle' | 'loading' | 'success' | 'error'; operation?: string; correlationId?: string; elapsedActionMs?: number; metrics?: WorkflowMetrics; error?: { message: string; code: string } };
type ActionState<T> = WorkflowActionState & { result?: T };
export function useWorkflowAction<T>(context: DossierWorkflowContext, extraIdentity = '') {
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch, extraIdentity]));
  const epoch = generation.current.value;
  const [stored, setStored] = useState<{ epoch: number; value: ActionState<T> }>({ epoch, value: { status: 'idle' } });
  const [confirmation, setConfirmation] = useState<{ epoch: number; checked: boolean }>({ epoch, checked: false });
  const attempt = useRef<{ epoch: number; id: string; busy: boolean }>();
  const confirmed = confirmation.epoch === epoch && confirmation.checked;
  const state: ActionState<T> = stored.epoch === epoch ? stored.value : { status: 'idle' };
  const run = async (request: PilotInvokeRequest, validate?: (value: unknown) => T) => {
    const isExport = request.toolId === 'export_equalization_package' || request.toolId === 'export_audit_bundle';
    if (!context.ready || (isExport && !confirmed) || getToken() !== context.token) return;
    const ticket = generation.current.value;
    const contextTicket = context.generation.current.value;
    if (attempt.current?.epoch === ticket && attempt.current.busy) return;
    attempt.current = { epoch: ticket, id: attempt.current?.epoch === ticket ? attempt.current.id : crypto.randomUUID(), busy: true };
    const current = () => generation.current.value === ticket && context.generation.current.value === contextTicket && getToken() === context.token;
    const started = performance.now();
    setStored({ epoch: ticket, value: { status: 'loading', operation: request.toolId } });
    let correlationId: string | undefined;
    let metrics: WorkflowMetrics | undefined;
    let errorCode = 'NETWORK_ERROR';
    try {
      const response = await invokeTool({ ...request, params: { ...request.params, ...(isExport ? { requestId: attempt.current.id } : {}) },
        ...(isExport ? { confirmation: { confirmed: true, reasonCode: 'annual_certification' } } : {}) });
      if (!current()) return;
      correlationId = typeof response.correlationId === 'string' && response.correlationId ? response.correlationId : undefined;
      metrics = workflowMetrics((response as { metrics?: unknown }).metrics, request.toolId, correlationId, response.success, response.error?.code);
      errorCode = response.error?.code ?? 'RESPONSE_ERROR';
      if (!response.success || !response.result) throw new WorkflowRequestError(response.error?.message ?? 'Workflow failed.', correlationId, errorCode);
      const output: unknown = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
      const result = validate ? validate(output) : output as T;
      setStored({ epoch: ticket, value: { status: 'success', result, correlationId, operation: request.toolId, metrics, elapsedActionMs: performance.now() - started } });
      return { result, correlationId };
    } catch (error) {
      if (current()) setStored({ epoch: ticket, value: { status: 'error', correlationId: error instanceof WorkflowRequestError ? error.correlationId ?? correlationId : correlationId,
        operation: request.toolId, metrics, elapsedActionMs: performance.now() - started,
        error: { code: error instanceof WorkflowRequestError ? error.errorCode : errorCode, message: error instanceof Error ? error.message : 'Workflow failed.' } } });
    } finally {
      if (attempt.current?.epoch === ticket) attempt.current.busy = false;
    }
  };
  return { state, confirmed, setConfirmed: (checked: boolean) => setConfirmation({ epoch, checked }), run };
}

/** Scoped read/verification action; only returns a result while the initiating context is current. */
export function useWorkflowTask(context: DossierWorkflowContext, operation: string, extraIdentity = '') {
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch, operation, extraIdentity]));
  const epoch = generation.current.value;
  const [stored, setStored] = useState<{ epoch: number; state: WorkflowActionState }>({ epoch, state: { status: 'idle' } });
  const state = stored.epoch === epoch ? stored.state : { status: 'idle' as const };
  const run = async <T,>(task: (observe: WorkflowObserver, current: () => boolean) => Promise<T>) => {
    if (!context.ready || getToken() !== context.token) return;
    const ticket = ++generation.current.value;
    const contextTicket = context.generation.current.value;
    const current = () => generation.current.value === ticket && context.generation.current.value === contextTicket && getToken() === context.token;
    const started = performance.now();
    let http: WorkflowHttpEvidence | undefined;
    setStored({ epoch: ticket, state: { status: 'loading', operation } });
    try {
      const result = await task(value => { http = value; }, current);
      if (!current()) return;
      setStored({ epoch: ticket, state: { status: 'success', operation, correlationId: http?.correlationId, elapsedActionMs: performance.now() - started } });
      return { result };
    } catch (error) {
      if (current()) setStored({ epoch: ticket, state: { status: 'error', operation, correlationId: http?.correlationId, elapsedActionMs: performance.now() - started,
        error: { code: http?.errorCode ?? 'RESPONSE_ERROR', message: error instanceof Error ? error.message : 'Workflow read failed.' } } });
    }
  };
  return { state, run };
}
