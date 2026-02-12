/**
 * TerraLevy - Quantum Levy Management Module
 * Government. Transcended. - Championship Excellence
 *
 * Entry point for the TerraLevy module providing levy calculation,
 * scenario analysis, and revenue projection capabilities with
 * quantum optimization (factor 949) and AI-driven compliance.
 */

import React from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// TerraFusion Design System

// TerraLevy Components
import { LevyDashboard } from './components/LevyDashboard';
import { LevyMeasuresView } from './components/LevyMeasuresView';
import { LevyMeasureDetail } from './components/LevyMeasureDetail';
import { ScenariosListView } from './components/ScenariosListView';
import { CompareView } from './components/CompareView';
import { ProjectionsView } from './components/ProjectionsView';
import { LevyCalculatorView } from './components/LevyCalculatorView';

// API Client
import { LevyApiClient } from './api/levyApiClient';

// Module Context
import { LevyModuleProvider } from './context/LevyModuleContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { toastBridge } from './context/ToastContext';
import { emitTelemetry, initializeTelemetry } from './utils/telemetry';

// Quantum configuration
const QUANTUM_CONFIG = {
  factor: 949,
  targetAccuracy: 0.995,
  enableQuantumOptimization: true,
};

// Initialize telemetry on module load (no-op if feature flag disabled)
initializeTelemetry();

// Helper to render reasonable error messages
const normalizeErrorMessage = (error: unknown): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  const e = error as any;
  if (e?.message) return String(e.message);
  try { return JSON.stringify(e); } catch { return 'Unknown error'; }
};

const shouldSuppressErrorToast = (error: unknown): boolean => {
  const msg = normalizeErrorMessage(error).toLowerCase();
  // Avoid noise for common benign cases
  return (
    msg.includes('canceled') ||
    msg.includes('cancelled') ||
    msg.includes('abort')
  );
};

// React Query client with championship configuration and global error toasts
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const suppress = (query?.meta as any)?.suppressToast === true;
      if (!suppress && !shouldSuppressErrorToast(error)) {
        toastBridge.error(`Load failed: ${normalizeErrorMessage(error)}`);
      }
      // Emit lightweight telemetry for visibility
      try {
        emitTelemetry('rq_error', {
          type: 'query',
          key: (query as any)?.queryKey,
          message: normalizeErrorMessage(error),
        });
      } catch {}
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const suppress = (mutation?.meta as any)?.suppressToast === true;
      if (!suppress && !shouldSuppressErrorToast(error)) {
        toastBridge.error(`Action failed: ${normalizeErrorMessage(error)}`);
      }
      try {
        emitTelemetry('rq_error', {
          type: 'mutation',
          key: (mutation as any)?.options?.mutationKey,
          message: normalizeErrorMessage(error),
        });
      } catch {}
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes (v5: cacheTime -> gcTime)
      refetchOnWindowFocus: true,
      retry: 3,
    },
    mutations: {
      retry: 2,
    },
  },
});

/**
 * TerraLevy Module Root Component
 *
 * Provides routing, state management, and API client context
 * for all TerraLevy functionality.
 */
export const TerraLevyModule: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LevyModuleProvider config={QUANTUM_CONFIG}>
        <ToastProvider>
          <ErrorBoundary>
            <Router basename="/levy">
              <div className="terra-levy-module min-h-screen bg-terra-midnight">
                <Routes>
                  {/* Dashboard - Main landing */}
                  <Route path="/" element={<LevyDashboard />} />

                  {/* Levy Measures Management */}
                  <Route path="/measures" element={<LevyMeasuresView />} />
                  <Route path="/measures/:id" element={<LevyMeasureDetail />} />

                  {/* Scenario Analysis */}
                  <Route path="/scenarios" element={<ScenariosListView />} />
                  <Route path="/scenarios/compare" element={<CompareView />} />

                  {/* Revenue Projections */}
                  <Route path="/projections" element={<ProjectionsView />} />

                  {/* Levy Calculator */}
                  <Route path="/calculate" element={<LevyCalculatorView />} />
                </Routes>
              </div>
            </Router>
          </ErrorBoundary>
        </ToastProvider>
      </LevyModuleProvider>
    </QueryClientProvider>
  );
};

/**
 * Module initialization hook
 * Called by TerraFusion OS when module is loaded
 */
export const initializeTerraLevy = async (countyId: string) => {
  console.log(`🏛️ Initializing TerraLevy for county: ${countyId}`);
  console.log(`⚛️ Quantum Factor: ${QUANTUM_CONFIG.factor}`);
  console.log(`🎯 Target Accuracy: ${QUANTUM_CONFIG.targetAccuracy * 100}%`);

  // Validate API connectivity
  const apiClient = new LevyApiClient();
  const health = await apiClient.checkHealth();

  if (health.status === 'healthy') {
    console.log('✅ TerraLevy API connection established - Government. Transcended.');
    return { success: true, countyId, quantum: true };
  } else {
    console.error('❌ TerraLevy API connection failed');
    return { success: false, error: 'API unavailable' };
  }
};

/**
 * Module metadata for TerraFusion OS
 */
export const moduleMetadata = {
  name: 'terra-levy',
  displayName: 'TerraLevy - Quantum Levy Management',
  version: '1.0.0',
  category: 'government-finance',
  icon: 'balance-scale-quantum',
  quantumEnabled: true,
  accuracyTarget: 0.995,
  governmentCompliant: true,
};

// Default export for dynamic module loading
export default TerraLevyModule;
