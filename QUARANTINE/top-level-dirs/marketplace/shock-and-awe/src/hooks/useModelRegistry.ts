import { useEffect, useState } from 'react';

export interface ModelRef { id: string; name: string; version: string }

export function useModelRegistry(tenantId?: string) {
  const [models, setModels] = useState<ModelRef[]>([]);
  useEffect(() => {
    setModels(tenantId ? [{ id: 'model-1', name: 'County Valuation', version: 'v1.0.0' }] : []);
  }, [tenantId]);
  return { models };
}
