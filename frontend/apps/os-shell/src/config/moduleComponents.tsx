/**
 * TerraFusion OS Module Components Map
 *
 * Maps module IDs to their actual React components.
 * This enables direct rendering inside windows instead of iframes.
 *
 * NOTE: CostForge is the upgraded replacement for TerraBuild.
 *
 * @module config/moduleComponents
 */

import React, { lazy, Suspense } from 'react';
import { GenericModuleHost } from '../shell/desktop/GenericModuleHost';
import { MODULES, type ModuleDefinition } from './modules';
import { validateSuiteRendering } from '../contracts/objectPlacement';
import { createLogger } from '@/hooks/useLogger';
import QueuedModuleSurface from '../components/suites/QueuedModuleSurface';

const logger = createLogger('ModuleRenderer');

// ============================================================================
// Module Aliases - Maps legacy/short IDs to canonical IDs (Phase 2)
// ============================================================================

/**
 * Maps legacy module IDs and short aliases to canonical IDs.
 * This allows backward compatibility and user-friendly shortcuts.
 */
export const MODULE_ALIASES: Record<string, string> = {
  // Legacy aliases
  terrabuild: 'costforge',
  'terra-build': 'costforge',
  property: 'costforge',
  assessment: 'costforge',

  // Short aliases
  // LEGACY: terra-gaia is the legacy TerraGaia AI module.
  // suite-gpt is the constitutional TerraGPT suite home.
  // Both coexist intentionally until suite-gpt achieves feature parity.
  gaia: 'terra-gaia',
  ai: 'atlas-ai',
  analytics: 'reporting',
  reports: 'reporting',
  levy: 'terra-levy',
  // Note: 'levy-calculator' and 'gis-viewer' are canonical IDs in MODULE_REGISTRY
  // so they are NOT aliased here (would create a canonical-ID-as-alias conflict).
  gis: 'terra-gis',
  'gis-pro': 'terra-gis',
  map: 'terra-gis',
  docs: 'document-manager',
  documents: 'document-manager',
  store: 'marketplace',
  apps: 'marketplace',
  config: 'settings',
  preferences: 'settings',
  help: 'shortcuts-help',
  shortcuts: 'shortcuts-help',

  // Application Constellation aliases (Gen2 catalog)
  regression: 'regression-studio',
  stats: 'statistics-studio',
  statistics: 'statistics-studio',
  permit: 'terra-permit',
  pilt: 'terra-pilt',
  sync: 'terra-sync',
  flow: 'terra-flow',
  pacs: 'pacs-bridge',
  gama: 'terra-gama',
  'property-tax': 'property-tax-ai',
  management: 'management-dashboard',
  'assessor-ops': 'management-dashboard',
  queue: 'terra-queue',
  'work-queue': 'terra-queue',
  terraqueue: 'terra-queue',

  // New constellation modules
  miner: 'terra-miner',
  terraminer: 'terra-miner',
  legislative: 'legislative-pulse',
  'legislative-beacon': 'legislative-pulse',
  insight: 'terra-insight',
  terrainsight: 'terra-insight',

  // Phase C3: Sovereign Dashboard aliases
  dashboard: 'sovereign-dashboard',
  'doc-viewer': 'sovereign-dashboard',
  'document-viewer': 'sovereign-dashboard',

  // Property Workbench (desktop window adapter)
  workbench: 'property-workbench',
  'property-workbench-window': 'property-workbench',

  // OS Feature aliases (desktop icons use these short IDs)
  pilot: 'os-pilot',
  trace: 'os-trace',
  canon: 'os-canon',
  terrapilot: 'os-pilot',
  terratrace: 'os-trace',
  terracanon: 'os-canon',

  // Constitutional Suite Home aliases (desktop icons use these)
  forge: 'suite-forge',
  atlas: 'suite-atlas',
  dais: 'suite-dais',
  dossier: 'suite-dossier',
  gpt: 'suite-gpt',
  terraforge: 'suite-forge',
  terraatlas: 'suite-atlas',
  terradais: 'suite-dais',
  terradossier: 'suite-dossier',
  terragpt: 'suite-gpt',
};

