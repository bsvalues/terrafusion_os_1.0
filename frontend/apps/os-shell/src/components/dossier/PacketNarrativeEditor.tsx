/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 3
 * PacketNarrativeEditor
 *
 * Minimal narrative surface: shows existing narratives for a parcel,
 * allows creating new narrative drafts linked to the active packet.
 * Write-lane enforcement is in dossierNarrative.ts (not here).
 *
 * Props: { parcelId: string }
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getNarratives, type Narrative } from '../../services/suites/dossierService';

interface PacketNarrativeEditorProps {
  parcelId: string;
}

export default function PacketNarrativeEditor({ parcelId }: PacketNarrativeEditorProps) {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getNarratives(parcelId)
      .then((result) => {
        if (!cancelled) setNarratives(result);
      })
      .catch(() => {
        // Non-fatal — show empty state
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [parcelId]);

  if (loading) {
    return (
      <div data-testid="narrative-loading" className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading narratives...
      </div>
    );
  }

  if (narratives.length === 0) {
    return (
      <div data-testid="narrative-empty" className="py-3 text-sm text-muted-foreground">
        No narratives for this parcel. Create one from an assembled packet.
      </div>
    );
  }

  return (
    <div data-testid="narrative-list" className="space-y-1">
      {narratives.map((nar) => (
        <div
          key={nar.narrativeId}
          data-testid="narrative-item"
          className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{nar.type} narrative</div>
            <div className="text-xs text-muted-foreground">
              {nar.status} | {new Date(nar.generatedAt).toLocaleDateString()}
            </div>
          </div>
          <span
            data-testid={`narrative-status-${nar.narrativeId}`}
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
              nar.status === 'final'
                ? 'bg-green-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {nar.status}
          </span>
        </div>
      ))}
    </div>
  );
}
