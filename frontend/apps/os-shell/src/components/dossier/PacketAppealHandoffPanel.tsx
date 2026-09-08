import React from 'react';
import { Link } from 'react-router-dom';
import type { PacketWorkflowContext, PreparedPacketHandoff } from '../../services/dossierPacketWorkflowService';

interface Props { context: PacketWorkflowContext; sealed: boolean; handoff: PreparedPacketHandoff | null; busy: boolean; onPrepare: () => void }
export default function PacketAppealHandoffPanel({ context, sealed, handoff, busy, onPrepare }: Props) {
  if (!sealed) return <p className='text-muted-foreground'>A current sealed packet is required for appeal handoff.</p>;
  if (!handoff) return <button className='rounded-md border border-border px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50'
    disabled={busy} onClick={onPrepare}>Prepare appeal handoff</button>;
  return <div className='space-y-2 break-words'>
    <p>Prepared handoff {handoff.handoffId}</p>
    <Link className='text-primary underline' to={'/property/' + encodeURIComponent(context.parcelId) + '/dais?' +
      new URLSearchParams({ handoffId: handoff.handoffId, packetRevision: handoff.packetRevision, taxYear: String(context.taxYear) })}>Continue in Dais</Link>
  </div>;
}
