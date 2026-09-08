import { useEffect, useRef, useState } from 'react';
import PacketNarrativeEditor from './PacketNarrativeEditor';
import PacketAppealHandoffPanel from './PacketAppealHandoffPanel';
import { finalizeWorkflowPacket, getWorkflowPacket, listWorkflowPackets, prepareWorkflowHandoff, saveWorkflowNarrative, reviseWorkflowPacket, PacketWorkflowHttpError,
  type PacketSummary, type PacketWorkflowContext, type PacketWorkflowView, type PreparedPacketHandoff, type PacketFinalizationReceipt,
} from '../../services/dossierPacketWorkflowService';

interface Props { parcelId: string; countyId?: string | null; taxYear?: number | null; token?: string | null }
const button = 'rounded-md border border-border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';

function PersistedReceipt({ title, receipt }: { title: string; receipt: PacketFinalizationReceipt | PreparedPacketHandoff }) {
  const provenance = receipt.provenance;
  if (!provenance?.traceId || !provenance.suiteCommit || !provenance.artifactSha256 || !provenance.contractVersion)
    return <p className='text-muted-foreground'>Persisted receipt provenance is unavailable. Reload before relying on this receipt.</p>;
  const handoff = 'handoffId' in receipt;
  return <section aria-label={title} className='space-y-2 rounded-md border border-border p-3'>
    <h4 className='font-semibold'>{title}</h4>
    <dl className='space-y-1 break-words'>
      <dt>Action CID</dt><dd>{provenance.traceId}</dd>
      <dt>Receipt ID</dt><dd>{handoff ? receipt.handoffId : receipt.finalizationId}</dd>
      <dt>Recorded by</dt><dd>{handoff ? receipt.preparedBy : receipt.finalizedBy}</dd>
      <dt>Recorded at</dt><dd>{handoff ? receipt.preparedAt : receipt.finalizedAt}</dd>
      <dt>Protected suite commit</dt><dd>{provenance.suiteCommit}</dd>
    </dl>
    <label className='block'>{title} payload
      <textarea aria-label={title + ' payload'} readOnly value={JSON.stringify(receipt, null, 2)} rows={5}
        className='mt-1 w-full rounded-md border border-border bg-background p-2 font-mono text-xs' />
    </label>
  </section>;
}

export default function PacketFinalizationPanel({ parcelId, countyId, taxYear, token }: Props) {
  if (!countyId || !taxYear || !token) return <p className='text-sm text-muted-foreground'>Select an authenticated county and assessment year to work with a packet.</p>;
  return <ScopedPacketWorkflow key={JSON.stringify([parcelId, countyId, taxYear, token])}
    context={{ parcelId, countyId, taxYear, token }} />;
}

