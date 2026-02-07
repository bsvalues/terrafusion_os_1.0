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
  | 'trace'; // TerraTrace - Observability & Audit Trail

export type OsSurfaceId = 'workbench'; // Property Workbench - Primary parcel-context UX

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
}

export interface OsFeatureDefinition {
  id: OsFeatureId;
  displayName: string;
  shortName: string;
  description: string;
  iconName: string;
  route?: string;
  status: 'live' | 'wip' | 'planned';
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
    color: '#ff6b35', // Forge orange
    status: 'wip',
    workbenchTab: true,
  },
  {
    id: 'atlas',
    displayName: 'TerraAtlas',
    shortName: 'Atlas',
    description: 'Geographic Intelligence & Parcel Mapping',
    iconName: 'Globe',
    route: '/atlas',
    color: '#00e5ff', // Cyan
    status: 'wip',
    workbenchTab: true,
  },
  {
    id: 'dais',
    displayName: 'TerraDais',
    shortName: 'Dais',
    description: 'Workflow Orchestration & Governance Dashboard',
    iconName: 'LayoutDashboard',
    route: '/dais',
    color: '#a855f7', // Purple
    status: 'wip',
    workbenchTab: true,
  },
  {
    id: 'dossier',
    displayName: 'TerraDossier',
    shortName: 'Dossier',
    description: 'Document Management & Record Archive',
    iconName: 'FileStack',
    route: '/dossier',
    color: '#22c55e', // Green
    status: 'wip',
    workbenchTab: true,
  },
  {
    id: 'gpt',
    displayName: 'TerraGPT',
    shortName: 'GPT',
    description: 'AI Assistant & Natural Language Interface',
    iconName: 'Bot',
    route: '/gpt',
    color: '#3b82f6', // Blue
    status: 'wip',
    workbenchTab: true,
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
  },
  {
    id: 'trace',
    displayName: 'TerraTrace',
    shortName: 'Trace',
    description: 'Observability, Audit Trail & Telemetry',
    iconName: 'Activity',
    status: 'wip',
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
    route: '/property/:parcelId',
    status: 'live',
  },
] as const;

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

export function getSuiteById(id: SuiteId): SuiteDefinition | undefined {
  return CONSTITUTIONAL_SUITES.find((s) => s.id === id);
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
