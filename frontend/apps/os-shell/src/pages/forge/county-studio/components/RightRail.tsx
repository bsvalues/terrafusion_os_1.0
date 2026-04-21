import React, { useState } from 'react';
import { ObjectInspector } from './ObjectInspector';
import { ScenarioWorksheet } from './ScenarioWorksheet';

type RightPanel = 'inspector' | 'scenario';

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
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activePanel === 'inspector' ? <ObjectInspector /> : <ScenarioWorksheet />}
      </div>
    </div>
  );
}
