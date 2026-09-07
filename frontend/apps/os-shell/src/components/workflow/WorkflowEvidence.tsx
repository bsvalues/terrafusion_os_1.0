import { useState } from 'react';
import { getPilotTrace, type PilotTraceEvent } from '../../api/pilotApi';
import { getToken } from '../../auth/authStorage';
import { useWorkflowGeneration, useWorkflowTask, type DossierWorkflowContext, type WorkflowActionState } from '../../hooks/useDossierWorkflowContext';
import { dossierWorkflowService, requireWorkflowReceipt, sameWorkflowValue, type WorkflowDraft, type WorkflowExport, type WorkflowReceipt, type WorkflowReceiptEvidence } from '../../services/dossierWorkflowService';
import { ErrorDisplay } from '../errors/ErrorDisplay';
import { EvidenceRail } from '../pilot/EvidenceRail';
import { ResultPanel } from '../workbench/ResultPanel';
import { TactileButton } from '../../ui/materials/TactileButton';

function CopyEvidence({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState('');
  return <><TactileButton size="sm" onClick={() => {
    navigator.clipboard?.writeText(value).then(() => setStatus('Copied.'), () => setStatus('Copy unavailable. Select the displayed text.'));
    if (!navigator.clipboard) setStatus('Copy unavailable. Select the displayed text.');
  }}>{label}</TactileButton>{status && <span role="status">{status}</span>}</>;
}

function WorkflowTrace({ context, correlationId, operation, actorId }: { context: DossierWorkflowContext; correlationId: string; operation: string; actorId: string }) {
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch, correlationId, operation, actorId]));
  const epoch = generation.current.value;
  const [stored, setStored] = useState<{ epoch: number; phase: 'idle' | 'loading' | 'ready' | 'error'; events?: PilotTraceEvent[]; error?: string }>({ epoch, phase: 'idle' });
  const state = stored.epoch === epoch ? stored : { epoch, phase: 'idle' as const };
  const load = async () => {
    if (!context.ready || getToken() !== context.token) return;
    const ticket = ++generation.current.value;
    const contextTicket = context.generation.current.value;
    const current = () => ticket === generation.current.value && contextTicket === context.generation.current.value && getToken() === context.token;
    setStored({ epoch: ticket, phase: 'loading' });
    try {
      const response = await getPilotTrace(correlationId);
      if (!current()) return;
      if (!Array.isArray(response.events) || response.events.some(event => !event || event.correlationId !== correlationId
        || event.context?.countyId !== context.countyId || event.context.userId !== actorId || event.toolId !== operation
        || typeof event.eventId !== 'string' || !event.eventId || typeof event.summary !== 'string' || !Number.isFinite(Date.parse(event.timestamp)))) {
        throw new Error('Trace evidence does not match this action, county, or actor.');
      }
      setStored({ epoch: ticket, phase: 'ready', events: response.events });
    } catch (error) {
      if (current()) setStored({ epoch: ticket, phase: 'error', error: error instanceof Error ? error.message : 'Trace unavailable.' });
    }
  };
  return <div className="space-y-2">
    <TactileButton size="sm" disabled={!context.ready || state.phase === 'loading'} onClick={() => void load()}>View action evidence</TactileButton>
    {state.phase === 'ready' && !state.events?.length ? <p>No trace events returned for this action. Trace availability is not verified.</p>
      : <EvidenceRail phase={state.phase} events={state.events ?? []} error={state.error ?? null} onRetry={() => void load()} />}
    {!!state.events?.length && <><CopyEvidence key={`${epoch}-chain`} value={JSON.stringify(state.events, null, 2)} label="Copy trace chain" />
      <details><summary>Trace metadata JSON</summary><pre aria-label="Trace metadata JSON" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(state.events, null, 2)}</pre></details></>}
  </div>;
}

export function WorkflowActionEvidence({ state, context }: { state?: WorkflowActionState; context: DossierWorkflowContext }) {
  if (!state || state.status === 'idle' || !state.operation) return null;
  return <section aria-label={`Action evidence: ${state.operation}`} className="my-3 space-y-2">
    {state.status === 'loading' ? <p role="status">{state.operation}: in progress</p>
      : state.status === 'error' ? <ErrorDisplay error={{ message: state.error?.message ?? 'Action failed.', errorCode: state.error?.code, correlationId: state.correlationId }} />
      : <ResultPanel status="success" correlationId={state.correlationId} successHeader={{ icon: '✓', title: `${state.operation}: succeeded` }}>
        <p className="break-all">Correlation ID: <code>{state.correlationId ?? 'Unavailable'}</code></p>
      </ResultPanel>}
    {!state.correlationId && state.status !== 'loading' && <p>Correlation ID unavailable. No trace is claimed.</p>}
    {state.error?.code && <p>Error code: {state.error.code}</p>}
    {Number.isFinite(state.elapsedActionMs) && <p>Client elapsed: {state.elapsedActionMs!.toFixed(2)} ms (request through response validation)</p>}
    {state.metrics ? <p>Server duration: {state.metrics.durationMs} ms · {state.metrics.measurement} · {state.metrics.environment} · {state.metrics.ok ? 'succeeded' : 'failed'}{state.metrics.errorCode ? ` · ${state.metrics.errorCode}` : ''}</p>
      : state.status !== 'loading' && <p>Server metrics unavailable for this action.</p>}
    {state.correlationId && ['generate_morning_brief', 'open_appeal_packet', 'export_equalization_package', 'export_audit_bundle'].includes(state.operation)
      && <WorkflowTrace context={context} correlationId={state.correlationId} operation={state.operation} actorId={context.userId} />}
  </section>;
}

