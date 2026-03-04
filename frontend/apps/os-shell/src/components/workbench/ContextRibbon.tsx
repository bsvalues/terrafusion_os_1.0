/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — CONTEXT RIBBON
 * Phase G: Always-visible context bar for Property Workbench
 *
 * Shows: Parcel ID, situs address, owner, county name
 * Shows: Status badges (populated by BadgeProvider implementations)
 * Shows: Work Mode selector
 * Shows: Role-aware Quick Actions (tool-bound)
 *
 * Replaces/enhances the simpler ParcelContextHeader in the workbench.
 *
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Section 4
 * @see contracts/workbench.ts — Badge, BadgeProvider, QuickActionDefinition
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useMemo } from 'react';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { WorkModeSelector } from './WorkModeSelector';
import type { Badge, QuickActionDefinition, WorkMode } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

export interface ContextRibbonProps {
  /** Parcel identifier */
  parcelId: string;
  /** Situs address */
  address?: string;
  /** Property owner name */
  owner?: string;
  /** County name */
  countyName?: string;
  /** Status badges from all suite BadgeProviders */
  badges?: Badge[];
  /** Role-aware quick actions */
  quickActions?: QuickActionDefinition[];
  /** Current work mode */
  workMode: WorkMode;
  /** Work mode change callback */
  onWorkModeChange: (mode: WorkMode) => void;
  /** Quick action execution callback */
  onQuickAction?: (action: QuickActionDefinition) => void;
  /** Optional "Pop out" callback for window mode */
  onPopOut?: () => void;
  /** CC-11: Current pilot/muse mode */
  pilotMode?: 'pilot' | 'muse';
  /** CC-11: Current user role */
  userRole?: string;
  /** CC-11: Active risk level of current invocation */
  activeRisk?: 'read_only' | 'write_low' | 'write_high' | 'irreversible' | null;
  /** CC-11: Active correlationId from current/last invocation */
  activeCorrelationId?: string | null;
}

// ============================================================================
// Severity → Style Mapping
// ============================================================================

function badgeSeverityStyle(severity?: 'info' | 'warn' | 'danger') {
  switch (severity) {
    case 'danger':
      return {
        background: 'hsl(var(--tf-error) / 0.15)',
        color: 'hsl(var(--tf-error))',
        border: '1px solid hsl(var(--tf-error) / 0.3)',
      };
    case 'warn':
      return {
        background: 'hsl(var(--tf-warning) / 0.15)',
        color: 'hsl(var(--tf-warning))',
        border: '1px solid hsl(var(--tf-warning) / 0.3)',
      };
    default:
      return {
        background: 'hsl(var(--tf-accent) / 0.1)',
        color: 'hsl(var(--tf-accent))',
        border: '1px solid hsl(var(--tf-accent) / 0.2)',
      };
  }
}

// ============================================================================
// Component
// ============================================================================

// ============================================================================
// Risk Level → Style Mapping (CC-11)
// ============================================================================

function riskLevelStyle(risk?: string | null) {
  switch (risk) {
    case 'irreversible':
      return { bg: 'hsl(var(--tf-error) / 0.2)', color: 'hsl(var(--tf-error))', label: '🔴 irreversible' };
    case 'write_high':
      return { bg: 'hsl(var(--tf-warning) / 0.2)', color: 'hsl(var(--tf-warning))', label: '🟠 write_high' };
    case 'write_low':
      return { bg: 'hsl(var(--tf-accent) / 0.15)', color: 'hsl(var(--tf-accent))', label: '🟡 write_low' };
    case 'read_only':
      return { bg: 'hsl(var(--tf-success) / 0.15)', color: 'hsl(var(--tf-success, 160 60% 45%))', label: '🟢 read_only' };
    default:
      return null;
  }
}

