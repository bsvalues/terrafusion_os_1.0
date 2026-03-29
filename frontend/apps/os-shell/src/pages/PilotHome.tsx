/**
 * TerraFusion Pilot Home
 *
 * Standalone home page for TerraPilot using the shared StandaloneHomeShell.
 * Wraps PilotConsole content in the OS-owned shell for consistent chrome.
 *
 * @module pages/PilotHome
 * @see Slice 6: Standalone Suite Homes Consistency
 */

import React from 'react';
import { StandaloneHomeShell } from '../components/standalone';
import { PilotConsoleContent } from './PilotConsoleContent';

/**
 * PilotHome - Standalone entry point for TerraPilot.
 *
 * Uses StandaloneHomeShell for consistent chrome (header, badge, actions)
 * and renders PilotConsoleContent inside the content slot.
 *
 * DATA POSTURE: Tool invocations route through POST /pilot/invoke when the
 * backend is live. The console enters an unavailable state (toolsError) when
 * the API is unreachable. No fixture data — tools are backend-sourced only.
 */
export function PilotHome(): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId='pilot'
      meta={{
        title: 'TerraPilot Console',
        description: 'AI agent copilot • actions routed through /pilot/invoke (backend required)',
        primaryActions: [
          {
            id: 'refresh',
            label: 'Refresh',
            intent: 'system',
          },
        ],
      }}
    >
      <PilotConsoleContent />
    </StandaloneHomeShell>
  );
}

export default PilotHome;
