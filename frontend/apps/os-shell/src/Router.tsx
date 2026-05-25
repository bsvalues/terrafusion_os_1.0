import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthGuard, AuthProvider } from './auth/AuthProvider';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { LegacyRedirect } from './components/legacy/LegacyRedirect';
import { getViteEnv } from './env/getViteEnv';
import { activateFromRoute } from './orchestration/moduleActivation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

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
const PropertyTrace = lazy(() => import('./pages/workbench/tabs/PropertyTrace'));
const PropertyClerk = lazy(() => import('./pages/workbench/tabs/PropertyClerk'));
const PropertyTreasury = lazy(() => import('./pages/workbench/tabs/PropertyTreasury'));
const PropertyAudit = lazy(() => import('./pages/workbench/tabs/PropertyAudit'));

// OPS-1-B: Sync Readiness Console — read-only operator control
// surface that consumes the OPS-1-A backend facade. Per the OPS-1
// policy at docs/workbench/sync-readiness-console-policy.md.
const SyncReadinessConsole = lazy(
  () => import('./pages/workbench/sync-readiness/SyncReadinessConsole'),
);

// DASHBOARD-1: Sync Doctrine Console — read-only status board for
// the doctrine pipeline. Sibling to sync-readiness; renders the
// snapshot from /api/sync/doctrine/state across canonical/truth/
// raw/quarantine layers. Polls every 30s.
const SyncDoctrineConsole = lazy(
  () => import('./pages/workbench/sync-doctrine/SyncDoctrineConsole'),
);

// SYNC-UX-1A: Sync Quarantine Triage — read-write operator surface
// for the imprv-attr quarantine cohort. Lives at /workbench/sync/*
// (new namespace, sibling to sync-doctrine). Wraps the
// SYNC-WORKBENCH-F triage controller (route + dismiss decisions).
const SyncQuarantinePage = lazy(
  () => import('./pages/workbench/sync-quarantine/SyncQuarantinePage'),
);

// SYNC-UX-1B: Sync Commits page — operator surface for the
// SYNC-WORKBENCH-G/H spine. Lists recent decision-commits, drills
// into a single commit's snapshot, and downloads the signed
// evidence ZIP / inspects the manifest.
const SyncCommitsPage = lazy(
  () => import('./pages/workbench/sync-commits/SyncCommitsPage'),
);

// SYNC-UX-1C: Full-Corpus Sync Runner — launcher + detail page
// for durable 6+ hour PACS drains. Sibling to sync-readiness and
// sync-doctrine; consumes /api/sync/corpus/* (FullCorpusController).
const SyncCorpusPage = lazy(
  () => import('./pages/workbench/sync-corpus/SyncCorpusPage'),
);

const Monitoring = lazy(() => import('./pages/Monitoring'));
const TerraFusionMarketplace = lazy(
  () => import('./components/marketplace/TerraFusionMarketplace')
);
const ResearchPortal = lazy(() => import('./components/research/ResearchPortal'));
const ResearchProviders = lazy(() => import('./context/ResearchContext'));
const ExperimentsList = lazy(() => import('./pages/experiments/ExperimentsList'));
const CreateExperiment = lazy(() => import('./pages/experiments/CreateExperiment'));
const NotificationPreferences = lazy(() => import('./components/codex/NotificationPreferences'));

// TerraForge County Studio (Plan 2) + Atlas Live View (Plan 3)
const CountyStudyPage = lazy(() =>
  import('./pages/forge/county-studio/CountyStudyPage').then((m) => ({ default: m.CountyStudyPage }))
);
const AtlasLivePage = lazy(() =>
  import('./pages/forge/atlas-live/AtlasLivePage').then((m) => ({ default: m.AtlasLivePage }))
);

// Gen2 Module Routes
const TerraForgeGen2 = lazy(() => import('./pages/gen2/TerraForgeGen2'));
const TerraDossierGen2 = lazy(() => import('./pages/gen2/TerraDossierGen2'));
const TerraLevyGen2 = lazy(() => import('./pages/gen2/TerraLevyGen2'));

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
const PilotDemo = lazy(() => import('./pages/PilotDemo').then((m) => ({ default: m.PilotDemo })));

// Phase 7: Dev-only Legacy Burn-Down Viewer
const LegacyMetricsViewer = lazy(() => import('./pages/dev/LegacyMetricsViewer'));

// Phase 17: Login page (auth redirect target)
const LoginPage = lazy(() => import('./pages/LoginPage'));

const ModuleRouteHandoff: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const navigate = useNavigate();

  useEffect(() => {
    void activateFromRoute(moduleId);
    navigate('/', { replace: true });
  }, [moduleId, navigate]);

  return <LoadingFallback />;
};

