/**
 * workbenchRoles.ts
 *
 * Phase 2: Role-based tab visibility defaults for Property Workbench.
 * Source of truth: Document A (County Work Taxonomy v2.0) §Role → Tab Visibility Summary.
 *
 * CONSTITUTIONAL RULES (Doc 0D §Conflict 3):
 *   - Visibility = PRESENTATION DEFAULTS ONLY
 *   - Never ownership
 *   - Never canonical tab order mutation
 *   - Never reservation drift for future offices
 *   - User override always available in settings
 *   - FORBIDDEN: hard-locking tabs away from any role, changing tab order per role
 *
 * Tab order is LOCKED per TF-052 Art. IV:
 *   Summary → Forge → Atlas → Dais → Clerk → Treasury → Audit → Dossier → Pilot
 */

import type { WorkbenchTabSlug } from '../contracts/workbench';

// ============================================================================
// Role Identifiers
// ============================================================================

/**
 * Canonical county role identifiers.
 * These map 1:1 to Document A's 12 roles.
 * The backend auth system provides these via WorkbenchContext.roles[].
 */
export type CountyRole =
  | 'residential_appraiser'
  | 'commercial_appraiser'
  | 'mass_appraisal_analyst'
  | 'gis_technician'
  | 'spatial_analyst'
  | 'clerk'
  | 'exemption_clerk'
  | 'assessor'
  | 'deputy_chief'
  | 'bpp_specialist'
  | 'it_director'
  | 'devops_admin';

// ============================================================================
// Role Metadata
// ============================================================================

export interface RoleDefinition {
  id: CountyRole;
  label: string;
  /** Short description of this role's daily reality */
  description: string;
  /** Primary entry point in TerraFusion (from Doc 0A) */
  primaryEntry: string;
  /** Write lane this role operates in (from Doc 0A) */
  writeLane: string;
}

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    id: 'residential_appraiser',
    label: 'Residential Appraiser',
    description: 'Single-parcel residential valuation using cost and sales approaches',
    primaryEntry: 'Work Queue → Property Workbench → Forge',
    writeLane: 'Forge',
  },
  {
    id: 'commercial_appraiser',
    label: 'Commercial Appraiser',
    description: 'Commercial property valuation using all three approaches',
    primaryEntry: 'Work Queue → Property Workbench → Forge (Income)',
    writeLane: 'Forge',
  },
  {
    id: 'mass_appraisal_analyst',
    label: 'Mass Appraisal Analyst',
    description: 'Statistical model building, calibration, and ratio study compliance',
    primaryEntry: 'TerraForge standalone → Statistics/Regression Studio',
    writeLane: 'Forge',
  },
  {
    id: 'gis_technician',
    label: 'GIS Technician',
    description: 'Parcel boundary maintenance, maps, plat processing',
    primaryEntry: 'TerraAtlas standalone',
    writeLane: 'Atlas',
  },
  {
    id: 'spatial_analyst',
    label: 'Spatial Analyst',
    description: 'Cross-parcel spatial analysis, neighborhood delineation, location factors',
    primaryEntry: 'TerraAtlas standalone (spatial analysis)',
    writeLane: 'Atlas',
  },
  {
    id: 'clerk',
    label: 'Clerk (Recording / Ownership)',
    description: 'Document recording, chain of title, ownership changes',
    primaryEntry: 'Property Workbench → Clerk tab',
    writeLane: 'TerraClerk (future)',
  },
  {
    id: 'exemption_clerk',
    label: 'Exemption Clerk',
    description: 'Exemption applications, eligibility verification, renewals',
    primaryEntry: 'TerraDais → terra-exempt module',
    writeLane: 'Dais (terra-exempt)',
  },
  {
    id: 'assessor',
    label: 'Assessor (Elected Official)',
    description: 'Office oversight, compliance, certification, escalated parcels',
    primaryEntry: 'Management Dashboard → Property Workbench (escalations)',
    writeLane: 'Dais (terra-cert)',
  },
  {
    id: 'deputy_chief',
    label: 'Deputy / Chief Appraiser',
    description: 'Day-to-day operations, work assignment, quality review',
    primaryEntry: 'TerraDais → Work Queue Dashboard',
    writeLane: 'Dais (terra-queue)',
  },
  {
    id: 'bpp_specialist',
    label: 'Business Personal Property Specialist',
    description: 'BPP valuation, renditions, depreciation schedules (account-centric)',
    primaryEntry: 'Business Account Workbench (future)',
    writeLane: 'Forge (BPP) or new domain',
  },
  {
    id: 'it_director',
    label: 'IT Director',
    description: 'Infrastructure, security, compliance, vendor management',
    primaryEntry: 'TerraCanon / Management Dashboard',
    writeLane: 'OS Core',
  },
  {
    id: 'devops_admin',
    label: 'DevOps / Systems Admin',
    description: 'CI/CD, deployments, infrastructure monitoring',
    primaryEntry: 'TerraCanon / CI dashboards',
    writeLane: 'OS Core (infrastructure)',
  },
] as const;

