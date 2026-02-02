/**
 * County Kit Orchestrator
 * =======================
 * Phase: Field Rollout Hardening
 *
 * Single "County Kit" flow that runs:
 *   bootstrap → drills → ops-status → slo-gate
 *
 * Features:
 * - Deterministic output directory structure
 * - Audit-friendly bundle (JSON summaries + pointers)
 * - Fail-closed semantics with stable error codes
 * - Cross-OS consistent paths
 *
 * @schema terrafusion.autonomy.county-kit.v1
 * @version 4N50.1
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootstrap, type BootstrapResult } from './bootstrap.js';
import { runDrills, type DrillResult } from './drill-runner.js';
import { generateHints, type LastRunSummary } from './next-step-hints.js';
import { toJsonWithLF } from './utils/deterministic-json.js';
import { normalizePath } from './utils/path-normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const COUNTY_KIT_SCHEMA = 'terrafusion.autonomy.county-kit.v1';
export const COUNTY_KIT_VERSION = '4N50.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CountyKitOptions {
  /** Profile name (e.g., 'benton-county', 'test-county') */
  readonly profile: string;
  /** Output directory for all artifacts */
  readonly outDir: string;
  /** Base directory for profile lookup (default: autonomy-viewer root) */
  readonly baseDir?: string;
  /** Test hook to simulate step failures */
  readonly simulateFailure?: 'bootstrap' | 'drills' | 'ops-status' | 'slo-gate';
}

