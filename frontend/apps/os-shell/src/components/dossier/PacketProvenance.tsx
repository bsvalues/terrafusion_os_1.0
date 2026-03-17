/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 2
 * PacketProvenance
 *
 * Displays the provenance chain for items in a packet.
 * Each entry shows its source module (read-origin), not the
 * write-lane owner. Dossier owns the packet, but evidence may
 * originate from Forge, Atlas, or other suites.
 *
 * Props: { entries: ProvenanceEntry[] }
 */

import React from 'react';
import type { ProvenanceEntry } from '../../services/suites/packetComposition';

interface PacketProvenanceProps {
  entries: ProvenanceEntry[];
}

export default function PacketProvenance({ entries }: PacketProvenanceProps) {
  if (entries.length === 0) {
    return (
      <div data-testid="provenance-empty" className="py-2 text-sm text-muted-foreground">
        No provenance entries.
      </div>
    );
  }

  return (
    <div data-testid="packet-provenance" className="space-y-1">
      {entries.map((entry) => (
        <div
          key={entry.itemId}
          data-testid="provenance-entry"
          className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{entry.description}</div>
            <div className="text-xs text-muted-foreground">
              {entry.itemType} | {new Date(entry.addedAt).toLocaleDateString()} | {entry.addedBy}
            </div>
          </div>
          <span
            data-testid={`provenance-source-${entry.itemId}`}
            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground"
          >
            {entry.sourceModule}
          </span>
        </div>
      ))}
    </div>
  );
}
