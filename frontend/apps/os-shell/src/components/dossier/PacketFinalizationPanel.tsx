/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * PacketFinalizationPanel
 *
 * Minimal finalization surface: shows finalization status for the
 * active parcel's most recent packet. Displays cover sheet fields
 * and frozen/draft state.
 *
 * Props: { parcelId: string }
 */

import React, { useEffect, useState } from 'react';
import { getPackets, type Packet } from '../../services/suites/dossierService';

interface PacketFinalizationPanelProps {
  parcelId: string;
}

export default function PacketFinalizationPanel({ parcelId }: PacketFinalizationPanelProps) {
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
      <div data-testid="finalization-loading" className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading finalization status...
      </div>
    );
  }

  if (!latestPacket) {
    return (
      <div data-testid="finalization-empty" className="py-3 text-sm text-muted-foreground">
        No packets available for finalization. Assemble a packet first.
      </div>
    );
  }

  const isFinalized = latestPacket.status === 'finalized';

  return (
    <div data-testid="finalization-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Packet {latestPacket.packetId}</div>
          <div className="text-xs text-muted-foreground">
            {latestPacket.documents.length} documents | Status: {latestPacket.status}
          </div>
        </div>
        <span
          data-testid="finalization-status"
          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
            isFinalized
              ? 'bg-green-600 text-white'
              : latestPacket.status === 'reviewed'
              ? 'bg-blue-600 text-white'
              : 'bg-amber-600 text-white'
          }`}
        >
          {isFinalized ? 'Finalized' : latestPacket.status}
        </span>
      </div>
    </div>
  );
}
