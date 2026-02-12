/**
 * Rate Limiter Service
 *
 * Provides configurable rate limiting for API calls and resource access:
 * - Token bucket algorithm for smooth rate control
 * - Different limiting strategies (fixed window, sliding window)
 * - Per-endpoint and global rate limits
 * - Automatic recovery and token replenishment
 * - Detailed metrics for monitoring
 */

import { logger } from '../../utils/logger';

// Rate limiter types
export enum RateLimiterType {
  TOKEN_BUCKET = 'token_bucket',
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
}

// Rate limiter configuration
export interface RateLimiterConfig {
  name: string;
  type: RateLimiterType;
  capacity: number; // Maximum number of tokens
  refillRate: number; // Tokens per second
  windowSizeMs?: number; // For fixed/sliding window
  fairness?: boolean; // Distribute remaining tokens fairly
  delayExecution?: boolean; // Wait for tokens instead of rejecting
  maxWaitMs?: number; // Maximum wait time in ms
}

// Rate limiter metrics
export interface RateLimiterMetrics {
  name: string;
  type: RateLimiterType;
  capacity: number;
  availableTokens: number;
  totalRequests: number;
  allowedRequests: number;
  limitedRequests: number;
  delayedRequests: number;
  totalDelayMs: number;
  avgDelayMs: number;
  lastRefillTime: Date;
}

/**
 * Token Bucket Rate Limiter implementation
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillTime: Date;
  private metrics: Omit<RateLimiterMetrics, 'type' | 'capacity' | 'name'>;

  /**
   * Create a new Token Bucket Rate Limiter
   * @param config Rate limiter configuration
   */
  constructor(private config: RateLimiterConfig) {
    this.tokens = config.capacity;
    this.lastRefillTime = new Date();

    this.metrics = {
      availableTokens: this.tokens,
      totalRequests: 0,
      allowedRequests: 0,
      limitedRequests: 0,
      delayedRequests: 0,
      totalDelayMs: 0,
      avgDelayMs: 0,
      lastRefillTime: this.lastRefillTime,
    };

    logger.info(`Token Bucket Rate Limiter initialized: ${config.name}`, {
      component: 'RateLimiter',
      capacity: config.capacity,
      refillRate: config.refillRate,
    });
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = new Date();
    const elapsedMs = now.getTime() - this.lastRefillTime.getTime();

    if (elapsedMs > 0) {
      // Calculate tokens to add based on refill rate
      const tokensToAdd = (elapsedMs / 1000) * this.config.refillRate;

      // Add tokens (never exceed capacity)
      this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);

      // Update last refill time
      this.lastRefillTime = now;
      this.metrics.lastRefillTime = now;
      this.metrics.availableTokens = this.tokens;
    }
  }

  /**
   * Try to consume tokens
   * @param count Number of tokens to consume
   * @param waitForTokens Whether to wait for tokens to become available
   * @returns Object indicating if tokens were consumed and delay if any
   */
  async tryConsume(
    count: number = 1,
    waitForTokens: boolean = false
  ): Promise<{
    allowed: boolean;
    delayMs: number;
    remainingTokens: number;
  }> {
    // Update metrics
    this.metrics.totalRequests++;

    // Refill tokens first
    this.refillTokens();

    // Check if enough tokens are available
    if (this.tokens >= count) {
      // Consume tokens
      this.tokens -= count;
      this.metrics.availableTokens = this.tokens;
      this.metrics.allowedRequests++;

      return {
        allowed: true,
        delayMs: 0,
        remainingTokens: this.tokens,
      };
    } else if (waitForTokens && this.config.delayExecution) {
      // Calculate how long to wait for enough tokens
      const tokensNeeded = count - this.tokens;
      const waitTimeMs = (tokensNeeded / this.config.refillRate) * 1000;

      // Check if wait time exceeds maximum
      if (this.config.maxWaitMs !== undefined && waitTimeMs > this.config.maxWaitMs) {
        this.metrics.limitedRequests++;

        return {
          allowed: false,
          delayMs: 0,
          remainingTokens: this.tokens,
        };
      }

      // Wait for tokens
      this.metrics.delayedRequests++;
      this.metrics.totalDelayMs += waitTimeMs;
      this.metrics.avgDelayMs = this.metrics.totalDelayMs / this.metrics.delayedRequests;

      // Delay execution
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));

      // Consume all available tokens (which should be enough after waiting)
      this.refillTokens(); // Refill again after waiting
      this.tokens -= count;
      this.metrics.availableTokens = this.tokens;
      this.metrics.allowedRequests++;

      return {
        allowed: true,
        delayMs: waitTimeMs,
        remainingTokens: this.tokens,
      };
    } else {
      // Not enough tokens and not waiting
      this.metrics.limitedRequests++;

      return {
        allowed: false,
        delayMs: 0,
        remainingTokens: this.tokens,
      };
    }
  }

  /**
   * Get rate limiter metrics
   * @returns Rate limiter metrics
   */
  getMetrics(): RateLimiterMetrics {
    return {
      name: this.config.name,
      type: this.config.type,
      capacity: this.config.capacity,
      ...this.metrics,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.config.capacity;
    this.lastRefillTime = new Date();

    this.metrics = {
      availableTokens: this.tokens,
      totalRequests: 0,
      allowedRequests: 0,
      limitedRequests: 0,
      delayedRequests: 0,
      totalDelayMs: 0,
      avgDelayMs: 0,
      lastRefillTime: this.lastRefillTime,
    };

    logger.info(`Rate limiter reset: ${this.config.name}`, {
      component: 'RateLimiter',
    });
  }
}

