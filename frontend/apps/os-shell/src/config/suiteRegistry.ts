/**
 * TerraFusion OS - Constitutional Suite Registry
 * ═══════════════════════════════════════════════════════════════
 *
 * SINGLE SOURCE OF TRUTH for what constitutes a "Suite" in TerraFusion OS.
 *
 * Per Article I of the TerraFusion Constitution:
 * - Suites are bounded-context UX surfaces with specific missions
 * - Everything else is a "module" (legacy or external)
 *
 * This registry is NOT auto-generated. Changes require governance review.
 *
 * @see AGENTS.md - Core Governance Surface
 * @see TERRAFUSION_CONSTITUTION.md - Article I: Experience Suites
 */

export type SuiteId =
  | 'forge' // TerraForge - Property Valuation & Cost Analysis
  | 'atlas' // TerraAtlas - Geographic Intelligence & Mapping
  | 'dais' // TerraDais - Workflow & Governance Dashboard
  | 'dossier' // TerraDossier - Document & Record Management
  | 'gpt'; // TerraGPT - AI Assistant & Natural Language Interface

export type OsFeatureId =
  | 'pilot' // TerraPilot - Agentic Task Orchestration
  | 'trace' // TerraTrace - Observability & Audit Trail
  | 'canon'; // TerraCanon - Integrated Development Environment

export type OsSurfaceId = 'workbench'; // Property Workbench - Primary parcel-context UX

/**
 * Canonical Workbench Tab IDs (Slice 8: Single Source of Truth)
 *
 * These are the ONLY valid tab identifiers for PropertyWorkbench.
 * Adding a new tab requires governance review.
 */
export type WorkbenchTabId =
  | 'summary' // Property Overview (default)
  | 'forge' // TerraForge - AI valuation
  | 'atlas' // TerraAtlas - GIS mapping
  | 'dais' // TerraDais - Workflow
  | 'clerk' // TerraClerk - Recording & title (R3.2)
  | 'treasury' // TerraTreasury - Tax collection (R3.3)
  | 'audit' // TerraAudit - Financial compliance (R3.4)
  | 'dossier' // TerraDossier - Documents
  | 'pilot'; // TerraPilot - Tool execution

/**
 * Workbench target configuration for suites with workbench intent.
 */
export interface WorkbenchTarget {
  /** The tab id to activate in Property Workbench */
  tabId: WorkbenchTabId;
  /** Optional route path override (defaults to tabId) */
  path?: string;
}

export interface SuiteDefinition {
  id: SuiteId;
  displayName: string;
  shortName: string;
  description: string;
  iconName: string;
  route: string;
  color: string; // Brand accent color
  status: 'live' | 'wip' | 'planned';
  workbenchTab?: boolean; // Appears as tab in Property Workbench
  /**
   * Navigation intent for tile UX:
   * - 'workbench': Opens in Property Workbench tab (parcel-scoped)
   * - 'standalone': Opens standalone suite home (cross-parcel/operational)
   *
   * Derived from workbenchTab if not explicitly set.
   */
  intent?: 'workbench' | 'standalone';
  /**
   * Workbench target configuration (Slice 8).
   * Required for suites with workbenchTab=true.
   * Defines which tab to activate in Property Workbench.
   */
  workbenchTarget?: WorkbenchTarget;
}

/**
 * Home metadata for standalone suite homes.
 * Used by StandaloneHomeShell to render consistent chrome.
 */
export interface OsFeatureHomeMeta {
  /** Page title override (defaults to displayName) */
  title?: string;
  /** Short description for the page */
  description?: string;
  /** Icon identifier */
  icon?: string;
  /** Primary actions displayed in header */
  primaryActions?: Array<{
    id: string;
    label: string;
    intent: 'workbench' | 'standalone' | 'system';
    /** Navigation target (mutually exclusive with handlerKey) */
    href?: string;
    /** Handler key for registered action (mutually exclusive with href) */
    handlerKey?: string;
    /** Whether action is currently disabled */
    disabled?: boolean;
  }>;
  /** Optional subtitle or status badge text */
  subtitle?: string;
  /** Whether to show "Open in Workbench" CTA (default true) */
  showWorkbenchCta?: boolean;
  /** Optional modules displayed in the home page (Slice 13) */
  modules?: Array<{
    id: string;
    title: string;
    kind: 'info' | 'actions' | 'metrics' | 'links';
    icon?: string;
    collapsed?: boolean;
  }>;
}

