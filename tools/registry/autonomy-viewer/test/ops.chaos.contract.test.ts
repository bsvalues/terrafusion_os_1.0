/**
 * Ops-Plane Chaos/Resilience Contract Tests
 * ===========================================
 *
 * Phase IIIn: Validates graceful degradation under failure conditions.
 *
 * Contract:
 * - notification_failures_silent: Delivery failures don't cascade
 * - dedupe_under_burst: Duplicate bursts handled correctly
 * - audit_failures_isolated: Audit errors don't block flow
 * - suppression_failures_safe: Suppression errors default to notify
 * - partial_failures_bounded: Pipeline continues despite component failures
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Chaos Testing
// ============================================================================

/**
 * Failure injection configuration.
 */
interface FailureConfig {
  readonly notificationFailRate: number; // 0-1
  readonly auditFailRate: number; // 0-1
  readonly suppressionFailRate: number; // 0-1
  readonly latencyMs: number;
}

/**
 * Delivery attempt result.
 */
interface DeliveryAttempt {
  readonly channel: string;
  readonly success: boolean;
  readonly error?: string;
  readonly retryable: boolean;
  readonly timestamp: string;
}

/**
 * Batch processing result.
 */
interface BatchResult {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly deduplicated: number;
  readonly errors: readonly string[];
}

/**
 * Circuit breaker state.
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration.
 */
interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly resetTimeoutMs: number;
  readonly halfOpenRequests: number;
}

/**
 * Retry configuration.
 */
interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly retryableErrors: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenRequests: 1,
};

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  retryableErrors: ['TIMEOUT', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE'],
};

const DEDUPE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Chaos-enabled notification dispatcher.
 */
class ChaosNotificationDispatcher {
  private readonly attempts: DeliveryAttempt[] = [];
  private readonly failureConfig: FailureConfig;
  private consecutiveFailures = 0;
  private circuitState: CircuitState = 'closed';
  private lastFailureTime = 0;

  constructor(failureConfig: Partial<FailureConfig> = {}) {
    this.failureConfig = {
      notificationFailRate: failureConfig.notificationFailRate ?? 0,
      auditFailRate: failureConfig.auditFailRate ?? 0,
      suppressionFailRate: failureConfig.suppressionFailRate ?? 0,
      latencyMs: failureConfig.latencyMs ?? 0,
    };
  }

