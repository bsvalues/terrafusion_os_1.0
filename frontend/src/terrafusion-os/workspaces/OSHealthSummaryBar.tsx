/**
 * OSHealthSummaryBar – Top-Level Health Status Bar
 *
 * Always-visible bar showing aggregate OS health across workspaces.
 * Displays a TerraSphere and summary text in a compact glass container.
 *
 * Features:
 * - Workspace-aware TerraSphere (small)
 * - Health status label
 * - Glass panel styling
 * - Clickable for health details (emits intent)
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 2.3
 */
import { motion } from 'framer-motion';
import React from 'react';
import { WorkspaceTerraSphere } from '../os/ui/WorkspaceTerraSphere';

export interface OSHealthSummaryBarProps {
  /** Workspace ID to show health for (default: 'system') */
  workspaceId?: string;
  /** Optional label override (default: 'System Health') */
  label?: string;
  /** Test ID for testing-library queries */
  testId?: string;
  /** Optional click handler for health details */
  onClick?: () => void;
}

/**
 * Compact health bar for placement at top of HomeWorkspace.
 *
 * @example
 * <OSHealthSummaryBar workspaceId="home" />
 * <OSHealthSummaryBar workspaceId="system" label="OS Status" onClick={handleClick} />
 */
export const OSHealthSummaryBar: React.FC<OSHealthSummaryBarProps> = ({
  workspaceId = 'system',
  label = 'System Health',
  testId,
  onClick,
}) => {
  return (
    <motion.div
      data-testid={testId ?? 'os-health-summary-bar'}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(10px) saturate(130%)',
        WebkitBackdropFilter: 'blur(10px) saturate(130%)',
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
      }}
    >
      <WorkspaceTerraSphere
        workspaceId={workspaceId}
        size='small'
        testId={`${testId ?? 'os-health-summary-bar'}-sphere`}
      />
      <span
        data-testid={`${testId ?? 'os-health-summary-bar'}-label`}
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </span>
    </motion.div>
  );
};
