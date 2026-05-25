export type CurrentUseEvidencePacketStatus =
  | 'DRAFT'
  | 'INCOMPLETE'
  | 'READY_FOR_REVIEW'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ARCHIVED';

export type CurrentUseDocumentLinkStatus =
  | 'LINKED'
  | 'PENDING_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'REMOVED';

export interface CurrentUseDossierDocument {
  documentId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  documentType: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  linkStatus: CurrentUseDocumentLinkStatus;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface CurrentUseEvidencePacket {
  packetId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  packetType: string;
  status: CurrentUseEvidencePacketStatus;
  documents: CurrentUseDossierDocument[];
  missingDocumentTypes: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
