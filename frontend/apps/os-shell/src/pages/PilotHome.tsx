/**
 * TerraFusion Pilot Home
 *
 * Renders the Muse Routing Observatory (ambient lane health) above the Muse
 * conversational AI interface. Full-bleed — no shell chrome wrapper.
 *
 * @module pages/PilotHome
 */

import React from 'react';
import { MuseRouterObservatory } from '../components/pilot/MuseRouterObservatory';
import { MuseChat } from './MuseChat';

export function PilotHome(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MuseRouterObservatory />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MuseChat />
      </div>
    </div>
  );
}

export default PilotHome;
