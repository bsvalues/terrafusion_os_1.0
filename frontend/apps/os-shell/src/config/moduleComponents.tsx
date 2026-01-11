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
 * @param moduleId - The module ID to check (will be normalized)
 * @returns True if the module is registered
 */
export function isModuleRegistered(moduleId: string): boolean {
  return MODULE_REGISTRY.has(normalizeModuleId(moduleId));
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
    'coming-soon': { color: 'bg-yellow-500', label: 'Coming Soon' },
    'in-development': { color: 'bg-blue-500', label: 'In Development' },
    beta: { color: 'bg-purple-500', label: 'Beta' },
  };

  const { color, label } = statusConfig[status];

  return (
    <div className='w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8'>
      <div className='text-6xl mb-6'>{icon}</div>
      <h2 className='text-2xl font-bold text-cyan-400 mb-2'>{name}</h2>
      <p className='text-slate-400 text-center max-w-md mb-6'>{description}</p>
      <div className='flex items-center gap-2 text-sm text-slate-300'>
        <div className={`w-2 h-2 ${color} rounded-full animate-pulse`} />
        <span>{label}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Loading Fallback
// ============================================================================

const ModuleLoadingFallback: React.FC = () => (
  <div className='w-full h-full flex flex-col items-center justify-center bg-slate-900'>
    <div className='w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin' />
    <p className='mt-4 text-slate-300 text-sm'>Loading module...</p>
  </div>
);

// ============================================================================
// Module Renderer
// ============================================================================

interface ModuleRendererProps {
  moduleId: string;
  /** Optional metadata passed to module (e.g., objectId for sovereign-dashboard) */
  metadata?: Record<string, unknown>;
}

/**
 * Renders the appropriate component for a given module ID.
 * Wraps lazy components in Suspense with loading fallback.
 */
export const ModuleRenderer: React.FC<ModuleRendererProps> = ({ moduleId, metadata }) => {
  switch (moduleId) {
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
      return (
        <PlaceholderModule
          name='Unknown Module'
          icon='❓'
          description={`Module "${moduleId}" is not registered in the system.`}
          status='coming-soon'
        />
      );
  }
};

export default ModuleRenderer;