export interface OsFeatureDefinition {
  id: OsFeatureId;
  displayName: string;
  shortName: string;
  description: string;
  iconName: string;
  route?: string;
  status: 'live' | 'wip' | 'planned';
  /** Standalone home metadata (for StandaloneHomeShell) */
  homeMeta?: OsFeatureHomeMeta;
  /** Label displayed in the launcher (defaults to shortName or displayName) */
  label?: string;
  /** Icon override for standalone context */
  icon?: string;
}

export interface OsSurfaceDefinition {
  id: OsSurfaceId;
  displayName: string;
  description: string;
  iconName: string;
  route: string;
  status: 'live' | 'wip' | 'planned';
}

/**
 * Constitutional Suites - Per Article I
 * These are the ONLY things that should be labeled "Suite" in the UI.
 */
export const CONSTITUTIONAL_SUITES: readonly SuiteDefinition[] = [
  {
    id: 'forge',
    displayName: 'TerraForge',
    shortName: 'Forge',
    description: 'Property Valuation & Cost Analysis Engine',
    iconName: 'Hammer',
    route: '/forge',
    color: 'hsl(var(--tf-suite-forge))', // Forge orange
    status: 'live',
    workbenchTab: true,
    workbenchTarget: { tabId: 'forge' },
  },
  {
    id: 'atlas',
    displayName: 'TerraAtlas',
    shortName: 'Atlas',
    description: 'Geographic Intelligence & Parcel Mapping',
    iconName: 'Globe',
    route: '/atlas',
    color: 'hsl(var(--tf-suite-atlas))', // Cyan
    status: 'live',
    workbenchTab: true,
    workbenchTarget: { tabId: 'atlas' },
  },
  {
    id: 'dais',
    displayName: 'TerraDais',
    shortName: 'Dais',
    description: 'Workflow Orchestration & Governance Dashboard',
    iconName: 'LayoutDashboard',
    route: '/dais',
    color: 'hsl(var(--tf-suite-dais))', // Purple
    status: 'live',
    workbenchTab: true,
    workbenchTarget: { tabId: 'dais' },
  },
  {
    id: 'dossier',
    displayName: 'TerraDossier',
    shortName: 'Dossier',
    description: 'Document Management & Record Archive',
    iconName: 'FileStack',
    route: '/dossier',
    color: 'hsl(var(--tf-suite-dossier))', // Green
    status: 'live',
    workbenchTab: true,
    workbenchTarget: { tabId: 'dossier' },
  },
  {
    id: 'gpt',
    displayName: 'TerraGPT',
    shortName: 'GPT',
    description: 'AI Assistant & Natural Language Interface',
    iconName: 'Bot',
    route: '/gpt',
    color: 'hsl(var(--tf-suite-gpt))', // Blue
    status: 'live',
    workbenchTab: true,
    workbenchTarget: { tabId: 'pilot' }, // TerraGPT uses Pilot tab
  },
] as const;

/**
 * OS Features - System-level capabilities (not user-facing suites)
 */
export const OS_FEATURES: readonly OsFeatureDefinition[] = [
  {
    id: 'pilot',
    displayName: 'TerraPilot',
    shortName: 'Pilot',
    description: 'Agentic Task Orchestration & Execution',
    iconName: 'Compass',
    route: '/pilot',
    status: 'live',
    label: 'TerraPilot',
    icon: 'terminal',
    homeMeta: {
      title: 'TerraPilot Console',
      description: 'Invoke tools, execute operations, and view trace chains.',
      subtitle: 'Standalone',
      primaryActions: [
        {
          id: 'view-tools',
          label: 'View Tools',
          intent: 'standalone',
          href: '/pilot/api',
        },
        {
          id: 'view-dashboard',
          label: 'Dashboard',
          intent: 'standalone',
          href: '/pilot/dashboard',
        },
      ],
      showWorkbenchCta: true,
      modules: [
        {
          id: 'overview',
          title: 'Pilot Overview',
          kind: 'info',
          icon: '📋',
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          kind: 'actions',
          icon: '⚡',
        },
      ],
    },
  },
  {
    id: 'trace',
    displayName: 'TerraTrace',
    shortName: 'Trace',
    description: 'Observability, Audit Trail & Telemetry',
    iconName: 'Activity',
    route: '/trace',
    status: 'live',
    label: 'TerraTrace',
    icon: 'activity',
    homeMeta: {
      title: 'TerraTrace Console',
      description: 'Monitor system telemetry, audit trails, and observability data.',
      subtitle: 'Standalone',
      primaryActions: [
        {
          id: 'view-events',
          label: 'View Events',
          intent: 'standalone',
          href: '/trace/events',
        },
        {
          id: 'view-metrics',
          label: 'Metrics',
          intent: 'standalone',
          href: '/trace/metrics',
        },
      ],
      showWorkbenchCta: true,
      modules: [
        {
          id: 'overview',
          title: 'Trace Overview',
          kind: 'info',
          icon: '📊',
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          kind: 'actions',
          icon: '🔍',
        },
      ],
    },
  },
  {
    id: 'canon',
    displayName: 'TerraCanon',
    shortName: 'Canon',
    description: 'Integrated Development Environment',
    iconName: 'Code',
    route: '/canon',
    status: 'live',
    label: 'TerraCanon',
    icon: 'code',
    homeMeta: {
      title: 'TerraCanon IDE',
      description: 'Integrated development environment for TerraFusion OS.',
      subtitle: 'Standalone',
      primaryActions: [
        {
          id: 'new-file',
          label: 'New File',
          intent: 'standalone',
        },
      ],
      showWorkbenchCta: false,
    },
  },
] as const;