/**
 * Normalizes a module ID by resolving aliases to canonical IDs.
 * @param moduleId - The module ID (may be alias or canonical)
 * @returns The canonical module ID
 */
export function normalizeModuleId(moduleId: string): string {
  const lowered = moduleId.toLowerCase().trim();
  return MODULE_ALIASES[lowered] ?? lowered;
}

// ============================================================================
// Module Registry - Single source of truth for registered modules (Phase 2)
// ============================================================================

/**
 * Set of all registered canonical module IDs.
 * ModuleRenderer switch cases must match these IDs.
 */
export const MODULE_REGISTRY = new Set<string>([
  'federation-dashboard',
  'costforge',
  'comps-forge',
  'terra-gaia',
  'levy-calculator',
  'gis-viewer',
  'document-manager',
  'reporting',
  'atlas-ai',
  'marketplace',
  'counties',
  'government-architecture',
  'settings',
  'shortcuts-help',
  'plugin-manager',
  'axiom-fs',
  'sovereign-dashboard', // Phase C3: Sovereign Dashboard
  // Application Constellation (Gen2 catalog — truthful placeholders)
  // NOTE: income-valuation and comparable-sales REMOVED (Phase 5G) — archived in Phase 3,
  // absorbed into Workbench → Forge → Income/Sales sub-tabs
  'regression-studio',
  'statistics-studio',
  'batch-cost-run',
  'coefficient-preview',
  'vei',
  'property-tax-ai',
  'pacs-bridge',
  'terra-sync',
  'terra-gis',
  'terra-gama',
  'terra-levy',
  'terra-pilt',
  'terra-permit',
  'terra-cert',
  'terra-notice',
  'terra-flow',
  'management-dashboard',
  'terra-queue',
  'terra-miner',
  'legislative-pulse',
  'terra-insight',
  // GPT Suite namespaced modules
  'gpt-studio',
  'gpt-marketplace',
  'gpt-management',
  'gpt-builder',
  'gpt-analytics',
  'gpt-rag',
  // Property Workbench (Tier-0 OS Surface — opens in window)
  'property-workbench',
  // Constitutional Suite Homes (render inside Desktop windows)
  'suite-forge',
  'suite-atlas',
  'suite-dais',
  'suite-dossier',
  'suite-gpt',
  // OS Features (open as in-shell windows, not full-page routes)
  'os-pilot',
  'os-trace',
  'os-canon',
  // Atlas & Forge standalone modules (Phase 36)
  'geo-equity-dashboard',
  'mass-appraisal-gis',
  'cost-manual',
  'value-audit-module',
]);

/**
 * Checks if a module ID (after normalization) is registered.
 * Checks both hardcoded MODULE_REGISTRY and dynamically generated MODULES.
 * @param moduleId - The module ID to check (will be normalized)
 * @returns True if the module is registered
 */
export function isModuleRegistered(moduleId: string): boolean {
  const canonical = normalizeModuleId(moduleId);
  // Check hardcoded registry first (for built-in modules)
  if (MODULE_REGISTRY.has(canonical)) {
    return true;
  }
  // Check dynamic MODULES array (for Gen2 modules from manifestfiles)
  return MODULES.some((m) => m.id === canonical);
}

/**
 * Gets all registered module IDs.
 * @returns Array of canonical module IDs
 */
export function getRegisteredModules(): string[] {
  return Array.from(MODULE_REGISTRY);
}

// ============================================================================
// Lazy-loaded Module Components
// ============================================================================

// Federation Dashboard - Global Government Federation
const FederationDashboard = lazy(
  () => import('../applications/federation-dashboard/FederationDashboard')
);

// CostForge — native app hosted via AppFrame (packages/terrabuild, port 5002)
// The shell NEVER imports CostForge code directly — it loads the running service URL.
import { AppFrame } from '../components/app-frame/AppFrame';

