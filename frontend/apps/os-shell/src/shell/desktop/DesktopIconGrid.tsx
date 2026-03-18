/**
 * TerraFusion OS Desktop Icon Grid Component
 *
 * Grid layout of CONSTITUTIONAL SUITES + OS FEATURES.
 * Legacy modules are accessible via Start Menu with [EXT] badge.
 *
 * Phase 22: Desktop icons derived from canonical desktopManifest.ts
 * (no hardcoded icon list — single source of truth is suiteRegistry.ts)
 *
 * @module shell/desktop/DesktopIconGrid
 * @see config/desktopManifest.ts - Derived desktop icon entries
 * @see config/suiteRegistry.ts - Canonical source of truth
 */

import React, { useCallback, useState } from 'react';
import { getDesktopIcons } from '../../config/desktopManifest';
import { activateModule } from '../../orchestration/moduleActivation';
import { DesktopIcon } from './DesktopIcon';

// ============================================================================
// Derived Icons from Canonical Registry (Phase 22)
// ============================================================================

/**
 * Desktop icons derived from the canonical suite registry.
 * This is the ONLY list DesktopIconGrid should render.
 *
 * @see getDesktopIcons() — derives from CONSTITUTIONAL_SUITES + OS_FEATURES
 */
const DESKTOP_ICONS = getDesktopIcons();

// ============================================================================
// Types
// ============================================================================

export interface DesktopIconGridProps {
  /** Optional id for the container (skip-nav anchor) */
  id?: string;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DesktopIconGrid - Grid of CONSTITUTIONAL SUITE icons
 *
 * Features:
 * - Fixed grid layout
 * - Single icon selection
 * - Double-click opens module as window (suites) or navigates (OS features)
 * - Keyboard navigation
 * - Click outside to deselect
 *
 * Phase 9: Shows ONLY constitutional suites, not legacy modules.
 *
 * Layout:
 * ```
 * [Forge]  [Atlas]   [Dais]
 * [Dossier] [GPT]    [Pilot]
 * ```
 *
 * @example
 * ```tsx
 * // In Desktop.tsx
 * <DesktopIconGrid className="absolute top-4 left-4" />
 * ```
 */
export const DesktopIconGrid: React.FC<DesktopIconGridProps> = ({ id, className = '' }) => {
  // Track selected icon
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Handle icon selection (single click)
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Handle icon launch (double click) - Open suite home, OS feature, or surface.
  // Suite icons (forge, atlas, dais, dossier, gpt) open suite HOME PAGES as windows.
  // Surface icons (surface-workbench) open the Property Workbench window.
  // OS feature icons (pilot, trace, canon) open as in-shell windows via activateModule.
  const handleLaunch = useCallback(
    (id: string) => {
      // Surface: Property Workbench opens as a desktop window
      if (id === 'surface-workbench') {
        import('../../context/parcelContext').then(({ openWorkbenchWindow }) => {
          openWorkbenchWindow();
        });
        return;
      }

      // All other icons (suites + OS features) → activateModule stays in-shell.
      // activateModule normalizes aliases: 'forge' → 'suite-forge', 'pilot' → 'os-pilot', etc.
      activateModule(id, { source: 'desktop' });
    },
    []
  );

  // Handle click on grid background (deselect)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the grid, not on an icon
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  }, []);

  return (
    <div
      id={id}
      data-testid='desktop-icon-grid'
      className={`
        grid grid-cols-2 gap-2 p-3
        ${className}
      `.trim()}
      onClick={handleBackgroundClick}
    >
      {DESKTOP_ICONS.map((icon) => (
        <DesktopIcon
          key={icon.id}
          id={icon.id}
          name={icon.name}
          iconName={icon.iconName}
          category={icon.category}
          objectClass={icon.objectClass}
          wiringStatus={icon.wiringStatus}
          isSelected={selectedId === icon.id}
          onSelect={handleSelect}
          onLaunch={handleLaunch}
        />
      ))}
    </div>
  );
};

export default DesktopIconGrid;
