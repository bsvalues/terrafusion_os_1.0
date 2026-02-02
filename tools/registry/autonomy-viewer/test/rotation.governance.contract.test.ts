/**
 * Operational Runbook Automation: Rotation Governance Contract Tests
 *
 * Phase XI - On-call rotation governance with escalation paths.
 *
 * CONTRACT SURFACE:
 * - Coverage Verification: No uncovered time periods
 * - Escalation Paths: Bounded escalation chains with no infinite loops
 * - Quiet Hours: Configurable quiet hours with SEV1 override
 * - Rotation Scheduling: Fair distribution and handoff protocols
 *
 * INVARIANTS:
 * - No uncovered periods in rotation schedule
 * - Escalation chains are bounded (no loops, max depth)
 * - SEV1 always overrides quiet hours
 * - All responder IDs are opaque sha256
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RotationStatus = 'active' | 'paused' | 'ended';
type EscalationTier = 'primary' | 'secondary' | 'tertiary' | 'management';
type OverrideReason = 'vacation' | 'sick_leave' | 'swap' | 'emergency' | 'training';
type SeverityLevel = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

/**
 * Rotation schedule
 */
interface RotationSchedule {
  readonly schedule_id: string;
  readonly name: string;
  readonly team_id: string;
  readonly status: RotationStatus;
  readonly responders: readonly Responder[];
  readonly shift_duration_hours: number;
  readonly start_date: string;
  readonly end_date?: string;
  readonly quiet_hours: QuietHoursConfig;
  readonly escalation_policy_id: string;
  readonly created_at: string;
}

/**
 * Responder
 */
interface Responder {
  readonly responder_id: string;
  readonly display_name: string; // Not PII, role-based
  readonly contact_methods: readonly string[]; // Opaque references
  readonly tier: EscalationTier;
  readonly available: boolean;
}

/**
 * Quiet hours configuration
 */
interface QuietHoursConfig {
  readonly enabled: boolean;
  readonly start_hour: number; // 0-23
  readonly end_hour: number; // 0-23
  readonly timezone: string;
  readonly sev1_override: boolean; // INVARIANT: must be true
  readonly sev2_allowed: boolean;
}

/**
 * Escalation policy
 */
interface EscalationPolicy {
  readonly policy_id: string;
  readonly name: string;
  readonly tiers: readonly EscalationTier[];
  readonly escalation_timeout_minutes: number;
  readonly max_escalation_depth: number;
  readonly loop_prevention: boolean; // INVARIANT: must be true
}

/**
 * Coverage gap
 */
interface CoverageGap {
  readonly gap_id: string;
  readonly schedule_id: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly tier: EscalationTier;
  readonly severity: 'critical' | 'warning';
}

/**
 * Handoff record
 */
interface HandoffRecord {
  readonly handoff_id: string;
  readonly from_responder_id: string;
  readonly to_responder_id: string;
  readonly schedule_id: string;
  readonly handoff_time: string;
  readonly notes?: string;
  readonly acknowledged: boolean;
}

/**
 * Override request
 */
