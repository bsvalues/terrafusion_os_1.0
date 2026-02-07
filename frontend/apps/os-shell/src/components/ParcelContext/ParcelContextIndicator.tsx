/**
 * TerraFusion OS Parcel Context Indicator
 *
 * Always-visible indicator showing current parcel context state.
 * Provides one-click actions to change or clear context.
 *
 * Features:
 * - Displays "No parcel selected" when context is null
 * - Shows parcel ID + name when context is set
 * - "Change" action opens parcel selection
 * - "Clear" action resets context (with trace event)
 * - Accessible: role="status", aria-live="polite"
 *
 * @module components/ParcelContext/ParcelContextIndicator
 * @see Slice 10: Parcel Context UX Surface
 */

import { cn } from '@/lib/utils';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkbenchTabId } from '../../config/suiteRegistry';
import { WORKBENCH_FALLBACK_BASE } from '../../config/suiteRegistry';
import { useParcelContext } from '../../context/parcelContext';
import { clearParcelContextWithTrace } from '../../context/parcelContextTrace';

// ============================================================================
// Types
// ============================================================================

export interface ParcelContextIndicatorProps {
  /** Show source indicator (session, route, etc.) */
  showSource?: boolean;
  /** Compact mode - abbreviated display */
  compact?: boolean;
  /** Intended workbench tab (passed to selection route) */
  intendedTab?: WorkbenchTabId;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ParcelContextIndicator - Always-visible parcel context UX surface.
 *
 * Provides immediate visibility and control over the current parcel context.
 * Emits TerraTrace events on context changes for audit trail.
 *
 * @example
 * ```tsx
 * // In Taskbar system tray
 * <ParcelContextIndicator compact />
 *
 * // In standalone header with source debug
 * <ParcelContextIndicator showSource />
 * ```
 */
export const ParcelContextIndicator: React.FC<ParcelContextIndicatorProps> = ({
  showSource = false,
  compact = false,
  intendedTab,
  className,
}) => {
  const context = useParcelContext();
  const navigate = useNavigate();

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleSelectOrChange = () => {
    const route = intendedTab
      ? `${WORKBENCH_FALLBACK_BASE}?openTab=${intendedTab}`
      : WORKBENCH_FALLBACK_BASE;
    navigate(route);
  };

  const handleClear = () => {
    clearParcelContextWithTrace(context?.parcelId, 'user_action');
  };

  // ==========================================================================
  // Render: No Context State
  // ==========================================================================

  if (!context) {
    return (
      <div
        data-testid='parcel-context-indicator'
        data-compact={compact}
        role='status'
        aria-live='polite'
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded-md',
          'bg-white/5 border border-white/10',
          'text-xs text-white/60',
          className
        )}
      >
        <span className='text-white/40'>📍</span>
        <span>No parcel selected</span>
        <button
          type='button'
          onClick={handleSelectOrChange}
          className={cn(
            'ml-1 px-2 py-0.5 rounded text-[10px] font-medium',
            'bg-[var(--tf-transcend-highlight,#00e5ff)]/20',
            'text-[var(--tf-transcend-highlight,#00e5ff)]',
            'hover:bg-[var(--tf-transcend-highlight,#00e5ff)]/30',
            'transition-colors'
          )}
        >
          Select Parcel
        </button>
      </div>
    );
  }

  // ==========================================================================
  // Render: Context Set State
  // ==========================================================================

  return (
    <div
      data-testid='parcel-context-indicator'
      data-compact={compact}
      role='status'
      aria-live='polite'
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-md',
        'bg-[var(--tf-transcend-highlight,#00e5ff)]/10',
        'border border-[var(--tf-transcend-highlight,#00e5ff)]/30',
        'text-xs',
        className
      )}
    >
      {/* Parcel Icon */}
      <span className='text-[var(--tf-transcend-highlight,#00e5ff)]'>📍</span>

      {/* Parcel ID Badge */}
      <span
        data-testid='parcel-context-id'
        className={cn('font-mono font-medium', 'text-[var(--tf-transcend-highlight,#00e5ff)]')}
      >
        {context.parcelId}
      </span>

      {/* Parcel Name (hidden in compact mode) */}
      {!compact && context.parcelName && (
        <span className='text-white/70 truncate max-w-[150px]'>{context.parcelName}</span>
      )}

      {/* Source Badge (debug mode) */}
      {showSource && context.source && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider',
            'bg-white/10 text-white/50'
          )}
        >
          {context.source}
        </span>
      )}

      {/* Actions */}
      <div className='flex items-center gap-1 ml-1'>
        {/* Change Button */}
        <button
          type='button'
          onClick={handleSelectOrChange}
          className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            'bg-white/10 text-white/70',
            'hover:bg-white/20 hover:text-white',
            'transition-colors'
          )}
        >
          Change
        </button>

        {/* Clear Button */}
        <button
          type='button'
          onClick={handleClear}
          data-testid='parcel-context-clear'
          aria-label='Clear parcel context'
          className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            'bg-red-500/10 text-red-400',
            'hover:bg-red-500/20 hover:text-red-300',
            'transition-colors'
          )}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ParcelContextIndicator;
