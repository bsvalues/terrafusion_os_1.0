/**
 * Forge Regression Store (Phase 16B → Wave 3)
 * ===================================================================
 * Zustand store for regression model management, run history,
 * version comparison, and model promotion.
 *
 * API-only: calls /api/costforge/analytics/regression/* via regressionAPI.
 * No synthetic fallback is allowed on operational regression surfaces.
 * Separate lifecycle from forgeStatisticsStore — this is Regression-scoped.
 */

import { create } from 'zustand';
import { regressionAPI } from '@/services/forge/regressionAPI';
import type {
  RegressionModelRecord,
  RegressionRunRecord,
  ModelVersionComparison,
} from '@/types/forgeRegression';

// ============================================================================
// Store Interface
// ============================================================================

interface ForgeRegressionState {
  models: RegressionModelRecord[];
  runs: RegressionRunRecord[];
  selectedModelId: string | null;
  comparison: ModelVersionComparison | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchModels: () => Promise<void>;
  selectModel: (id: string | null) => void;
  promoteModel: (id: string, status: 'draft' | 'validated' | 'production') => void;
  compareVersions: (idA: string, idB: string) => void;
  runRegression: (config: { modelType: string; variables: string[] }) => Promise<RegressionRunRecord>;
}

// ============================================================================
// Helpers
// ============================================================================

function computeComparison(
  modelA: RegressionModelRecord,
  modelB: RegressionModelRecord,
): ModelVersionComparison {
  // Build coefficient deltas from union of both variable sets
  const allVars = new Set([
    ...modelA.coefficients.map((c) => c.variable),
    ...modelB.coefficients.map((c) => c.variable),
  ]);

  const coefficientDeltas = Array.from(allVars).map((variable) => {
    const cA = modelA.coefficients.find((c) => c.variable === variable);
    const cB = modelB.coefficients.find((c) => c.variable === variable);
    const estimateA = cA?.estimate ?? 0;
    const estimateB = cB?.estimate ?? 0;
    return {
      variable,
      estimateA,
      estimateB,
      delta: estimateB - estimateA,
      significantA: cA?.significant ?? false,
      significantB: cB?.significant ?? false,
      signChange: Math.sign(estimateA) !== Math.sign(estimateB) && estimateA !== 0 && estimateB !== 0,
    };
  });

  const metricDeltas = {
    rSquared: modelB.rSquared - modelA.rSquared,
    adjustedRSquared: modelB.adjustedRSquared - modelA.adjustedRSquared,
    aic: modelB.aic - modelA.aic,
    bic: modelB.bic - modelA.bic,
    mse: modelB.mse - modelA.mse,
  };

  // For R², adjR²: higher is better. For AIC, BIC, MSE: lower is better.
  const improved: string[] = [];
  const degraded: string[] = [];

  if (metricDeltas.rSquared > 0) improved.push('rSquared'); else if (metricDeltas.rSquared < 0) degraded.push('rSquared');
  if (metricDeltas.adjustedRSquared > 0) improved.push('adjustedRSquared'); else if (metricDeltas.adjustedRSquared < 0) degraded.push('adjustedRSquared');
  if (metricDeltas.aic < 0) improved.push('aic'); else if (metricDeltas.aic > 0) degraded.push('aic');
  if (metricDeltas.bic < 0) improved.push('bic'); else if (metricDeltas.bic > 0) degraded.push('bic');
  if (metricDeltas.mse < 0) improved.push('mse'); else if (metricDeltas.mse > 0) degraded.push('mse');

  return {
    modelA: { id: modelA.id, name: modelA.name, version: modelA.version, record: modelA },
    modelB: { id: modelB.id, name: modelB.name, version: modelB.version, record: modelB },
    coefficientDeltas,
    metricDeltas,
    improved,
    degraded,
  };
}

// ============================================================================
// Store
// ============================================================================

export const useForgeRegressionStore = create<ForgeRegressionState>((set, get) => ({
  models: [],
  runs: [],
  selectedModelId: null,
  comparison: null,
  loading: false,
  error: null,

  fetchModels: async () => {
    set({ loading: true, error: null });
    try {
      const history = await regressionAPI.getHistory(50);
      const apiRuns: RegressionRunRecord[] = history.results.map((h) => ({
        id: h.id,
        modelId: h.dependentVariable || 'api',
        modelType: 'OLS' as const,
        rSquared: h.rSquared,
        adjustedRSquared: h.adjustedRSquared,
        timestamp: h.createdAt,
        variables: [],
        status: 'completed' as const,
      }));
      set({
        models: [],
        runs: apiRuns,
        loading: false,
        error: apiRuns.length === 0
          ? 'No governed regression models or run history returned by the backend.'
          : 'Saved regression model registry unavailable; run history only.',
      });
    } catch {
      set({
        models: [],
        runs: [],
        loading: false,
        error: 'Regression API unavailable.',
      });
    }
  },

  selectModel: (id) => {
    set({ selectedModelId: id });
  },

  promoteModel: (id, status) => {
    set((state) => ({
      models: state.models.map((m) =>
        m.id === id ? { ...m, status } : m,
      ),
    }));
  },

  compareVersions: (idA, idB) => {
    const { models } = get();
    const modelA = models.find((m) => m.id === idA);
    const modelB = models.find((m) => m.id === idB);
    if (!modelA || !modelB) return;
    set({ comparison: computeComparison(modelA, modelB) });
  },

  runRegression: async (config) => {
    set({ loading: true, error: null });
    try {
      const result = await regressionAPI.runRegression({
        observations: [],
        featureNames: config.variables,
        dependentVariable: config.modelType,
      });
      const newRun: RegressionRunRecord = {
        id: result.id,
        modelId: 'api',
        modelType: config.modelType as 'OLS' | 'GWR' | 'Quantile',
        rSquared: result.rSquared,
        adjustedRSquared: result.adjustedRSquared,
        timestamp: result.createdAt,
        variables: config.variables,
        status: 'completed',
      };
      set((state) => ({
        runs: [newRun, ...state.runs],
        loading: false,
      }));
      return newRun;
    } catch {
      set({
        loading: false,
        error: 'Regression API unavailable or no governed observations were provided.',
      });
      throw new Error('Regression API unavailable or no governed observations were provided.');
    }
  },
}));
