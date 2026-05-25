export type CurrentUseComplianceStatus =
  | 'UNKNOWN'
  | 'COMPLIANT'
  | 'MONITORING'
  | 'EVIDENCE_NEEDED'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_COMPLETE'
  | 'AT_RISK'
  | 'REMOVAL_REVIEW_RECOMMENDED';

export type CurrentUseInspectionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_FIELD'
  | 'COMPLETE'
  | 'CANCELED'
  | 'REQUIRES_FOLLOWUP';

export interface CurrentUseInspectionFinding {
  findingType: string;
  summary: string;
  riskFlag: boolean;
}

export interface CurrentUseInspection {
  inspectionId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  status: CurrentUseInspectionStatus;
  scheduledDate?: string;
  completedDate?: string;
  inspectorId?: string;
  inspectorName?: string;
  findings: CurrentUseInspectionFinding[];
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CurrentUseComplianceSummary {
  countyId: string;
  parcelId: string;
  classificationId?: string;
  status: CurrentUseComplianceStatus;
  lastInspectionDate?: string;
  nextInspectionDueDate?: string;
  lastIncomeAuditDate?: string;
  nextIncomeAuditDueDate?: string;
  riskScore: number;
  riskReasons: string[];
  recentInspections: CurrentUseInspection[];
}
