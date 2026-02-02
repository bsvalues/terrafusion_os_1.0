/**
 * Operational Runbook Automation: Playbook Safety Contract Tests
 *
 * Phase XI - Automated remediation playbooks with safety guardrails.
 *
 * CONTRACT SURFACE:
 * - Blast Radius Bounds: Limited scope of impact per playbook
 * - Idempotency: Playbooks can be safely re-run
 * - Rate Limits: Maximum executions per time window
 * - Guardrails: Dry-run mode, approval gates, circuit breakers
 *
 * INVARIANTS:
 * - Playbooks are operator-triggered only (no auto-remediation)
 * - Blast radius is bounded and declared
 * - Rate limits enforce safe execution frequency
 * - All playbooks must be idempotent or declare non-idempotency
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type BlastRadiusLevel = 'minimal' | 'limited' | 'moderate' | 'extensive';
type PlaybookCategory = 'remediation' | 'recovery' | 'maintenance' | 'diagnostic';
type GuardrailType = 'approval' | 'circuit_breaker' | 'rate_limit' | 'time_window' | 'health_check';
type IdempotencyMode = 'idempotent' | 'non_idempotent' | 'conditional';

/**
 * Playbook definition
 */
interface Playbook {
  readonly playbook_id: string;
  readonly name: string;
  readonly description: string;
  readonly category: PlaybookCategory;
  readonly blast_radius: BlastRadiusConfig;
  readonly idempotency: IdempotencyConfig;
  readonly rate_limit: RateLimitConfig;
  readonly guardrails: readonly Guardrail[];
  readonly version: number;
  readonly created_at: string;
  readonly owner_id: string;
}

/**
 * Blast radius configuration
 */
interface BlastRadiusConfig {
  readonly level: BlastRadiusLevel;
  readonly max_affected_resources: number;
  readonly affected_services: readonly string[];
  readonly isolation_zone: string;
  readonly rollback_time_minutes: number;
}

/**
 * Idempotency configuration
 */
interface IdempotencyConfig {
  readonly mode: IdempotencyMode;
  readonly idempotency_key?: string;
  readonly safe_to_retry: boolean;
  readonly duplicate_window_minutes: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  readonly max_executions_per_hour: number;
  readonly max_executions_per_day: number;
  readonly cooldown_minutes: number;
  readonly burst_limit: number;
}

/**
 * Guardrail
 */
interface Guardrail {
  readonly guardrail_id: string;
  readonly type: GuardrailType;
  readonly config: Record<string, unknown>;
  readonly enabled: boolean;
  readonly bypass_allowed: boolean;
}

/**
 * Safety check result
 */
interface SafetyCheckResult {
  readonly check_id: string;
  readonly playbook_id: string;
  readonly passed: boolean;
  readonly failed_guardrails: readonly string[];
  readonly warnings: readonly string[];
  readonly checked_at: string;
}

/**
 * Rate limit status
 */
