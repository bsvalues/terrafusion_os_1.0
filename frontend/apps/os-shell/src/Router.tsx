import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/errors/ErrorBoundary';

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'>
    <div className='text-center'>
      <div className='inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4'></div>
      <p className='text-gray-300 text-lg'>Loading TerraFusion OS...</p>
    </div>
  </div>
);

// Lazy load route components for code splitting
// Shell Home - OS Landing Surface (Phase 5)
const ShellHome = lazy(() => import('./shell/home/ShellHome'));
// Desktop Shell - Full Windows-like experience
const App = lazy(() => import('./App'));
// Property Workbench - Parcel-context hub (Tier-0 OS Surface)
const PropertyWorkbench = lazy(() => import('./pages/workbench/PropertyWorkbench'));
const PropertySummary = lazy(() => import('./pages/workbench/tabs/PropertySummary'));
const PropertyForge = lazy(() => import('./pages/workbench/tabs/PropertyForge'));
const PropertyAtlas = lazy(() => import('./pages/workbench/tabs/PropertyAtlas'));
const PropertyDais = lazy(() => import('./pages/workbench/tabs/PropertyDais'));
const PropertyDossier = lazy(() => import('./pages/workbench/tabs/PropertyDossier'));
const PropertyPilot = lazy(() => import('./pages/workbench/tabs/PropertyPilot'));

const Monitoring = lazy(() => import('./pages/Monitoring'));
const TerraFusionMarketplace = lazy(
  () => import('./components/marketplace/TerraFusionMarketplace')
);
const ExperimentsList = lazy(() => import('./pages/experiments/ExperimentsList'));
const CreateExperiment = lazy(() => import('./pages/experiments/CreateExperiment'));
const EliteExperimentalResearchInterface = lazy(
  () => import('./components/elite/EliteExperimentalResearchInterface')
);
const NotificationPreferences = lazy(() => import('./components/codex/NotificationPreferences'));

// Gen2 Module Routes
const TerraForgeGen2 = lazy(() => import('./pages/gen2/TerraForgeGen2'));
const TerraDossierGen2 = lazy(() => import('./pages/gen2/TerraDossierGen2'));

// Suite Wrappers (Phase 5: MWUX Slices)
const TerraPrimeSuite = lazy(() => import('./pages/suites/TerraPrimeSuite'));

// GovernanceLock - Pilot Console (single choke point UI)
const PilotConsole = lazy(() => import('./pages/PilotConsole'));

// GovernanceLock - Dashboard (role-gated metrics)
const GovernanceDashboard = lazy(() => import('./pages/GovernanceDashboard'));
const PilotApiDemo = lazy(() => import('./pages/PilotApiDemo'));

// Phase 1: Error Display Demo (visual verification)
const ErrorDisplayDemo = lazy(() => import('./pages/ErrorDisplayDemo'));

// Phase 2: Pilot Tool Invocation Demo (read-only vertical slice)
const PilotDemo = lazy(() => import('./pages/PilotDemo'));

const Router: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Phase 5: OS Landing Surface */}
            <Route
              path='/'
              element={
                <div className='min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'>
                  <ShellHome />
                </div>
              }
            />

            {/* Desktop Shell - Full Windows-like experience */}
            <Route path='/desktop' element={<App />} />

            {/* Property Workbench - Parcel-context hub (Tier-0 OS Surface) */}
            <Route path='/property/:parcelId' element={<PropertyWorkbench />}>
              <Route index element={<PropertySummary />} />
              <Route path='forge' element={<PropertyForge />} />
              <Route path='atlas' element={<PropertyAtlas />} />
              <Route path='dais' element={<PropertyDais />} />
              <Route path='dossier' element={<PropertyDossier />} />
              <Route path='pilot' element={<PropertyPilot />} />
            </Route>

            {/* Legacy Redirects - Demote broken defaults */}
            <Route path='/modules/property-workbench' element={<Navigate to='/' replace />} />
            <Route path='/modules/property-workbench/*' element={<Navigate to='/' replace />} />

            <Route path='/monitoring' element={<Monitoring />} />
            <Route path='/marketplace' element={<TerraFusionMarketplace />} />
            <Route path='/experiments' element={<ExperimentsList />} />
            <Route path='/experiments/create' element={<CreateExperiment />} />
            <Route path='/elite-research' element={<EliteExperimentalResearchInterface />} />
            <Route path='/codex/preferences' element={<NotificationPreferences />} />

            {/* Gen2 Module Routes - Internal OS modules */}
            <Route path='/gen2/terraforge' element={<TerraForgeGen2 />} />
            <Route path='/gen2/dossier' element={<TerraDossierGen2 />} />

            {/* Suite Routes (Phase 5: MWUX Slices) */}
            <Route path='/suites/terra-prime/*' element={<TerraPrimeSuite />} />

            {/* GovernanceLock - Single Choke Point UI */}
            <Route path='/pilot' element={<PilotConsole />} />

            {/* GovernanceLock - Dashboard (role-gated) */}
            <Route path='/pilot/dashboard' element={<GovernanceDashboard />} />
            <Route path='/pilot/api' element={<PilotApiDemo />} />

            {/* Phase 1: Error Display Demo */}
            <Route path='/error-demo' element={<ErrorDisplayDemo />} />

            {/* Phase 2: Pilot Tool Invocation Demo */}
            <Route path='/pilot-demo' element={<PilotDemo />} />

            {/* Legacy module routes - redirect to home */}
            <Route path='/modules/*' element={<Navigate to='/' replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Router;
