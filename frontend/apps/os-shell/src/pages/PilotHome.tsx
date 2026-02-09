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
 */
export function PilotHome(): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId='pilot'
      meta={{
        title: 'TerraPilot Console',
        description: 'Single Choke Point • All invocations via POST /pilot/invoke',
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
