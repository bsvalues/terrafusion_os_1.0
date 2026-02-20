import React from 'react';

export const CSSAmbientLayer: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  // Always render base opacity to prevent flashing
  const opacity = visible ? 'opacity-100' : 'opacity-100';

  return (
    <div
      data-testid='tf-ambient-layer'
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-[var(--tf-void-black)] ${opacity} transition-opacity duration-1000`}
    >
      {/* 1. Deep Base - The "Night Sky" */}
      <div className='absolute inset-0 bg-gradient-to-br from-[var(--tf-surface-dark)] via-[hsl(var(--tf-surface))] to-[var(--gray-950)]' />

      {/* 2. The Mesh Orbs - CSS Blurs (Hardware Accelerated) */}
      {/* Top Left - Indigo (no animation - pulse was causing screen jank) */}
      <div className='absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none' />

      {/* Bottom Right - Teal */}
      <div className='absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none' />

      {/* Center Left - Blue Accent */}
      <div className='absolute top-[20%] left-[30%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[130px] mix-blend-screen pointer-events-none' />

      {/* 3. The Texture - Noise Grain (SVG Data URI for zero network lag) */}
      <div
        className='absolute inset-0 opacity-[0.04] pointer-events-none'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 4. Vignette - Focuses attention to the center */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{ background: 'radial-gradient(circle at center, transparent 0%, hsl(var(--tf-bg) / 0.4) 100%)' }}
      />
    </div>
  );
};

export default CSSAmbientLayer;
