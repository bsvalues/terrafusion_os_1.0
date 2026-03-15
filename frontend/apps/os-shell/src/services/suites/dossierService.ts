/**
 * TerraDossier Service — Document Management Engine
 * ===================================================================
 * Constitutional service for TerraDossier (document management).
 *
 * Owns: documents, narratives, evidence, packets, case files.
 * No valuation math — that belongs to TerraForge.
 *
 * Typed fetch wrappers to backend endpoints. No business logic.
 */

const API = '/api/dossier';

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
    `${API}/documents?parcelId=${encodeURIComponent(parcelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);
  return res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
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
    `${API}/narratives?parcelId=${encodeURIComponent(parcelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch narratives: ${res.statusText}`);
  return res.json();
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
    `${API}/packets?parcelId=${encodeURIComponent(parcelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch packets: ${res.statusText}`);
  return res.json();
}

export async function finalizePacket(packetId: string): Promise<Packet> {
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
    `${API}/evidence?parcelId=${encodeURIComponent(parcelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch evidence: ${res.statusText}`);
  return res.json();
}
