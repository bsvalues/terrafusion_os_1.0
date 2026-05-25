
import type { CurrentUseOperationalSummary } from './currentUseAnalyticsTypes';

export async function getCurrentUseOperationalSummaryMock(
  countyId: string,
): Promise<CurrentUseOperationalSummary> {
  return {
    countyId,
    totalClassifiedParcels: 1248,
    totalClassifiedAcres: 58214.42,
    estimatedTotalRollbackExposure: 12450221.12,
    activeMonitoringCount: 138,
    removalReviewCount: 22,
    appealWindowOpenCount: 14,
    missingEvidenceCount: 77,
    kpis: [
      {
        key: 'classified_parcels',
        label: 'Classified Parcels',
        value: 1248,
        unit: 'count',
        trend: 'stable',
      },
      {
        key: 'rollback_exposure',
        label: 'Rollback Exposure',
        value: 12450221.12,
        unit: 'usd',
        trend: 'up',
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
