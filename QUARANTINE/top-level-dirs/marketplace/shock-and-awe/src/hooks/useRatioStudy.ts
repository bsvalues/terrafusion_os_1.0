import { useCallback, useState } from 'react';
import { RatioStudyRequest, RatioStudyResult, TerraFusionAPIClient } from '../services/TerraFusionAPIClient';

export function useRatioStudy(baseUrl?: string) {
  const api = new TerraFusionAPIClient(baseUrl);
  const [result, setResult] = useState<RatioStudyResult | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const run = useCallback(async (req: RatioStudyRequest) => {
    setLoading(true); setError(undefined);
    try {
      const r = await api.ratioStudy(req);
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? 'Ratio study failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, run };
}
