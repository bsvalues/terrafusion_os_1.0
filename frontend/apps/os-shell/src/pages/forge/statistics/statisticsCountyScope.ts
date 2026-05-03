import { getSession } from '@/auth/session';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

import {
  getCountyFileStem,
  supportsStatisticsAdvancedAnalysisLane,
} from '../countyCertification';

export interface StatisticsCountyScope {
  countyId: string | null;
  headers: Record<string, string>;
  isolated: boolean;
  advancedCertified: boolean;
  exportStem: string;
}

export function getStatisticsCountyScope(): StatisticsCountyScope {
  const session = getSession();
  const { headers, isolated } = buildCountyScopedSessionHeaders(session);
  const countyId = session?.countyId ?? null;

  return {
    countyId,
    headers,
    isolated,
    advancedCertified: supportsStatisticsAdvancedAnalysisLane(countyId),
    exportStem: getCountyFileStem(countyId),
  };
}
