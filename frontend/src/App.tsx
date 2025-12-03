/**
 * TerraFusion OS - Tahoe Desktop Entry Point
 *
 * NEW TAHOE DESKTOP ARCHITECTURE:
 * - Desktop orchestrator with window management
 * - TerraSphere as ambient background (brand logo)
 * - EliteIcons for all functional app icons
 * - macOS-style liquid glass UI
 * - Clean desktop: NO center content on boot
 *
 * Government. Transcended. Timelessly Mac.
 */

import React from 'react';
import { Desktop } from './os/tahoe/Desktop';

const App: React.FC = () => {
  return <Desktop />;
};

export default App;
