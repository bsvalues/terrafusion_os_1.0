/**
 * TerraFusion OS - Desktop Icon Manifest (Derived)
 * ═══════════════════════════════════════════════════════════════
 *
 * SINGLE DERIVED SOURCE for desktop icons.
 * Consumes CONSTITUTIONAL_SUITES + OS_FEATURES from suiteRegistry.ts
 * so desktop icons can never drift from the governance registry.
 *
 * Phase 22: Eliminates hardcoded DESKTOP_ICONS in DesktopIconGrid.
 *
 * @see config/suiteRegistry.ts - Canonical source of truth
 */

import type { WiringStatus } from '../shell/desktop/DesktopIcon';
import type { Category } from './generatedModules';
import {
    CONSTITUTIONAL_SUITES,
    OS_FEATURES,
    type OsFeatureDefinition,
    type SuiteDefinition,
} from './suiteRegistry';

// ============================================================================
// Types
// ============================================================================

export interface DesktopIconEntry {
  /** Canonical ID from suiteRegistry (suite or OS feature) */
  id: string;
  /** Display name */
  name: string;
  /** Lucide icon name */
  iconName: string;
  /** Module category for TerraSphere variant */
  category: Category;
  /** Navigation route (workbench tab or standalone) */
  route: string;
  /** Wiring status badge for honest UX */
  wiringStatus: WiringStatus;
}

// ============================================================================
// Presentation Mapping (keyed by canonical IDs only)
// ============================================================================

/**
 * Demo parcel ID for workbench routing.
 * In production, this would come from user's recent parcels.
 */
const DEMO_PARCEL_ID = '1234567890';

/** Category mapping for suites (keyed by canonical suite ID) */
const SUITE_CATEGORY: Record<string, Category> = {
  forge: 'assessment',
  atlas: 'mapping',
  dais: 'system',
  dossier: 'records',
  gpt: 'ai',
};

/** Category mapping for OS features (keyed by canonical feature ID) */
const FEATURE_CATEGORY: Record<string, Category> = {
  pilot: 'system',
  trace: 'system',
  canon: 'system',
};

// ============================================================================
// Derivation Logic
// ============================================================================

function suiteToDesktopIcon(suite: SuiteDefinition): DesktopIconEntry {
  const tabId = suite.workbenchTarget?.tabId ?? suite.id;
  return {
    id: suite.id,
    name: suite.displayName,
    iconName: suite.iconName,
    category: SUITE_CATEGORY[suite.id] ?? 'system',
    route: `/property/${DEMO_PARCEL_ID}/${tabId}`,
    wiringStatus: 'WB',
  };
}

function featureToDesktopIcon(feature: OsFeatureDefinition): DesktopIconEntry {
  return {
    id: feature.id,
    name: feature.displayName,
    iconName: feature.iconName,
    category: FEATURE_CATEGORY[feature.id] ?? 'system',
    route: feature.route ?? `/${feature.id}`,
    wiringStatus: 'OS',
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Returns desktop icon entries derived from canonical suite registry.
 *
 * Includes:
 * - All constitutional suites with workbenchTab=true (route to Workbench)
 * - OS features with route defined (native OS routes)
 *
 * This function is the ONLY source DesktopIconGrid should consume.
 */
export function getDesktopIcons(): DesktopIconEntry[] {
  const suiteIcons = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab).map(suiteToDesktopIcon);

  const featureIcons = OS_FEATURES.filter((f) => f.route && f.status === 'live').map(
    featureToDesktopIcon
  );

  return [...suiteIcons, ...featureIcons];
}
