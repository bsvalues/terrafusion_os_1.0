/**
 * Layout Shift Probe - Cumulative Layout Shift (CLS) measurement utility
 *
 * Aggregates PerformanceObserver entries for 'layout-shift' type.
 * Provides a testable API for measuring visual stability.
 *
 * Design Principles:
 * 1. NO POLLING - only event-driven observation
 * 2. GRACEFUL DEGRADATION - works in JSDOM (returns 0)
 * 3. IDIOMATIC - follows Web Vitals measurement patterns
 *
 * @module perf/layoutShiftProbe
 * @see https://web.dev/cls/
 */

// ============================================================================
// Types
// ============================================================================

export interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Node;
    previousRect: DOMRectReadOnly;
    currentRect: DOMRectReadOnly;
  }>;
}

export interface LayoutShiftResult {
  /** Total CLS score (sum of all shifts without recent input) */
  score: number;
  /** Number of layout shift events */
  count: number;
  /** Individual shift values */
  entries: number[];
  /** Whether measurement was supported */
  supported: boolean;
}

// ============================================================================
// Internal State
// ============================================================================

let observer: PerformanceObserver | null = null;
let shiftEntries: number[] = [];
let isObserving = false;

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if Layout Shift observation is supported in the current environment.
 * Returns false in JSDOM and older browsers.
 */
export function isLayoutShiftSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof PerformanceObserver === 'undefined') return false;

  try {
    // Check if 'layout-shift' entry type is supported
    const types = PerformanceObserver.supportedEntryTypes || [];
    return types.includes('layout-shift');
  } catch {
    return false;
  }
}

/**
 * Start measuring layout shifts.
 * Safe to call in environments without PerformanceObserver (no-op).
 */
export function startMeasuring(): void {
  if (isObserving) return;

  // Reset state
  shiftEntries = [];

  if (!isLayoutShiftSupported()) {
    // Graceful degradation - no observer in JSDOM
    isObserving = true;
    return;
  }

  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shiftEntry = entry as LayoutShiftEntry;

        // Only count layout shifts without recent user input
        // (User-initiated shifts like scrolling are expected)
        if (!shiftEntry.hadRecentInput) {
          shiftEntries.push(shiftEntry.value);
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    isObserving = true;
  } catch {
    // Observation not supported - degrade gracefully
    isObserving = true;
  }
}

/**
 * Stop measuring layout shifts and disconnect observer.
 */
export function stopMeasuring(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  isObserving = false;
}

/**
 * Get the cumulative layout shift score and entry count.
 * Returns score=0 if not supported (graceful degradation for JSDOM).
 */
export function getShiftScore(): LayoutShiftResult {
  const score = shiftEntries.reduce((sum, val) => sum + val, 0);

  return {
    score,
    count: shiftEntries.length,
    entries: [...shiftEntries],
    supported: isLayoutShiftSupported(),
  };
}

/**
 * Reset accumulated shift entries without stopping observation.
 * Useful for measuring shifts during specific operations.
 */
export function resetShiftEntries(): void {
  shiftEntries = [];
}

/**
 * Measure layout shifts during an async operation.
 * Convenience wrapper for start/stop/get pattern.
 *
 * @example
 * const result = await measureDuring(async () => {
 *   await openLauncher();
 *   await closeLauncher();
 * });
 * expect(result.score).toBeLessThan(0.1);
 */
export async function measureDuring<T>(
  operation: () => Promise<T>
): Promise<{ result: T; shifts: LayoutShiftResult }> {
  resetShiftEntries();
  startMeasuring();

  try {
    const result = await operation();
    const shifts = getShiftScore();
    return { result, shifts };
  } finally {
    stopMeasuring();
  }
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Simulate a layout shift (for testing in JSDOM).
 * Only works when PerformanceObserver is not supported.
 * @internal
 */
export function __simulateLayoutShift(value: number): void {
  if (!isLayoutShiftSupported() && isObserving) {
    shiftEntries.push(value);
  }
}

/**
 * Get current observation state (for testing).
 * @internal
 */
export function __getObservationState(): { isObserving: boolean; entryCount: number } {
  return {
    isObserving,
    entryCount: shiftEntries.length,
  };
}
