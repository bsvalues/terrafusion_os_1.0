/**
 * Phase 4N46 – Ops SLO Definitions
 * =================================
 *
 * Operational SLO (Service Level Objective) definitions:
 *   - Runtime ceilings for verify/reconstitute
 *   - Pack generation time limits
 *   - Max artifact sizes
 *   - Rollup cadence validation
 *
 * @module ops-slo
 * @version 4N46.1
 */

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const OPS_SLO_SCHEMA = 'terrafusion.autonomy.ops-slo.v1';
export const OPS_SLO_VERSION = '4N46.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SLOBudget {
  readonly operation: string;
  ceilingMs: number;
  readonly description: string;
  readonly warnThresholdPercent: number;
}

export interface SizeLimits {
  readonly maxCasefileSizeBytes: number;
  readonly maxRollupSizeBytes: number;
  readonly maxPackSizeBytes: number;
  readonly maxChunkSizeBytes: number;
}

export interface Cadence {
  readonly rollupIntervalDays: number;
  readonly maxDaysSinceLastRollup: number;
  readonly verificationIntervalDays: number;
}

export interface OpsSLODefinition {
  readonly $schema: typeof OPS_SLO_SCHEMA;
  readonly version: typeof OPS_SLO_VERSION;
  budgets: SLOBudget[];
  readonly sizeLimits: SizeLimits;
  readonly cadence: Cadence;
}

export interface SLOMetric {
  readonly name: string;
  readonly value: number;
  readonly ceiling: number;
  readonly unit: string;
  readonly measuredAt: string;
}

export interface ComplianceResult {
  readonly compliant: boolean;
  readonly utilizationPercent: number;
  readonly headroomPercent?: number;
  readonly overage?: number;
  readonly warning?: boolean;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Default SLOs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get default SLO definitions.
 */
export function getDefaultSLOs(): OpsSLODefinition {
  return {
    $schema: OPS_SLO_SCHEMA,
    version: OPS_SLO_VERSION,
    budgets: [
      {
        operation: 'verify-casefile',
        ceilingMs: 5000, // 5 seconds
        description: 'Maximum time to verify a casefile cryptographically',
        warnThresholdPercent: 80,
      },
      {
        operation: 'dr-reconstitute',
        ceilingMs: 30000, // 30 seconds
        description: 'Maximum time to reconstitute ledger head from artifacts',
        warnThresholdPercent: 80,
      },
      {
        operation: 'generate-pack',
        ceilingMs: 60000, // 60 seconds
        description: 'Maximum time to generate a distribution pack',
        warnThresholdPercent: 80,
      },
      {
        operation: 'rollup-compute',
        ceilingMs: 120000, // 2 minutes
        description: 'Maximum time to compute a monthly rollup',
        warnThresholdPercent: 80,
      },
      {
        operation: 'audit-packet-generate',
        ceilingMs: 30000, // 30 seconds
        description: 'Maximum time to generate an audit packet',
        warnThresholdPercent: 80,
      },
    ],
    sizeLimits: {
      maxCasefileSizeBytes: 100 * 1024 * 1024, // 100MB
      maxRollupSizeBytes: 500 * 1024 * 1024, // 500MB
      maxPackSizeBytes: 1024 * 1024 * 1024, // 1GB
      maxChunkSizeBytes: 10 * 1024 * 1024, // 10MB
    },
    cadence: {
      rollupIntervalDays: 30,
      maxDaysSinceLastRollup: 45,
      verificationIntervalDays: 7,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SLO Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate an SLO definition.
 */
export function validateSLODefinition(slos: OpsSLODefinition): ValidationResult {
  const errors: string[] = [];

  // Check schema
  if (slos.$schema !== OPS_SLO_SCHEMA) {
    errors.push(`Invalid schema: ${slos.$schema}`);
  }

  // Check budgets
  for (const budget of slos.budgets) {
    if (budget.ceilingMs <= 0) {
      errors.push(`Invalid ceiling for ${budget.operation}: ${budget.ceilingMs}`);
    }
    if (budget.warnThresholdPercent < 0 || budget.warnThresholdPercent > 100) {
      errors.push(`Invalid warn threshold for ${budget.operation}: ${budget.warnThresholdPercent}`);
    }
  }

  // Check size limits
  if (slos.sizeLimits.maxCasefileSizeBytes <= 0) {
    errors.push('maxCasefileSizeBytes must be positive');
  }
  if (slos.sizeLimits.maxRollupSizeBytes <= 0) {
    errors.push('maxRollupSizeBytes must be positive');
  }
  if (slos.sizeLimits.maxPackSizeBytes <= 0) {
    errors.push('maxPackSizeBytes must be positive');
  }

  // Check cadence
  if (slos.cadence.rollupIntervalDays <= 0) {
    errors.push('rollupIntervalDays must be positive');
  }
  if (slos.cadence.maxDaysSinceLastRollup <= 0) {
    errors.push('maxDaysSinceLastRollup must be positive');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SLO Compliance Check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a metric is compliant with SLOs.
 */
export function checkSLOCompliance(metric: SLOMetric, slos: OpsSLODefinition): ComplianceResult {
  // Find the budget for this operation
  const budget = slos.budgets.find(b => b.operation === metric.name);
  const ceiling = budget?.ceilingMs ?? metric.ceiling;
  const warnThreshold = budget?.warnThresholdPercent ?? 80;

  const utilizationPercent = (metric.value / ceiling) * 100;
  const compliant = metric.value <= ceiling;

  const result: ComplianceResult = {
    compliant,
    utilizationPercent: Math.round(utilizationPercent),
  };

  if (compliant) {
    return {
      ...result,
      headroomPercent: Math.round(100 - utilizationPercent),
      warning: utilizationPercent >= warnThreshold,
    };
  } else {
    return {
      ...result,
      overage: metric.value - ceiling,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Measurement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Measure verification runtime.
 */
export async function measureVerificationRuntime<T>(
  verifyFn: () => Promise<T>
): Promise<SLOMetric> {
  const slos = getDefaultSLOs();
  const budget = slos.budgets.find(b => b.operation === 'verify-casefile');
  const ceiling = budget?.ceilingMs ?? 5000;

  const start = performance.now();
  await verifyFn();
  const end = performance.now();

  return {
    name: 'verify-casefile',
    value: Math.round(end - start),
    ceiling,
    unit: 'ms',
    measuredAt: new Date().toISOString(),
  };
}

/**
 * Measure reconstitution runtime.
 */
export async function measureReconstitutionRuntime<T>(
  reconstituteFn: () => Promise<T>
): Promise<SLOMetric> {
  const slos = getDefaultSLOs();
  const budget = slos.budgets.find(b => b.operation === 'dr-reconstitute');
  const ceiling = budget?.ceilingMs ?? 30000;

  const start = performance.now();
  await reconstituteFn();
  const end = performance.now();

  return {
    name: 'dr-reconstitute',
    value: Math.round(end - start),
    ceiling,
    unit: 'ms',
    measuredAt: new Date().toISOString(),
  };
}

/**
 * Measure pack generation time.
 */
export async function measurePackGenerationTime<T>(
  generateFn: () => Promise<T>
): Promise<SLOMetric> {
  const slos = getDefaultSLOs();
  const budget = slos.budgets.find(b => b.operation === 'generate-pack');
  const ceiling = budget?.ceilingMs ?? 60000;

  const start = performance.now();
  await generateFn();
  const end = performance.now();

  return {
    name: 'generate-pack',
    value: Math.round(end - start),
    ceiling,
    unit: 'ms',
    measuredAt: new Date().toISOString(),
  };
}
