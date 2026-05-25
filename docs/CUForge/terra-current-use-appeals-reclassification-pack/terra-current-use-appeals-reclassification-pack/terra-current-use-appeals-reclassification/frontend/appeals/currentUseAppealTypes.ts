export type CurrentUseAppealStatus =
  | 'DRAFT'
  | 'APPEAL_WINDOW_OPEN'
  | 'FILED'
  | 'PACKET_PREPARING'
  | 'PACKET_READY'
  | 'SCHEDULED'
  | 'HEARING_COMPLETE'
  | 'DECISION_RECEIVED'
  | 'CLOSED'
  | 'WITHDRAWN';

export type CurrentUseReclassificationStatus =
  | 'NOT_STARTED'
  | 'OPTION_AVAILABLE'
  | 'APPLICATION_RECEIVED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DENIED'
  | 'EXPIRED'
  | 'CLOSED';

export interface CurrentUseAppeal {
  appealId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  removalId?: string;
  rollbackCalculationId?: string;
  status: CurrentUseAppealStatus;
  noticeMailDate: string;
  appealDeadline: string;
  filedDate?: string;
  hearingDate?: string;
  boardReferenceNumber?: string;
  summary: string;
  evidenceDocumentIds: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CurrentUseReclassificationOption {
  reclassificationId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  fromClassification: string;
  targetClassification?: string;
  status: CurrentUseReclassificationStatus;
  noticeDate: string;
  applicationDeadline: string;
  applicationReceivedDate?: string;
  summary: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
