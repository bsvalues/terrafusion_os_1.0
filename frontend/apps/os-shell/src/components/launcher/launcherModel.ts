/**
 * ═══════════════════════════════════════════════════════════════
 * LAUNCHER MODEL
 * Normalized item model for the Launcher surface
 *
 * Single source of truth for launcher items - adapts from suiteRegistry.
 * ═══════════════════════════════════════════════════════════════
 */

import { NavigateFunction } from 'react-router-dom';
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
  /** Icon (emoji or icon name) */
  icon: string;
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

/**
 * Icon mapping for iconName → emoji.
 * TODO: Replace with Lucide icons in future.
 */
const ICON_MAP: Record<string, string> = {
  Hammer: '🔨',
  Globe: '🗺️',
  LayoutDashboard: '📊',
  FileStack: '📁',
  Bot: '🤖',
  Compass: '🎮',
  Activity: '🔍',
  Settings: '⚙️',
  FileText: '📄',
  HelpCircle: '❓',
};

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
    icon: '⚙️',
    intent: 'system',
    route: '/settings',
    keywords: ['settings', 'config', 'preferences', 'options'],
    a11yLabel: 'Settings - System configuration',
  },
  {
    id: 'docs',
    label: 'Documentation',
    description: 'Help & guides',
    icon: '📄',
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
      icon: ICON_MAP[suite.iconName] || '📦',
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
    icon: ICON_MAP[feature.iconName] || '📦',
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
 * Navigate to a launcher item.
 * Handles both route-based and action-based items.
 */
export function navigateToLauncherItem(item: LauncherItem, navigate: NavigateFunction): void {
  if (item.action) {
    item.action();
  } else if (item.route) {
    navigate(item.route);
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