export const ContextRibbon: React.FC<ContextRibbonProps> = ({
  parcelId,
  address,
  owner,
  countyName,
  badges = [],
  quickActions = [],
  workMode,
  onWorkModeChange,
  onQuickAction,
  onPopOut,
  pilotMode,
  userRole,
  activeRisk,
  activeCorrelationId,
}) => {
  // Filter out RESTRICTED badges (user would need higher clearance)
  const visibleBadges = useMemo(
    () => badges.filter((b) => b.classification !== 'RESTRICTED'),
    [badges]
  );

  return (
    <LiquidPanel
      variant="infrastructure"
      radius="none"
      className="px-4 py-2"
      data-testid="context-ribbon"
    >
      {/* Row 1: Parcel identity + work mode + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Parcel identity */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0">🏠</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className="text-sm font-semibold truncate"
                style={{ color: 'hsl(var(--tf-text))' }}
              >
                {parcelId}
              </h2>
              {countyName && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: 'hsl(var(--tf-bg-surface) / 0.5)',
                    color: 'hsl(var(--tf-text) / 0.5)',
                  }}
                >
                  {countyName}
                </span>
              )}
            </div>
            {(address || owner) && (
              <p
                className="text-xs truncate"
                style={{ color: 'hsl(var(--tf-text) / 0.6)' }}
              >
                {address}
                {address && owner && ' · '}
                {owner}
              </p>
            )}
          </div>
        </div>

        {/* Center: Work Mode Selector */}
        <WorkModeSelector activeMode={workMode} onModeChange={onWorkModeChange} />

        {/* Right: Quick Actions + Pop Out */}
        <div className="flex items-center gap-2">
          {quickActions.slice(0, 3).map((action) => (
            <button
              key={action.id}
              onClick={() => onQuickAction?.(action)}
              className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
              style={{
                background: 'hsl(var(--tf-accent) / 0.1)',
                color: 'hsl(var(--tf-accent))',
                border: '1px solid hsl(var(--tf-accent) / 0.2)',
              }}
              title={`Execute: ${action.label}`}
            >
              {action.label}
            </button>
          ))}
          {onPopOut && (
            <button
              onClick={onPopOut}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                color: 'hsl(var(--tf-text) / 0.6)',
                background: 'hsl(var(--tf-bg-surface) / 0.3)',
              }}
              title="Open in full screen"
            >
              ↗
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Badges (if any) */}
      {visibleBadges.length > 0 && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {visibleBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={badgeSeverityStyle(badge.severity)}
              title={badge.tooltip}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Row 3: Pilot status indicators (CC-11) */}
      {(pilotMode || userRole || activeRisk || activeCorrelationId) && (
        <div
          className="flex items-center gap-3 mt-2 flex-wrap text-xs"
          data-testid="pilot-status-row"
        >
          {/* Role badge */}
          {userRole && (
            <span
              className="px-2 py-0.5 rounded font-medium"
              style={{
                background: 'hsl(var(--tf-bg-surface) / 0.5)',
                color: 'hsl(var(--tf-text) / 0.7)',
                border: '1px solid hsl(var(--tf-text) / 0.1)',
              }}
              data-testid="role-badge"
            >
              👤 {userRole}
            </span>
          )}

          {/* Mode indicator */}
          {pilotMode && (
            <span
              className="px-2 py-0.5 rounded font-medium"
              style={{
                background: pilotMode === 'pilot'
                  ? 'hsl(var(--tf-accent) / 0.15)'
                  : 'hsl(270 60% 50% / 0.15)',
                color: pilotMode === 'pilot'
                  ? 'hsl(var(--tf-accent))'
                  : 'hsl(270 60% 65%)',
              }}
              data-testid="mode-badge"
            >
              {pilotMode === 'pilot' ? '🧭 Pilot' : '✨ Muse'}
            </span>
          )}

          {/* Risk level */}
          {activeRisk && (() => {
            const rs = riskLevelStyle(activeRisk);
            return rs ? (
              <span
                className="px-2 py-0.5 rounded font-medium"
                style={{ background: rs.bg, color: rs.color }}
                data-testid="risk-badge"
              >
                {rs.label}
              </span>
            ) : null;
          })()}

          {/* Active correlationId */}
          {activeCorrelationId && (
            <span
              className="px-2 py-0.5 rounded font-mono"
              style={{
                background: 'hsl(var(--tf-bg-surface) / 0.4)',
                color: 'hsl(var(--tf-text) / 0.5)',
              }}
              data-testid="correlation-badge"
              title={`Trace: ${activeCorrelationId}`}
            >
              🔗 {activeCorrelationId.length > 20
                ? `${activeCorrelationId.slice(0, 8)}…${activeCorrelationId.slice(-6)}`
                : activeCorrelationId}
            </span>
          )}
        </div>
      )}
    </LiquidPanel>
  );
};

export default ContextRibbon;
