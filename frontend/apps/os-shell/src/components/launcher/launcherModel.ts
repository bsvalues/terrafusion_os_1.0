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
import { useDesktopStore } from '../../stores/desktopStore';
import {
    CONSTITUTIONAL_SUITES,
    getSuiteIntent,
    getWorkbenchFallbackRoute,
    getWorkbenchHref,
    INTENT_LABELS,
    isWorkbenchSuite,
    OS_FEATURES,
    type SuiteId,
} from '../../config/suiteRegistry';
import { getParcelContext } from '../../context/parcelContext';
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
 * System surfaces and actions available in the launcher.
 * These are not suites but OS-level destinations and operations.
 */
export const SYSTEM_ACTIONS: LauncherItem[] = [
  {
    id: 'counties-hub',
    label: 'Counties HUB',
    description: 'Washington assessor county workspace',
    iconName: 'Map',
    icon: 'Map',
    intent: 'system',
    route: '/counties',
    keywords: ['counties', 'county', 'washington', 'assessor', 'terraforge', 'public data'],
    a11yLabel: 'Counties HUB - Open the Washington assessor county workspace',
  },
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
 * Suite tiles always open suite homes; parcel handoff happens in-suite.
 */
export function getLauncherItems(): LauncherItem[] {
  // Slice 9: Context-aware launcher routes — read parcel context once at
  // build-time so workbench suite tiles route directly into the parcel
  // workbench when a parcel is selected, and into the parcel-search
  // fallback (anchored on the right tab) when no parcel context exists.
  const parcelContext = getParcelContext();
  const parcelId = parcelContext?.parcelId ?? null;

  const suiteItems: LauncherItem[] = CONSTITUTIONAL_SUITES.map((suite) => {
    const intent = getSuiteIntent(suite.id as SuiteId);
    const intentLabel = INTENT_LABELS[intent];

    // Workbench suites: route through parcel workbench (with context) or
    // parcel-search fallback (without context). Standalone suites keep
    // their suite-home route.
    const route = isWorkbenchSuite(suite)
      ? (parcelId ? getWorkbenchHref(suite, parcelId) : getWorkbenchFallbackRoute(suite))
      : suite.route;

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
  actor?: OsActor | null,
): void {
  // Legacy action items still execute directly (for backward compat)
  if (item.action) {
    item.action();
    return;
  }

  // Standalone suites open as floating desktop windows
  if (item.intent === 'standalone' && item.route) {
    const { openWindow } = useDesktopStore.getState();
    const suiteModuleId = `suite-${item.id}`;
    openWindow(
      suiteModuleId,
      item.label,
      item.iconName,
      { suiteId: item.id, route: item.route }
    );
    return;
  }

  // All other items (workbench, system) navigate via route
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
