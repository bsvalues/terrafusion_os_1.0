
export interface CurrentUseKpi {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend?: string;
}

export interface CurrentUseOperationalSummary {
  countyId: string;
  totalClassifiedParcels: number;
  totalClassifiedAcres: number;
  estimatedTotalRollbackExposure: number;
  activeMonitoringCount: number;
  removalReviewCount: number;
  appealWindowOpenCount: number;
  missingEvidenceCount: number;
  kpis: CurrentUseKpi[];
  generatedAt: string;
}