/**
 * OS Surfaces - Primary UX entry points
 */
export const OS_SURFACES: readonly OsSurfaceDefinition[] = [
  {
    id: 'workbench',
    displayName: 'Property Workbench',
    description: 'Primary parcel-context workspace with suite tabs',
    iconName: 'Building',
    route: '/property',
    status: 'live',
  },
] as const;

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

export function getSuiteById(id: SuiteId): SuiteDefinition | undefined {
  return CONSTITUTIONAL_SUITES.find((s) => s.id === id);
}

export function getOsFeatureById(id: OsFeatureId): OsFeatureDefinition | undefined {
  return OS_FEATURES.find((f) => f.id === id);
}

export function isConstitutionalSuite(id: string): id is SuiteId {
  return CONSTITUTIONAL_SUITES.some((s) => s.id === id);
}

export function isOsFeature(id: string): id is OsFeatureId {
  return OS_FEATURES.some((f) => f.id === id);
}

/**
 * Check if a module ID from generatedModules is a legacy/external module
 * (i.e., NOT a constitutional suite or OS feature)
 */
export function isLegacyModule(moduleId: string): boolean {
  return !isConstitutionalSuite(moduleId) && !isOsFeature(moduleId);
}

/**
 * Get display label for a module based on its constitutional status
 */
export function getModuleLabel(moduleId: string): 'Suite' | 'OS Feature' | 'Legacy' | 'External' {
  if (isConstitutionalSuite(moduleId)) return 'Suite';
  if (isOsFeature(moduleId)) return 'OS Feature';
  // Could distinguish legacy vs external by checking GENERATED_MODULES intent
  return 'Legacy';
}

/**
 * Get the navigation intent for a suite.
 * - 'workbench': Opens in Property Workbench tab (parcel-scoped)
 * - 'standalone': Opens standalone suite home (cross-parcel/operational)
 */
export function getSuiteIntent(suiteId: SuiteId): 'workbench' | 'standalone' {
  const suite = getSuiteById(suiteId);
  if (!suite) return 'standalone';

  // Explicit intent takes precedence
  if (suite.intent) return suite.intent;

  // Derive from workbenchTab
  return suite.workbenchTab ? 'workbench' : 'standalone';
}

/**
 * Intent label for UI display
 */
export const INTENT_LABELS: Record<
  'workbench' | 'standalone',
  { badge: string; description: string }
> = {
  workbench: {
    badge: 'Opens in Workbench',
    description: 'Opens in Property Workbench tab',
  },
  standalone: {
    badge: 'Standalone',
    description: 'Opens standalone suite home',
  },
};

// ═══════════════════════════════════════════════════════════════
// Standalone Suite Helpers (Slice 7: Registry-Driven Enforcement)
// ═══════════════════════════════════════════════════════════════

/**
 * Standalone-ready OS feature definition.
 * All required fields are guaranteed present.
 */
export interface StandaloneSuiteDefinition extends OsFeatureDefinition {
  route: string; // Non-optional route
  homeMeta: OsFeatureHomeMeta; // Non-optional homeMeta
}

/**
 * Quality-gate homeMeta: requires description and at least one action.
 * Used by Slice 12 quality gate enforcement.
 */
