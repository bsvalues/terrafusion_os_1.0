import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { LeftRail } from './components/LeftRail';
import { SegmentTable } from './components/SegmentTable';
import { RightRail } from './components/RightRail';
import { BottomDeck } from './components/BottomDeck';
import { CohortCreationDialog } from './components/CohortCreationDialog';
import { OpenStudyDialog } from './components/OpenStudyDialog';
import { useCountyStudyHub } from './hooks/useCountyStudyHub';
import { useStudyData } from './hooks/useStudyData';
import type { CountySegmentDto } from './types/countyStudio.types';

type CenterTab = 'Overview' | 'Ratio Study' | 'Neighborhoods' | 'Adjustments' | 'Exceptions' | 'Compliance';

const TAB_FILTERS: Record<CenterTab, ((seg: CountySegmentDto) => boolean) | undefined> = {
  'Overview': undefined,
  'Ratio Study': undefined,
  'Neighborhoods': (seg) => seg.segmentType.toLowerCase().includes('neighborhood') || seg.segmentType.toLowerCase().includes('nbhd'),
  'Adjustments': undefined,
  'Exceptions': (seg) => seg.exceptionCount > 0,
  'Compliance': (seg) => seg.cod > 20 || seg.prd < 0.98 || seg.prd > 1.03,
};

const syncColor: Record<string, string> = {
  LIVE: '#22c55e', STAGED: '#f59e0b', SNAPSHOT: '#3b82f6', DISCONNECTED: '#6b7280',
};

export function CountyStudyPage() {
  const { activeStudy, syncState } = useCountyStudioStore();
  const [activeTab, setActiveTab] = useState<CenterTab>('Overview');
  const [showOpenStudy, setShowOpenStudy] = useState(false);
  const navigate = useNavigate();

  useCountyStudyHub(activeStudy?.studyId ?? null);
  useStudyData();

  const color = syncColor[syncState] ?? '#6b7280';
  const tabFilter = TAB_FILTERS[activeTab];

  const handleOpenAtlas = () => {
    if (!activeStudy) return;
    navigate(`/forge/atlas-live?studyId=${activeStudy.studyId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid hsl(var(--tf-border, 220 13% 20%))', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>TerraForge County Studio</span>
          {activeStudy && (
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              {activeStudy.countyId} · {activeStudy.taxYear} · {activeStudy.studyType}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeStudy && (
            <button
              aria-label="Open Atlas Live View"
              onClick={handleOpenAtlas}
              style={{
                padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--tf-border))',
                background: 'transparent', color: 'hsl(var(--tf-fg))', fontSize: 11,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              ↗ Atlas
            </button>
          )}
          <button
            aria-label="Open Study"
            onClick={() => setShowOpenStudy(true)}
            style={{
              padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--tf-border))',
              background: 'transparent', color: 'hsl(var(--tf-fg))', fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Open Study
          </button>
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
          {/* Tab Bar */}
          <div style={{
            height: 36, display: 'flex', alignItems: 'center', gap: 2, padding: '0 12px',
            borderBottom: '1px solid hsl(var(--tf-border, 220 13% 20%))', flexShrink: 0,
          }}>
            {(['Overview', 'Ratio Study', 'Neighborhoods', 'Adjustments', 'Exceptions', 'Compliance'] as CenterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none',
                  background: activeTab === tab ? 'hsl(var(--tf-surface))' : 'transparent',
                  color: activeTab === tab ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                  fontWeight: activeTab === tab ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <SegmentTable filter={tabFilter} />
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
      <OpenStudyDialog open={showOpenStudy} onClose={() => setShowOpenStudy(false)} />
    </div>
  );
}
