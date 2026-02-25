/**
 * TerraSphereIcon - Mini TerraSphere-based icon for desktop/launcher
 *
 * Same visual DNA as TerraSphere (3D wireframe sphere with glowing core)
 * but sized for icons with category-specific colors.
 *
 * @module ui/brand/TerraSphereIcon
 */

import React from 'react';

export type TerraSphereIconVariant =
  | 'assessment' // Indigo/purple - property valuation
  | 'records' // Cyan - document management
  | 'tax' // Emerald/green - levy/financial
  | 'mapping' // Blue - GIS/geographic
  | 'analytics' // Amber - reporting/data
  | 'ai' // Magenta/pink - AI systems
  | 'system' // White/neutral - OS utilities
  | 'default'; // Standard cyan

interface TerraSphereIconProps {
  size?: number;
  variant?: TerraSphereIconVariant;
  className?: string;
  /** Optional inner glyph (lucide icon element) */
  glyph?: React.ReactNode;
}

const VARIANT_COLORS: Record<TerraSphereIconVariant, { ring: string; core: string; glow: string }> =
  {
    assessment: {
      ring: 'hsl(var(--tf-info-hs) 72% / 0.4)',
      core: 'hsl(var(--tf-info-hs) 72%)',
      glow: 'hsl(var(--tf-info-hs) 72% / 0.6)',
    },
    records: {
      ring: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.4)',
      core: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
      glow: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.6)',
    },
    tax: {
      ring: 'hsl(var(--tf-success-hs) 52% / 0.4)',
      core: 'hsl(var(--tf-success-hs) 52%)',
      glow: 'hsl(var(--tf-success-hs) 52% / 0.6)',
    },
    mapping: {
      ring: 'hsl(var(--tf-network-blue-hs) 60% / 0.4)',
      core: 'hsl(var(--tf-network-blue-hs) 60%)',
      glow: 'hsl(var(--tf-network-blue-hs) 60% / 0.6)',
    },
    analytics: {
      ring: 'hsl(var(--tf-warning-hs) 57% / 0.4)',
      core: 'hsl(var(--tf-warning-hs) 57%)',
      glow: 'hsl(var(--tf-warning-hs) 57% / 0.6)',
    },
    ai: {
      ring: 'hsl(var(--tf-info-hs) 68% / 0.4)',
      core: 'hsl(var(--tf-info-hs) 68%)',
      glow: 'hsl(var(--tf-info-hs) 68% / 0.6)',
    },
    system: {
      ring: 'hsl(var(--tf-neutral-hs) 92% / 0.25)',
      core: 'hsl(var(--tf-neutral-hs) 92%)',
      glow: 'hsl(var(--tf-neutral-hs) 92% / 0.4)',
    },
    default: {
      ring: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
      core: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
      glow: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.5)',
    },
  };

export const TerraSphereIcon: React.FC<TerraSphereIconProps> = ({
  size = 48,
  variant = 'default',
  className = '',
  glyph,
}) => {
  const colors = VARIANT_COLORS[variant];
  const sphereSize = size * 0.85;
  const coreSize = size * 0.35;
  const ringCount = 5;

  return (
    <div
      className={`terrasphere-icon ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Sphere with rings */}
      <div
        className='terrasphere-icon-sphere'
        style={{
          width: sphereSize,
          height: sphereSize,
          position: 'relative',
          transformStyle: 'preserve-3d',
          // Animation DISABLED - was causing screen jank with many icons
          // animation: 'tsIconRotate 8s linear infinite',
          transform: 'rotateY(25deg) rotateX(15deg)',
        }}
      >
        {/* Wireframe rings */}
        {Array.from({ length: ringCount }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: `1.5px solid ${colors.ring}`,
              borderRadius: '50%',
              transformStyle: 'preserve-3d',
              transform: i < 3 ? `rotateX(${i * 35}deg)` : `rotateY(${(i - 2) * 35}deg)`,
            }}
          />
        ))}

        {/* Glowing core */}
        <div
          style={{
            position: 'absolute',
            width: coreSize,
            height: coreSize,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${colors.core} 0%, transparent 70%)`,
            borderRadius: '50%',
            boxShadow: `0 0 ${size * 0.3}px ${colors.glow}, inset 0 0 ${size * 0.15}px ${colors.glow}`,
            // Animation DISABLED - was causing screen jank with many icons
            // animation: 'tsIconPulse 3s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Optional glyph overlay */}
          {glyph && (
            <div
              style={{
                color: 'hsl(var(--tf-neutral-hs) 98% / 0.9)',
                filter: `drop-shadow(0 0 4px ${colors.core})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {glyph}
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes tsIconRotate {
          from { transform: rotateY(0deg) rotateX(15deg); }
          to { transform: rotateY(360deg) rotateX(15deg); }
        }
        
        @keyframes tsIconPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TerraSphereIcon;
