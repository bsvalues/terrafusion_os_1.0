/**
 * TerraFusion Security Plane Baseline Ingestion
 * ===============================================
 *
 * Phase IIIk: Baseline ingestion adapter for drift detection.
 *
 * Design Principles:
 * - Dimension filtering at ingestion boundary (allowlist only)
 * - Direction-aware drift calculation
 * - Environment-agnostic interface (staging/prod/local)
 * - Fail-silent ingestion (errors counted, not thrown)
 */

import { createHash } from 'node:crypto';

import {
    ALLOWED_SLO_DIMENSIONS,
    getSloById,
    type AllowedSloDimension
} from '../slo/catalog.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Baseline metric sample (from staging/prod).
 */
export interface BaselineSample {
  readonly sloId: string;
  readonly dimensions: Record<string, string>;
  readonly observedValue: number;
  readonly sampleCount: number;
  readonly windowStart: string;
  readonly windowEnd: string;
}

/**
 * Drift result for a single SLO.
 */
export interface DriftResult {
  readonly sloId: string;
  readonly sloName: string;
  readonly targetValue: number;
  readonly observedValue: number;
  readonly driftPercent: number;
  readonly direction: 'within' | 'above_target' | 'below_target';
  readonly severity: 'ok' | 'warning' | 'critical';
  readonly dimensions: Record<string, string>;
  readonly sampleCount: number;
}

/**
 * Drift severity thresholds (configurable).
 */
export interface DriftThresholds {
  /** Drift % threshold for warning (default: 20) */
  readonly warningPercent: number;
  /** Drift % threshold for critical (default: 50) */
  readonly criticalPercent: number;
}

/**
 * Baseline ingestion options.
 */
export interface IngestionOptions {
  /** Custom drift thresholds */
  readonly thresholds?: DriftThresholds;
  /** Skip unknown SLO IDs silently */
  readonly skipUnknown?: boolean;
}

/**
 * Ingestion result.
 */
