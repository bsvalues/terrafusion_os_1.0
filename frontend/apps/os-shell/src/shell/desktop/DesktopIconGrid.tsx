/**
 * TerraFusion OS Desktop Icon Grid Component
 *
 * Grid layout of CONSTITUTIONAL SUITES only.
 * Legacy modules are accessible via Start Menu with [EXT] badge.
 *
 * Phase 9: Desktop now shows only constitutional suites from suiteRegistry.ts
 *
 * @module shell/desktop/DesktopIconGrid
 * @see config/suiteRegistry.ts - Single source of truth
 */

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../../config/generatedModules';
import { 
  CONSTITUTIONAL_SUITES, 
  OS_FEATURES,
  type SuiteDefinition,
  type OsFeatureDefinition,
} from '../../config/suiteRegistry';
import { DesktopIcon } from './DesktopIcon';

// ============================================================================
// Constants - Constitutional Suites ONLY
// ============================================================================

/**
 * Desktop icon definitions from Constitutional Suite Registry.
 * These are the ONLY legitimate suites per Article I.
 */
const DESKTOP_ICONS: Array<{
  id: string;
  name: string;
  iconName: string;
  category: Category;
  route: string;
  isOsFeature?: boolean;
}> = [
  // Constitutional Suites (5)
  ...CONSTITUTIONAL_SUITES.map((suite) => ({
    id: suite.id,
    name: suite.displayName,
    iconName: suite.iconName,
    category: 'assessment' as Category, // Default category for suites
    route: suite.route,
  })),
  // OS Features (Pilot, Trace)
  ...OS_FEATURES.filter(f => f.route).map((feature) => ({
    id: feature.id,
    name: feature.displayName,
    iconName: feature.iconName,
    category: 'system' as Category,
    route: feature.route!,
    isOsFeature: true,
  })),
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
 * DesktopIconGrid - Grid of CONSTITUTIONAL SUITE icons
 *
 * Features:
 * - Fixed grid layout
 * - Single icon selection
 * - Double-click to navigate to suite route
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
export const DesktopIconGrid: React.FC<DesktopIconGridProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  
  // Track selected icon
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Handle icon selection (single click)
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Handle icon launch (double click) - Navigate to suite route
  const handleLaunch = useCallback((id: string) => {
    const icon = DESKTOP_ICONS.find(i => i.id === id);
    if (icon?.route) {
      navigate(icon.route);
    }
  }, [navigate]);

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
          iconName={icon.iconName}
          category={icon.category}
          isSelected={selectedId === icon.id}
          onSelect={handleSelect}
          onLaunch={handleLaunch}
        />
      ))}
    </div>
  );
};

export default DesktopIconGrid;
