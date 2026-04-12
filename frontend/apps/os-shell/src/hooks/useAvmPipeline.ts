// TerraFusion OS — Mined from terra-forge-rebuild Phase 86
// AVM Pipeline: launch runs, monitor status, view diagnostics.
// REST-adapted for OS backend (GET/POST /api/avm/runs)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiBase';

export interface AvmRun {
  id: string;
  county_id: string;
  model_name: string;
  model_type: string;
  model_version: string;
  status: string;
  r_squared: number | null;
  rmse: number | null;
  mae: number | null;
  mape: number | null;
  cod: number | null;
  prd: number | null;
  sample_size: number | null;
  training_time_ms: number | null;
  feature_importance: Record<string, number> | null;
  predictions: Record<string, unknown>[] | null;
  training_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Fetch all AVM runs for the county, most recent first. */
export function useAvmRuns(countyId?: string) {
  return useQuery<AvmRun[]>({
    queryKey: ['avm-runs', countyId],
    queryFn: async () => {
      const res = await apiFetch(`/avm/runs?countyId=${encodeURIComponent(countyId!)}`);
      if (!res.ok) throw new Error(`AVM runs fetch failed: ${res.status}`);
      return await res.json() as AvmRun[];
    },
    enabled: !!countyId,
    staleTime: 15_000,
  });
}

/** Launch a new AVM run. */
export function useLaunchAvmRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      countyId: string;
      modelName: string;
      modelType: string;
      trainingConfig?: Record<string, unknown>;
    }) => {
      const res = await apiFetch('/avm/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          county_id: params.countyId,
          model_name: params.modelName,
          model_type: params.modelType,
          model_version: '1.0',
          status: 'queued',
          training_config: params.trainingConfig ?? {},
        }),
      });
      if (!res.ok) throw new Error(`AVM run launch failed: ${res.status}`);
      return await res.json() as AvmRun;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['avm-runs', data.county_id] });
    },
  });
}
