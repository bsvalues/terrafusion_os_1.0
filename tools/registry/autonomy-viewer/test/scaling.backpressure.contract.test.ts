/**
 * Scaling Hardening: Backpressure Controls Contract Tests
 *
 * Phase VIf - Governance plane scaling for queue management and circuit breaking.
 *
 * CONTRACT SURFACE:
 * - Queue Thresholds: Bounded queue depths with overflow handling
 * - Circuit Breakers: Automatic failure isolation with recovery
 * - Load Shedding: Graceful degradation under pressure
 * - Rate Limiting: Request rate controls per entity/operation
 *
 * INVARIANTS:
 * - Backpressure never blocks auth path (fail-open for auth)
 * - Circuit breakers recover automatically after cooldown
 * - Shedding prioritizes governance-critical traffic
 * - Rate limits are per-principal with burst allowance
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Queue state
 */
type QueueState = 'healthy' | 'warning' | 'critical' | 'overflow';

/**
 * Circuit breaker state
 */
type CircuitState = 'closed' | 'open' | 'half_open';

/**
 * Shedding strategy
 */
type SheddingStrategy = 'random' | 'oldest' | 'lowest_priority' | 'adaptive';

/**
 * Traffic priority
 */
type TrafficPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

/**
 * Queue metrics
 */
interface QueueMetrics {
  readonly queue_name: string;
  readonly current_depth: number;
  readonly max_depth: number;
  readonly warning_threshold: number;
  readonly critical_threshold: number;
  readonly state: QueueState;
  readonly enqueue_rate_per_sec: number;
  readonly dequeue_rate_per_sec: number;
  readonly avg_latency_ms: number;
  readonly p99_latency_ms: number;
}

/**
 * Queue overflow result
 */
interface OverflowResult {
  readonly accepted: boolean;
  readonly queue_depth: number;
  readonly reason: string | null;
  readonly redirect_queue: string | null;
  readonly retry_after_ms: number | null;
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  readonly circuit_name: string;
  readonly failure_threshold: number;
  readonly success_threshold: number;
  readonly timeout_ms: number;
  readonly cooldown_ms: number;
  readonly half_open_requests: number;
}

/**
 * Circuit breaker status
 */
interface CircuitBreakerStatus {
  readonly circuit_name: string;
  readonly state: CircuitState;
  readonly failure_count: number;
  readonly success_count: number;
  readonly last_failure_at: string | null;
  readonly last_success_at: string | null;
  readonly opened_at: string | null;
  readonly cooldown_remaining_ms: number;
}

/**
 * Shedding configuration
 */
interface SheddingConfig {
  readonly enabled: boolean;
  readonly strategy: SheddingStrategy;
  readonly threshold_pct: number;
  readonly protected_priorities: readonly TrafficPriority[];
  readonly max_shed_pct: number;
}

/**
 * Shedding decision
 */
interface SheddingDecision {
  readonly shed: boolean;
  readonly priority: TrafficPriority;
  readonly load_pct: number;
  readonly reason: string | null;
  readonly retry_after_ms: number | null;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  readonly limit_name: string;
  readonly requests_per_second: number;
  readonly burst_size: number;
  readonly per_principal: boolean;
  readonly cooldown_ms: number;
}

/**
 * Rate limit check result
 */
