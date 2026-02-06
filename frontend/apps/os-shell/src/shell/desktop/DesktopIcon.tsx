/**
 * TerraFusion OS Desktop Icon Component
 *
 * Individual desktop icon with hover, selection, and launch behavior.
 * Uses TerraSphereIcon for brand-consistent 3D wireframe aesthetic.
 *
 * @module shell/desktop/DesktopIcon
 * @see Priority 3: Desktop Icons
 */

import React, { useCallback } from 'react';
import type { Category } from '../../config/generatedModules';
import { getLucideIcon } from '../../config/iconMap';
import { TerraSphereIcon, type TerraSphereIconVariant } from '../../ui/brand/TerraSphereIcon';

// ============================================================================
// Types
// ============================================================================

/**
 * Wiring status badge for honest launcher UX.
 * Shows what kind of experience you're getting.
 * @see AGENTS.md - User Interface Compact
 */
export type WiringStatus =
  | 'WB'     // Opens Workbench tab (best - real MWUX)
  | 'OS'     // Native OS route (live)
  | 'WIP'    // Work in progress (placeholder)
  | 'BRIDGE' // iframe wrapper
  | 'EXT'    // External URL / other port
  | 'LEGACY'; // Deprecated / redirect

export interface DesktopIconProps {
  /** Module ID */
  id: string;
  /** Display name */
  name: string;
  /** Lucide icon name */
  iconName: string;
  /** Module category (maps to TerraSphere variant) */
  category?: Category;
  /** Wiring status for honest UX */
  wiringStatus?: WiringStatus;
  /** Whether icon is selected */
  isSelected?: boolean;
  /** Callback when icon is clicked (select) */
  onSelect?: (id: string) => void;
  /** Callback when icon is double-clicked (launch) */
  onLaunch?: (id: string) => void;
}

// Category → TerraSphereIcon variant mapping
const categoryToVariant: Record<Category, TerraSphereIconVariant> = {
  assessment: 'assessment',
  records: 'records',
  tax: 'tax',
  mapping: 'mapping',
  analytics: 'analytics',
  ai: 'ai',
  system: 'system',
};

// ============================================================================
// Component
// ============================================================================

/**
 * DesktopIcon - Single desktop icon for module launch
 *
 * Features:
 * - Hover state with background highlight
 * - Selection state with ring indicator
 * - Double-click to launch module
 * - Keyboard accessible (Enter to launch)
 * - Accessible labels
 *
 * @example
 * ```tsx
 * <DesktopIcon
 *   id="costforge"
 *   name="CostForge"
 *   icon="🏛️"
 *   isSelected={selectedId === 'costforge'}
 *   onSelect={setSelectedId}
 *   onLaunch={handleLaunch}
 * />
 * ```
 */
// Wiring status badge colors
const wiringBadgeStyles: Record<WiringStatus, { bg: string; text: string; label: string }> = {
  WB: { bg: 'bg-emerald-500/80', text: 'text-white', label: 'WB' },
  OS: { bg: 'bg-cyan-500/80', text: 'text-white', label: 'OS' },
  WIP: { bg: 'bg-amber-500/80', text: 'text-black', label: 'WIP' },
  BRIDGE: { bg: 'bg-purple-500/80', text: 'text-white', label: 'BRG' },
  EXT: { bg: 'bg-slate-500/80', text: 'text-white', label: 'EXT' },
  LEGACY: { bg: 'bg-red-500/80', text: 'text-white', label: 'OLD' },
};

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  name,
  iconName,
  category = 'system',
  wiringStatus,
  isSelected = false,
  onSelect,
  onLaunch,
}) => {
  const Icon = getLucideIcon(iconName);
  const variant = categoryToVariant[category] ?? 'default';
  const badge = wiringStatus ? wiringBadgeStyles[wiringStatus] : null;

  // Handle single click (select)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(id);
    },
    [id, onSelect]
  );

  // Handle double click (launch)
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onLaunch?.(id);
    },
    [id, onLaunch]
  );

  // Handle keyboard (Enter to launch)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onLaunch?.(id);
      }
    },
    [id, onLaunch]
  );

  return (
    <div
      data-testid={`desktop-icon-${id}`}
      role='button'
      tabIndex={0}
      aria-label={`Open ${name}`}
      aria-pressed={isSelected}
      aria-selected={isSelected}
      className={`
        flex flex-col items-center justify-center
        w-20 h-24 p-2 rounded-lg cursor-pointer
        select-none transition-all duration-150
        hover:bg-white/10
        ${isSelected ? 'bg-white/15 ring-2 ring-cyan-400/50' : ''}
      `.trim()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* TerraSphere Icon with embedded glyph */}
      <div className='mb-1 relative' aria-hidden='true'>
        <TerraSphereIcon size={48} variant={variant} glyph={<Icon className='h-4 w-4' />} />
        {/* Wiring Status Badge - honest launcher UX */}
        {badge && (
          <span
            className={`absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-bold rounded
                       ${badge.bg} ${badge.text} shadow-sm`}
            title={`Status: ${wiringStatus}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Label */}
      <span className='text-xs text-white text-center leading-tight line-clamp-2 drop-shadow-md'>
        {name}
      </span>
    </div>
  );
};

export default DesktopIcon;
