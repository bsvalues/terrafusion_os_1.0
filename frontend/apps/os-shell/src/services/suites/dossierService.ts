/**
 * TerraDossier Service — Document Management Engine
 * ===================================================================
 * Constitutional service for TerraDossier (document management).
 *
 * Owns: documents, narratives, evidence, packets, case files.
 * No valuation math — that belongs to TerraForge.
 *
 * Typed fetch wrappers to backend endpoints. No business logic.
 *
 * Write-lane enforcement (Phase 19): all mutating functions call
 * assertWriteLane('dossier', 'document') before touching the API.
 */

import { assertWriteLane } from '../writeLane';
import { getToken } from '../../auth/authStorage';

const API = '/api/dossier';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// ============================================================================
// Types
// ============================================================================

export interface Document {
  documentId: string;
  parcelId: string;
  type: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Narrative {
  narrativeId: string;
  parcelId: string;
  type: 'defense' | 'market-analysis' | 'subject-description' | 'reconciliation';
  content: string;
  generatedAt: string;
  status: 'draft' | 'final';
  generatedBy?: string;
}

export interface Packet {
  packetId: string;
  parcelId: string;
  documents: string[];
  status: 'assembling' | 'assembled' | 'reviewed' | 'finalized';
  assembledAt?: string;
  assembledBy?: string;
}

export interface Evidence {
  evidenceId: string;
  parcelId: string;
  type: string;
  description: string;
  documentId?: string;
  addedAt: string;
}

// ============================================================================
// Document Operations
// ============================================================================

export async function uploadDocument(
  parcelId: string,
  file: File,
  type: string
): Promise<Document> {
  assertWriteLane('dossier', 'document');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('parcelId', parcelId);
  formData.append('type', type);

  const res = await fetch(`${API}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload document: ${res.statusText}`);
  return res.json();
}

export async function getDocuments(parcelId: string): Promise<Document[]> {
  const res = await fetch(
    `${API}/parcels/${encodeURIComponent(parcelId)}/documents`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function deleteDocument(documentId: string): Promise<void> {
  assertWriteLane('dossier', 'document');
  const res = await fetch(
    `${API}/documents/${encodeURIComponent(documentId)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error(`Failed to delete document: ${res.statusText}`);
}

export async function downloadDocument(documentId: string): Promise<Blob> {
  const res = await fetch(
    `${API}/documents/${encodeURIComponent(documentId)}/download`
  );
  if (!res.ok) throw new Error(`Failed to download document: ${res.statusText}`);
  return res.blob();
}

// ============================================================================
// Narrative Operations
// ============================================================================

export async function createNarrative(
  parcelId: string,
  type: Narrative['type']
): Promise<Narrative> {
  const res = await fetch(`${API}/narratives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parcelId, type }),
  });
  if (!res.ok) throw new Error(`Failed to create narrative: ${res.statusText}`);
  return res.json();
}

export async function getNarratives(parcelId: string): Promise<Narrative[]> {
  const res = await fetch(
    `${API}/parcels/${encodeURIComponent(parcelId)}/details`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  // Backend has no dedicated narratives list; map from details notes if present
  const notes = Array.isArray(data?.notes) ? data.notes : [];
  return notes.map((n: { noteId?: string; id?: string; content?: string; addedAt?: string; addedBy?: string }) => ({
    narrativeId: n.noteId ?? n.id ?? '',
    parcelId,
    type: 'subject-description' as const,
    content: n.content ?? '',
    generatedAt: n.addedAt ?? new Date().toISOString(),
    status: 'final' as const,
    generatedBy: n.addedBy,
  }));
}

export async function updateNarrative(
  narrativeId: string,
  content: string,
  status: Narrative['status']
): Promise<Narrative> {
  const res = await fetch(
    `${API}/narratives/${encodeURIComponent(narrativeId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, status }),
    }
  );
  if (!res.ok) throw new Error(`Failed to update narrative: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Packet Assembly
// ============================================================================

export async function assemblePacket(
  parcelId: string,
  documentIds: string[]
): Promise<Packet> {
  assertWriteLane('dossier', 'document');
  const res = await fetch(`${API}/packets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parcelId, documentIds }),
  });
  if (!res.ok) throw new Error(`Failed to assemble packet: ${res.statusText}`);
  return res.json();
}

export async function getPackets(parcelId: string): Promise<Packet[]> {
  const res = await fetch(
    `${API}/parcels/${encodeURIComponent(parcelId)}/packets`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch packets: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function finalizePacket(packetId: string): Promise<Packet> {
  assertWriteLane('dossier', 'document');
  const res = await fetch(
    `${API}/packets/${encodeURIComponent(packetId)}/finalize`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Failed to finalize packet: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Evidence
// ============================================================================

export async function attachEvidence(
  parcelId: string,
  evidence: Omit<Evidence, 'evidenceId' | 'addedAt'>
): Promise<Evidence> {
  assertWriteLane('dossier', 'document');
  const res = await fetch(`${API}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...evidence, parcelId }),
  });
  if (!res.ok) throw new Error(`Failed to attach evidence: ${res.statusText}`);
  return res.json();
}

export async function getEvidence(parcelId: string): Promise<Evidence[]> {
  const res = await fetch(
    `${API}/parcels/${encodeURIComponent(parcelId)}/evidence`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch evidence: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
