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
      {/* 1. Static mesh gradient base — multiple color nodes for depth */}
      <div
        className='absolute inset-0'
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 15% 20%, hsl(var(--tf-transcend-cyan-hs) 20% / 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 70% at 85% 75%, hsl(var(--tf-network-blue-hs) 25% / 0.07) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 60% 10%, hsl(var(--tf-transcend-cyan-hs) 30% / 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 30% 85%, hsl(var(--tf-network-blue-hs) 20% / 0.06) 0%, transparent 65%)
          `,
        }}
      />

      {/* 2. Drifting aurora layer — slow breathing glow that moves */}
      <div
        className='absolute inset-0 tf-aurora-drift'
        style={{
          background: `
            radial-gradient(ellipse 80% 40% at 40% 30%, hsl(var(--tf-transcend-cyan-hs) 35% / 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 70% 65%, hsl(var(--tf-network-blue-hs) 30% / 0.08) 0%, transparent 55%)
          `,
        }}
      />

      {/* 3. Top-center highlight — the "light source" of the OS */}
      <div
        className='absolute pointer-events-none'
        style={{
          top: '-20%',
          left: '20%',
          width: '60%',
          height: '50%',
          background: 'radial-gradient(ellipse at center, hsl(var(--tf-transcend-cyan-hs) 40% / 0.12) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />

      {/* 4. Bottom accent — warm pool of depth */}
      <div
        className='absolute pointer-events-none'
        style={{
          bottom: '-15%',
          right: '5%',
          width: '50%',
          height: '40%',
          background: 'radial-gradient(ellipse at center, hsl(var(--tf-network-blue-hs) 35% / 0.09) 0%, transparent 60%)',
          filter: 'blur(70px)',
        }}
      />

      {/* 5. Left edge accent — asymmetric depth */}
      <div
        className='absolute pointer-events-none'
        style={{
          top: '40%',
          left: '-10%',
          width: '35%',
          height: '45%',
          background: 'radial-gradient(ellipse at center, hsl(var(--tf-transcend-cyan-hs) 25% / 0.06) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* 6. Noise texture — film grain for tactile depth */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* 7. Vignette — gentle edge darkening for depth focus */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'radial-gradient(ellipse 75% 65% at 50% 45%, transparent 0%, hsl(var(--tf-bg) / 0.6) 100%)',
        }}
      />

      {/* Aurora animation styles (injected once) */}
      <style>{`
        .tf-aurora-drift {
          animation: tf-aurora 30s ease-in-out infinite alternate;
        }
        @keyframes tf-aurora {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          33% { transform: translate(2%, -1.5%) scale(1.02); opacity: 0.85; }
          66% { transform: translate(-1.5%, 2%) scale(0.98); opacity: 0.95; }
          100% { transform: translate(1%, -1%) scale(1.01); opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-aurora-drift {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CSSAmbientLayer;
