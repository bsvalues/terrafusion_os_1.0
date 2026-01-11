/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE TERRAFUSION ICON SYSTEM
 * Advanced Icon Management with Quantum-Themed Excellence
 * Resolves React/TypeScript version conflicts with elite precision
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import React from 'react';

// Elite Icon Component Interface
interface EliteIconProps {
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  glow?: boolean;
}

// Advanced SVG Icon Components - Elite PhD-Level Implementation
export const EliteActivityIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4'
    />
  </svg>
);

export const EliteBrainIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
  glow = false,
}) => (
  <svg
    className={cn(className, glow && 'drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]')}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10z' />
    <path d='M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4' />
    <path d='M8 8v2M16 8v2' />
    <circle cx='9' cy='15' r='1' />
    <circle cx='15' cy='15' r='1' />
    <path d='M9 17c1 1 3 1 6 0' />
  </svg>
);

export const EliteCpuIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect x='4' y='4' width='16' height='16' rx='2' />
    <rect x='9' y='9' width='6' height='6' />
    <path d='m9 1 0 3' />
    <path d='m15 1 0 3' />
    <path d='m9 20 0 3' />
    <path d='m15 20 0 3' />
    <path d='m20 9 3 0' />
    <path d='m20 14 3 0' />
    <path d='m1 9 3 0' />
    <path d='m1 14 3 0' />
  </svg>
);

export const EliteDatabaseIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <ellipse cx='12' cy='5' rx='9' ry='3' />
    <path d='M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5' />
    <path d='M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3' />
  </svg>
);

export const EliteGaugeIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12 2v4' />
    <path d='m16.2 7.8 2.9-2.9' />
    <path d='M18 12h4' />
    <path d='m16.2 16.2 2.9 2.9' />
    <path d='M12 18v4' />
    <path d='m4.9 19.1 2.9-2.9' />
    <path d='M2 12h4' />
    <path d='m4.9 4.9 2.9 2.9' />
    <circle cx='12' cy='12' r='3' />
  </svg>
);

export const EliteHardDriveIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <line x1='22' x2='2' y1='12' y2='12' />
    <path d='M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' />
    <line x1='6' x2='6.01' y1='16' y2='16' />
    <line x1='10' x2='10.01' y1='16' y2='16' />
  </svg>
);

export const EliteLayersIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z' />
    <path d='m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' />
    <path d='m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' />
  </svg>
);

export const EliteLockIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
    <path d='M7 11V7a5 5 0 0 1 10 0v4' />
  </svg>
);

export const EliteMemoryStickIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M6 19v-3' />
    <path d='M10 19v-3' />
    <path d='M14 19v-3' />
    <path d='M18 19v-3' />
    <path d='M8 11V9' />
    <path d='M16 11V9' />
    <path d='M12 11V9' />
    <path d='M2 15h20' />
    <path d='M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.063a2 2 0 0 0 0-3.837Z' />
  </svg>
);

export const EliteMonitorIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect width='20' height='14' x='2' y='3' rx='2' />
    <line x1='8' x2='16' y1='21' y2='21' />
    <line x1='12' x2='12' y1='17' y2='21' />
  </svg>
);

export const EliteNetworkIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect x='16' y='16' width='6' height='6' rx='1' />
    <rect x='2' y='16' width='6' height='6' rx='1' />
    <rect x='9' y='2' width='6' height='6' rx='1' />
    <path d='M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3' />
    <path d='M12 12V8' />
  </svg>
);

export const EliteServerIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect width='20' height='8' x='2' y='2' rx='2' ry='2' />
    <rect width='20' height='8' x='2' y='14' rx='2' ry='2' />
    <line x1='6' x2='6.01' y1='6' y2='6' />
    <line x1='6' x2='6.01' y1='18' y2='18' />
  </svg>
);

export const EliteShieldIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' />
  </svg>
);

export const EliteSettingsIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
    <circle cx='12' cy='12' r='3' />
  </svg>
);

export const EliteZapIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='m13 2-3 7h4l-3 11 7-7h-4l3-11z' />
  </svg>
);

export const EliteCloudIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
}) => (
  <svg
    className={className}
    fill='none'
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' />
  </svg>
);

// Elite Icon Export Object for Easy Access
export const EliteIcons = {
  Activity: EliteActivityIcon,
  Brain: EliteBrainIcon,
  Cloud: EliteCloudIcon,
  Cpu: EliteCpuIcon,
  Database: EliteDatabaseIcon,
  Gauge: EliteGaugeIcon,
  HardDrive: EliteHardDriveIcon,
  Layers: EliteLayersIcon,
  Lock: EliteLockIcon,
  MemoryStick: EliteMemoryStickIcon,
  Monitor: EliteMonitorIcon,
  Network: EliteNetworkIcon,
  Server: EliteServerIcon,
  Settings: EliteSettingsIcon,
  Shield: EliteShieldIcon,
  Zap: EliteZapIcon,
};

// Elite Icon with Quantum Glow Effect
export const EliteQuantumIcon: React.FC<
  EliteIconProps & {
    iconType: keyof typeof EliteIcons;
    glowIntensity?: 'low' | 'medium' | 'high';
  }
> = ({
  iconType,
  className = 'w-6 h-6',
  color = 'var(--tf-transcend-cyan)',
  glowIntensity = 'medium',
  ...props
}) => {
  const IconComponent = EliteIcons[iconType];

  const glowStyles = {
    low: 'drop-shadow-sm',
    medium: 'drop-shadow-md filter',
    high: 'drop-shadow-lg filter',
  };

  return (
    <div
      className={`${glowStyles[glowIntensity]} hover:scale-110 transition-transform duration-200`}
    >
      <IconComponent className={`${className} text-terra-cyan`} color={color} {...props} />
    </div>
  );
};

export default EliteIcons;

// Memory Icon for RAM Usage
export const EliteMemoryIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
  glow = false,
}) => (
  <svg
    className={cn(className, glow && 'drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]')}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <rect x='3' y='7' width='18' height='10' rx='2' />
    <path d='M7 11v2M12 11v2M17 11v2' />
    <path d='M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2' />
    <path d='M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2' />
  </svg>
);

// Trending Up Icon for Performance
export const EliteTrendingIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
  glow = false,
}) => (
  <svg
    className={cn(className, glow && 'drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]')}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <polyline points='23 6 13.5 15.5 8.5 10.5 1 18' />
    <polyline points='17 6 23 6 23 12' />
  </svg>
);

// Minimize Icon for Collapse
export const EliteMinimizeIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
  glow = false,
}) => (
  <svg
    className={cn(className, glow && 'drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]')}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3' />
  </svg>
);

// Maximize Icon for Expand
export const EliteMaximizeIcon: React.FC<EliteIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 2,
  glow = false,
}) => (
  <svg
    className={cn(className, glow && 'drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]')}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M3 3h6v6M21 3h-6v6M21 21h-6v-6M3 21h6v-6' />
  </svg>
);