interface RateLimitStatus {
  readonly playbook_id: string;
  readonly executions_this_hour: number;
  readonly executions_today: number;
  readonly next_allowed_at?: string;
  readonly is_limited: boolean;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  readonly playbook_id: string;
  readonly state: 'closed' | 'open' | 'half_open';
  readonly failure_count: number;
  readonly last_failure_at?: string;
  readonly opened_at?: string;
  readonly will_reset_at?: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockPlaybook(overrides: Partial<Playbook> = {}): Playbook {
  const playbookId = `pb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    playbook_id: `sha256:${Buffer.from(playbookId).toString('hex').slice(0, 64)}`,
    name: 'Database Connection Pool Reset',
    description: 'Safely reset database connection pools during high load',
    category: 'remediation',
    blast_radius: createMockBlastRadius(),
    idempotency: createMockIdempotencyConfig(),
    rate_limit: createMockRateLimitConfig(),
    guardrails: [createMockGuardrail()],
    version: 1,
    created_at: new Date().toISOString(),
    owner_id: `sha256:${Buffer.from('owner-1').toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockBlastRadius(overrides: Partial<BlastRadiusConfig> = {}): BlastRadiusConfig {
  return {
    level: 'limited',
    max_affected_resources: 10,
    affected_services: ['database', 'cache'],
    isolation_zone: 'zone-a',
    rollback_time_minutes: 15,
    ...overrides,
  };
}

function createMockIdempotencyConfig(
  overrides: Partial<IdempotencyConfig> = {}
): IdempotencyConfig {
  return {
    mode: 'idempotent',
    safe_to_retry: true,
    duplicate_window_minutes: 5,
    ...overrides,
  };
}

function createMockRateLimitConfig(overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    max_executions_per_hour: 5,
    max_executions_per_day: 20,
    cooldown_minutes: 10,
    burst_limit: 3,
    ...overrides,
  };
}

function createMockGuardrail(overrides: Partial<Guardrail> = {}): Guardrail {
  const guardrailId = `gr-${Date.now()}`;
  return {
    guardrail_id: `sha256:${Buffer.from(guardrailId).toString('hex').slice(0, 64)}`,
    type: 'approval',
    config: { required_approvers: 1 },
    enabled: true,
    bypass_allowed: false,
    ...overrides,
  };
}

// ============================================================================
// MOCK PLAYBOOK SAFETY SERVICE
// ============================================================================

interface PlaybookSafetyService {
  // Blast Radius
  validateBlastRadius(playbook: Playbook): Promise<boolean>;
  getBlastRadiusLevel(playbook: Playbook): Promise<BlastRadiusLevel>;
  isWithinBounds(playbook: Playbook, affectedCount: number): Promise<boolean>;

  // Idempotency
  isIdempotent(playbook: Playbook): Promise<boolean>;
  canRetry(playbook: Playbook): Promise<boolean>;
  isDuplicateExecution(playbookId: string, executionKey: string): Promise<boolean>;
  recordExecution(playbookId: string, executionKey: string): Promise<void>;

  // Rate Limits
  checkRateLimit(playbookId: string): Promise<RateLimitStatus>;
  isRateLimited(playbookId: string): Promise<boolean>;
  recordExecutionForRateLimit(playbookId: string): Promise<void>;
  getRemainingQuota(playbookId: string): Promise<{ hourly: number; daily: number }>;

  // Guardrails
  runSafetyChecks(playbook: Playbook): Promise<SafetyCheckResult>;
  getGuardrails(playbookId: string): Promise<readonly Guardrail[]>;
  isGuardrailPassing(guardrail: Guardrail): Promise<boolean>;

  // Circuit Breaker
  getCircuitBreakerState(playbookId: string): Promise<CircuitBreakerState>;
  recordFailure(playbookId: string): Promise<void>;
  recordSuccess(playbookId: string): Promise<void>;
  isCircuitOpen(playbookId: string): Promise<boolean>;
}

function createMockPlaybookSafetyService(): PlaybookSafetyService {
  const executionCounts: Map<string, { hourly: number; daily: number; lastReset: Date }> =
    new Map();
  const executionKeys: Map<string, Set<string>> = new Map();
  const circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  const playbooks: Map<string, Playbook> = new Map();

  const CIRCUIT_BREAKER_THRESHOLD = 3;

  return {
    async validateBlastRadius(playbook) {
      const { blast_radius } = playbook;
      return (
        blast_radius.max_affected_resources > 0 &&
        blast_radius.affected_services.length > 0 &&
        blast_radius.rollback_time_minutes > 0
      );
    },

    async getBlastRadiusLevel(playbook) {
      return playbook.blast_radius.level;
    },

    async isWithinBounds(playbook, affectedCount) {
      return affectedCount <= playbook.blast_radius.max_affected_resources;
    },

    async isIdempotent(playbook) {
      return playbook.idempotency.mode === 'idempotent';
    },

    async canRetry(playbook) {
      return playbook.idempotency.safe_to_retry;
    },

    async isDuplicateExecution(playbookId, executionKey) {
      const keys = executionKeys.get(playbookId);
      return keys?.has(executionKey) ?? false;
    },

    async recordExecution(playbookId, executionKey) {
      const keys = executionKeys.get(playbookId) ?? new Set();
      keys.add(executionKey);
      executionKeys.set(playbookId, keys);
    },

    async checkRateLimit(playbookId) {
      const counts = executionCounts.get(playbookId) ?? {
        hourly: 0,
        daily: 0,
        lastReset: new Date(),
      };
      const playbook = playbooks.get(playbookId);
      const rateLimit = playbook?.rate_limit ?? createMockRateLimitConfig();

      const isLimited =
        counts.hourly >= rateLimit.max_executions_per_hour ||
        counts.daily >= rateLimit.max_executions_per_day;

      return {
        playbook_id: playbookId,
        executions_this_hour: counts.hourly,
        executions_today: counts.daily,
        is_limited: isLimited,
        next_allowed_at: isLimited
          ? new Date(Date.now() + rateLimit.cooldown_minutes * 60 * 1000).toISOString()
          : undefined,
      };
    },

    async isRateLimited(playbookId) {
      const status = await this.checkRateLimit(playbookId);
      return status.is_limited;
    },

    async recordExecutionForRateLimit(playbookId) {
      const existing = executionCounts.get(playbookId) ?? {
        hourly: 0,
        daily: 0,
        lastReset: new Date(),
      };
      executionCounts.set(playbookId, {
        hourly: existing.hourly + 1,
        daily: existing.daily + 1,
        lastReset: existing.lastReset,
      });
    },

    async getRemainingQuota(playbookId) {
      const counts = executionCounts.get(playbookId) ?? {
        hourly: 0,
        daily: 0,
        lastReset: new Date(),
      };
      const playbook = playbooks.get(playbookId);
      const rateLimit = playbook?.rate_limit ?? createMockRateLimitConfig();

      return {
        hourly: Math.max(0, rateLimit.max_executions_per_hour - counts.hourly),
        daily: Math.max(0, rateLimit.max_executions_per_day - counts.daily),
      };
    },

    async runSafetyChecks(playbook) {
      playbooks.set(playbook.playbook_id, playbook);
      const failedGuardrails: string[] = [];
      const warnings: string[] = [];

      // Check each guardrail
      for (const guardrail of playbook.guardrails) {
        if (!guardrail.enabled) continue;
        const passing = await this.isGuardrailPassing(guardrail);
        if (!passing) {
          failedGuardrails.push(guardrail.guardrail_id);
        }
      }

      // Check rate limits
      const isLimited = await this.isRateLimited(playbook.playbook_id);
      if (isLimited) {
        failedGuardrails.push('rate_limit');
      }

      // Check circuit breaker
      const circuitOpen = await this.isCircuitOpen(playbook.playbook_id);
      if (circuitOpen) {
        failedGuardrails.push('circuit_breaker');
      }

      // Add warnings for non-idempotent playbooks
      if (playbook.idempotency.mode === 'non_idempotent') {
        warnings.push('Playbook is non-idempotent, exercise caution');
      }

      const checkId = `chk-${Date.now()}`;
      return {
        check_id: `sha256:${Buffer.from(checkId).toString('hex').slice(0, 64)}`,
        playbook_id: playbook.playbook_id,
        passed: failedGuardrails.length === 0,
        failed_guardrails: failedGuardrails,
        warnings,
        checked_at: new Date().toISOString(),
      };
    },

    async getGuardrails(playbookId) {
      const playbook = playbooks.get(playbookId);
      return playbook?.guardrails ?? [];
    },

    async isGuardrailPassing(_guardrail) {
      // Mock: all guardrails pass by default
      return true;
    },

    async getCircuitBreakerState(playbookId) {
      const existing = circuitBreakers.get(playbookId);
      if (existing) return existing;

      return {
        playbook_id: playbookId,
        state: 'closed',
        failure_count: 0,
      };
    },

    async recordFailure(playbookId) {
      const existing = await this.getCircuitBreakerState(playbookId);
      const newCount = existing.failure_count + 1;
      const newState: CircuitBreakerState =
        newCount >= CIRCUIT_BREAKER_THRESHOLD
          ? {
              playbook_id: playbookId,
              state: 'open',
              failure_count: newCount,
              last_failure_at: new Date().toISOString(),
              opened_at: new Date().toISOString(),
              will_reset_at: new Date(Date.now() + 300000).toISOString(), // 5 min
            }
          : {
              playbook_id: playbookId,
              state: 'closed',
              failure_count: newCount,
              last_failure_at: new Date().toISOString(),
            };
      circuitBreakers.set(playbookId, newState);
    },

    async recordSuccess(playbookId) {
      circuitBreakers.set(playbookId, {
        playbook_id: playbookId,
        state: 'closed',
        failure_count: 0,
      });
    },

    async isCircuitOpen(playbookId) {
      const state = await this.getCircuitBreakerState(playbookId);
      return state.state === 'open';
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Operational Runbook Automation: Playbook Safety Contracts', () => {
  let service: PlaybookSafetyService;

  beforeEach(() => {
    service = createMockPlaybookSafetyService();
  });

  // ==========================================================================
  // CONTRACT: blast_radius_bounds
  // ==========================================================================
  describe('CONTRACT: blast_radius_bounds', () => {
    it('validates blast radius configuration', async () => {
      const playbook = createMockPlaybook();
      const isValid = await service.validateBlastRadius(playbook);

      assert.strictEqual(isValid, true);
    });

    it('gets blast radius level', async () => {
      const playbook = createMockPlaybook({
        blast_radius: createMockBlastRadius({ level: 'extensive' }),
      });
      const level = await service.getBlastRadiusLevel(playbook);

      assert.strictEqual(level, 'extensive');
    });

    it('checks affected resource bounds', async () => {
      const playbook = createMockPlaybook({
        blast_radius: createMockBlastRadius({ max_affected_resources: 10 }),
      });

      const withinBounds = await service.isWithinBounds(playbook, 5);
      const exceedsBounds = await service.isWithinBounds(playbook, 15);

      assert.strictEqual(withinBounds, true);
      assert.strictEqual(exceedsBounds, false);
    });

    it('blast radius includes rollback time', async () => {
      const playbook = createMockPlaybook();

      assert.ok(playbook.blast_radius.rollback_time_minutes > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: idempotency
  // ==========================================================================
  describe('CONTRACT: idempotency', () => {
    it('identifies idempotent playbooks', async () => {
      const playbook = createMockPlaybook({
        idempotency: createMockIdempotencyConfig({ mode: 'idempotent' }),
      });

      const isIdempotent = await service.isIdempotent(playbook);
      assert.strictEqual(isIdempotent, true);
    });

    it('identifies non-idempotent playbooks', async () => {
      const playbook = createMockPlaybook({
        idempotency: createMockIdempotencyConfig({ mode: 'non_idempotent' }),
      });

      const isIdempotent = await service.isIdempotent(playbook);
      assert.strictEqual(isIdempotent, false);
    });

    it('checks retry safety', async () => {
      const safePlaybook = createMockPlaybook({
        idempotency: createMockIdempotencyConfig({ safe_to_retry: true }),
      });
      const unsafePlaybook = createMockPlaybook({
        idempotency: createMockIdempotencyConfig({ safe_to_retry: false }),
      });

      const canRetrySafe = await service.canRetry(safePlaybook);
      const canRetryUnsafe = await service.canRetry(unsafePlaybook);

      assert.strictEqual(canRetrySafe, true);
      assert.strictEqual(canRetryUnsafe, false);
    });

    it('detects duplicate executions', async () => {
      const playbookId = 'pb-test';
      const executionKey = 'exec-key-1';

      await service.recordExecution(playbookId, executionKey);
      const isDuplicate = await service.isDuplicateExecution(playbookId, executionKey);
      const isNew = await service.isDuplicateExecution(playbookId, 'new-key');

      assert.strictEqual(isDuplicate, true);
      assert.strictEqual(isNew, false);
    });
  });

  // ==========================================================================
  // CONTRACT: rate_limits
  // ==========================================================================
  describe('CONTRACT: rate_limits', () => {
    it('tracks execution counts', async () => {
      const playbookId = 'pb-rate-test';

      await service.recordExecutionForRateLimit(playbookId);
      await service.recordExecutionForRateLimit(playbookId);

      const status = await service.checkRateLimit(playbookId);
      assert.strictEqual(status.executions_this_hour, 2);
    });

    it('enforces rate limits', async () => {
      const playbookId = 'pb-rate-limit';

      // Exceed hourly limit
      for (let i = 0; i < 6; i++) {
        await service.recordExecutionForRateLimit(playbookId);
      }

      const isLimited = await service.isRateLimited(playbookId);
      assert.strictEqual(isLimited, true);
    });

    it('provides remaining quota', async () => {
      const playbookId = 'pb-quota';

      await service.recordExecutionForRateLimit(playbookId);
      const quota = await service.getRemainingQuota(playbookId);

      assert.strictEqual(quota.hourly, 4); // 5 max - 1 used
    });

    it('rate limit status includes next allowed time', async () => {
      const playbookId = 'pb-next-time';

      for (let i = 0; i < 6; i++) {
        await service.recordExecutionForRateLimit(playbookId);
      }

      const status = await service.checkRateLimit(playbookId);
      assert.ok(status.next_allowed_at);
    });
  });

  // ==========================================================================
  // CONTRACT: guardrails
  // ==========================================================================
  describe('CONTRACT: guardrails', () => {
    it('runs safety checks', async () => {
      const playbook = createMockPlaybook();
      const result = await service.runSafetyChecks(playbook);

      assert.ok(result.check_id.startsWith('sha256:'));
      assert.strictEqual(result.passed, true);
    });

    it('fails when guardrails fail', async () => {
      const playbook = createMockPlaybook();

      // Exceed rate limits to trigger failure
      for (let i = 0; i < 6; i++) {
        await service.recordExecutionForRateLimit(playbook.playbook_id);
      }

      const result = await service.runSafetyChecks(playbook);
      assert.strictEqual(result.passed, false);
      assert.ok(result.failed_guardrails.includes('rate_limit'));
    });

    it('warns on non-idempotent playbooks', async () => {
      const playbook = createMockPlaybook({
        idempotency: createMockIdempotencyConfig({ mode: 'non_idempotent' }),
      });

      const result = await service.runSafetyChecks(playbook);
      assert.ok(result.warnings.length > 0);
    });

    it('guardrail IDs are opaque', async () => {
      const playbook = createMockPlaybook();

      playbook.guardrails.forEach(g => {
        assert.ok(g.guardrail_id.startsWith('sha256:'));
      });
    });
  });

  // ==========================================================================
  // CONTRACT: circuit_breaker
  // ==========================================================================
  describe('CONTRACT: circuit_breaker', () => {
    it('starts in closed state', async () => {
      const state = await service.getCircuitBreakerState('new-playbook');

      assert.strictEqual(state.state, 'closed');
      assert.strictEqual(state.failure_count, 0);
    });

    it('opens after threshold failures', async () => {
      const playbookId = 'pb-circuit';

      await service.recordFailure(playbookId);
      await service.recordFailure(playbookId);
      await service.recordFailure(playbookId);

      const isOpen = await service.isCircuitOpen(playbookId);
      assert.strictEqual(isOpen, true);
    });

    it('resets on success', async () => {
      const playbookId = 'pb-reset';

      await service.recordFailure(playbookId);
      await service.recordSuccess(playbookId);

      const state = await service.getCircuitBreakerState(playbookId);
      assert.strictEqual(state.failure_count, 0);
    });

    it('open circuit blocks safety checks', async () => {
      const playbook = createMockPlaybook();

      // Trip circuit breaker
      await service.recordFailure(playbook.playbook_id);
      await service.recordFailure(playbook.playbook_id);
      await service.recordFailure(playbook.playbook_id);

      const result = await service.runSafetyChecks(playbook);
      assert.strictEqual(result.passed, false);
      assert.ok(result.failed_guardrails.includes('circuit_breaker'));
    });
  });
});
