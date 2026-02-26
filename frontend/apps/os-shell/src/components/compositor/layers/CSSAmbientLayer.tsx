/**
 * CSSAmbientLayer - macOS-style mesh gradient background
 *
 * Clean, subtle dark mesh gradient inspired by macOS Tahoe.
 * No giant blurry orbs. Uses design tokens throughout.
 *
 * Layers:
 * 1. Deep base - Government Night (var(--tf-bg))
 * 2. Subtle mesh gradients - very low opacity, tight blurs
 * 3. Noise texture - film grain at 3% for depth
 * 4. Soft vignette - gentle edge darkening
 *
 * @module components/compositor/layers/CSSAmbientLayer
 */

import React from 'react';

export const CSSAmbientLayer: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  return (
    <div
      data-testid='tf-ambient-layer'
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
      style={{ background: 'var(--tf-void-black, hsl(var(--tf-bg)))' }}
    >
      {/* 1. Base gradient - subtle warm-to-cool shift across the viewport */}
      <div
        className='absolute inset-0'
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, hsl(var(--tf-bg) / 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 70%, hsl(var(--tf-bg) / 0.6) 0%, transparent 70%),
            linear-gradient(160deg, hsl(var(--tf-bg)) 0%, hsl(var(--tf-bg)) 50%, hsl(var(--tf-bg)) 100%)
          `,
        }}
      />

      {/* 2. Accent glow - very subtle, positioned top-center like macOS Sequoia */}
      <div
        className='absolute pointer-events-none'
        style={{
          top: '-15%',
          left: '25%',
          width: '50%',
          height: '45%',
          background: 'radial-gradient(ellipse at center, hsl(var(--tf-transcend-cyan-hs) 50% / 0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* 3. Secondary accent - bottom-right, complements the top glow */}
      <div
        className='absolute pointer-events-none'
        style={{
          bottom: '-10%',
          right: '10%',
          width: '40%',
          height: '35%',
          background: 'radial-gradient(ellipse at center, hsl(var(--tf-network-blue-hs) 50% / 0.03) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* 4. Noise texture - film grain for depth (3% opacity) */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* 5. Vignette - gentle edge darkening */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, hsl(var(--tf-bg) / 0.5) 100%)',
        }}
      />
    </div>
  );
};

export default CSSAmbientLayer;
