/**
 * Phase 4N32 – Autonomy Canary Lane
 * ==================================
 *
 * Controls autonomy "blast radius" with graduated stages:
 * disabled → 1% → 5% → 10% → 25% → 50% → full
 *
 * Design principles:
 * - Deterministic: stage calculation is provable from evidence
 * - Fail-closed: any critical failure demotes immediately
 * - Auditable: every promotion/demotion generates a proof artifact
 * - Controlled: rate limits enforced per stage
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    type AutonomyHealth,
    type EvidenceRecordForHealth,
    type HealthLevel,
} from './autonomy-health.js';
import { checkPrerequisites, type ResumePrerequisite } from './autonomy-recovery.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const CANARY_SCHEMA = 'terrafusion.autonomy.canary.v1';
export const CANARY_TOOL_VERSION = '4N32.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Policy
// ─────────────────────────────────────────────────────────────────────────────

export type CanaryStageId =
  | 'disabled'
  | 'canary_1pct'
  | 'canary_5pct'
  | 'canary_10pct'
  | 'canary_25pct'
  | 'canary_50pct'
  | 'full';

export interface CanaryStage {
  id: CanaryStageId;
  label: string;
  blastRadius: number;
  maxPRsPerDay: number;
  maxAppliesPerRun: number;
  description: string;
}

export interface PromotionRequiredCheck {
  id: string;
  description: string;
}

export interface PromotionRules {
  minSuccessfulRunsForPromotion: number;
  minHoursAtStage: number;
  requiredHealthLevel: HealthLevel;
  requiredChecks: PromotionRequiredCheck[];
  promotionCooldownHours: number;
}

export interface DemotionTrigger {
  condition: string;
  demoteTo: CanaryStageId;
  reason: string;
}

export interface DemotionRules {
  immediateDemotionTriggers: DemotionTrigger[];
  autoPauseOnDemotion: boolean;
  demotionRequiresProof: boolean;
}

export interface LockPolicy {
  lockOnManualDemotion: boolean;
  lockDurationHours: number;
  unlockRequiresOperatorApproval: boolean;
}

export interface CanaryDefaults {
  initialStage: CanaryStageId;
  maxAutoPromotionStage: CanaryStageId;
  fullRequiresManualApproval: boolean;
}

export interface CanaryPolicy {
  $schema: string;
  $version: string;
  stages: CanaryStage[];
  promotionRules: PromotionRules;
  demotionRules: DemotionRules;
  lockPolicy: LockPolicy;
  defaults: CanaryDefaults;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: State
// ─────────────────────────────────────────────────────────────────────────────

export interface CanaryDayStats {
  date: string;
  prsCreated: number;
  appliesExecuted: number;
}

export interface CanaryHistoryEntry {
  timestamp: string;
  action: 'promote' | 'demote' | 'lock' | 'unlock';
  fromStage: CanaryStageId;
  toStage: CanaryStageId;
  reason: string;
  actor: string;
  proofPath?: string;
}

export interface CanaryState {
  currentStage: CanaryStageId;
  stageEnteredAt: string;
  successfulRunsAtStage: number;
  lastPromotionAt: string | null;
  lastDemotionAt: string | null;
  locked: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  lockedBy: string | null;
  lockExpiresAt: string | null;
  todayStats: CanaryDayStats;
  history: CanaryHistoryEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Proofs
// ─────────────────────────────────────────────────────────────────────────────

export type CanaryDecision = 'approved' | 'denied';

export interface PromotionEligibility {
  eligible: boolean;
  currentStage: CanaryStageId;
  targetStage: CanaryStageId;
  checksResults: Array<{
    checkId: string;
    satisfied: boolean;
    evidence: string;
  }>;
  hoursAtStage: number;
  minHoursRequired: number;
  successfulRuns: number;
  minRunsRequired: number;
  healthOk: boolean;
  blockers: string[];
}

export interface PromotionProof {
  schema: typeof CANARY_SCHEMA;
  toolVersion: typeof CANARY_TOOL_VERSION;
  generatedAt: string;
  decision: CanaryDecision;
  action: 'promote';
  fromStage: CanaryStageId;
  toStage: CanaryStageId;
  eligibility: PromotionEligibility;
  actor: string;
  command: string;
  dryRun: boolean;
}

export interface DemotionProof {
  schema: typeof CANARY_SCHEMA;
  toolVersion: typeof CANARY_TOOL_VERSION;
  generatedAt: string;
  decision: 'approved'; // demotions are always approved (fail-safe)
  action: 'demote';
  fromStage: CanaryStageId;
  toStage: CanaryStageId;
  trigger: string;
  reason: string;
  autoPaused: boolean;
  actor: string;
  command: string;
}

export interface RateLimitCheck {
  allowed: boolean;
  currentStage: CanaryStageId;
  maxPRsPerDay: number;
  currentPRsToday: number;
  maxAppliesPerRun: number;
  requestedApplies: number;
  blockers: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Paths
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_POLICY_PATH = path.join(__dirname, '..', 'AUTONOMY_CANARY_POLICY.json');
const DEFAULT_STATE_PATH = path.join(__dirname, '..', 'autonomy-canary-state.json');
const DEFAULT_PROOFS_DIR = path.join(__dirname, '..', '.out');

// ─────────────────────────────────────────────────────────────────────────────
// Stage Ordering
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_ORDER: CanaryStageId[] = [
  'disabled',
  'canary_1pct',
  'canary_5pct',
  'canary_10pct',
  'canary_25pct',
  'canary_50pct',
  'full',
];

export function getStageIndex(stageId: CanaryStageId): number {
  return STAGE_ORDER.indexOf(stageId);
}

export function getNextStage(stageId: CanaryStageId): CanaryStageId | null {
  const idx = getStageIndex(stageId);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function getPreviousStage(stageId: CanaryStageId): CanaryStageId | null {
  const idx = getStageIndex(stageId);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Load/Save
// ─────────────────────────────────────────────────────────────────────────────

export function loadCanaryPolicy(filePath: string = DEFAULT_POLICY_PATH): CanaryPolicy {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CanaryPolicy;
}

export function loadCanaryState(filePath: string = DEFAULT_STATE_PATH): CanaryState {
  if (!fs.existsSync(filePath)) {
    // Return default state
    return {
      currentStage: 'disabled',
      stageEnteredAt: new Date().toISOString(),
      successfulRunsAtStage: 0,
      lastPromotionAt: null,
      lastDemotionAt: null,
      locked: false,
      lockedAt: null,
      lockedReason: null,
      lockedBy: null,
      lockExpiresAt: null,
      todayStats: {
        date: new Date().toISOString().slice(0, 10),
        prsCreated: 0,
        appliesExecuted: 0,
      },
      history: [],
    };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CanaryState;
}

export function saveCanaryState(state: CanaryState, filePath: string = DEFAULT_STATE_PATH): void {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage Info
// ─────────────────────────────────────────────────────────────────────────────

export function getStageInfo(
  policy: CanaryPolicy,
  stageId: CanaryStageId
): CanaryStage | undefined {
  return policy.stages.find(s => s.id === stageId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotion Eligibility Check
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckPromotionOptions {
  policy: CanaryPolicy;
  state: CanaryState;
  health: AutonomyHealth;
  records: EvidenceRecordForHealth[];
}

export function checkPromotionEligibility(options: CheckPromotionOptions): PromotionEligibility {
  const { policy, state, health, records } = options;
  const now = new Date();

  const currentStage = state.currentStage;
  const targetStage = getNextStage(currentStage);
  const blockers: string[] = [];

  // Cannot promote if already at full
  if (!targetStage) {
    blockers.push('Already at maximum stage');
    return {
      eligible: false,
      currentStage,
      targetStage: currentStage,
      checksResults: [],
      hoursAtStage: 0,
      minHoursRequired: policy.promotionRules.minHoursAtStage,
      successfulRuns: state.successfulRunsAtStage,
      minRunsRequired: policy.promotionRules.minSuccessfulRunsForPromotion,
      healthOk: false,
      blockers,
    };
  }

  // Cannot promote if locked
  if (state.locked) {
    blockers.push('Canary is locked');
  }

  // Check if target exceeds max auto-promotion stage
  const maxAutoIdx = getStageIndex(policy.defaults.maxAutoPromotionStage);
  const targetIdx = getStageIndex(targetStage);
  if (targetIdx > maxAutoIdx) {
    blockers.push(
      `Target stage ${targetStage} exceeds max auto-promotion stage ${policy.defaults.maxAutoPromotionStage}`
    );
  }

  // Check time at current stage
  const stageEnteredAt = new Date(state.stageEnteredAt);
  const hoursAtStage = (now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60);
  if (hoursAtStage < policy.promotionRules.minHoursAtStage) {
    blockers.push(
      `Only ${hoursAtStage.toFixed(1)}h at stage, need ${policy.promotionRules.minHoursAtStage}h`
    );
  }

  // Check successful runs
  if (state.successfulRunsAtStage < policy.promotionRules.minSuccessfulRunsForPromotion) {
    blockers.push(
      `Only ${state.successfulRunsAtStage} successful runs, need ${policy.promotionRules.minSuccessfulRunsForPromotion}`
    );
  }

  // Check health level
  const healthOk = health.decision.level === policy.promotionRules.requiredHealthLevel;
  if (!healthOk) {
    blockers.push(
      `Health level is ${health.decision.level}, need ${policy.promotionRules.requiredHealthLevel}`
    );
  }

  // Check promotion cooldown
  if (state.lastPromotionAt) {
    const lastPromo = new Date(state.lastPromotionAt);
    const hoursSincePromo = (now.getTime() - lastPromo.getTime()) / (1000 * 60 * 60);
    if (hoursSincePromo < policy.promotionRules.promotionCooldownHours) {
      blockers.push(
        `Only ${hoursSincePromo.toFixed(1)}h since last promotion, cooldown is ${policy.promotionRules.promotionCooldownHours}h`
      );
    }
  }

  // Check required prerequisite checks
  const prereqs: ResumePrerequisite[] = policy.promotionRules.requiredChecks.map(c => ({
    id: c.id,
    description: c.description,
    check: c.id,
    required: true,
  }));

  const prereqResults = checkPrerequisites({
    records,
    prerequisites: prereqs,
  });

  const checksResults = prereqResults.map(r => ({
    checkId: r.id,
    satisfied: r.satisfied,
    evidence: r.evidence,
  }));

  for (const result of prereqResults) {
    if (!result.satisfied) {
      blockers.push(`Check ${result.id} not satisfied: ${result.evidence}`);
    }
  }

  return {
    eligible: blockers.length === 0,
    currentStage,
    targetStage,
    checksResults,
    hoursAtStage,
    minHoursRequired: policy.promotionRules.minHoursAtStage,
    successfulRuns: state.successfulRunsAtStage,
    minRunsRequired: policy.promotionRules.minSuccessfulRunsForPromotion,
    healthOk,
    blockers,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotion
// ─────────────────────────────────────────────────────────────────────────────

export interface PromoteOptions {
  policy: CanaryPolicy;
  state: CanaryState;
  health: AutonomyHealth;
  records: EvidenceRecordForHealth[];
  actor: string;
  command: string;
  dryRun?: boolean;
}

export interface PromoteResult {
  proof: PromotionProof;
  newState: CanaryState | null;
}

export function promote(options: PromoteOptions): PromoteResult {
  const { policy, state, health, records, actor, command, dryRun = false } = options;
  const now = new Date().toISOString();

  const eligibility = checkPromotionEligibility({ policy, state, health, records });

  const proof: PromotionProof = {
    schema: CANARY_SCHEMA,
    toolVersion: CANARY_TOOL_VERSION,
    generatedAt: now,
    decision: eligibility.eligible ? 'approved' : 'denied',
    action: 'promote',
    fromStage: eligibility.currentStage,
    toStage: eligibility.targetStage,
    eligibility,
    actor,
    command,
    dryRun,
  };

  if (!eligibility.eligible || dryRun) {
    return { proof, newState: null };
  }

  // Apply promotion
  const newState: CanaryState = {
    ...state,
    currentStage: eligibility.targetStage,
    stageEnteredAt: now,
    successfulRunsAtStage: 0,
    lastPromotionAt: now,
    todayStats: resetTodayStatsIfNeeded(state.todayStats),
    history: [
      ...state.history,
      {
        timestamp: now,
        action: 'promote',
        fromStage: eligibility.currentStage,
        toStage: eligibility.targetStage,
        reason: `Promotion approved after ${eligibility.successfulRuns} successful runs`,
        actor,
      },
    ],
  };

  return { proof, newState };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demotion Check
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckDemotionOptions {
  policy: CanaryPolicy;
  state: CanaryState;
  health: AutonomyHealth;
  records: EvidenceRecordForHealth[];
}

export interface DemotionCheck {
  shouldDemote: boolean;
  trigger: DemotionTrigger | null;
  currentStage: CanaryStageId;
  targetStage: CanaryStageId;
}

export function checkDemotion(options: CheckDemotionOptions): DemotionCheck {
  const { policy, state, health, records } = options;

  for (const trigger of policy.demotionRules.immediateDemotionTriggers) {
    let triggered = false;

    // Evaluate condition
    if (trigger.condition.includes('health.level')) {
      if (
        trigger.condition.includes('pause_required') &&
        health.decision.level === 'pause_required'
      ) {
        triggered = true;
      } else if (
        trigger.condition.includes('pause_recommended') &&
        health.decision.level === 'pause_recommended'
      ) {
        triggered = true;
      }
    } else if (trigger.condition === 'pins_failed') {
      // Check for pin failures in recent records
      const recentFails = records.slice(-3).filter(r => r.signature?.pinned === false);
      if (recentFails.length > 0) triggered = true;
    } else if (trigger.condition === 'rekor_failed') {
      const recentFails = records.slice(-3).filter(r => r.rekor?.anchored === false);
      if (recentFails.length > 0) triggered = true;
    } else if (trigger.condition === 'tpi_failed') {
      const recentFails = records.slice(-3).filter(r => r.tpi?.ok === false);
      if (recentFails.length > 0) triggered = true;
    }

    if (triggered) {
      return {
        shouldDemote: true,
        trigger,
        currentStage: state.currentStage,
        targetStage: trigger.demoteTo,
      };
    }
  }

  return {
    shouldDemote: false,
    trigger: null,
    currentStage: state.currentStage,
    targetStage: state.currentStage,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demotion
// ─────────────────────────────────────────────────────────────────────────────

export interface DemoteOptions {
  policy: CanaryPolicy;
  state: CanaryState;
  health: AutonomyHealth;
  records: EvidenceRecordForHealth[];
  actor: string;
  command: string;
  manualReason?: string;
  targetStage?: CanaryStageId;
}

export interface DemoteResult {
  proof: DemotionProof;
  newState: CanaryState;
  autoPaused: boolean;
}

export function demote(options: DemoteOptions): DemoteResult {
  const { policy, state, health, records, actor, command, manualReason, targetStage } = options;
  const now = new Date().toISOString();

  // Check for automatic demotion triggers
  const demotionCheck = checkDemotion({ policy, state, health, records });

  let finalTargetStage: CanaryStageId;
  let triggerReason: string;
  let triggerCondition: string;

  if (demotionCheck.shouldDemote && demotionCheck.trigger) {
    finalTargetStage = demotionCheck.trigger.demoteTo;
    triggerReason = demotionCheck.trigger.reason;
    triggerCondition = demotionCheck.trigger.condition;
  } else if (targetStage) {
    finalTargetStage = targetStage;
    triggerReason = manualReason || 'Manual demotion requested';
    triggerCondition = 'manual';
  } else {
    // Demote one stage down
    finalTargetStage = getPreviousStage(state.currentStage) || 'disabled';
    triggerReason = manualReason || 'Manual demotion requested';
    triggerCondition = 'manual';
  }

  const autoPaused = policy.demotionRules.autoPauseOnDemotion;

  const proof: DemotionProof = {
    schema: CANARY_SCHEMA,
    toolVersion: CANARY_TOOL_VERSION,
    generatedAt: now,
    decision: 'approved',
    action: 'demote',
    fromStage: state.currentStage,
    toStage: finalTargetStage,
    trigger: triggerCondition,
    reason: triggerReason,
    autoPaused,
    actor,
    command,
  };

  const shouldLock = policy.lockPolicy.lockOnManualDemotion && triggerCondition === 'manual';
  const lockExpiresAt = shouldLock
    ? new Date(Date.now() + policy.lockPolicy.lockDurationHours * 60 * 60 * 1000).toISOString()
    : null;

  const newState: CanaryState = {
    ...state,
    currentStage: finalTargetStage,
    stageEnteredAt: now,
    successfulRunsAtStage: 0,
    lastDemotionAt: now,
    locked: shouldLock,
    lockedAt: shouldLock ? now : state.lockedAt,
    lockedReason: shouldLock ? triggerReason : state.lockedReason,
    lockedBy: shouldLock ? actor : state.lockedBy,
    lockExpiresAt,
    todayStats: resetTodayStatsIfNeeded(state.todayStats),
    history: [
      ...state.history,
      {
        timestamp: now,
        action: 'demote',
        fromStage: state.currentStage,
        toStage: finalTargetStage,
        reason: triggerReason,
        actor,
      },
    ],
  };

  return { proof, newState, autoPaused };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lock/Unlock
// ─────────────────────────────────────────────────────────────────────────────

export interface LockOptions {
  state: CanaryState;
  policy: CanaryPolicy;
  actor: string;
  reason: string;
  durationHours?: number;
}

export function lock(options: LockOptions): CanaryState {
  const { state, policy, actor, reason, durationHours } = options;
  const now = new Date().toISOString();
  const hours = durationHours ?? policy.lockPolicy.lockDurationHours;
  const lockExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  return {
    ...state,
    locked: true,
    lockedAt: now,
    lockedReason: reason,
    lockedBy: actor,
    lockExpiresAt,
    history: [
      ...state.history,
      {
        timestamp: now,
        action: 'lock',
        fromStage: state.currentStage,
        toStage: state.currentStage,
        reason,
        actor,
      },
    ],
  };
}

export function unlock(state: CanaryState, actor: string, reason: string): CanaryState {
  const now = new Date().toISOString();

  return {
    ...state,
    locked: false,
    lockedAt: null,
    lockedReason: null,
    lockedBy: null,
    lockExpiresAt: null,
    history: [
      ...state.history,
      {
        timestamp: now,
        action: 'unlock',
        fromStage: state.currentStage,
        toStage: state.currentStage,
        reason,
        actor,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit Enforcement
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckRateLimitOptions {
  policy: CanaryPolicy;
  state: CanaryState;
  requestedApplies?: number;
}

export function checkRateLimit(options: CheckRateLimitOptions): RateLimitCheck {
  const { policy, state, requestedApplies = 1 } = options;
  const stage = getStageInfo(policy, state.currentStage);
  const blockers: string[] = [];

  if (!stage) {
    blockers.push(`Unknown stage: ${state.currentStage}`);
    return {
      allowed: false,
      currentStage: state.currentStage,
      maxPRsPerDay: 0,
      currentPRsToday: 0,
      maxAppliesPerRun: 0,
      requestedApplies,
      blockers,
    };
  }

  // Reset today stats if date changed
  const todayStats = resetTodayStatsIfNeeded(state.todayStats);
  const currentPRsToday = todayStats.prsCreated;

  // Check if locked
  if (state.locked) {
    blockers.push('Canary is locked');
  }

  // Check PRs per day (-1 means unlimited)
  if (stage.maxPRsPerDay >= 0 && currentPRsToday >= stage.maxPRsPerDay) {
    blockers.push(`Daily PR limit reached: ${currentPRsToday}/${stage.maxPRsPerDay}`);
  }

  // Check applies per run (-1 means unlimited)
  if (stage.maxAppliesPerRun >= 0 && requestedApplies > stage.maxAppliesPerRun) {
    blockers.push(`Applies per run limit exceeded: ${requestedApplies}/${stage.maxAppliesPerRun}`);
  }

  // Check if stage allows any activity
  if (stage.blastRadius === 0) {
    blockers.push('Stage has zero blast radius (disabled)');
  }

  return {
    allowed: blockers.length === 0,
    currentStage: state.currentStage,
    maxPRsPerDay: stage.maxPRsPerDay,
    currentPRsToday,
    maxAppliesPerRun: stage.maxAppliesPerRun,
    requestedApplies,
    blockers,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Record Activity
// ─────────────────────────────────────────────────────────────────────────────

export function recordActivity(
  state: CanaryState,
  prsCreated: number,
  appliesExecuted: number,
  runSuccessful: boolean
): CanaryState {
  const todayStats = resetTodayStatsIfNeeded(state.todayStats);

  return {
    ...state,
    successfulRunsAtStage: runSuccessful
      ? state.successfulRunsAtStage + 1
      : state.successfulRunsAtStage,
    todayStats: {
      ...todayStats,
      prsCreated: todayStats.prsCreated + prsCreated,
      appliesExecuted: todayStats.appliesExecuted + appliesExecuted,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────────────────────

export interface CanaryStatus {
  stage: CanaryStageId;
  stageLabel: string;
  blastRadius: number;
  stageEnteredAt: string;
  hoursAtStage: number;
  successfulRuns: number;
  runsToPromotion: number;
  hoursToPromotion: number;
  locked: boolean;
  lockReason: string | null;
  lockExpiresAt: string | null;
  todayPRs: number;
  maxPRsPerDay: number;
  maxAppliesPerRun: number;
  promotionEligible: boolean;
  promotionBlockers: string[];
}

export function getCanaryStatus(
  policy: CanaryPolicy,
  state: CanaryState,
  health: AutonomyHealth,
  records: EvidenceRecordForHealth[]
): CanaryStatus {
  const stage = getStageInfo(policy, state.currentStage)!;
  const eligibility = checkPromotionEligibility({ policy, state, health, records });
  const now = new Date();
  const stageEnteredAt = new Date(state.stageEnteredAt);
  const hoursAtStage = (now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60);
  const todayStats = resetTodayStatsIfNeeded(state.todayStats);

  return {
    stage: state.currentStage,
    stageLabel: stage.label,
    blastRadius: stage.blastRadius,
    stageEnteredAt: state.stageEnteredAt,
    hoursAtStage,
    successfulRuns: state.successfulRunsAtStage,
    runsToPromotion: Math.max(
      0,
      policy.promotionRules.minSuccessfulRunsForPromotion - state.successfulRunsAtStage
    ),
    hoursToPromotion: Math.max(0, policy.promotionRules.minHoursAtStage - hoursAtStage),
    locked: state.locked,
    lockReason: state.lockedReason,
    lockExpiresAt: state.lockExpiresAt,
    todayPRs: todayStats.prsCreated,
    maxPRsPerDay: stage.maxPRsPerDay,
    maxAppliesPerRun: stage.maxAppliesPerRun,
    promotionEligible: eligibility.eligible,
    promotionBlockers: eligibility.blockers,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resetTodayStatsIfNeeded(stats: CanaryDayStats): CanaryDayStats {
  const today = new Date().toISOString().slice(0, 10);
  if (stats.date !== today) {
    return {
      date: today,
      prsCreated: 0,
      appliesExecuted: 0,
    };
  }
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof Save
// ─────────────────────────────────────────────────────────────────────────────

export function savePromotionProof(
  proof: PromotionProof,
  outDir: string = DEFAULT_PROOFS_DIR
): string {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const filename = `promotion-proof-${Date.now()}.json`;
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(proof, null, 2));
  return filePath;
}

export function saveDemotionProof(
  proof: DemotionProof,
  outDir: string = DEFAULT_PROOFS_DIR
): string {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const filename = `demotion-proof-${Date.now()}.json`;
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(proof, null, 2));
  return filePath;
}
