/**
 * Phase 4N33 – SLO Guard + Error Budget Enforcement
 * ==================================================
 *
 * Provides measurable error budgets for autonomy governance.
 *
 * Design principles:
 * - Deterministic: budget calculation is provable from evidence
 * - Fail-closed: missing/invalid data exhausts budget by default
 * - Auditable: every budget block generates a proof artifact
 * - Time-bounded: failures age out of window automatically
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    type EvidenceRecordForHealth,
    type FailureCategory,
    extractFailureCategories,
} from './autonomy-health.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const SLO_SCHEMA = 'terrafusion.autonomy.slo.v1';
export const SLO_TOOL_VERSION = '4N33.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Policy
// ─────────────────────────────────────────────────────────────────────────────

export interface SloWindows {
  runWindow: number;
  runWindowDescription?: string;
  timeWindowDays: number;
  timeWindowDescription?: string;
}

export interface SloBudgetTargets {
  criticalMaxPerWindow: number;
  criticalDescription?: string;
  warnMaxPerWindow: number;
  warnDescription?: string;
  okMinSuccessRate: number;
  okMinSuccessRateDescription?: string;
}

export interface SloSeverityLevel {
  weight: number;
  categories: FailureCategory[];
  description?: string;
}

export interface SloSeverityWeights {
  critical: SloSeverityLevel;
  high: SloSeverityLevel;
  medium: SloSeverityLevel;
  low: SloSeverityLevel;
}

export interface SloBudgetLevel {
  description: string;
  minBudgetPercent: number;
  burnRateMax?: number;
  recommendedCanaryMaxStage?: string;
  triggersPause?: boolean;
}

export interface SloBudgetLevels {
  ok: SloBudgetLevel;
  burning: SloBudgetLevel;
  exhausted: SloBudgetLevel;
}

export interface SloEnforcement {
  blockOnExhausted: boolean;
  blockOnExhaustedDescription?: string;
  demoteCanaryOnExhausted: boolean;
  demoteCanaryToStage?: string;
  pauseRecommendedTTLHours: number;
  pauseRequiredTTLHours: number;
  requiresProofOnBlock: boolean;
}

export interface SloRecovery {
  autoRecoverOnWindowRolloff: boolean;
  autoRecoverDescription?: string;
  manualRecoveryRequiresProof: boolean;
  cooldownAfterRecoveryHours: number;
}

export interface SloReporting {
  emitBudgetToEvidenceIndex: boolean;
  emitBudgetToLedger: boolean;
  alertOnBurning: boolean;
  alertOnExhausted: boolean;
}

export interface SloPolicy {
  $schema: string;
  $version: string;
  $description?: string;
  windows: SloWindows;
  budgetTargets: SloBudgetTargets;
  severityWeights: SloSeverityWeights;
  budgetLevels: SloBudgetLevels;
  enforcement: SloEnforcement;
  recovery: SloRecovery;
  reporting: SloReporting;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Budget Calculation
// ─────────────────────────────────────────────────────────────────────────────

export type BudgetLevel = 'ok' | 'burning' | 'exhausted';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface FailureCount {
  category: FailureCategory;
  severity: Severity;
  weight: number;
  count: number;
  weightedScore: number;
  recordIds: string[];
}

export interface BudgetWindow {
  recordCount: number;
  windowStart: string;
  windowEnd: string;
  oldestRecordAt: string;
  newestRecordAt: string;
  recordsIncluded: number;
  recordsExcluded: number;
}

export interface BudgetRemaining {
  critical: number;
  warn: number;
}

export interface BudgetConsumed {
  critical: number;
  warn: number;
  weightedScore: number;
}

export interface BudgetResult {
  schema: typeof SLO_SCHEMA;
  toolVersion: typeof SLO_TOOL_VERSION;
  generatedAt: string;
  level: BudgetLevel;
  budgetPercent: number;
  remaining: BudgetRemaining;
  consumed: BudgetConsumed;
  burnRate: number;
  window: BudgetWindow;
  failuresByCategory: FailureCount[];
  topFailures: FailureCount[];
  reasons: string[];
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Enforcement Proof
// ─────────────────────────────────────────────────────────────────────────────

export type SloDecision = 'allowed' | 'blocked';

export interface SloEnforcementProof {
  schema: typeof SLO_SCHEMA;
  toolVersion: typeof SLO_TOOL_VERSION;
  generatedAt: string;
  decision: SloDecision;
  level: BudgetLevel;
  budgetPercent: number;
  remaining: BudgetRemaining;
  consumed: BudgetConsumed;
  burnRate: number;
  blockReason: string | null;
  topFailures: FailureCount[];
  recommendations: string[];
  actor: string;
  command: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Paths
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_POLICY_PATH = path.join(__dirname, '..', 'AUTONOMY_SLO_POLICY.json');
const DEFAULT_STATE_PATH = path.join(__dirname, '..', 'autonomy-slo-state.json');
const DEFAULT_PROOFS_DIR = path.join(__dirname, '..', '.out');

// ─────────────────────────────────────────────────────────────────────────────
// Load/Save
// ─────────────────────────────────────────────────────────────────────────────

export function loadSloPolicy(filePath: string = DEFAULT_POLICY_PATH): SloPolicy {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as SloPolicy;
}

export function saveBudgetResult(
  result: BudgetResult,
  filePath: string = DEFAULT_STATE_PATH
): void {
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity Mapping
// ─────────────────────────────────────────────────────────────────────────────

function getCategorySeverity(
  category: FailureCategory,
  weights: SloSeverityWeights
): { severity: Severity; weight: number } {
  if (weights.critical.categories.includes(category)) {
    return { severity: 'critical', weight: weights.critical.weight };
  }
  if (weights.high.categories.includes(category)) {
    return { severity: 'high', weight: weights.high.weight };
  }
  if (weights.medium.categories.includes(category)) {
    return { severity: 'medium', weight: weights.medium.weight };
  }
  if (weights.low.categories.includes(category)) {
    return { severity: 'low', weight: weights.low.weight };
  }
  // Unknown category gets low weight
  return { severity: 'low', weight: 1 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Window Filtering
// ─────────────────────────────────────────────────────────────────────────────

interface WindowFilterResult {
  included: EvidenceRecordForHealth[];
  excluded: EvidenceRecordForHealth[];
  windowStart: Date;
  windowEnd: Date;
}

function filterToWindow(
  records: EvidenceRecordForHealth[],
  windows: SloWindows,
  now: Date = new Date()
): WindowFilterResult {
  const windowEnd = now;
  const windowStart = new Date(now.getTime() - windows.timeWindowDays * 24 * 60 * 60 * 1000);

  // Filter by time window first
  const timeFiltered = records.filter(r => {
    const recordDate = new Date(r.generatedAt);
    return recordDate >= windowStart && recordDate <= windowEnd;
  });

  // Sort by date descending (newest first)
  const sorted = [...timeFiltered].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );

  // Take only runWindow records
  const included = sorted.slice(0, windows.runWindow);
  const excluded = sorted.slice(windows.runWindow);

  return {
    included,
    excluded,
    windowStart,
    windowEnd,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget Computation
// ─────────────────────────────────────────────────────────────────────────────

export interface ComputeBudgetOptions {
  records: EvidenceRecordForHealth[];
  policy: SloPolicy;
  now?: Date;
  strict?: boolean;
}

export function computeBudget(options: ComputeBudgetOptions): BudgetResult {
  const { records, policy, now = new Date(), strict = false } = options;

  // Fail-closed on empty records in strict mode
  if (strict && records.length === 0) {
    return createExhaustedResult(policy, now, 'No evidence records available (strict mode)');
  }

  // Filter to window
  const { included, excluded, windowStart, windowEnd } = filterToWindow(
    records,
    policy.windows,
    now
  );

  // If no records in window in strict mode, fail-closed
  if (strict && included.length === 0) {
    return createExhaustedResult(policy, now, 'No records in evaluation window (strict mode)');
  }

  // Count failures by category
  const failureCounts: Map<FailureCategory, { count: number; recordIds: string[] }> = new Map();

  for (const record of included) {
    const categories = extractFailureCategories(record);
    for (const category of categories) {
      const existing = failureCounts.get(category) || { count: 0, recordIds: [] };
      existing.count++;
      existing.recordIds.push(record.runId);
      failureCounts.set(category, existing);
    }
  }

  // Build failure list with severity weights
  const failuresByCategory: FailureCount[] = [];
  let criticalCount = 0;
  let warnCount = 0;
  let totalWeightedScore = 0;

  for (const [category, { count, recordIds }] of failureCounts) {
    const { severity, weight } = getCategorySeverity(category, policy.severityWeights);
    const weightedScore = count * weight;
    totalWeightedScore += weightedScore;

    if (severity === 'critical') {
      criticalCount += count;
    } else {
      warnCount += count;
    }

    failuresByCategory.push({
      category,
      severity,
      weight,
      count,
      weightedScore,
      recordIds,
    });
  }

  // Sort by weighted score descending
  failuresByCategory.sort((a, b) => b.weightedScore - a.weightedScore);
  const topFailures = failuresByCategory.slice(0, 5);

  // Calculate remaining budget
  const criticalRemaining = Math.max(0, policy.budgetTargets.criticalMaxPerWindow - criticalCount);
  const warnRemaining = Math.max(0, policy.budgetTargets.warnMaxPerWindow - warnCount);

  // Calculate budget percentage
  // 100% = no failures, 0% = budget exhausted
  const maxBudgetPoints =
    policy.budgetTargets.criticalMaxPerWindow * 100 + policy.budgetTargets.warnMaxPerWindow * 10;
  const consumedPoints = criticalCount * 100 + warnCount * 10;
  const budgetPercent =
    maxBudgetPoints > 0
      ? Math.max(0, Math.round(((maxBudgetPoints - consumedPoints) / maxBudgetPoints) * 100))
      : 100;

  // Calculate burn rate (failures per day)
  const windowDays = Math.max(
    1,
    (windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  const totalFailures = criticalCount + warnCount;
  const burnRate = Math.round((totalFailures / windowDays) * 10) / 10;

  // Determine budget level
  let level: BudgetLevel = 'ok';
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (criticalCount > policy.budgetTargets.criticalMaxPerWindow) {
    level = 'exhausted';
    reasons.push(
      `Critical failures (${criticalCount}) exceed limit (${policy.budgetTargets.criticalMaxPerWindow})`
    );
  } else if (budgetPercent < policy.budgetLevels.exhausted.minBudgetPercent) {
    level = 'exhausted';
    reasons.push(`Budget (${budgetPercent}%) below exhausted threshold`);
  } else if (budgetPercent < policy.budgetLevels.burning.minBudgetPercent) {
    level = 'burning';
    reasons.push(`Budget (${budgetPercent}%) below burning threshold`);
  } else if (burnRate > (policy.budgetLevels.burning.burnRateMax || Infinity)) {
    level = 'burning';
    reasons.push(`Burn rate (${burnRate}/day) exceeds warning threshold`);
  } else if (warnCount > policy.budgetTargets.warnMaxPerWindow) {
    level = 'burning';
    reasons.push(
      `Warning failures (${warnCount}) exceed limit (${policy.budgetTargets.warnMaxPerWindow})`
    );
  } else {
    reasons.push('Budget healthy');
  }

  // Add recommendations
  if (level === 'exhausted') {
    recommendations.push(
      `Pause autonomy: pnpm perf:autonomy pause --reason "SLO budget exhausted" --duration ${policy.enforcement.pauseRequiredTTLHours}h`
    );
    recommendations.push('Investigate top failure categories before resuming');
    if (policy.enforcement.demoteCanaryOnExhausted) {
      recommendations.push(
        `Demote canary: pnpm perf:autonomy canary demote --to ${policy.enforcement.demoteCanaryToStage}`
      );
    }
  } else if (level === 'burning') {
    recommendations.push('Monitor closely - budget degrading');
    if (policy.budgetLevels.burning.recommendedCanaryMaxStage) {
      recommendations.push(
        `Consider limiting canary to ${policy.budgetLevels.burning.recommendedCanaryMaxStage}`
      );
    }
    recommendations.push('Review top failure categories for patterns');
  }

  // Build window info
  const oldestRecord = included.length > 0 ? included[included.length - 1].generatedAt : '';
  const newestRecord = included.length > 0 ? included[0].generatedAt : '';

  return {
    schema: SLO_SCHEMA,
    toolVersion: SLO_TOOL_VERSION,
    generatedAt: now.toISOString(),
    level,
    budgetPercent,
    remaining: {
      critical: criticalRemaining,
      warn: warnRemaining,
    },
    consumed: {
      critical: criticalCount,
      warn: warnCount,
      weightedScore: totalWeightedScore,
    },
    burnRate,
    window: {
      recordCount: included.length,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      oldestRecordAt: oldestRecord,
      newestRecordAt: newestRecord,
      recordsIncluded: included.length,
      recordsExcluded: excluded.length,
    },
    failuresByCategory,
    topFailures,
    reasons,
    recommendations,
  };
}

function createExhaustedResult(policy: SloPolicy, now: Date, reason: string): BudgetResult {
  return {
    schema: SLO_SCHEMA,
    toolVersion: SLO_TOOL_VERSION,
    generatedAt: now.toISOString(),
    level: 'exhausted',
    budgetPercent: 0,
    remaining: { critical: 0, warn: 0 },
    consumed: { critical: 0, warn: 0, weightedScore: 0 },
    burnRate: 0,
    window: {
      recordCount: 0,
      windowStart: '',
      windowEnd: '',
      oldestRecordAt: '',
      newestRecordAt: '',
      recordsIncluded: 0,
      recordsExcluded: 0,
    },
    failuresByCategory: [],
    topFailures: [],
    reasons: [reason],
    recommendations: ['Investigate missing evidence and restore data integrity'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Enforcement Check
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckBudgetOptions {
  records: EvidenceRecordForHealth[];
  policy: SloPolicy;
  actor: string;
  command: string;
  strict?: boolean;
}

export interface CheckBudgetResult {
  allowed: boolean;
  proof: SloEnforcementProof;
}

export function checkBudget(options: CheckBudgetOptions): CheckBudgetResult {
  const { records, policy, actor, command, strict = true } = options;
  const now = new Date();

  const budget = computeBudget({ records, policy, now, strict });

  let allowed = true;
  let blockReason: string | null = null;

  if (budget.level === 'exhausted' && policy.enforcement.blockOnExhausted) {
    allowed = false;
    blockReason = budget.reasons[0] || 'SLO budget exhausted';
  }

  const proof: SloEnforcementProof = {
    schema: SLO_SCHEMA,
    toolVersion: SLO_TOOL_VERSION,
    generatedAt: now.toISOString(),
    decision: allowed ? 'allowed' : 'blocked',
    level: budget.level,
    budgetPercent: budget.budgetPercent,
    remaining: budget.remaining,
    consumed: budget.consumed,
    burnRate: budget.burnRate,
    blockReason,
    topFailures: budget.topFailures,
    recommendations: budget.recommendations,
    actor,
    command,
  };

  return { allowed, proof };
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof Save
// ─────────────────────────────────────────────────────────────────────────────

export function saveSloProof(
  proof: SloEnforcementProof,
  outDir: string = DEFAULT_PROOFS_DIR
): string {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const filename = `slo-proof-${Date.now()}.json`;
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(proof, null, 2));
  return filePath;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Summary
// ─────────────────────────────────────────────────────────────────────────────

export interface SloStatus {
  level: BudgetLevel;
  budgetPercent: number;
  criticalRemaining: number;
  criticalConsumed: number;
  warnRemaining: number;
  warnConsumed: number;
  burnRate: number;
  windowRecords: number;
  windowStart: string;
  windowEnd: string;
  topFailures: string[];
  recommendations: string[];
  allowed: boolean;
}

export function getBudgetStatus(records: EvidenceRecordForHealth[], policy: SloPolicy): SloStatus {
  const budget = computeBudget({ records, policy, strict: false });

  return {
    level: budget.level,
    budgetPercent: budget.budgetPercent,
    criticalRemaining: budget.remaining.critical,
    criticalConsumed: budget.consumed.critical,
    warnRemaining: budget.remaining.warn,
    warnConsumed: budget.consumed.warn,
    burnRate: budget.burnRate,
    windowRecords: budget.window.recordCount,
    windowStart: budget.window.windowStart,
    windowEnd: budget.window.windowEnd,
    topFailures: budget.topFailures.map(f => `${f.category} (${f.count}x, ${f.severity})`),
    recommendations: budget.recommendations,
    allowed: budget.level !== 'exhausted' || !policy.enforcement.blockOnExhausted,
  };
}
