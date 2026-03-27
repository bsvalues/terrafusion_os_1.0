/**
 * useParcelCount.ts
 *
 * Live parcel count from the government stats endpoint.
 *   GET /api/government/stats
 *
 * Returns { data, isLoading, error } where data.totalParcels is the live DB count.
 * 5-minute stale time — government stats don't thrash.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiBase';

export interface ParcelCountStats {
  totalParcels: number;
  dataSource: string;
  stubbed: boolean;
}

async function fetchParcelStats(): Promise<ParcelCountStats> {
  const res = await apiFetch('/government/stats');
  if (!res.ok) throw new Error(`government/stats fetch failed: ${res.status}`);
  const body = await res.json();
  // Backend wraps stats: { county, stats: { totalParcels, ... }, timestamp }
  // Support both nested (real API) and flat (test mocks / legacy)
  return (body.stats ?? body) as ParcelCountStats;
}

export function useParcelCount() {
  return useQuery<ParcelCountStats>({
    queryKey: ['parcel-count'],
    queryFn: fetchParcelStats,
    staleTime: 5 * 60 * 1000, // 5 min — gov stats don't thrash
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