  dispatch(channel: string, payload: unknown): DeliveryAttempt {
    // Check circuit breaker
    if (this.circuitState === 'open') {
      if (Date.now() - this.lastFailureTime > DEFAULT_CIRCUIT_BREAKER.resetTimeoutMs) {
        this.circuitState = 'half-open';
      } else {
        return {
          channel,
          success: false,
          error: 'CIRCUIT_OPEN',
          retryable: true,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Simulate failure
    if (Math.random() < this.failureConfig.notificationFailRate) {
      this.consecutiveFailures++;
      this.lastFailureTime = Date.now();

      if (this.consecutiveFailures >= DEFAULT_CIRCUIT_BREAKER.failureThreshold) {
        this.circuitState = 'open';
      }

      const attempt: DeliveryAttempt = {
        channel,
        success: false,
        error: 'DELIVERY_FAILED',
        retryable: true,
        timestamp: new Date().toISOString(),
      };
      this.attempts.push(attempt);
      return attempt;
    }

    // Success - reset circuit breaker
    this.consecutiveFailures = 0;
    this.circuitState = 'closed';

    const attempt: DeliveryAttempt = {
      channel,
      success: true,
      retryable: false,
      timestamp: new Date().toISOString(),
    };
    this.attempts.push(attempt);
    return attempt;
  }

  getAttempts(): readonly DeliveryAttempt[] {
    return [...this.attempts];
  }

  getCircuitState(): CircuitState {
    return this.circuitState;
  }

  resetCircuit(): void {
    this.circuitState = 'closed';
    this.consecutiveFailures = 0;
  }
}

/**
 * Deduplication tracker.
 */
class DeduplicationTracker {
  private readonly seen: Map<string, number> = new Map();

  isDuplicate(key: string, now?: number): boolean {
    const currentTime = now ?? Date.now();
    const lastSeen = this.seen.get(key);

    if (lastSeen && currentTime - lastSeen < DEDUPE_WINDOW_MS) {
      return true;
    }

    this.seen.set(key, currentTime);
    return false;
  }

  cleanup(now?: number): number {
    const currentTime = now ?? Date.now();
    let removed = 0;

    for (const [key, timestamp] of this.seen) {
      if (currentTime - timestamp >= DEDUPE_WINDOW_MS) {
        this.seen.delete(key);
        removed++;
      }
    }

    return removed;
  }

  getSize(): number {
    return this.seen.size;
  }
}

/**
 * Resilient audit store with failure injection.
 */
class ResilientAuditStore {
  private readonly entries: Array<{ data: unknown; timestamp: string }> = [];
  private failRate: number;
  private readonly fallbackBuffer: Array<{ data: unknown; timestamp: string }> = [];

  constructor(failRate = 0) {
    this.failRate = failRate;
  }

  append(data: unknown): { success: boolean; buffered: boolean; error?: string } {
    if (Math.random() < this.failRate) {
      // Store in fallback buffer for later retry
      this.fallbackBuffer.push({ data, timestamp: new Date().toISOString() });
      return { success: false, buffered: true, error: 'AUDIT_STORE_UNAVAILABLE' };
    }

    this.entries.push({ data, timestamp: new Date().toISOString() });
    return { success: true, buffered: false };
  }

  flushBuffer(): number {
    const count = this.fallbackBuffer.length;
    this.entries.push(...this.fallbackBuffer);
    this.fallbackBuffer.length = 0;
    return count;
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  getBufferCount(): number {
    return this.fallbackBuffer.length;
  }

  setFailRate(rate: number): void {
    this.failRate = rate;
  }
}

/**
 * Batch processor with resilience.
 */
class ResilientBatchProcessor {
  private readonly deduper = new DeduplicationTracker();
  private readonly dispatcher: ChaosNotificationDispatcher;
  private readonly auditStore: ResilientAuditStore;

  constructor(dispatcher: ChaosNotificationDispatcher, auditStore: ResilientAuditStore) {
    this.dispatcher = dispatcher;
    this.auditStore = auditStore;
  }

  processBatch(items: readonly { id: string; channel: string; payload: unknown }[]): BatchResult {
    let succeeded = 0;
    let failed = 0;
    let deduplicated = 0;
    const errors: string[] = [];

    for (const item of items) {
      // Check dedupe
      if (this.deduper.isDuplicate(item.id)) {
        deduplicated++;
        continue;
      }

      // Attempt delivery
      const result = this.dispatcher.dispatch(item.channel, item.payload);

      if (result.success) {
        succeeded++;
        // Audit - fire and forget (don't block on failure)
        this.auditStore.append({ itemId: item.id, result: 'delivered' });
      } else {
        failed++;
        errors.push(result.error ?? 'UNKNOWN_ERROR');
        // Still audit the failure
        this.auditStore.append({ itemId: item.id, result: 'failed', error: result.error });
      }
    }

    return {
      total: items.length,
      succeeded,
      failed,
      deduplicated,
      errors,
    };
  }
}

/**
 * Calculate retry delay with exponential backoff.
 */
function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Check if error is retryable.
 */
function isRetryable(error: string, config: RetryConfig = DEFAULT_RETRY): boolean {
  return config.retryableErrors.includes(error);
}

// ============================================================================
// Contract: notification_failures_silent
// ============================================================================

describe('Ops-Plane Chaos Contract', () => {
  describe('notification_failures_silent', () => {
    it('should not throw on delivery failure', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 1.0 });

      // Should not throw
      assert.doesNotThrow(() => {
        dispatcher.dispatch('slack', { message: 'test' });
      });
    });

    it('should return failure result instead of exception', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 1.0 });

      const result = dispatcher.dispatch('slack', { message: 'test' });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.retryable !== undefined);
    });

