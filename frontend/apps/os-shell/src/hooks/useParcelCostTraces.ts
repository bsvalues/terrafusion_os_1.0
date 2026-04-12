// TerraFusion OS — Mined from terra-forge-rebuild Phase 210
// RCNLD calculation audit trail for a parcel.
// REST-adapted for OS backend (GET /api/costforge/traces)

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiBase';

export interface CalcTraceRow {
  id: string;
  parcel_id: string;
  schedule_source: string | null;
  calc_year: number | null;
  imprv_sequence: number | null;
  imprv_type_cd: string | null;
  calc_method: string;
  base_unit_cost: number | null;
  area_sqft: number | null;
  local_multiplier: number | null;
  current_cost_mult: number | null;
  rcn_before_ref: number | null;
  refinements_total: number | null;
  rcn: number | null;
  construction_class: string | null;
  quality_grade: string | null;
  age_years: number | null;
  effective_life_years: number | null;
  pct_good: number | null;
  rcnld: number | null;
  calc_run_at: string;
}

export function useParcelCostTraces(parcelId: string | null) {
  return useQuery<CalcTraceRow[]>({
    queryKey: ['parcel-cost-traces', parcelId],
    enabled: !!parcelId,
    staleTime: 300_000,
    queryFn: async () => {
      const res = await apiFetch(`/costforge/traces?parcelId=${encodeURIComponent(parcelId!)}`);
      if (!res.ok) throw new Error(`Cost traces fetch failed: ${res.status}`);
      return await res.json() as CalcTraceRow[];
    },
  });
}