export function WorkflowReceiptView({ record, context, label }: { record: WorkflowDraft | WorkflowExport; context: DossierWorkflowContext; label: string }) {
  const receipt = record.receipt;
  const recordId = 'packageRef' in record ? record.packageRef : record.draftId;
  const identity = JSON.stringify([recordId, receipt]);
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch, identity]));
  const epoch = generation.current.value;
  const [stored, setStored] = useState<{ epoch: number; evidence?: WorkflowReceiptEvidence }>({ epoch });
  const task = useWorkflowTask(context, 'workflow_receipt.retrieve', identity);
  let validated: WorkflowReceipt | undefined;
  let invalid: string | undefined;
  if (receipt != null) {
    try {
      validated = requireWorkflowReceipt(receipt, context.countyId, context.taxYear!, recordId);
      if (validated.outputs.artifactCount !== record.artifactCount || ('packageRef' in record
        ? validated.operation !== (record.draftId ? 'export_equalization_package' : 'export_audit_bundle')
          || validated.outputs.packageRef !== record.packageRef || validated.outputs.draftId !== record.draftId
          || validated.outputs.sourceRevision !== record.revision || !sameWorkflowValue(validated.outputs.artifacts, record.artifacts)
        : validated.operation !== 'assessment_draft.create' || validated.outputs.studyId !== record.studyId || validated.outputs.draftId !== record.draftId)) {
        throw new Error('The persisted receipt does not match the selected saved record outputs.');
      }
    }
    catch (error) { validated = undefined; invalid = error instanceof Error ? error.message : 'Receipt unavailable.'; }
  }
  const evidence = stored.epoch === epoch ? stored.evidence : undefined;
  const retrieve = async () => {
    if (!validated) return;
    const ticket = generation.current.value;
    setStored({ epoch: ticket });
    const response = await task.run(async observe => {
      const result = await dossierWorkflowService.receipt(context.token, context.countyId, context.taxYear!, validated!, observe);
      const actual = requireWorkflowReceipt(result.receipt, context.countyId, context.taxYear!, recordId);
      const audit = result.executionEvidence;
      if (result.countyId !== context.countyId || result.taxYear !== context.taxYear || !sameWorkflowValue(actual, validated)
        || audit?.auditLogId !== actual.executionEvidence.auditLogId || audit.actorId !== actual.actorId
        || audit.source !== 'DossierWorkflowService' || audit.type !== `DOSSIER_WORKFLOW:${actual.operation}`
        || !Number.isFinite(Date.parse(audit.recordedAt)) || !audit.data || audit.data.recordId !== recordId
        || !sameWorkflowValue(audit.data.receipt, actual)) throw new Error('The persisted receipt evidence does not match its saved audit linkage.');
      return result;
    });
    if (response && generation.current.value === ticket && getToken() === context.token) setStored({ epoch: ticket, evidence: response.result });
  };
  return <section aria-label={label} className="my-3 space-y-2 rounded border p-3">
    <h4>{label}</h4>
    {!validated ? <p>{invalid ?? 'Receipt unavailable for this saved record. No receipt has been reconstructed.'}</p> : <>
      <dl className="space-y-1 text-sm break-all">
        <dt>Receipt / record</dt><dd>{validated.receiptId}</dd>
        <dt>Actor</dt><dd>{validated.actorId}</dd>
        <dt>Operation / intent</dt><dd>{validated.operation} · {validated.reasonCode ?? 'No reason code recorded'}</dd>
        <dt>Recorded at (precommit receipt boundary)</dt><dd>{validated.recordedAt}</dd>
        <dt>API time to receipt (not commit completion)</dt><dd>{validated.timing.elapsedMs} ms · {validated.timing.measurement}</dd>
        <dt>System</dt><dd>{validated.system.environment} · {validated.system.informationalVersion} · {validated.system.assemblyVersion} · {validated.system.moduleVersionId}</dd>
        <dt>Commit correlation ID</dt><dd>{validated.correlationId}</dd>
        <dt>Audit record</dt><dd>{validated.executionEvidence.auditLogId}</dd>
      </dl>
      <CopyEvidence key={`${epoch}-cid`} label="Copy receipt correlation ID" value={validated.correlationId} />
      <p>Trace availability not verified. A saved receipt does not prove Pilot trace availability or completion.</p>
      <details><summary>Receipt inputs and outputs</summary><pre aria-label="Saved receipt JSON" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(validated, null, 2)}</pre></details>
      <CopyEvidence key={`${epoch}-receipt`} label="Copy saved receipt JSON" value={JSON.stringify(validated, null, 2)} />
      <TactileButton size="sm" disabled={!context.ready || task.state.status === 'loading'} onClick={() => void retrieve()}>Inspect persisted receipt</TactileButton>
      <WorkflowTrace context={context} correlationId={validated.correlationId} operation={validated.operation} actorId={validated.actorId} />
    </>}
    <WorkflowActionEvidence state={task.state} context={context} />
    {evidence && <><pre aria-label="Persisted receipt JSON" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(evidence, null, 2)}</pre>
      <CopyEvidence key={`${epoch}-audit`} label="Copy persisted receipt evidence" value={JSON.stringify(evidence, null, 2)} /></>}
  </section>;
}