// TerraGaia - Natural Language AI Assistant
const TerraGaiaDashboard = lazy(() => import('../components/dashboards/TerraGaiaDashboard'));

// ATLAS - Adaptive Terra Learning Assistant System
const ATLAS = lazy(() => import('../components/ai/ATLAS'));

// Analytics - Real-time Reporting Dashboard
const AnalyticsDashboard = lazy(() => import('../components/analytics/AnalyticsDashboard'));

// Marketplace - App Store
const Marketplace = lazy(() => import('../components/Marketplace'));

// Counties Hub - County Management
const CountiesHub = lazy(() => import('../components/CountiesHub'));

// Government Architecture - System Overview
const GovernmentArchitecture = lazy(() => import('../components/GovernmentArchitecture'));

// Settings Panel
const SettingsPanel = lazy(() =>
  import('../shell/settings/SettingsPanel').then((module) => ({ default: module.SettingsPanel }))
);

// Shortcuts Panel
const ShortcutsPanel = lazy(() =>
  import('../shell/shortcuts/ShortcutsPanel').then((module) => ({ default: module.ShortcutsPanel }))
);

// Plugin Manager
const PluginManager = lazy(() =>
  import('../shell/desktop/PluginManager').then((module) => ({ default: module.PluginManager }))
);

// AxiomFS - The Lattice File System
const AxiomFSWindow = lazy(() =>
  import('../modules/axiomfs/AxiomFSWindow').then((module) => ({ default: module.AxiomFSWindow }))
);

// Sovereign Dashboard - Document Viewer & AI Assessment (Phase C3)
const SovereignDashboardWindow = lazy(() =>
  import('../modules/dashboard/SovereignDashboardWindow').then((module) => ({
    default: module.SovereignDashboardWindow,
  }))
);

// CompsForge — Sales comparison approach (demo data, standalone window)
const CompsForgeModule = lazy(
  () => import('../pages/suites/modules/CompsForgeModule')
);

// ============================================================================
// Phase C: Rehosted Module Components
// ============================================================================
const StatisticsStudio = lazy(
  () => import('../pages/forge/statistics/StatisticsStudio')
);
const RegressionStudio = lazy(
  () => import('../pages/forge/regression/RegressionStudio')
);
const BatchCostRun = lazy(
  () => import('../pages/forge/batch/BatchCostRun')
);
const CoefficientPreview = lazy(
  () => import('../pages/forge/batch/CoefficientPreview')
);
// Phase 36: Atlas & Forge standalone modules
const GeoEquityDashboard = lazy(
  () => import('../pages/atlas/GeoEquityDashboard')
);
const MassAppraisalGIS = lazy(
  () => import('../pages/atlas/MassAppraisalGIS')
);
const CostManual = lazy(
  () => import('../pages/forge/cost/CostManual').then(m => ({ default: m.CostManual }))
);
const ValueAuditModule = lazy(
  () => import('../pages/suites/modules/ValueAuditModule')
);
const ManagementDashboard = lazy(
  () => import('../pages/dais/ManagementDashboard')
);
const TerraQueue = lazy(
  () => import('../pages/dais/TerraQueue')
);

// NOTE: ComparableSalesPanel is used inside Forge → Sales sub-tab (not standalone)

// ============================================================================
// Property Workbench Window (Tier-0 OS Surface — Phase A)
// ============================================================================
const PropertyWorkbenchWindow = lazy(
  () => import('../pages/workbench/PropertyWorkbenchWindow')
);

// ============================================================================
// OS Feature Home Pages (open as in-shell windows)
// ============================================================================
const PilotHome = lazy(() => import('../pages/PilotHome'));
const TraceHome = lazy(() => import('../pages/TraceHome'));
const CanonHome = lazy(() => import('../pages/CanonHome'));

