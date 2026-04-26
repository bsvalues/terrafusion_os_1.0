import { getSession } from '@/auth/session';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

export interface CountyStudyScope {
  countyId: string | null;
  headers: Record<string, string>;
  isolated: boolean;
}

export function getCountyStudyScope(): CountyStudyScope {
  const session = getSession();
  const { headers, isolated } = buildCountyScopedSessionHeaders(session);

  return {
    countyId: session?.countyId ?? null,
    headers,
    isolated,
  };
}

export function requireCountyStudyScope(message = 'County scope required for County Studio.'): CountyStudyScope & { countyId: string } {
  const scope = getCountyStudyScope();
  if (!scope.isolated || !scope.countyId) {
    throw new Error(message);
  }
  return {
    ...scope,
    countyId: scope.countyId,
  };
}