const Router: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
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

                {/* ══════════════════════════════════════════════════════════
                    TerraFusion OS Desktop — persistent shell chrome layout.
                    All OS routes nest here so Taskbar/TopBar/CommandPalette
                    remain mounted across navigations.
                    ══════════════════════════════════════════════════════════ */}
                <Route path='/' element={<App />}>
                  {/* Home — Desktop internally shows StageZeroState + icons */}
                  <Route index element={null} />

                  {/* Shell Home — deprecated; redirects to Desktop (Phase 7) */}
                  <Route path='home' element={<Navigate to='/' replace />} />

                  {/* Legacy: /desktop redirects to home */}
                  <Route path='desktop' element={<Navigate to='/' replace />} />

                  {/* Legacy: /launchpad bookmarks redirect to home */}
                  <Route
                    path='launchpad'
                    element={<LegacyRedirect to='/' legacyAppId='launchpad.legacy-route' />}
                  />

                  {/* Property Search — native TerraPrime replacement */}
                  <Route path='property' element={<PropertySearch />} />

                  {/* Property Workbench - Parcel-context hub (Tier-0 OS Surface) */}
                  <Route path='property/:parcelId' element={<PropertyWorkbench />}>
                    <Route index element={<PropertySummary />} />
                    <Route path='summary' element={<PropertySummary />} />
                    <Route path='forge' element={<PropertyForge />} />
                    <Route path='atlas' element={<PropertyAtlas />} />
                    <Route path='dais' element={<PropertyDais />} />
                    <Route path='clerk' element={<PropertyClerk />} />
                    <Route path='treasury' element={<PropertyTreasury />} />
                    <Route path='audit' element={<PropertyAudit />} />
                    <Route path='dossier' element={<PropertyDossier />} />
                    <Route path='pilot' element={<PropertyPilot />} />
                    <Route path='trace' element={<PropertyTrace />} />
                  </Route>

                  {/* Legacy Redirects - Demote broken defaults with telemetry */}
                  <Route
                    path='modules/property-workbench'
                    element={<LegacyRedirect to='/' legacyAppId='modules.property-workbench' />}
                  />
                  <Route
                    path='modules/property-workbench/*'
                    element={<LegacyRedirect to='/' legacyAppId='modules.property-workbench' />}
                  />

                  {/* OPS-1-B: Sync Readiness Console */}
                  <Route
                    path='workbench/sync-readiness'
                    element={<SyncReadinessConsole />}
                  />

                  {/* DASHBOARD-1: Sync Doctrine Console (sibling) */}
                  <Route
                    path='workbench/sync-doctrine'
                    element={<SyncDoctrineConsole />}
                  />

                  {/* SYNC-UX-1A: Sync Quarantine Triage (read-write) */}
                  <Route
                    path='workbench/sync/quarantine'
                    element={<SyncQuarantinePage />}
                  />

                  {/* SYNC-UX-1B: Workbench commits + evidence UI */}
                  <Route
                    path='workbench/sync/commits'
                    element={<SyncCommitsPage />}
                  />
                  <Route
                    path='workbench/sync/commits/:commitId'
                    element={<SyncCommitsPage />}
                  />

                  {/* SYNC-UX-1C: Full-Corpus Sync Runner */}
                  <Route
                    path='workbench/sync/corpus'
                    element={<SyncCorpusPage />}
                  />
                  <Route
                    path='workbench/sync/corpus/:runId'
                    element={<SyncCorpusPage />}
                  />

                  <Route path='monitoring' element={<Monitoring />} />
                  <Route path='marketplace' element={<TerraFusionMarketplace />} />
                  <Route
                    path='elite-research'
                    element={
                      <ResearchProviders>
                        <ResearchPortal />
                      </ResearchProviders>
                    }
                  />
                  <Route path='experiments' element={<ExperimentsList />} />
                  <Route path='experiments/create' element={<CreateExperiment />} />
                  <Route path='codex/preferences' element={<NotificationPreferences />} />

                  {/* Gen2 Module Routes - Internal OS modules */}
                  <Route path='gen2/terraforge' element={<TerraForgeGen2 />} />
                  <Route path='gen2/dossier' element={<TerraDossierGen2 />} />
                    <Route path='gen2/terralevy' element={<TerraLevyGen2 />} />

                  {/* Suite Routes (Phase 5: MWUX Slices) */}
                  {/* TerraPrime → migrated to native PropertySearch (legacy redirect with telemetry) */}
                  <Route path='suites/terra-prime/*' element={<LegacyRedirect to='/property' legacyAppId='suites.terra-prime' />} />

                  {/* Constitutional Suite Home Routes (Phase 9) */}
                  <Route path='forge' element={<ForgeHome />} />
                  {/* TerraForge County Studio */}
                  <Route path='forge/county-studio' element={<CountyStudyPage />} />
                  {/* Atlas Live View */}
                  <Route path='forge/atlas-live' element={<AtlasLivePage />} />
                  <Route path='atlas' element={<AtlasHome />} />
                  <Route path='dais' element={<DaisHome />} />
                  <Route path='dossier' element={<DossierHome />} />
                  <Route path='gpt' element={<GptHome />} />

                  {/* GovernanceLock - Single Choke Point UI (Slice 6: StandaloneHomeShell) */}
                  <Route path='pilot' element={<PilotHome />} />
                  {/* Legacy: Direct PilotConsole (for backwards compat during transition) */}
                  <Route path='pilot/legacy' element={<PilotConsole />} />
                  {/* Slice 6.1: TerraTrace - Observability & Telemetry */}
                  <Route path='trace' element={<TraceHome />} />
                  {/* Phase 30: TerraCanon - Integrated Development Environment */}
                  <Route path='canon' element={<CanonHome />} />

                  {/* GovernanceLock - Dashboard (role-gated) */}
                  <Route path='pilot/dashboard' element={<GovernanceDashboard />} />
                  <Route path='pilot/api' element={<PilotApiDemo />} />

                  {/* Phase 1: Error Display Demo */}
                  <Route path='error-demo' element={<ErrorDisplayDemo />} />

                  {/* Phase 2: Pilot Tool Invocation Demo */}
                  <Route path='pilot-demo' element={<PilotDemo />} />

                  {/* Phase 7: Dev-only Legacy Burn-Down Viewer (always registered, element guards) */}
                  <Route
                    path='dev/legacy-metrics'
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
                    path='modules/*'
                    element={<LegacyRedirect to='/' legacyAppId='modules.unknown' />}
                  />
                </Route>
              </Routes>
            </AuthGuard>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
    </QueryClientProvider>
  );
};

export default Router;
