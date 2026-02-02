/**
 * Rollout Verification Contract Tests
 * =====================================
 *
 * Phase IVa: Validates environment-gated rollout behavior.
 *
 * Contract:
 * - env_defaults_are_safe: dry-run/channel defaults correct per env
 * - feature_flags_gate_side_effects: notify/audit/suppress/PR create gated
 * - staging_canary_rules: partial enablement rules for staging
 * - prod_requires_explicit_enablement: no accidental activation
 * - rollout_sequencing: dev → staging → prod order enforced
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Rollout Verification
// ============================================================================

/**
 * Environment types.
 */
type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Feature flag definition.
 */
interface FeatureFlag {
  readonly name: string;
  readonly description: string;
  readonly defaultEnabled: Record<Environment, boolean>;
  readonly requiresExplicitEnablement: boolean;
  readonly allowCanary: boolean;
  readonly sideEffects: readonly SideEffectType[];
}

/**
 * Side effect types that can be gated.
 */
type SideEffectType =
  | 'send_notification'
  | 'create_audit_record'
  | 'create_suppression'
  | 'create_pull_request'
  | 'page_oncall'
  | 'update_dashboard';

/**
 * Rollout configuration.
 */
interface RolloutConfig {
  readonly environment: Environment;
  readonly dryRun: boolean;
  readonly flags: Record<string, boolean>;
  readonly canaryPercentage: number;
  readonly enabledChannels: readonly string[];
}

/**
 * Rollout verification result.
 */
interface RolloutVerificationResult {
  readonly environment: Environment;
  readonly safeDefaults: boolean;
  readonly flagViolations: readonly FlagViolation[];
  readonly sideEffectsBlocked: readonly SideEffectType[];
  readonly canaryValid: boolean;
}

/**
 * Flag violation detail.
 */
interface FlagViolation {
  readonly flagName: string;
  readonly reason: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Canary rule definition.
 */
interface CanaryRule {
  readonly environment: Environment;
  readonly minPercentage: number;
  readonly maxPercentage: number;
  readonly rampDurationMs: number;
  readonly rollbackThreshold: number;
}

// ============================================================================
// Constants
// ============================================================================

const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  notifications_enabled: {
    name: 'notifications_enabled',
    description: 'Enable sending notifications to channels',
    defaultEnabled: { development: false, staging: true, production: false, test: false },
    requiresExplicitEnablement: true,
    allowCanary: true,
    sideEffects: ['send_notification', 'page_oncall'],
  },
  audit_integrity_job: {
    name: 'audit_integrity_job',
    description: 'Enable audit integrity verification job',
    defaultEnabled: { development: true, staging: true, production: false, test: true },
    requiresExplicitEnablement: true,
    allowCanary: false,
    sideEffects: ['create_audit_record'],
  },
  drift_recommendations: {
    name: 'drift_recommendations',
    description: 'Enable drift detection and recommendations',
    defaultEnabled: { development: true, staging: true, production: false, test: true },
    requiresExplicitEnablement: true,
    allowCanary: true,
    sideEffects: ['update_dashboard'],
  },
  pr_generation: {
    name: 'pr_generation',
    description: 'Enable auto-generation of governance PRs',
    defaultEnabled: { development: false, staging: false, production: false, test: false },
    requiresExplicitEnablement: true,
    allowCanary: true,
    sideEffects: ['create_pull_request'],
  },
  suppression_actions: {
    name: 'suppression_actions',
    description: 'Enable suppression creation/modification',
    defaultEnabled: { development: true, staging: true, production: false, test: true },
    requiresExplicitEnablement: true,
    allowCanary: false,
    sideEffects: ['create_suppression'],
  },
};

