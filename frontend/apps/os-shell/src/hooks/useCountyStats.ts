/**
 * useCountyStats — loads county-level aggregate statistics from the DataProvider.
 * Used by suite homes to show stats strips.
 */

import { useEffect, useState } from 'react';
import { getDataProvider } from '../services/dataProvider';
import type { CountyAggregateStats } from '../types/domain';

export interface CountyStatsResult {
  stats: CountyAggregateStats | null;
  loading: boolean;
  error: string | null;
}

export function useCountyStats(): CountyStatsResult {
  const [stats, setStats] = useState<CountyAggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDataProvider()
      .getCountyStats()
      .then((result) => {
        if (!cancelled) {
          setStats(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load stats');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}