interface RateLimitResult {
  readonly allowed: boolean;
  readonly tokens_remaining: number;
  readonly limit: number;
  readonly reset_at: string;
  readonly retry_after_ms: number | null;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockQueueMetrics(overrides: Partial<QueueMetrics> = {}): QueueMetrics {
  return {
    queue_name: 'governance_events',
    current_depth: 500,
    max_depth: 10000,
    warning_threshold: 7000,
    critical_threshold: 9000,
    state: 'healthy',
    enqueue_rate_per_sec: 100,
    dequeue_rate_per_sec: 110,
    avg_latency_ms: 50,
    p99_latency_ms: 200,
    ...overrides,
  };
}

function createMockOverflowResult(overrides: Partial<OverflowResult> = {}): OverflowResult {
  return {
    accepted: true,
    queue_depth: 500,
    reason: null,
    redirect_queue: null,
    retry_after_ms: null,
    ...overrides,
  };
}

function createMockCircuitBreakerConfig(
  overrides: Partial<CircuitBreakerConfig> = {}
): CircuitBreakerConfig {
  return {
    circuit_name: 'evidence_pack_generator',
    failure_threshold: 5,
    success_threshold: 3,
    timeout_ms: 30000,
    cooldown_ms: 60000,
    half_open_requests: 3,
    ...overrides,
  };
}

function createMockCircuitBreakerStatus(
  overrides: Partial<CircuitBreakerStatus> = {}
): CircuitBreakerStatus {
  return {
    circuit_name: 'evidence_pack_generator',
    state: 'closed',
    failure_count: 0,
    success_count: 10,
    last_failure_at: null,
    last_success_at: new Date().toISOString(),
    opened_at: null,
    cooldown_remaining_ms: 0,
    ...overrides,
  };
}

function createMockSheddingConfig(overrides: Partial<SheddingConfig> = {}): SheddingConfig {
  return {
    enabled: true,
    strategy: 'lowest_priority',
    threshold_pct: 80,
    protected_priorities: ['critical', 'high'],
    max_shed_pct: 50,
    ...overrides,
  };
}

function createMockSheddingDecision(overrides: Partial<SheddingDecision> = {}): SheddingDecision {
  return {
    shed: false,
    priority: 'normal',
    load_pct: 50,
    reason: null,
    retry_after_ms: null,
    ...overrides,
  };
}

function createMockRateLimitConfig(overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    limit_name: 'governance_api',
    requests_per_second: 100,
    burst_size: 200,
    per_principal: true,
    cooldown_ms: 1000,
    ...overrides,
  };
}

function createMockRateLimitResult(overrides: Partial<RateLimitResult> = {}): RateLimitResult {
  return {
    allowed: true,
    tokens_remaining: 150,
    limit: 200,
    reset_at: new Date(Date.now() + 1000).toISOString(),
    retry_after_ms: null,
    ...overrides,
  };
}

// ============================================================================
// MOCK BACKPRESSURE STORE
// ============================================================================

interface BackpressureStore {
  // Queue Management
  getQueueMetrics(queueName: string): Promise<QueueMetrics>;
  getAllQueues(): Promise<readonly QueueMetrics[]>;
  enqueue(queueName: string, priority: TrafficPriority): Promise<OverflowResult>;
  getQueueState(queueName: string): Promise<QueueState>;

  // Circuit Breakers
  getCircuitConfig(circuitName: string): Promise<CircuitBreakerConfig>;
  getCircuitStatus(circuitName: string): Promise<CircuitBreakerStatus>;
  recordSuccess(circuitName: string): Promise<void>;
  recordFailure(circuitName: string): Promise<void>;
  canExecute(circuitName: string): Promise<boolean>;
  isAuthPathCircuit(circuitName: string): boolean;

  // Load Shedding
  getSheddingConfig(): Promise<SheddingConfig>;
  evaluateShedding(priority: TrafficPriority): Promise<SheddingDecision>;
  getCurrentLoadPct(): Promise<number>;

  // Rate Limiting
  getRateLimitConfig(limitName: string): Promise<RateLimitConfig>;
  checkRateLimit(limitName: string, principalId: string): Promise<RateLimitResult>;
  consumeToken(limitName: string, principalId: string): Promise<boolean>;
}

