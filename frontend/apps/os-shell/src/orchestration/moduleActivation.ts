/**
 * TerraFusion OS Module Activation Orchestrator
 *
 * The single canonical launch pathway for ALL module activations.
 * Whether from start menu, route, shortcut, deep link, or system automation -
 * everything goes through activateModule().
 *
 * Pipeline:
 * 1. Normalize alias → canonical ID
 * 2. Emit telemetry (intent)
 * 3. Window resolution (focus or open)
 * 4. Warm load (non-blocking)
 *
 * Invariants:
 * - moduleComponents.tsx remains the single render truth
 * - moduleLoaderStore owns lifecycle only
 * - desktopStore owns windows only
 * - This orchestrator owns coordination only
 *
 * @module orchestration/moduleActivation
 * @see Phase 3 Design Contract
 */

import { normalizeModuleId, isModuleRegistered } from '../config/moduleComponents';
import { useDesktopStore } from '../stores/desktopStore';
import { useModuleLoaderStore } from '../stores/moduleLoaderStore';
import { useNotificationStore } from '../stores/notificationStore';
import { telemetry } from '../services/telemetry';
import type { OsActor } from '../auth/useAuthContext';

// ============================================================================
// Types
// ============================================================================

/**
 * Sources from which module activation can be triggered.
 */
export type ModuleActivationSource =
  | 'start_menu'       // User clicked in Start Menu
  | 'desktop'          // User double-clicked desktop icon
  | 'route'            // URL route navigation
  | 'shortcut'         // Keyboard shortcut
  | 'keyboard_shortcut' // Keyboard shortcut (alias)
  | 'deep_link'        // External deep link
  | 'context_menu'     // Right-click context menu
  | 'system';          // System/automation trigger

/**
 * Options for activateModule().
 */
export interface ActivateModuleOptions {
  /** Source of the activation (for telemetry and behavior) */
  source: ModuleActivationSource;
  
  /** Whether to focus existing window if module is already open. Default: true */
  focusIfOpen?: boolean;
  
  /** Whether to trigger warm load after opening window. Default: true */
  warmLoad?: boolean;
  
  /** Whether to show toast notification on open. Default: true */
  showNotification?: boolean;
  
  /** Additional metadata for telemetry and deep link context */
  metadata?: Record<string, unknown>;

