/**
 * TerraFusion Security Metrics Exporter
 * ======================================
 *
 * Phase IIIi: Metrics export adapter with dimension filtering.
 *
 * Design Principles:
 * - Dimension filtering at export boundary (strict allowlist)
 * - Fail-silent: export failures never impact auth decisions
 * - Multiple backend support (OTEL, Prometheus, etc.)
 * - Fire-and-forget async export for auth-critical paths
 */

import { ALLOWED_SLO_DIMENSIONS } from '../slo/catalog.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Metric point to be exported.
 */
export interface MetricPoint {
  /** Metric name */
  readonly name: string;
  /** Metric value */
  readonly value: number;
  /** Labels/dimensions */
  readonly labels: Record<string, string>;
  /** Timestamp in milliseconds */
  readonly timestamp: number;
  /** Metric type */
  readonly type?: 'counter' | 'gauge' | 'histogram';
}

/**
 * Export result.
 */
export interface ExportResult {
  /** Whether export succeeded */
  readonly success: boolean;
  /** Error message if failed */
  readonly error?: string;
  /** Number of backends that received the metric */
  readonly backendsReached?: number;
}

/**
 * Exporter statistics.
 */
export interface ExporterStats {
  /** Total export attempts */
  readonly attempts: number;
  /** Successful exports */
  readonly successes: number;
  /** Failed exports */
  readonly failures: number;
  /** Labels dropped due to filtering */
  readonly labelsDropped: number;
}

/**
 * Backend interface for metric export.
 */
export interface MetricsBackend {
  /** Backend name */
  readonly name?: string;
  /** Export a metric point */
  export(point: MetricPoint): Promise<void>;
}

// ============================================================================
// Dimension Filter
// ============================================================================

/**
 * Filters labels to allowlist only.
 */
export class DimensionFilter {
  private readonly allowlist: Set<string>;

  constructor(allowedDimensions: readonly string[]) {
    this.allowlist = new Set(allowedDimensions);
  }

  /**
   * Filter labels to only include allowlisted dimensions.
   */
  filterLabels(labels: Record<string, string>): Record<string, string> {
    const filtered: Record<string, string> = {};
    for (const key of Object.keys(labels)) {
      if (this.allowlist.has(key)) {
        filtered[key] = labels[key];
      }
    }
    return filtered;
  }

  /**
   * Filter labels and return statistics.
   */
  filterLabelsWithStats(labels: Record<string, string>): {
    filtered: Record<string, string>;
    kept: number;
    dropped: number;
  } {
    const filtered: Record<string, string> = {};
    let kept = 0;
    let dropped = 0;

    for (const key of Object.keys(labels)) {
      if (this.allowlist.has(key)) {
        filtered[key] = labels[key];
        kept++;
      } else {
        dropped++;
      }
    }

    return { filtered, kept, dropped };
  }

  /**
   * Check if a label is allowed.
   */
  isAllowed(label: string): boolean {
    return this.allowlist.has(label);
  }
}

// ============================================================================
// Security Metrics Exporter
// ============================================================================

/**
 * Central exporter for security metrics.
 * Applies dimension filtering and fail-silent semantics.
 */
export class SecurityMetricsExporter {
  private readonly backends: MetricsBackend[] = [];
  private readonly filter: DimensionFilter;
  private stats: {
    attempts: number;
    successes: number;
    failures: number;
    labelsDropped: number;
  };

  constructor(allowedDimensions: readonly string[] = ALLOWED_SLO_DIMENSIONS) {
    this.filter = new DimensionFilter(allowedDimensions);
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      labelsDropped: 0,
    };
  }

  /**
   * Register a backend for metric export.
   */
  registerBackend(backend: MetricsBackend): void {
    this.backends.push(backend);
  }

  /**
   * Get number of registered backends.
   */
  getBackendCount(): number {
    return this.backends.length;
  }

  /**
   * Export a metric point. Fail-silent.
   */
  async export(point: MetricPoint): Promise<ExportResult> {
    this.stats.attempts++;

    try {
      // Filter labels at boundary
      const labelStats = this.filter.filterLabelsWithStats(point.labels);
      this.stats.labelsDropped += labelStats.dropped;

      const filteredPoint: MetricPoint = {
        ...point,
        labels: labelStats.filtered,
      };

      // Export to all backends
      let backendsReached = 0;
      const errors: string[] = [];

      await Promise.all(
        this.backends.map(async backend => {
          try {
            await backend.export(filteredPoint);
            backendsReached++;
          } catch (err) {
            errors.push(backend.name ?? 'unknown');
          }
        })
      );

      if (backendsReached === this.backends.length) {
        this.stats.successes++;
        return { success: true, backendsReached };
      } else if (backendsReached > 0) {
        // Partial success
        this.stats.successes++;
        return {
          success: true,
          backendsReached,
          error: `Some backends failed: ${errors.join(', ')}`,
        };
      } else if (this.backends.length === 0) {
        // No backends configured - still success (noop)
        this.stats.successes++;
        return { success: true, backendsReached: 0 };
      } else {
        this.stats.failures++;
        return {
          success: false,
          error: `All backends failed: ${errors.join(', ')}`,
          backendsReached: 0,
        };
      }
    } catch (err) {
      this.stats.failures++;
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Fire-and-forget async export. Returns immediately.
   * Use this in auth-critical paths to avoid blocking.
   */
  exportAsync(point: MetricPoint): void {
    // Schedule export but don't wait
    setImmediate(() => {
      this.export(point).catch(() => {
        // Swallow error - fail-silent
      });
    });
  }

  /**
   * Get exporter statistics.
   */
  getStats(): ExporterStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      labelsDropped: 0,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a metrics exporter with a single backend.
 * Convenience wrapper for simple use cases.
 */
export function createMetricsExporter(backend: MetricsBackend): SecurityMetricsExporter {
  const exporter = new SecurityMetricsExporter();
  exporter.registerBackend(backend);
  return exporter;
}

// ============================================================================
// Noop Backend
// ============================================================================

/**
 * No-op backend for testing/disabled export.
 */
export const NoopMetricsBackend: MetricsBackend = {
  name: 'noop',
  export: async () => {
    // Intentionally empty
  },
};

// ============================================================================
// Console Backend (for development)
// ============================================================================

/**
 * Console backend for development/debugging.
 */
export const ConsoleMetricsBackend: MetricsBackend = {
  name: 'console',
  export: async point => {
    console.log(`[METRIC] ${point.name}=${point.value} labels=${JSON.stringify(point.labels)}`);
  },
};
