import { useEffect, useMemo, useState } from 'react';
import { useCountyStats } from '../../hooks/useCountyStats';
import { getAllAppeals, getCertificationStatus } from '../../services/suites/daisService';
import { getQueueMetrics } from '../../services/suites/queueService';
import {
  composeDaisOperationalStats,
  mapCountyStatsToDaisOperationalStats,
  type DaisOperationalStats,
} from './daisOperationalStats';

export interface DaisSuiteStatsResult {
  stats: DaisOperationalStats | null;
  loading: boolean;
  error: string | null;
  source: 'dais-api' | 'county-provider' | null;
}

export function useDaisSuiteStats(): DaisSuiteStatsResult {
  const countyStats = useCountyStats();

  const providerStats = useMemo(
    () =>
      countyStats.stats
        ? mapCountyStatsToDaisOperationalStats(countyStats.stats)
        : null,
    [countyStats.stats],
  );

  const [apiStats, setApiStats] = useState<DaisOperationalStats | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDaisStats() {
      setApiLoading(true);
      setApiError(null);

      try {
        const [appeals, certifications, queueMetrics] = await Promise.all([
          getAllAppeals(),
          getCertificationStatus(),
          getQueueMetrics({ throwOnError: true }),
        ]);

        if (!cancelled) {
          setApiStats(
            composeDaisOperationalStats(appeals, certifications, queueMetrics),
          );
          setApiLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            err instanceof Error
              ? err.message
              : 'Failed to load TerraDais operational metrics',
          );
          setApiLoading(false);
        }
      }
    }

    void loadDaisStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = apiStats ?? providerStats;
  const loading = (stats === null && countyStats.loading) || (stats === null && apiLoading);
  const error = stats === null ? apiError ?? countyStats.error : null;
  const source = apiStats
    ? 'dais-api'
    : providerStats
      ? 'county-provider'
      : null;

  return { stats, loading, error, source };
}
