import React, { useMemo } from 'react';
import { getSession } from '@/auth/session';
import {
  getCountyFileStem,
  supportsStatisticsAdvancedAnalysisLane,
} from '../../countyCertification';
import { StatisticsStudio } from '../../statistics/StatisticsStudio';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { StatisticsCountyScope } from '../../statistics/statisticsCountyScope';

function buildStudyCountyScope(
  countyId: string,
): StatisticsCountyScope {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-county-id': countyId,
  };

  if (session?.userId) headers['x-user-id'] = session.userId;
  if (session?.role) headers['x-role'] = session.role;
  if (session?.mode) headers['x-mode'] = session.mode;

  return {
    countyId,
    headers,
    isolated: true,
    advancedCertified: supportsStatisticsAdvancedAnalysisLane(countyId),
    exportStem: getCountyFileStem(countyId),
  };
}

export function CountyStatisticsWorkbenchPanel() {
  const activeStudy = useCountyStudioStore((state) => state.activeStudy);

  const countyScope = useMemo(
    () => activeStudy?.countyId ? buildStudyCountyScope(activeStudy.countyId) : null,
    [activeStudy?.countyId],
  );

  if (!activeStudy || !countyScope) {
    return (
      <div
        data-testid="county-studio-statistics-lab-empty"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          color: 'hsl(var(--tf-muted))',
          textAlign: 'center',
        }}
      >
        Open a County Studio study to load the full Statistics Lab inside the same county-scoped workbench.
      </div>
    );
  }

  return (
    <div
      data-testid="county-studio-statistics-lab"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        data-testid="county-studio-statistics-lab-disclosure"
        style={{
          margin: '12px 16px 0',
          padding: '10px 12px',
          border: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-surface))',
          borderRadius: 4,
          fontSize: 12,
          color: 'hsl(var(--tf-muted))',
        }}
      >
        Full Statistics Studio capability is embedded here as a County Studio workbench mode.
        This preserves every statistics tab while the native County Studio command panels continue
        to own cohorts, scenarios, correction routing, map co-presence, and defense.
      </div>
      <StatisticsStudio
        embeddedInCountyStudio
        countyScopeOverride={countyScope}
        initialTaxYear={activeStudy.taxYear}
      />
    </div>
  );
}
