export type CurrentUseTraceAction =
  | 'ClassificationCreated'
  | 'ClassificationStateChanged'
  | 'EligibilityReviewRun'
  | 'RollbackCalculationRun'
  | 'RollbackCalculationLocked'
  | 'NoticePreviewGenerated'
  | 'NoticeGenerated'
  | 'NoticeSent'
  | 'RemovalInitiated'
  | 'RemovalFinalized'
  | 'WithdrawalProcessed'
  | 'PenaltySuppressed'
  | 'StatutoryExceptionMarked'
  | 'DocumentLinked'
  | 'EvidencePacketReviewed'
  | 'WorkflowTaskCreated'
  | 'WorkflowStatusChanged'
  | 'AiSummaryGenerated'
  | 'SpatialReviewViewed';

export interface CurrentUseTraceEvent {
  id: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  correlationId?: string;
  action: CurrentUseTraceAction | string;
  actorId: string;
  actorDisplayName: string;
  timestamp: string;
  calculationVersion?: string;
  documentIds: string[];
  summary: string;
  payloadJson?: string;
  hash: string;
  previousHash?: string;
}
