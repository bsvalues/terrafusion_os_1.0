/**
 * TerraForge Gen2 - AI-Powered Cost Calculation & Valuation Modeling Suite
 *
 * This is the Gen2 version of TerraForge, rendered as an internal route
 * within the OS shell rather than as an external iframe.
 *
 * @module pages/gen2/TerraForgeGen2
 */

import React, { Suspense, lazy } from 'react';

// Lazy load the CostForge component (which is the Gen2 implementation)
const CostForgeQuantumDashboard = lazy(
  () => import('../../components/costforge/CostForgeQuantumDashboard')
);

const LoadingFallback: React.FC = () => (
  <div
    className='w-full h-full flex flex-col items-center justify-center min-h-screen'
    style={{
      background:
        'linear-gradient(135deg, hsl(var(--tf-neutral-hs) 7% / 0.98) 0%, hsl(var(--tf-neutral-hs) 11% / 0.95) 100%)',
    }}
  >
    {/* Quantum spinner */}
    <div
      className='w-16 h-16 rounded-full animate-spin'
      style={{
        border: '4px solid hsl(var(--tf-cyan-hs) 53% / 0.15)',
        borderTopColor: 'hsl(var(--tf-cyan-hs) 53%)',
        boxShadow: '0 0 40px hsl(var(--tf-cyan-hs) 53% / 0.3)',
      }}
    />
    <p className='mt-6 text-lg' style={{ color: 'hsl(var(--tf-cyan-hs) 53% / 0.8)' }}>
      Initializing TerraForge Gen2...
    </p>
    <p className='mt-2 text-sm' style={{ color: 'hsl(var(--tf-neutral-hs) 100% / 0.5)' }}>
      AI-Powered Cost Calculation & Valuation Modeling Suite
    </p>
  </div>
);

const TerraForgeGen2: React.FC = () => {
  return (
    <div className='w-full h-full min-h-screen'>
      <Suspense fallback={<LoadingFallback />}>
        <CostForgeQuantumDashboard />
      </Suspense>
    </div>
  );
};

export default TerraForgeGen2;
