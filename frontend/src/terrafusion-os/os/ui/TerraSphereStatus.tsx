/**
 * TerraSphereStatus – Animated OS Health Visualizer
 *
 * Visual, animated sphere that reflects workspace/OS health status.
 * This is the signature UI element of TerraFusion OS.
 *
 * Features:
 * - Three health levels: nominal (mint), degraded (amber), critical (rose)
 * - Pulsing halo that intensifies with incidents
 * - Slow-rotating orbit ring with orbiting dot
 * - Incident count badge (medium/large sizes)
 * - Pure UI primitive – no data fetching
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 5.3 (Status Colors)
 */
import { motion } from 'framer-motion';
import React from 'react';

export type TerraSphereSize = 'small' | 'medium' | 'large';
export type TerraSphereLevel = 'nominal' | 'degraded' | 'critical';

export interface TerraSphereStatusProps {
  /** Health level (determines color) */
  level: TerraSphereLevel;
  /** Number of incidents in last 24h (affects pulse intensity) */
  incidents24h: number;
  /** Size variant */
  size?: TerraSphereSize;
  /** Test ID for testing-library queries */
  testId?: string;
}

/** Map level → base color (from WX spec status colors) */
const LEVEL_COLORS: Record<TerraSphereLevel, string> = {
  nominal: '#93E5AB', // soft mint (--os-status-nominal)
  degraded: '#F7D07A', // gentle amber (--os-status-warning)
  critical: '#F26B6B', // soft rose red (--os-status-critical)
};

/** Size in pixels */
const SIZE_PX: Record<TerraSphereSize, number> = {
  small: 24,
  medium: 40,
  large: 80,
};

/**
 * TerraSphere Status Visualizer
 *
 * @example
 * <TerraSphereStatus level="nominal" incidents24h={0} size="medium" />
 * <TerraSphereStatus level="critical" incidents24h={3} size="large" />
 */
export const TerraSphereStatus: React.FC<TerraSphereStatusProps> = ({
  level,
  incidents24h,
  size = 'medium',
  testId,
}) => {
  const diameter = SIZE_PX[size];
  const radius = diameter / 2;

  // Pulse intensity based on incidents
  const hasIncidents = incidents24h > 0;
  const pulseScale = hasIncidents ? 1.08 : 1.0;
  const pulseDuration = hasIncidents ? 1.5 : 3.0;

  const baseColor = LEVEL_COLORS[level];

  return (
    <div
      data-testid={testId ?? 'terrasphere-status'}
      data-level={level}
      style={{
        width: diameter,
        height: diameter,
        position: 'relative',
      }}
    >
      {/* Outer halo – pulsing glow */}
      <motion.div
        data-testid='terrasphere-halo'
        initial={{ opacity: 0.25, scale: 0.95 }}
        animate={{ opacity: hasIncidents ? 0.5 : 0.35, scale: pulseScale }}
        transition={{
          duration: pulseDuration,
          ease: [0.25, 0.1, 0.25, 1],
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${baseColor}33, transparent 70%)`,
        }}
      />

      {/* Core sphere – main visual */}
      <motion.div
        data-testid='terrasphere-core'
        initial={{ scale: 0.96, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.22,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 20%, #ffffffaa, transparent 50%),
            radial-gradient(circle at 70% 80%, ${baseColor}, #000000)
          `,
          boxShadow: '0px 4px 16px rgba(0,0,0,0.4), inset 0px 0px 0px 1px rgba(255,255,255,0.18)',
        }}
      />

      {/* Inner orbit ring – slow rotating */}
      <motion.div
        data-testid='terrasphere-orbit'
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 16,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `1px dashed ${baseColor}66`,
        }}
      >
        {/* Tiny orbiting dot */}
        <div
          data-testid='terrasphere-orbit-dot'
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: baseColor,
            boxShadow: `0 0 6px ${baseColor}`,
            position: 'absolute',
            top: radius - 2,
            left: diameter - 2,
          }}
        />
      </motion.div>

      {/* Incident count badge (medium/large only) */}
      {size !== 'small' && incidents24h > 0 && (
        <div
          data-testid='terrasphere-incident-badge'
          style={{
            position: 'absolute',
            right: -4,
            top: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: 'white',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          {incidents24h > 9 ? '9+' : incidents24h}
        </div>
      )}
    </div>
  );
};
