import React, { useState } from 'react';
import { ObjectInspector } from './ObjectInspector';
import { CityInspector } from './CityInspector';
import { NeighborhoodInspector } from './NeighborhoodInspector';
import { ScenarioWorksheet } from './ScenarioWorksheet';
import { ScenarioCompareGrid } from './ScenarioCompareGrid';
import { AdjustmentSetPanel } from './AdjustmentSetPanel';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { describeOperationalScope, parseSegmentIdentity } from '../utils/segmentIdentity';

type RightPanel = 'inspector' | 'scenario' | 'compare' | 'governance';

const PANEL_SUMMARY: Record<RightPanel, string> = {
  inspector: 'Diagnose the active scope and route corrective action.',
  scenario: 'Draft adjustments and preview impact before saving.',
  compare: 'Compare saved scenarios side by side.',
  governance: 'Approve, publish, or roll back promoted adjustment sets.',
};

/**
 * Picks the inspector surface based on the store's drill state.
 *   - selectedSegmentId set      → ObjectInspector (segment detail)
 *   - drillLevel === 'neighborhood' → NeighborhoodInspector (rollup aggregates)
 *   - drillLevel === 'city'         → CityInspector
 *   - else (county)                 → ObjectInspector (renders its own
 *     "Select a segment" empty state, which still reads sensibly at the
 *     county level).
 */
function InspectorForScope() {
  const { drillLevel, selectedSegmentId } = useCountyStudioStore();
  if (selectedSegmentId) return <ObjectInspector />;
  if (drillLevel === 'neighborhood') return <NeighborhoodInspector />;
  if (drillLevel === 'city')         return <CityInspector />;
  return <ObjectInspector />;
}

export function RightRail() {
  const [activePanel, setActivePanel] = useState<RightPanel>('inspector');
  const {
    activeStudy,
    drillLevel,
    selectedSegmentId,
    selectedCity,
    selectedNeighborhood,
    selectedNeighborhoodRevalArea,
    scenarios,
    cohorts,
    segments,
  } = useCountyStudioStore();

  const scopeLabel = (() => {
    if (selectedSegmentId) {
      const segment = segments.find((row) => row.segmentId === selectedSegmentId);
      if (!segment) return `Segment ${selectedSegmentId}`;
       return describeOperationalScope(
          parseSegmentIdentity(segment.name, {
            neighborhoodCode: segment.geographyRef,
            revalArea: segment.revalArea,
            buildingType: segment.buildingType,
            qualityGrade: segment.qualityGrade,
          }),
        );
    }
    if (drillLevel === 'neighborhood' && selectedNeighborhood) {
      return describeOperationalScope(
        parseSegmentIdentity(selectedNeighborhood, {
          neighborhoodCode: selectedNeighborhood,
          revalArea: selectedNeighborhoodRevalArea,
        }),
      );
    }
    if (drillLevel === 'city' && selectedCity) {
      return `City ${selectedCity}`;
    }
    return activeStudy?.countyName ?? activeStudy?.countyId ?? 'No study open';
  })();

  const tab = (label: string, panel: RightPanel) => (
    <button
      onClick={() => setActivePanel(panel)}
      style={{
        flex: 1,
        padding: '6px 0',
        border: 'none',
        borderBottom: activePanel === panel ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
        background: 'transparent',
        color: activePanel === panel ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
        fontSize: 11,
        fontWeight: activePanel === panel ? 700 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        data-testid="right-rail-context"
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'hsl(var(--tf-muted))',
            }}
          >
            Current Scope
          </span>
          {activeStudy && (
            <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
              {cohorts.length} cohort{cohorts.length === 1 ? '' : 's'} · {scenarios.length} scenario{scenarios.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div data-testid="right-rail-scope-label" style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--tf-fg))' }}>
          {scopeLabel}
        </div>
        <div data-testid="right-rail-panel-summary" style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {PANEL_SUMMARY[activePanel]}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--tf-border))',
          flexShrink: 0,
        }}
      >
        {tab('Inspector', 'inspector')}
        {tab('Scenario', 'scenario')}
        {tab('Compare', 'compare')}
        {tab('Governance', 'governance')}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activePanel === 'inspector'   ? <InspectorForScope />  :
         activePanel === 'scenario'    ? <ScenarioWorksheet />   :
         activePanel === 'compare'     ? <ScenarioCompareGrid /> :
                                         <AdjustmentSetPanel />}
      </div>
    </div>
  );
}
