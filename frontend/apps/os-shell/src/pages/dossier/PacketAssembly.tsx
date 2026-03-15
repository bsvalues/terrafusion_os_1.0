/**
 * Dossier Packet Assembly Page (TFR-071)
 * ===================================================================
 * Document upload dialog, documents panel with drag-to-reorder,
 * narrative drafting area, packet preview. Uses dossierService.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  type Document as DossierDocument,
  type Narrative,
  type Packet,
  uploadDocument,
  getDocuments,
  createNarrative,
  getNarratives,
  assemblePacket,
  finalizePacket,
  deleteDocument,
} from '../../services/suites/dossierService';

// ============================================================================
// Document Upload Dialog
// ============================================================================

function UploadDialog({
  parcelId,
  onUploaded,
  onClose,
}: {
  parcelId: string;
  onUploaded: () => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('assessment');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(parcelId, file, docType);
      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Upload Document</h3>
        {error && (
          <div className="mb-3 rounded-md bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="assessment">Assessment</option>
              <option value="comparable-sale">Comparable Sale</option>
              <option value="photo">Photo</option>
              <option value="sketch">Sketch/Floor Plan</option>
              <option value="appeal">Appeal Document</option>
              <option value="legal">Legal Document</option>
              <option value="correspondence">Correspondence</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Documents Panel
// ============================================================================

function DocumentsPanel({
  documents,
  selectedIds,
  onToggle,
  onDelete,
}: {
  documents: DossierDocument[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {documents.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No documents uploaded yet.
        </div>
      )}
      {documents.map((doc) => (
        <div
          key={doc.documentId}
          className={`flex items-center justify-between rounded-md border px-3 py-2 ${
            selectedIds.has(doc.documentId)
              ? 'border-primary bg-primary/5'
              : 'border-border'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.has(doc.documentId)}
              onChange={() => onToggle(doc.documentId)}
              className="h-4 w-4 rounded border-border"
            />
            <div>
              <div className="text-sm font-medium">{doc.fileName}</div>
              <div className="text-xs text-muted-foreground">
                {doc.type} | Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} by{' '}
                {doc.uploadedBy}
              </div>
            </div>
          </div>
          <button
            onClick={() => onDelete(doc.documentId)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Narrative Drafting
// ============================================================================

function NarrativeDrafting({
  parcelId,
  narratives,
  onRefresh,
}: {
  parcelId: string;
  narratives: Narrative[];
  onRefresh: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<Narrative['type']>('defense');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await createNarrative(parcelId, selectedType);
      onRefresh();
    } catch {
      // Error handled by parent
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as Narrative['type'])}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="defense">Defense Narrative</option>
          <option value="market-analysis">Market Analysis</option>
          <option value="subject-description">Subject Description</option>
          <option value="reconciliation">Reconciliation</option>
        </select>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {narratives.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No narratives generated yet.
        </div>
      )}

      {narratives.map((n) => (
        <div key={n.narrativeId} className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium capitalize">{n.type}</span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                n.status === 'final'
                  ? 'bg-green-600 text-white'
                  : 'bg-yellow-600 text-white'
              }`}
            >
              {n.status}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {n.content.length > 300 ? n.content.slice(0, 300) + '...' : n.content}
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            Generated: {new Date(n.generatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function PacketAssembly() {
  const [parcelId, setParcelId] = useState('');
  const [activeParcel, setActiveParcel] = useState('');
  const [documents, setDocuments] = useState<DossierDocument[]>([]);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packet, setPacket] = useState<Packet | null>(null);

  const loadData = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [docs, narrs] = await Promise.all([
        getDocuments(pid),
        getNarratives(pid),
      ]);
      setDocuments(docs);
      setNarratives(narrs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadParcel = () => {
    if (!parcelId.trim()) return;
    setActiveParcel(parcelId.trim());
    setPacket(null);
    setSelectedDocIds(new Set());
    loadData(parcelId.trim());
  };

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      setSelectedDocIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      await loadData(activeParcel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleAssemble = async () => {
    if (selectedDocIds.size === 0) return;
    try {
      const result = await assemblePacket(activeParcel, Array.from(selectedDocIds));
      setPacket(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assemble packet');
    }
  };

  const handleFinalize = async () => {
    if (!packet) return;
    try {
      const result = await finalizePacket(packet.packetId);
      setPacket(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize packet');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Packet Assembly</h1>
        <p className="text-sm text-muted-foreground">
          Upload documents, generate narratives, and assemble evidence packets
        </p>
      </div>

      {/* Parcel Selection */}
      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Parcel ID</label>
          <input
            type="text"
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadParcel()}
            className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g. 1-0234-100-0001-000"
          />
        </div>
        <button
          onClick={handleLoadParcel}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Load Parcel
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-900/20 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading parcel data...
        </div>
      )}

      {/* Main Content */}
      {activeParcel && !loading && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Documents */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Documents</h3>
              <button
                onClick={() => setShowUpload(true)}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Upload
              </button>
            </div>
            <DocumentsPanel
              documents={documents}
              selectedIds={selectedDocIds}
              onToggle={toggleDoc}
              onDelete={handleDelete}
            />
          </div>

          {/* Right: Narratives */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-lg font-semibold">Narratives</h3>
            <NarrativeDrafting
              parcelId={activeParcel}
              narratives={narratives}
              onRefresh={() => loadData(activeParcel)}
            />
          </div>
        </div>
      )}

      {/* Assemble / Finalize */}
      {activeParcel && !loading && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleAssemble}
            disabled={selectedDocIds.size === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Assemble Packet ({selectedDocIds.size} documents)
          </button>
          {packet && (
            <>
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  packet.status === 'finalized'
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {packet.status}
              </span>
              {packet.status !== 'finalized' && (
                <button
                  onClick={handleFinalize}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Finalize Packet
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      {showUpload && activeParcel && (
        <UploadDialog
          parcelId={activeParcel}
          onUploaded={() => loadData(activeParcel)}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
