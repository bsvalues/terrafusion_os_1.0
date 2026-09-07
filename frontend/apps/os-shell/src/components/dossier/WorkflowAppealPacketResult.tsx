import { useState } from 'react';
import { getToken } from '../../auth/authStorage';
import { useWorkflowGeneration, useWorkflowTask, type DossierWorkflowContext } from '../../hooks/useDossierWorkflowContext';
import { WorkflowActionEvidence } from '../workflow/WorkflowEvidence';
import { dossierWorkflowService, requireWorkflowAppealPacket, type WorkflowAppealPacket } from '../../services/dossierWorkflowService';

export function WorkflowAppealPacketResult({ result, context }: { result: WorkflowAppealPacket; context: DossierWorkflowContext }) {
  const generation = useWorkflowGeneration(JSON.stringify([context.identity, context.epoch, result.packetRef, result.appealId, result.parcelId]));
  const epoch = generation.current.value;
  const [output, setOutput] = useState<{ epoch: number; loading?: boolean; content?: string; error?: string }>({ epoch });
  const current = output.epoch === epoch ? output : { epoch };
  const task = useWorkflowTask(context, 'appeal_packet.retrieve', JSON.stringify([result.packetRef, result.appealId, result.parcelId]));
  const retrieve = async (download: boolean) => {
    if (!context.ready || getToken() !== context.token) return;
    const ticket = generation.current.value;
    setOutput({ epoch: ticket, loading: true });
    const response = await task.run(async (observe, active) => {
      const bytes = await dossierWorkflowService.appealPacketContent(context.token, context.countyId, context.taxYear!, result.appealId, result.parcelId, observe);
      if (!active()) return;
      const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      requireWorkflowAppealPacket(JSON.parse(content), context.countyId, context.taxYear!, result.appealId, result.parcelId, result.packetRef);
      return { bytes, content };
    });
    if (generation.current.value !== ticket || getToken() !== context.token) return;
    setOutput({ epoch: ticket, content: response?.result?.content });
    if (response?.result) {
      if (download) {
        const url = URL.createObjectURL(new Blob([response.result.bytes], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `appeal-packet-${result.packetRef}.json`; link.click();
        URL.revokeObjectURL(url);
      }
    }
  };
  return <section aria-label="Appeal packet records" className="my-3 space-y-2 rounded border p-3">
    <p className="font-semibold">Packet Ref: {result.packetRef}</p>
    <p>{result.countyId} · {result.taxYear} · Appeal {result.appealId} · Parcel {result.parcelId}</p>
    <p>{result.documents.length} document records · {result.evidence.length} evidence records · {result.custody.length} custody events</p>
    <p>Persisted record metadata, not source document binaries. Packet identity and record links are checked; this endpoint supplies no content hash.</p>
    <button type="button" disabled={current.loading || !context.ready} onClick={() => void retrieve(false)}>Inspect packet content</button>{' '}
    <button type="button" disabled={current.loading || !context.ready} onClick={() => void retrieve(true)}>Download packet JSON</button>
    {current.loading && <p role="status">Retrieving authorized packet records…</p>}
    <WorkflowActionEvidence state={task.state} context={context} />
    {current.content && <pre aria-label="Appeal packet JSON" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{current.content}</pre>}
  </section>;
}
