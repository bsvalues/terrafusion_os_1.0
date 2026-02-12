import { useCallback, useState } from 'react';
import { LevyForecast, LevyScenarioRequest, TerraFusionAPIClient } from '../services/TerraFusionAPIClient';

export function useLevyForecast(baseUrl?: string) {
  const api = new TerraFusionAPIClient(baseUrl);
  const [result, setResult] = useState<LevyForecast | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const run = useCallback(async (req: LevyScenarioRequest) => {
    setLoading(true); setError(undefined);
    try {
      const r = await api.levyForecast(req);
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? 'Levy forecast failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, run };
}
