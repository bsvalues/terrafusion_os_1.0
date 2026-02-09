/**
 * TerraFusion OS Parcel Context Indicator
 *
 * Always-visible indicator showing current parcel context state.
 * Provides one-click actions to change or clear context.
 *
 * Features:
 * - Displays "No parcel selected" when context is null
 * - Shows parcel ID + friendly label when context is set
 * - Recent parcels dropdown for quick switching (MRU)
 * - "Change" action opens parcel selection
 * - "Clear" action resets context (with trace event)
 * - Accessible: role="status", aria-live="polite"
 *
 * @module components/ParcelContext/ParcelContextIndicator
 * @see Slice 10: Parcel Context UX Surface
 * @see Slice 11: Parcel Context Enrichment
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkbenchTabId } from '../../config/suiteRegistry';
import { WORKBENCH_FALLBACK_BASE } from '../../config/suiteRegistry';
import {
    selectRecentParcel,
    useParcelContext,
    useRecentParcels,
} from '../../context/parcelContext';
import { clearParcelContextWithTrace } from '../../context/parcelContextTrace';
import {
    formatParcelLabel,
    resolveParcelLabel,
    resolveParcelLabelSync,
    type ParcelLabelData,
} from '../../context/parcelLabelResolver';

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
  /** Maximum recents to show in dropdown */
  maxRecents?: number;
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
  maxRecents = 5,
}) => {
  const context = useParcelContext();
  const recentParcels = useRecentParcels();
  const navigate = useNavigate();

  // ==========================================================================
  // State: Recents Dropdown
  // ==========================================================================

  const [recentsOpen, setRecentsOpen] = useState(false);
  const recentsRef = useRef<HTMLDivElement>(null);

  // Close recents dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentsRef.current && !recentsRef.current.contains(event.target as Node)) {
        setRecentsOpen(false);
      }
    };

    if (recentsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [recentsOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && recentsOpen) {
        setRecentsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [recentsOpen]);

  // ==========================================================================
  // State: Label Hydration
  // ==========================================================================

  const [hydratedLabel, setHydratedLabel] = useState<ParcelLabelData | null>(null);

  // Hydrate label when context changes
  useEffect(() => {
    if (!context?.parcelId) {
      setHydratedLabel(null);
      return;
    }

    // Try sync cache first
    const cached = resolveParcelLabelSync(context.parcelId);
    if (cached) {
      setHydratedLabel(cached);
      return;
    }

    // Async resolve
    let cancelled = false;
    resolveParcelLabel(context.parcelId).then((data) => {
      if (!cancelled) {
        setHydratedLabel(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [context?.parcelId]);

  // ==========================================================================
  // Derived: Display Label
  // ==========================================================================

  const displayLabel = context
    ? context.parcelName || formatParcelLabel(hydratedLabel, context.parcelId)
    : null;

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
    setRecentsOpen(false);
  };

  const handleToggleRecents = useCallback(() => {
    setRecentsOpen((prev) => !prev);
  }, []);

  const handleSelectRecent = useCallback((parcelId: string) => {
    selectRecentParcel(parcelId);
    setRecentsOpen(false);
  }, []);

  // ==========================================================================
  // Derived: Recents (excluding current)
  // ==========================================================================

  const filteredRecents = recentParcels
    .filter((id) => id !== context?.parcelId)
    .slice(0, maxRecents);

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
        ref={recentsRef}
        className={cn(
          'relative flex items-center gap-2 px-2 py-1 rounded-md',
          'bg-white/5 border border-white/10',
          'text-xs text-white/60',
          className
        )}
      >
        <span className='text-white/40'>📍</span>
        <span>No parcel selected</span>

        {/* Recents Toggle (if any recents exist) */}
        {filteredRecents.length > 0 && (
          <button
            type='button'
            onClick={handleToggleRecents}
            data-testid='parcel-recents-toggle'
            aria-expanded={recentsOpen}
            aria-haspopup='menu'
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium',
              'bg-white/10 text-white/70',
              'hover:bg-white/20 hover:text-white',
              'transition-colors'
            )}
          >
            Recent ▾
          </button>
        )}

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

        {/* Recents Dropdown */}
        {recentsOpen && filteredRecents.length > 0 && (
          <RecentsDropdown recents={filteredRecents} onSelect={handleSelectRecent} />
        )}
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
      ref={recentsRef}
      className={cn(
        'relative flex items-center gap-2 px-2 py-1 rounded-md',
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

      {/* Friendly Label (hidden in compact mode) */}
      {!compact && displayLabel && displayLabel !== context.parcelId && (
        <span data-testid='parcel-context-label' className='text-white/70 truncate max-w-[150px]'>
          {displayLabel}
        </span>
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
        {/* Recents Toggle */}
        {filteredRecents.length > 0 && (
          <button
            type='button'
            onClick={handleToggleRecents}
            data-testid='parcel-recents-toggle'
            aria-expanded={recentsOpen}
            aria-haspopup='menu'
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium',
              'bg-white/10 text-white/70',
              'hover:bg-white/20 hover:text-white',
              'transition-colors'
            )}
          >
            ▾
          </button>
        )}

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

      {/* Recents Dropdown */}
      {recentsOpen && filteredRecents.length > 0 && (
        <RecentsDropdown recents={filteredRecents} onSelect={handleSelectRecent} />
      )}
    </div>
  );
};

// ============================================================================
// RecentsDropdown Component
// ============================================================================

interface RecentsDropdownProps {
  recents: string[];
  onSelect: (parcelId: string) => void;
}

/**
 * Dropdown menu showing recent parcels.
 */
const RecentsDropdown: React.FC<RecentsDropdownProps> = ({ recents, onSelect }) => {
  return (
    <div
      data-testid='parcel-recents-dropdown'
      role='menu'
      className={cn(
        'absolute top-full left-0 mt-1 z-50',
        'min-w-[180px] py-1 rounded-md shadow-lg',
        'bg-[#1a1a2e] border border-white/10',
        'max-h-[200px] overflow-y-auto'
      )}
    >
      <div className='px-2 py-1 text-[9px] uppercase tracking-wider text-white/40 border-b border-white/10'>
        Recent Parcels
      </div>
      {recents.map((parcelId) => (
        <button
          key={parcelId}
          type='button'
          role='menuitem'
          onClick={() => onSelect(parcelId)}
          className={cn(
            'w-full px-3 py-1.5 text-left text-xs',
            'text-white/80 hover:bg-white/10',
            'transition-colors font-mono'
          )}
        >
          {parcelId}
        </button>
      ))}
    </div>
  );
};

export default ParcelContextIndicator;