export interface IngestionResult {
  readonly success: boolean;
  readonly results: readonly DriftResult[];
  readonly errors: readonly string[];
  readonly stats: {
    readonly samplesReceived: number;
    readonly samplesProcessed: number;
    readonly samplesSkipped: number;
    readonly dimensionsFiltered: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_DRIFT_THRESHOLDS: DriftThresholds = {
  warningPercent: 20,
  criticalPercent: 50,
};

// ============================================================================
// Dimension Filtering
// ============================================================================

/**
 * Filter dimensions to allowlist only.
 * Returns filtered dimensions and count of dropped dimensions.
 */
export function filterDimensions(dimensions: Record<string, string>): {
  filtered: Record<string, string>;
  droppedCount: number;
} {
  const filtered: Record<string, string> = {};
  let droppedCount = 0;

  for (const [key, value] of Object.entries(dimensions)) {
    if (ALLOWED_SLO_DIMENSIONS.includes(key as AllowedSloDimension)) {
      filtered[key] = value;
    } else {
      droppedCount++;
    }
  }

  return { filtered, droppedCount };
}

// ============================================================================
// Drift Calculation
// ============================================================================

/**
 * Calculate drift between observed and target values.
 */
export function calculateDrift(
  observed: number,
  target: number,
  sloDirection: 'above' | 'below'
): { driftPercent: number; direction: DriftResult['direction'] } {
  // Handle edge case of zero target
  if (target === 0) {
    return {
      driftPercent: observed > 0 ? 100 : 0,
      direction: observed > 0 ? 'above_target' : 'within',
    };
  }

  const driftPercent = ((observed - target) / target) * 100;

  let direction: DriftResult['direction'] = 'within';

  if (sloDirection === 'below') {
    // For error rates: observed > target is bad (above_target)
    // observed <= target is good (within)
    direction = observed > target ? 'above_target' : 'within';
  } else {
    // For success rates: observed < target is bad (below_target)
    // observed >= target is good (within)
    direction = observed < target ? 'below_target' : 'within';
  }

  return { driftPercent, direction };
}

/**
 * Determine severity based on drift magnitude and direction.
 */
export function determineSeverity(
  driftPercent: number,
  driftDirection: DriftResult['direction'],
  thresholds: DriftThresholds = DEFAULT_DRIFT_THRESHOLDS
): DriftResult['severity'] {
  // Within target is always ok
  if (driftDirection === 'within') {
    return 'ok';
  }

  const absDrift = Math.abs(driftPercent);

  if (absDrift >= thresholds.criticalPercent) {
    return 'critical';
  }
  if (absDrift >= thresholds.warningPercent) {
    return 'warning';
  }

  return 'ok';
}

// ============================================================================
// PII Hashing
// ============================================================================

/**
 * Hash identifier for PII safety.
 */
export function hashIdentifier(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex');
  return `sha256:${hash.slice(0, 16)}`;
}

// ============================================================================
// Baseline Ingestion
// ============================================================================

/**
 * Ingest baseline samples and produce drift results.
 *
 * @param samples - Raw baseline samples from environment
 * @param options - Ingestion configuration
 * @returns Ingestion result with drift analysis
 */
export function ingestBaseline(
  samples: readonly BaselineSample[],
  options: IngestionOptions = {}
): IngestionResult {
  const { thresholds = DEFAULT_DRIFT_THRESHOLDS, skipUnknown = true } = options;

  const results: DriftResult[] = [];
  const errors: string[] = [];
  let samplesProcessed = 0;
  let samplesSkipped = 0;
  let dimensionsFiltered = 0;

  for (const sample of samples) {
    try {
      // Look up SLO
      const slo = getSloById(sample.sloId);
      if (!slo) {
        if (!skipUnknown) {
          errors.push(`Unknown SLO: ${sample.sloId}`);
        }
        samplesSkipped++;
        continue;
      }

      // Filter dimensions at ingestion boundary
      const { filtered, droppedCount } = filterDimensions(sample.dimensions);
      dimensionsFiltered += droppedCount;

      // Calculate drift
      const { driftPercent, direction } = calculateDrift(
        sample.observedValue,
        slo.target,
        slo.direction ?? 'below'
      );

      // Determine severity
      const severity = determineSeverity(driftPercent, direction, thresholds);

      results.push({
        sloId: sample.sloId,
        sloName: slo.name,
        targetValue: slo.target,
        observedValue: sample.observedValue,
        driftPercent,
        direction,
        severity,
        dimensions: filtered,
        sampleCount: sample.sampleCount,
      });

      samplesProcessed++;
    } catch (err) {
      errors.push(`Error processing sample for ${sample.sloId}: ${err}`);
      samplesSkipped++;
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    stats: {
      samplesReceived: samples.length,
      samplesProcessed,
      samplesSkipped,
      dimensionsFiltered,
    },
  };
}

// ============================================================================
// Baseline Source Interface
// ============================================================================

/**
 * Baseline source interface for environment-specific adapters.
 */
export interface BaselineSource {
  /** Fetch samples for a time window */
  fetchSamples(
    windowStart: Date,
    windowEnd: Date,
    sloIds?: readonly string[]
  ): Promise<readonly BaselineSample[]>;

  /** Source name for logging */
  readonly name: string;
}

/**
 * Create a mock baseline source for testing.
 */
export function createMockBaselineSource(samples: readonly BaselineSample[]): BaselineSource {
  return {
    name: 'mock',
    async fetchSamples(): Promise<readonly BaselineSample[]> {
      return samples;
    },
  };
}

/**
 * Create a baseline source from environment metrics API.
 */
export function createMetricsApiSource(apiEndpoint: string, apiKey?: string): BaselineSource {
  return {
    name: 'metrics-api',
    async fetchSamples(
      windowStart: Date,
      windowEnd: Date,
      sloIds?: readonly string[]
    ): Promise<readonly BaselineSample[]> {
      // Placeholder for real implementation
      // Would call the metrics API with time range and SLO filter
      console.log(`[metrics-api] Fetching from ${apiEndpoint}`);
      console.log(
        `[metrics-api] Window: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`
      );
      console.log(`[metrics-api] SLOs: ${sloIds?.join(', ') ?? 'all'}`);

      // Return empty for now - real impl would fetch
      return [];
    },
  };
}
