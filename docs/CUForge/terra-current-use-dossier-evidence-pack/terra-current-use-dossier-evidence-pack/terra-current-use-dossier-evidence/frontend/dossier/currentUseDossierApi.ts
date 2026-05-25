import type { CurrentUseEvidencePacket } from './currentUseDossierTypes';

export async function getCurrentUseEvidencePacket(
  parcelId: string,
): Promise<CurrentUseEvidencePacket> {
  const response = await fetch(`/api/dossier/current-use/parcels/${parcelId}/evidence-packet`);

  if (!response.ok) {
    throw new Error('Failed to load Current Use evidence packet.');
  }

  return response.json();
}

export async function getCurrentUseEvidencePacketMock(
  parcelId: string,
): Promise<CurrentUseEvidencePacket> {
  return {
    packetId: 'packet-001',
    countyId: 'benton-wa',
    parcelId,
    packetType: 'CURRENT_USE_REVIEW_PACKET',
    status: 'INCOMPLETE',
    documents: [
      {
        documentId: 'doc-001',
        countyId: 'benton-wa',
        parcelId,
        documentType: 'FARM_PLAN',
        fileName: 'farm-plan-2025.pdf',
        contentType: 'application/pdf',
        sizeBytes: 184220,
        linkStatus: 'PENDING_REVIEW',
        uploadedAt: '2025-10-02T00:00:00.000Z',
        uploadedBy: 'current.use.desk@county.gov',
        notes: 'Five-year farm plan received.',
      },
      {
        documentId: 'doc-002',
        countyId: 'benton-wa',
        parcelId,
        documentType: 'INCOME_PROOF',
        fileName: 'schedule-f-2024.pdf',
        contentType: 'application/pdf',
        sizeBytes: 91240,
        linkStatus: 'ACCEPTED',
        uploadedAt: '2026-03-08T00:00:00.000Z',
        uploadedBy: 'current.use.desk@county.gov',
        notes: 'Income evidence accepted for review period.',
      },
    ],
    missingDocumentTypes: ['LEASE_AGREEMENT', 'OWNER_INTENT_RESPONSE'],
    createdAt: '2026-03-01T00:00:00.000Z',
    createdBy: 'system',
    updatedAt: '2026-03-08T00:00:00.000Z',
    updatedBy: 'current.use.desk@county.gov',
  };
}
