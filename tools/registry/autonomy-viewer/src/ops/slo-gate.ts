/**
 * Phase 4N50 — SLO Gate Enforcement
 * ==================================
 *
 * Enforce SLOs as build/CI gates.
 *
 * Features:
 *   - Fail gate when budget exceeded
 *   - Warn when near threshold
 *   - Pass within thresholds
 *   - Combine multiple metrics into single gate result
 *   - Provide actionable error messages
 *
 * @module ops/slo-gate
 * @version 4N50.1
 */

import { type OpsSLODefinition, type SLOMetric, checkSLOCompliance } from '../ops-slo.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const SLO_GATE_SCHEMA = 'terrafusion.autonomy.slo-gate.v1';
export const SLO_GATE_VERSION = '4N50.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SLOGateInput {
  readonly metrics: readonly SLOMetric[];
  readonly slos: OpsSLODefinition;
  readonly profile: string;
  readonly context: {
    readonly runId: string;
    readonly workflow: string;
  };
}

export interface SLOViolation {
  readonly metric: string;
  readonly type: 'exceeded' | 'zero_ceiling';
  readonly value: number;
  readonly ceiling: number;
  readonly overage: number;
  readonly message: string;
  readonly suggestedAction: string;
}

export interface SLOWarning {
  readonly metric: string;
  readonly value: number;
  readonly ceiling: number;
  readonly utilizationPercent: number;
  readonly message: string;
}

export interface MetricDetail {
  readonly name: string;
  readonly value: number;
  readonly ceiling: number;
  readonly utilizationPercent: number;
  readonly headroomPercent?: number;
  readonly overage?: number;
  readonly exceeded: boolean;
  readonly warning: boolean;
}

export interface SLOGateResult {
  readonly $schema: typeof SLO_GATE_SCHEMA;
  readonly version: typeof SLO_GATE_VERSION;
  readonly evaluatedAt: string;
  readonly passed: boolean;
  readonly gateStatus: 'pass' | 'warn' | 'fail';
  readonly violations: readonly SLOViolation[];
  readonly warnings: readonly SLOWarning[];
  readonly metricDetails: readonly MetricDetail[];
  readonly context: {
    readonly runId: string;
    readonly workflow: string;
    readonly profile: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested Actions by Operation
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED_ACTIONS: Record<string, string> = {
  'verify-casefile': 'Check casefile size and complexity; investigate I/O bottlenecks',
  'dr-reconstitute': 'Check chunk storage performance; optimize asset retrieval',
  'generate-pack': 'Reduce pack size; parallelize artifact bundling',
  'rollup-compute': 'Optimize rollup algorithm; check database performance',
  'audit-packet-generate': 'Reduce packet scope; check memory usage',
  default: 'Investigate performance regression; check resource utilization',
};

// ─────────────────────────────────────────────────────────────────────────────
// runSLOGate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run SLO gate evaluation on metrics.
 */
export function runSLOGate(input: SLOGateInput): SLOGateResult {
  const violations: SLOViolation[] = [];
  const warnings: SLOWarning[] = [];
  const metricDetails: MetricDetail[] = [];

  for (const metric of input.metrics) {
    // Handle zero ceiling
    if (metric.ceiling <= 0) {
      violations.push({
        metric: metric.name,
        type: 'zero_ceiling',
        value: metric.value,
        ceiling: metric.ceiling,
        overage: metric.value,
        message: `${metric.name}: invalid ceiling (${metric.ceiling}), any value exceeds it`,
        suggestedAction: 'Fix SLO configuration; ceiling must be positive',
      });

      metricDetails.push({
        name: metric.name,
        value: metric.value,
        ceiling: metric.ceiling,
        utilizationPercent: Infinity,
        exceeded: true,
        warning: false,
      });

      continue;
    }

    const compliance = checkSLOCompliance(metric, input.slos);
    const utilizationPercent = compliance.utilizationPercent;
    const exceeded = !compliance.compliant;

    // Find warn threshold for this operation
    const budget = input.slos.budgets.find(b => b.operation === metric.name);
    const warnThreshold = budget?.warnThresholdPercent ?? 80;
    const isWarning = !exceeded && utilizationPercent >= warnThreshold;

    // Build metric detail
    const detail: MetricDetail = {
      name: metric.name,
      value: metric.value,
      ceiling: metric.ceiling,
      utilizationPercent,
      exceeded,
      warning: isWarning,
      overage: exceeded ? compliance.overage : undefined,
      headroomPercent: exceeded ? undefined : compliance.headroomPercent,
    };

    metricDetails.push(detail);

    // Record violations
    if (exceeded) {
      const suggestedAction = SUGGESTED_ACTIONS[metric.name] ?? SUGGESTED_ACTIONS.default;

      violations.push({
        metric: metric.name,
        type: 'exceeded',
        value: metric.value,
        ceiling: metric.ceiling,
        overage: compliance.overage ?? 0,
        message: `${metric.name}: ${metric.value}ms exceeded ceiling of ${metric.ceiling}ms (${utilizationPercent}%)`,
        suggestedAction,
      });
    }

    // Record warnings
    if (isWarning) {
      warnings.push({
        metric: metric.name,
        value: metric.value,
        ceiling: metric.ceiling,
        utilizationPercent,
        message: `${metric.name}: ${metric.value}ms is near threshold at ${utilizationPercent}% of ${metric.ceiling}ms ceiling`,
      });
    }
  }

  // Determine gate status
  let gateStatus: 'pass' | 'warn' | 'fail';
  let passed: boolean;

  if (violations.length > 0) {
    gateStatus = 'fail';
    passed = false;
  } else if (warnings.length > 0) {
    gateStatus = 'warn';
    passed = true;
  } else {
    gateStatus = 'pass';
    passed = true;
  }

  return {
    $schema: SLO_GATE_SCHEMA,
    version: SLO_GATE_VERSION,
    evaluatedAt: new Date().toISOString(),
    passed,
    gateStatus,
    violations,
    warnings,
    metricDetails,
    context: {
      runId: input.context.runId,
      workflow: input.context.workflow,
      profile: input.profile,
    },
  };
}
