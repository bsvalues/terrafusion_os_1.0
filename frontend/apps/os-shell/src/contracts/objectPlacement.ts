/**
 * TerraFusion OS — 3-6-9 Object Placement Codex
 * ═══════════════════════════════════════════════════════════════
 *
 * Machine-enforceable placement law for every object in TerraFusion OS.
 *
 *   3 = Identity   — every object declares what it IS
 *   6 = Layer       — every object has exactly one owning layer
 *   9 = Completion  — every user-facing object must let the user finish work
 *
 * Precedence rules (prevent classification fights):
 *   - Tab-hosted parcel UI → 'parcel-scoped-app' (not 'tier0-workbench')
 *   - 'tier0-workbench' = only the host surface itself
 *   - 'notification-alert' = ephemeral signal delivery
 *   - 'global-signal' = persistent shell status (clock, connectivity, mode)
 *   - 'state-signal-service' = shell mode / theme / connectivity state logic
 *   - 'workflow-capability-service' = domain logic (export, sync, batch) with no UI
 *   - 'invisible-infrastructure-service' = pure plumbing (auth, telemetry, cache)
 *   - 'batch-calibration-tool' = only valid if unique placement law vs cross-parcel
 *
 * @module contracts/objectPlacement
 * @see docs/architecture/OBJECT_PLACEMENT_CODEX_v1.md
 */

// ============================================================================
// Object Type Taxonomy — 15 canonical types
// ============================================================================

export const OBJECT_TYPES = [
  'os-shell-surface',
  'home-scene',
  'suite-workspace',
  'tier0-workbench',
  'parcel-scoped-app',
  'cross-parcel-operational-app',
  'os-feature-window',
  'global-signal',
  'workflow-capability-service',
  'invisible-infrastructure-service',
  'audit-evidence-surface',
  'notification-alert',
  'domain-router',
  'state-signal-service',
  'batch-calibration-tool',
] as const;

export type TerraFusionObjectType = (typeof OBJECT_TYPES)[number];

// ============================================================================
// Layer Taxonomy — 5 UI layers + 1 headless
// ============================================================================

export const LAYERS = [
  'layer-1-shell',
  'layer-2-home',
  'layer-3-suite',
  'layer-4-workbench',
  'layer-5-application',
  'no-direct-ui',
] as const;

export type TerraFusionLayer = (typeof LAYERS)[number];

// ============================================================================
// Render Modes
// ============================================================================

export const RENDER_MODES = [
  'always-visible',
  'route-activated',
  'window-spawned',
  'overlay',
  'headless',
  'toast-ephemeral',
] as const;

export type RenderMode = (typeof RENDER_MODES)[number];

// ============================================================================
// Two-Axis Classification (Correction #2)
// ============================================================================

/**
 * Every classified object declares:
 *   objectType  — what it IS (primary manifestation)
 *   hostSurface — where it is HOSTED (optional, for embedded objects)
 *
 * Example: CostForge on a parcel →
 *   objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench'
 */
export interface ObjectClassification {
  objectType: TerraFusionObjectType;
  hostSurface?: TerraFusionObjectType;
  /** Phase 10: Completion metadata — required for completionRequired types. */
  entryPath?: string;
  hasActionableUI?: boolean;
  hasEvidenceExport?: boolean;
}

// ============================================================================
// Placement Rule (expanded with completion/evidence fields)
// ============================================================================

export interface PlacementRule {
  layer: TerraFusionLayer;
  renderMode: RenderMode;
  hostSurface?: TerraFusionObjectType;
  parcelScoped: boolean;
  completionRequired: boolean;
  evidenceRequired: boolean;
  driftForbidden: string;
  examples: string[];
}

// ============================================================================
// Placement Policy — one entry per object type
// ============================================================================

