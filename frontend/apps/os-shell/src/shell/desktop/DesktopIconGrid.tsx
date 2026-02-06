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
import { CONSTITUTIONAL_SUITES, OS_FEATURES } from '../../config/suiteRegistry';
import { DesktopIcon, type WiringStatus } from './DesktopIcon';

// ============================================================================
// Constants - Constitutional Suites with HONEST Wiring Status
// ============================================================================

/**
 * Demo parcel ID for workbench routing.
 * In production, this would come from user's recent parcels.
 */
const DEMO_PARCEL_ID = '1234567890';

/**
 * Desktop icon definitions from Constitutional Suite Registry.
 * Each suite routes to Workbench (real MWUX) instead of WIP suite homes.
 *
 * Wiring Status Legend:
 * - WB: Opens Workbench tab (BEST - real invokeTool flows)
 * - OS: Native OS route (live)
 * - WIP: Work in progress (placeholder page)
 */
const DESKTOP_ICONS: Array<{
  id: string;
  name: string;
  iconName: string;
  category: Category;
  route: string;
  wiringStatus: WiringStatus;
}> = [
  // Constitutional Suites → Route to Workbench tabs (real MWUX)
  {
    id: 'forge',
    name: 'TerraForge',
    iconName: 'Hammer',
    category: 'assessment',
    route: `/property/${DEMO_PARCEL_ID}/forge`, // Real invokeTool: explain_model_results
    wiringStatus: 'WB',
  },
  {
    id: 'atlas',
    name: 'TerraAtlas',
    iconName: 'Globe',
    category: 'mapping',
    route: `/property/${DEMO_PARCEL_ID}/atlas`, // Real invokeTool: query_parcel_layers
    wiringStatus: 'WB',
  },
  {
    id: 'dais',
    name: 'TerraDais',
    iconName: 'LayoutDashboard',
    category: 'system',
    route: `/property/${DEMO_PARCEL_ID}/dais`, // Real invokeTool: check_cert_status
    wiringStatus: 'WB',
  },
  {
    id: 'dossier',
    name: 'TerraDossier',
    iconName: 'FileStack',
    category: 'records',
    route: `/property/${DEMO_PARCEL_ID}/dossier`, // Real invokeTool: summarize_dossier
    wiringStatus: 'WB',
  },
  {
    id: 'gpt',
    name: 'TerraGPT',
    iconName: 'Bot',
    category: 'ai',
    route: `/property/${DEMO_PARCEL_ID}/pilot`, // Real invokeTool: registry.list_tools
    wiringStatus: 'WB',
  },
  // OS Feature: Pilot Console (full standalone route)
  {
    id: 'pilot',
    name: 'TerraPilot',
    iconName: 'Compass',
    category: 'system',
    route: '/pilot', // Native OS route (live)
    wiringStatus: 'OS',
  },
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
  const handleLaunch = useCallback(
    (id: string) => {
      const icon = DESKTOP_ICONS.find((i) => i.id === id);
      if (icon?.route) {
        navigate(icon.route);
      }
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