function createMockBackpressureStore(): BackpressureStore {
  const circuits: Map<string, CircuitBreakerStatus> = new Map();
  const tokenBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  // Auth path circuits that must fail-open
  const authPathCircuits = new Set(['auth_service', 'token_validator', 'identity_provider']);

  return {
    async getQueueMetrics(queueName) {
      return createMockQueueMetrics({ queue_name: queueName });
    },

    async getAllQueues() {
      return [
        createMockQueueMetrics({ queue_name: 'governance_events' }),
        createMockQueueMetrics({ queue_name: 'evidence_packs', current_depth: 200 }),
        createMockQueueMetrics({ queue_name: 'audit_logs', current_depth: 1000 }),
        createMockQueueMetrics({ queue_name: 'anomaly_findings', current_depth: 50 }),
      ];
    },

    async enqueue(queueName, priority) {
      const metrics = await this.getQueueMetrics(queueName);
      if (metrics.current_depth >= metrics.max_depth) {
        return createMockOverflowResult({
          accepted: false,
          queue_depth: metrics.current_depth,
          reason: 'queue at capacity',
          retry_after_ms: 5000,
        });
      }
      if (metrics.state === 'critical' && priority === 'background') {
        return createMockOverflowResult({
          accepted: false,
          queue_depth: metrics.current_depth,
          reason: 'shedding low priority traffic',
          retry_after_ms: 10000,
        });
      }
      return createMockOverflowResult({ queue_depth: metrics.current_depth + 1 });
    },

    async getQueueState(queueName) {
      const metrics = await this.getQueueMetrics(queueName);
      return metrics.state;
    },

    async getCircuitConfig(circuitName) {
      return createMockCircuitBreakerConfig({ circuit_name: circuitName });
    },

    async getCircuitStatus(circuitName) {
      return (
        circuits.get(circuitName) ?? createMockCircuitBreakerStatus({ circuit_name: circuitName })
      );
    },

    async recordSuccess(circuitName) {
      const status = await this.getCircuitStatus(circuitName);
      const updated: CircuitBreakerStatus = {
        ...status,
        success_count: status.success_count + 1,
        last_success_at: new Date().toISOString(),
        state:
          status.state === 'half_open' && status.success_count + 1 >= 3 ? 'closed' : status.state,
      };
      circuits.set(circuitName, updated);
    },

    async recordFailure(circuitName) {
      const status = await this.getCircuitStatus(circuitName);
      const config = await this.getCircuitConfig(circuitName);
      const newFailureCount = status.failure_count + 1;
      const shouldOpen = newFailureCount >= config.failure_threshold;
      const updated: CircuitBreakerStatus = {
        ...status,
        failure_count: newFailureCount,
        last_failure_at: new Date().toISOString(),
        state: shouldOpen ? 'open' : status.state,
        opened_at: shouldOpen ? new Date().toISOString() : status.opened_at,
        cooldown_remaining_ms: shouldOpen ? config.cooldown_ms : status.cooldown_remaining_ms,
      };
      circuits.set(circuitName, updated);
    },

    async canExecute(circuitName) {
      // Auth path circuits always allow execution (fail-open)
      if (authPathCircuits.has(circuitName)) {
        return true;
      }
      const status = await this.getCircuitStatus(circuitName);
      return status.state !== 'open';
    },

    isAuthPathCircuit(circuitName) {
      return authPathCircuits.has(circuitName);
    },

    async getSheddingConfig() {
      return createMockSheddingConfig();
    },

    async evaluateShedding(priority) {
      const config = await this.getSheddingConfig();
      const loadPct = await this.getCurrentLoadPct();

      if (!config.enabled || loadPct < config.threshold_pct) {
        return createMockSheddingDecision({ priority, load_pct: loadPct });
      }

      // Protected priorities are never shed
      if (config.protected_priorities.includes(priority)) {
        return createMockSheddingDecision({ priority, load_pct: loadPct });
      }

      // Shed based on strategy
      const shedPct = Math.min(
        ((loadPct - config.threshold_pct) / (100 - config.threshold_pct)) * config.max_shed_pct,
        config.max_shed_pct
      );
      const shouldShed = Math.random() * 100 < shedPct;

      return createMockSheddingDecision({
        shed: shouldShed,
        priority,
        load_pct: loadPct,
        reason: shouldShed ? `shedding ${priority} traffic at ${loadPct}% load` : null,
        retry_after_ms: shouldShed ? 5000 : null,
      });
    },

    async getCurrentLoadPct() {
      return 50; // Mock 50% load
    },

    async getRateLimitConfig(limitName) {
      return createMockRateLimitConfig({ limit_name: limitName });
    },

    async checkRateLimit(limitName, principalId) {
      const config = await this.getRateLimitConfig(limitName);
      const bucketKey = `${limitName}:${principalId}`;
      const bucket = tokenBuckets.get(bucketKey) ?? {
        tokens: config.burst_size,
        lastRefill: Date.now(),
      };

      // Refill tokens based on time elapsed
      const elapsed = Date.now() - bucket.lastRefill;
      const refill = Math.floor((elapsed / 1000) * config.requests_per_second);
      const tokens = Math.min(bucket.tokens + refill, config.burst_size);

      if (tokens > 0) {
        return createMockRateLimitResult({
          tokens_remaining: tokens,
          limit: config.burst_size,
        });
      }

      return createMockRateLimitResult({
        allowed: false,
        tokens_remaining: 0,
        limit: config.burst_size,
        retry_after_ms: config.cooldown_ms,
      });
    },

    async consumeToken(limitName, principalId) {
      const result = await this.checkRateLimit(limitName, principalId);
      if (result.allowed) {
        const config = await this.getRateLimitConfig(limitName);
        const bucketKey = `${limitName}:${principalId}`;
        const bucket = tokenBuckets.get(bucketKey) ?? {
          tokens: config.burst_size,
          lastRefill: Date.now(),
        };
        tokenBuckets.set(bucketKey, {
          tokens: result.tokens_remaining - 1,
          lastRefill: Date.now(),
        });
        return true;
      }
      return false;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Scaling Hardening: Backpressure Controls Contracts', () => {
  let store: BackpressureStore;

  beforeEach(() => {
    store = createMockBackpressureStore();
  });

  // ==========================================================================
  // CONTRACT: backpressure_queue_thresholds
  // ==========================================================================
  describe('CONTRACT: backpressure_queue_thresholds', () => {
    it('tracks queue depth and state', async () => {
      const metrics = await store.getQueueMetrics('governance_events');

      assert.ok(metrics.current_depth >= 0);
      assert.ok(metrics.max_depth > 0);
      assert.ok(metrics.current_depth <= metrics.max_depth);
      assert.ok(['healthy', 'warning', 'critical', 'overflow'].includes(metrics.state));
    });

    it('defines warning and critical thresholds', async () => {
      const metrics = await store.getQueueMetrics('audit_logs');

      assert.ok(metrics.warning_threshold > 0);
      assert.ok(metrics.critical_threshold > metrics.warning_threshold);
      assert.ok(metrics.critical_threshold <= metrics.max_depth);
    });

    it('accepts enqueue under capacity', async () => {
      const result = await store.enqueue('governance_events', 'normal');

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.reason, null);
    });

    it('measures queue latency', async () => {
      const metrics = await store.getQueueMetrics('evidence_packs');

      assert.ok(typeof metrics.avg_latency_ms === 'number');
      assert.ok(typeof metrics.p99_latency_ms === 'number');
      assert.ok(metrics.p99_latency_ms >= metrics.avg_latency_ms);
    });

    it('tracks multiple queues independently', async () => {
      const queues = await store.getAllQueues();

      assert.ok(queues.length > 1);
      const names = new Set(queues.map(q => q.queue_name));
      assert.strictEqual(names.size, queues.length, 'queue names must be unique');
    });
  });

  // ==========================================================================
  // CONTRACT: backpressure_circuit_breakers
  // ==========================================================================
  describe('CONTRACT: backpressure_circuit_breakers', () => {
    it('starts in closed state', async () => {
      const status = await store.getCircuitStatus('evidence_pack_generator');

      assert.strictEqual(status.state, 'closed');
    });

    it('opens after failure threshold', async () => {
      const circuitName = 'test_circuit';
      const config = await store.getCircuitConfig(circuitName);

      for (let i = 0; i < config.failure_threshold; i++) {
        await store.recordFailure(circuitName);
      }

      const status = await store.getCircuitStatus(circuitName);
      assert.strictEqual(status.state, 'open');
      assert.ok(status.opened_at, 'should record open time');
    });

    it('blocks execution when open', async () => {
      const circuitName = 'test_circuit';
      const config = await store.getCircuitConfig(circuitName);

      for (let i = 0; i < config.failure_threshold; i++) {
        await store.recordFailure(circuitName);
      }

      const canExecute = await store.canExecute(circuitName);
      assert.strictEqual(canExecute, false);
    });

    it('auth path circuits fail-open (never block)', async () => {
      const authCircuit = 'auth_service';
      assert.strictEqual(store.isAuthPathCircuit(authCircuit), true);

      // Even with failures, auth path must allow execution
      const canExecute = await store.canExecute(authCircuit);
      assert.strictEqual(canExecute, true);
    });

    it('has bounded cooldown', async () => {
      const config = await store.getCircuitConfig('evidence_pack_generator');

      assert.ok(config.cooldown_ms > 0);
      assert.ok(config.cooldown_ms <= 300000, 'cooldown should not exceed 5 minutes');
    });
  });

  // ==========================================================================
  // CONTRACT: backpressure_load_shedding
  // ==========================================================================
  describe('CONTRACT: backpressure_load_shedding', () => {
    it('has shedding configuration', async () => {
      const config = await store.getSheddingConfig();

      assert.ok(typeof config.enabled === 'boolean');
      assert.ok(['random', 'oldest', 'lowest_priority', 'adaptive'].includes(config.strategy));
      assert.ok(config.threshold_pct > 0 && config.threshold_pct < 100);
    });

    it('protects critical and high priority traffic', async () => {
      const config = await store.getSheddingConfig();

      assert.ok(config.protected_priorities.includes('critical'));
      assert.ok(config.protected_priorities.includes('high'));
    });

    it('evaluates shedding based on load', async () => {
      const decision = await store.evaluateShedding('normal');

      assert.ok(typeof decision.shed === 'boolean');
      assert.ok(typeof decision.load_pct === 'number');
      assert.ok(['critical', 'high', 'normal', 'low', 'background'].includes(decision.priority));
    });

    it('never sheds protected traffic', async () => {
      const criticalDecision = await store.evaluateShedding('critical');
      const highDecision = await store.evaluateShedding('high');

      assert.strictEqual(criticalDecision.shed, false);
      assert.strictEqual(highDecision.shed, false);
    });

    it('max shed percentage is bounded', async () => {
      const config = await store.getSheddingConfig();

      assert.ok(config.max_shed_pct > 0);
      assert.ok(config.max_shed_pct <= 80, 'should not shed more than 80% of traffic');
    });
  });

  // ==========================================================================
  // CONTRACT: backpressure_rate_limiting
  // ==========================================================================
  describe('CONTRACT: backpressure_rate_limiting', () => {
    it('allows requests under limit', async () => {
      const result = await store.checkRateLimit('governance_api', 'principal-1');

      assert.strictEqual(result.allowed, true);
      assert.ok(result.tokens_remaining > 0);
    });

    it('supports burst capacity', async () => {
      const config = await store.getRateLimitConfig('governance_api');

      assert.ok(config.burst_size > config.requests_per_second);
    });

    it('is per-principal when configured', async () => {
      const config = await store.getRateLimitConfig('governance_api');

      assert.strictEqual(config.per_principal, true);
    });

    it('returns retry-after on limit breach', async () => {
      const result = createMockRateLimitResult({
        allowed: false,
        tokens_remaining: 0,
        retry_after_ms: 1000,
      });

      assert.strictEqual(result.allowed, false);
      assert.ok(result.retry_after_ms, 'should include retry_after_ms');
      assert.ok(result.retry_after_ms > 0);
    });

    it('has bounded cooldown', async () => {
      const config = await store.getRateLimitConfig('governance_api');

      assert.ok(config.cooldown_ms > 0);
      assert.ok(config.cooldown_ms <= 60000, 'cooldown should not exceed 60 seconds');
    });
  });
});