/**
 * Fixed Window Rate Limiter implementation
 */
export class FixedWindowRateLimiter {
  private windowStartTime: Date;
  private requestsInWindow: number = 0;
  private metrics: Omit<RateLimiterMetrics, 'type' | 'capacity' | 'name'>;

  /**
   * Create a new Fixed Window Rate Limiter
   * @param config Rate limiter configuration
   */
  constructor(private config: RateLimiterConfig) {
    if (!config.windowSizeMs) {
      config.windowSizeMs = 1000; // Default to 1 second
    }

    this.windowStartTime = new Date();

    this.metrics = {
      availableTokens: config.capacity,
      totalRequests: 0,
      allowedRequests: 0,
      limitedRequests: 0,
      delayedRequests: 0,
      totalDelayMs: 0,
      avgDelayMs: 0,
      lastRefillTime: this.windowStartTime,
    };

    logger.info(`Fixed Window Rate Limiter initialized: ${config.name}`, {
      component: 'RateLimiter',
      capacity: config.capacity,
      windowSizeMs: config.windowSizeMs,
    });
  }

  /**
   * Check if current window has expired and reset if needed
   */
  private checkAndResetWindow(): void {
    const now = new Date();
    const elapsedMs = now.getTime() - this.windowStartTime.getTime();

    if (elapsedMs >= this.config.windowSizeMs!) {
      // Start a new window
      this.windowStartTime = now;
      this.requestsInWindow = 0;
      this.metrics.lastRefillTime = now;
      this.metrics.availableTokens = this.config.capacity;
    }
  }

  /**
   * Try to consume a request slot
   * @param count Number of slots to consume
   * @param waitForNextWindow Whether to wait for the next window
   * @returns Object indicating if request was allowed and delay if any
   */
  async tryConsume(
    count: number = 1,
    waitForNextWindow: boolean = false
  ): Promise<{
    allowed: boolean;
    delayMs: number;
    remainingTokens: number;
  }> {
    // Update metrics
    this.metrics.totalRequests++;

    // Check and reset window if needed
    this.checkAndResetWindow();

    // Calculate available slots
    const availableSlots = this.config.capacity - this.requestsInWindow;

    // Check if enough slots are available
    if (availableSlots >= count) {
      // Consume slots
      this.requestsInWindow += count;
      this.metrics.availableTokens = this.config.capacity - this.requestsInWindow;
      this.metrics.allowedRequests++;

      return {
        allowed: true,
        delayMs: 0,
        remainingTokens: this.metrics.availableTokens,
      };
    } else if (waitForNextWindow && this.config.delayExecution) {
      // Calculate time until next window
      const now = new Date();
      const elapsedMs = now.getTime() - this.windowStartTime.getTime();
      const waitTimeMs = this.config.windowSizeMs! - elapsedMs;

      // Check if wait time exceeds maximum
      if (this.config.maxWaitMs !== undefined && waitTimeMs > this.config.maxWaitMs) {
        this.metrics.limitedRequests++;

        return {
          allowed: false,
          delayMs: 0,
          remainingTokens: this.metrics.availableTokens,
        };
      }

      // Wait for next window
      this.metrics.delayedRequests++;
      this.metrics.totalDelayMs += waitTimeMs;
      this.metrics.avgDelayMs = this.metrics.totalDelayMs / this.metrics.delayedRequests;

      // Delay execution
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));

