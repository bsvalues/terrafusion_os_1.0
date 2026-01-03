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
// Lazy-loaded Module Components
// ============================================================================

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
}

/**
 * Renders the appropriate component for a given module ID.
 * Wraps lazy components in Suspense with loading fallback.
 */
export const ModuleRenderer: React.FC<ModuleRendererProps> = ({ moduleId }) => {
  switch (moduleId) {
    // ========================================================================
    // WORKING MODULES (Full Implementation)
    // ========================================================================

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
        <PlaceholderModule
          name='System Settings'
          icon='⚙️'
          description='TerraFusion OS Configuration & Preferences.'
          status='coming-soon'
        />
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
