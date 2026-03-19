/**
 * ═══════════════════════════════════════════════════════════════
 * LAUNCHER MODEL
 * Normalized item model for the Launcher surface
 *
 * Single source of truth for launcher items - adapts from suiteRegistry.
 * ═══════════════════════════════════════════════════════════════
 */

import { NavigateFunction } from 'react-router-dom';
import type { OsActor } from '@/auth/useAuthContext';
import {
    CONSTITUTIONAL_SUITES,
    getSuiteIntent,
    getWorkbenchHrefWithContext,
    INTENT_LABELS,
    isWorkbenchSuite,
    OS_FEATURES,
    type SuiteId,
} from '../../config/suiteRegistry';
import { getCurrentParcelId } from '../../context/parcelContext';
import { executeOsAction, type OsAction, type OsActionContext } from '../../services/osActions';

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation intent for launcher items:
 * - 'workbench': Opens in Property Workbench tab (parcel-scoped)
 * - 'standalone': Opens standalone surface (cross-parcel/operational)
 * - 'system': System action (settings, docs, etc.)
 */
export type LauncherIntent = 'workbench' | 'standalone' | 'system';

/**
 * Launcher item - normalized model for all launchable items.
 * This is the contract the Launcher component expects.
 */
export interface LauncherItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Short description */
  description: string;
  /** Lucide icon name */
  iconName: string;
  /** Legacy icon field (deprecated, kept for test/backward compatibility) */
  icon?: string;
  /** Navigation intent */
  intent: LauncherIntent;
  /** Route path (for navigation) */
  route: string;
  /** Optional action function (for non-route items) */
  action?: () => void;
  /** Search keywords for filtering */
  keywords: string[];
  /** Accessible label for screen readers */
  a11yLabel: string;
  /** Optional color/brand accent */
  color?: string;
}

/**
 * Launcher section for grouping items.
 */
export interface LauncherSection {
  id: string;
  label: string;
  items: LauncherItem[];
}

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// System Actions
// ============================================================================

/**
 * System actions available in the launcher.
 * These are not suites but system-level operations.
 */
export const SYSTEM_ACTIONS: LauncherItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    description: 'System configuration',
    iconName: 'Settings',
    icon: 'Settings',
    intent: 'system',
    route: '/settings',
    keywords: ['settings', 'config', 'preferences', 'options'],
    a11yLabel: 'Settings - System configuration',
  },
  {
    id: 'docs',
    label: 'Documentation',
    description: 'Help & guides',
    iconName: 'FileText',
    icon: 'FileText',
    intent: 'system',
    route: '/docs',
    keywords: ['documentation', 'help', 'guides', 'docs'],
    a11yLabel: 'Documentation - Help & guides',
  },
];

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Get launcher items from the suite registry.
 * This adapts the constitutional registry to the launcher model.
 * Uses context-aware workbench href generation (Slice 9).
 */
export function getLauncherItems(): LauncherItem[] {
  // Get current parcel context (may be null if no parcel selected)
  const currentParcelId = getCurrentParcelId();

  const suiteItems: LauncherItem[] = CONSTITUTIONAL_SUITES.map((suite) => {
    const intent = getSuiteIntent(suite.id as SuiteId);
    const intentLabel = INTENT_LABELS[intent];

    // Use context-aware href generator (falls back to parcel selection if no context)
    let route: string;
    if (isWorkbenchSuite(suite)) {
      const hrefResult = getWorkbenchHrefWithContext(suite, currentParcelId);
      route = hrefResult.href;
    } else {
      route = suite.route;
    }

    return {
      id: suite.id,
      label: suite.displayName,
      description: suite.description,
      iconName: suite.iconName || 'Activity',
      icon: suite.iconName || 'Activity',
      intent,
      route,
      keywords: [
        suite.id,
        suite.shortName.toLowerCase(),
        suite.displayName.toLowerCase(),
        ...suite.description.toLowerCase().split(' '),
      ],
      a11yLabel: `${suite.displayName} - ${intentLabel.description}`,
      color: suite.color,
    };
  });

  const osFeatureItems: LauncherItem[] = OS_FEATURES.filter((f) => f.route).map((feature) => ({
    id: feature.id,
    label: feature.displayName,
    // Description truth: prefer homeMeta.description when available (Slice 13)
    description: feature.homeMeta?.description ?? feature.description,
    iconName: feature.iconName || 'Activity',
    icon: feature.iconName || 'Activity',
    intent: 'standalone',
    route: feature.route!,
    keywords: [
      feature.id,
      feature.shortName.toLowerCase(),
      feature.displayName.toLowerCase(),
      ...feature.description.toLowerCase().split(' '),
    ],
    a11yLabel: `${feature.displayName} - Opens standalone`,
  }));

  return [...suiteItems, ...osFeatureItems, ...SYSTEM_ACTIONS];
}

/**
 * Get launcher items grouped by section.
 */
export function getLauncherSections(): LauncherSection[] {
  const allItems = getLauncherItems();

  const sections: LauncherSection[] = [
    {
      id: 'suites',
      label: 'Suites',
      items: allItems.filter(
        (item) =>
          item.intent === 'workbench' ||
          (item.intent === 'standalone' && !['settings', 'docs'].includes(item.id))
      ),
    },
    {
      id: 'system',
      label: 'System',
      items: allItems.filter((item) => item.intent === 'system'),
    },
  ];

  return sections.filter((section) => section.items.length > 0);
}

/**
 * Filter launcher items by search query.
 */
export function filterLauncherItems(items: LauncherItem[], query: string): LauncherItem[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.keywords.some((kw) => kw.includes(lowerQuery))
  );
}

/**
 * Convert a LauncherItem to an OsAction for dispatch.
 */
export function launcherItemToOsAction(item: LauncherItem): OsAction {
  return {
    id: item.id,
    label: item.label,
    intent: item.intent,
    href: item.route,
  };
}

/**
 * Navigate to a launcher item.
 * Routes through executeOsAction for consistent telemetry.
 * Slice 16: Unified OS action dispatch.
 */
export function navigateToLauncherItem(
  item: LauncherItem,
  navigate: NavigateFunction,
  actor?: OsActor | null,  // Wave 1: optional auth
): void {
  // Legacy action items still execute directly (for backward compat)
  if (item.action) {
    item.action();
    return;
  }

  // Route items go through OS action dispatcher for telemetry
  if (item.route) {
    const action = launcherItemToOsAction(item);
    const context: OsActionContext = {
      navigate,
      suiteId: item.id,
      surface: 'launcher',
      actor: actor ?? null,
    };
    executeOsAction(action, context);
  }
}

/**
 * Get the intent badge text for a launcher item.
 */
export function getIntentBadgeText(intent: LauncherIntent): string {
  switch (intent) {
    case 'workbench':
      return 'Workbench';
    case 'standalone':
      return 'Standalone';
    case 'system':
      return 'System';
    default:
      return '';
  }
}