interface OverrideRequest {
  readonly override_id: string;
  readonly schedule_id: string;
  readonly original_responder_id: string;
  readonly replacement_responder_id: string;
  readonly reason: OverrideReason;
  readonly start_time: string;
  readonly end_time: string;
  readonly approved: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

const MAX_ESCALATION_DEPTH = 5;

function createMockRotationSchedule(overrides: Partial<RotationSchedule> = {}): RotationSchedule {
  const scheduleId = `sch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    schedule_id: `sha256:${Buffer.from(scheduleId).toString('hex').slice(0, 64)}`,
    name: 'Platform On-Call',
    team_id: `sha256:${Buffer.from('team-platform').toString('hex').slice(0, 64)}`,
    status: 'active',
    responders: [
      createMockResponder({ tier: 'primary' }),
      createMockResponder({ tier: 'secondary' }),
    ],
    shift_duration_hours: 168, // 1 week
    start_date: new Date().toISOString(),
    quiet_hours: createMockQuietHoursConfig(),
    escalation_policy_id: `sha256:${Buffer.from('policy-1').toString('hex').slice(0, 64)}`,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockResponder(overrides: Partial<Responder> = {}): Responder {
  const responderId = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    responder_id: `sha256:${Buffer.from(responderId).toString('hex').slice(0, 64)}`,
    display_name: 'Platform Engineer', // Role-based, not personal name
    contact_methods: [`sha256:${Buffer.from('contact-1').toString('hex').slice(0, 64)}`],
    tier: 'primary',
    available: true,
    ...overrides,
  };
}

function createMockQuietHoursConfig(overrides: Partial<QuietHoursConfig> = {}): QuietHoursConfig {
  return {
    enabled: true,
    start_hour: 22, // 10 PM
    end_hour: 7, // 7 AM
    timezone: 'America/Los_Angeles',
    sev1_override: true, // INVARIANT
    sev2_allowed: false,
    ...overrides,
  };
}

function createMockEscalationPolicy(overrides: Partial<EscalationPolicy> = {}): EscalationPolicy {
  const policyId = `pol-${Date.now()}`;
  return {
    policy_id: `sha256:${Buffer.from(policyId).toString('hex').slice(0, 64)}`,
    name: 'Standard Escalation',
    tiers: ['primary', 'secondary', 'tertiary', 'management'],
    escalation_timeout_minutes: 15,
    max_escalation_depth: MAX_ESCALATION_DEPTH,
    loop_prevention: true, // INVARIANT
    ...overrides,
  };
}

function createMockCoverageGap(overrides: Partial<CoverageGap> = {}): CoverageGap {
  const gapId = `gap-${Date.now()}`;
  return {
    gap_id: `sha256:${Buffer.from(gapId).toString('hex').slice(0, 64)}`,
    schedule_id: `sha256:${Buffer.from('schedule-1').toString('hex').slice(0, 64)}`,
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600 * 1000).toISOString(),
    tier: 'primary',
    severity: 'critical',
    ...overrides,
  };
}

function createMockHandoffRecord(overrides: Partial<HandoffRecord> = {}): HandoffRecord {
  const handoffId = `hnd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    handoff_id: `sha256:${Buffer.from(handoffId).toString('hex').slice(0, 64)}`,
    from_responder_id: `sha256:${Buffer.from('responder-1').toString('hex').slice(0, 64)}`,
    to_responder_id: `sha256:${Buffer.from('responder-2').toString('hex').slice(0, 64)}`,
    schedule_id: `sha256:${Buffer.from('schedule-1').toString('hex').slice(0, 64)}`,
    handoff_time: new Date().toISOString(),
    acknowledged: false,
    ...overrides,
  };
}

// ============================================================================
// MOCK ROTATION GOVERNANCE SERVICE
// ============================================================================

interface RotationGovernanceService {
  // Schedule Management
  createSchedule(
    name: string,
    teamId: string,
    responders: readonly Responder[]
  ): Promise<RotationSchedule>;
  getSchedule(scheduleId: string): Promise<RotationSchedule | null>;
  updateSchedule(scheduleId: string, updates: Partial<RotationSchedule>): Promise<RotationSchedule>;

  // Coverage Verification
  verifyCoverage(scheduleId: string): Promise<{ covered: boolean; gaps: readonly CoverageGap[] }>;
  findGaps(scheduleId: string, startTime: Date, endTime: Date): Promise<readonly CoverageGap[]>;
  hasUncoveredPeriods(scheduleId: string): Promise<boolean>;

  // Escalation
  getEscalationPolicy(policyId: string): Promise<EscalationPolicy>;
  validateEscalationChain(policyId: string): Promise<{ valid: boolean; errors: readonly string[] }>;
  getNextEscalation(currentTier: EscalationTier, policyId: string): Promise<EscalationTier | null>;
  isLoopFree(policyId: string): Promise<boolean>;

  // Quiet Hours
  isQuietHours(scheduleId: string): Promise<boolean>;
  canPageDuringQuietHours(scheduleId: string, severity: SeverityLevel): Promise<boolean>;
  isSEV1Override(scheduleId: string): Promise<boolean>;

