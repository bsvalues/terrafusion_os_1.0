/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — WORK MODE SELECTOR
 * Phase H: Work Modes for Property Workbench
 *
 * Five modes: Overview (default), Valuation, Mapping, Admin, Case
 * Segmented control style, renders inside the Context Ribbon.
 * Mode changes emit TerraTrace mode_switched event.
 *
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Section 5
 * @see contracts/workbench.ts — WorkMode type
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback } from 'react';
import type { WorkMode } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

interface ModeOption {
  mode: WorkMode;
  label: string;
  icon: string;
}

export interface WorkModeSelectorProps {
  /** Currently active work mode */
  activeMode: WorkMode;
  /** Callback when mode changes */
  onModeChange: (mode: WorkMode) => void;
}

// ============================================================================
// Constants
// ============================================================================

const MODE_OPTIONS: readonly ModeOption[] = [
  { mode: 'overview', label: 'Overview', icon: '📊' },
  { mode: 'valuation', label: 'Valuation', icon: '💰' },
  { mode: 'mapping', label: 'Mapping', icon: '🗺️' },
  { mode: 'admin', label: 'Admin', icon: '⚙️' },
  { mode: 'case', label: 'Case', icon: '📂' },
] as const;

// ============================================================================
// Component
// ============================================================================

export const WorkModeSelector: React.FC<WorkModeSelectorProps> = ({
  activeMode,
  onModeChange,
}) => {
  const handleClick = useCallback(
    (mode: WorkMode) => {
      if (mode !== activeMode) onModeChange(mode);
    },
    [activeMode, onModeChange]
  );

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{
        background: 'hsl(var(--tf-bg-surface) / 0.5)',
        border: '1px solid hsl(var(--tf-border) / 0.15)',
      }}
      role="tablist"
      aria-label="Work mode"
      data-testid="work-mode-selector"
    >
      {MODE_OPTIONS.map((opt) => {
        const isActive = activeMode === opt.mode;
        return (
          <button
            key={opt.mode}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(opt.mode)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap"
            style={{
              background: isActive
                ? 'hsl(var(--tf-accent) / 0.15)'
                : 'transparent',
              color: isActive
                ? 'hsl(var(--tf-accent))'
                : 'hsl(var(--tf-text) / 0.5)',
              borderRight: '1px solid hsl(var(--tf-border) / 0.1)',
            }}
          >
            <span>{opt.icon}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default WorkModeSelector;
