/**
 * TerraFusion Pilot Home
 *
 * Renders the Muse conversational AI interface inside the os-pilot window.
 * Full-bleed — no shell chrome wrapper, portrait companion layout.
 *
 * @module pages/PilotHome
 */

import React from 'react';
import { MuseChat } from './MuseChat';

export function PilotHome(): React.ReactElement {
  // Phase 25 landmark: stable testid lets DesktopRouteLandmarkContract /
  // DesktopDeepLinkContract verify that /pilot mounts non-empty content.
  return (
    <div data-testid='pilot-console-content' style={{ width: '100%', height: '100%' }}>
      <MuseChat />
    </div>
  );
}

export default PilotHome;