// ============================================================================
// Constitutional Suite Home Pages (render inside Desktop windows)
// ============================================================================
const ForgeSuiteHome = lazy(() => import('../pages/suites/ForgeSuiteHome'));
const AtlasSuiteHome = lazy(() => import('../pages/suites/AtlasSuiteHome'));
const DaisSuiteHome = lazy(() => import('../pages/suites/DaisSuiteHome'));
const DossierSuiteHome = lazy(() => import('../pages/suites/DossierSuiteHome'));
const GptSuiteHome = lazy(() => import('../pages/suites/GptSuiteHome'));
const GPTManagementDashboard = lazy(() => import('../components/gpt/GPTManagementDashboard'));
const RAGDatasetManager = lazy(() => import('../components/gpt/RAGDatasetManager'));

// ============================================================================
// Module Entries (lazy components for bespoke modules)
// ============================================================================

export type ModuleEntry = {
  Component?: React.LazyExoticComponent<React.ComponentType<any>>;
};

const MODULE_ENTRIES: Record<string, ModuleEntry> = {
  'federation-dashboard': { Component: FederationDashboard },
  // costforge renders via AppFrame (native app, not a React component)
  'terra-gaia': { Component: TerraGaiaDashboard },
  reporting: { Component: AnalyticsDashboard },
  'atlas-ai': { Component: ATLAS },
  marketplace: { Component: Marketplace },
  counties: { Component: CountiesHub },
  'government-architecture': { Component: GovernmentArchitecture },
  settings: { Component: SettingsPanel },
  'shortcuts-help': { Component: ShortcutsPanel },
  'plugin-manager': { Component: PluginManager },
  'axiom-fs': { Component: AxiomFSWindow },
  'sovereign-dashboard': { Component: SovereignDashboardWindow },
  // Property Workbench Window (Tier-0 OS Surface)
  'property-workbench': { Component: PropertyWorkbenchWindow },
  // Constitutional Suite Homes
  'suite-forge': { Component: ForgeSuiteHome },
  'suite-atlas': { Component: AtlasSuiteHome },
  'suite-dais': { Component: DaisSuiteHome },
  'suite-dossier': { Component: DossierSuiteHome },
  'suite-gpt': { Component: GptSuiteHome },
  // Forge standalone modules (Tranche 1D)
  'batch-cost-run': { Component: BatchCostRun },
  'coefficient-preview': { Component: CoefficientPreview },
  // Forge standalone modules (Gen2)
  'regression-studio': { Component: RegressionStudio },
  // Dais standalone modules
  'terra-queue': { Component: TerraQueue },
  // OS Features (in-shell windows)
  'os-pilot': { Component: PilotHome },
  'os-trace': { Component: TraceHome },
  'os-canon': { Component: CanonHome },
  // Atlas & Forge standalone modules (Phase 36)
  'geo-equity-dashboard': { Component: GeoEquityDashboard },
  'mass-appraisal-gis': { Component: MassAppraisalGIS },
  'cost-manual': { Component: CostManual },
  'value-audit-module': { Component: ValueAuditModule },
};

export function getModuleEntry(moduleId: string): ModuleEntry | undefined {
  return MODULE_ENTRIES[moduleId];
}

// ============================================================================
// Placeholder for modules under development
// ============================================================================

type PlaceholderStatus = 'placeholder' | 'partial' | 'rehosting' | 'live' | 'coming-soon' | 'in-development' | 'beta';

interface PlaceholderModuleProps {
  name: string;
  icon: string;
  description?: string;
  status?: PlaceholderStatus;
  /** Legacy GitHub repo(s) this module consolidates */
  legacySource?: string;
  /** Domain classification */
  domain?: 'assessment' | 'tax' | 'mapping' | 'records' | 'analytics' | 'system' | 'ai';
  /** Scope of this module */
  scope?: 'parcel' | 'county-wide' | 'system';
  /** Intended launch surface */
  launchSurface?: string;
}

