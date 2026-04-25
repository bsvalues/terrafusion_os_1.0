import React, { useState } from 'react';
import { ObjectInspector } from './ObjectInspector';
import { CityInspector } from './CityInspector';
import { NeighborhoodInspector } from './NeighborhoodInspector';
import { ScenarioWorksheet } from './ScenarioWorksheet';
import { ScenarioCompareGrid } from './ScenarioCompareGrid';
import { AdjustmentSetPanel } from './AdjustmentSetPanel';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

type RightPanel = 'inspector' | 'scenario' | 'compare' | 'governance';

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
        style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--tf-border))',
          flexShrink: 0,
        }}
      >
        {tab('Inspector', 'inspector')}
        {tab('Scenario', 'scenario')}
        {tab('Compare', 'compare')}
        {tab('Govnc', 'governance')}
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
