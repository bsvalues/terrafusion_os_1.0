// frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx
//
// Task B — drill-lattice rewrite. The previous flat tab strip
// (Overview / Ratio Study / Neighborhoods / Adjustments / Exceptions /
// Compliance) has been replaced with a County → City → Neighborhood →
// Segment drill driven by countyStudioStore.drillLevel.
//
// The tab-filter concept is preserved as compact compliance/severity pills
// that live ABOVE whichever rollup or segment table is active (inside the
// rollup table components, not here).

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { LeftRail } from './components/LeftRail';
import { SegmentTable } from './components/SegmentTable';
import { CityRollupTable } from './components/CityRollupTable';
import { NeighborhoodRollupTable } from './components/NeighborhoodRollupTable';
import { DrillBreadcrumb } from './components/DrillBreadcrumb';
import { RightRail } from './components/RightRail';
import { BottomDeck } from './components/BottomDeck';
import { CohortCreationDialog } from './components/CohortCreationDialog';
import { OpenStudyDialog } from './components/OpenStudyDialog';
import { LoadErrorBanner } from './components/LoadErrorBanner';
import { CountyHealthPanel } from './components/CountyHealthPanel';
import { CountyCommandStrip } from './components/CountyCommandStrip';
import { useCountyStudyHub } from './hooks/useCountyStudyHub';
import { useStudyData } from './hooks/useStudyData';
import type { CountySegmentDto } from './types/countyStudio.types';

type SegmentSeverityFilter = 'all' | 'critical' | 'warnings' | 'healthy' | 'needsData';

/**
 * Severity filters over CountySegmentDto. All numeric-metric comparisons are
 * null-guarded — a sparse-sample segment (cod=null / medianRatio=null) must
 * not throw and must not be incorrectly classified as a critical breach.
 * Null-metric segments are surfaced via the dedicated 'needsData' bucket so
 * a chief appraiser can review them explicitly.
 */
const SEGMENT_FILTERS: Record<SegmentSeverityFilter, ((seg: CountySegmentDto) => boolean) | undefined> = {
  all:      undefined,
  critical: (s) =>
    s.stabilityScore < 60
    || (s.cod != null && s.cod > 20)
    || (s.medianRatio != null && (s.medianRatio < 0.90 || s.medianRatio > 1.10))
    || (s.prd != null && (s.prd < 0.98 || s.prd > 1.03))
    || s.exceptionCount > Math.max(1, Math.floor(s.parcelCount * 0.10)),
  warnings: (s) =>
    (s.stabilityScore >= 60 && s.stabilityScore < 80)
    || (s.cod != null && s.cod > 15 && s.cod <= 20)
    || s.exceptionCount > 0,
  healthy:  (s) =>
    s.stabilityScore >= 80
    && (s.cod == null || s.cod <= 15)
    && (s.medianRatio == null || (s.medianRatio >= 0.92 && s.medianRatio <= 1.08)),
  needsData: (s) => s.cod == null || s.medianRatio == null || s.prd == null,
};

const SEGMENT_FILTER_PILLS: { key: SegmentSeverityFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'critical',  label: 'Critical' },
  { key: 'warnings',  label: 'Warnings' },
  { key: 'healthy',   label: 'Healthy' },
  { key: 'needsData', label: 'Needs Data' },
];

const syncColor: Record<string, string> = {
  LIVE: '#22c55e', STAGED: '#f59e0b', SNAPSHOT: '#3b82f6', DISCONNECTED: '#6b7280',
};

