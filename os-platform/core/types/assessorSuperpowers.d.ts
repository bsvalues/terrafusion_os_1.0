export type AssessorStaffRole =
  | 'chief_appraiser'
  | 'residential_analyst'
  | 'commercial_analyst'
  | 'gis_analyst'
  | 'field_appraiser'
  | 'appeals_specialist'
  | 'assessor_leadership';

export type CountyQueueType =
  | 'calibration_review'
  | 'morning_brief'
  | 'parcel_correction'
  | 'appeal_packet'
  | 'certification';

export type CountyRecommendedTool =
  | 'generate_morning_brief'
  | 'propose_rate_adjustment'
  | 'rerun_ratio_study'
  | 'compare_matrix_versions'
  | 'explain_spatial_anomaly'
  | 'flag_parcel_data_issue'
  | 'open_appeal_packet'
  | 'query_parcel_layers';

export type CountyFindingScope =
  | 'county'
  | 'reval_area'
  | 'neighborhood'
  | 'parcel'
  | 'appeal';

export type CountyFindingType =
  | 'RATE_PROBLEM'
  | 'DATA_PROBLEM'
  | 'MARKET_SHIFT'
  | 'SPATIAL_PROBLEM'
  | 'NO_ACTION';

export interface CountyImpactPreview {
  prdBefore: number;
  prdAfter: number;
  codBefore: number;
  codAfter: number;
  avDelta: number;
  fairnessDelta: number;
}

export interface AssessorEvidenceLineageEntry {
  source: string;
  asOf: string;
  recordCount: number;
  citation: string;
}

export interface AssessorFindingContract {
  findingId: string;
  findingType: CountyFindingType;
  scope: CountyFindingScope;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  countyId: string;
  taxYear: number;
  evidenceLineage: AssessorEvidenceLineageEntry[];
  affectedParcelIds: string[];
  recommendedAction: string;
  assignedRole: AssessorStaffRole;
}

export interface AssessorActionContract {
  draftVersion: string;
  reasonCode: string;
  confirmation: boolean;
  impactPreview: CountyImpactPreview;
  signoffRequired: boolean;
  traceRef: string;
  targetLane: string;
}

export interface RoleBriefContract {
  role: AssessorStaffRole;
  queueType: CountyQueueType;
  priority: AssessorFindingContract['severity'];
  dueWindow: string;
  blockingDependencies: string[];
  recommendedTool: CountyRecommendedTool;
  readyToAct: boolean;
}