function ScopedPacketWorkflow({ context }: { context: PacketWorkflowContext }) {
  const [packets, setPackets] = useState<PacketSummary[]>([]);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<PacketWorkflowView | null>(null);
  const [handoff, setHandoff] = useState<PreparedPacketHandoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorRequestId, setErrorRequestId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [reason, setReason] = useState('');
  const [requiresRefresh, setRequiresRefresh] = useState(false);
  const [history, setHistory] = useState<{
    finalization: PacketFinalizationReceipt | null; handoff: PreparedPacketHandoff | null; failedRequestId: string;
  } | null>(null);
  const controller = useRef(new AbortController());
  const requests = useRef(new Map<string, string>());

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    listWorkflowPackets(context, abort.signal).then(result => {
      if (abort.signal.aborted) return;
      setPackets(result); if (result.length === 1) setSelected(result[0].packetId);
    }).catch(e => { if (!abort.signal.aborted) setError(e.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    let current = true;
    setView(null); setHandoff(null); setError(''); setErrorRequestId(''); setDirty(false); setReason('');
    if (!selected) return;
    setLoading(true);
    getWorkflowPacket(context, selected, controller.current.signal).then(result => {
      if (!current || controller.current.signal.aborted) return;
      setView(result); setHandoff(result.handoff ?? null); setRequiresRefresh(false);
    }).catch(e => { if (current && !controller.current.signal.aborted) setError(e.message); })
      .finally(() => { if (current && !controller.current.signal.aborted) setLoading(false); });
    return () => { current = false; };
  }, [selected, refresh]);

  async function act(operation: 'finalize' | 'prepare' | 'narrative' | 'revise', content = '') {
    if (!view || busy || requiresRefresh) return;
    const signal = controller.current.signal;
    const key = view.packetId + ':' + view.revision + ':' + operation + ':' + content;
    const requestId = requests.current.get(key) ?? crypto.randomUUID();
    requests.current.set(key, requestId);
    setBusy(true); setError(''); setErrorRequestId('');
    try {
      if (operation === 'prepare') {
        const result = await prepareWorkflowHandoff(context, view.packetId, view.revision, requestId, signal);
        requests.current.delete(key);
        if (!signal.aborted) setHandoff(result);
      } else {
        if (operation === 'narrative') await saveWorkflowNarrative(context, view.packetId, view.revision, requestId, content, signal);
        else if (operation === 'revise') await reviseWorkflowPacket(context, view.packetId, view.revision, requestId, content, signal);
        else await finalizeWorkflowPacket(context, view.packetId, view.revision, requestId, signal);
        // A confirmed write completes this intent even if its subsequent readback fails.
        // Only an uncertain mutation response keeps its original key for retry.
        requests.current.delete(key);
        const refreshed = await getWorkflowPacket(context, view.packetId, signal);
        if (!signal.aborted) { setView(refreshed); setHandoff(refreshed.handoff ?? null); setDirty(false); }
      }
    } catch (e) { if (!signal.aborted) {
      if (e instanceof PacketWorkflowHttpError && e.status === 409) {
        // A conflict invalidates this read's eligibility, not its durable history.
        // Only a validated current read may enable another mutation or handoff.
        setRequiresRefresh(true);
        setHistory({ finalization: view.finalization, handoff, failedRequestId: requestId });
        setHandoff(null);
      }
      setError(e instanceof Error ? e.message : 'Packet action failed. Reload before retrying.');
      setErrorRequestId(requestId);
    } }
    finally { if (!signal.aborted) setBusy(false); }
  }
  const sealed = !requiresRefresh && view?.decision.decision === 'accepted' && view.status === 'sealed';
  const complete = !requiresRefresh && view?.decision.decision === 'accepted' && view.status === 'complete';
  return <section data-testid='finalization-panel' aria-label='Durable packet workflow' className='space-y-4 text-sm'>
    <h3 className='text-base font-semibold'>Finalize a packet</h3>
    <p className='text-muted-foreground'>Assessment year {context.taxYear}. Select the packet whose narrative and evidence you want to seal.</p>
    <label className='block'>Packet
      <select aria-label='Packet' className='ml-2 max-w-full rounded-md border border-border bg-background p-2' value={selected} disabled={busy}
        onChange={e => { setView(null); setHandoff(null); setHistory(null); setRequiresRefresh(false); setSelected(e.target.value); }}>
        <option value=''>Select a packet</option>
        {packets.map(packet => <option key={packet.packetId} value={packet.packetId}>{packet.name}</option>)}
      </select>
    </label>
    <button className={button} disabled={busy || !selected} onClick={() => { setView(null); setHandoff(null); setRefresh(x => x + 1); }}>Reload packet</button>
    {loading && <p role='status'>Loading persisted packet…</p>}
    {error && <p role='alert' className='break-words text-destructive'>{error}
      {errorRequestId && <span className='block'>Action CID: {errorRequestId}. This identifies the attempt, not a successful receipt.</span>}
    </p>}
    {!loading && packets.length === 0 && !error && <p>No packets in this county, year and parcel. Assemble a scoped packet first.</p>}
    {view && <>
      <dl className='space-y-1 break-words'><dt>Revision</dt><dd>{view.revision}</dd><dt>Status</dt><dd data-testid='finalization-status'>{requiresRefresh ? 'stale — reload required' : view.status}</dd></dl>
      <div data-testid='narrative-section'><PacketNarrativeEditor key={view.packetId + view.revision} content={view.narrative.content}
        disabled={busy || requiresRefresh || view.packetStatus === 'sealed'} onDirty={setDirty} onSave={content => void act('narrative', content)} /></div>
      <p>{view.evidence.length} evidence references in this saved revision.</p>
      {view.decision.violations.length > 0 && <ul className='list-disc pl-5'>{view.decision.violations.map((violation, i) => <li key={violation.code + i}>{violation.message}</li>)}</ul>}
      {complete && <button className={button} disabled={busy || dirty} onClick={() => void act('finalize')}>Finalize this revision</button>}
      {view.packetStatus === 'sealed' && <div className='space-y-2'>
        <label className='block'>Revision reason
          <input aria-label='Revision reason' className='ml-2 max-w-full rounded-md border border-border bg-background p-2'
            value={reason} maxLength={2000} disabled={busy || requiresRefresh} onChange={e => setReason(e.target.value)} />
        </label>
        <p className='text-muted-foreground'>Reopening keeps the old seal for history and removes current handoff eligibility.</p>
        <button className={button} disabled={busy || requiresRefresh || !reason.trim()} onClick={() => void act('revise', reason)}>Reopen for revision</button>
      </div>}
      <div data-testid='appeal-handoff-section'><PacketAppealHandoffPanel context={context} sealed={sealed} handoff={handoff}
        busy={busy} onPrepare={() => void act('prepare')} /></div>
      {!requiresRefresh && view.finalization && <PersistedReceipt title='Finalization receipt' receipt={view.finalization} />}
      {handoff && <PersistedReceipt title='Handoff receipt' receipt={handoff} />}
    </>}
    {history && <section aria-label='Historical receipts (not current)' className='space-y-2 rounded-md border border-border p-3'>
      <h4 className='font-semibold'>Historical receipts (not current)</h4>
      <p>These receipts describe the previous read, not current packet or handoff eligibility.</p>
      <p className='break-words'>Failed action CID: {history.failedRequestId}. This identifies the rejected attempt, not a successful receipt.</p>
      {history.finalization && <PersistedReceipt title='Historical finalization receipt' receipt={history.finalization} />}
      {history.handoff && <PersistedReceipt title='Historical handoff receipt' receipt={history.handoff} />}
    </section>}
  </section>;
}
