import { useState } from 'react';
import { dossierWorkflowService, requireWorkflowExport, type WorkflowExport } from '../../services/dossierWorkflowService';
import { useWorkflowGeneration, type DossierWorkflowContext } from '../../hooks/useDossierWorkflowContext';
import { getToken } from '../../auth/authStorage';

export function WorkflowExportResult({ result, context }: { result: WorkflowExport; context: DossierWorkflowContext }) {
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch, result.packageRef]));
  const epoch = generation.current.value;
  const [output, setOutput] = useState<{ epoch: number; loading?: boolean; content?: string; error?: string }>({ epoch });
  const current = output.epoch === epoch ? output : { epoch };
  const retrieve = async (download: boolean) => {
    if (!context.ready || getToken() !== context.token) return;
    const ticket = generation.current.value;
    setOutput({ epoch: ticket, loading: true });
    try {
      const metadata = await dossierWorkflowService.export(context.token, context.countyId, result.packageRef);
      if (generation.current.value !== ticket || getToken() !== context.token) return;
      requireWorkflowExport(metadata, context.countyId, context.taxYear!);
      if (metadata.packageRef !== result.packageRef || metadata.contentHash !== result.contentHash) throw new Error('The persisted export identity changed.');
      const content = await dossierWorkflowService.content(context.token, context.countyId, result.packageRef);
      if (generation.current.value !== ticket || getToken() !== context.token) return;
      if (!crypto.subtle) throw new Error('Content integrity verification is unavailable in this browser context.');
      const digest = await crypto.subtle.digest('SHA-256', content);
      if (generation.current.value !== ticket || getToken() !== context.token) return;
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (hash !== metadata.contentHash.toLowerCase()) throw new Error('Content integrity check failed. The retrieved bytes do not match the saved export.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(content);
      JSON.parse(text); // Refuse a non-JSON payload even if its bytes match the saved hash.
      setOutput({ epoch: ticket, content: text });
      if (download) {
        const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `dossier-${result.packageRef}.json`; link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (generation.current.value === ticket) setOutput({ epoch: ticket, error: error instanceof Error ? error.message : 'Output unavailable.' });
    }
  };
  return <section aria-label="Completed export" className="my-3 space-y-2 rounded border p-3">
    <p className="font-semibold">{result.packageRef}</p>
    <p>{result.artifactCount} artifacts · {result.taxYear} · {result.countyId}</p>
    <p className="text-xs break-all">Source draft: {result.draftId ?? 'County records'} · Revision: {result.revision ?? 'Recorded export scope'}</p>
    <p className="text-xs break-all">Content hash: {result.contentHash}</p>
    <ul>{result.artifacts.map((artifact, index) => <li key={`${artifact.name}-${index}`} className="text-xs break-all">{artifact.name} · {artifact.mediaType} · {artifact.sourceId} · SHA-256 {artifact.sha256}</li>)}</ul>
    <p>This export bundles evidence and does not certify or approve the roll.</p>
    <button type="button" disabled={current.loading || !context.ready} onClick={() => void retrieve(false)}>Inspect output</button>{' '}
    <button type="button" disabled={current.loading || !context.ready} onClick={() => void retrieve(true)}>Download JSON</button>
    {current.loading && <p role="status">Retrieving saved output…</p>}
    {current.error && <p role="alert">{current.error}</p>}
    {current.content && <><p>Retrieved bytes verified against the saved SHA-256.</p><pre aria-label="Export JSON" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{current.content}</pre></>}
  </section>;
}
