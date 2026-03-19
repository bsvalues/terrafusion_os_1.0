/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 1
 * ParcelEvidencePacket
 *
 * Minimal packet shell: fetches documents + evidence for a parcel,
 * lets the user select items, and triggers packet assembly.
 *
 * Props: { parcelId: string }
 * Write-lane enforcement is in suites/dossierService.ts (not here).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  getDocuments,
  getEvidence,
  getPackets,
  assemblePacket,
  type Document,
  type Evidence,
  type Packet,
} from '../../services/suites/dossierService';

interface ParcelEvidencePacketProps {
  parcelId: string;
}

export default function ParcelEvidencePacket({ parcelId }: ParcelEvidencePacketProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [packet, setPacket] = useState<Packet | null>(null);
  const [assembling, setAssembling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getDocuments(parcelId),
      getEvidence(parcelId),
      getPackets(parcelId),
    ])
      .then(([docs, evItems, packets]) => {
        if (cancelled) return;
        setDocuments(docs);
        setEvidence(evItems);
        // Show most recent packet if any
        if (packets.length > 0) {
          setPacket(packets[packets.length - 1]);
        }
      })
      .catch(() => {
        // Errors are non-fatal — show empty state
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [parcelId]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAssemble = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setAssembling(true);
    try {
      const result = await assemblePacket(parcelId, Array.from(selectedIds));
      setPacket(result);
    } catch {
      // Error handling deferred to future tranche
    } finally {
      setAssembling(false);
    }
  }, [parcelId, selectedIds]);

  // Loading
  if (loading) {
    return (
      <div data-testid="evidence-packet-loading" className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading evidence...
      </div>
    );
  }

  // Empty
  if (documents.length === 0 && evidence.length === 0) {
    return (
      <div data-testid="evidence-packet-empty" className="py-4 text-center text-sm text-muted-foreground">
        No documents or evidence for this parcel.
      </div>
    );
  }

  return (
    <div data-testid="evidence-packet-content">
      {/* Document list */}
      <div className="space-y-1">
        {documents.map((doc) => (
          <label
            key={doc.documentId}
            data-testid="evidence-item"
            className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-accent/5"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(doc.documentId)}
              onChange={() => toggleItem(doc.documentId)}
              className="h-4 w-4 rounded border-border"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{doc.fileName}</div>
              <div className="text-xs text-muted-foreground">
                {doc.type} | {new Date(doc.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </label>
        ))}

        {evidence.map((ev) => (
          <label
            key={ev.evidenceId}
            data-testid="evidence-item"
            className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-accent/5"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(ev.evidenceId)}
              onChange={() => toggleItem(ev.evidenceId)}
              className="h-4 w-4 rounded border-border"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{ev.description}</div>
              <div className="text-xs text-muted-foreground">
                {ev.type} | {new Date(ev.addedAt).toLocaleDateString()}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        <button
          data-testid="assemble-packet-btn"
          onClick={handleAssemble}
          disabled={selectedIds.size === 0 || assembling}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {assembling ? 'Assembling...' : `Assemble Packet (${selectedIds.size})`}
        </button>

        {packet && (
          <span
            data-testid="packet-status"
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
              packet.status === 'finalized'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {packet.status}
          </span>
        )}
      </div>
    </div>
  );
}
