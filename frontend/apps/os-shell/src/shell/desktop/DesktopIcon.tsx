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

// ============================================================================
// Types
// ============================================================================

/**
 * Wiring status badge for honest launcher UX.
 * Shows what kind of experience you're getting.
 * @see AGENTS.md - User Interface Compact
 */
export type WiringStatus =
  | 'WB' // Opens Workbench tab (best - real MWUX)
  | 'OS' // Native OS route (live)
  | 'WIP' // Work in progress (placeholder)
  | 'BRIDGE' // iframe wrapper
  | 'EXT' // External URL / other port
  | 'LEGACY'; // Deprecated / redirect

export interface DesktopIconProps {
  /** Module ID */
  id: string;
  /** Display name */
  name: string;
  /** Lucide icon name */
  iconName: string;
  /** Module category (maps to tile color) */
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

// Category → tile color mapping (solid translucent tiles, not wireframe spheres)
const CATEGORY_TILE: Record<Category, { bg: string; glow: string; iconColor: string }> = {
  assessment: {
    bg: 'hsl(var(--tf-info-hs) 50% / 0.18)',
    glow: 'hsl(var(--tf-info-hs) 50% / 0.35)',
    iconColor: 'hsl(var(--tf-info-hs) 85%)',
  },
  records: {
    bg: 'hsl(var(--tf-transcend-cyan-hs) 40% / 0.18)',
    glow: 'hsl(var(--tf-transcend-cyan-hs) 40% / 0.35)',
    iconColor: 'hsl(var(--tf-transcend-cyan-hs) 80%)',
  },
  tax: {
    bg: 'hsl(var(--tf-success-hs) 42% / 0.18)',
    glow: 'hsl(var(--tf-success-hs) 42% / 0.35)',
    iconColor: 'hsl(var(--tf-success-hs) 80%)',
  },
  mapping: {
    bg: 'hsl(var(--tf-network-blue-hs) 50% / 0.18)',
    glow: 'hsl(var(--tf-network-blue-hs) 50% / 0.35)',
    iconColor: 'hsl(var(--tf-network-blue-hs) 85%)',
  },
  analytics: {
    bg: 'hsl(var(--tf-warning-hs) 45% / 0.18)',
    glow: 'hsl(var(--tf-warning-hs) 45% / 0.35)',
    iconColor: 'hsl(var(--tf-warning-hs) 80%)',
  },
  ai: {
    bg: 'hsl(var(--tf-info-hs) 55% / 0.18)',
    glow: 'hsl(var(--tf-info-hs) 55% / 0.35)',
    iconColor: 'hsl(var(--tf-info-hs) 85%)',
  },
  system: {
    bg: 'hsl(var(--tf-neutral-hs) 50% / 0.14)',
    glow: 'hsl(var(--tf-neutral-hs) 50% / 0.25)',
    iconColor: 'hsl(var(--tf-neutral-hs) 92%)',
  },
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
  const tile = CATEGORY_TILE[category] ?? CATEGORY_TILE.system;
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
        group flex flex-col items-center justify-start
        w-[96px] py-3 px-2 rounded-2xl cursor-pointer
        select-none transition-all duration-200
        ${isSelected
          ? 'bg-[hsl(var(--tf-text)/0.15)] shadow-[inset_0_0_0_1.5px_hsl(var(--tf-text)_/_0.2)]'
          : 'hover:bg-white/8'}
      `.trim()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Solid tile icon — category-colored rounded square with large glyph */}
      <div className='relative mb-2' aria-hidden='true'>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: tile.bg,
            border: `1px solid ${tile.glow}`,
            boxShadow: `0 4px 16px ${tile.glow}, inset 0 1px 0 hsl(var(--tf-text) / 0.08)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle inner highlight at top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '40%',
              background: 'linear-gradient(to bottom, hsl(var(--tf-text) / 0.06), transparent)',
              borderRadius: '14px 14px 50% 50%',
            }}
          />
          {/* Large glyph — the primary visual element */}
          <Icon
            className='h-7 w-7 relative'
            style={{
              color: tile.iconColor,
              filter: `drop-shadow(0 0 6px ${tile.glow})`,
            }}
          />
        </div>
        {/* Wiring Status Badge - subtle, only visible on hover */}
        {badge && (
          <span
            className={`absolute -top-1 -right-1 px-1 py-0.5 text-[7px] font-semibold rounded
                       ${badge.bg} ${badge.text} opacity-0 group-hover:opacity-100 transition-opacity`}
            title={`Status: ${wiringStatus}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Label — larger, bolder, with shadow for readability */}
      <span
        className='text-[13px] text-[hsl(var(--tf-text)/0.95)] text-center leading-tight line-clamp-2 font-semibold tracking-wide'
        style={{ textShadow: '0 1px 6px hsl(var(--tf-bg) / 0.9), 0 0 2px hsl(var(--tf-bg))' }}
      >
        {name}
      </span>
    </div>
  );
};

export default DesktopIcon;
