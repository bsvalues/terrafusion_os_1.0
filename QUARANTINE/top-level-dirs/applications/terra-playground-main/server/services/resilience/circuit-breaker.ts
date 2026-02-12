/**
 * Circuit Breaker Service
 *
 * Implements the circuit breaker pattern to prevent cascading failures:
 * - Automatic detection of service failures
 * - Graceful degradation to prevent system overload
 * - Self-recovery through periodic testing
 * - Configurable thresholds, timeouts, and failure conditions
 * - Comprehensive metrics and diagnostics
 */

import { logger } from '../../utils/logger';

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'closed', // Normal operation - requests pass through
  OPEN = 'open', // Failure threshold exceeded - requests fail fast
  HALF_OPEN = 'half-open', // Recovery testing - limited requests allowed
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before testing recovery
  halfOpenSuccessThreshold: number; // Successes needed to close circuit
  timeout?: number; // Operation timeout in ms
  monitorInterval?: number; // Health check interval
  excludeErrorTypes?: string[]; // Error types to ignore
}

// Circuit breaker metrics
export interface CircuitMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  timeoutCalls: number;
  rejectedCalls: number; // Calls rejected due to open circuit
  lastFailureTime?: Date;
  lastFailureReason?: string;
  lastStatusChangeTime?: Date;
  averageResponseTime: number;
}

