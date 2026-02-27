import { TF_TOKENS } from '@/ui/theme/tokens';
import { create } from 'zustand';
import { FEATURES } from '../../../config/features';
import { GOLDEN_METRICS } from '../../../data/goldenParcel';
import api from '../../../services/api';

export type OptimizationStatus = 'idle' | 'analyzing' | 'ready' | 'optimized';

type MetricFormat = 'currency' | 'multiplier'; // GRM is a multiplier, not percent

export interface ValuationMetric {
  label: string;
  current: number;
  projected: number;
  delta: number;
  format: MetricFormat;
}

export interface CostforgeState {
  status: OptimizationStatus;
  metrics: {
    assessedValue: ValuationMetric;
    taxLiability: ValuationMetric;
    grm: ValuationMetric;
  };

  runAnalysis: () => Promise<void>;
  applyOptimization: () => void;
  reset: () => void;
}

const makeInitialMetrics = () => {
  if (FEATURES.USE_MOCK_DATA) {
    return GOLDEN_METRICS;
  }

  // Production/Reset state
  return {
    assessedValue: {
      label: 'Assessed Value',
      current: 0,
      projected: 0,
      delta: 0,
      format: 'currency' as const,
    },
    taxLiability: {
      label: 'Tax Liability',
      current: 0,
      projected: 0,
      delta: 0,
      format: 'currency' as const,
    },
    grm: {
      label: 'Effective GRM',
      current: 0,
      projected: 0,
      delta: 0,
      format: 'multiplier' as const,
    },
  };
};

// Unused helper removed or kept if needed for logic extension
// const computeDelta = (m: Omit<ValuationMetric, 'delta'>): number => m.projected - m.current;

export const useCostforgeStore = create<CostforgeState>((set, get) => {
  const INITIAL = makeInitialMetrics();

  return {
    status: 'idle',
    metrics: INITIAL,

    runAnalysis: async () => {
      const state = get();
      if (state.status !== 'idle') return; // idempotent

      set({ status: 'analyzing' });

      try {
        const res = await api.post('/costforge/calculate', {
          region: 'benton-wa',
          buildingType: 'residential',
        });

        // If someone reset during the request, don't resurrect
        if (get().status !== 'analyzing') return;

        const data = res.data;
        if (data?.totalCost) {
          const projected = data.totalCost;
          const current = state.metrics.assessedValue.current || projected;
          set({
            status: 'ready',
            metrics: {
              assessedValue: {
                ...state.metrics.assessedValue,
                current,
                projected,
                delta: projected - current,
              },
              taxLiability: {
                ...state.metrics.taxLiability,
                current: state.metrics.taxLiability.current || data.landValue ?? 0,
                projected: data.landValue ?? state.metrics.taxLiability.projected,
                delta: (data.landValue ?? state.metrics.taxLiability.projected) - (state.metrics.taxLiability.current || data.landValue ?? 0),
              },
              grm: state.metrics.grm,
            },
          });
          return;
        }
      } catch {
        // API unavailable — fall through to token-driven delay fallback
      }

      // Fallback: token-driven delay when API is offline
      if (get().status !== 'analyzing') return;
      const delayMs = (TF_TOKENS as any).motion?.analysisDelayMs ?? 1618;
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      if (get().status !== 'analyzing') return;

      set({ status: 'ready' });
    },

    applyOptimization: () => {
      const { status, metrics } = get();
      if (status !== 'ready') return;

      // Commit truth: current becomes projected; delta becomes 0; keep projected as “next target”
      const committed = Object.fromEntries(
        Object.entries(metrics).map(([k, m]) => {
          const nextCurrent = m.projected;
          const nextProjected = m.projected;
          const next = { ...m, current: nextCurrent, projected: nextProjected, delta: 0 };
          return [k, next];
        })
      ) as CostforgeState['metrics'];

      set({ status: 'optimized', metrics: committed });
    },

    reset: () => {
      set({ status: 'idle', metrics: makeInitialMetrics() });
    },
  };
});