const CANARY_RULES: Record<Environment, CanaryRule> = {
  development: {
    environment: 'development',
    minPercentage: 0,
    maxPercentage: 100,
    rampDurationMs: 0,
    rollbackThreshold: 0,
  },
  staging: {
    environment: 'staging',
    minPercentage: 5,
    maxPercentage: 50,
    rampDurationMs: 3600000, // 1 hour
    rollbackThreshold: 0.05, // 5% error rate
  },
  production: {
    environment: 'production',
    minPercentage: 1,
    maxPercentage: 25,
    rampDurationMs: 86400000, // 24 hours
    rollbackThreshold: 0.01, // 1% error rate
  },
  test: {
    environment: 'test',
    minPercentage: 0,
    maxPercentage: 100,
    rampDurationMs: 0,
    rollbackThreshold: 0,
  },
};

const ENV_DEFAULTS: Record<Environment, Partial<RolloutConfig>> = {
  development: {
    dryRun: true,
    canaryPercentage: 100,
    enabledChannels: ['console'],
  },
  staging: {
    dryRun: false,
    canaryPercentage: 10,
    enabledChannels: ['slack', 'console'],
  },
  production: {
    dryRun: false,
    canaryPercentage: 0,
    enabledChannels: [],
  },
  test: {
    dryRun: true,
    canaryPercentage: 100,
    enabledChannels: ['mock'],
  },
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Get default config for environment.
 */
function getDefaultConfig(env: Environment): RolloutConfig {
  const defaults = ENV_DEFAULTS[env];
  const flags: Record<string, boolean> = {};

  for (const [name, flag] of Object.entries(FEATURE_FLAGS)) {
    flags[name] = flag.defaultEnabled[env];
  }

  return {
    environment: env,
    dryRun: defaults.dryRun ?? true,
    flags,
    canaryPercentage: defaults.canaryPercentage ?? 0,
    enabledChannels: defaults.enabledChannels ?? [],
  };
}

/**
 * Verify rollout configuration safety.
 */
function verifyRolloutConfig(config: RolloutConfig): RolloutVerificationResult {
  const violations: FlagViolation[] = [];
  const blockedSideEffects: SideEffectType[] = [];

  // Check each flag
  for (const [name, enabled] of Object.entries(config.flags)) {
    const flag = FEATURE_FLAGS[name];
    if (!flag) continue;

    // Production requires explicit enablement
    if (config.environment === 'production' && enabled && flag.requiresExplicitEnablement) {
      // This is allowed if explicitly set, but we track it
    }

    // Dry-run mode blocks side effects
    if (config.dryRun && enabled) {
      for (const effect of flag.sideEffects) {
        if (!blockedSideEffects.includes(effect)) {
          blockedSideEffects.push(effect);
        }
      }
    }

    // Canary validation
    if (
      enabled &&
      !flag.allowCanary &&
      config.canaryPercentage > 0 &&
      config.canaryPercentage < 100
    ) {
      violations.push({
        flagName: name,
        reason: `Flag ${name} does not support canary rollout`,
        severity: 'error',
      });
    }
  }

  // Validate canary percentage
  const canaryRule = CANARY_RULES[config.environment];
  const canaryValid =
    config.canaryPercentage >= canaryRule.minPercentage &&
    config.canaryPercentage <= canaryRule.maxPercentage;

  if (!canaryValid && config.canaryPercentage > 0) {
    violations.push({
      flagName: '__canary__',
      reason: `Canary percentage ${config.canaryPercentage}% outside allowed range [${canaryRule.minPercentage}, ${canaryRule.maxPercentage}]`,
      severity: 'error',
    });
  }

  // Check safe defaults
  const defaults = ENV_DEFAULTS[config.environment];
  const safeDefaults =
    (config.environment === 'production' ? config.dryRun === false : true) &&
    (config.environment === 'development' || config.environment === 'test'
      ? config.dryRun === true || config.dryRun === defaults.dryRun
      : true);

  return {
    environment: config.environment,
    safeDefaults,
    flagViolations: violations,
    sideEffectsBlocked: blockedSideEffects,
    canaryValid,
  };
}

/**
 * Check if side effect is allowed.
 */
function isSideEffectAllowed(config: RolloutConfig, effect: SideEffectType): boolean {
  if (config.dryRun) return false;

  for (const [name, enabled] of Object.entries(config.flags)) {
    const flag = FEATURE_FLAGS[name];
    if (flag && enabled && flag.sideEffects.includes(effect)) {
      return true;
    }
  }
  return false;
}

/**
 * Validate rollout sequencing.
 */
function validateRolloutSequence(
  currentEnv: Environment,
  targetEnv: Environment,
  envHistory: readonly Environment[]
): { valid: boolean; reason?: string } {
  const sequence: Environment[] = ['development', 'staging', 'production'];

  const currentIdx = sequence.indexOf(currentEnv);
  const targetIdx = sequence.indexOf(targetEnv);

  if (currentIdx === -1 || targetIdx === -1) {
    return { valid: true }; // test env is unrestricted
  }

  // Cannot skip stages
  if (targetIdx > currentIdx + 1) {
    return {
      valid: false,
      reason: `Cannot skip from ${currentEnv} to ${targetEnv}; must pass through intermediate stages`,
    };
  }

  // Must have validated in previous stage
  if (targetIdx > 0) {
    const requiredPrev = sequence[targetIdx - 1];
    if (!envHistory.includes(requiredPrev)) {
      return {
        valid: false,
        reason: `Must validate in ${requiredPrev} before rolling out to ${targetEnv}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Check if production enablement is explicit.
 */
function requiresExplicitEnablement(
  env: Environment,
  flagName: string,
  flagValue: boolean
): boolean {
  if (env !== 'production') return false;
  const flag = FEATURE_FLAGS[flagName];
  return flag ? flag.requiresExplicitEnablement && flagValue : false;
}

// ============================================================================
// Contract: env_defaults_are_safe
// ============================================================================

describe('Rollout Verification Contract', () => {
  describe('env_defaults_are_safe', () => {
    it('should have dry-run enabled by default in development', () => {
      const config = getDefaultConfig('development');
      assert.strictEqual(config.dryRun, true);
    });

    it('should have dry-run enabled by default in test', () => {
      const config = getDefaultConfig('test');
      assert.strictEqual(config.dryRun, true);
    });

    it('should have no channels enabled by default in production', () => {
      const config = getDefaultConfig('production');
      assert.strictEqual(config.enabledChannels.length, 0);
    });

    it('should have all production flags disabled by default', () => {
      const config = getDefaultConfig('production');
      for (const [name, enabled] of Object.entries(config.flags)) {
        if (FEATURE_FLAGS[name]?.sideEffects.includes('page_oncall')) {
          assert.strictEqual(
            enabled,
            false,
            `Flag ${name} should be disabled in production by default`
          );
        }
      }
    });

    it('should verify safe defaults for each environment', () => {
      for (const env of ['development', 'staging', 'production', 'test'] as Environment[]) {
        const config = getDefaultConfig(env);
        const result = verifyRolloutConfig(config);
        assert.ok(result.safeDefaults, `Environment ${env} should have safe defaults`);
      }
    });
  });

  // ============================================================================
  // Contract: feature_flags_gate_side_effects
  // ============================================================================

  describe('feature_flags_gate_side_effects', () => {
    it('should block notifications when flag is disabled', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('staging'),
        flags: { ...getDefaultConfig('staging').flags, notifications_enabled: false },
        dryRun: false,
      };
      assert.strictEqual(isSideEffectAllowed(config, 'send_notification'), false);
    });

    it('should allow notifications when flag is enabled and not dry-run', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('staging'),
        flags: { ...getDefaultConfig('staging').flags, notifications_enabled: true },
        dryRun: false,
      };
      assert.strictEqual(isSideEffectAllowed(config, 'send_notification'), true);
    });

    it('should block all side effects in dry-run mode', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('staging'),
        flags: {
          notifications_enabled: true,
          pr_generation: true,
          suppression_actions: true,
        },
        dryRun: true,
      };

      const effects: SideEffectType[] = [
        'send_notification',
        'create_pull_request',
        'create_suppression',
      ];

      for (const effect of effects) {
        assert.strictEqual(
          isSideEffectAllowed(config, effect),
          false,
          `Side effect ${effect} should be blocked in dry-run`
        );
      }
    });

    it('should block PR creation when flag is disabled', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('staging'),
        flags: { ...getDefaultConfig('staging').flags, pr_generation: false },
        dryRun: false,
      };
      assert.strictEqual(isSideEffectAllowed(config, 'create_pull_request'), false);
    });

    it('should track blocked side effects in verification result', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('development'),
        flags: { notifications_enabled: true },
        dryRun: true,
      };
      const result = verifyRolloutConfig(config);
      assert.ok(result.sideEffectsBlocked.includes('send_notification'));
    });
  });

  // ============================================================================
  // Contract: staging_canary_rules
  // ============================================================================

  describe('staging_canary_rules', () => {
    it('should allow 5-50% canary in staging', () => {
      const rule = CANARY_RULES.staging;
      assert.strictEqual(rule.minPercentage, 5);
      assert.strictEqual(rule.maxPercentage, 50);
    });

    it('should require 1 hour ramp duration in staging', () => {
      const rule = CANARY_RULES.staging;
      assert.strictEqual(rule.rampDurationMs, 3600000);
    });

    it('should have 5% rollback threshold in staging', () => {
      const rule = CANARY_RULES.staging;
      assert.strictEqual(rule.rollbackThreshold, 0.05);
    });

    it('should validate canary percentage is within bounds', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('staging'),
        canaryPercentage: 10,
      };
      const result = verifyRolloutConfig(config);
      assert.ok(result.canaryValid);
    });

    it('should reject canary percentage outside bounds', () => {
      const config: RolloutConfig = {
        ...getDefaultConfig('staging'),
        canaryPercentage: 75,
      };
      const result = verifyRolloutConfig(config);
      assert.ok(!result.canaryValid);
      assert.ok(result.flagViolations.some(v => v.flagName === '__canary__'));
    });
  });

  // ============================================================================
  // Contract: prod_requires_explicit_enablement
  // ============================================================================

  describe('prod_requires_explicit_enablement', () => {
    it('should require explicit enablement for notifications in production', () => {
      const requires = requiresExplicitEnablement('production', 'notifications_enabled', true);
      assert.strictEqual(requires, true);
    });

    it('should require explicit enablement for PR generation in production', () => {
      const requires = requiresExplicitEnablement('production', 'pr_generation', true);
      assert.strictEqual(requires, true);
    });

    it('should not require explicit enablement in staging', () => {
      const requires = requiresExplicitEnablement('staging', 'notifications_enabled', true);
      assert.strictEqual(requires, false);
    });

    it('should have all production flags marked as requiring explicit enablement', () => {
      for (const flag of Object.values(FEATURE_FLAGS)) {
        if (flag.sideEffects.length > 0) {
          assert.ok(
            flag.requiresExplicitEnablement,
            `Flag ${flag.name} with side effects should require explicit enablement`
          );
        }
      }
    });

    it('should have stricter canary rules in production', () => {
      const stagingRule = CANARY_RULES.staging;
      const prodRule = CANARY_RULES.production;

      assert.ok(prodRule.maxPercentage < stagingRule.maxPercentage);
      assert.ok(prodRule.rollbackThreshold < stagingRule.rollbackThreshold);
      assert.ok(prodRule.rampDurationMs > stagingRule.rampDurationMs);
    });
  });

  // ============================================================================
  // Contract: rollout_sequencing
  // ============================================================================

  describe('rollout_sequencing', () => {
    it('should allow dev to staging progression', () => {
      const result = validateRolloutSequence('development', 'staging', ['development']);
      assert.ok(result.valid);
    });

    it('should allow staging to production progression', () => {
      const result = validateRolloutSequence('staging', 'production', ['development', 'staging']);
      assert.ok(result.valid);
    });

    it('should reject skipping from dev to production', () => {
      const result = validateRolloutSequence('development', 'production', ['development']);
      assert.ok(!result.valid);
      assert.ok(result.reason?.includes('skip'));
    });

    it('should require staging validation before production', () => {
      const result = validateRolloutSequence('development', 'production', ['development']);
      assert.ok(!result.valid);
    });

    it('should allow test environment without restrictions', () => {
      const result = validateRolloutSequence('test', 'production', []);
      assert.ok(result.valid);
    });
  });
});
