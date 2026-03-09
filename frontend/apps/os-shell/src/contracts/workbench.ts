/**
 * TerraFusion OS — Workbench Contract Interfaces
 * ═══════════════════════════════════════════════════════════════
 *
 * Canonical TypeScript interfaces for the Property Workbench extension contract.
 * Suites plug into the workbench by implementing WorkbenchContribution.
 *
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Sections 4, 7
 * @see 06_CONTRACTS_TYPESCRIPT_INTERFACES_v1.md — Section 1
 */

// ============================================================================
// Primitives
// ============================================================================

/** Canonical tab slugs — locked order. Adding a new tab requires governance review. */
export type WorkbenchTabSlug =
  | 'summary'
  | 'forge'
  | 'atlas'
  | 'dais'
  | 'clerk'    // R3.2: TerraClerk — County recording & title
  | 'treasury' // R3.3: TerraTreasury — Tax collection & payments
  | 'audit'    // R3.4: TerraAudit — Financial compliance
  | 'dossier'
  | 'pilot';

/** Data classification per FISMA-HIGH policy. */
export type DataClassification = 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';

/** Work modes align to how staff think. */
export type WorkMode = 'overview' | 'valuation' | 'mapping' | 'admin' | 'case';

// ============================================================================
// Workbench Context
// ============================================================================

/**
 * Ambient context available to every workbench extension point.
 * Populated by the OS and passed into every contribution call.
 */
export interface WorkbenchContext {
  countyId: string;
  userId: string;
  roles: string[];
  parcelId: string;
  workMode: WorkMode;
}

// ============================================================================
// Tab Definition
// ============================================================================

/** Owner identifiers for tab ownership. */
export type TabOwner = 'os' | 'forge' | 'atlas' | 'dais' | 'clerk' | 'treasury' | 'audit' | 'dossier' | 'pilot';

/**
 * Describes a single workbench tab.
 * Returned by WorkbenchContribution.getTabs().
 */
export interface TabDefinition {
  slug: WorkbenchTabSlug;
  title: string;
  owner: TabOwner;
  /** RBAC claims required to see this tab (empty = always visible). */
  requiredClaims?: string[];
  /** License key required (county-scoped). */
  requiredLicense?: string;
  /** Route pattern for the tab content. */
  route: string; // e.g. `/property/:parcelId/forge`
}

// ============================================================================
// Badge Provider API (Context Ribbon)
// ============================================================================

/**
 * A single status badge displayed in the Context Ribbon.
 * Badges are read-only projections — deterministic and fast (cacheable).
 */
export interface Badge {
  key: string;
  label: string;
  severity?: 'info' | 'warn' | 'danger';
  classification: DataClassification;
  tooltip?: string;
}

/** Suite owner identifiers for badge providers. */
export type BadgeOwner = 'forge' | 'atlas' | 'dais' | 'dossier' | 'os';

/**
 * A suite's badge contribution to the Context Ribbon.
 * Must be deterministic and fast — results are cacheable.
 */
export interface BadgeProvider {
  owner: BadgeOwner;
  getBadges(parcelId: string, ctx: WorkbenchContext): Promise<Badge[]>;
}

// ============================================================================
// Quick Actions (Context Ribbon)
// ============================================================================

/**
 * A role-aware action displayed in the Context Ribbon.
 * All actions are tool-bound and execute through TerraPilot routing.
 */
export interface QuickActionDefinition {
  id: string;
  label: string;
  /** The TerraPilot toolId to invoke. */
  toolId: string;
  /** Default params passed to the tool. */
  toolParams?: Record<string, unknown>;
  /** RBAC claims required to see this action. */
  requiredClaims?: string[];
}

// ============================================================================
// Workbench Contribution (Extension Contract)
// ============================================================================

/**
 * The contract each suite implements to plug into the Property Workbench.
 *
 * Suites register a WorkbenchContribution so the workbench can assemble:
 * - Tabs (getTabs)
 * - Badges (badgeProvider)
 * - Quick actions (getQuickActions)
 *
 * Suites do NOT import workbench internals — they only implement this interface.
 */
export interface WorkbenchContribution {
  getTabs(ctx: WorkbenchContext): Promise<TabDefinition[]>;
  badgeProvider?: BadgeProvider;
  getQuickActions?(ctx: WorkbenchContext): Promise<QuickActionDefinition[]>;
}
