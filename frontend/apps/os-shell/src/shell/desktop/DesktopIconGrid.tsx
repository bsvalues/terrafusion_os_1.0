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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Track selected icon
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Handle icon selection (single click)
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Handle icon launch (double click) - Open suite home or OS feature.
  // Suite icons (forge, atlas, dais, dossier, gpt) open suite HOME PAGES as windows.
  // OS feature icons (pilot, trace, canon) navigate to standalone pages.
  const handleLaunch = useCallback(
    (id: string) => {
      // Suite IDs open their full suite home inside a Desktop window
      const SUITE_IDS = new Set(['forge', 'atlas', 'dais', 'dossier', 'gpt']);
      if (SUITE_IDS.has(id)) {
        // activateModule will normalize 'forge' → 'suite-forge' via MODULE_ALIASES
        activateModule(id, { source: 'desktop' });
        return;
      }
      // OS features → navigate to their standalone page
      const icon = DESKTOP_ICONS.find((i) => i.id === id);
      if (icon?.route) navigate(icon.route);
    },
    [navigate]
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
        grid grid-cols-3 gap-3 p-3
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
