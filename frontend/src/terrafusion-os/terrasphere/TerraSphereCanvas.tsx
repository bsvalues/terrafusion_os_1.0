import React from 'react';
import { useOSMode } from '../core/state/OSModeContext';

/**
 * Temporary placeholder for the TerraSphere WebGL background.
 * Safe cosmetic layer only; can be replaced later with Three.js.
 */
export const TerraSphereCanvas: React.FC = () => {
  const { mode } = useOSMode();

  return (
    <div className='absolute inset-0 -z-10 overflow-hidden pointer-events-none'>
      {/* Base gradient */}
      <div className='w-full h-full bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_55%,_#000_100%)]' />
      {/* Soft cyan glow */}
      <div className='absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-cyan-500/20 blur-3xl' />
      {/* L6 resonance ring */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-out ${mode === 'L6' ? 'opacity-60' : 'opacity-0'}`}
      >
        <img
          src='/ui/effects/interference-ring.svg'
          alt='L6 resonance ring'
          className='w-full h-full opacity-40'
        />
      </div>
      {/* L9 sacred geometry overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-out mix-blend-screen ${mode === 'L9' ? 'opacity-70' : 'opacity-0'}`}
      >
        <img
          src='/ui/effects/sacred-geometry-overlay.svg'
          alt='L9 sacred geometry overlay'
          className='w-full h-full opacity-60'
        />
      </div>
    </div>
  );
};
