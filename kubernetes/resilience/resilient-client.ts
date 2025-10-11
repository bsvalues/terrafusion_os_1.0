// TerraFusion OS - AI Agent Resilience Policies (Node.js + TypeScript)
// Application-level resilience with timeout, retry, circuit breaker, and fallback
////////////////////////////////////////////////////////////////////////////////

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import CircuitBreaker from 'opossum';

/**
 * Resilient HTTP client configuration
 */
interface ResilientClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  circuitBreakerOptions?: CircuitBreaker.Options;
}

/**
 * Circuit breaker statistics
 */
interface CircuitBreakerStats {
  name: string;
  state: 'open' | 'half-open' | 'closed';
  failures: number;
  successes: number;
  rejects: number;
  timeouts: number;
  lastFailure?: Date;
}

/**
 * Resilient HTTP Client for TerraFusion AI Agent
 * Implements timeout, retry, circuit breaker, and fallback patterns
 */
export class ResilientHttpClient {
  private axiosInstance: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private config: ResilientClientConfig;
  private logger: Console;

  constructor(config: ResilientClientConfig) {
    this.config = config;
    this.logger = console;

    // Create Axios instance with base config
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'TerraFusion-AI-Agent',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (request) => {
        this.logger.log(`[HTTP] ${request.method?.toUpperCase()} ${request.url}`);
        return request;
      },
      (error) => {
        this.logger.error('[HTTP] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.log(`[HTTP] ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(`[HTTP] ${error.response?.status || 'ERR'} ${error.config?.url} - ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Create circuit breaker
    const breakerOptions: CircuitBreaker.Options = config.circuitBreakerOptions || {
      timeout: config.timeout,
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds
      rollingCountTimeout: 10000, // 10 second rolling window
      rollingCountBuckets: 10,
      name: config.baseURL,
    };

    this.circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), breakerOptions);

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      this.logger.error(`[CIRCUIT BREAKER] OPENED for ${config.baseURL} - too many failures!`);
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.warn(`[CIRCUIT BREAKER] HALF-OPEN for ${config.baseURL} - testing recovery...`);
    });

    this.circuitBreaker.on('close', () => {
      this.logger.log(`[CIRCUIT BREAKER] CLOSED for ${config.baseURL} - service recovered!`);
    });

    this.circuitBreaker.on('timeout', () => {
      this.logger.error(`[CIRCUIT BREAKER] TIMEOUT for ${config.baseURL}`);
    });

    this.circuitBreaker.on('reject', () => {
      this.logger.error(`[CIRCUIT BREAKER] REJECTED request to ${config.baseURL} - circuit is open!`);
    });

    this.circuitBreaker.fallback((error) => {
      return this.handleFallback(error);
    });
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(requestConfig: AxiosRequestConfig): Promise<any> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.axiosInstance.request(requestConfig);
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        // Log retry attempt
        if (attempt < this.config.retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn(
            `[RETRY] Attempt ${attempt}/${this.config.retries} failed for ${requestConfig.url}. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    this.logger.error(`[RETRY] All ${this.config.retries} attempts failed for ${requestConfig.url}`);
    throw lastError;
  }

  /**
   * Handle fallback when circuit breaker opens or all retries fail
   */
  private handleFallback(error: any): any {
    this.logger.warn(`[FALLBACK] Returning degraded response due to: ${error.message}`);

    // Return cached/degraded response based on error type
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return {
        status: 'degraded',
        message: 'Service timeout - using cached data',
        cached: true,
        timestamp: new Date().toISOString(),
      };
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        status: 'unavailable',
        message: 'Service unavailable - please retry later',
        retry_after: 30,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'error',
      message: 'Service error - degraded functionality',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET request with resilience
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.fire({
      method: 'GET',
      url,
      ...config,
    });
  }

  /**
   * POST request with resilience
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.fire({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request with resilience
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.fire({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request with resilience
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.fire({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    const stats = this.circuitBreaker.stats;
    return {
      name: this.circuitBreaker.name,
      state: this.circuitBreaker.opened
        ? 'open'
        : this.circuitBreaker.halfOpen
        ? 'half-open'
        : 'closed',
      failures: stats.failures,
      successes: stats.successes,
      rejects: stats.rejects,
      timeouts: stats.timeouts,
      lastFailure: stats.latencyTimes.length > 0 ? new Date() : undefined,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.circuitBreaker.close();
    this.logger.log(`[CIRCUIT BREAKER] Manually reset for ${this.config.baseURL}`);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Pre-configured resilient clients for TerraFusion services
 */
export class TerraFusionClients {
  static readonly PostgresClient = new ResilientHttpClient({
    baseURL: process.env.POSTGRES_API_URL || 'http://postgres:5432',
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second base delay
    circuitBreakerOptions: {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      name: 'PostgresClient',
    },
  });

  static readonly RedisClient = new ResilientHttpClient({
    baseURL: process.env.REDIS_API_URL || 'http://redis:6379',
    timeout: 5000, // 5 seconds
    retries: 2,
    retryDelay: 500, // 500ms base delay
    circuitBreakerOptions: {
      timeout: 5000,
      errorThresholdPercentage: 60,
      resetTimeout: 15000, // Faster recovery for cache
      name: 'RedisClient',
    },
  });

  static readonly BackendAPIClient = new ResilientHttpClient({
    baseURL: process.env.BACKEND_API_URL || 'http://backend-api:8080',
    timeout: 15000, // 15 seconds
    retries: 3,
    retryDelay: 1000,
    circuitBreakerOptions: {
      timeout: 15000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      name: 'BackendAPIClient',
    },
  });

  static readonly MCPClient = new ResilientHttpClient({
    baseURL: process.env.MCP_API_URL || 'http://mcp-servers:8090',
    timeout: 30000, // 30 seconds (MCP operations can be slow)
    retries: 2,
    retryDelay: 2000,
    circuitBreakerOptions: {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 60000, // Longer recovery time
      name: 'MCPClient',
    },
  });

  /**
   * Get all circuit breaker statistics
   */
  static getAllStats(): Record<string, CircuitBreakerStats> {
    return {
      postgres: this.PostgresClient.getStats(),
      redis: this.RedisClient.getStats(),
      backendApi: this.BackendAPIClient.getStats(),
      mcp: this.MCPClient.getStats(),
    };
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    this.PostgresClient.reset();
    this.RedisClient.reset();
    this.BackendAPIClient.reset();
    this.MCPClient.reset();
  }
}

/*
 * USAGE EXAMPLE:
 * 
 * import { TerraFusionClients } from './resilient-client';
 * 
 * async function fetchUserData(userId: string) {
 *   try {
 *     // Make resilient request with automatic retry, circuit breaker, and fallback
 *     const userData = await TerraFusionClients.BackendAPIClient.get(`/api/users/${userId}`);
 *     return userData;
 *   } catch (error) {
 *     console.error('Failed to fetch user data:', error);
 *     throw error;
 *   }
 * }
 * 
 * // Get circuit breaker statistics
 * const stats = TerraFusionClients.getAllStats();
 * console.log('Circuit Breaker Stats:', stats);
 * 
 * // Manually reset circuit breakers if needed
 * TerraFusionClients.resetAll();
 */

// Export for use in AI Agent
export default TerraFusionClients;
