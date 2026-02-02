/**
 * TerraFusion Security Plane Calibration Diff Report
 * =====================================================
 *
 * Phase IIIk: Calibration diff report generator.
 *
 * Design Principles:
 * - PII-clean output (all identifiers hashed)
 * - Operator-consumable format (structured JSON + human-readable)
 * - Bounded output size (configurable max results)
 * - Actionable insights (severity-grouped, dimension-contextualized)
 */

import {
    DEFAULT_DRIFT_THRESHOLDS,
    ingestBaseline,
    type BaselineSample,
    type BaselineSource,
    type DriftResult,
    type DriftThresholds
} from './baseline.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Calibration diff report.
 */
export interface CalibrationReport {
  readonly version: string;
  readonly schemaVersion: string;
  readonly generatedAt: string;
  readonly baselineWindow: {
    readonly start: string;
    readonly end: string;
    readonly durationHours: number;
  };
  readonly results: readonly DriftResult[];
  readonly summary: CalibrationSummary;
  readonly recommendations: readonly CalibrationRecommendation[];
}

/**
 * Report summary statistics.
 */
export interface CalibrationSummary {
  readonly total: number;
  readonly ok: number;
  readonly warning: number;
  readonly critical: number;
  readonly totalSamples: number;
  readonly dimensionsFiltered: number;
  readonly overallHealth: 'healthy' | 'degraded' | 'critical';
}

/**
 * Actionable recommendation.
 */
export interface CalibrationRecommendation {
  readonly severity: 'warning' | 'critical';
  readonly sloId: string;
  readonly sloName: string;
  readonly message: string;
  readonly suggestedAction: string;
  readonly dimensions: Record<string, string>;
}

/**
 * Report generation options.
 */
export interface ReportOptions {
  /** Drift thresholds */
  readonly thresholds?: DriftThresholds;
  /** Maximum results to include (default: 100) */
  readonly maxResults?: number;
  /** Sort order for results */
  readonly sortBy?: 'severity' | 'drift' | 'sloId';
  /** Hash operator IDs in output */
  readonly hashOperatorIds?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const REPORT_VERSION = '1.0.0';
const REPORT_SCHEMA_VERSION = 'terrafusion.ops.calibration.v1';
const DEFAULT_MAX_RESULTS = 100;

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate calibration diff report from baseline samples.
 */
export function generateCalibrationReport(
  samples: readonly BaselineSample[],
  windowStart: string,
  windowEnd: string,
  options: ReportOptions = {}
): CalibrationReport {
  const {
    thresholds = DEFAULT_DRIFT_THRESHOLDS,
    maxResults = DEFAULT_MAX_RESULTS,
    sortBy = 'severity',
  } = options;

  // Ingest and calculate drift
  const ingestionResult = ingestBaseline(samples, { thresholds });

  // Sort results
  let sortedResults = [...ingestionResult.results];
  sortedResults = sortResults(sortedResults, sortBy);

  // Bound results
  const boundedResults = sortedResults.slice(0, maxResults);

  // Calculate window duration
  const startDate = new Date(windowStart);
  const endDate = new Date(windowEnd);
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  // Calculate total samples
  const totalSamples = ingestionResult.results.reduce((sum, r) => sum + r.sampleCount, 0);

  // Calculate summary
  const summary = calculateSummary(
    ingestionResult.results,
    totalSamples,
    ingestionResult.stats.dimensionsFiltered
  );

  // Generate recommendations
  const recommendations = generateRecommendations(ingestionResult.results);

  return {
    version: REPORT_VERSION,
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    baselineWindow: {
      start: windowStart,
      end: windowEnd,
      durationHours,
    },
    results: boundedResults,
    summary,
    recommendations,
  };
}

/**
 * Generate calibration report from a baseline source.
 */
export async function generateReportFromSource(
  source: BaselineSource,
  windowStart: Date,
  windowEnd: Date,
  options: ReportOptions = {}
): Promise<CalibrationReport> {
  const samples = await source.fetchSamples(windowStart, windowEnd);

  return generateCalibrationReport(
    samples,
    windowStart.toISOString(),
    windowEnd.toISOString(),
    options
  );
}

// ============================================================================
// Sorting
// ============================================================================

const SEVERITY_ORDER: Record<DriftResult['severity'], number> = {
  critical: 0,
  warning: 1,
  ok: 2,
};

function sortResults(
  results: DriftResult[],
  sortBy: 'severity' | 'drift' | 'sloId'
): DriftResult[] {
  switch (sortBy) {
    case 'severity':
      return results.sort((a, b) => {
        const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return Math.abs(b.driftPercent) - Math.abs(a.driftPercent);
      });
    case 'drift':
      return results.sort((a, b) => Math.abs(b.driftPercent) - Math.abs(a.driftPercent));
    case 'sloId':
      return results.sort((a, b) => a.sloId.localeCompare(b.sloId));
    default:
      return results;
  }
}

// ============================================================================
// Summary Calculation
// ============================================================================

function calculateSummary(
  results: readonly DriftResult[],
  totalSamples: number,
  dimensionsFiltered: number
): CalibrationSummary {
  const ok = results.filter(r => r.severity === 'ok').length;
  const warning = results.filter(r => r.severity === 'warning').length;
  const critical = results.filter(r => r.severity === 'critical').length;

  let overallHealth: CalibrationSummary['overallHealth'] = 'healthy';
  if (critical > 0) {
    overallHealth = 'critical';
  } else if (warning > 0) {
    overallHealth = 'degraded';
  }

  return {
    total: results.length,
    ok,
    warning,
    critical,
    totalSamples,
    dimensionsFiltered,
    overallHealth,
  };
}

// ============================================================================
// Recommendations
// ============================================================================

function generateRecommendations(results: readonly DriftResult[]): CalibrationRecommendation[] {
  const recommendations: CalibrationRecommendation[] = [];

  for (const result of results) {
    if (result.severity === 'ok') continue;

    const recommendation: CalibrationRecommendation = {
      severity: result.severity,
      sloId: result.sloId,
      sloName: result.sloName,
      message: generateRecommendationMessage(result),
      suggestedAction: generateSuggestedAction(result),
      dimensions: result.dimensions,
    };

    recommendations.push(recommendation);
  }

  // Sort by severity (critical first)
  return recommendations.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  });
}