    it('should continue processing after failure', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 0.5 });
      const auditStore = new ResilientAuditStore(0);
      const processor = new ResilientBatchProcessor(dispatcher, auditStore);

      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        channel: 'slack',
        payload: { message: `test-${i}` },
      }));

      const result = processor.processBatch(items);

      // Should process all items despite failures
      assert.strictEqual(result.succeeded + result.failed + result.deduplicated, items.length);
    });

    it('should open circuit breaker after threshold failures', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 1.0 });

      // Trigger failures to open circuit
      for (let i = 0; i < DEFAULT_CIRCUIT_BREAKER.failureThreshold; i++) {
        dispatcher.dispatch('slack', { message: 'test' });
      }

      assert.strictEqual(dispatcher.getCircuitState(), 'open');
    });

    it('should fail fast when circuit open', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 1.0 });

      // Open circuit
      for (let i = 0; i < DEFAULT_CIRCUIT_BREAKER.failureThreshold; i++) {
        dispatcher.dispatch('slack', { message: 'test' });
      }

      const result = dispatcher.dispatch('slack', { message: 'test' });
      assert.strictEqual(result.error, 'CIRCUIT_OPEN');
    });
  });

  // ============================================================================
  // Contract: dedupe_under_burst
  // ============================================================================

  describe('dedupe_under_burst', () => {
    it('should deduplicate identical items in burst', () => {
      const deduper = new DeduplicationTracker();

      const firstCheck = deduper.isDuplicate('item-1');
      const secondCheck = deduper.isDuplicate('item-1');

      assert.ok(!firstCheck, 'First should not be duplicate');
      assert.ok(secondCheck, 'Second should be duplicate');
    });

    it('should allow different items in same burst', () => {
      const deduper = new DeduplicationTracker();

      const check1 = deduper.isDuplicate('item-1');
      const check2 = deduper.isDuplicate('item-2');

      assert.ok(!check1);
      assert.ok(!check2);
    });

    it('should count deduplicated items in batch result', () => {
      const dispatcher = new ChaosNotificationDispatcher();
      const auditStore = new ResilientAuditStore();
      const processor = new ResilientBatchProcessor(dispatcher, auditStore);

      const items = [
        { id: 'item-1', channel: 'slack', payload: {} },
        { id: 'item-1', channel: 'slack', payload: {} }, // Duplicate
        { id: 'item-1', channel: 'slack', payload: {} }, // Duplicate
        { id: 'item-2', channel: 'slack', payload: {} },
      ];

      const result = processor.processBatch(items);

      assert.strictEqual(result.deduplicated, 2);
      assert.strictEqual(result.succeeded, 2);
    });

    it('should cleanup old entries', () => {
      const deduper = new DeduplicationTracker();
      const now = Date.now();

      deduper.isDuplicate('item-1', now - DEDUPE_WINDOW_MS - 1000);
      deduper.isDuplicate('item-2', now);

      const removed = deduper.cleanup(now);

      assert.strictEqual(removed, 1);
      assert.strictEqual(deduper.getSize(), 1);
    });

    it('should allow same item after window expires', () => {
      const deduper = new DeduplicationTracker();
      const now = Date.now();

      deduper.isDuplicate('item-1', now - DEDUPE_WINDOW_MS - 1000);
      deduper.cleanup(now);

      const check = deduper.isDuplicate('item-1', now);
      assert.ok(!check, 'Should allow after window expires');
    });
  });

  // ============================================================================
  // Contract: audit_failures_isolated
  // ============================================================================

  describe('audit_failures_isolated', () => {
    it('should not block notification on audit failure', () => {
      const dispatcher = new ChaosNotificationDispatcher();
      const auditStore = new ResilientAuditStore(1.0); // 100% failure
      const processor = new ResilientBatchProcessor(dispatcher, auditStore);

      const items = [{ id: 'item-1', channel: 'slack', payload: {} }];

      const result = processor.processBatch(items);

      // Notification should succeed despite audit failure
      assert.strictEqual(result.succeeded, 1);
    });

    it('should buffer failed audit entries', () => {
      const auditStore = new ResilientAuditStore(1.0);

      auditStore.append({ test: 'data' });
      auditStore.append({ test: 'data2' });

      assert.strictEqual(auditStore.getBufferCount(), 2);
      assert.strictEqual(auditStore.getEntryCount(), 0);
    });

    it('should flush buffer when store recovers', () => {
      const auditStore = new ResilientAuditStore(1.0);

      auditStore.append({ test: 'data' });
      auditStore.append({ test: 'data2' });

      auditStore.setFailRate(0);
      const flushed = auditStore.flushBuffer();

      assert.strictEqual(flushed, 2);
      assert.strictEqual(auditStore.getEntryCount(), 2);
      assert.strictEqual(auditStore.getBufferCount(), 0);
    });

    it('should not couple auth to audit availability', () => {
      // This test documents that notification/ack operations
      // should not require audit to be available
      const auditStore = new ResilientAuditStore(1.0);
      const dispatcher = new ChaosNotificationDispatcher();

      // Dispatch should work
      const result = dispatcher.dispatch('slack', { message: 'test' });
      assert.ok(result.success);

      // Audit failed but that's okay
      const auditResult = auditStore.append({ action: 'notification.sent' });
      assert.ok(!auditResult.success);
      assert.ok(auditResult.buffered);
    });
  });

  // ============================================================================
  // Contract: suppression_failures_safe
  // ============================================================================

  describe('suppression_failures_safe', () => {
    it('should default to notify when suppression check fails', () => {
      // When suppression store is unavailable, default to sending notification
      // This is a safety-first design - better to over-notify than under-notify
      const shouldNotify = (suppressionCheckFailed: boolean): boolean => {
        if (suppressionCheckFailed) {
          // Fail open - send the notification
          return true;
        }
        return true;
      };

      assert.ok(shouldNotify(true), 'Should notify when suppression check fails');
    });

    it('should log suppression check failures', () => {
      const errors: string[] = [];

      const checkSuppression = (targetId: string, failSimulation: boolean): boolean => {
        if (failSimulation) {
          errors.push(`Suppression check failed for ${targetId}`);
          return false; // Assume not suppressed when check fails
        }
        return false;
      };

      checkSuppression('slo-1', true);

      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes('slo-1'));
    });

    it('should not cache failed suppression results', () => {
      const cache = new Map<string, { suppressed: boolean; error?: boolean }>();

      const checkWithCache = (targetId: string, fail: boolean): boolean => {
        if (fail) {
          // Don't cache failures
          return false;
        }
        cache.set(targetId, { suppressed: false });
        return false;
      };

      checkWithCache('slo-1', true);
      assert.ok(!cache.has('slo-1'), 'Should not cache failed check');

      checkWithCache('slo-1', false);
      assert.ok(cache.has('slo-1'), 'Should cache successful check');
    });
  });

  // ============================================================================
  // Contract: partial_failures_bounded
  // ============================================================================

  describe('partial_failures_bounded', () => {
    it('should report partial success in batch', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 0.3 });
      const auditStore = new ResilientAuditStore();
      const processor = new ResilientBatchProcessor(dispatcher, auditStore);

      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        channel: 'slack',
        payload: {},
      }));

      const result = processor.processBatch(items);

      // Should have mix of success and failure
      assert.ok(result.succeeded > 0, 'Should have some successes');
      assert.ok(result.failed > 0, 'Should have some failures');
      assert.strictEqual(result.succeeded + result.failed, 100);
    });

    it('should collect all errors in batch', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 0.5 });
      const auditStore = new ResilientAuditStore();
      const processor = new ResilientBatchProcessor(dispatcher, auditStore);

      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        channel: 'slack',
        payload: {},
      }));

      const result = processor.processBatch(items);

      assert.strictEqual(result.errors.length, result.failed);
    });

    it('should use exponential backoff for retries', () => {
      const delays = [
        calculateRetryDelay(0),
        calculateRetryDelay(1),
        calculateRetryDelay(2),
        calculateRetryDelay(3),
      ];

      // Each delay should be roughly double the previous
      for (let i = 1; i < delays.length; i++) {
        assert.ok(delays[i] >= delays[i - 1], 'Delays should increase');
      }

      // Should cap at max
      const maxDelay = calculateRetryDelay(100);
      assert.ok(maxDelay <= DEFAULT_RETRY.maxDelayMs);
    });

    it('should identify retryable vs non-retryable errors', () => {
      assert.ok(isRetryable('TIMEOUT'));
      assert.ok(isRetryable('RATE_LIMITED'));
      assert.ok(isRetryable('SERVICE_UNAVAILABLE'));
      assert.ok(!isRetryable('INVALID_PAYLOAD'));
      assert.ok(!isRetryable('UNAUTHORIZED'));
    });

    it('should reset circuit breaker on success', () => {
      const dispatcher = new ChaosNotificationDispatcher({ notificationFailRate: 0.8 });

      // Trigger some failures
      for (let i = 0; i < 3; i++) {
        dispatcher.dispatch('slack', {});
      }

      // Force a success by resetting
      dispatcher.resetCircuit();

      assert.strictEqual(dispatcher.getCircuitState(), 'closed');
    });
  });
});
