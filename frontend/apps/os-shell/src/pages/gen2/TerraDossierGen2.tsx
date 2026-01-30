/**
 * TerraDossier Gen2 - Sovereign Document Management & Defense Packets
 *
 * This is the Gen2 version of TerraDossier, rendered as an internal route
 * within the OS shell rather than as an external iframe.
 *
 * @module pages/gen2/TerraDossierGen2
 */

import React, { Suspense, lazy } from 'react';

// Lazy load the Sovereign Dashboard component (which handles document/dossier functionality)
const SovereignDashboardWindow = lazy(() =>
  import('../../modules/dashboard/SovereignDashboardWindow').then((module) => ({
    default: module.SovereignDashboardWindow,
  }))
);

const LoadingFallback: React.FC = () => (
  <div
    className='w-full h-full flex flex-col items-center justify-center min-h-screen'
    style={{
      background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(20, 24, 36, 0.95) 100%)',
    }}
  >
    {/* Quantum spinner */}
    <div
      className='w-16 h-16 rounded-full animate-spin'
      style={{
        border: '4px solid rgba(0, 229, 255, 0.15)',
        borderTopColor: '#00E5FF',
        boxShadow: '0 0 40px rgba(0, 229, 255, 0.3)',
      }}
    />
    <p className='mt-6 text-lg' style={{ color: 'rgba(0, 229, 255, 0.8)' }}>
      Initializing TerraDossier Gen2...
    </p>
    <p className='mt-2 text-sm' style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
      Sovereign Document Management & Defense Packets
    </p>
  </div>
);

const TerraDossierGen2: React.FC = () => {
  return (
    <div className='w-full h-full min-h-screen'>
      <Suspense fallback={<LoadingFallback />}>
        <SovereignDashboardWindow />
      </Suspense>
    </div>
  );
};

export default TerraDossierGen2;
