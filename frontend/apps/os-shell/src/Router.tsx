import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

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
const App = lazy(() => import('./App'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const TerraFusionMarketplace = lazy(
  () => import('./components/marketplace/TerraFusionMarketplace')
);
const ExperimentsList = lazy(() => import('./pages/experiments/ExperimentsList'));
const CreateExperiment = lazy(() => import('./pages/experiments/CreateExperiment'));
const EliteExperimentalResearchInterface = lazy(
  () => import('./components/elite/EliteExperimentalResearchInterface')
);
const NotificationPreferences = lazy(
  () => import('./components/codex/NotificationPreferences')
);

// Gen2 Module Routes
const TerraForgeGen2 = lazy(() => import('./pages/gen2/TerraForgeGen2'));
const TerraDossierGen2 = lazy(() => import('./pages/gen2/TerraDossierGen2'));

const Router: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path='/' element={<App />} />
          <Route path='/monitoring' element={<Monitoring />} />
          <Route path='/marketplace' element={<TerraFusionMarketplace />} />
          <Route path='/experiments' element={<ExperimentsList />} />
          <Route path='/experiments/create' element={<CreateExperiment />} />
          <Route path='/elite-research' element={<EliteExperimentalResearchInterface />} />
          <Route path='/codex/preferences' element={<NotificationPreferences />} />

          {/* Gen2 Module Routes - Internal OS modules */}
          <Route path='/gen2/terraforge' element={<TerraForgeGen2 />} />
          <Route path='/gen2/dossier' element={<TerraDossierGen2 />} />

          <Route path='/modules/*' element={<div>Module Loading...</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
