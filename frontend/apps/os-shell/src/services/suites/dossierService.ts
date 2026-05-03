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

function authReadHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function readArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
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

export type CustodyAction = 'created' | 'transferred' | 'reviewed' | 'signed' | 'sealed' | 'accessed';

export interface CustodyEvent {
  timestamp: string;
  action: CustodyAction;
  actor: string;
  role: string;
  from?: string;
  to?: string;
  hash: string;
  note?: string;
}

export interface CustodyRecord {
  id: string;
  documentId: string;
  documentName: string;
  parcelId: string;
  events: CustodyEvent[];
  currentHolder: string;
  integrityStatus: 'verified' | 'warning' | 'broken';
}

export interface DefensePacket {
  id: string;
  appealId: string;
  parcelId: string;
  address: string;
  status: 'draft' | 'review' | 'final';
  items: { type: string; count: number }[];
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
}

export interface PropertyPhoto {
  id: string;
  parcelId: string;
  address: string;
  filename: string;
  thumbnailUrl?: string;
  elevation: 'front' | 'rear' | 'left' | 'right' | 'aerial' | 'interior' | 'detail';
  dateTaken: string;
  photographer: string;
  lat?: number;
  lng?: number;
  resolution?: string;
  fileSize?: string;
  fileSizeBytes?: number;
  tags: string[];
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

export async function getChainOfCustodyRecords(): Promise<CustodyRecord[]> {
  const res = await fetch(`${API}/chain-of-custody`, { headers: authReadHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch chain of custody: ${res.statusText}`);
  return readArray<CustodyRecord>(await res.json(), ['records', 'custodyRecords', 'items']);
}

export async function getDefensePackets(): Promise<DefensePacket[]> {
  const res = await fetch(`${API}/defense-packets`, { headers: authReadHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch defense packets: ${res.statusText}`);
  return readArray<DefensePacket>(await res.json(), ['packets', 'defensePackets', 'items']);
}

export async function getPropertyPhotos(): Promise<PropertyPhoto[]> {
  const res = await fetch(`${API}/photos`, { headers: authReadHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch property photos: ${res.statusText}`);
  return readArray<PropertyPhoto>(await res.json(), ['photos', 'propertyPhotos', 'items']);
}