      // Start a new window
      this.windowStartTime = new Date();
      this.requestsInWindow = count;
      this.metrics.lastRefillTime = this.windowStartTime;
      this.metrics.availableTokens = this.config.capacity - count;
      this.metrics.allowedRequests++;

      return {
        allowed: true,
        delayMs: waitTimeMs,
        remainingTokens: this.metrics.availableTokens,
      };
    } else {
      // Not enough slots and not waiting
      this.metrics.limitedRequests++;

      return {
        allowed: false,
        delayMs: 0,
        remainingTokens: this.metrics.availableTokens,
      };
    }
  }

  /**
   * Get rate limiter metrics
   * @returns Rate limiter metrics
   */
  getMetrics(): RateLimiterMetrics {
    return {
      name: this.config.name,
      type: this.config.type,
      capacity: this.config.capacity,
      ...this.metrics,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.windowStartTime = new Date();
    this.requestsInWindow = 0;

    this.metrics = {
      availableTokens: this.config.capacity,
      totalRequests: 0,
      allowedRequests: 0,
      limitedRequests: 0,
      delayedRequests: 0,
      totalDelayMs: 0,
      avgDelayMs: 0,
      lastRefillTime: this.windowStartTime,
    };

    logger.info(`Rate limiter reset: ${this.config.name}`, {
      component: 'RateLimiter',
    });
  }
}

/**
 * Factory function to create a rate limiter based on config type
 * @param config Rate limiter configuration
 * @returns Rate limiter instance
 */
export function createRateLimiter(
  config: RateLimiterConfig
): TokenBucketRateLimiter | FixedWindowRateLimiter {
  switch (config.type) {
    case RateLimiterType.TOKEN_BUCKET:
      return new TokenBucketRateLimiter(config);

    case RateLimiterType.FIXED_WINDOW:
      return new FixedWindowRateLimiter(config);

    case RateLimiterType.SLIDING_WINDOW:
      // For simplicity, we'll use token bucket for sliding window
      // In a real implementation, this would be a proper sliding window implementation
      logger.warn(
        `Sliding window rate limiter not fully implemented, using token bucket instead: ${config.name}`,
        {
          component: 'RateLimiter',
        }
      );
      return new TokenBucketRateLimiter(config);

    default:
      logger.warn(
        `Unknown rate limiter type: ${config.type}, using token bucket instead: ${config.name}`,
        {
          component: 'RateLimiter',
        }
      );
      return new TokenBucketRateLimiter({
        ...config,
        type: RateLimiterType.TOKEN_BUCKET,
      });
  }
}

/**
 * Rate limiter registry to manage multiple rate limiters
 */
export class RateLimiterRegistry {
  private limiters: Map<string, TokenBucketRateLimiter | FixedWindowRateLimiter> = new Map();

  /**
   * Register a rate limiter
   * @param config Rate limiter configuration
   * @returns Rate limiter instance
   */
  register(config: RateLimiterConfig): TokenBucketRateLimiter | FixedWindowRateLimiter {
    const limiter = createRateLimiter(config);
    this.limiters.set(config.name, limiter);
    return limiter;
  }

  /**
   * Get a rate limiter by name
   * @param name Rate limiter name
   * @returns Rate limiter instance or undefined if not found
   */
  get(name: string): TokenBucketRateLimiter | FixedWindowRateLimiter | undefined {
    return this.limiters.get(name);
  }

  /**
   * Remove a rate limiter
   * @param name Rate limiter name
   */
  remove(name: string): void {
    this.limiters.delete(name);
  }

  /**
   * Get all rate limiter metrics
   * @returns Array of rate limiter metrics
   */
  getAllMetrics(): RateLimiterMetrics[] {
    return Array.from(this.limiters.values()).map(limiter => limiter.getMetrics());
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }
}
