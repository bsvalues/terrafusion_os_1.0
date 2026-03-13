import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthGuard, AuthProvider } from './auth/AuthProvider';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { LegacyRedirect } from './components/legacy/LegacyRedirect';
import { CSSAmbientLayer } from './components/compositor/layers/CSSAmbientLayer';
import { getViteEnv } from './env/getViteEnv';

// CSS imports — design tokens must load for ShellHome route
import './styles/terrafusion-tokens.css';

import './styles/terrafusion-os.css';
import './App.css';

// Loading component for Suspense fallback — design tokens only (no raw Tailwind)
const LoadingFallback = () => (
  <div
    className='flex items-center justify-center min-h-screen'
    style={{ background: 'hsl(var(--tf-bg))' }}
  >
    <div className='text-center'>
      <div
        className='inline-block animate-spin rounded-full h-12 w-12 mb-4'
        style={{
          borderTop: '2px solid hsl(var(--tf-transcend-cyan-hs) 50%)',
          borderBottom: '2px solid hsl(var(--tf-transcend-cyan-hs) 50%)',
          borderLeft: '2px solid transparent',
          borderRight: '2px solid transparent',
        }}
      />
      <p style={{ color: 'hsl(var(--tf-muted))', fontSize: '1.1rem' }}>Loading TerraFusion OS...</p>
    </div>
  </div>
);

// Lazy load route components for code splitting
// Desktop Shell - OS windowed surface
const App = lazy(() => import('./App'));
// Shell Home - Primary OS landing surface with suite tiles, search, system health
const ShellHome = lazy(() => import('./shell/home/ShellHome'));
// Property Search - Native TerraPrime replacement (parcel browse/search → Workbench)
const PropertySearch = lazy(() => import('./pages/PropertySearch'));
// Property Workbench - Parcel-context hub (Tier-0 OS Surface)
const PropertyWorkbench = lazy(() => import('./pages/workbench/PropertyWorkbench'));
const PropertySummary = lazy(() => import('./pages/workbench/tabs/PropertySummary'));
const PropertyForge = lazy(() => import('./pages/workbench/tabs/PropertyForge'));
const PropertyAtlas = lazy(() => import('./pages/workbench/tabs/PropertyAtlas'));
const PropertyDais = lazy(() => import('./pages/workbench/tabs/PropertyDais'));
const PropertyDossier = lazy(() => import('./pages/workbench/tabs/PropertyDossier'));
const PropertyPilot = lazy(() => import('./pages/workbench/tabs/PropertyPilot'));
const PropertyClerk = lazy(() => import('./pages/workbench/tabs/PropertyClerk'));
const PropertyTreasury = lazy(() => import('./pages/workbench/tabs/PropertyTreasury'));
const PropertyAudit = lazy(() => import('./pages/workbench/tabs/PropertyAudit'));

const Monitoring = lazy(() => import('./pages/Monitoring'));
const TerraFusionMarketplace = lazy(
  () => import('./components/marketplace/TerraFusionMarketplace')
);
const ExperimentsList = lazy(() => import('./pages/experiments/ExperimentsList'));
const CreateExperiment = lazy(() => import('./pages/experiments/CreateExperiment'));
const NotificationPreferences = lazy(() => import('./components/codex/NotificationPreferences'));

// Gen2 Module Routes
const TerraForgeGen2 = lazy(() => import('./pages/gen2/TerraForgeGen2'));
const TerraDossierGen2 = lazy(() => import('./pages/gen2/TerraDossierGen2'));

// Suite Wrappers (Phase 5: MWUX Slices)
// TerraPrimeSuite — replaced by native PropertySearch page (legacy redirect active)

// Suite Home Pages (Wave 2: Vivified Constitutional Suite Routes)
const ForgeHome = lazy(() => import('./pages/suites/ForgeSuiteHome'));
const AtlasHome = lazy(() => import('./pages/suites/AtlasSuiteHome'));
const DaisHome = lazy(() => import('./pages/suites/DaisSuiteHome'));
const DossierHome = lazy(() => import('./pages/suites/DossierSuiteHome'));
const GptHome = lazy(() => import('./pages/suites/GptSuiteHome'));

// GovernanceLock - Pilot Console (single choke point UI)
const PilotConsole = lazy(() => import('./pages/PilotConsole'));
// Slice 6: Standalone Home Shell for Pilot
const PilotHome = lazy(() => import('./pages/PilotHome'));
// Slice 6.1: Standalone Home Shell for Trace
const TraceHome = lazy(() => import('./pages/TraceHome'));
// Phase 30: TerraCanon IDE Shell
const CanonHome = lazy(() => import('./pages/CanonHome'));

// GovernanceLock - Dashboard (role-gated metrics)
const GovernanceDashboard = lazy(() => import('./pages/GovernanceDashboard'));
const PilotApiDemo = lazy(() => import('./pages/PilotApiDemo'));

// Phase 1: Error Display Demo (visual verification)
const ErrorDisplayDemo = lazy(() => import('./pages/ErrorDisplayDemo'));

// Phase 2: Pilot Tool Invocation Demo (read-only vertical slice)
const PilotDemo = lazy(() => import('./pages/PilotDemo'));

// Phase 7: Dev-only Legacy Burn-Down Viewer
const LegacyMetricsViewer = lazy(() => import('./pages/dev/LegacyMetricsViewer'));

