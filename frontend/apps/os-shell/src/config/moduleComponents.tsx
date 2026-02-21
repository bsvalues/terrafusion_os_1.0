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
  gaia: 'terra-gaia',
  ai: 'atlas-ai',
  atlas: 'atlas-ai',
  analytics: 'reporting',
  reports: 'reporting',
  levy: 'levy-calculator',
  gis: 'gis-viewer',
  map: 'gis-viewer',
  docs: 'document-manager',
  documents: 'document-manager',
  store: 'marketplace',
  apps: 'marketplace',
  config: 'settings',
  preferences: 'settings',
  help: 'shortcuts-help',
  shortcuts: 'shortcuts-help',

  // Phase C3: Sovereign Dashboard aliases
  dashboard: 'sovereign-dashboard',
  'doc-viewer': 'sovereign-dashboard',
  'document-viewer': 'sovereign-dashboard',
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

// CostForge - Primary Property Assessment System (has full implementation)
const CostForgeQuantumDashboard = lazy(
  () => import('../components/costforge/CostForgeQuantumDashboard')
);

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

// ============================================================================
// Module Entries (lazy components for bespoke modules)
// ============================================================================

export type ModuleEntry = {
  Component?: React.LazyExoticComponent<React.ComponentType<any>>;
};

const MODULE_ENTRIES: Record<string, ModuleEntry> = {
  'federation-dashboard': { Component: FederationDashboard },
  costforge: { Component: CostForgeQuantumDashboard },
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
};

export function getModuleEntry(moduleId: string): ModuleEntry | undefined {
  return MODULE_ENTRIES[moduleId];
}

// ============================================================================
// Placeholder for modules under development
// ============================================================================

interface PlaceholderModuleProps {
  name: string;
  icon: string;
  description?: string;
  status?: 'coming-soon' | 'in-development' | 'beta';
}

const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  name,
  icon,
  description = 'This module is under development.',
  status = 'coming-soon',
}) => {
  const statusConfig = {
    'coming-soon': { bgColor: 'hsl(var(--tf-amber-hs) / 50%)', label: 'Coming Soon' },
    'in-development': { bgColor: 'hsl(var(--tf-blue-hs) / 50%)', label: 'In Development' },
    beta: { bgColor: 'hsl(var(--tf-info))', label: 'Beta' },
  };

  const { bgColor, label } = statusConfig[status];

  return (
    <div
      className='w-full h-full flex flex-col items-center justify-center text-white p-8 relative overflow-hidden'
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tf-neutral-hs) / 5% / 0.95) 0%, hsl(var(--tf-neutral-hs) / 11% / 0.9) 50%, hsl(var(--tf-neutral-hs) / 5% / 0.95) 100%)',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className='absolute inset-0 opacity-[0.03] pointer-events-none'
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--tf-cyan-hs) / 50% / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--tf-cyan-hs) / 50% / 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Corner glow */}
      <div
        className='absolute top-0 left-0 w-[300px] h-[300px] opacity-20 pointer-events-none'
        style={{
          background:
            'radial-gradient(circle at center, hsl(var(--tf-cyan-hs) / 50% / 0.3) 0%, transparent 70%)',
        }}
      />

      {/* Icon with glow */}
      <div
        className='text-6xl mb-6 relative'
        style={{
          filter: 'drop-shadow(0 0 20px hsl(var(--tf-cyan-hs) / 50% / 0.4))',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h2
        className='text-2xl font-light mb-2'
        style={{
          color: 'hsl(var(--tf-cyan-hs) / 50%)',
          textShadow: '0 0 20px hsl(var(--tf-cyan-hs) / 50% / 0.4)',
        }}
      >
        {name}
      </h2>

      {/* Description */}
      <p className='text-white/60 text-center max-w-md mb-6'>{description}</p>

      {/* Status badge */}
      <div
        className='flex items-center gap-2 px-4 py-2 rounded-full'
        style={{
          background: 'hsl(var(--tf-cyan-hs) / 50% / 0.1)',
          border: '1px solid hsl(var(--tf-cyan-hs) / 50% / 0.2)',
        }}
      >
        <div
          className='w-2 h-2 rounded-full animate-pulse'
          style={{ backgroundColor: bgColor, boxShadow: '0 0 10px currentColor' }}
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
      background: 'linear-gradient(135deg, hsl(var(--tf-neutral-hs) / 5% / 0.95) 0%, hsl(var(--tf-neutral-hs) / 11% / 0.9) 100%)',
    }}
  >
    {/* Quantum spinner */}
    <div
      className='w-12 h-12 rounded-full animate-spin'
      style={{
        border: '3px solid hsl(var(--tf-cyan-hs) / 50% / 0.15)',
        borderTopColor: 'hsl(var(--tf-cyan-hs) / 50%)',
        boxShadow: '0 0 30px hsl(var(--tf-cyan-hs) / 50% / 0.3)',
      }}
    />
    <p className='mt-4 text-sm' style={{ color: 'hsl(var(--tf-cyan-hs) / 50% / 0.7)' }}>
      Loading module...
    </p>
  </div>
);

// ============================================================================
// Module Renderer
// ============================================================================

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

    // CostForge - Property Assessment & Valuation (formerly TerraBuild)
    case 'costforge':
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <CostForgeQuantumDashboard />
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
      return (
        <PlaceholderModule
          name='Levy Calculator'
          icon='📊'
          description='Tax Levy Management & Calculations. Components exist - integration in progress.'
          status='in-development'
        />
      );

    case 'gis-viewer':
      return (
        <PlaceholderModule
          name='GIS Viewer'
          icon='🗺️'
          description='Geographic Information System & Parcel Mapping. Plugin architecture ready.'
          status='in-development'
        />
      );

    case 'document-manager':
      return (
        <PlaceholderModule
          name='Document Manager'
          icon='📁'
          description='County Document Repository & Records. Backend integration required.'
          status='in-development'
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
    // UNKNOWN MODULE
    // ========================================================================

    default:
      return <GenericModuleHost module={module} />;
  }
};

export default ModuleRenderer;