export interface QualifiedHomeMeta extends OsFeatureHomeMeta {
  /** Non-empty page title */
  title: string;
  /** Non-empty description (required for quality gate) */
  description: string;
  /** At least one primary action (required for quality gate) */
  primaryActions: Array<{
    id: string;
    label: string;
    intent: 'workbench' | 'standalone' | 'system';
    href?: string;
  }>;
}

/**
 * Qualified standalone suite: passes Slice 12 quality gate.
 * - Has route, homeMeta, title, description, and >= 1 primaryAction
 */
export interface QualifiedStandaloneSuiteDefinition extends OsFeatureDefinition {
  route: string;
  homeMeta: QualifiedHomeMeta;
}

/**
 * Get all OS features that are standalone-ready:
 * - Has route defined
 * - Has homeMeta defined
 * - Status is 'live'
 *
 * Used by tests and UI to iterate over standalone suites without drift.
 */
export function getStandaloneSuites(): StandaloneSuiteDefinition[] {
  return OS_FEATURES.filter(
    (f): f is StandaloneSuiteDefinition =>
      f.status === 'live' && !!f.route && !!f.homeMeta && !!f.homeMeta.title
  );
}

/**
 * Get all OS features that pass the quality gate:
 * - Has route, homeMeta, title, description, and >= 1 primaryAction
 * - Status is 'live'
 *
 * Slice 12: Quality gate enforcement. Suites not meeting this bar
 * will fail CI tests.
 */
export function getQualifiedStandaloneSuites(): QualifiedStandaloneSuiteDefinition[] {
  return OS_FEATURES.filter(
    (f): f is QualifiedStandaloneSuiteDefinition =>
      f.status === 'live' &&
      !!f.route &&
      !!f.homeMeta &&
      !!f.homeMeta.title &&
      !!f.homeMeta.description &&
      Array.isArray(f.homeMeta.primaryActions) &&
      f.homeMeta.primaryActions.length >= 1
  );
}

/**
 * Type guard: Check if an OS feature is standalone-ready.
 */
export function isStandaloneSuite(
  feature: OsFeatureDefinition
): feature is StandaloneSuiteDefinition {
  return (
    feature.status === 'live' && !!feature.route && !!feature.homeMeta && !!feature.homeMeta.title
  );
}

/**
 * Type guard: Check if an OS feature passes the quality gate.
 * Slice 12: Enforces description + actions requirement.
 */
export function isQualifiedStandaloneSuite(
  feature: OsFeatureDefinition
): feature is QualifiedStandaloneSuiteDefinition {
  return (
    feature.status === 'live' &&
    !!feature.route &&
    !!feature.homeMeta &&
    !!feature.homeMeta.title &&
    !!feature.homeMeta.description &&
    Array.isArray(feature.homeMeta.primaryActions) &&
    feature.homeMeta.primaryActions.length >= 1
  );
}

/**
 * Validate primary action type safety.
 * Returns true if action has valid intent.
 */
export function isValidPrimaryAction(
  action: NonNullable<OsFeatureHomeMeta['primaryActions']>[0]
): boolean {
  const validIntents = ['workbench', 'standalone', 'system'];
  return validIntents.includes(action.intent) && !!action.id && !!action.label;
}

// ═══════════════════════════════════════════════════════════════
// Workbench Suite Helpers (Slice 8: Registry-Driven Enforcement)
// ═══════════════════════════════════════════════════════════════

/**
 * Valid workbench tab ids (mirrored from PropertyWorkbench).
 * This is the canonical list - PropertyWorkbench should use this.
 */
export const VALID_WORKBENCH_TAB_IDS: readonly WorkbenchTabId[] = [
  'summary',
  'forge',
  'atlas',
  'dais',
  'clerk',
  'treasury',
  'audit',
  'dossier',
  'pilot',
] as const;

/**
 * Workbench-ready suite definition.
 * All required fields are guaranteed present.
 */
export interface WorkbenchSuiteDefinition extends SuiteDefinition {
  workbenchTab: true;
  workbenchTarget: WorkbenchTarget;
}

/**
 * Get all suites that are workbench-ready:
 * - Has workbenchTab=true
 * - Has workbenchTarget defined
 *
 * Used by tests and UI to iterate over workbench suites without drift.
 */
export function getWorkbenchSuites(): WorkbenchSuiteDefinition[] {
  return CONSTITUTIONAL_SUITES.filter(
    (s): s is WorkbenchSuiteDefinition => s.workbenchTab === true && !!s.workbenchTarget
  );
}

/**
 * Type guard: Check if a suite is workbench-ready.
 */
