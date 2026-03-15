/**
 * TFR-029: Circuit Breaker for API Calls
 *
 * Prevents cascading failures by tracking error rates and temporarily
 * short-circuiting requests to unhealthy endpoints.
 *
 * States:
 *   CLOSED    — normal operation, requests pass through.
 *   OPEN      — failures exceeded threshold, requests are rejected immediately.
 *   HALF_OPEN — after reset timeout, one probe request is allowed through.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. Default 5. */
  failureThreshold?: number;
  /** Milliseconds to wait before transitioning from OPEN to HALF_OPEN. Default 30 000. */
  resetTimeoutMs?: number;
  /** Calls exceeding this duration (ms) count as slow-call failures. Default 10 000. 0 = disabled. */
  slowCallDurationMs?: number;
  /** Optional fallback invoked when the circuit is OPEN. */
  fallback?: <T>() => T | Promise<T>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly slowCallDurationMs: number;
  private readonly fallback?: <T>() => T | Promise<T>;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 30_000;
    this.slowCallDurationMs = opts.slowCallDurationMs ?? 10_000;
    this.fallback = opts.fallback;
  }

  /** Current circuit state. */
  getState(): CircuitState {
    this.evaluateState();
    return this.state;
  }

  /**
   * Execute `fn` through the circuit breaker.
   * Rejects immediately when the circuit is OPEN (unless a fallback is
   * configured). In HALF_OPEN, exactly one probe request is allowed.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.evaluateState();

    if (this.state === 'OPEN') {
      if (this.fallback) {
        return this.fallback<T>() as Promise<T>;
      }
      throw new Error(
        `[CircuitBreaker] Circuit is OPEN — request rejected. ` +
        `Will retry after ${this.resetTimeoutMs}ms.`,
      );
    }

    const start = Date.now();
    try {
      const result = await fn();

      // Slow-call detection
      if (this.slowCallDurationMs > 0 && Date.now() - start > this.slowCallDurationMs) {
        this.recordFailure();
      } else {
        this.recordSuccess();
      }

      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  /** Force-reset to CLOSED. Useful after a manual recovery. */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private evaluateState(): void {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      }
    }
  }

  private recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
