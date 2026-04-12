// TerraFusion OS — Mined from terra-forge-rebuild Phase 89
// IAAO Ratio Study Hook — computes COD/PRD/median from REST payload.
// REST-adapted for OS backend (GET /api/ratio-study/stats)

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiBase';

export interface RatioStudyStats {
  totalRatios: number;
  medianRatio: number;
  meanRatio: number;
  cod: number;
  prd: number;
  prb: number;
  minRatio: number;
  maxRatio: number;
  outlierCount: number;
  ratiosByTier: Record<string, { count: number; median: number; cod: number }>;
}

export function useRatioStudy(studyPeriodId?: string) {
  return useQuery<RatioStudyStats | null>({
    queryKey: ['ratio-study', studyPeriodId],
    queryFn: async () => {
      if (!studyPeriodId) return null;
      const res = await apiFetch(`/ratio-study/stats?studyPeriodId=${encodeURIComponent(studyPeriodId)}`);
      if (!res.ok) throw new Error(`Ratio study fetch failed: ${res.status}`);
      return await res.json() as RatioStudyStats;
    },
    enabled: !!studyPeriodId,
    staleTime: 30_000,
  });
}
