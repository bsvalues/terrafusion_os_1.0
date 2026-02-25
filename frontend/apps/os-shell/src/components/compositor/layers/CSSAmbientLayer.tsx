import React from 'react';

export const CSSAmbientLayer: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  // Always render base opacity to prevent flashing
  const opacity = visible ? 'opacity-100' : 'opacity-100';
  const [staticFrostMode, setStaticFrostMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportsBackdrop =
      typeof CSS !== 'undefined' && CSS.supports?.('backdrop-filter: blur(1px)');
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reduceTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    const lowPower = deviceMemory <= 4 || cores <= 4;

    // Manifesto quality gate: fall back to static frost on constrained hardware/preferences.
    setStaticFrostMode(!supportsBackdrop || lowPower || reduceMotion || reduceTransparency);
  }, []);

  return (
    <div
      data-testid='tf-ambient-layer'
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-[var(--tf-void-black)] ${opacity} transition-opacity duration-1000`}
    >
      {/* 1. Liquid shell base - stable, tinted, government-safe contrast */}
      <div
        className='absolute inset-0'
        style={{
          background: staticFrostMode
            ? 'linear-gradient(180deg, hsl(var(--tf-surface-dark-hs) 8% / 0.98), hsl(var(--tf-surface-dark-hs) 7% / 0.99))'
            : [
                'radial-gradient(circle at 16% 14%, hsl(var(--tf-network-blue-hs) 58% / 0.08), transparent 36%)',
                'radial-gradient(circle at 82% 24%, hsl(var(--tf-transcend-cyan-hs) 52% / 0.07), transparent 38%)',
                'radial-gradient(circle at 46% 86%, hsl(var(--tf-success-hs) 52% / 0.05), transparent 42%)',
                'linear-gradient(180deg, hsl(var(--tf-surface-dark-hs) 7% / 0.96), hsl(var(--tf-surface-dark-hs) 7%))',
              ].join(','),
        }}
      />

      {/* 2. Subtle mesh lattice - no giant blurred orbs */}
      {!staticFrostMode && (
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, hsl(var(--tf-text-primary-hs) 100% / 0.012) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, hsl(var(--tf-text-primary-hs) 100% / 0.01) 0 1px, transparent 1px 3px)',
            mixBlendMode: 'soft-light',
            opacity: 0.2,
          }}
        />
      )}

      {/* 3. The Texture - Noise Grain (SVG Data URI for zero network lag) */}
      {!staticFrostMode && (
        <div
          className='absolute inset-0 opacity-[0.04] pointer-events-none'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* 4. Vignette - keeps focus on stage and dock */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(circle at center, transparent 54%, hsl(var(--tf-tokens-black-hs) 0% / 0.58) 100%)',
        }}
      />
    </div>
  );
};

export default CSSAmbientLayer;
