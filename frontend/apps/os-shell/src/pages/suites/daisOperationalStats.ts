import type { QueueMetrics } from '../../data/queueFixtures';
import type { CountyAggregateStats } from '../../types/domain';
import type { Appeal, CertificationStatus } from '../../services/suites/daisService';

export interface DaisOperationalStats {
  activeAppeals: number;
  totalLevyRevenue: number | null;
  pendingAssessments: number;
  assessmentCompletionPercent: number;
}

export function mapCountyStatsToDaisOperationalStats(
  stats: CountyAggregateStats,
): DaisOperationalStats {
  return {
    activeAppeals: stats.activeAppeals,
    totalLevyRevenue: stats.totalLevyRevenue,
    pendingAssessments: stats.pendingAssessments,
    assessmentCompletionPercent: stats.assessmentCompletionPercent,
  };
}

export function composeDaisOperationalStats(
  appeals: Appeal[],
  certifications: CertificationStatus[],
  queueMetrics: QueueMetrics,
): DaisOperationalStats {
  const activeAppeals = appeals.filter(
    (appeal) => appeal.status !== 'decided' && appeal.status !== 'withdrawn',
  ).length;

  const pendingAssessments =
    queueMetrics.totalUnassigned +
    queueMetrics.totalInProgress +
    queueMetrics.totalPendingReview;

  const totalParcels = certifications.reduce(
    (sum, cert) => sum + Math.max(cert.totalParcels, 0),
    0,
  );
  const completedParcels = certifications.reduce(
    (sum, cert) => sum + Math.max(cert.completedParcels, 0),
    0,
  );

  const assessmentCompletionPercent =
    totalParcels > 0
      ? (completedParcels / totalParcels) * 100
      : certifications.length > 0
        ? certifications.reduce((sum, cert) => sum + cert.percentComplete, 0) /
          certifications.length
        : 0;

  return {
    activeAppeals,
    totalLevyRevenue: null,
    pendingAssessments,
    assessmentCompletionPercent,
  };
}
