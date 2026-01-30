/**
 * CostForge AI Simulation Store
 *
 * State machine for property assessment AI simulation.
 * Manages the analysis lifecycle: idle → analyzing → ready → optimized
 *
 * @module modules/dashboard/stores/costforgeStore
 * @see Phase C4: CostForge AI Integration
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Design Tokens
// ============================================================================

/**
 * TerraFusion motion tokens for animation timing.
 * Uses phi-based ratios for natural feel.
 */
export const TF_TOKENS = {
  motion: {
    /** Analysis delay in ms (phi * 1000) */
    analysisDelayMs: 1618,
    /** Optimization commit delay */
    optimizationDelayMs: 382,
    /** Number tween duration */
    tweenDurationMs: 800,
  },
} as const;

// ============================================================================
// Types
// ============================================================================

export type CostForgeStatus = 'idle' | 'analyzing' | 'ready' | 'optimized';

export interface AssessmentMetrics {
  /** Current assessed value */
  currentValue: number;
  /** AI-projected optimized value */
  projectedValue: number;
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Value delta (projectedValue - currentValue) */
  delta: number;
  /** Comparable sales count */
  comparableSales: number;
  /** Market trend percentage */
  marketTrend: number;
  /** Analysis factors with weights */
  factors: AssessmentFactor[];
}

export interface AssessmentFactor {
  name: string;
  value: number;
  weight: number;
}

export interface CostForgeState {
  // State
  status: CostForgeStatus;
  metrics: AssessmentMetrics;
  lastAnalysisTime: string | null;
  error: string | null;

  // Actions
  startAnalysis: () => void;
  completeAnalysis: (metrics: Partial<AssessmentMetrics>) => void;
  applyOptimization: () => void;
  reset: () => void;
  setError: (error: string) => void;

  // Selectors
  isAnalyzing: () => boolean;
  isOptimized: () => boolean;
  getFormattedValue: () => string;
  getFormattedProjectedValue: () => string;
}

// ============================================================================
// Initial State
// ============================================================================

const DEFAULT_FACTORS: AssessmentFactor[] = [
  { name: 'Location Score', value: 92, weight: 0.3 },
  { name: 'Property Condition', value: 88, weight: 0.25 },
  { name: 'Market Comparable', value: 95, weight: 0.25 },
  { name: 'Economic Factors', value: 90, weight: 0.2 },
];

const INITIAL_METRICS: AssessmentMetrics = {
  currentValue: 425000,
  projectedValue: 442000,
  confidence: 94.2,
  delta: 17000,
  comparableSales: 12,
  marketTrend: 3.2,
  factors: DEFAULT_FACTORS,
};

// ============================================================================
// Store
// ============================================================================

export const useCostForgeStore = create<CostForgeState>()(
  devtools(
    (set, get) => ({
      // Initial State
      status: 'idle',
      metrics: INITIAL_METRICS,
      lastAnalysisTime: null,
      error: null,

      // Actions
      startAnalysis: () => {
        set({
          status: 'analyzing',
          error: null,
        });
      },

      completeAnalysis: (metrics: Partial<AssessmentMetrics>) => {
        const currentMetrics = get().metrics;
        const newMetrics = {
          ...currentMetrics,
          ...metrics,
        };

        // Recalculate delta
        newMetrics.delta = newMetrics.projectedValue - newMetrics.currentValue;

        set({
          status: 'ready',
          metrics: newMetrics,
          lastAnalysisTime: new Date().toISOString(),
        });
      },

      applyOptimization: () => {
        const { metrics } = get();

        // Commit projected value to current, zero out delta
        set({
          status: 'optimized',
          metrics: {
            ...metrics,
            currentValue: metrics.projectedValue,
            delta: 0,
          },
        });
      },

      reset: () => {
        set({
          status: 'idle',
          metrics: INITIAL_METRICS,
          lastAnalysisTime: null,
          error: null,
        });
      },

      setError: (error: string) => {
        set({
          status: 'idle',
          error,
        });
      },

      // Selectors
      isAnalyzing: () => get().status === 'analyzing',
      isOptimized: () => get().status === 'optimized',

      getFormattedValue: () => {
        const value = get().metrics.currentValue;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);
      },

      getFormattedProjectedValue: () => {
        const value = get().metrics.projectedValue;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);
      },
    }),
    { name: 'costforge-store' }
  )
);

// ============================================================================
// Simulation Helpers
// ============================================================================

/**
 * Runs a simulated AI analysis with realistic delay.
 * @param onComplete - Callback when analysis completes
 */
export const runSimulatedAnalysis = (
  onComplete?: (metrics: Partial<AssessmentMetrics>) => void
): Promise<void> => {
  const store = useCostForgeStore.getState();

  return new Promise((resolve) => {
    store.startAnalysis();

    // Simulate AI processing time (phi-based delay)
    setTimeout(() => {
      // Generate slightly randomized metrics for realism
      const variance = 0.02; // 2% variance
      const baseValue = 425000;
      const projectedValue = Math.round(baseValue * (1 + 0.04 + (Math.random() - 0.5) * variance));
      const confidence = 92 + Math.random() * 5;

      const metrics: Partial<AssessmentMetrics> = {
        projectedValue,
        confidence: Math.round(confidence * 10) / 10,
        comparableSales: 10 + Math.floor(Math.random() * 5),
        marketTrend: Math.round((2 + Math.random() * 3) * 10) / 10,
      };

      store.completeAnalysis(metrics);
      onComplete?.(metrics);
      resolve();
    }, TF_TOKENS.motion.analysisDelayMs);
  });
};

export default useCostForgeStore;
