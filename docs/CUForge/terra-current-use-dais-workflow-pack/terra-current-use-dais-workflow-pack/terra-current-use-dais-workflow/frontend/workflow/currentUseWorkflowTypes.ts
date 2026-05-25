export type CurrentUseWorkflowType =
  | 'APPLICATION_REVIEW'
  | 'CONTINUANCE_REVIEW'
  | 'REMOVAL_REVIEW'
  | 'OWNER_WITHDRAWAL'
  | 'MISSING_EVIDENCE_FOLLOWUP'
  | 'RECLASSIFICATION_REVIEW'
  | 'APPEAL_SUPPORT';

export type CurrentUseWorkflowStatus =
  | 'OPEN'
  | 'WAITING_ON_OWNER'
  | 'WAITING_ON_STAFF'
  | 'WAITING_ON_TREASURER'
  | 'WAITING_ON_BOARD'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELED';

export interface CurrentUseWorkflowTask {
  id: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  workflowType: CurrentUseWorkflowType;
  status: CurrentUseWorkflowStatus;
  title: string;
  assignedTo?: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  createdAt: string;
  createdBy: string;
}
