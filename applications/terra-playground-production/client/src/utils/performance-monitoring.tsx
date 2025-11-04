/**
 * Performance Monitoring Utilities
 *
 * Tools for monitoring and measuring React component performance,
 * especially during CRDT synchronization and conflict resolution.
 */

import React, { Profiler, ProfilerOnRenderCallback, useRef, useEffect } from 'react';

// Performance metrics
interface PerformanceMetrics {
  componentId: string;
  actualDuration: number;
  baseDuration: number;
  timestamp: number;
  phase: 'mount' | 'update';
}

// Dictionary of metrics by component ID
const metricsHistory: Record<string, PerformanceMetrics[]> = {};

// Max history items to keep per component
const MAX_HISTORY = 100;

/**
 * Log performance metrics to the console
 *
 * @param metrics Performance metrics
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  }ms, base=${metrics.baseDuration.toFixed(2)}ms`
  );
}

/**
 * Store performance metrics
 *
 * @param metrics Performance metrics
 */
export function storePerformanceMetrics(metrics: PerformanceMetrics): void {
  if (!metricsHistory[metrics.componentId]) {
    metricsHistory[metrics.componentId] = [];
  }

  metricsHistory[metrics.componentId].push(metrics);

  // Keep history size limited
  if (metricsHistory[metrics.componentId].length > MAX_HISTORY) {
    metricsHistory[metrics.componentId].shift();
  }
}

/**
 * Get performance metrics for a component
 *
 * @param componentId Component ID
 * @returns Performance metrics history
 */
export function getPerformanceMetrics(componentId: string): PerformanceMetrics[] {
  return metricsHistory[componentId] || [];
}

/**
 * Get the average performance metrics for a component
 *
 * @param componentId Component ID
 * @returns Average performance metrics
 */
export function getAveragePerformanceMetrics(componentId: string): {
  avgActualDuration: number;
  avgBaseDuration: number;
} {
  const metrics = getPerformanceMetrics(componentId);

  if (metrics.length === 0) {
    return { avgActualDuration: 0, avgBaseDuration: 0 };
  }

  const totalActual = metrics.reduce((sum, m) => sum + m.actualDuration, 0);
  const totalBase = metrics.reduce((sum, m) => sum + m.baseDuration, 0);

  return {
    avgActualDuration: totalActual / metrics.length,
    avgBaseDuration: totalBase / metrics.length,
  };
}

/**
 * Clear performance metrics
 *
 * @param componentId Optional component ID to clear. If not provided, clears all metrics.
 */
export function clearPerformanceMetrics(componentId?: string): void {
  if (componentId) {
    delete metricsHistory[componentId];
  } else {
    Object.keys(metricsHistory).forEach(id => {
      delete metricsHistory[id];
    });
  }
}

/**
 * Standard profiler callback
 */
export const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  const metrics: PerformanceMetrics = {
    componentId: id,
    actualDuration,
    baseDuration,
    timestamp: Date.now(),
    phase: phase === 'mount' ? 'mount' : 'update',
  };

  storePerformanceMetrics(metrics);

  // Optional: log directly if needed
  // logPerformanceMetrics(metrics);
};

/**
 * Performance profiler component
 */
export const PerformanceProfiler: React.FC<{
  id: string;
  children: React.ReactNode;
  log?: boolean;
}> = ({ id, children, log = false }) => {
  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    const metrics: PerformanceMetrics = {
      componentId: id,
      actualDuration,
      baseDuration,
      timestamp: Date.now(),
      phase: phase === 'mount' ? 'mount' : 'update',
    };

    storePerformanceMetrics(metrics);

    if (log) {
      logPerformanceMetrics(metrics);
    }
  };

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
};

/**
 * Hook to measure and log render duration
 *
 * @param componentName Name of the component
 * @param options Options
 */
export function useRenderProfiling(
  componentName: string,
  options: { log?: boolean; trackProps?: boolean } = {}
): void {
  const { log = false, trackProps = false } = options;
  const renderStart = useRef<number>(0);
  const prevProps = useRef<any>(null);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    const duration = performance.now() - renderStart.current;
    renderCount.current += 1;

    const metrics: PerformanceMetrics = {
      componentId: componentName,
      actualDuration: duration,
      baseDuration: duration, // We don't have baseDuration in hooks
      timestamp: Date.now(),
      phase: renderCount.current === 1 ? 'mount' : 'update',
    };

    storePerformanceMetrics(metrics);

    if (log) {
      logPerformanceMetrics(metrics);
    }
  });

  // Track props changes that cause renders if requested
  useEffect(() => {
    if (trackProps && prevProps.current) {
      const allProps = { ...prevProps.current };
      let changedProps: string[] = [];

      // Find which props changed
      Object.keys(allProps).forEach(key => {
        if (allProps[key] !== allProps[key]) {
          changedProps.push(key);
        }
      });

      if (changedProps.length > 0 && log) {
        }
    }

    // Update prevProps for next comparison
    if (trackProps) {
      prevProps.current = allProps;
    }
  });

  // Reset the timer before each render
  renderStart.current = performance.now();
}

/**
 * Export a downloadable performance report
 */
export function exportPerformanceReport(): string {
  const report = {
    timestamp: new Date().toISOString(),
    metrics: metricsHistory,
    summary: Object.keys(metricsHistory).map(componentId => {
      const { avgActualDuration, avgBaseDuration } = getAveragePerformanceMetrics(componentId);
      return {
        componentId,
        sampleCount: metricsHistory[componentId].length,
        avgActualDuration,
        avgBaseDuration,
      };
    }),
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Download performance report
 */
export function downloadPerformanceReport(): void {
  const report = exportPerformanceReport();
  const blob = new Blob([report], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-report-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

