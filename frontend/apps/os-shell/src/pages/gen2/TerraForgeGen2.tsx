/**
 * TerraForge Gen2 — iframes the real CostForge native app (packages/terrabuild)
 *
 * Previously this rendered CostForgeQuantumDashboard (an imposter built in the shell).
 * Now it hosts the real terrabuild app via AppFrame.
 *
 * @module pages/gen2/TerraForgeGen2
 */

import React from 'react';
import { AppFrame } from '../../components/app-frame/AppFrame';

const TerraForgeGen2: React.FC = () => {
  return (
    <div className='w-full h-full min-h-screen'>
      <AppFrame moduleId="costforge" />
    </div>
  );
};

export default TerraForgeGen2;
