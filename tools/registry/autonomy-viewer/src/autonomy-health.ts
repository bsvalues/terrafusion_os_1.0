/**
 * Phase 4N30 – Autonomy Health Governor + Error Budget
 * =====================================================
 *
 * Measures autonomy stability using objective signals from recent runs.
 * Decides whether autonomy should continue, warn, or pause.
 * Records the decision in evidence-index + ledger.
 *
 * Design principles:
 * - Deterministic: same input → identical output
 * - Fail-closed: ambiguous signals → conservative decision
 * - Auditable: every decision is provable from evidence
 * - Non-destructive: recommends pause, doesn't force it
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const HEALTH_SCHEMA = 'terrafusion.autonomy.health.v1';
export const HEALTH_TOOL_VERSION = '4N30.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type HealthLevel = 'ok' | 'warn' | 'pause_recommended' | 'pause_required';

export type FailureCategory =
  | 'verify_bundle_failed'
  | 'verify_custody_failed'
  | 'signatures_failed'
  | 'pins_failed'
  | 'rekor_failed'
  | 'publisher_asset_missing'
  | 'tpi_failed'
  | 'break_glass_failed'
  | 'role_binding_failed'
  | 'workflow_failure';

export interface HealthThresholds {
  /** Number of failures to trigger warn level */
  warnFailures: number;
  /** Number of failures to trigger pause_recommended */
  pauseRecommendedFailures: number;
  /** Number of failures to trigger pause_required */
  pauseRequiredFailures: number;
  /** Categories that trigger immediate warn on first occurrence */
  immediateWarnCategories: FailureCategory[];
  /** Categories that trigger pause_recommended on N occurrences */
  criticalCategories: FailureCategory[];
  /** Number of critical category occurrences to trigger pause_recommended */
  criticalThreshold: number;
  /** Combination that triggers pause_required (any two of these in same window) */
  combinedPauseCategories: FailureCategory[];
}

export interface HealthWindow {
  /** Maximum number of records to consider */
  maxRecords: number;
  /** Maximum hours to look back */
  hours: number;
  /** Actual number of records in window */
  recordCount: number;
  /** First record ID in window (oldest) */
  fromRecordId: string | null;
  /** Last record ID in window (newest) */
  toRecordId: string | null;
  /** Window start timestamp */
  windowStart: string;
  /** Window end timestamp */
  windowEnd: string;
}

export interface HealthTotals {
  /** Records with no failures */
  ok: number;
  /** Records with warn-level issues */
  warn: number;
  /** Records with failures */
  failed: number;
}

export interface HealthDecision {
  /** Health level */
  level: HealthLevel;
  /** Reason codes explaining the decision */
  reasonCodes: string[];
  /** Recommended TTL if pause is suggested (minutes) */
  recommendedTtlMinutes?: number;
}

export interface SuggestedPause {
  /** Human-readable reason */
  reason: string;
  /** Suggested pause duration in minutes */
  durationMinutes: number;
  /** Whether verification should be strict during pause */
  strict: boolean;
}

export interface AutonomyHealth {
  schema: typeof HEALTH_SCHEMA;
  toolVersion: typeof HEALTH_TOOL_VERSION;
  generatedAt: string;
  window: HealthWindow;
  totals: HealthTotals;
  failuresByCategory: Record<FailureCategory, number>;
  decision: HealthDecision;
  suggestedPause: SuggestedPause | null;
}

