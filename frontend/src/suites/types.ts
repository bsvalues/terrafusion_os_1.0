/**
 * TerraFusion Suite Manifest Type System
 *
 * Defines the contract for hot-swappable government suites.
 * Each suite is a coordinated bundle of:
 * - Web apps (React/Angular/etc.)
 * - Native modules (WPF panels, Electron components)
 * - Backend engines (Rust/C# services)
 * - APIs (REST/GraphQL endpoints)
 * - AI agents (county copilots, task automation)
 */

export type SuiteCategory = 'core' | 'premium' | 'enterprise' | 'admin';

export type SuiteLevel = 'Core' | 'Premium' | 'Enterprise' | 'Admin';

export interface SuiteManifest {
  /** Unique identifier (e.g., "assessment", "levy", "gis") */
  id: string;

  /** Display name (e.g., "Appraisal / Valuation") */
  label: string;

  /** Emoji icon for UI */
  icon: string;

  /** Suite category for grouping */
  category: SuiteCategory;

  /** Brief description of suite capabilities */
  description: string;

  /** License level required */
  level: SuiteLevel;

  /** Can be loaded/unloaded without restart */
  hotSwappable: boolean;

  /** Web applications to mount (e.g., ["terra-assessor-production", "costforge-ai"]) */
  webApps: string[];

  /** Native modules/panels to load (e.g., ["assessment-desktop-panel"]) */
  nativeModules: string[];

  /** Backend engines to coordinate (e.g., ["valuation-engine", "gis-engine"]) */
  engines: string[];

  /** API endpoints to enable (e.g., ["assessment-api"]) */
  apis: string[];

  /** AI agents to deploy (e.g., ["assessment-assistant"]) */
  aiAgents: string[];

  /** Required permissions (e.g., ["ROLE_APPRAISER"]) */
  permissions: string[];

  /** Accent color for suite UI (optional) */
  accentColor?: string;

  /** Route prefix when suite is active (optional) */
  routePrefix?: string;
}