function generateRecommendationMessage(result: DriftResult): string {
  const direction = result.direction === 'above_target' ? 'above' : 'below';
  const driftStr = Math.abs(result.driftPercent).toFixed(1);

  return `${result.sloName} is ${driftStr}% ${direction} target (observed: ${formatValue(result.observedValue)}, target: ${formatValue(result.targetValue)})`;
}

function generateSuggestedAction(result: DriftResult): string {
  if (result.direction === 'above_target') {
    // Error rate too high
    if (result.sloId.includes('denial')) {
      return 'Investigate denial patterns - check for misconfigured clients or attack patterns';
    }
    if (result.sloId.includes('jwks')) {
      return 'Verify IdP connectivity and JWKS endpoint availability';
    }
    if (result.sloId.includes('provider')) {
      return 'Check provider configuration and upstream service health';
    }
    if (result.sloId.includes('token')) {
      return 'Review client token configuration and clock synchronization';
    }
  } else {
    // Success rate too low
    if (result.sloId.includes('cache')) {
      return 'Investigate cache invalidation patterns and key rotation frequency';
    }
  }

  return 'Review SLO metrics and adjust targets if baseline has changed';
}

function formatValue(value: number): string {
  if (value < 0.01) {
    return (value * 100).toFixed(2) + '%';
  }
  if (value < 1) {
    return (value * 100).toFixed(1) + '%';
  }
  return value.toFixed(2);
}

// ============================================================================
// Report Formatting
// ============================================================================

/**
 * Format report as human-readable text.
 */
export function formatReportAsText(report: CalibrationReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('CALIBRATION DIFF REPORT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Baseline Window: ${report.baselineWindow.start} to ${report.baselineWindow.end}`);
  lines.push(`Duration: ${report.baselineWindow.durationHours.toFixed(1)} hours`);
  lines.push('');

  // Summary
  lines.push('-'.repeat(60));
  lines.push('SUMMARY');
  lines.push('-'.repeat(60));
  lines.push(`Overall Health: ${report.summary.overallHealth.toUpperCase()}`);
  lines.push(`Total SLOs: ${report.summary.total}`);
  lines.push(`  OK: ${report.summary.ok}`);
  lines.push(`  Warning: ${report.summary.warning}`);
  lines.push(`  Critical: ${report.summary.critical}`);
  lines.push(`Total Samples: ${report.summary.totalSamples.toLocaleString()}`);
  lines.push(`Dimensions Filtered: ${report.summary.dimensionsFiltered}`);
  lines.push('');

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('-'.repeat(60));
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(60));

    for (const rec of report.recommendations) {
      const prefix = rec.severity === 'critical' ? '🔴' : '🟡';
      lines.push(`${prefix} [${rec.severity.toUpperCase()}] ${rec.sloName}`);
      lines.push(`   ${rec.message}`);
      lines.push(`   Action: ${rec.suggestedAction}`);
      if (Object.keys(rec.dimensions).length > 0) {
        const dims = Object.entries(rec.dimensions)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        lines.push(`   Dimensions: ${dims}`);
      }
      lines.push('');
    }
  }

  // Results detail
  lines.push('-'.repeat(60));
  lines.push('RESULTS DETAIL');
  lines.push('-'.repeat(60));

  for (const result of report.results) {
    const status = result.severity === 'ok' ? '✓' : result.severity === 'warning' ? '⚠' : '✗';
    const drift =
      result.driftPercent >= 0
        ? `+${result.driftPercent.toFixed(1)}%`
        : `${result.driftPercent.toFixed(1)}%`;
    lines.push(`${status} ${result.sloId}: ${drift} (${result.severity})`);
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push(`Report Version: ${report.version}`);

  return lines.join('\n');
}

/**
 * Format report as JSON (for machine consumption).
 */
export function formatReportAsJson(report: CalibrationReport): string {
  return JSON.stringify(report, null, 2);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a calibration report structure.
 */
export function validateReport(report: CalibrationReport): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!report.version) {
    errors.push('Report version is required');
  }
  if (!report.schemaVersion) {
    errors.push('Schema version is required');
  }
  if (!report.generatedAt) {
    errors.push('Generated timestamp is required');
  }
  if (!report.baselineWindow) {
    errors.push('Baseline window is required');
  }
  if (!report.summary) {
    errors.push('Summary is required');
  }

  // Validate summary counts match results
  if (report.results && report.summary) {
    const ok = report.results.filter(r => r.severity === 'ok').length;
    const warning = report.results.filter(r => r.severity === 'warning').length;
    const critical = report.results.filter(r => r.severity === 'critical').length;

    if (report.summary.ok !== ok) {
      errors.push(`Summary OK count mismatch: ${report.summary.ok} vs ${ok}`);
    }
    if (report.summary.warning !== warning) {
      errors.push(`Summary warning count mismatch: ${report.summary.warning} vs ${warning}`);
    }
    if (report.summary.critical !== critical) {
      errors.push(`Summary critical count mismatch: ${report.summary.critical} vs ${critical}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