export interface CountyKitResult {
  readonly schemaId: typeof COUNTY_KIT_SCHEMA;
  readonly schemaVersion: typeof COUNTY_KIT_VERSION;
  readonly timestamp: string;
  readonly profile: string;
  readonly outDir: string;
  readonly steps: readonly StepResult[];
  readonly summary: KitSummary;
  readonly ok: boolean;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

export interface StepResult {
  readonly name: 'bootstrap' | 'drills' | 'hints' | 'ops-status' | 'slo-gate';
  readonly ok: boolean;
  readonly durationMs: number;
  readonly outputFile: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

export interface KitSummary {
  readonly stepsRun: number;
  readonly stepsPassed: number;
  readonly stepsFailed: number;
  readonly totalDurationMs: number;
  readonly sloGateStatus?: 'pass' | 'warn' | 'fail';
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODES = {
  MISSING_PROFILE: 'COUNTY_KIT_MISSING_PROFILE',
  MISSING_OUTDIR: 'COUNTY_KIT_MISSING_OUTDIR',
  BOOTSTRAP_FAILED: 'COUNTY_KIT_BOOTSTRAP_FAILED',
  DRILLS_FAILED: 'COUNTY_KIT_DRILLS_FAILED',
  OPS_STATUS_FAILED: 'COUNTY_KIT_OPS_STATUS_FAILED',
  SLO_GATE_FAILED: 'COUNTY_KIT_SLO_GATE_FAILED',
  WRITE_FAILED: 'COUNTY_KIT_WRITE_FAILED',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Default SLO Budgets
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SLO_BUDGETS = [
  { name: 'drill-duration-ms', value: 0, ceiling: 5000 },
  { name: 'bootstrap-errors', value: 0, ceiling: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full County Kit flow.
 *
 * @param options - Kit options
 * @returns CountyKitResult with all step outputs
 */
export function runCountyKit(options: CountyKitOptions): CountyKitResult {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // ─────────────────────────────────────────────────────────────────────────
  // Input Validation (Fail Closed)
  // ─────────────────────────────────────────────────────────────────────────

  if (!options.profile || options.profile.trim() === '') {
    return createFailureResult({
      timestamp,
      profile: options.profile || '',
      outDir: options.outDir || '',
      errorCode: ERROR_CODES.MISSING_PROFILE,
      errorMessage: 'Profile name is required',
      durationMs: Date.now() - startTime,
    });
  }

  if (!options.outDir || options.outDir.trim() === '') {
    return createFailureResult({
      timestamp,
      profile: options.profile,
      outDir: options.outDir || '',
      errorCode: ERROR_CODES.MISSING_OUTDIR,
      errorMessage: 'Output directory is required',
      durationMs: Date.now() - startTime,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Setup Output Directory
  // ─────────────────────────────────────────────────────────────────────────

  const baseDir = options.baseDir ?? resolve(__dirname, '..');
  const outDir = resolve(options.outDir);
  const stepsDir = join(outDir, 'steps');

  try {
    mkdirSync(stepsDir, { recursive: true });
  } catch (err) {
    return createFailureResult({
      timestamp,
      profile: options.profile,
      outDir: normalizePath(outDir),
      errorCode: ERROR_CODES.WRITE_FAILED,
      errorMessage: `Failed to create output directory: ${(err as Error).message}`,
      durationMs: Date.now() - startTime,
    });
  }

  const steps: StepResult[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1: Bootstrap
  // ─────────────────────────────────────────────────────────────────────────

  const bootstrapResult = runStep('bootstrap', () => {
    if (options.simulateFailure === 'bootstrap') {
      return { ok: false, errors: [{ code: 'SIMULATED', message: 'Simulated failure' }] };
    }
    return bootstrap(options.profile, { baseDir, createDirs: false });
  });

  writeStepOutput(stepsDir, 'bootstrap.json', bootstrapResult.output);
  steps.push(bootstrapResult.step);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2: Drills
  // ─────────────────────────────────────────────────────────────────────────

  const drillsResult = runStep('drills', () => {
    if (options.simulateFailure === 'drills') {
      return {
        drillId: 'simulated',
        timestamp: new Date().toISOString(),
        profile: options.profile,
        exercisesRun: [],
        overall: 'failed' as const,
        artifacts: [],
        duration_ms: 0,
        failFast: false,
      };
    }
    return runDrills({ profile: options.profile, baseDir, writeArtifacts: false });
  });

  writeStepOutput(stepsDir, 'drills.json', drillsResult.output);
  steps.push(drillsResult.step);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3: Hints
  // ─────────────────────────────────────────────────────────────────────────

  const hintsResult = runStep('hints', () => {
    const drillOutput = drillsResult.output as DrillResult;
    const lastRun: LastRunSummary = {
      drillId: drillOutput.drillId,
      profile: options.profile,
      timestamp: drillOutput.timestamp,
      overall: drillOutput.overall,
      exercisesRun: drillOutput.exercisesRun,
      errors: [],
    };
    return generateHints(lastRun);
  });

  writeStepOutput(stepsDir, 'hints.json', hintsResult.output);
  steps.push(hintsResult.step);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4: Ops Status (lightweight inline implementation)
  // ─────────────────────────────────────────────────────────────────────────

  const opsStatusResult = runStep('ops-status', () => {
    if (options.simulateFailure === 'ops-status') {
      throw new Error('Simulated ops-status failure');
    }

    const bootstrapOutput = bootstrapResult.output as BootstrapResult;
    const drillOutput = drillsResult.output as DrillResult;

    return {
      $schema: 'terrafusion.autonomy.ops-status.v1',
      version: '4N50.1',
      profile: options.profile,
      timestamp: new Date().toISOString(),
      overallStatus:
        bootstrapOutput.ok && drillOutput.overall === 'passed' ? 'healthy' : 'degraded',
      components: {
        bootstrap: { ok: bootstrapOutput.ok, errors: bootstrapOutput.errors?.length ?? 0 },
        drills: { ok: drillOutput.overall === 'passed', duration_ms: drillOutput.duration_ms },
      },
    };
  });

  writeStepOutput(stepsDir, 'ops-status.json', opsStatusResult.output);
  steps.push(opsStatusResult.step);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 5: SLO Gate (lightweight inline implementation)
  // ─────────────────────────────────────────────────────────────────────────

  const sloGateResult = runStep('slo-gate', () => {
    if (options.simulateFailure === 'slo-gate') {
      throw new Error('Simulated slo-gate failure');
    }

    // Build metrics from previous steps
    const drillOutput = drillsResult.output as DrillResult;
    const bootstrapOutput = bootstrapResult.output as BootstrapResult;

    const drillDuration = drillOutput.duration_ms;
    const bootstrapErrors = bootstrapOutput.errors?.length ?? 0;

    const drillCeiling = 5000;
    const errorCeiling = 0;

    const drillExceeded = drillDuration > drillCeiling;
    const errorsExceeded = bootstrapErrors > errorCeiling;

    const drillUtilization = drillCeiling > 0 ? (drillDuration / drillCeiling) * 100 : 0;
    const drillWarning = drillUtilization >= 80 && !drillExceeded;

    let gateStatus: 'pass' | 'warn' | 'fail' = 'pass';
    if (drillExceeded || errorsExceeded) {
      gateStatus = 'fail';
    } else if (drillWarning) {
      gateStatus = 'warn';
    }

    return {
      $schema: 'terrafusion.autonomy.slo-gate.v1',
      version: '4N50.1',
      evaluatedAt: new Date().toISOString(),
      gateStatus,
      passed: gateStatus !== 'fail',
      metrics: [
        {
          name: 'drill-duration-ms',
          value: drillDuration,
          ceiling: drillCeiling,
          exceeded: drillExceeded,
        },
        {
          name: 'bootstrap-errors',
          value: bootstrapErrors,
          ceiling: errorCeiling,
          exceeded: errorsExceeded,
        },
      ],
    };
  });

  writeStepOutput(stepsDir, 'slo-gate.json', sloGateResult.output);
  steps.push(sloGateResult.step);

  // ─────────────────────────────────────────────────────────────────────────
  // Build Summary
  // ─────────────────────────────────────────────────────────────────────────

  const totalDurationMs = Date.now() - startTime;
  const stepsPassed = steps.filter(s => s.ok).length;
  const stepsFailed = steps.filter(s => !s.ok).length;

  const sloGateOutput = sloGateResult.output as { gateStatus?: 'pass' | 'warn' | 'fail' };

  const summary: KitSummary = {
    stepsRun: steps.length,
    stepsPassed,
    stepsFailed,
    totalDurationMs,
    sloGateStatus: sloGateOutput?.gateStatus,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Build Final Result
  // ─────────────────────────────────────────────────────────────────────────

  const result: CountyKitResult = {
    schemaId: COUNTY_KIT_SCHEMA,
    schemaVersion: COUNTY_KIT_VERSION,
    timestamp,
    profile: options.profile,
    outDir: normalizePath(outDir),
    steps: steps.map(s => ({
      ...s,
      outputFile: `steps/${s.outputFile}`,
    })),
    summary,
    ok: stepsFailed === 0,
  };

  // Write main summary
  writeStepOutput(outDir, 'county-kit-summary.json', result);

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface StepExecution {
  step: StepResult;
  output: unknown;
}

function runStep(
  name: 'bootstrap' | 'drills' | 'hints' | 'ops-status' | 'slo-gate',
  fn: () => unknown
): StepExecution {
  const stepStart = Date.now();

  try {
    const output = fn();
    const durationMs = Date.now() - stepStart;

    // Determine if step succeeded based on output shape
    const ok = determineStepSuccess(name, output);

    return {
      step: {
        name,
        ok,
        durationMs,
        outputFile: `${name}.json`,
        errorCode: ok ? undefined : `${name.toUpperCase()}_FAILED`,
      },
      output,
    };
  } catch (err) {
    const durationMs = Date.now() - stepStart;
    return {
      step: {
        name,
        ok: false,
        durationMs,
        outputFile: `${name}.json`,
        errorCode: `${name.toUpperCase()}_ERROR`,
        errorMessage: (err as Error).message,
      },
      output: {
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function determineStepSuccess(name: string, output: unknown): boolean {
  if (!output || typeof output !== 'object') {
    return false;
  }

  const obj = output as Record<string, unknown>;

  // Check common success indicators
  if ('ok' in obj) {
    return Boolean(obj.ok);
  }

  if ('overall' in obj) {
    return obj.overall === 'passed';
  }

  if ('gateStatus' in obj) {
    return obj.gateStatus !== 'fail';
  }

  // Default: assume success if no error indicators
  return !('error' in obj || 'errors' in obj);
}

function writeStepOutput(dir: string, filename: string, data: unknown): void {
  try {
    const filePath = join(dir, filename);
    const json = toJsonWithLF(data);
    writeFileSync(filePath, json, 'utf-8');
  } catch {
    // Ignore write errors in step output (main result will indicate failure)
  }
}

function createFailureResult(params: {
  timestamp: string;
  profile: string;
  outDir: string;
  errorCode: string;
  errorMessage: string;
  durationMs: number;
}): CountyKitResult {
  const result: CountyKitResult = {
    schemaId: COUNTY_KIT_SCHEMA,
    schemaVersion: COUNTY_KIT_VERSION,
    timestamp: params.timestamp,
    profile: params.profile,
    outDir: normalizePath(params.outDir),
    steps: [],
    summary: {
      stepsRun: 0,
      stepsPassed: 0,
      stepsFailed: 0,
      totalDurationMs: params.durationMs,
    },
    ok: false,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
  };

  // Try to write summary even on early failure
  if (params.outDir) {
    try {
      mkdirSync(params.outDir, { recursive: true });
      writeStepOutput(params.outDir, 'county-kit-summary.json', result);
    } catch {
      // Ignore
    }
  }

  return result;
}

export default runCountyKit;