const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  name,
  icon,
  description = 'This module is under development.',
  status = 'placeholder',
  legacySource,
  domain,
  scope,
  launchSurface,
}) => {
  const statusConfig: Record<PlaceholderStatus, { color: string; label: string }> = {
    placeholder: { color: 'hsl(var(--tf-warning))', label: 'Placeholder' },
    partial: { color: 'hsl(var(--tf-info))', label: 'Partial' },
    rehosting: { color: 'hsl(var(--tf-accent-2))', label: 'Rehosting' },
    live: { color: 'hsl(var(--tf-success) / 1)', label: 'Live' },
    'coming-soon': { color: 'hsl(var(--tf-warning))', label: 'Coming Soon' },
    'in-development': { color: 'hsl(var(--tf-info))', label: 'In Development' },
    beta: { color: 'hsl(var(--tf-accent-2))', label: 'Beta' },
  };

  const { color, label } = statusConfig[status];

  return (
    <div
      className='w-full h-full flex flex-col items-center justify-center text-white p-8 relative overflow-hidden'
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tf-bg) / 0.95) 0%, hsl(var(--tf-bg) / 0.9) 50%, hsl(var(--tf-bg) / 0.95) 100%)',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className='absolute inset-0 opacity-[0.03] pointer-events-none'
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--tf-accent) / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--tf-accent) / 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Corner glow */}
      <div
        className='absolute top-0 left-0 w-[300px] h-[300px] opacity-20 pointer-events-none'
        style={{
          background:
            'radial-gradient(circle at center, hsl(var(--tf-accent) / 0.3) 0%, transparent 70%)',
        }}
      />

      {/* Icon with glow */}
      <div
        className='text-6xl mb-6 relative'
        style={{
          filter: 'drop-shadow(0 0 20px hsl(var(--tf-accent) / 0.4))',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h2
        className='text-2xl font-light mb-2'
        style={{
          color: 'hsl(var(--tf-accent))',
          textShadow: '0 0 20px hsl(var(--tf-accent) / 0.4)',
        }}
      >
        {name}
      </h2>

      {/* Description */}
      <p className='text-white/60 text-center max-w-md mb-4'>{description}</p>

      {/* Metadata grid — truthful catalog info */}
      {(legacySource || domain || scope || launchSurface) && (
        <div
          className='grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs mb-6 px-6 py-3 rounded-lg max-w-md'
          style={{
            background: 'hsl(var(--tf-accent) / 0.05)',
            border: '1px solid hsl(var(--tf-accent) / 0.1)',
          }}
        >
          {legacySource && (
            <>
              <span className='text-white/40 text-right'>Legacy Source</span>
              <span className='text-white/70'>{legacySource}</span>
            </>
          )}
          {domain && (
            <>
              <span className='text-white/40 text-right'>Domain</span>
              <span className='text-white/70 capitalize'>{domain}</span>
            </>
          )}
          {scope && (
            <>
              <span className='text-white/40 text-right'>Scope</span>
              <span className='text-white/70 capitalize'>{scope}</span>
            </>
          )}
          {launchSurface && (
            <>
              <span className='text-white/40 text-right'>Launch</span>
              <span className='text-white/70'>{launchSurface}</span>
            </>
          )}
        </div>
      )}

      {/* Status badge */}
      <div
        className='flex items-center gap-2 px-4 py-2 rounded-full'
        style={{
          background: 'hsl(var(--tf-accent) / 0.1)',
          border: '1px solid hsl(var(--tf-accent) / 0.2)',
        }}
      >
        <div
          className='w-2 h-2 rounded-full animate-pulse'
          style={{ backgroundColor: color, boxShadow: '0 0 10px currentColor' }}
        />
        <span className='text-sm text-white/80'>{label}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Loading Fallback
// ============================================================================

const ModuleLoadingFallback: React.FC = () => (
  <div
    className='w-full h-full flex flex-col items-center justify-center'
    style={{
      background: 'linear-gradient(135deg, hsl(var(--tf-bg) / 0.95) 0%, hsl(var(--tf-bg) / 0.9) 100%)',
    }}
  >
    {/* Quantum spinner */}
    <div
      className='w-12 h-12 rounded-full animate-spin'
      style={{
        border: '3px solid hsl(var(--tf-accent) / 0.15)',
        borderTopColor: 'hsl(var(--tf-accent))',
        boxShadow: '0 0 30px hsl(var(--tf-accent) / 0.3)',
      }}
    />
    <p className='mt-4 text-sm' style={{ color: 'hsl(var(--tf-accent) / 0.7)' }}>
      Loading module...
    </p>
  </div>
);

// ============================================================================
// Module Renderer
// ============================================================================

// ============================================================================
// Suite Boundary Violation Notice (Phase 8 Codex Enforcement)
// ============================================================================

const SuiteBoundaryViolationNotice: React.FC<{
  moduleId: string;
  objectType: string;
  reason: string;
}> = ({ moduleId, objectType, reason }) => (
  <div
    className="w-full h-full flex flex-col items-center justify-center p-8"
    style={{
      background: 'linear-gradient(135deg, hsl(var(--tf-bg) / 0.95) 0%, hsl(var(--tf-error) / 0.95) 100%)',
    }}
  >
    <div className="text-4xl mb-4">🛡️</div>
    <h2 className="text-xl font-semibold text-red-400 mb-2">Suite Boundary Violation</h2>
    <p className="text-white/70 text-center max-w-md mb-4">
      Module <code className="text-red-300">'{moduleId}'</code> is classified as{' '}
      <code className="text-red-300">'{objectType}'</code> but suite homes must be{' '}
      <code className="text-green-300">'suite-workspace'</code>.
    </p>
    <p className="text-white/40 text-sm text-center max-w-md">{reason}</p>
  </div>
);

interface ModuleRendererProps {
  module: ModuleDefinition;
  /** Optional metadata passed to module (e.g., objectId for sovereign-dashboard) */
  metadata?: Record<string, unknown>;
}

/**
 * Renders the appropriate component for a given module ID.
 * Wraps lazy components in Suspense with loading fallback.
 */
export const ModuleRenderer: React.FC<ModuleRendererProps> = ({ module, metadata }) => {
  switch (module.id) {
    // ========================================================================
    // WORKING MODULES (Full Implementation)
    // ========================================================================

    // Federation Dashboard - Global Government Federation
    case 'federation-dashboard':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <FederationDashboard />
        </Suspense>
      );

    // CostForge — iframes the real terrabuild app (packages/terrabuild, port 5002)
    case 'costforge':
      return (
        <AppFrame
          moduleId="costforge"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    // CompsForge — Sales comparison approach (standalone window, demo data)
    case 'comps-forge':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <CompsForgeModule />
        </Suspense>
      );

    // TerraGaia - Natural Language AI Assistant
    case 'terra-gaia':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <TerraGaiaDashboard />
        </Suspense>
      );

    // ========================================================================
    // MODULES IN DEVELOPMENT (Placeholders)
    // ========================================================================

    case 'levy-calculator':
    case 'terra-levy':
      return (
        <AppFrame
          moduleId="terra-levy"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'gis-viewer':
    case 'terra-gis':
    case 'gis-pro':
      return (
        <AppFrame
          moduleId="gis-pro"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'document-manager':
      return (
        <PlaceholderModule
          name='Document Manager'
          icon='📁'
          description='County document repository, records management, and chain-of-custody tracking.'
          status='in-development'
          domain='records'
          scope='county-wide'
          launchSurface='Standalone window'
        />
      );

    // ========================================================================
    // APPLICATION CONSTELLATION (Gen2 truthful catalog)
    // ========================================================================

    case 'regression-studio':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading Regression Studio...</span></div>}>
          <RegressionStudio />
        </Suspense>
      );

    case 'statistics-studio':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading Statistics Studio...</span></div>}>
          <StatisticsStudio />
        </Suspense>
      );

    case 'batch-cost-run':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading Batch Cost Runs...</span></div>}>
          <BatchCostRun />
        </Suspense>
      );

    case 'coefficient-preview':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading Coefficient Preview...</span></div>}>
          <CoefficientPreview />
        </Suspense>
      );

    case 'vei':
      return (
        <QueuedModuleSurface
          name="Vertical Equality Index"
          description="Vertical Equality Index — measures assessment progressivity/regressivity across value ranges, PRB analysis, IAAO equity compliance."
          moduleId="vei"
        />
      );

    case 'management-dashboard':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading Management Dashboard...</span></div>}>
          <ManagementDashboard />
        </Suspense>
      );

    case 'terra-queue':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading TerraQueue...</span></div>}>
          <TerraQueue />
        </Suspense>
      );

    case 'terra-gama':
      return (
        <AppFrame
          moduleId="terra-gama"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'terra-pilt':
      return (
        <AppFrame
          moduleId="terra-pilt"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'property-tax-ai':
      return (
        <AppFrame
          moduleId="property-tax-ai"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'pacs-bridge':
      return (
        <QueuedModuleSurface
          name="County Data Bridge"
          description="Import/export bridge for county assessment systems — data sync, field mapping, and batch operations."
          moduleId="pacs-bridge"
        />
      );

    case 'terra-sync':
      return (
        <AppFrame
          moduleId="terra-sync"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'terra-flow':
      return (
        <AppFrame
          moduleId="terra-flow"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'terra-permit':
      return (
        <AppFrame
          moduleId="terra-permit"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'terra-cert':
      return (
        <QueuedModuleSurface
          name="TerraCert"
          description="Roll certification checklists and sign-offs — certification workflows, deadline tracking, and statutory compliance."
          moduleId="terra-cert"
        />
      );

    case 'terra-notice':
      return (
        <QueuedModuleSurface
          name="TerraNotice"
          description="Notice templates, batch generation, and mail queue — assessment notice production and delivery tracking."
          moduleId="terra-notice"
        />
      );

    // Analytics - Real-time Reporting
    case 'reporting':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <AnalyticsDashboard />
        </Suspense>
      );

    // ATLAS - AI Intelligence
    case 'atlas-ai':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <ATLAS />
        </Suspense>
      );

    // Marketplace
    case 'marketplace':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <Marketplace />
        </Suspense>
      );

    // Counties Hub
    case 'counties':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <CountiesHub />
        </Suspense>
      );

    // Government Architecture
    case 'government-architecture':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <GovernmentArchitecture />
        </Suspense>
      );

    case 'settings':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <SettingsPanel />
        </Suspense>
      );

    case 'shortcuts-help':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <ShortcutsPanel />
        </Suspense>
      );

    case 'plugin-manager':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <PluginManager />
        </Suspense>
      );

    // AxiomFS - The Lattice File System
    case 'axiom-fs':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <AxiomFSWindow />
        </Suspense>
      );

    // ========================================================================
    // PHASE C3: SOVEREIGN DASHBOARD
    // ========================================================================

    // Sovereign Dashboard - Document Viewer & AI Assessment
    case 'sovereign-dashboard':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <SovereignDashboardWindow
            metadata={
              metadata as
                | { objectId: string; objectType?: string; objectLabel?: string }
                | undefined
            }
          />
        </Suspense>
      );

    // ========================================================================
    // PROPERTY WORKBENCH (Tier-0 OS Surface)
    // ========================================================================

    case 'property-workbench':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <PropertyWorkbenchWindow metadata={metadata as Record<string, unknown> | undefined} />
        </Suspense>
      );

    // ========================================================================
    // CONSTITUTIONAL SUITE HOMES (render full suite inside Desktop window)
    // Phase 8: Suite Boundary Enforcement — validates suite classification
    // ========================================================================

    case 'suite-forge':
    case 'suite-atlas':
    case 'suite-dais':
    case 'suite-dossier':
    case 'suite-gpt': {
      const suiteViolation = validateSuiteRendering(module.id);
      if (suiteViolation) {
        logger.warn('Suite boundary violation:', suiteViolation);
        return (
          <SuiteBoundaryViolationNotice
            moduleId={suiteViolation.moduleId}
            objectType={suiteViolation.objectType}
            reason={suiteViolation.reason}
          />
        );
      }
      const SuiteComponent = {
        'suite-forge': ForgeSuiteHome,
        'suite-atlas': AtlasSuiteHome,
        'suite-dais': DaisSuiteHome,
        'suite-dossier': DossierSuiteHome,
        'suite-gpt': GptSuiteHome,
      }[module.id]!;
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <SuiteComponent />
        </Suspense>
      );
    }


    // ========================================================================
    // OS FEATURES (open as in-shell windows, not full-page routes)
    // ========================================================================

    case 'os-pilot':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <PilotHome />
        </Suspense>
      );

    case 'os-trace':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <TraceHome />
        </Suspense>
      );

    case 'os-canon':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <CanonHome />
        </Suspense>
      );

    // ========================================================================
    // NEW CONSTELLATION MODULES (Phase B audit additions)
    // ========================================================================

    case 'terra-miner':
      return (
        <AppFrame
          moduleId="terra-miner"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'legislative-pulse':
      return (
        <AppFrame
          moduleId="legislative-pulse"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    case 'terra-insight':
      return (
        <AppFrame
          moduleId="terra-insight"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );

    // ========================================================================
    // GPT SUITE NAMESPACED MODULES
    // ========================================================================

    case 'gpt-studio':
      return (
        <PlaceholderModule
          name='GPT Studio'
          icon='🧪'
          description='Interactive GPT prompt studio — prompt engineering, template management, and AI workflow design.'
          status='placeholder'
          domain='ai'
          scope='county-wide'
          launchSurface='GPT suite → Standalone window'
        />
      );

    case 'gpt-marketplace':
      return (
        <PlaceholderModule
          name='GPT Marketplace'
          icon='🏪'
          description='GPT model & prompt marketplace — browse, install, and manage AI models and prompt templates.'
          status='placeholder'
          domain='ai'
          scope='system'
          launchSurface='GPT suite → Standalone window'
        />
      );

    case 'gpt-management':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <GPTManagementDashboard />
        </Suspense>
      );

    case 'gpt-builder':
      return (
        <PlaceholderModule
          name='GPT Builder'
          icon='🔨'
          description='Custom GPT builder — create domain-specific AI agents for county workflows with no-code configuration.'
          status='placeholder'
          domain='ai'
          scope='county-wide'
          launchSurface='GPT suite → Standalone window'
        />
      );

    case 'gpt-analytics':
      return (
        <PlaceholderModule
          name='GPT Analytics'
          icon='📊'
          description='GPT usage analytics — token consumption, model performance, cost tracking, and ROI metrics.'
          status='placeholder'
          domain='ai'
          scope='system'
          launchSurface='GPT suite → Standalone window'
        />
      );

    case 'gpt-rag':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <RAGDatasetManager />
        </Suspense>
      );

    // ========================================================================
    // ATLAS STANDALONE MODULES (Phase 36)
    // ========================================================================

    case 'geo-equity-dashboard':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <GeoEquityDashboard />
        </Suspense>
      );

    case 'mass-appraisal-gis':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <MassAppraisalGIS />
        </Suspense>
      );

    // ========================================================================
    // FORGE STANDALONE MODULES (Phase 36)
    // ========================================================================

    case 'cost-manual':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <CostManual />
        </Suspense>
      );

    case 'value-audit-module':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <ValueAuditModule />
        </Suspense>
      );

    // ========================================================================
    // UNKNOWN MODULE
    // ========================================================================

    default:
      return <GenericModuleHost module={module} />;
  }
};

export default ModuleRenderer;
