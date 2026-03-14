/**
 * CSSAmbientLayer - Living mesh gradient background
 *
 * Rich, breathing dark mesh gradient inspired by macOS Sequoia.
 * Uses brand color nodes (cyan, blue) at visible opacities on a
 * deep government-night base. Slow aurora drift animation gives
 * the desktop a living, premium feel.
 *
 * Layers:
 * 1. Deep base - Government Night (var(--tf-bg))
 * 2. Color mesh nodes - brand cyan + blue at 6-10% opacity
 * 3. Slow aurora drift - CSS keyframe animation (motion-gated)
 * 4. Noise texture - film grain at 4% for tactile depth
 * 5. Soft vignette - gentle edge darkening
 *
 * Performance: CSS gradients are GPU-composited. No JS, no canvas.
 * Accessibility: Animation disabled via prefers-reduced-motion.
 *
 * @module components/compositor/layers/CSSAmbientLayer
 */

import React from 'react';

export const CSSAmbientLayer: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  return (
    <div
      data-testid='tf-ambient-layer'
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
      style={{ background: 'hsl(var(--tf-bg))' }}
    >
      {/* 1. Single ultra-diffuse color wash — no hotspots, no banding */}
      <div
        className='absolute inset-0'
        style={{
          background: `
            radial-gradient(ellipse 120% 100% at 40% 35%, hsl(var(--tf-transcend-cyan-hs) 12% / 0.045) 0%, transparent 60%)
          `,
        }}
      />

      {/* 2. Noise texture — fine grain for tactile depth */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* 3. Strong vignette — grounds the edges, focuses center */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'radial-gradient(ellipse 75% 65% at 50% 45%, transparent 0%, hsl(var(--tf-bg) / 0.7) 100%)',
        }}
      />
    </div>
  );
};

export default CSSAmbientLayer;