// ============================================================================
// Tab Visibility Matrix
// ============================================================================

/**
 * Default visible tabs per role.
 * Directly transcribed from Document A v2.0 §Role → Tab Visibility Summary.
 *
 * Tab ORDER never changes — this only controls which tabs are shown by default.
 * Users can override in settings to show all tabs.
 *
 * Roles 11 (IT Director) and 12 (DevOps) have no workbench tabs because
 * they are system-level users whose primary workspace is TerraCanon.
 * They still get Summary if they happen to open a parcel.
 */
const ROLE_VISIBLE_TABS: Record<CountyRole, readonly WorkbenchTabSlug[]> = {
  residential_appraiser: ['summary', 'forge', 'atlas', 'dossier', 'pilot'],
  commercial_appraiser:  ['summary', 'forge', 'atlas', 'dossier', 'pilot'],
  mass_appraisal_analyst: ['summary', 'forge', 'atlas', 'pilot'],
  gis_technician:        ['summary', 'atlas', 'dossier'],
  spatial_analyst:       ['summary', 'forge', 'atlas', 'pilot'],
  clerk:                 ['summary', 'clerk', 'dossier'],
  exemption_clerk:       ['summary', 'dais', 'clerk', 'dossier'],
  assessor:              ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'],
  deputy_chief:          ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'],
  bpp_specialist:        ['summary'],
  it_director:           ['summary'],
  devops_admin:          ['summary'],
};

// ============================================================================
// All Tabs (locked order for reference)
// ============================================================================

/** Canonical tab order — NEVER mutate. */
export const ALL_TAB_SLUGS: readonly WorkbenchTabSlug[] = [
  'summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot',
] as const;

// ============================================================================
// API
// ============================================================================

/**
 * Get the default visible tabs for one or more roles.
 * Multi-role users get the UNION of all their roles' visible tabs.
 * Tab order is always preserved (locked constitutional order).
 *
 * Returns ALL tabs if:
 *   - roles array is empty (no role info available yet)
 *   - showAll override is true (user setting)
 */
export function getVisibleTabs(
  roles: readonly string[],
  options?: { showAll?: boolean }
): WorkbenchTabSlug[] {
  // User override: show all tabs
  if (options?.showAll) {
    return [...ALL_TAB_SLUGS];
  }

  // No role info: show everything (graceful degradation)
  if (roles.length === 0) {
    return [...ALL_TAB_SLUGS];
  }

  // Collect union of visible tabs across all roles
  const visibleSet = new Set<WorkbenchTabSlug>();
  for (const role of roles) {
    const tabs = ROLE_VISIBLE_TABS[role as CountyRole];
    if (tabs) {
      for (const tab of tabs) {
        visibleSet.add(tab);
      }
    }
  }

  // If no recognized roles matched, show all (graceful degradation)
  if (visibleSet.size === 0) {
    return [...ALL_TAB_SLUGS];
  }

  // Return in locked constitutional order
  return ALL_TAB_SLUGS.filter((slug) => visibleSet.has(slug));
}

/**
 * Check if a specific tab is visible for the given roles.
 */
export function isTabVisible(
  tabSlug: WorkbenchTabSlug,
  roles: readonly string[],
  options?: { showAll?: boolean }
): boolean {
  return getVisibleTabs(roles, options).includes(tabSlug);
}

/**
 * Get hidden tabs for the given roles (inverse of visible).
 * Useful for displaying "N more tabs available" UI.
 */
export function getHiddenTabs(
  roles: readonly string[],
  options?: { showAll?: boolean }
): WorkbenchTabSlug[] {
  const visible = new Set(getVisibleTabs(roles, options));
  return ALL_TAB_SLUGS.filter((slug) => !visible.has(slug));
}

/**
 * Get role definition by ID.
 */
export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return ROLE_DEFINITIONS.find((r) => r.id === roleId);
}
