/**
 * Runtime Configuration Contract Tests
 * ======================================
 *
 * Phase IIIo: Validates environment-aware configuration for ops plane.
 *
 * Contract:
 * - config_per_environment: Different settings per env (dev/staging/prod)
 * - config_dry_run_toggle: Dry-run mode configurable per environment
 * - config_channel_routing: Notification channels configurable per env
 * - config_breaker_thresholds: Circuit breaker tunable per environment
 * - config_validation_strict: Invalid config rejected at load time
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Runtime Configuration
// ============================================================================

/**
 * Environment identifier.
 */
type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Notification channel configuration.
 */
interface ChannelConfig {
  readonly enabled: boolean;
  readonly channel: string;
  readonly priority: 'low' | 'normal' | 'high';
  readonly rateLimitPerHour: number;
}

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
}

/**
 * Audit configuration.
 */
interface AuditConfig {
  readonly bufferSize: number;
  readonly flushIntervalMs: number;
  readonly integrityCheckIntervalMs: number;
}

/**
 * Dedupe configuration.
 */
interface DedupeConfig {
  readonly windowMs: number;
  readonly cleanupIntervalMs: number;
  readonly maxEntries: number;
}

/**
 * Complete ops-plane configuration.
 */
interface OpsPlaneConfig {
  readonly environment: Environment;
  readonly dryRun: boolean;
  readonly channels: {
    readonly slack: ChannelConfig;
    readonly email: ChannelConfig;
    readonly pagerduty: ChannelConfig;
  };
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly retry: RetryConfig;
  readonly audit: AuditConfig;
  readonly dedupe: DedupeConfig;
}

/**
 * Configuration validation result.
 */
interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// ============================================================================
// Constants - Default Configurations
// ============================================================================

const DEFAULT_CONFIGS: Record<Environment, OpsPlaneConfig> = {
  development: {
    environment: 'development',
    dryRun: true, // Always dry-run in dev
    channels: {
      slack: { enabled: true, channel: '#dev-alerts', priority: 'low', rateLimitPerHour: 100 },
      email: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 10 },
      pagerduty: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 5 },
    },
    circuitBreaker: { failureThreshold: 10, resetTimeoutMs: 10000, halfOpenRequests: 3 },
    retry: { maxRetries: 5, baseDelayMs: 100, maxDelayMs: 5000 },
    audit: { bufferSize: 1000, flushIntervalMs: 60000, integrityCheckIntervalMs: 300000 },
    dedupe: { windowMs: 300000, cleanupIntervalMs: 60000, maxEntries: 10000 },
  },
  staging: {
    environment: 'staging',
    dryRun: false,
    channels: {
      slack: {
        enabled: true,
        channel: '#staging-alerts',
        priority: 'normal',
        rateLimitPerHour: 50,
      },
      email: {
        enabled: true,
        channel: 'staging-oncall@example.com',
        priority: 'normal',
        rateLimitPerHour: 20,
      },
      pagerduty: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 5 },
    },
    circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30000, halfOpenRequests: 2 },
    retry: { maxRetries: 3, baseDelayMs: 200, maxDelayMs: 10000 },
    audit: { bufferSize: 500, flushIntervalMs: 30000, integrityCheckIntervalMs: 600000 },
    dedupe: { windowMs: 300000, cleanupIntervalMs: 60000, maxEntries: 5000 },
  },
  production: {
    environment: 'production',
    dryRun: false,
    channels: {
      slack: { enabled: true, channel: '#prod-slo-alerts', priority: 'high', rateLimitPerHour: 20 },
      email: {
        enabled: true,
        channel: 'prod-oncall@example.com',
        priority: 'high',
        rateLimitPerHour: 10,
      },
      pagerduty: {
        enabled: true,
        channel: 'prod-slo-service',
        priority: 'high',
        rateLimitPerHour: 5,
      },
    },
    circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30000, halfOpenRequests: 1 },
    retry: { maxRetries: 3, baseDelayMs: 500, maxDelayMs: 30000 },
    audit: { bufferSize: 100, flushIntervalMs: 10000, integrityCheckIntervalMs: 3600000 },
    dedupe: { windowMs: 300000, cleanupIntervalMs: 60000, maxEntries: 50000 },
  },
  test: {
    environment: 'test',
    dryRun: true,
    channels: {
      slack: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 1000 },
      email: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 1000 },
      pagerduty: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 1000 },
    },
    circuitBreaker: { failureThreshold: 100, resetTimeoutMs: 1000, halfOpenRequests: 10 },
    retry: { maxRetries: 1, baseDelayMs: 10, maxDelayMs: 100 },
    audit: { bufferSize: 10000, flushIntervalMs: 1000, integrityCheckIntervalMs: 10000 },
    dedupe: { windowMs: 60000, cleanupIntervalMs: 10000, maxEntries: 1000 },
  },
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Load configuration for environment.
 */