export interface HealthSummary {
  level: HealthLevel;
  failedCount: number;
  topCategories: FailureCategory[];
  suggestedPauseTtlMinutes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Index Record (minimal subset for health calculation)
// ─────────────────────────────────────────────────────────────────────────────

export interface EvidenceRecordForHealth {
  runId: string;
  generatedAt: string;
  tier: 'ci' | 'merged' | 'incident';
  verify?: {
    ok: boolean;
    strict?: boolean;
  };
  custody?: {
    ok?: boolean;
  };
  signature?: {
    signed: boolean;
    verified?: { ok: boolean };
    pinned?: boolean;
  };
  rekor?: {
    anchored: boolean;
  };
  tpi?: {
    ok: boolean;
  };
  breakGlass?: {
    activated: boolean;
    ok?: boolean;
  };
  roleBinding?: {
    ok: boolean;
    skipped?: boolean;
  };
  localBundleMissing?: boolean;
  outcome?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Thresholds (conservative)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: HealthThresholds = {
  warnFailures: 2,
  pauseRecommendedFailures: 3,
  pauseRequiredFailures: 5,
  immediateWarnCategories: ['rekor_failed'],
  criticalCategories: ['pins_failed', 'rekor_failed'],
  criticalThreshold: 2,
  combinedPauseCategories: ['pins_failed', 'rekor_failed', 'tpi_failed'],
};

export const DEFAULT_WINDOW = {
  maxRecords: 20,
  hours: 24,
};

// ─────────────────────────────────────────────────────────────────────────────
// Failure Category Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract failure categories from a single evidence record.
 * Deterministic mapping based on field values.
 */
export function extractFailureCategories(record: EvidenceRecordForHealth): FailureCategory[] {
  const categories: FailureCategory[] = [];

  // verify_bundle_failed
  if (record.verify && record.verify.ok === false) {
    categories.push('verify_bundle_failed');
  }

  // verify_custody_failed
  if (record.custody && record.custody.ok === false) {
    categories.push('verify_custody_failed');
  }

  // signatures_failed
  if (record.signature?.signed && record.signature.verified?.ok === false) {
    categories.push('signatures_failed');
  }

  // pins_failed
  if (record.signature?.signed && record.signature.pinned === false) {
    categories.push('pins_failed');
  }

  // rekor_failed
  if (record.signature?.signed && record.rekor?.anchored === false) {
    categories.push('rekor_failed');
  }

  // publisher_asset_missing
  if (record.localBundleMissing === true) {
    categories.push('publisher_asset_missing');
  }

  // tpi_failed (only for non-ci tiers)
  if (record.tier !== 'ci' && record.tpi && record.tpi.ok === false) {
    categories.push('tpi_failed');
  }

  // break_glass_failed
  if (record.breakGlass?.activated && record.breakGlass.ok === false) {
    categories.push('break_glass_failed');
  }

  // role_binding_failed
  if (record.roleBinding && !record.roleBinding.skipped && record.roleBinding.ok === false) {
    categories.push('role_binding_failed');
  }

  // workflow_failure (no verify result at all when expected)
  if (record.outcome === 'error' || record.outcome === 'workflow_failed') {
    categories.push('workflow_failure');
  }

  return categories;
}

// ─────────────────────────────────────────────────────────────────────────────
// Window Filtering
// ─────────────────────────────────────────────────────────────────────────────

export interface WindowOptions {
  maxRecords?: number;
  hours?: number;
  now?: Date;
}

/**
 * Filter records to the specified window.
 * Returns records sorted by date descending (newest first).
 */
export function filterToWindow(
  records: EvidenceRecordForHealth[],
  options: WindowOptions = {}
): EvidenceRecordForHealth[] {
  const maxRecords = options.maxRecords ?? DEFAULT_WINDOW.maxRecords;
  const hours = options.hours ?? DEFAULT_WINDOW.hours;
  const now = options.now ?? new Date();

  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

  // Filter by time, sort by date descending
  const filtered = records
    .filter(r => new Date(r.generatedAt) >= cutoff)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

  // Take only maxRecords
  return filtered.slice(0, maxRecords);
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Calculation
// ─────────────────────────────────────────────────────────────────────────────

export interface CalculateHealthOptions {
  thresholds?: HealthThresholds;
  window?: WindowOptions;
  now?: Date;
}

/**
 * Calculate autonomy health from evidence records.
 * Deterministic: same input → identical output.
 */
export function calculateHealth(
  records: EvidenceRecordForHealth[],
  options: CalculateHealthOptions = {}
): AutonomyHealth {
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const windowOpts = options.window ?? {};
  const now = options.now ?? new Date();

  // Filter to window
  const windowedRecords = filterToWindow(records, { ...windowOpts, now });

  // Initialize failure counts
  const failuresByCategory: Record<FailureCategory, number> = {
    verify_bundle_failed: 0,
    verify_custody_failed: 0,
    signatures_failed: 0,
    pins_failed: 0,
    rekor_failed: 0,
    publisher_asset_missing: 0,
    tpi_failed: 0,
    break_glass_failed: 0,
    role_binding_failed: 0,
    workflow_failure: 0,
  };

  // Count records by status
  let okCount = 0;
  let warnCount = 0;
  let failedCount = 0;

  // Extract failures from each record
  for (const record of windowedRecords) {
    const categories = extractFailureCategories(record);

    if (categories.length === 0) {
      okCount++;
    } else if (categories.some(c => thresholds.criticalCategories.includes(c))) {
      failedCount++;
    } else {
      warnCount++;
    }

    for (const cat of categories) {
      failuresByCategory[cat]++;
    }
  }

  // Calculate total failures
  const totalFailures = Object.values(failuresByCategory).reduce((a, b) => a + b, 0);

  // Determine health level
  const { level, reasonCodes, recommendedTtl } = determineHealthLevel(
    totalFailures,
    failuresByCategory,
    thresholds
  );

  // Build window metadata
  const windowStart =
    windowedRecords.length > 0
      ? windowedRecords[windowedRecords.length - 1].generatedAt
      : now.toISOString();
  const windowEnd = windowedRecords.length > 0 ? windowedRecords[0].generatedAt : now.toISOString();

  const window: HealthWindow = {
    maxRecords: windowOpts.maxRecords ?? DEFAULT_WINDOW.maxRecords,
    hours: windowOpts.hours ?? DEFAULT_WINDOW.hours,
    recordCount: windowedRecords.length,
    fromRecordId:
      windowedRecords.length > 0 ? windowedRecords[windowedRecords.length - 1].runId : null,
    toRecordId: windowedRecords.length > 0 ? windowedRecords[0].runId : null,
    windowStart,
    windowEnd,
  };

  // Build suggested pause if needed
  let suggestedPause: SuggestedPause | null = null;
  if (level === 'pause_recommended' || level === 'pause_required') {
    const topCategories = getTopCategories(failuresByCategory, 3);
    suggestedPause = {
      reason: `Error budget exceeded: ${totalFailures} failures in window. Top: ${topCategories.join(', ')}`,
      durationMinutes: recommendedTtl ?? (level === 'pause_required' ? 120 : 60),
      strict: true,
    };
  }

  return {
    schema: HEALTH_SCHEMA,
    toolVersion: HEALTH_TOOL_VERSION,
    generatedAt: now.toISOString(),
    window,
    totals: {
      ok: okCount,
      warn: warnCount,
      failed: failedCount,
    },
    failuresByCategory,
    decision: {
      level,
      reasonCodes,
      recommendedTtlMinutes: recommendedTtl,
    },
    suggestedPause,
  };
}

/**
 * Determine health level based on failure counts and thresholds.
 */
function determineHealthLevel(
  totalFailures: number,
  failuresByCategory: Record<FailureCategory, number>,
  thresholds: HealthThresholds
): { level: HealthLevel; reasonCodes: string[]; recommendedTtl?: number } {
  const reasonCodes: string[] = [];

  // Check for pause_required conditions
  if (totalFailures >= thresholds.pauseRequiredFailures) {
    reasonCodes.push(`total_failures_${totalFailures}_gte_${thresholds.pauseRequiredFailures}`);
    return { level: 'pause_required', reasonCodes, recommendedTtl: 120 };
  }

  // Check for combined critical categories
  const criticalCount = thresholds.combinedPauseCategories.filter(
    cat => failuresByCategory[cat] > 0
  ).length;
  if (criticalCount >= 2) {
    reasonCodes.push(`combined_critical_categories_${criticalCount}`);
    return { level: 'pause_required', reasonCodes, recommendedTtl: 120 };
  }

  // Check for pause_recommended conditions
  if (totalFailures >= thresholds.pauseRecommendedFailures) {
    reasonCodes.push(`total_failures_${totalFailures}_gte_${thresholds.pauseRecommendedFailures}`);
    return { level: 'pause_recommended', reasonCodes, recommendedTtl: 60 };
  }

  // Check for critical category threshold
  for (const cat of thresholds.criticalCategories) {
    if (failuresByCategory[cat] >= thresholds.criticalThreshold) {
      reasonCodes.push(
        `${cat}_count_${failuresByCategory[cat]}_gte_${thresholds.criticalThreshold}`
      );
      return { level: 'pause_recommended', reasonCodes, recommendedTtl: 60 };
    }
  }

  // Check for warn conditions
  if (totalFailures >= thresholds.warnFailures) {
    reasonCodes.push(`total_failures_${totalFailures}_gte_${thresholds.warnFailures}`);
    return { level: 'warn', reasonCodes };
  }

  // Check for immediate warn categories
  for (const cat of thresholds.immediateWarnCategories) {
    if (failuresByCategory[cat] > 0) {
      reasonCodes.push(`immediate_warn_${cat}`);
      return { level: 'warn', reasonCodes };
    }
  }

  // All good
  return { level: 'ok', reasonCodes: ['no_failures_in_window'] };
}

/**
 * Get top N failure categories by count.
 */
function getTopCategories(
  failuresByCategory: Record<FailureCategory, number>,
  n: number
): FailureCategory[] {
  return (Object.entries(failuresByCategory) as [FailureCategory, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Generate Health Summary for Evidence Index
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a minimal health summary for inclusion in evidence index.
 */
export function generateHealthSummary(health: AutonomyHealth): HealthSummary {
  const failedCount = Object.values(health.failuresByCategory).reduce((a, b) => a + b, 0);
  const topCategories = getTopCategories(health.failuresByCategory, 3);

  return {
    level: health.decision.level,
    failedCount,
    topCategories,
    suggestedPauseTtlMinutes: health.decision.recommendedTtlMinutes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// File I/O
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load evidence records from index file.
 */
export function loadEvidenceRecords(indexPath: string): EvidenceRecordForHealth[] {
  if (!fs.existsSync(indexPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const data = JSON.parse(content);

    // Handle both array and object with records field
    if (Array.isArray(data)) {
      return data;
    }
    if (data.records && Array.isArray(data.records)) {
      return data.records;
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Save health result to file.
 */
export function saveHealth(health: AutonomyHealth, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Deterministic JSON output (sorted keys)
  const json = JSON.stringify(health, Object.keys(health).sort(), 2);
  fs.writeFileSync(outputPath, json + '\n', 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export { getTopCategories };