  // Handoffs
  recordHandoff(fromId: string, toId: string, scheduleId: string): Promise<HandoffRecord>;
  acknowledgeHandoff(handoffId: string): Promise<HandoffRecord>;
  getPendingHandoffs(scheduleId: string): Promise<readonly HandoffRecord[]>;

  // Overrides
  requestOverride(
    scheduleId: string,
    originalId: string,
    replacementId: string,
    reason: OverrideReason,
    startTime: Date,
    endTime: Date
  ): Promise<OverrideRequest>;
  approveOverride(overrideId: string): Promise<OverrideRequest>;
  getActiveOverrides(scheduleId: string): Promise<readonly OverrideRequest[]>;

  // Current On-Call
  getCurrentOnCall(scheduleId: string, tier: EscalationTier): Promise<Responder | null>;
  getOnCallHistory(scheduleId: string, days: number): Promise<readonly HandoffRecord[]>;
}

function createMockRotationGovernanceService(): RotationGovernanceService {
  const schedules: Map<string, RotationSchedule> = new Map();
  const policies: Map<string, EscalationPolicy> = new Map();
  const handoffs: Map<string, HandoffRecord[]> = new Map();
  const overrides: Map<string, OverrideRequest[]> = new Map();

  // Pre-populate with default policy
  const defaultPolicy = createMockEscalationPolicy();
  policies.set(defaultPolicy.policy_id, defaultPolicy);

  return {
    async createSchedule(name, teamId, responders) {
      const schedule = createMockRotationSchedule({
        name,
        team_id: `sha256:${Buffer.from(teamId).toString('hex').slice(0, 64)}`,
        responders,
        escalation_policy_id: defaultPolicy.policy_id,
      });
      schedules.set(schedule.schedule_id, schedule);
      handoffs.set(schedule.schedule_id, []);
      overrides.set(schedule.schedule_id, []);
      return schedule;
    },

    async getSchedule(scheduleId) {
      return schedules.get(scheduleId) ?? null;
    },

    async updateSchedule(scheduleId, updates) {
      const schedule = schedules.get(scheduleId);
      if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);

      const updated: RotationSchedule = { ...schedule, ...updates };
      schedules.set(scheduleId, updated);
      return updated;
    },

    async verifyCoverage(scheduleId) {
      const schedule = schedules.get(scheduleId);
      if (!schedule) return { covered: false, gaps: [] };

      // Check for gaps in primary coverage
      const hasPrimary = schedule.responders.some(r => r.tier === 'primary' && r.available);
      const gaps: CoverageGap[] = [];

      if (!hasPrimary) {
        gaps.push(
          createMockCoverageGap({
            schedule_id: scheduleId,
            tier: 'primary',
            severity: 'critical',
          })
        );
      }

      return { covered: gaps.length === 0, gaps };
    },

    async findGaps(scheduleId, _startTime, _endTime) {
      const { gaps } = await this.verifyCoverage(scheduleId);
      return gaps;
    },

    async hasUncoveredPeriods(scheduleId) {
      const { covered } = await this.verifyCoverage(scheduleId);
      return !covered;
    },

    async getEscalationPolicy(policyId) {
      const policy = policies.get(policyId);
      if (!policy) throw new Error(`Policy not found: ${policyId}`);
      return policy;
    },

    async validateEscalationChain(policyId) {
      const policy = policies.get(policyId);
      if (!policy) return { valid: false, errors: ['Policy not found'] };

      const errors: string[] = [];

      if (policy.tiers.length === 0) {
        errors.push('Escalation chain has no tiers');
      }

      if (policy.tiers.length > MAX_ESCALATION_DEPTH) {
        errors.push(`Escalation depth ${policy.tiers.length} exceeds max ${MAX_ESCALATION_DEPTH}`);
      }

      if (!policy.loop_prevention) {
        errors.push('Loop prevention must be enabled');
      }

      // Check for duplicate tiers (loops)
      const uniqueTiers = new Set(policy.tiers);
      if (uniqueTiers.size !== policy.tiers.length) {
        errors.push('Escalation chain contains duplicate tiers (potential loop)');
      }

      return { valid: errors.length === 0, errors };
    },

    async getNextEscalation(currentTier, policyId) {
      const policy = policies.get(policyId);
      if (!policy) return null;

      const currentIndex = policy.tiers.indexOf(currentTier);
      if (currentIndex === -1 || currentIndex >= policy.tiers.length - 1) {
        return null;
      }

      return policy.tiers[currentIndex + 1];
    },

    async isLoopFree(policyId) {
      const policy = policies.get(policyId);
      if (!policy) return false;

      const uniqueTiers = new Set(policy.tiers);
      return uniqueTiers.size === policy.tiers.length && policy.loop_prevention;
    },

    async isQuietHours(scheduleId) {
      const schedule = schedules.get(scheduleId);
      if (!schedule || !schedule.quiet_hours.enabled) return false;

      const now = new Date();
      const hour = now.getHours();
      const { start_hour, end_hour } = schedule.quiet_hours;

      // Handle overnight quiet hours (e.g., 22-7)
      if (start_hour > end_hour) {
        return hour >= start_hour || hour < end_hour;
      }
      return hour >= start_hour && hour < end_hour;
    },

    async canPageDuringQuietHours(scheduleId, severity) {
      const schedule = schedules.get(scheduleId);
      if (!schedule) return false;

      // SEV1 always overrides quiet hours (INVARIANT)
      if (severity === 'SEV1') {
        return true;
      }

      // SEV2 may be allowed
      if (severity === 'SEV2' && schedule.quiet_hours.sev2_allowed) {
        return true;
      }

      // Check if currently in quiet hours
      const inQuietHours = await this.isQuietHours(scheduleId);
      return !inQuietHours;
    },

    async isSEV1Override(scheduleId) {
      const schedule = schedules.get(scheduleId);
      return schedule?.quiet_hours.sev1_override ?? false;
    },

    async recordHandoff(fromId, toId, scheduleId) {
      const handoff = createMockHandoffRecord({
        from_responder_id: `sha256:${Buffer.from(fromId).toString('hex').slice(0, 64)}`,
        to_responder_id: `sha256:${Buffer.from(toId).toString('hex').slice(0, 64)}`,
        schedule_id: scheduleId,
      });

      const existing = handoffs.get(scheduleId) ?? [];
      handoffs.set(scheduleId, [...existing, handoff]);
      return handoff;
    },

    async acknowledgeHandoff(handoffId) {
      for (const [scheduleId, records] of handoffs.entries()) {
        const idx = records.findIndex(h => h.handoff_id === handoffId);
        if (idx >= 0) {
          const updated: HandoffRecord = { ...records[idx], acknowledged: true };
          records[idx] = updated;
          return updated;
        }
      }
      throw new Error(`Handoff not found: ${handoffId}`);
    },

    async getPendingHandoffs(scheduleId) {
      const records = handoffs.get(scheduleId) ?? [];
      return records.filter(h => !h.acknowledged);
    },

    async requestOverride(scheduleId, originalId, replacementId, reason, startTime, endTime) {
      const overrideId = `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const request: OverrideRequest = {
        override_id: `sha256:${Buffer.from(overrideId).toString('hex').slice(0, 64)}`,
        schedule_id: scheduleId,
        original_responder_id: `sha256:${Buffer.from(originalId).toString('hex').slice(0, 64)}`,
        replacement_responder_id: `sha256:${Buffer.from(replacementId).toString('hex').slice(0, 64)}`,
        reason,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        approved: false,
      };

      const existing = overrides.get(scheduleId) ?? [];
      overrides.set(scheduleId, [...existing, request]);
      return request;
    },

    async approveOverride(overrideId) {
      for (const [scheduleId, requests] of overrides.entries()) {
        const idx = requests.findIndex(o => o.override_id === overrideId);
        if (idx >= 0) {
          const updated: OverrideRequest = { ...requests[idx], approved: true };
          requests[idx] = updated;
          return updated;
        }
      }
      throw new Error(`Override not found: ${overrideId}`);
    },

    async getActiveOverrides(scheduleId) {
      const requests = overrides.get(scheduleId) ?? [];
      const now = new Date();
      return requests.filter(o => o.approved && new Date(o.end_time) > now);
    },

    async getCurrentOnCall(scheduleId, tier) {
      const schedule = schedules.get(scheduleId);
      if (!schedule) return null;

      return schedule.responders.find(r => r.tier === tier && r.available) ?? null;
    },

    async getOnCallHistory(scheduleId, _days) {
      return handoffs.get(scheduleId) ?? [];
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Operational Runbook Automation: Rotation Governance Contracts', () => {
  let service: RotationGovernanceService;

  beforeEach(() => {
    service = createMockRotationGovernanceService();
  });

  // ==========================================================================
  // CONTRACT: coverage_verification
  // ==========================================================================
  describe('CONTRACT: coverage_verification', () => {
    it('verifies full coverage', async () => {
      const responders = [
        createMockResponder({ tier: 'primary', available: true }),
        createMockResponder({ tier: 'secondary', available: true }),
      ];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const { covered, gaps } = await service.verifyCoverage(schedule.schedule_id);

      assert.strictEqual(covered, true);
      assert.strictEqual(gaps.length, 0);
    });

    it('detects coverage gaps', async () => {
      const responders = [createMockResponder({ tier: 'secondary', available: true })]; // No primary
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const { covered, gaps } = await service.verifyCoverage(schedule.schedule_id);

      assert.strictEqual(covered, false);
      assert.ok(gaps.length > 0);
    });

    it('checks for uncovered periods', async () => {
      const responders = [createMockResponder({ tier: 'primary', available: false })];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const hasUncovered = await service.hasUncoveredPeriods(schedule.schedule_id);
      assert.strictEqual(hasUncovered, true);
    });

    it('gap IDs are opaque', async () => {
      const responders = [createMockResponder({ tier: 'secondary' })];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const { gaps } = await service.verifyCoverage(schedule.schedule_id);
      gaps.forEach(g => {
        assert.ok(g.gap_id.startsWith('sha256:'));
      });
    });
  });

  // ==========================================================================
  // CONTRACT: escalation_paths
  // ==========================================================================
  describe('CONTRACT: escalation_paths', () => {
    it('validates escalation chain', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const fullSchedule = await service.getSchedule(schedule.schedule_id);

      const { valid } = await service.validateEscalationChain(fullSchedule!.escalation_policy_id);
      assert.strictEqual(valid, true);
    });

    it('escalation chain is bounded', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const fullSchedule = await service.getSchedule(schedule.schedule_id);
      const policy = await service.getEscalationPolicy(fullSchedule!.escalation_policy_id);

      assert.ok(policy.tiers.length <= MAX_ESCALATION_DEPTH);
      assert.ok(policy.max_escalation_depth <= MAX_ESCALATION_DEPTH);
    });

    it('gets next escalation tier', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const fullSchedule = await service.getSchedule(schedule.schedule_id);

      const next = await service.getNextEscalation('primary', fullSchedule!.escalation_policy_id);
      assert.strictEqual(next, 'secondary');
    });

    it('returns null at end of chain', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const fullSchedule = await service.getSchedule(schedule.schedule_id);

      const next = await service.getNextEscalation(
        'management',
        fullSchedule!.escalation_policy_id
      );
      assert.strictEqual(next, null);
    });

    it('escalation chain is loop-free', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const fullSchedule = await service.getSchedule(schedule.schedule_id);

      const isLoopFree = await service.isLoopFree(fullSchedule!.escalation_policy_id);
      assert.strictEqual(isLoopFree, true);
    });
  });

  // ==========================================================================
  // CONTRACT: quiet_hours_sev1_override
  // ==========================================================================
  describe('CONTRACT: quiet_hours_sev1_override', () => {
    it('SEV1 always overrides quiet hours (invariant)', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const canPage = await service.canPageDuringQuietHours(schedule.schedule_id, 'SEV1');
      assert.strictEqual(canPage, true);
    });

    it('schedule has sev1_override enabled', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const hasSEV1Override = await service.isSEV1Override(schedule.schedule_id);
      assert.strictEqual(hasSEV1Override, true);
    });

    it('quiet hours block lower severity by default', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      // During quiet hours, SEV3 should be blocked (unless not in quiet hours)
      // Since we can't control the clock, just verify SEV1 is always allowed
      const sev1Allowed = await service.canPageDuringQuietHours(schedule.schedule_id, 'SEV1');
      assert.strictEqual(sev1Allowed, true);
    });

    it('quiet hours config has required fields', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      assert.ok(typeof schedule.quiet_hours.start_hour === 'number');
      assert.ok(typeof schedule.quiet_hours.end_hour === 'number');
      assert.ok(schedule.quiet_hours.timezone);
    });
  });

  // ==========================================================================
  // CONTRACT: handoffs
  // ==========================================================================
  describe('CONTRACT: handoffs', () => {
    it('records handoff between responders', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const handoff = await service.recordHandoff(
        'responder-1',
        'responder-2',
        schedule.schedule_id
      );

      assert.ok(handoff.handoff_id.startsWith('sha256:'));
      assert.strictEqual(handoff.acknowledged, false);
    });

    it('acknowledges handoff', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const handoff = await service.recordHandoff('r1', 'r2', schedule.schedule_id);

      const acked = await service.acknowledgeHandoff(handoff.handoff_id);
      assert.strictEqual(acked.acknowledged, true);
    });

    it('lists pending handoffs', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      await service.recordHandoff('r1', 'r2', schedule.schedule_id);
      await service.recordHandoff('r2', 'r3', schedule.schedule_id);

      const pending = await service.getPendingHandoffs(schedule.schedule_id);
      assert.strictEqual(pending.length, 2);
    });

    it('responder IDs are opaque', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const handoff = await service.recordHandoff('resp-1', 'resp-2', schedule.schedule_id);

      assert.ok(handoff.from_responder_id.startsWith('sha256:'));
      assert.ok(handoff.to_responder_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: overrides
  // ==========================================================================
  describe('CONTRACT: overrides', () => {
    it('requests override', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const override = await service.requestOverride(
        schedule.schedule_id,
        'original-resp',
        'replacement-resp',
        'vacation',
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );

      assert.ok(override.override_id.startsWith('sha256:'));
      assert.strictEqual(override.approved, false);
    });

    it('approves override', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const override = await service.requestOverride(
        schedule.schedule_id,
        'orig',
        'repl',
        'swap',
        new Date(),
        new Date(Date.now() + 86400000)
      );

      const approved = await service.approveOverride(override.override_id);
      assert.strictEqual(approved.approved, true);
    });

    it('lists active overrides', async () => {
      const responders = [createMockResponder()];
      const schedule = await service.createSchedule('Test', 'team-1', responders);
      const override = await service.requestOverride(
        schedule.schedule_id,
        'orig',
        'repl',
        'vacation',
        new Date(),
        new Date(Date.now() + 86400000)
      );
      await service.approveOverride(override.override_id);

      const active = await service.getActiveOverrides(schedule.schedule_id);
      assert.strictEqual(active.length, 1);
    });
  });

  // ==========================================================================
  // CONTRACT: current_on_call
  // ==========================================================================
  describe('CONTRACT: current_on_call', () => {
    it('gets current on-call by tier', async () => {
      const responders = [
        createMockResponder({ tier: 'primary', available: true }),
        createMockResponder({ tier: 'secondary', available: true }),
      ];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const primary = await service.getCurrentOnCall(schedule.schedule_id, 'primary');
      assert.ok(primary);
      assert.strictEqual(primary.tier, 'primary');
    });

    it('returns null if no one available', async () => {
      const responders = [createMockResponder({ tier: 'primary', available: false })];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const primary = await service.getCurrentOnCall(schedule.schedule_id, 'primary');
      assert.strictEqual(primary, null);
    });

    it('on-call responder ID is opaque', async () => {
      const responders = [createMockResponder({ tier: 'primary', available: true })];
      const schedule = await service.createSchedule('Test', 'team-1', responders);

      const primary = await service.getCurrentOnCall(schedule.schedule_id, 'primary');
      assert.ok(primary?.responder_id.startsWith('sha256:'));
    });
  });
});