// Circuit breaker usage example:
//
// const apiCircuitBreaker = new CircuitBreaker({
//   name: 'external-api',
//   failureThreshold: 5,
//   resetTimeout: 30000,
//   halfOpenSuccessThreshold: 2,
//   timeout: 2000
// });
//
// try {
//   const result = await apiCircuitBreaker.execute(async () => {
//     const response = await fetch('https://api.example.com/data');
//     const data = await response.json();
//     return data;
//   });
//   // Use result
// } catch (error) {
//   // Handle error (circuit open or operation failed)
// }

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successesInHalfOpen: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private monitorTimer: NodeJS.Timeout | null = null;
  private metrics: CircuitMetrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    timeoutCalls: 0,
    rejectedCalls: 0,
    averageResponseTime: 0,
  };

  /**
   * Create a new Circuit Breaker
   * @param config Circuit breaker configuration
   */
  constructor(private config: CircuitBreakerConfig) {
    // Start monitoring if interval is set
    if (config.monitorInterval) {
      this.startMonitoring();
    }

    logger.info(`Circuit breaker initialized: ${config.name}`, {
      component: 'CircuitBreaker',
      state: this.state,
      failureThreshold: config.failureThreshold,
      resetTimeout: config.resetTimeout,
    });
  }

  /**
   * Execute an operation with circuit breaker protection
   * @param operation Function to execute
   * @returns Operation result
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      this.metrics.rejectedCalls++;
      const error = new Error(`Circuit breaker '${this.config.name}' is open`);
      error.name = 'CircuitOpenError';
      throw error;
    }

    // Track metrics
    this.metrics.totalCalls++;

    const startTime = Date.now();

    try {
      // Execute operation (with timeout if configured)
      const result = await this.executeWithTimeout(operation);

      // Update response time metric
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeMetric(responseTime);

      // Update success metrics
      this.metrics.successfulCalls++;

      // Handle success based on circuit state
      if (this.state === CircuitState.HALF_OPEN) {
        this.successesInHalfOpen++;

        if (this.successesInHalfOpen >= this.config.halfOpenSuccessThreshold) {
          this.closeCircuit();
        }
      }

      return result;
    } catch (error) {
      // Update response time metric
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeMetric(responseTime);

      // Check if error should be counted as failure
      if (this.shouldCountError(error as Error)) {
        // Update failure metrics
        this.metrics.failedCalls++;

        // Check if it's a timeout
        if ((error as Error).name === 'TimeoutError') {
          this.metrics.timeoutCalls++;
        }

        // Record failure details
        this.metrics.lastFailureTime = new Date();
        this.metrics.lastFailureReason = (error as Error).message;

        // Handle failure based on circuit state
        if (this.state === CircuitState.CLOSED) {
          this.failures++;

          if (this.failures >= this.config.failureThreshold) {
            this.openCircuit();
          }
        } else if (this.state === CircuitState.HALF_OPEN) {
          this.openCircuit();
        }
      }

      // Rethrow the error
      throw error;
    }
  }

  /**
   * Execute an operation with timeout
   * @param operation Function to execute
   * @returns Operation result
   */
  private executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.timeout) {
      return operation();
    }

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const error = new Error(`Operation timed out after ${this.config.timeout}ms`);
        error.name = 'TimeoutError';
        reject(error);
      }, this.config.timeout);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Check if error should be counted as failure
   * @param error Error to check
   * @returns True if error should be counted
   */
  private shouldCountError(error: Error): boolean {
    // If no excluded error types, count all errors
    if (!this.config.excludeErrorTypes || this.config.excludeErrorTypes.length === 0) {
      return true;
    }

    // Check if error type is excluded
    return !this.config.excludeErrorTypes.includes(error.name);
  }

  /**
   * Update response time metric
   * @param responseTime Response time in ms
   */
  private updateResponseTimeMetric(responseTime: number): void {
    // Calculate new average using moving average formula
    const alpha = 0.1; // Smoothing factor (0.1 = more recent values have higher weight)
    this.metrics.averageResponseTime =
      (1 - alpha) * this.metrics.averageResponseTime + alpha * responseTime;
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    // Only log if state is changing
    if (this.state !== CircuitState.OPEN) {
      logger.warn(`Circuit breaker opened: ${this.config.name}`, {
        component: 'CircuitBreaker',
        failures: this.failures,
        threshold: this.config.failureThreshold,
        resetTimeout: this.config.resetTimeout,
      });
    }

    // Update state
    this.state = CircuitState.OPEN;
    this.metrics.lastStatusChangeTime = new Date();

    // Clear existing timer if any
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    // Set timer to transition to half-open state
    this.resetTimer = setTimeout(() => {
      this.resetTimer = null;
      this.transitionToHalfOpen();
    }, this.config.resetTimeout);
  }

  /**
   * Close the circuit
   */
  private closeCircuit(): void {
    // Only log if state is changing
    if (this.state !== CircuitState.CLOSED) {
      logger.info(`Circuit breaker closed: ${this.config.name}`, {
        component: 'CircuitBreaker',
        successesInHalfOpen: this.successesInHalfOpen,
        threshold: this.config.halfOpenSuccessThreshold,
      });
    }

    // Update state
    this.state = CircuitState.CLOSED;
    this.metrics.lastStatusChangeTime = new Date();
    this.failures = 0;
    this.successesInHalfOpen = 0;

    // Clear reset timer if any
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Transition to half-open state
   */
  private transitionToHalfOpen(): void {
    // Only log if state is changing
    if (this.state !== CircuitState.HALF_OPEN) {
      logger.info(`Circuit breaker half-open: ${this.config.name}`, {
        component: 'CircuitBreaker',
        successThreshold: this.config.halfOpenSuccessThreshold,
      });
    }

    // Update state
    this.state = CircuitState.HALF_OPEN;
    this.metrics.lastStatusChangeTime = new Date();
    this.successesInHalfOpen = 0;
  }

  /**
   * Start monitoring the circuit breaker
   */
  private startMonitoring(): void {
    // Clear existing timer if any
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }

    // Set timer to log circuit status periodically
    this.monitorTimer = setInterval(() => {
      logger.debug(`Circuit breaker status: ${this.config.name}`, {
        component: 'CircuitBreaker',
        state: this.state,
        metrics: {
          totalCalls: this.metrics.totalCalls,
          successfulCalls: this.metrics.successfulCalls,
          failedCalls: this.metrics.failedCalls,
          timeoutCalls: this.metrics.timeoutCalls,
          rejectedCalls: this.metrics.rejectedCalls,
          averageResponseTime: Math.round(this.metrics.averageResponseTime * 100) / 100,
        },
      });
    }, this.config.monitorInterval);
  }

  /**
   * Stop monitoring the circuit breaker
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Get circuit breaker state
   * @returns Circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   * @returns Circuit metrics
   */
  getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }

  /**
   * Manually force circuit to open state
   */
  forceOpen(): void {
    this.openCircuit();
  }

  /**
   * Manually force circuit to closed state
   */
  forceClosed(): void {
    this.closeCircuit();
  }

  /**
   * Manually force circuit to half-open state
   */
  forceHalfOpen(): void {
    this.transitionToHalfOpen();
  }

  /**
   * Reset circuit breaker (clear all metrics)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successesInHalfOpen = 0;

    // Reset metrics
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      timeoutCalls: 0,
      rejectedCalls: 0,
      averageResponseTime: 0,
    };

    // Clear timers
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }

    logger.info(`Circuit breaker reset: ${this.config.name}`, {
      component: 'CircuitBreaker',
    });
  }

  /**
   * Dispose of circuit breaker resources
   */
  dispose(): void {
    // Clear timers
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }

    logger.info(`Circuit breaker disposed: ${this.config.name}`, {
      component: 'CircuitBreaker',
    });
  }
}
