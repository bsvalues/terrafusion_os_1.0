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

export interface DesktopIconProps {
  /** Module ID */
  id: string;
  /** Display name */
  name: string;
  /** Lucide icon name */
  iconName: string;
  /** Module category (maps to TerraSphere variant) */
  category?: Category;
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
export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  name,
  iconName,
  category = 'system',
  isSelected = false,
  onSelect,
  onLaunch,
}) => {
  const Icon = getLucideIcon(iconName);
  const variant = categoryToVariant[category] ?? 'default';

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
      <div className='mb-1' aria-hidden='true'>
        <TerraSphereIcon size={48} variant={variant} glyph={<Icon className='h-4 w-4' />} />
      </div>

      {/* Label */}
      <span className='text-xs text-white text-center leading-tight line-clamp-2 drop-shadow-md'>
        {name}
      </span>
    </div>
  );
};

export default DesktopIcon;
