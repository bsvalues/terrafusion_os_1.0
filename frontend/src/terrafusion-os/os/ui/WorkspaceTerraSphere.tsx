/**
 * WorkspaceTerraSphere – Workspace-Aware TerraSphere Wrapper
 *
 * Connects TerraSphereStatus to real workspace activity data.
 * Handles loading and error states automatically.
 *
 * Usage:
 * - In OSHealthSummaryBar (small)
 * - In right-rail health panels (large)
 * - Anywhere else that needs workspace-specific health visualization
 *
 * @example
 * <WorkspaceTerraSphere workspaceId="home" size="small" />
 * <WorkspaceTerraSphere workspaceId="system" size="large" />
 */
import React from 'react';
import { useWorkspaceHealthSummary } from '../../core/activity/useWorkspaceHealthSummary';
import { TerraSphereStatus, type TerraSphereSize } from './TerraSphereStatus';

export interface WorkspaceTerraSphereProps {
  /** Workspace to get health data for */
  workspaceId: string;
  /** Size variant (default: 'small') */
  size?: TerraSphereSize;
  /** Test ID for testing-library queries */
  testId?: string;
}

/** Size in pixels for loading placeholder */
const SIZE_PX: Record<TerraSphereSize, number> = {
  small: 24,
  medium: 40,
  large: 80,
};

/**
 * Workspace-aware TerraSphere that auto-fetches health data.
 *
 * Automatically handles:
 * - Loading state (shimmer placeholder)
 * - Error state (fallback to nominal)
 * - Real data (passes to TerraSphereStatus)
 */
export const WorkspaceTerraSphere: React.FC<WorkspaceTerraSphereProps> = ({
  workspaceId,
  size = 'small',
  testId,
}) => {
  const { summary, loading, error } = useWorkspaceHealthSummary(workspaceId);

  const diameter = SIZE_PX[size];

  // Error fallback: show neutral sphere
  if (error) {
    return (
      <TerraSphereStatus
        level='nominal'
        incidents24h={0}
        size={size}
        testId={testId ?? 'terrasphere-status-error-fallback'}
      />
    );
  }

  // Loading state: shimmer placeholder
  if (loading) {
    return (
      <div
        data-testid={testId ?? 'terrasphere-status-loading'}
        style={{
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
          opacity: 0.6,
        }}
      />
    );
  }

  // Normal state: render real TerraSphere
  return (
    <TerraSphereStatus
      level={summary.level}
      incidents24h={summary.incidents24h}
      size={size}
      testId={testId}
    />
  );
};
