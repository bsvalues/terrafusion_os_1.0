import { useId, useState } from 'react';
import { useWorkflowGeneration, useWorkflowTask, type DossierWorkflowContext } from '../../hooks/useDossierWorkflowContext';
import { dossierWorkflowService, requireWorkflowExport, type WorkflowExport } from '../../services/dossierWorkflowService';
import { WorkflowExportResult } from '../dossier/WorkflowExportResult';
import { getToken } from '../../auth/authStorage';
import { WorkflowActionEvidence, WorkflowReceiptView } from './WorkflowEvidence';

export function WorkflowContextPicker({ context, drafts = true }: { context: DossierWorkflowContext; drafts?: boolean }) {
  const id = useId();
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch]));
  const epoch = generation.current.value;
  const [selectedExport, setSelectedExport] = useState({ epoch, id: '' });
  const exportId = (selectedExport.epoch === epoch && context.exports.some(item => item.packageRef === selectedExport.id) ? selectedExport.id : context.exports[0]?.packageRef) ?? '';
  const [opened, setOpened] = useState<{ epoch: number; result?: WorkflowExport; error?: string; loading?: boolean }>({ epoch });
  const current = opened.epoch === epoch ? opened : { epoch };
  const task = useWorkflowTask(context, 'workflow_export.reopen', JSON.stringify([epoch, exportId]));
  const reopen = async () => {
    if (!context.ready || !exportId || current.loading) return;
    const ticket = generation.current.value;
    setOpened({ epoch: ticket, loading: true });
    const response = await task.run(async observe => {
      const result = requireWorkflowExport(await dossierWorkflowService.export(context.token, context.countyId, exportId, observe), context.countyId, context.taxYear!);
      if (result.packageRef !== exportId) throw new Error('The saved export identity changed.');
      return result;
    });
    if (ticket === generation.current.value && getToken() === context.token) setOpened({ epoch: ticket, result: response?.result });
  };
  return <section aria-label="Persisted workflow context" className="my-4 space-y-3 rounded-lg border p-4">
    <p className="text-sm">County: {context.countyId || 'Unavailable'}</p>
    {context.loading && <p role="status">Loading saved workflow context…</p>}
    {context.error && <p role="alert">{context.error} <button type="button" onClick={context.reload}>Retry context</button></p>}
    {!!context.years.length && <label htmlFor={`${id}-year`}>Assessment year
      <select id={`${id}-year`} value={context.taxYear ?? ''} onChange={event => context.selectYear(Number(event.target.value))} className="tf-input ml-2">
        {context.years.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
    </label>}
    {drafts && context.taxYear !== undefined && <>
      <label htmlFor={`${id}-study`} className="block">Source study
        <select id={`${id}-study`} value={context.studyId ?? ''} onChange={event => context.selectStudy(event.target.value)} className="tf-input ml-2">
          {!context.studies.length && <option value="">No persisted study</option>}
          {context.studies.map(study => <option key={study.studyId} value={study.studyId}>{study.studyId} · {study.status}</option>)}
        </select>
      </label>
      <button type="button" onClick={() => void context.saveDraft()} disabled={!context.ready || !context.studyId || context.saving}>{context.saving ? 'Saving snapshot…' : 'Save study snapshot'}</button>
      <WorkflowActionEvidence state={context.saveEvidence} context={context} />
      <label htmlFor={`${id}-draft`} className="block">Saved draft
        <select id={`${id}-draft`} value={context.draft?.draftId ?? ''} onChange={event => context.selectDraft(event.target.value)} className="tf-input ml-2">
          {!context.drafts.length && <option value="">No saved draft</option>}
          {context.drafts.map(draft => <option key={draft.draftId} value={draft.draftId}>{draft.draftId} · {draft.revision}</option>)}
        </select>
      </label>
      {context.draft && <p className="text-xs">Immutable revision: {context.draft.revision} · {context.draft.artifactCount} source artifacts</p>}
      {context.draft && <WorkflowReceiptView record={context.draft} context={context} label="Saved draft receipt" />}
    </>}
    {drafts && context.exports.length > 0 && <div className="space-y-2">
      <label htmlFor={`${id}-export`}>Saved export
        <select id={`${id}-export`} value={exportId} onChange={event => { generation.current.value += 1; setSelectedExport({ epoch: generation.current.value, id: event.target.value }); }} className="tf-input ml-2">
          {context.exports.map(item => <option key={item.packageRef} value={item.packageRef}>{item.packageRef} · {item.createdAt}</option>)}
        </select>
      </label>{' '}
      <button type="button" disabled={!context.ready || current.loading} onClick={() => void reopen()}>Reopen saved export</button>
      {current.loading && <p role="status">Opening saved export…</p>}
      <WorkflowActionEvidence state={task.state} context={context} />
      {current.result && <WorkflowExportResult result={current.result} context={context} />}
    </div>}
    {!context.loading && (!context.years.length || (drafts && !context.studies.length)) && context.authenticated &&
      <p>No persisted study for this scope. <a href="/forge/county-studio">Open County Studio</a> to create or prepare a study.</p>}
  </section>;
}
