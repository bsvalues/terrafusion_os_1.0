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
    </LiquidPanel>
  );
};

export default ContextRibbon;