// Phase 17: Login page (auth redirect target)
const LoginPage = lazy(() => import('./pages/LoginPage'));

const Router: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AuthGuard>
              <Routes>
                {/* Phase 18: Login (auth redirect target — AuthGuard exempts /login) */}
                <Route path='/login' element={<LoginPage />} />

                {/* TerraFusion OS Desktop — the real OS surface with windows, taskbar, start menu */}
                <Route path='/' element={<App />} />

                {/* Shell Home — alternative tile-based launcher (accessible via /home) */}
                <Route
                  path='/home'
                  element={
                    <div className='relative min-h-screen overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                      <CSSAmbientLayer />
                      <ShellHome className='relative z-10' />
                    </div>
                  }
                />

                {/* Legacy: /desktop still works */}
                <Route path='/desktop' element={<App />} />

                {/* Legacy: /launchpad bookmarks redirect to home */}
                <Route
                  path='/launchpad'
                  element={<LegacyRedirect to='/' legacyAppId='launchpad.legacy-route' />}
                />

                {/* Property Search — native TerraPrime replacement */}
                <Route path='/property' element={<PropertySearch />} />

                {/* Property Workbench - Parcel-context hub (Tier-0 OS Surface) */}
                <Route path='/property/:parcelId' element={<PropertyWorkbench />}>
                  <Route index element={<PropertySummary />} />
                  <Route path='forge' element={<PropertyForge />} />
                  <Route path='atlas' element={<PropertyAtlas />} />
                  <Route path='dais' element={<PropertyDais />} />
                  <Route path='clerk' element={<PropertyClerk />} />
                  <Route path='treasury' element={<PropertyTreasury />} />
                  <Route path='audit' element={<PropertyAudit />} />
                  <Route path='dossier' element={<PropertyDossier />} />
                  <Route path='pilot' element={<PropertyPilot />} />
                </Route>

                {/* Legacy Redirects - Demote broken defaults with telemetry */}
                <Route
                  path='/modules/property-workbench'
                  element={<LegacyRedirect to='/' legacyAppId='modules.property-workbench' />}
                />
                <Route
                  path='/modules/property-workbench/*'
                  element={<LegacyRedirect to='/' legacyAppId='modules.property-workbench' />}
                />

                <Route path='/monitoring' element={<Monitoring />} />
                <Route path='/marketplace' element={<TerraFusionMarketplace />} />
                <Route path='/experiments' element={<ExperimentsList />} />
                <Route path='/experiments/create' element={<CreateExperiment />} />
                <Route path='/codex/preferences' element={<NotificationPreferences />} />

                {/* Gen2 Module Routes - Internal OS modules */}
                <Route path='/gen2/terraforge' element={<TerraForgeGen2 />} />
                <Route path='/gen2/dossier' element={<TerraDossierGen2 />} />

                {/* Suite Routes (Phase 5: MWUX Slices) */}
                {/* TerraPrime → migrated to native PropertySearch (legacy redirect with telemetry) */}
                <Route path='/suites/terra-prime/*' element={<LegacyRedirect to='/property' legacyAppId='suites.terra-prime' />} />

                {/* Constitutional Suite Home Routes (Phase 9) */}
                <Route path='/forge' element={<ForgeHome />} />
                <Route path='/atlas' element={<AtlasHome />} />
                <Route path='/dais' element={<DaisHome />} />
                <Route path='/dossier' element={<DossierHome />} />
                <Route path='/gpt' element={<GptHome />} />

                {/* GovernanceLock - Single Choke Point UI (Slice 6: StandaloneHomeShell) */}
                <Route path='/pilot' element={<PilotHome />} />
                {/* Legacy: Direct PilotConsole (for backwards compat during transition) */}
                <Route path='/pilot/legacy' element={<PilotConsole />} />
                {/* Slice 6.1: TerraTrace - Observability & Telemetry */}
                <Route path='/trace' element={<TraceHome />} />
                {/* Phase 30: TerraCanon - Integrated Development Environment */}
                <Route path='/canon' element={<CanonHome />} />

                {/* GovernanceLock - Dashboard (role-gated) */}
                <Route path='/pilot/dashboard' element={<GovernanceDashboard />} />
                <Route path='/pilot/api' element={<PilotApiDemo />} />

                {/* Phase 1: Error Display Demo */}
                <Route path='/error-demo' element={<ErrorDisplayDemo />} />

                {/* Phase 2: Pilot Tool Invocation Demo */}
                <Route path='/pilot-demo' element={<PilotDemo />} />

                {/* Phase 7: Dev-only Legacy Burn-Down Viewer (always registered, element guards) */}
                <Route
                  path='/dev/legacy-metrics'
                  element={
                    getViteEnv().DEV ? (
                      <LegacyMetricsViewer />
                    ) : (
                      <div className='p-8 text-center' style={{ color: 'hsl(var(--tf-muted))' }}>
                        Dev-only route. Not available in production.
                      </div>
                    )
                  }
                />

                {/* Legacy module routes - redirect to home with telemetry */}
                <Route
                  path='/modules/*'
                  element={<LegacyRedirect to='/' legacyAppId='modules.unknown' />}
                />
              </Routes>
            </AuthGuard>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;
