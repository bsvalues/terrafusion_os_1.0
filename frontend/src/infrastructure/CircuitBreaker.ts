/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by monitoring service health
 * and temporarily blocking requests to failing services
 * 
 * @author TerraFusion Engineering Team
 * @version 1.0.0 - Enterprise Grade
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing recovery
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening
  recoveryTimeout: number;       // Time in ms before attempting recovery
  monitoringPeriod: number;      // Time window for failure counting
  halfOpenMaxCalls: number;      // Max calls allowed in half-open state
  expectedErrorRate: number;     // Expected error rate (0-1)
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttempt: number | null;
  errorRate: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState,
    public readonly stats: CircuitBreakerStats
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttempt: number | null = null;
  private halfOpenCalls = 0;
  
  private readonly options: CircuitBreakerOptions;
  
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 120000, // 2 minutes
      halfOpenMaxCalls: 3,
      expectedErrorRate: 0.1, // 10%
      ...options
    };
    
    console.log('🔧 Circuit Breaker initialized with options:', this.options);
  }
  
  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    const operationId = context || `op-${Date.now()}`;
    
    // Check if circuit allows execution
    if (!this.canExecute()) {
      const error = new CircuitBreakerError(
        `Circuit breaker is ${this.state} - blocking execution`,
        this.state,
        this.getStats()
      );
      
      console.warn(`🚫 Circuit breaker blocked execution: ${operationId}`, {
        state: this.state,
        nextAttempt: this.nextAttempt
      });
      
      throw error;
    }
    
    // Track request
    this.requests++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
    }
    
    const startTime = Date.now();
    
    try {
      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise<T>(30000) // 30 second timeout
      ]);
      
      // Record success
      this.onSuccess(operationId, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      // Record failure
      this.onFailure(operationId, error, Date.now() - startTime);
      
      throw error;
    }
  }
  
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }
  
  private canExecute(): boolean {
    const now = Date.now();
    
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
        
      case CircuitState.OPEN:
        // Check if recovery timeout has elapsed
        if (this.nextAttempt && now >= this.nextAttempt) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;
        
      case CircuitState.HALF_OPEN:
        // Allow limited calls to test recovery
        return this.halfOpenCalls < this.options.halfOpenMaxCalls;
        
      default:
        return false;
    }
  }
  
  private onSuccess(operationId: string, duration: number): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    
    console.log(`✅ Circuit breaker success: ${operationId} (${duration}ms)`);
    
    if (this.state === CircuitState.HALF_OPEN) {
      // If we've had enough successful calls in half-open, close the circuit
      if (this.successes >= this.options.halfOpenMaxCalls / 2) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.resetFailureCount();
    }
    
    // Clean up old metrics
    this.cleanupOldMetrics();
  }
  
  private onFailure(operationId: string, error: any, duration: number): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    console.warn(`❌ Circuit breaker failure: ${operationId} (${duration}ms)`, error);
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.transitionToOpen();
      }
    }
    
    // Clean up old metrics
    this.cleanupOldMetrics();
  }
  
  private shouldOpenCircuit(): boolean {
    // Need minimum number of requests to make a decision
    if (this.requests < this.options.failureThreshold) {
      return false;
    }
    
    // Calculate current error rate
    const errorRate = this.failures / this.requests;
    
    // Open if failure threshold exceeded or error rate too high
    return this.failures >= this.options.failureThreshold || 
           errorRate > this.options.expectedErrorRate * 2;
  }
  
  private transitionToClosed(): void {
    console.log('🟢 Circuit breaker: CLOSED (normal operation)');
    
    this.state = CircuitState.CLOSED;
    this.halfOpenCalls = 0;
    this.nextAttempt = null;
    
    // Keep some history but reset counters
    this.failures = Math.max(0, this.failures - this.options.failureThreshold);
    this.requests = Math.max(this.failures + this.successes, 1);
  }
  
  private transitionToOpen(): void {
    const recoveryTime = Date.now() + this.options.recoveryTimeout;
    
    console.log(`🔴 Circuit breaker: OPEN (blocking requests until ${new Date(recoveryTime).toISOString()})`);
    
    this.state = CircuitState.OPEN;
    this.nextAttempt = recoveryTime;
    this.halfOpenCalls = 0;
  }
  
  private transitionToHalfOpen(): void {
    console.log('🟡 Circuit breaker: HALF-OPEN (testing recovery)');
    
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCalls = 0;
    this.nextAttempt = null;
  }
  
  private resetFailureCount(): void {
    // Gradually reduce failure count on success
    if (this.failures > 0) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }
  
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    
    // This is a simplified cleanup - in production, you'd want
    // to track individual request timestamps for more accurate cleanup
    if (this.lastFailureTime && this.lastFailureTime < cutoff) {
      this.failures = Math.max(0, this.failures - 1);
    }
    
    if (this.lastSuccessTime && this.lastSuccessTime < cutoff) {
      this.successes = Math.max(0, this.successes - 1);
    }
    
    // Ensure we maintain minimum request count
    this.requests = Math.max(this.failures + this.successes, 1);
  }
  
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttempt: this.nextAttempt,
      errorRate: this.requests > 0 ? this.failures / this.requests : 0
    };
  }
  
  public forceOpen(): void {
    console.log('🔴 Circuit breaker: FORCE OPEN');
    this.transitionToOpen();
  }
  
  public forceClosed(): void {
    console.log('🟢 Circuit breaker: FORCE CLOSED');
    this.transitionToClosed();
  }
  
  public reset(): void {
    console.log('🔄 Circuit breaker: RESET');
    
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttempt = null;
    this.halfOpenCalls = 0;
  }
}