  /** Wave 3: authenticated actor for audit trail. null = unauthenticated. */
  actor?: OsActor | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Finds an existing window for a module.
 * @returns The window ID if found, null otherwise
 */
function findExistingWindow(moduleId: string): string | null {
  const { windows } = useDesktopStore.getState();
  const existingWindow = windows.find(
    (w) => w.moduleId === moduleId && w.state !== 'minimized'
  );
  return existingWindow?.id ?? null;
}

/**
 * Gets the module display name for window title.
 */
function getModuleDisplayName(moduleId: string): string {
  // Map of canonical IDs to display names
  // Must cover every entry in MODULE_REGISTRY (moduleComponents.tsx)
  const displayNames: Record<string, string> = {
    'costforge': 'CostForge',
    'terra-gaia': 'TerraGaia',
    'federation-dashboard': 'Federation Dashboard',
    'levy-calculator': 'TerraLevy',
    'terra-levy': 'TerraLevy',
    'gis-viewer': 'TerraGIS Pro',
    'terra-gis': 'TerraGIS Pro',
    'gis-pro': 'TerraGIS Pro',
    'document-manager': 'Documents',
    'reporting': 'Analytics',
    'atlas-ai': 'ATLAS',
    'marketplace': 'Marketplace',
    'counties': 'Counties Hub',
    'government-architecture': 'Architecture',
    'settings': 'Settings',
    'shortcuts-help': 'Shortcuts & Help',
    'plugin-manager': 'Plugin Manager',
    'axiom-fs': 'AxiomFS',
    'sovereign-dashboard': 'Sovereign Dashboard',
    // Property Workbench (Tier-0 OS Surface)
    'property-workbench': 'Property Workbench',
    // Constitutional Suite Homes
    'suite-forge': 'TerraForge',
    'suite-atlas': 'TerraAtlas',
    'suite-dais': 'TerraDais',
    'suite-dossier': 'TerraDossier',
    'suite-gpt': 'TerraGPT',
    // OS Features
    'os-pilot': 'TerraPilot',
    'os-trace': 'TerraTrace',
    'os-canon': 'TerraCanon',
    // Application Constellation (Gen2 catalog)
    'income-valuation': 'Income Valuation',
    'regression-studio': 'Regression Studio',
    'statistics-studio': 'Statistics Studio',
    'batch-cost-run': 'Batch Cost Runs',
    'coefficient-preview': 'Coefficient Preview',
    'comparable-sales': 'Comparable Sales',
    'vei': 'VEI',
    'terra-gama': 'TerraGAMA',
    'terra-pilt': 'TerraPILT',
    'property-tax-ai': 'PropertyTax AI',
    'pacs-bridge': 'PACS DataBridge',
    'terra-sync': 'TerraSync',
    'terra-flow': 'TerraFlow',
    'terra-queue': 'TerraQueue',
    'terra-permit': 'TerraPermit',
    // Phase B audit additions
    'terra-miner': 'TerraMiner',
    'legislative-pulse': 'Legislative Pulse',
    // GPT Suite namespaced modules
    'gpt-studio': 'GPT Studio',
    'gpt-marketplace': 'GPT Marketplace',
    'gpt-management': 'GPT Management',
    'gpt-builder': 'GPT Builder',
    'gpt-analytics': 'GPT Analytics',
    'gpt-rag': 'GPT RAG',
  };

  return displayNames[moduleId] ?? moduleId;
}

/**
 * Gets the module icon for window.
 */
function getModuleIcon(moduleId: string): string {
  // Map of canonical IDs to icons
  // Must cover every entry in MODULE_REGISTRY (moduleComponents.tsx)
  const icons: Record<string, string> = {
    'costforge': '💎',
    'terra-gaia': '🌍',
    'federation-dashboard': '🏛️',
    'levy-calculator': '🧮',
    'terra-levy': '🧮',
    'gis-viewer': '🗺️',
    'terra-gis': '🗺️',
    'gis-pro': '🗺️',
    'document-manager': '📁',
    'reporting': '📈',
    'atlas-ai': '🤖',
    'marketplace': '🏪',
    'counties': '🏛️',
    'government-architecture': '🏗️',
    'settings': '⚙️',
    'shortcuts-help': '⌨️',
    'plugin-manager': '🧩',
    'axiom-fs': '📂',
    'sovereign-dashboard': '📊',
    // Property Workbench (Tier-0 OS Surface)
    'property-workbench': '🏠',
    // Constitutional Suite Homes
    'suite-forge': '🔨',
    'suite-atlas': '🗺️',
    'suite-dais': '⚖️',
    'suite-dossier': '📋',
    'suite-gpt': '🧠',
    // OS Features
    'os-pilot': '🧭',
    'os-trace': '📡',
    'os-canon': '⚙️',
    // Application Constellation (Gen2 catalog)
    'income-valuation': '💰',
    'regression-studio': '📈',
    'statistics-studio': '📊',
    'batch-cost-run': '📦',
    'coefficient-preview': '⚖️',
    'comparable-sales': '🏘️',
    'vei': '🔍',
    'terra-gama': '📍',
    'terra-pilt': '🏛️',
    'property-tax-ai': '🤖',
    'pacs-bridge': '🔗',
    'terra-sync': '🔄',
    'terra-flow': '⚡',
    'terra-permit': '🏗️',
    // Phase B audit additions
    'terra-queue': '📋',
    'terra-miner': '⛏️',
    'legislative-pulse': '📢',
    // GPT Suite namespaced modules
    'gpt-studio': '🧪',
    'gpt-marketplace': '🏪',
    'gpt-management': '⚙️',
    'gpt-builder': '🔨',
    'gpt-analytics': '📊',
    'gpt-rag': '📚',
  };

  return icons[moduleId] ?? '📦';
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Activates a module through the canonical pipeline.
 *
 * This is THE ONLY function external code should call to launch modules.
 * It handles:
 * - Alias normalization
 * - Telemetry
 * - Window deduplication (focus existing)
 * - Window creation
 * - Warm loading (non-blocking)
 *
 * @param moduleId - The module to activate (can be alias or canonical)
 * @param options - Activation options
 * @returns Promise that resolves when window is opened (not when load completes)
 *
 * @example
 * // From Start Menu
 * await activateModule('costforge', { source: 'start_menu' });
 *
 * @example
 * // With metadata for deep links
 * await activateModule('costforge', {
 *   source: 'deep_link',
 *   metadata: { parcelId: '12345' }
 * });
 */
export async function activateModule(
  moduleId: string,
  options: ActivateModuleOptions
): Promise<void> {
  const { source, focusIfOpen = true, warmLoad = true, showNotification = true, metadata } = options;

  // -------------------------------------------------------------------------
  // Step 1: Normalize alias → canonical ID
  // -------------------------------------------------------------------------
  const canonicalId = normalizeModuleId(moduleId);

  // -------------------------------------------------------------------------
  // Step 2: Check if module is registered
  // -------------------------------------------------------------------------
  if (!isModuleRegistered(canonicalId)) {
    // Emit rejection telemetry
    telemetry.trackEvent('module.reject', {
      moduleId: canonicalId,
      source,
      reason: 'not_registered',
    });
    
    // Fail closed - no throw, just return (UI-safe)
    return;
  }

  // -------------------------------------------------------------------------
  // Step 3: Emit activation intent telemetry
  // -------------------------------------------------------------------------
  telemetry.trackEvent('module.activate', {
    moduleId: canonicalId,
    source,
    metadata,
  });

  // -------------------------------------------------------------------------
  // Step 4: Window resolution
  // -------------------------------------------------------------------------
  const existingWindowId = findExistingWindow(canonicalId);

  if (existingWindowId) {
    // Window already open
    if (focusIfOpen) {
      // Focus existing window
      useDesktopStore.getState().focusWindow(existingWindowId);
      
      // Emit focus telemetry
      telemetry.trackEvent('module.focus', {
        moduleId: canonicalId,
        source,
        windowId: existingWindowId,
      });
    }
    
    // Return early - no new load needed
    return;
  }

  // No existing window - open new one
  const { openWindow } = useDesktopStore.getState();
  const displayName = getModuleDisplayName(canonicalId);
  openWindow(
    canonicalId,
    displayName,
    getModuleIcon(canonicalId),
    metadata
  );

  // -------------------------------------------------------------------------
  // Step 5: Show notification (if enabled)
  // -------------------------------------------------------------------------
  if (showNotification) {
    const { addNotification } = useNotificationStore.getState();
    addNotification(
      {
        title: 'Module Opened',
        message: `${displayName} is now ready.`,
        type: 'success',
      },
      { duration: 3000 }
    );
  }

  // -------------------------------------------------------------------------
  // Step 6: Warm load (fire-and-forget, non-blocking)
  // -------------------------------------------------------------------------
  if (warmLoad) {
    const { loadModule } = useModuleLoaderStore.getState();
    // Fire and forget - DO NOT await
    // Deduplication is handled by moduleLoaderStore
    loadModule(canonicalId).catch(() => {
      // Silently catch - errors handled by loader store
    });
  }

  // Activation complete (window opened, load started)
}

// ============================================================================
// Convenience Wrappers (optional, for common patterns)
// ============================================================================

/**
 * Activates a module from the Start Menu.
 */
export async function activateFromStartMenu(
  moduleId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return activateModule(moduleId, { source: 'start_menu', metadata });
}

/**
 * Activates a module from a route.
 */
export async function activateFromRoute(
  moduleId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return activateModule(moduleId, { source: 'route', metadata });
}

/**
 * Activates a module from a deep link.
 */
export async function activateFromDeepLink(
  moduleId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return activateModule(moduleId, { source: 'deep_link', metadata });
}

export default activateModule;