export const PLACEMENT_POLICY: Record<TerraFusionObjectType, PlacementRule> = {
  'os-shell-surface': {
    layer: 'layer-1-shell',
    renderMode: 'always-visible',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must not become a standalone window',
    examples: ['taskbar', 'dock', 'start-menu', 'top-bar'],
  },
  'home-scene': {
    layer: 'layer-2-home',
    renderMode: 'route-activated',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must not import suite modules',
    examples: ['home-scene', 'desktop-scene', 'stage-zero'],
  },
  'suite-workspace': {
    layer: 'layer-3-suite',
    renderMode: 'window-spawned',
    parcelScoped: false,
    completionRequired: true,
    evidenceRequired: false,
    driftForbidden: 'Must not render parcel-scoped apps inline',
    examples: ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt'],
  },
  'tier0-workbench': {
    layer: 'layer-4-workbench',
    renderMode: 'window-spawned',
    parcelScoped: true,
    completionRequired: true,
    evidenceRequired: true,
    driftForbidden: 'Must not float as popup — opens maximized',
    examples: ['property-workbench'],
  },
  'parcel-scoped-app': {
    layer: 'layer-4-workbench',
    renderMode: 'window-spawned',
    hostSurface: 'tier0-workbench',
    parcelScoped: true,
    completionRequired: true,
    evidenceRequired: true,
    driftForbidden: 'Must route through workbench tab, never standalone',
    examples: ['forge-tab', 'atlas-tab', 'dais-tab', 'dossier-tab', 'pilot-tab',
               'clerk-tab', 'treasury-tab', 'audit-tab', 'summary-tab'],
  },
  'cross-parcel-operational-app': {
    layer: 'layer-5-application',
    renderMode: 'window-spawned',
    parcelScoped: false,
    completionRequired: true,
    evidenceRequired: false,
    driftForbidden: 'Must not be embedded in workbench tabs',
    examples: ['federation-dashboard', 'counties', 'reporting', 'marketplace'],
  },
  'os-feature-window': {
    layer: 'layer-5-application',
    renderMode: 'window-spawned',
    parcelScoped: false,
    completionRequired: true,
    evidenceRequired: false,
    driftForbidden: 'Must not depend on suite context',
    examples: ['os-pilot', 'os-trace', 'os-canon'],
  },
  'global-signal': {
    layer: 'layer-1-shell',
    renderMode: 'always-visible',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must not be buried in a suite',
    examples: ['clock-widget', 'connectivity-indicator', 'shell-mode-indicator'],
  },
  'workflow-capability-service': {
    layer: 'no-direct-ui',
    renderMode: 'headless',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must not render its own window',
    examples: ['export-service', 'sync-service', 'batch-processor'],
  },
  'invisible-infrastructure-service': {
    layer: 'no-direct-ui',
    renderMode: 'headless',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must have zero UI surface',
    examples: ['auth-provider', 'telemetry-collector', 'cache-manager'],
  },
  'audit-evidence-surface': {
    layer: 'layer-4-workbench',
    renderMode: 'overlay',
    hostSurface: 'tier0-workbench',
    parcelScoped: true,
    completionRequired: true,
    evidenceRequired: true,
    driftForbidden: 'Must attach to parcel context',
    examples: ['evidence-panel', 'defense-packet-viewer', 'chain-of-custody'],
  },
  'notification-alert': {
    layer: 'layer-1-shell',
    renderMode: 'toast-ephemeral',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must not persist as window',
    examples: ['toast-notification', 'system-alert', 'sync-complete-banner'],
  },
  'domain-router': {
    layer: 'layer-3-suite',
    renderMode: 'route-activated',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must only route, never render domain content directly',
    examples: ['suite-route-handler', 'workbench-tab-router'],
  },
  'state-signal-service': {
    layer: 'no-direct-ui',
    renderMode: 'headless',
    parcelScoped: false,
    completionRequired: false,
    evidenceRequired: false,
    driftForbidden: 'Must not render UI',
    examples: ['shell-mode-store', 'theme-provider', 'connectivity-monitor'],
  },
  'batch-calibration-tool': {
    layer: 'layer-5-application',
    renderMode: 'window-spawned',
    parcelScoped: false,
    completionRequired: true,
    evidenceRequired: true,
    driftForbidden: 'Must not run inside workbench',
    examples: ['mass-revaluation', 'county-wide-calibration'],
  },
};

