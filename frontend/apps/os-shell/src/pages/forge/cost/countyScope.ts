import { getSession } from '@/auth/session';
import { getToken } from '@/auth/authStorage';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

export interface CostForgeCountyScope {
  countyId: string | null;
  headers: Record<string, string>;
  isolated: boolean;
}

export function getCostForgeCountyScope(): CostForgeCountyScope {
  const session = getSession();
  const { headers, isolated } = buildCountyScopedSessionHeaders(session);
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return {
    countyId: session?.countyId ?? null,
    headers,
    isolated,
  };
}

export function getCostForgeCountyBadgeLabel(): string {
  return getCostForgeCountyScope().isolated
    ? 'County-scoped workspace'
    : 'County scope required';
}