function loadConfig(env: Environment, overrides?: Partial<OpsPlaneConfig>): OpsPlaneConfig {
  const base = DEFAULT_CONFIGS[env];
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    channels: {
      ...base.channels,
      ...(overrides.channels ?? {}),
    },
    circuitBreaker: {
      ...base.circuitBreaker,
      ...(overrides.circuitBreaker ?? {}),
    },
    retry: {
      ...base.retry,
      ...(overrides.retry ?? {}),
    },
    audit: {
      ...base.audit,
      ...(overrides.audit ?? {}),
    },
    dedupe: {
      ...base.dedupe,
      ...(overrides.dedupe ?? {}),
    },
  };
}

/**
 * Validate configuration.
 */
function validateConfig(config: OpsPlaneConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Environment validation
  if (!['development', 'staging', 'production', 'test'].includes(config.environment)) {
    errors.push(`Invalid environment: ${config.environment}`);
  }

  // Production safety checks
  if (config.environment === 'production') {
    if (config.dryRun) {
      warnings.push('Production is in dry-run mode - no notifications will be sent');
    }
    if (!config.channels.pagerduty.enabled) {
      warnings.push('PagerDuty is disabled in production');
    }
  }

  // Circuit breaker validation
  if (config.circuitBreaker.failureThreshold < 1) {
    errors.push('Circuit breaker failureThreshold must be >= 1');
  }
  if (config.circuitBreaker.resetTimeoutMs < 1000) {
    errors.push('Circuit breaker resetTimeoutMs must be >= 1000');
  }

  // Retry validation
  if (config.retry.maxRetries < 0) {
    errors.push('Retry maxRetries must be >= 0');
  }
  if (config.retry.baseDelayMs < 10) {
    errors.push('Retry baseDelayMs must be >= 10');
  }
  if (config.retry.maxDelayMs < config.retry.baseDelayMs) {
    errors.push('Retry maxDelayMs must be >= baseDelayMs');
  }

  // Audit validation
  if (config.audit.bufferSize < 10) {
    errors.push('Audit bufferSize must be >= 10');
  }
  if (config.audit.flushIntervalMs < 1000) {
    errors.push('Audit flushIntervalMs must be >= 1000');
  }

  // Dedupe validation
  if (config.dedupe.windowMs < 60000) {
    errors.push('Dedupe windowMs must be >= 60000 (1 minute)');
  }
  if (config.dedupe.maxEntries < 100) {
    errors.push('Dedupe maxEntries must be >= 100');
  }

  // Channel validation
  for (const [name, channel] of Object.entries(config.channels)) {
    if (channel.enabled && !channel.channel) {
      errors.push(`Channel ${name} is enabled but has no target configured`);
    }
    if (channel.rateLimitPerHour < 1) {
      errors.push(`Channel ${name} rateLimitPerHour must be >= 1`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Get effective config value with environment variable override.
 */
function getEnvOverride<T>(key: string, defaultValue: T, parser: (val: string) => T): T {
  const envValue = process.env[key];
  if (envValue !== undefined) {
    try {
      return parser(envValue);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

/**
 * Check if dry-run should be forced.
 */
function shouldForceDryRun(env: Environment): boolean {
  return env === 'development' || env === 'test';
}

// ============================================================================
// Contract: config_per_environment
// ============================================================================

describe('Runtime Configuration Contract', () => {
  describe('config_per_environment', () => {
    it('should load correct defaults for development', () => {
      const config = loadConfig('development');
      assert.strictEqual(config.environment, 'development');
      assert.strictEqual(config.dryRun, true);
      assert.strictEqual(config.channels.slack.channel, '#dev-alerts');
    });

    it('should load correct defaults for staging', () => {
      const config = loadConfig('staging');
      assert.strictEqual(config.environment, 'staging');
      assert.strictEqual(config.dryRun, false);
      assert.strictEqual(config.channels.slack.channel, '#staging-alerts');
    });

    it('should load correct defaults for production', () => {
      const config = loadConfig('production');
      assert.strictEqual(config.environment, 'production');
      assert.strictEqual(config.dryRun, false);
      assert.ok(config.channels.pagerduty.enabled);
    });

    it('should load correct defaults for test', () => {
      const config = loadConfig('test');
      assert.strictEqual(config.environment, 'test');
      assert.strictEqual(config.dryRun, true);
      assert.ok(!config.channels.slack.enabled);
    });

    it('should have stricter rate limits in production', () => {
      const dev = loadConfig('development');
      const prod = loadConfig('production');

      assert.ok(
        prod.channels.slack.rateLimitPerHour < dev.channels.slack.rateLimitPerHour,
        'Prod should have stricter rate limits'
      );
    });
  });

  // ============================================================================
  // Contract: config_dry_run_toggle
  // ============================================================================

  describe('config_dry_run_toggle', () => {
    it('should force dry-run in development', () => {
      assert.ok(shouldForceDryRun('development'));
    });

    it('should force dry-run in test', () => {
      assert.ok(shouldForceDryRun('test'));
    });

    it('should not force dry-run in staging', () => {
      assert.ok(!shouldForceDryRun('staging'));
    });

    it('should not force dry-run in production', () => {
      assert.ok(!shouldForceDryRun('production'));
    });

    it('should warn when production is in dry-run', () => {
      const config = loadConfig('production', { dryRun: true });
      const result = validateConfig(config);

      assert.ok(result.warnings.some(w => w.includes('dry-run')));
    });
  });

  // ============================================================================
  // Contract: config_channel_routing
  // ============================================================================

  describe('config_channel_routing', () => {
    it('should enable slack in all non-test environments', () => {
      assert.ok(loadConfig('development').channels.slack.enabled);
      assert.ok(loadConfig('staging').channels.slack.enabled);
      assert.ok(loadConfig('production').channels.slack.enabled);
      assert.ok(!loadConfig('test').channels.slack.enabled);
    });

    it('should enable pagerduty only in production', () => {
      assert.ok(!loadConfig('development').channels.pagerduty.enabled);
      assert.ok(!loadConfig('staging').channels.pagerduty.enabled);
      assert.ok(loadConfig('production').channels.pagerduty.enabled);
    });

    it('should set high priority channels in production', () => {
      const prod = loadConfig('production');
      assert.strictEqual(prod.channels.slack.priority, 'high');
      assert.strictEqual(prod.channels.email.priority, 'high');
      assert.strictEqual(prod.channels.pagerduty.priority, 'high');
    });

    it('should allow channel override via config', () => {
      const config = loadConfig('staging', {
        channels: {
          slack: {
            enabled: true,
            channel: '#custom-alerts',
            priority: 'high',
            rateLimitPerHour: 30,
          },
          email: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 10 },
          pagerduty: { enabled: false, channel: '', priority: 'low', rateLimitPerHour: 5 },
        },
      });

      assert.strictEqual(config.channels.slack.channel, '#custom-alerts');
    });
  });

  // ============================================================================
  // Contract: config_breaker_thresholds
  // ============================================================================

  describe('config_breaker_thresholds', () => {
    it('should have higher breaker threshold in dev', () => {
      const dev = loadConfig('development');
      const prod = loadConfig('production');

      assert.ok(dev.circuitBreaker.failureThreshold >= prod.circuitBreaker.failureThreshold);
    });

    it('should have shorter reset timeout in dev', () => {
      const dev = loadConfig('development');
      const prod = loadConfig('production');

      assert.ok(dev.circuitBreaker.resetTimeoutMs <= prod.circuitBreaker.resetTimeoutMs);
    });

    it('should validate breaker threshold minimum', () => {
      const config = loadConfig('production', {
        circuitBreaker: { failureThreshold: 0, resetTimeoutMs: 30000, halfOpenRequests: 1 },
      });
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('failureThreshold')));
    });

    it('should validate reset timeout minimum', () => {
      const config = loadConfig('production', {
        circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 100, halfOpenRequests: 1 },
      });
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('resetTimeoutMs')));
    });
  });

  // ============================================================================
  // Contract: config_validation_strict
  // ============================================================================

  describe('config_validation_strict', () => {
    it('should validate retry configuration', () => {
      const config = loadConfig('production', {
        retry: { maxRetries: -1, baseDelayMs: 500, maxDelayMs: 30000 },
      });
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('maxRetries')));
    });

    it('should validate maxDelay >= baseDelay', () => {
      const config = loadConfig('production', {
        retry: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 500 },
      });
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('maxDelayMs')));
    });

    it('should validate audit buffer size', () => {
      const config = loadConfig('production', {
        audit: { bufferSize: 5, flushIntervalMs: 10000, integrityCheckIntervalMs: 3600000 },
      });
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('bufferSize')));
    });

    it('should validate dedupe window minimum', () => {
      const config = loadConfig('production', {
        dedupe: { windowMs: 10000, cleanupIntervalMs: 60000, maxEntries: 50000 },
      });
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('windowMs')));
    });

    it('should validate enabled channels have targets', () => {
      const config: OpsPlaneConfig = {
        ...loadConfig('production'),
        channels: {
          slack: { enabled: true, channel: '', priority: 'high', rateLimitPerHour: 20 },
          email: { enabled: false, channel: '', priority: 'high', rateLimitPerHour: 10 },
          pagerduty: { enabled: false, channel: '', priority: 'high', rateLimitPerHour: 5 },
        },
      };
      const result = validateConfig(config);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('slack') && e.includes('target')));
    });

    it('should pass validation for default configs', () => {
      for (const env of ['development', 'staging', 'production', 'test'] as Environment[]) {
        const config = loadConfig(env);
        const result = validateConfig(config);
        assert.ok(result.valid, `${env} config should be valid: ${result.errors.join(', ')}`);
      }
    });
  });
});
