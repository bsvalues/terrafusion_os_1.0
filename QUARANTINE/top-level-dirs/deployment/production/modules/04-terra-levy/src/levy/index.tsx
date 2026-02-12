/**
 * TerraLevy - Quantum Levy Management Module
 * Government. Transcended. - Championship Excellence
 *
 * Entry point for the TerraLevy module providing levy calculation,
 * scenario analysis, and revenue projection capabilities with
 * quantum optimization (factor 949) and AI-driven compliance.
 */

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// TerraLevy Components
import { CompareView } from './components/CompareView';
import { LevyCalculatorView } from './components/LevyCalculatorView';
import { LevyDashboard } from './components/LevyDashboard';
import { LevyMeasureDetail } from './components/LevyMeasureDetail';
import { LevyMeasuresView } from './components/LevyMeasuresView';
import { ProjectionsView } from './components/ProjectionsView';
import { ScenariosListView } from './components/ScenariosListView';

// BCBSLevy-style Components
import { BillImpactCalculator } from './components/BillImpactCalculator';
import { HistoricalAnalysis } from './components/HistoricalAnalysis';
import { PropertyTaxCalculator } from './components/PropertyTaxCalculator';

// Module Context
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LevyModuleProvider } from './context/LevyModuleContext';
import { toastBridge, ToastProvider } from './context/ToastContext';
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
  const e = error as { message?: string };
  if (e?.message) return String(e.message);
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
};

const shouldSuppressErrorToast = (error: unknown): boolean => {
  const msg = normalizeErrorMessage(error).toLowerCase();
  return msg.includes('canceled') || msg.includes('cancelled') || msg.includes('abort');
};

// React Query client with championship configuration
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const suppress = (query?.meta as { suppressToast?: boolean })?.suppressToast === true;
      if (!suppress && !shouldSuppressErrorToast(error)) {
        toastBridge.error(`Load failed: ${normalizeErrorMessage(error)}`);
      }
      try {
        emitTelemetry('rq_error', {
          type: 'query',
          key: query?.queryKey,
          message: normalizeErrorMessage(error),
        });
      } catch {
        /* ignore */
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const suppress = (mutation?.meta as { suppressToast?: boolean })?.suppressToast === true;
      if (!suppress && !shouldSuppressErrorToast(error)) {
        toastBridge.error(`Action failed: ${normalizeErrorMessage(error)}`);
      }
      try {
        emitTelemetry('rq_error', {
          type: 'mutation',
          key: mutation?.options?.mutationKey,
          message: normalizeErrorMessage(error),
        });
      } catch {
        /* ignore */
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
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
 */
export const TerraLevyModule: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LevyModuleProvider config={QUANTUM_CONFIG}>
        <ToastProvider>
          <ErrorBoundary>
            <Router>
              <div className="terra-levy-module min-h-screen bg-[#0A0E1A]">
                <Routes>
                  {/* Dashboard - Main landing */}
                  <Route path="/" element={<LevyDashboard />} />

                  {/* BCBSLevy-style Calculators */}
                  <Route path="/tax-calculator" element={<PropertyTaxCalculator />} />
                  <Route path="/impact" element={<BillImpactCalculator />} />
                  <Route path="/historical" element={<HistoricalAnalysis />} />

                  {/* Levy Measures Management */}
                  <Route path="/measures" element={<LevyMeasuresView />} />
                  <Route path="/measures/:id" element={<LevyMeasureDetail />} />

                  {/* Scenario Analysis */}
                  <Route path="/scenarios" element={<ScenariosListView />} />
                  <Route path="/scenarios/compare" element={<CompareView />} />

                  {/* Revenue Projections */}
                  <Route path="/projections" element={<ProjectionsView />} />

                  {/* Levy Calculator (AI-optimized) */}
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

export default TerraLevyModule;
