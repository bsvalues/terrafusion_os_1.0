/**
 * Retry Utility
 *
 * Provides robust retry mechanisms for transient failures:
 * - Configurable retry policies with exponential backoff
 * - Support for custom retry predicates
 * - Jitter to prevent thundering herd problem
 * - Comprehensive logging and metrics
 * - Integration with circuit breaker
 */

import { logger } from '../../utils/logger';

// Retry configuration
export interface RetryConfig {
  name: string;
  maxRetries: number;
  initialDelay: number; // Initial delay in ms
  maxDelay?: number; // Maximum delay in ms
  backoffFactor: number; // Factor to multiply delay by after each retry
  jitter?: boolean; // Whether to add randomness to delay
  retryPredicate?: (error: Error, attempt: number) => boolean; // Function to determine if retry should be attempted
  onRetry?: (error: Error, attempt: number) => void; // Function to call before each retry
}

// Retry result
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number; // in ms
}

// Retry default configuration
const DEFAULT_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  retryPredicate: (error: Error) => {
    // Default: retry on network errors, rate limits, and server errors
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('server error') ||
      message.includes('503') ||
      message.includes('500')
    );
  },
};

/**
 * Execute an operation with retry logic
 * @param operation Function to retry
 * @param config Retry configuration
 * @returns Operation result with retry metadata
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  const startTime = Date.now();

  // Merge with default config
  const fullConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
    name: config.name || 'unnamed-operation',
  };

  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= fullConfig.maxRetries) {
    try {
      const result = await operation();

      const totalTime = Date.now() - startTime;

      // Log success (only if it wasn't the first attempt)
      if (attempt > 0) {
        logger.info(`Operation '${fullConfig.name}' succeeded after ${attempt} retries`, {
          component: 'RetryUtility',
          attempts: attempt + 1,
          totalTime,
        });
      }

      return {
        success: true,
        result,
        attempts: attempt + 1,
        totalTime,
      };
    } catch (error) {
      lastError = error as Error;

      // If this is the last attempt, break out of the loop
      if (attempt >= fullConfig.maxRetries) {
        break;
      }

      // Check retry predicate if provided
      const shouldRetry = fullConfig.retryPredicate
        ? fullConfig.retryPredicate(lastError, attempt)
        : true;

      if (!shouldRetry) {
        logger.info(`Not retrying operation '${fullConfig.name}' due to non-retryable error`, {
          component: 'RetryUtility',
          error: lastError.message,
          attempt: attempt + 1,
        });
        break;
      }

      // Calculate delay with exponential backoff
      let delay = fullConfig.initialDelay * Math.pow(fullConfig.backoffFactor, attempt);

      // Apply maximum delay if configured
      if (fullConfig.maxDelay !== undefined) {
        delay = Math.min(delay, fullConfig.maxDelay);
      }

      // Add jitter if configured
      if (fullConfig.jitter) {
        // Add random jitter between 0-30%
        const jitterFactor = 1 + Math.random() * 0.3;
        delay = Math.floor(delay * jitterFactor);
      }

      // Log retry
      logger.info(
        `Retrying operation '${fullConfig.name}' after error (attempt ${attempt + 1}/${fullConfig.maxRetries + 1})`,
        {
          component: 'RetryUtility',
          error: lastError.message,
          delay,
          attempt: attempt + 1,
        }
      );

      // Call onRetry callback if provided
      if (fullConfig.onRetry) {
        try {
          fullConfig.onRetry(lastError, attempt);
        } catch (callbackError) {
          logger.warn(`Error in onRetry callback for operation '${fullConfig.name}'`, {
            component: 'RetryUtility',
            error: callbackError,
          });
        }
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increment attempt counter
      attempt++;
    }
  }

  // If we get here, all retries failed
  const totalTime = Date.now() - startTime;

  logger.error(`Operation '${fullConfig.name}' failed after ${attempt} attempts`, {
    component: 'RetryUtility',
    error: lastError,
    attempts: attempt + 1,
    totalTime,
  });

  return {
    success: false,
    error: lastError,
    attempts: attempt + 1,
    totalTime,
  };
}

/**
 * Create a wrapped function that retries on failure
 * @param fn Function to wrap
 * @param config Retry configuration
 * @returns Wrapped function with retry logic
 */
export function createRetryFunction<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  config: Partial<RetryConfig>
): (...args: Args) => Promise<T> {
  return async function (...args: Args): Promise<T> {
    const operation = () => fn(...args);
    const result = await withRetry(operation, config);

    if (result.success && result.result !== undefined) {
      return result.result;
    } else {
      throw result.error || new Error(`Operation failed after ${result.attempts} attempts`);
    }
  };
}

/**
 * Create a retry decorator for class methods
 * @param config Retry configuration
 * @returns Method decorator
 */
export function retry(config: Partial<RetryConfig>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operation = () => originalMethod.apply(this, args);
      const result = await withRetry(operation, {
        ...config,
        name: config.name || `${target.constructor.name}.${propertyKey}`,
      });

      if (result.success && result.result !== undefined) {
        return result.result;
      } else {
        throw result.error || new Error(`Operation failed after ${result.attempts} attempts`);
      }
    };

    return descriptor;
  };
}
