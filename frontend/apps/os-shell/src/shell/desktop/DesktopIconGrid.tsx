/**
 * TerraFusion OS Desktop Icon Grid Component
 *
 * Grid layout of desktop icons for quick module access.
 *
 * @module shell/desktop/DesktopIconGrid
 * @see Priority 3: Desktop Icons
 */

import React, { useCallback, useState } from 'react';
import { activateModule } from '../../orchestration/moduleActivation';
import { DesktopIcon } from './DesktopIcon';

// ============================================================================
// Constants
// ============================================================================

/**
 * Desktop icon definitions for the 7 working modules.
 * Order determines grid position (top-left to bottom-right).
 */
const DESKTOP_ICONS = [
  { id: 'costforge', name: 'CostForge', icon: '🏛️' },
  { id: 'terra-gaia', name: 'TerraGaia', icon: '🌍' },
  { id: 'atlas-ai', name: 'ATLAS', icon: '🤖' },
  { id: 'reporting', name: 'Analytics', icon: '📈' },
  { id: 'marketplace', name: 'Marketplace', icon: '🏪' },
  { id: 'counties', name: 'Counties Hub', icon: '🗺️' },
  { id: 'government-architecture', name: 'Gov Architecture', icon: '🏗️' },
];

// ============================================================================
// Types
// ============================================================================

export interface DesktopIconGridProps {
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DesktopIconGrid - Grid of desktop icons for module launch
 *
 * Features:
 * - Fixed grid layout
 * - Single icon selection
 * - Double-click to launch via activateModule()
 * - Keyboard navigation
 * - Click outside to deselect
 *
 * Layout:
 * ```
 * [CostForge]   [TerraGaia]   [ATLAS]
 * [Analytics]   [Marketplace] [Counties]
 * [Gov Arch]
 * ```
 *
 * @example
 * ```tsx
 * // In Desktop.tsx
 * <DesktopIconGrid className="absolute top-4 left-4" />
 * ```
 */
export const DesktopIconGrid: React.FC<DesktopIconGridProps> = ({ className = '' }) => {
  // Track selected icon
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Handle icon selection (single click)
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Handle icon launch (double click)
  const handleLaunch = useCallback((id: string) => {
    activateModule(id, {
      source: 'desktop',
      focusIfOpen: true,
    });
  }, []);

  // Handle click on grid background (deselect)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the grid, not on an icon
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  }, []);

  return (
    <div
      data-testid='desktop-icon-grid'
      className={`
        grid grid-cols-3 gap-2 p-4
        ${className}
      `.trim()}
      onClick={handleBackgroundClick}
    >
      {DESKTOP_ICONS.map((icon) => (
        <DesktopIcon
          key={icon.id}
          id={icon.id}
          name={icon.name}
          icon={icon.icon}
          isSelected={selectedId === icon.id}
          onSelect={handleSelect}
          onLaunch={handleLaunch}
        />
      ))}
    </div>
  );
};

export default DesktopIconGrid;
