import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
      <p className="text-gray-300 text-lg">Loading TerraFusion OS...</p>
    </div>
  </div>
);

// Lazy load route components for code splitting
const App = lazy(() => import('./App'));
const Monitoring = lazy(() => import('./pages/Monitoring'));

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/modules/*" element={<div>Module Loading...</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