export function CountyStudyPage() {
  const {
    activeStudy, syncState, drillLevel, selectedNeighborhood, selectedNeighborhoodRevalArea,
  } = useCountyStudioStore();
  const [showOpenStudy, setShowOpenStudy] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<SegmentSeverityFilter>('all');
  const navigate = useNavigate();

  useCountyStudyHub(activeStudy?.studyId ?? null);
  const { retryAll } = useStudyData();

  const color = syncColor[syncState] ?? '#6b7280';

  const handleOpenAtlas = () => {
    if (!activeStudy) return;
    const params = new URLSearchParams({
      studyId: activeStudy.studyId,
      countyId: activeStudy.countyId,
      taxYear: String(activeStudy.taxYear),
    });
    if (activeStudy.countyName) {
      params.set('countyName', activeStudy.countyName);
    }
    navigate(`/forge/atlas-live?${params.toString()}`);
  };

  // Compose segment filter: severity pill AND selectedNeighborhood (when at the
  // neighborhood drill level). Memoized so the SegmentTable doesn't re-sort on
  // every parent re-render.
  const segmentFilterFn = useMemo(() => {
    const severity = SEGMENT_FILTERS[segmentFilter];
    const hood = drillLevel === 'neighborhood' ? selectedNeighborhood : null;
    const revalArea = drillLevel === 'neighborhood' ? selectedNeighborhoodRevalArea : null;
    return (seg: CountySegmentDto) => {
      if (severity && !severity(seg)) return false;
      if (hood && seg.geographyRef !== hood) return false;
      if (revalArea !== null && seg.revalArea !== revalArea) return false;
      return true;
    };
  }, [segmentFilter, drillLevel, selectedNeighborhood, selectedNeighborhoodRevalArea]);

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
              {activeStudy.countyName ?? activeStudy.countyId} · {activeStudy.taxYear} · {activeStudy.studyType}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeStudy && (
            <button
              aria-label="Pop Out Map"
              onClick={handleOpenAtlas}
              style={{
                padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--tf-border))',
                background: 'transparent', color: 'hsl(var(--tf-fg))', fontSize: 11,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              ↗ Pop Out Map
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

      {/* Load Error Banner — surfaces failed segments/cohorts/scenarios fetches with a retry */}
      <LoadErrorBanner onRetry={retryAll} />

      <CountyCommandStrip />

      {/* Body Grid — 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 360px', flex: 1, minHeight: 0 }}>
        <div data-testid="cs-left-rail" style={{ borderRight: '1px solid hsl(var(--tf-border, 220 13% 20%))', overflowY: 'auto' }}>
          <LeftRail />
        </div>

        <div data-testid="cs-center" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Breadcrumb — collapses drill on click */}
          <DrillBreadcrumb />

          <div
            id="cs-center-panel"
            data-testid="cs-drill-panel"
            data-drill-level={drillLevel}
            style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            {drillLevel === 'county' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <CountyHealthPanel />
                <div
                  data-testid="county-operational-scope-note"
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid hsl(var(--tf-border))',
                    background: 'hsl(var(--tf-bg))',
                    fontSize: 11,
                    color: 'hsl(var(--tf-muted))',
                  }}
                >
                  Cities stay overview-only here. Counties actually defend values and route action by neighborhood and reval-area segment.
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <CityRollupTable />
                </div>
              </div>
            )}
            {drillLevel === 'city'   && <NeighborhoodRollupTable />}
            {drillLevel === 'neighborhood' && (
              <>
                {/* Severity filter pills above the segment table at the neighborhood level */}
                <div
                  role="toolbar"
                  aria-label="Segment severity filter"
                  style={{
                    display: 'flex', gap: 6, padding: '8px 12px', flexShrink: 0,
                    borderBottom: '1px solid hsl(var(--tf-border))',
                  }}
                >
                  {SEGMENT_FILTER_PILLS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setSegmentFilter(p.key)}
                      data-testid={`segment-filter-${p.key}`}
                      aria-pressed={segmentFilter === p.key}
                      style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 10,
                        border: '1px solid hsl(var(--tf-border))',
                        background: segmentFilter === p.key ? 'hsl(var(--tf-surface))' : 'transparent',
                        color: segmentFilter === p.key ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                        fontWeight: segmentFilter === p.key ? 700 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <SegmentTable filter={segmentFilterFn} />
                </div>
              </>
            )}
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
