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
      background:
        'linear-gradient(135deg, hsl(var(--tf-text-primary-hs) 5% / 0.98) 0%, hsl(var(--tf-text-primary-hs) 12% / 0.95) 100%)',
    }}
  >
    {/* Quantum spinner */}
    <div
      className='w-16 h-16 rounded-full animate-spin'
      style={{
        border: '4px solid hsl(var(--tf-transcend-cyan-hs) 50% / 0.15)',
        borderTopColor: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
        boxShadow: '0 0 40px hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
      }}
    />
    <p className='mt-6 text-lg' style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.8)' }}>
      Initializing TerraDossier Gen2...
    </p>
    <p className='mt-2 text-sm' style={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.5)' }}>
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
