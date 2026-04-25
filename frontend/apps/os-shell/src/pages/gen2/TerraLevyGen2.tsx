/**
 * TerraLevy Gen2 — mounts the native TerraLevyDashboard inside the OS shell.
 *
 * The service-registry entry for terra-levy points at http://localhost:5177/
 * (a standalone Vite app that does not yet exist). Until that app ships,
 * this route renders the React component directly so the live-data tab
 * ("Districts & Rates") is reachable against the real backend.
 *
 * @module pages/gen2/TerraLevyGen2
 */

import React from 'react';
import TerraLevyDashboard from '../../applications/terra-levy/TerraLevyDashboard';

const TerraLevyGen2: React.FC = () => {
  return (
    <div className='w-full h-full min-h-screen'>
      <TerraLevyDashboard />
    </div>
  );
};

export default TerraLevyGen2;