// ============================================================================
// Module + Surface Classification Map (Correction #4: unified inventory)
// ============================================================================

/**
 * Classifies every registered surface in TerraFusion OS.
 *
 * Sources: MODULE_REGISTRY, CONSTITUTIONAL_SUITES, OS_FEATURES,
 *          shell surfaces, workbench tabs, scene definitions, route launchers.
 */
export const MODULE_OBJECT_TYPES: Record<string, ObjectClassification> = {
  // ── Shell surfaces (layer 1) ──────────────────────────────────────────
  'taskbar':              { objectType: 'os-shell-surface' },
  'dock':                 { objectType: 'os-shell-surface' },
  'start-menu':           { objectType: 'os-shell-surface' },
  'top-bar':              { objectType: 'os-shell-surface' },

  // ── Scene definitions (layer 2) ───────────────────────────────────────
  'home-scene':           { objectType: 'home-scene' },
  'desktop-scene':        { objectType: 'home-scene' },

  // ── Constitutional Suite Homes (layer 3 — window-spawned) ─────────────
  'suite-forge':          { objectType: 'suite-workspace', entryPath: 'desktop-icon:forge', hasActionableUI: true },
  'suite-atlas':          { objectType: 'suite-workspace', entryPath: 'desktop-icon:atlas', hasActionableUI: true },
  'suite-dais':           { objectType: 'suite-workspace', entryPath: 'desktop-icon:dais', hasActionableUI: true },
  'suite-dossier':        { objectType: 'suite-workspace', entryPath: 'desktop-icon:dossier', hasActionableUI: true },
  'suite-gpt':            { objectType: 'suite-workspace', entryPath: 'desktop-icon:gpt', hasActionableUI: true },

  // ── Tier-0 Workbench host (layer 4) ───────────────────────────────────
  'property-workbench':   { objectType: 'tier0-workbench', entryPath: 'desktop-icon:workbench', hasActionableUI: true, hasEvidenceExport: true },

  // ── Workbench tabs — parcel-scoped apps hosted IN workbench ───────────
  'summary':              { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:summary', hasActionableUI: true, hasEvidenceExport: true },
  'forge':                { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:forge', hasActionableUI: true, hasEvidenceExport: true },
  'atlas':                { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:atlas', hasActionableUI: true, hasEvidenceExport: true },
  'dais':                 { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:dais', hasActionableUI: true, hasEvidenceExport: true },
  'clerk':                { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:clerk', hasActionableUI: true, hasEvidenceExport: true },
  'treasury':             { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:treasury', hasActionableUI: true, hasEvidenceExport: true },
  'audit':                { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:audit', hasActionableUI: true, hasEvidenceExport: true },
  'dossier':              { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:dossier', hasActionableUI: true, hasEvidenceExport: true },
  'pilot':                { objectType: 'parcel-scoped-app', hostSurface: 'tier0-workbench', entryPath: 'workbench-tab:pilot', hasActionableUI: true, hasEvidenceExport: true },

  // ── OS Feature windows (layer 5) ──────────────────────────────────────
  'os-pilot':             { objectType: 'os-feature-window', entryPath: 'desktop-icon:pilot', hasActionableUI: true },
  'os-trace':             { objectType: 'os-feature-window', entryPath: 'desktop-icon:trace', hasActionableUI: true },
  'os-canon':             { objectType: 'os-feature-window', entryPath: 'desktop-icon:canon', hasActionableUI: true },

  // ── Cross-parcel operational apps (layer 5) ───────────────────────────
  'federation-dashboard': { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:federation-dashboard', hasActionableUI: true },
  'costforge':            { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:costforge', hasActionableUI: true },
  'terra-gaia':           { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:terra-gaia', hasActionableUI: true },
  'levy-calculator':      { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:levy-calculator', hasActionableUI: true },
  'gis-viewer':           { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:gis-viewer', hasActionableUI: true },
  'document-manager':     { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:document-manager', hasActionableUI: true },
  'reporting':            { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:reporting', hasActionableUI: true },
  'atlas-ai':             { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:atlas-ai', hasActionableUI: true },
  'marketplace':          { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:marketplace', hasActionableUI: true },
  'counties':             { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:counties', hasActionableUI: true },
  'government-architecture': { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:government-architecture', hasActionableUI: true },
  'sovereign-dashboard':  { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:sovereign-dashboard', hasActionableUI: true },
  'axiom-fs':             { objectType: 'cross-parcel-operational-app', entryPath: 'desktop-icon:axiom-fs', hasActionableUI: true },

  // ── OS feature utilities (layer 5 — settings/help) ────────────────────
  'settings':             { objectType: 'os-feature-window', entryPath: 'desktop-icon:settings', hasActionableUI: true },
  'shortcuts-help':       { objectType: 'os-feature-window', entryPath: 'desktop-icon:shortcuts-help', hasActionableUI: true },
  'plugin-manager':       { objectType: 'os-feature-window', entryPath: 'desktop-icon:plugin-manager', hasActionableUI: true },
};

// ============================================================================
// Validation Helpers (pure, no side effects)
// ============================================================================

export interface PlacementViolation {
  objectType: TerraFusionObjectType;
  field: string;
  expected: string;
  actual: string;
  rule: string;
}

/**
 * Validate that an object is placed in the correct layer and render mode.
 */
export function validatePlacement(
  objectType: TerraFusionObjectType,
  layer: TerraFusionLayer,
  renderMode: RenderMode,
  hostSurface?: TerraFusionObjectType,
): { valid: boolean; violation?: PlacementViolation } {
  const rule = PLACEMENT_POLICY[objectType];
  if (!rule) {
    return {
      valid: false,
      violation: {
        objectType,
        field: 'objectType',
        expected: 'known type',
        actual: objectType,
        rule: 'Object type not found in PLACEMENT_POLICY',
      },
    };
  }

  if (rule.layer !== layer) {
    return {
      valid: false,
      violation: {
        objectType,
        field: 'layer',
        expected: rule.layer,
        actual: layer,
        rule: rule.driftForbidden,
      },
    };
  }

  if (rule.renderMode !== renderMode) {
    return {
      valid: false,
      violation: {
        objectType,
        field: 'renderMode',
        expected: rule.renderMode,
        actual: renderMode,
        rule: rule.driftForbidden,
      },
    };
  }

  if (rule.hostSurface && rule.hostSurface !== hostSurface) {
    return {
      valid: false,
      violation: {
        objectType,
        field: 'hostSurface',
        expected: rule.hostSurface,
        actual: hostSurface ?? 'none',
        rule: rule.driftForbidden,
      },
    };
  }

  return { valid: true };
}

export interface CompletionMetadata {
  hasEntryPath: boolean;
  hasActionableUI: boolean;
  hasEvidenceExport?: boolean;
}

/**
 * Validate that a completionRequired object meets the completion law.
 */
export function validateCompletion(
  objectType: TerraFusionObjectType,
  metadata: CompletionMetadata,
): { valid: boolean; missing?: string[] } {
  const rule = PLACEMENT_POLICY[objectType];
  if (!rule || !rule.completionRequired) {
    return { valid: true };
  }

  const missing: string[] = [];

  if (!metadata.hasEntryPath) missing.push('entryPath');
  if (!metadata.hasActionableUI) missing.push('actionableUI');
  if (rule.evidenceRequired && !metadata.hasEvidenceExport) {
    missing.push('evidenceExport');
  }

  return { valid: missing.length === 0, missing: missing.length > 0 ? missing : undefined };
}

export interface DriftViolation {
  objectType: TerraFusionObjectType;
  actualLayer: TerraFusionLayer;
  actualRenderMode: RenderMode;
  expectedLayer: TerraFusionLayer;
  expectedRenderMode: RenderMode;
  rule: string;
}

/**
 * Detect drift: object is placed somewhere it shouldn't be.
 */
export function detectDrift(
  classification: ObjectClassification,
  actualLayer: TerraFusionLayer,
  actualRenderMode: RenderMode,
): DriftViolation | null {
  const rule = PLACEMENT_POLICY[classification.objectType];
  if (!rule) return null;

  if (rule.layer !== actualLayer || rule.renderMode !== actualRenderMode) {
    return {
      objectType: classification.objectType,
      actualLayer,
      actualRenderMode,
      expectedLayer: rule.layer,
      expectedRenderMode: rule.renderMode,
      rule: rule.driftForbidden,
    };
  }

  return null;
}

/**
 * Returns true if this object type must be hosted inside a workbench.
 */
export function requiresWorkbenchHost(objectType: TerraFusionObjectType): boolean {
  const rule = PLACEMENT_POLICY[objectType];
  return rule?.hostSurface === 'tier0-workbench';
}

/**
 * Returns true if this object type may open as a standalone window.
 */
export function isStandaloneAllowed(objectType: TerraFusionObjectType): boolean {
  const rule = PLACEMENT_POLICY[objectType];
  if (!rule) return false;
  return rule.renderMode === 'window-spawned' && !rule.hostSurface;
}

/**
 * Returns true if this object type operates on a single parcel.
 */
export function isParcelScoped(objectType: TerraFusionObjectType): boolean {
  return PLACEMENT_POLICY[objectType]?.parcelScoped ?? false;
}

/**
 * Get the allowed render mode for an object type.
 */
export function getAllowedRenderMode(objectType: TerraFusionObjectType): RenderMode | undefined {
  return PLACEMENT_POLICY[objectType]?.renderMode;
}

/**
 * Look up the object classification for a module/surface ID.
 */
export function getObjectClassification(id: string): ObjectClassification | undefined {
  return MODULE_OBJECT_TYPES[id];
}

// ============================================================================
// Phase 7: Workbench Host Boundary Validation
// ============================================================================

/** Types that are lawfully hosted inside the tier-0 workbench. */
const WORKBENCH_HOSTED_TYPES: ReadonlySet<TerraFusionObjectType> = new Set([
  'parcel-scoped-app',
  'audit-evidence-surface',
]);

export interface WorkbenchHostViolation {
  tabId: string;
  objectType: TerraFusionObjectType;
  hostSurface?: TerraFusionObjectType;
  reason: string;
}

/**
 * Validate that a tab ID is lawfully hosted inside the workbench.
 *
 * Returns null if lawful, or a WorkbenchHostViolation describing the breach.
 * Unclassified tabs are allowed through (dev/extension use).
 */
export function validateWorkbenchHost(tabId: string): WorkbenchHostViolation | null {
  const classification = MODULE_OBJECT_TYPES[tabId];

  // Unclassified tabs pass — allows dev/extension tabs without breaking
  if (!classification) return null;

  const { objectType, hostSurface } = classification;

  // Must be a workbench-hosted type
  if (!WORKBENCH_HOSTED_TYPES.has(objectType)) {
    return {
      tabId,
      objectType,
      hostSurface,
      reason: `type-not-workbench-hosted: '${objectType}' cannot render inside workbench`,
    };
  }

  // Must declare tier0-workbench as host surface
  if (hostSurface !== 'tier0-workbench') {
    return {
      tabId,
      objectType,
      hostSurface,
      reason: `wrong-host-surface: expected 'tier0-workbench', got '${hostSurface ?? 'none'}'`,
    };
  }

  return null;
}

// ============================================================================
// Phase 8: Suite Boundary Validation
// ============================================================================

/** The 5 constitutional suite module-ID prefixes (used for window rendering). */
const SUITE_MODULE_IDS: ReadonlySet<string> = new Set([
  'suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt',
]);

export interface SuiteBoundaryViolation {
  moduleId: string;
  objectType: TerraFusionObjectType;
  reason: string;
}

/**
 * Validate that a module ID is lawful for rendering in a suite window context.
 *
 * Suite windows may only render `suite-workspace` classified objects.
 * Returns null if lawful, or a SuiteBoundaryViolation describing the breach.
 * Unclassified modules are allowed through (dev/extension use).
 */
export function validateSuiteRendering(moduleId: string): SuiteBoundaryViolation | null {
  // Only enforce on modules that claim to be suites
  if (!SUITE_MODULE_IDS.has(moduleId)) {
    // Non-suite module IDs are handled by launcher routing (Phase 6),
    // not by suite boundary enforcement.
    return null;
  }

  const classification = MODULE_OBJECT_TYPES[moduleId];

  // Unclassified suite IDs are a governance error
  if (!classification) {
    return {
      moduleId,
      objectType: 'suite-workspace' as TerraFusionObjectType,
      reason: `unclassified-suite: '${moduleId}' claims to be a suite but has no classification`,
    };
  }

  const { objectType } = classification;

  // Must be classified as suite-workspace
  if (objectType !== 'suite-workspace') {
    return {
      moduleId,
      objectType,
      reason: `type-not-suite-workspace: '${moduleId}' classified as '${objectType}', expected 'suite-workspace'`,
    };
  }

  return null;
}

// ============================================================================
// Phase 10: Completion Reporting
// ============================================================================

export interface CompletionReportEntry {
  moduleId: string;
  objectType: TerraFusionObjectType;
  completionRequired: boolean;
  evidenceRequired: boolean;
  hasEntryPath: boolean;
  hasActionableUI: boolean;
  hasEvidenceExport: boolean;
  status: 'complete' | 'incomplete' | 'exempt';
  missing: string[];
}

export interface CompletionReport {
  timestamp: string;
  totalModules: number;
  completionRequired: number;
  complete: number;
  incomplete: number;
  exempt: number;
  entries: CompletionReportEntry[];
}

/**
 * Generate a completion report for all classified modules.
 *
 * Scans MODULE_OBJECT_TYPES and cross-references each entry against
 * PLACEMENT_POLICY to determine whether the module meets the completion law:
 *   - completionRequired types MUST have entryPath + hasActionableUI
 *   - evidenceRequired types MUST also have hasEvidenceExport
 *   - Non-completionRequired types are exempt
 *
 * Pure function, no side effects.
 */
export function generateCompletionReport(): CompletionReport {
  const entries: CompletionReportEntry[] = [];

  for (const [moduleId, classification] of Object.entries(MODULE_OBJECT_TYPES)) {
    const rule = PLACEMENT_POLICY[classification.objectType];
    if (!rule) continue;

    const completionRequired = rule.completionRequired;
    const evidenceRequired = rule.evidenceRequired;

    if (!completionRequired) {
      entries.push({
        moduleId,
        objectType: classification.objectType,
        completionRequired: false,
        evidenceRequired: false,
        hasEntryPath: !!classification.entryPath,
        hasActionableUI: !!classification.hasActionableUI,
        hasEvidenceExport: !!classification.hasEvidenceExport,
        status: 'exempt',
        missing: [],
      });
      continue;
    }

    const missing: string[] = [];
    if (!classification.entryPath) missing.push('entryPath');
    if (!classification.hasActionableUI) missing.push('actionableUI');
    if (evidenceRequired && !classification.hasEvidenceExport) missing.push('evidenceExport');

    entries.push({
      moduleId,
      objectType: classification.objectType,
      completionRequired,
      evidenceRequired,
      hasEntryPath: !!classification.entryPath,
      hasActionableUI: !!classification.hasActionableUI,
      hasEvidenceExport: !!classification.hasEvidenceExport,
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    });
  }

  const completionRequiredEntries = entries.filter(e => e.completionRequired);

  return {
    timestamp: new Date().toISOString(),
    totalModules: entries.length,
    completionRequired: completionRequiredEntries.length,
    complete: completionRequiredEntries.filter(e => e.status === 'complete').length,
    incomplete: completionRequiredEntries.filter(e => e.status === 'incomplete').length,
    exempt: entries.filter(e => e.status === 'exempt').length,
    entries,
  };
}
