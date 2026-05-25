import type { ClassificationType } from '../../types/currentUseTypes';

export type CurrentUseNoticeType =
  | 'REQUEST_FOR_INFORMATION_VERIFY_INTENT'
  | 'NOTICE_OF_CONTINUANCE'
  | 'NOTICE_OF_INTENT_TO_REMOVE'
  | 'NOTICE_OF_REMOVAL'
  | 'NOTICE_OF_OWNER_REQUEST_TO_WITHDRAW'
  | 'VOLUNTARY_WITHDRAWAL_INSTRUCTIONS'
  | 'FARM_PLAN_REQUEST'
  | 'MISSING_EVIDENCE_REQUEST'
  | 'RECLASSIFICATION_OPTION_NOTICE';

export interface NoticePreviewRequest {
  countyId: string;
  parcelId: string;
  noticeType: CurrentUseNoticeType;
  classificationType: ClassificationType;
  ownerName: string;
  propertyAddress?: string;
  legalDescription?: string;
  assessorContactName?: string;
  assessorContactPhone?: string;
  assessorContactEmail?: string;
  removalReason?: string;
  responseDeadline?: string;
  rollbackCalculationId?: string;
  rollbackTotalDue?: number;
  generatedBy: string;
}

export interface NoticePreviewResult {
  noticeId: string;
  countyId: string;
  parcelId: string;
  noticeType: CurrentUseNoticeType;
  status: 'DRAFT' | 'PREVIEW_GENERATED' | 'PENDING_HUMAN_REVIEW' | 'APPROVED_FOR_ISSUANCE' | 'ISSUED' | 'VOIDED';
  title: string;
  body: string;
  humanReviewDisclaimer: string;
  generatedAt: string;
  generatedBy: string;
}
