export type CurrentUseIssuedNoticeStatus =
  | 'DRAFT_PREVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED_FOR_ISSUANCE'
  | 'ISSUED'
  | 'VOIDED'
  | 'SUPERSEDED';

export type CurrentUseNoticeDeliveryMethod =
  | 'MAIL'
  | 'CERTIFIED_MAIL'
  | 'EMAIL'
  | 'HAND_DELIVERY'
  | 'PORTAL'
  | 'OTHER';

export interface CurrentUseIssuedNotice {
  noticeId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  removalId?: string;
  rollbackCalculationId?: string;
  noticeType: string;
  status: CurrentUseIssuedNoticeStatus;
  title: string;
  body: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedBy?: string;
  issuedAt?: string;
  deliveryMethod?: CurrentUseNoticeDeliveryMethod;
  deliveryReference?: string;
  dossierDocumentId?: string;
  createdAt: string;
  createdBy: string;
}
