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
  return <MuseChat />;
}

export default PilotHome;
