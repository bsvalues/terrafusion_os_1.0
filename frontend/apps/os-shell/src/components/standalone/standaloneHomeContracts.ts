/**
 * @fileoverview Standalone Home Contracts
 *
 * Type definitions for the StandaloneHomeShell component and related metadata.
 *
 * These contracts define the OS-owned shell that standalone suites plug into,
 * ensuring consistent chrome, LiquidPanel materials, and a11y baseline.
 *
 * @module standalone/standaloneHomeContracts
 * @see Slice 6: Standalone Suite Homes Consistency
 */

import type { ReactNode } from 'react';
import type { OsFeatureId } from '../../config/suiteRegistry';

// ============================================================================
// Module Contracts (Slice 13)
// ============================================================================

/**
 * Allowed module kinds. Limited enum for governance.
 * - info: Static information display (text, stats)
 * - actions: Quick action buttons or links
 * - metrics: Numeric metrics with optional charts
 * - links: Navigation links or resources
 */
export const MODULE_KINDS = ['info', 'actions', 'metrics', 'links'] as const;
export type ModuleKind = typeof MODULE_KINDS[number];

/**
 * Module for standalone home pages.
 * Suites provide descriptors; shell owns layout.
 */
export interface StandaloneHomeModule {
  /** Unique identifier within the suite (must be unique per homeMeta) */
  id: string;
  /** Display title for the module */
  title: string;
  /** Module kind - determines rendering style */
  kind: ModuleKind;
  /** Optional icon name */
  icon?: string;
  /** Optional render function for custom content */
  render?: () => ReactNode;
  /** Optional data for data-driven rendering */
  data?: Record<string, unknown>;
  /** Whether the module is collapsed by default */
  collapsed?: boolean;
}

// ============================================================================
// Action Contracts
// ============================================================================

/**
 * Primary action displayed in the standalone home header.
 */
export interface StandaloneHomeAction {
  /** Unique identifier for the action */
  id: string;
  /** Button label text */
  label: string;
  /** Optional icon name (from icon library) */
  icon?: string;
  /** Navigation intent */
  intent: 'workbench' | 'standalone' | 'system';
  /** Route path for navigation (mutually exclusive with handler) */
  href?: string;
  /** Click handler for in-place actions (mutually exclusive with href) */
  handler?: () => void;
  /** Whether the action is currently disabled */
  disabled?: boolean;
  /** Aria-label override for accessibility */
  ariaLabel?: string;
}

// ============================================================================
// Metadata Contracts
// ============================================================================

/**
 * Metadata describing a standalone home page.
 * This is provided by suiteRegistry and consumed by StandaloneHomeShell.
 */
export interface StandaloneHomeMeta {
  /** Page title (rendered as h1) */
  title: string;
  /** Short description for the page */
  description: string;
  /** Icon identifier (from icon library) */
  icon: string;
  /** Primary actions displayed in the header */
  primaryActions: StandaloneHomeAction[];
  /** Optional subtitle or status badge text */
  subtitle?: string;
  /** Whether to show the "Open in Workbench" CTA (requires parcel context) */
  showWorkbenchCta?: boolean;
  /** Optional modules displayed in the home page (Slice 13) */
  modules?: StandaloneHomeModule[];
}

// ============================================================================
// Shell Props Contract
// ============================================================================

/**
 * Props for the StandaloneHomeShell component.
 */
export interface StandaloneHomeShellProps {
  /** Feature ID from suiteRegistry */
  featureId: OsFeatureId;
  /** Metadata for the home page (can be overridden from suiteRegistry) */
  meta?: Partial<StandaloneHomeMeta>;
  /** Suite-specific content rendered inside the shell */
  children: ReactNode;
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// Context Contracts
// ============================================================================

/**
 * Parcel context for "Open in Workbench" CTA.
 */
export interface StandaloneParcelContext {
  /** Parcel ID for workbench navigation */
  parcelId: string;
  /** Parcel address or display name */
  parcelName?: string;
  /** Suite to open in workbench (defaults to current standalone) */
  targetSuite?: string;
}

/**
 * Context provided to standalone home children.
 */
export interface StandaloneHomeContext {
  /** Current feature ID */
  featureId: OsFeatureId;
  /** Resolved metadata (merged from props and registry) */
  meta: StandaloneHomeMeta;
  /** Parcel context if available */
  parcelContext: StandaloneParcelContext | null;
  /** Navigate to workbench with current parcel context */
  openInWorkbench: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default home metadata for a standalone feature.
 */
export const DEFAULT_STANDALONE_META: StandaloneHomeMeta = {
  title: 'Standalone Feature',
  description: 'An OS feature running in standalone mode.',
  icon: 'terminal',
  primaryActions: [],
  showWorkbenchCta: true,
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an action has a navigation href.
 */
export function isNavigationAction(
  action: StandaloneHomeAction
): action is StandaloneHomeAction & { href: string } {
  return typeof action.href === 'string' && action.href.length > 0;
}

/**
 * Type guard to check if an action has a click handler.
 */
export function isHandlerAction(
  action: StandaloneHomeAction
): action is StandaloneHomeAction & { handler: () => void } {
  return typeof action.handler === 'function';
}
