import { useEffect, useState } from 'react';

export interface Cohort { id: string; name: string; size: number }

export function useCohorts(tenantId?: string) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  useEffect(() => {
    setCohorts(tenantId ? [{ id: 'default', name: 'All Parcels', size: 10000 }] : []);
  }, [tenantId]);
  return { cohorts };
}
