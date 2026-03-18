/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * PacketAppealHandoffPanel
 *
 * Minimal appeal handoff surface: shows handoff readiness for the
 * active parcel's most recent finalized packet. Displays handoff
 * status and blockers.
 *
 * Props: { parcelId: string }
 */

import React, { useEffect, useState } from 'react';
import { getPackets, type Packet } from '../../services/suites/dossierService';

interface PacketAppealHandoffPanelProps {
  parcelId: string;
}

export default function PacketAppealHandoffPanel({ parcelId }: PacketAppealHandoffPanelProps) {
  const [latestPacket, setLatestPacket] = useState<Packet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getPackets(parcelId)
      .then((packets) => {
        if (cancelled) return;
        if (packets.length > 0) {
          setLatestPacket(packets[packets.length - 1]);
        }
      })
      .catch(() => {
        // Non-fatal
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [parcelId]);

  if (loading) {
    return (
      <div data-testid="handoff-loading" className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading appeal handoff status...
      </div>
    );
  }

  if (!latestPacket) {
    return (
      <div data-testid="handoff-empty" className="py-3 text-sm text-muted-foreground">
        No finalized packets available for appeal handoff.
      </div>
    );
  }

  const isFinalized = latestPacket.status === 'finalized';

  return (
    <div data-testid="handoff-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Appeal Handoff: Packet {latestPacket.packetId}</div>
          <div className="text-xs text-muted-foreground">
            {isFinalized ? 'Ready for appeal handoff' : `Packet status: ${latestPacket.status} — finalize first`}
          </div>
        </div>
        <span
          data-testid="handoff-status"
          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
            isFinalized
              ? 'bg-green-600 text-white'
              : 'bg-amber-600 text-white'
          }`}
        >
          {isFinalized ? 'Handoff Ready' : 'Not Ready'}
        </span>
      </div>
    </div>
  );
}