export function isWorkbenchSuite(suite: SuiteDefinition): suite is WorkbenchSuiteDefinition {
  return suite.workbenchTab === true && !!suite.workbenchTarget;
}

/**
 * Validate workbench target type safety.
 * Returns true if target has valid tabId.
 */
export function isValidWorkbenchTarget(target: WorkbenchTarget): boolean {
  return VALID_WORKBENCH_TAB_IDS.includes(target.tabId);
}

/**
 * Generate canonical workbench href from suite and parcel.
 * This is the SINGLE place where workbench routes are constructed.
 *
 * @param suite - The workbench suite definition
 * @param parcelId - The parcel identifier
 * @returns The canonical workbench route
 */
export function getWorkbenchHref(suite: WorkbenchSuiteDefinition, parcelId: string): string {
  const tabPath = suite.workbenchTarget.path ?? suite.workbenchTarget.tabId;
  return `/property/${parcelId}/${tabPath}`;
}

/**
 * Generate workbench href from suite ID and parcel.
 * Convenience wrapper for getWorkbenchHref.
 *
 * @param suiteId - The suite identifier
 * @param parcelId - The parcel identifier
 * @returns The canonical workbench route, or null if not a workbench suite
 */
export function getWorkbenchHrefById(suiteId: SuiteId, parcelId: string): string | null {
  const suite = getSuiteById(suiteId);
  if (!suite || !isWorkbenchSuite(suite)) return null;
  return getWorkbenchHref(suite, parcelId);
}

// ============================================================================
// Context-Aware Workbench Navigation (Slice 9)
// ============================================================================

/**
 * Fallback route prefix for workbench when no parcel context exists.
 * Format: /property/search?openTab=<tabId>
 */
export const WORKBENCH_FALLBACK_BASE = '/property/search';

/**
 * Generate fallback workbench route when parcel context is absent.
 * Preserves tab intent via query param so parcel selection can redirect correctly.
 *
 * @param suite - The workbench suite definition
 * @returns Fallback route with preserved tab intent
 */
export function getWorkbenchFallbackRoute(suite: WorkbenchSuiteDefinition): string {
  const tabId = suite.workbenchTarget.tabId;
  return `${WORKBENCH_FALLBACK_BASE}?openTab=${tabId}`;
}

/**
 * Generate fallback workbench route by suite ID.
 *
 * @param suiteId - The suite identifier
 * @returns Fallback route, or null if not a workbench suite
 */
export function getWorkbenchFallbackById(suiteId: SuiteId): string | null {
  const suite = getSuiteById(suiteId);
  if (!suite || !isWorkbenchSuite(suite)) return null;
  return getWorkbenchFallbackRoute(suite);
}

/**
 * Result of context-aware workbench href generation.
 */
export interface WorkbenchHrefResult {
  /** The generated href */
  href: string;
  /** Whether a real parcel context was used */
  hasParcelContext: boolean;
  /** The parcel ID used (if any) */
  parcelId: string | null;
  /** Whether this routes to fallback (parcel selection) */
  isFallback: boolean;
}

/**
 * Generate context-aware workbench href.
 *
 * If parcel context exists: `/property/<parcelId>/<tab>`
 * If not: `/property/search?openTab=<tabId>` (fallback to parcel selection)
 *
 * @param suite - The workbench suite definition
 * @param parcelId - Optional parcel ID (if null, generates fallback)
 * @returns WorkbenchHrefResult with href and context info
 */
export function getWorkbenchHrefWithContext(
  suite: WorkbenchSuiteDefinition,
  parcelId: string | null
): WorkbenchHrefResult {
  if (parcelId) {
    return {
      href: getWorkbenchHref(suite, parcelId),
      hasParcelContext: true,
      parcelId,
      isFallback: false,
    };
  }

  return {
    href: getWorkbenchFallbackRoute(suite),
    hasParcelContext: false,
    parcelId: null,
    isFallback: true,
  };
}

/**
 * Generate context-aware workbench href by suite ID.
 *
 * @param suiteId - The suite identifier
 * @param parcelId - Optional parcel ID
 * @returns WorkbenchHrefResult, or null if not a workbench suite
 */
export function getWorkbenchHrefByIdWithContext(
  suiteId: SuiteId,
  parcelId: string | null
): WorkbenchHrefResult | null {
  const suite = getSuiteById(suiteId);
  if (!suite || !isWorkbenchSuite(suite)) return null;
  return getWorkbenchHrefWithContext(suite, parcelId);
}
