/**
 * CostForge Simulation Tests
 *
 * Tests for the CostForge AI simulation state machine.
 * Verifies state transitions, timing, and value commits.
 *
 * @module modules/dashboard/__tests__/CostforgeSimulation.test
 * @see Phase C4: CostForge AI Integration
 */

import { act, renderHook } from '@testing-library/react';

import { useCostforgeStore } from '../store/costforgeStore';

// Tests run with mock data so initial metrics use GOLDEN_METRICS
vi.mock('../../../config/features', () => ({
  FEATURES: { USE_MOCK_DATA: true },
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  // Reset store before each test
  act(() => {
    useCostforgeStore.getState().reset();
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('CostForge Simulation - Phase C4', () => {
  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('initial state', () => {
    it('starts in idle status', () => {
      const { result } = renderHook(() => useCostforgeStore());
      expect(result.current.status).toBe('idle');
    });

    it('has default metrics with assessed value', () => {
      const { result } = renderHook(() => useCostforgeStore());
      expect(result.current.metrics.assessedValue.current).toBe(1240000);
      expect(result.current.metrics.assessedValue.projected).toBe(1185000);
    });

    it('has tax liability metric', () => {
      const { result } = renderHook(() => useCostforgeStore());
      expect(result.current.metrics.taxLiability).toBeDefined();
      expect(result.current.metrics.taxLiability.current).toBe(14500);
    });

    it('has GRM metric', () => {
      const { result } = renderHook(() => useCostforgeStore());
      expect(result.current.metrics.grm).toBeDefined();
      expect(result.current.metrics.grm.format).toBe('multiplier');
    });
  });

  // ==========================================================================
  // State Transitions
  // ==========================================================================

  describe('state transitions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('transitions from idle to analyzing on runAnalysis', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // Start analysis (don't await - check immediate state)
      act(() => {
        result.current.runAnalysis();
      });

      expect(result.current.status).toBe('analyzing');
    });

    it('transitions from analyzing to ready after delay', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      act(() => {
        result.current.runAnalysis();
      });

      // Fast-forward past the analysis delay (phi-based: 1618ms)
      await act(async () => {
        vi.advanceTimersByTime(1618);
      });

      expect(result.current.status).toBe('ready');
    });

    it('transitions from ready to optimized on apply', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // Run through to ready state
      act(() => {
        result.current.runAnalysis();
      });
      await act(async () => {
        vi.advanceTimersByTime(1618);
      });

      expect(result.current.status).toBe('ready');

      act(() => {
        result.current.applyOptimization();
      });

      expect(result.current.status).toBe('optimized');
    });

    it('reset returns to idle', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // Run through to optimized state
      act(() => {
        result.current.runAnalysis();
      });
      await act(async () => {
        vi.advanceTimersByTime(1618);
      });
      act(() => {
        result.current.applyOptimization();
      });

      expect(result.current.status).toBe('optimized');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
    });
  });

  // ==========================================================================
  // Optimization Commit Logic
  // ==========================================================================

  describe('optimization commit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('applyOptimization commits projected to current', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // Get to ready state
      act(() => {
        result.current.runAnalysis();
      });
      await act(async () => {
        vi.advanceTimersByTime(1618);
      });

      const projectedBefore = result.current.metrics.assessedValue.projected;

      act(() => {
        result.current.applyOptimization();
      });

      expect(result.current.metrics.assessedValue.current).toBe(projectedBefore);
    });

    it('applyOptimization zeros all deltas', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // Get to ready state
      act(() => {
        result.current.runAnalysis();
      });
      await act(async () => {
        vi.advanceTimersByTime(1618);
      });

      act(() => {
        result.current.applyOptimization();
      });

      expect(result.current.metrics.assessedValue.delta).toBe(0);
      expect(result.current.metrics.taxLiability.delta).toBe(0);
      expect(result.current.metrics.grm.delta).toBe(0);
    });

    it('applyOptimization is idempotent (no-op if not ready)', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // In idle state
      const currentBefore = result.current.metrics.assessedValue.current;

      act(() => {
        result.current.applyOptimization();
      });

      // Should not change anything
      expect(result.current.status).toBe('idle');
      expect(result.current.metrics.assessedValue.current).toBe(currentBefore);
    });
  });

  // ==========================================================================
  // Idempotency
  // ==========================================================================

  describe('idempotency', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('runAnalysis is idempotent (only runs if idle)', async () => {
      const { result } = renderHook(() => useCostforgeStore());

      // Start first analysis
      act(() => {
        result.current.runAnalysis();
      });

      expect(result.current.status).toBe('analyzing');

      // Try to start again while analyzing
      act(() => {
        result.current.runAnalysis();
      });

      // Should still be analyzing (not restarted)
      expect(result.current.status).toBe('analyzing');
    });
  });

  // ==========================================================================
  // Metric Structure
  // ==========================================================================

  describe('metric structure', () => {
    it('each metric has required properties', () => {
      const { result } = renderHook(() => useCostforgeStore());
      const { assessedValue } = result.current.metrics;

      expect(assessedValue).toHaveProperty('label');
      expect(assessedValue).toHaveProperty('current');
      expect(assessedValue).toHaveProperty('projected');
      expect(assessedValue).toHaveProperty('delta');
      expect(assessedValue).toHaveProperty('format');
    });

    it('assessedValue format is currency', () => {
      const { result } = renderHook(() => useCostforgeStore());
      expect(result.current.metrics.assessedValue.format).toBe('currency');
    });

    it('grm format is multiplier', () => {
      const { result } = renderHook(() => useCostforgeStore());
      expect(result.current.metrics.grm.format).toBe('multiplier');
    });

    it('delta equals projected minus current', () => {
      const { result } = renderHook(() => useCostforgeStore());
      const { assessedValue } = result.current.metrics;

      expect(assessedValue.delta).toBe(assessedValue.projected - assessedValue.current);
    });
  });
});
