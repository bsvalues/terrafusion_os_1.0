import { useMemo, useState } from 'react';

export function useTenant() {
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const apiBase = useMemo(() => 'http://localhost:5000', []);
  return { tenantId, setTenantId, apiBase };
}
