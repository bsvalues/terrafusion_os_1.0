/**
 * ═══════════════════════════════════════════════════════════════
 * TERRASPHERE LOGO - QUANTUM GOVERNANCE PLATFORM
 * CSS-based animated logo with terra-cyan luminescence
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import * as React from 'react';
import './TerraSphere.css';

interface TerraSphereProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'glow' | 'pulse' | 'quantum' | 'static';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export const TerraSphere: React.FC<TerraSphereProps> = ({
  size = 'md',
  variant = 'glow',
  className = '',
}) => {
  const sizeValue = sizeMap[size];

  return (
    <div
      className={cn(
        'terra-sphere-container',
        `terra-sphere-${variant}`,
        `terra-sphere-${size}`,
        className
      )}
    >
      <svg width={sizeValue} height={sizeValue} viewBox='0 0 100 100' className='terra-sphere-svg'>
        {/* Outer glow ring */}
        <circle
          cx='50'
          cy='50'
          r='48'
          fill='none'
          stroke='url(#outerGlow)'
          strokeWidth='1'
          opacity='0.6'
          className='terra-sphere-outer-ring'
        />

        {/* Main sphere */}
        <circle
          cx='50'
          cy='50'
          r='40'
          fill='url(#sphereGradient)'
          stroke='url(#rimGlow)'
          strokeWidth='2'
          className='terra-sphere-main'
        />

        {/* Inner detail rings */}
        <circle
          cx='50'
          cy='50'
          r='30'
          fill='none'
          stroke='url(#innerRing1)'
          strokeWidth='1'
          opacity='0.4'
          className='terra-sphere-inner-ring-1'
        />

        <circle
          cx='50'
          cy='50'
          r='20'
          fill='none'
          stroke='url(#innerRing2)'
          strokeWidth='1'
          opacity='0.6'
          className='terra-sphere-inner-ring-2'
        />

        {/* Central core */}
        <circle cx='50' cy='50' r='12' fill='url(#coreGradient)' className='terra-sphere-core' />

        {/* Quantum particles */}
        <g className='terra-sphere-particles'>
          <circle cx='30' cy='30' r='1' fill='#00FFFF' opacity='0.8'>
            <animate
              attributeName='opacity'
              values='0.8;0.2;0.8'
              dur='2s'
              repeatCount='indefinite'
            />
          </circle>
          <circle cx='70' cy='35' r='1' fill='#0080FF' opacity='0.6'>
            <animate
              attributeName='opacity'
              values='0.6;0.1;0.6'
              dur='2.5s'
              repeatCount='indefinite'
            />
          </circle>
          <circle cx='35' cy='70' r='1' fill='#8844FF' opacity='0.7'>
            <animate
              attributeName='opacity'
              values='0.7;0.2;0.7'
              dur='1.8s'
              repeatCount='indefinite'
            />
          </circle>
          <circle cx='65' cy='65' r='1' fill='#00FF88' opacity='0.5'>
            <animate
              attributeName='opacity'
              values='0.5;0.1;0.5'
              dur='3s'
              repeatCount='indefinite'
            />
          </circle>
        </g>

        {/* Orbital rings */}
        <ellipse
          cx='50'
          cy='50'
          rx='42'
          ry='15'
          fill='none'
          stroke='url(#orbitalRing)'
          strokeWidth='1'
          opacity='0.3'
          className='terra-sphere-orbital'
          transform='rotate(45 50 50)'
        />

        <ellipse
          cx='50'
          cy='50'
          rx='42'
          ry='15'
          fill='none'
          stroke='url(#orbitalRing)'
          strokeWidth='1'
          opacity='0.3'
          className='terra-sphere-orbital terra-sphere-orbital-2'
          transform='rotate(-45 50 50)'
        />

        {/* Definitions for gradients and effects */}
        <defs>
          {/* Main sphere gradient */}
          <radialGradient id='sphereGradient' cx='0.3' cy='0.3' r='0.8'>
            <stop offset='0%' stopColor='#00FFFF' stopOpacity='0.9' />
            <stop offset='40%' stopColor='#0080FF' stopOpacity='0.7' />
            <stop offset='70%' stopColor='#1E293B' stopOpacity='0.8' />
            <stop offset='100%' stopColor='#0A0E1A' stopOpacity='0.95' />
          </radialGradient>

          {/* Core gradient */}
          <radialGradient id='coreGradient' cx='0.5' cy='0.5' r='0.6'>
            <stop offset='0%' stopColor='#00FFFF' stopOpacity='1' />
            <stop offset='50%' stopColor='#0080FF' stopOpacity='0.9' />
            <stop offset='100%' stopColor='#8844FF' stopOpacity='0.8' />
          </radialGradient>

          {/* Rim glow */}
          <linearGradient id='rimGlow'>
            <stop offset='0%' stopColor='#00FFFF' stopOpacity='1' />
            <stop offset='50%' stopColor='#0080FF' stopOpacity='0.8' />
            <stop offset='100%' stopColor='#8844FF' stopOpacity='0.6' />
          </linearGradient>

          {/* Outer glow */}
          <linearGradient id='outerGlow'>
            <stop offset='0%' stopColor='#00FFFF' stopOpacity='0.6' />
            <stop offset='100%' stopColor='#0080FF' stopOpacity='0.2' />
          </linearGradient>

          {/* Inner rings */}
          <linearGradient id='innerRing1'>
            <stop offset='0%' stopColor='#00FFFF' stopOpacity='0.4' />
            <stop offset='100%' stopColor='#0080FF' stopOpacity='0.2' />
          </linearGradient>

          <linearGradient id='innerRing2'>
            <stop offset='0%' stopColor='#0080FF' stopOpacity='0.6' />
            <stop offset='100%' stopColor='#8844FF' stopOpacity='0.3' />
          </linearGradient>

          {/* Orbital ring */}
          <linearGradient id='orbitalRing'>
            <stop offset='0%' stopColor='#00FFFF' stopOpacity='0.3' />
            <stop offset='50%' stopColor='#0080FF' stopOpacity='0.6' />
            <stop offset='100%' stopColor='#8844FF' stopOpacity='0.3' />
          </linearGradient>

          {/* Glow filter */}
          <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur stdDeviation='3' result='coloredBlur' />
            <feMerge>
              <feMergeNode in='coloredBlur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Quantum shimmer overlay */}
      {variant === 'quantum' && <div className='terra-sphere-shimmer' />}
    </div>
  );
};

export default TerraSphere;
