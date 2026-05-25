export type ClassificationType =
  | 'OPEN_SPACE'
  | 'FARM_AND_AGRICULTURAL'
  | 'TIMBER_LAND'
  | 'DESIGNATED_FORESTLAND'
  | 'FARM_AND_AG_CONSERVATION_LAND'
  | 'UNKNOWN';

export type CurrentUseLifecycleState =
  | 'DRAFT_APPLICATION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED_CLASSIFIED'
  | 'ACTIVE_COMPLIANT'
  | 'ACTIVE_MONITORING'
  | 'TRANSFER_REVIEW_REQUIRED'
  | 'CONTINUANCE_PENDING'
  | 'CONTINUANCE_ACCEPTED'
  | 'AT_RISK'
  | 'INTENT_TO_REMOVE_ISSUED'
  | 'OWNER_WITHDRAWAL_REQUESTED'
  | 'REMOVAL_PENDING'
  | 'REMOVED'
  | 'WITHDRAWN'
  | 'RECLASSIFICATION_PENDING'
  | 'RECLASSIFIED'
  | 'APPEALED'
  | 'CLOSED';

export type RemovalType =
  | 'ASSESSOR_INITIATED_REMOVAL'
  | 'OWNER_VOLUNTARY_WITHDRAWAL'
  | 'TRANSFER_TRIGGERED_REMOVAL'
  | 'CHANGE_IN_USE_REMOVAL'
  | 'INCOME_FAILURE_REMOVAL'
  | 'ERROR_NO_FAULT_REMOVAL'
  | 'EXEMPT_TRANSFER_REMOVAL'
  | 'RECLASSIFICATION_REMOVAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvidenceStatus =
  | 'NOT_REQUIRED'
  | 'MISSING'
  | 'REQUESTED'
  | 'RECEIVED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'STALE';

export type EvidenceType =
  | 'APPLICATION_FORM'
  | 'FARM_PLAN'
  | 'LEASE_AGREEMENT'
  | 'INCOME_PROOF'
  | 'SCHEDULE_F'
  | 'CROP_RECEIPT'
  | 'LIVESTOCK_RECEIPT'
  | 'INSPECTION_NOTE'
  | 'AERIAL_REVIEW'
  | 'REET_AFFIDAVIT'
  | 'NOTICE_OF_CONTINUANCE'
  | 'OWNER_INTENT_RESPONSE'
  | 'CONTIGUOUS_CERTIFICATION'
  | 'TIMBER_MANAGEMENT_PLAN'
  | 'NOTICE_OF_REMOVAL'
  | 'WITHDRAWAL_REQUEST'
  | 'APPEAL_DOCUMENT';

export interface CurrentUseParcelOverview {
  parcelId: string;
  countyId: string;
  taxYear: number;
  classificationType: ClassificationType;
  lifecycleState: CurrentUseLifecycleState;
  classifiedAcres: number;
  totalParcelAcres: number;
  homesiteExcludedAcres?: number;
  currentUseValue?: number;
  trueAndFairValue?: number;
  rollbackExposureEstimate?: number;
  ownerName: string;
  operatorName?: string;
  leasedOperation: boolean;
  contiguousGroupId?: string;
  evidenceCompletenessScore: number;
  riskLevel: RiskLevel;
  lastReviewDate?: string;
  nextReviewDueDate?: string;
}

export interface CurrentUseEvidenceItem {
  id: string;
  parcelId: string;
  evidenceType: EvidenceType;
  status: EvidenceStatus;
  documentId?: string;
  receivedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export type CurrentUseEventType =
  | 'CLASSIFICATION_CREATED'
  | 'CLASSIFICATION_UPDATED'
  | 'DOCUMENT_RECEIVED'
  | 'NOTICE_GENERATED'
  | 'NOTICE_SENT'
  | 'ROLLBACK_CALCULATED'
  | 'REVIEW_NOTE_ADDED'
  | 'STATE_CHANGED'
  | 'OWNER_CONTACTED'
  | 'INSPECTION_COMPLETED'
  | 'APPEAL_FILED'
  | 'REMOVAL_FINALIZED';

export interface CurrentUseTimelineEvent {
  id: string;
  parcelId: string;
  eventType: CurrentUseEventType;
  eventDate: string;
  actorDisplayName: string;
  summary: string;
  payload?: Record<string, unknown>;
}
