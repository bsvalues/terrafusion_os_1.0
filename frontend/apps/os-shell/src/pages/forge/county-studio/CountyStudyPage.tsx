import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { LeftRail } from './components/LeftRail';
import { SegmentTable } from './components/SegmentTable';
import { RightRail } from './components/RightRail';
import { BottomDeck } from './components/BottomDeck';
import { CohortCreationDialog } from './components/CohortCreationDialog';
import { useCountyStudyHub } from './hooks/useCountyStudyHub';

export function CountyStudyPage() {
  const { activeStudy, syncState } = useCountyStudioStore();
  useCountyStudyHub(activeStudy?.studyId ?? null);

  const syncColor: Record<string, string> = {
    LIVE: '#22c55e',
    STAGED: '#f59e0b',
    SNAPSHOT: '#3b82f6',
    DISCONNECTED: '#6b7280',
  };
  const color = syncColor[syncState] ?? '#6b7280';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid hsl(var(--tf-border, 220 13% 20%))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>TerraForge County Studio</span>
          {activeStudy && (
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              {activeStudy.countyId} · {activeStudy.taxYear} · {activeStudy.studyType}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: 1 }}>
            ATLAS {syncState}
          </span>
        </div>
      </div>

      {/* Body Grid — 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 360px', flex: 1, minHeight: 0 }}>
        <div data-testid="cs-left-rail" style={{ borderRight: '1px solid hsl(var(--tf-border, 220 13% 20%))', overflowY: 'auto' }}>
          <LeftRail />
        </div>

        <div data-testid="cs-center" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ height: 36, display: 'flex', alignItems: 'center', gap: 2, padding: '0 12px', borderBottom: '1px solid hsl(var(--tf-border, 220 13% 20%))', flexShrink: 0 }}>
            {['Overview', 'Ratio Study', 'Neighborhoods', 'Adjustments', 'Exceptions', 'Compliance'].map((tab) => (
              <button key={tab} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <SegmentTable />
          </div>
          <div style={{ height: 200, borderTop: '1px solid hsl(var(--tf-border, 220 13% 20%))', flexShrink: 0 }}>
            <BottomDeck />
          </div>
        </div>

        <div data-testid="cs-right-rail" style={{ borderLeft: '1px solid hsl(var(--tf-border, 220 13% 20%))', overflowY: 'auto' }}>
          <RightRail />
        </div>
      </div>

      <CohortCreationDialog />
    </div>
  );
}
