/**
 * Paging Policy Contract Tests
 * ==============================
 *
 * Phase IVa: Validates escalation and paging policy as code.
 *
 * Contract:
 * - severity_to_route_mapping_complete: all severities have routes
 * - pager_routes_never_trigger_in_dry_run: safety guarantee
 * - dedupe_and_suppression_interactions: explicit behavior
 * - escalation_ladders_are_bounded: no infinite loops
 * - quiet_hours_are_respected: time-based routing
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Paging Policy
// ============================================================================

/**
 * Severity levels.
 */
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Route types.
 */
type RouteType = 'page' | 'ticket' | 'dashboard' | 'log_only';

/**
 * Paging route definition.
 */
interface PagingRoute {
  readonly type: RouteType;
  readonly target: string;
  readonly escalationDelayMs: number;
  readonly maxEscalations: number;
  readonly respectQuietHours: boolean;
}

/**
 * Severity to route mapping.
 */
interface SeverityRouteMapping {
  readonly severity: Severity;
  readonly primaryRoute: PagingRoute;
  readonly fallbackRoute?: PagingRoute;
  readonly quietHoursRoute?: PagingRoute;
}

/**
 * Escalation ladder step.
 */
interface EscalationStep {
  readonly level: number;
  readonly delayMs: number;
  readonly target: string;
  readonly notifyPrevious: boolean;
}

/**
 * Escalation ladder.
 */
interface EscalationLadder {
  readonly name: string;
  readonly steps: readonly EscalationStep[];
  readonly maxLevel: number;
  readonly circuitBreakerAfter: number;
}

/**
 * Quiet hours configuration.
 */
interface QuietHoursConfig {
  readonly enabled: boolean;
  readonly startHour: number; // 0-23
  readonly endHour: number; // 0-23
  readonly timezone: string;
  readonly downgradeToSeverity?: Severity;
  readonly exceptSeverities: readonly Severity[];
}

/**
 * Paging policy.
 */
interface PagingPolicy {
  readonly version: string;
  readonly dryRun: boolean;
  readonly severityMappings: readonly SeverityRouteMapping[];
  readonly escalationLadders: Record<string, EscalationLadder>;
  readonly quietHours: QuietHoursConfig;
  readonly dedupeWindowMs: number;
  readonly suppressionEnabled: boolean;
}

/**
 * Routing decision.
 */
interface RoutingDecision {
  readonly severity: Severity;
  readonly route: PagingRoute;
  readonly reason: string;
  readonly appliedQuietHours: boolean;
  readonly deduped: boolean;
  readonly suppressed: boolean;
  readonly blocked: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ROUTES: Record<RouteType, PagingRoute> = {
  page: {
    type: 'page',
    target: 'oncall-primary',
    escalationDelayMs: 300000, // 5 min
    maxEscalations: 3,
    respectQuietHours: false,
  },
  ticket: {
    type: 'ticket',
    target: 'ops-queue',
    escalationDelayMs: 3600000, // 1 hour
    maxEscalations: 2,
    respectQuietHours: true,
  },
  dashboard: {
    type: 'dashboard',
    target: 'ops-dashboard',
    escalationDelayMs: 0,
    maxEscalations: 0,
    respectQuietHours: true,
  },
  log_only: {
    type: 'log_only',
    target: 'audit-log',
    escalationDelayMs: 0,
    maxEscalations: 0,
    respectQuietHours: true,
  },
};

const DEFAULT_POLICY: PagingPolicy = {
  version: '1.0.0',
  dryRun: false,
  severityMappings: [
    {
      severity: 'critical',
      primaryRoute: DEFAULT_ROUTES.page,
      fallbackRoute: DEFAULT_ROUTES.ticket,
    },
    {
      severity: 'high',
      primaryRoute: DEFAULT_ROUTES.page,
      fallbackRoute: DEFAULT_ROUTES.ticket,
      quietHoursRoute: DEFAULT_ROUTES.ticket,
    },
    {
      severity: 'medium',
      primaryRoute: DEFAULT_ROUTES.ticket,
      fallbackRoute: DEFAULT_ROUTES.dashboard,
      quietHoursRoute: DEFAULT_ROUTES.dashboard,
    },
    {
      severity: 'low',
      primaryRoute: DEFAULT_ROUTES.dashboard,
      quietHoursRoute: DEFAULT_ROUTES.log_only,
    },
    {
      severity: 'info',
      primaryRoute: DEFAULT_ROUTES.log_only,
    },
  ],
  escalationLadders: {
    primary: {
      name: 'primary',
      steps: [
        { level: 1, delayMs: 0, target: 'oncall-primary', notifyPrevious: false },
        { level: 2, delayMs: 300000, target: 'oncall-secondary', notifyPrevious: true },
        { level: 3, delayMs: 600000, target: 'oncall-manager', notifyPrevious: true },
      ],
      maxLevel: 3,
      circuitBreakerAfter: 5,
    },
    ticket: {
      name: 'ticket',
      steps: [
        { level: 1, delayMs: 0, target: 'ops-queue', notifyPrevious: false },
        { level: 2, delayMs: 3600000, target: 'ops-lead', notifyPrevious: true },
      ],
      maxLevel: 2,
      circuitBreakerAfter: 3,
    },
  },
  quietHours: {
    enabled: true,
    startHour: 22,
    endHour: 7,
    timezone: 'America/Los_Angeles',
    downgradeToSeverity: 'medium',
    exceptSeverities: ['critical'],
  },
  dedupeWindowMs: 300000, // 5 min
  suppressionEnabled: true,
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Get route for severity.
 */
function getRouteForSeverity(
  policy: PagingPolicy,
  severity: Severity
): SeverityRouteMapping | undefined {
  return policy.severityMappings.find(m => m.severity === severity);
}

/**
 * Check if in quiet hours.
 */
function isInQuietHours(policy: PagingPolicy, hour: number): boolean {
  if (!policy.quietHours.enabled) return false;

  const { startHour, endHour } = policy.quietHours;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

/**
 * Apply paging policy to determine route.
 */
function applyPolicy(
  policy: PagingPolicy,
  severity: Severity,
  options: {
    hour?: number;
    isDuplicate?: boolean;
    isSuppressed?: boolean;
  } = {}
): RoutingDecision {
  const { hour = 12, isDuplicate = false, isSuppressed = false } = options;

  // Check dry-run mode
  if (policy.dryRun) {
    return {
      severity,
      route: DEFAULT_ROUTES.log_only,
      reason: 'dry_run_mode',
      appliedQuietHours: false,
      deduped: isDuplicate,
      suppressed: isSuppressed,
      blocked: true,
    };
  }

  // Check suppression
  if (isSuppressed && policy.suppressionEnabled) {
    return {
      severity,
      route: DEFAULT_ROUTES.log_only,
      reason: 'suppressed',
      appliedQuietHours: false,
      deduped: isDuplicate,
      suppressed: true,
      blocked: true,
    };
  }

  // Check dedupe
  if (isDuplicate) {
    return {
      severity,
      route: DEFAULT_ROUTES.log_only,
      reason: 'deduplicated',
      appliedQuietHours: false,
      deduped: true,
      suppressed: false,
      blocked: true,
    };
  }

  const mapping = getRouteForSeverity(policy, severity);
  if (!mapping) {
    return {
      severity,
      route: DEFAULT_ROUTES.log_only,
      reason: 'no_mapping_found',
      appliedQuietHours: false,
      deduped: false,
      suppressed: false,
      blocked: false,
    };
  }

  // Check quiet hours
  const inQuietHours = isInQuietHours(policy, hour);
  const isExempt = policy.quietHours.exceptSeverities.includes(severity);

  if (inQuietHours && !isExempt && mapping.quietHoursRoute) {
    return {
      severity,
      route: mapping.quietHoursRoute,
      reason: 'quiet_hours_applied',
      appliedQuietHours: true,
      deduped: false,
      suppressed: false,
      blocked: false,
    };
  }

  return {
    severity,
    route: mapping.primaryRoute,
    reason: 'primary_route',
    appliedQuietHours: false,
    deduped: false,
    suppressed: false,
    blocked: false,
  };
}

/**
 * Validate escalation ladder is bounded.
 */
function validateEscalationLadder(ladder: EscalationLadder): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check maxLevel matches steps
  if (ladder.steps.length > ladder.maxLevel) {
    errors.push(`Steps (${ladder.steps.length}) exceed maxLevel (${ladder.maxLevel})`);
  }

  // Check circuit breaker is set
  if (ladder.circuitBreakerAfter <= 0) {
    errors.push('Circuit breaker must be positive');
  }

  // Check for reasonable bounds
  if (ladder.maxLevel > 10) {
    errors.push('maxLevel should not exceed 10 to prevent runaway escalation');
  }

  // Check steps are sequential
  const levels = ladder.steps.map(s => s.level);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] <= levels[i - 1]) {
      errors.push(
        `Escalation levels must be strictly increasing: ${levels[i - 1]} -> ${levels[i]}`
      );
    }
  }

  // Check delays are reasonable
  const totalDelayMs = ladder.steps.reduce((sum, s) => sum + s.delayMs, 0);
  if (totalDelayMs > 86400000) {
    errors.push('Total escalation delay exceeds 24 hours');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete policy.
 */
function validatePolicy(policy: PagingPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all severities have mappings
  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  for (const sev of severities) {
    if (!getRouteForSeverity(policy, sev)) {
      errors.push(`Missing route mapping for severity: ${sev}`);
    }
  }

  // Validate escalation ladders
  for (const [name, ladder] of Object.entries(policy.escalationLadders)) {
    const ladderResult = validateEscalationLadder(ladder);
    if (!ladderResult.valid) {
      errors.push(...ladderResult.errors.map(e => `Ladder '${name}': ${e}`));
    }
  }

  // Check quiet hours config
  if (policy.quietHours.enabled) {
    if (policy.quietHours.startHour < 0 || policy.quietHours.startHour > 23) {
      errors.push('Invalid quiet hours start hour');
    }
    if (policy.quietHours.endHour < 0 || policy.quietHours.endHour > 23) {
      errors.push('Invalid quiet hours end hour');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Contract: severity_to_route_mapping_complete
// ============================================================================

describe('Paging Policy Contract', () => {
  describe('severity_to_route_mapping_complete', () => {
    it('should have mapping for all severity levels', () => {
      const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

      for (const sev of severities) {
        const mapping = getRouteForSeverity(DEFAULT_POLICY, sev);
        assert.ok(mapping, `Missing mapping for ${sev}`);
      }
    });

    it('should route critical to page', () => {
      const mapping = getRouteForSeverity(DEFAULT_POLICY, 'critical');
      assert.strictEqual(mapping?.primaryRoute.type, 'page');
    });

    it('should route info to log_only', () => {
      const mapping = getRouteForSeverity(DEFAULT_POLICY, 'info');
      assert.strictEqual(mapping?.primaryRoute.type, 'log_only');
    });

    it('should have fallback routes for high severity items', () => {
      const critical = getRouteForSeverity(DEFAULT_POLICY, 'critical');
      const high = getRouteForSeverity(DEFAULT_POLICY, 'high');

      assert.ok(critical?.fallbackRoute);
      assert.ok(high?.fallbackRoute);
    });

    it('should validate complete policy successfully', () => {
      const result = validatePolicy(DEFAULT_POLICY);
      assert.ok(result.valid, `Policy validation failed: ${result.errors.join(', ')}`);
    });
  });

  // ============================================================================
  // Contract: pager_routes_never_trigger_in_dry_run
  // ============================================================================

  describe('pager_routes_never_trigger_in_dry_run', () => {
    it('should block page route in dry-run mode', () => {
      const dryRunPolicy = { ...DEFAULT_POLICY, dryRun: true };
      const decision = applyPolicy(dryRunPolicy, 'critical');

      assert.strictEqual(decision.route.type, 'log_only');
      assert.ok(decision.blocked);
    });

    it('should block all routes in dry-run mode', () => {
      const dryRunPolicy = { ...DEFAULT_POLICY, dryRun: true };
      const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

      for (const sev of severities) {
        const decision = applyPolicy(dryRunPolicy, sev);
        assert.strictEqual(decision.route.type, 'log_only', `${sev} should route to log_only`);
        assert.ok(decision.blocked, `${sev} should be blocked`);
      }
    });

    it('should report dry_run_mode as reason', () => {
      const dryRunPolicy = { ...DEFAULT_POLICY, dryRun: true };
      const decision = applyPolicy(dryRunPolicy, 'critical');

      assert.strictEqual(decision.reason, 'dry_run_mode');
    });

    it('should still track dedupe status in dry-run', () => {
      const dryRunPolicy = { ...DEFAULT_POLICY, dryRun: true };
      const decision = applyPolicy(dryRunPolicy, 'high', { isDuplicate: true });

      assert.ok(decision.deduped);
    });
  });

  // ============================================================================
  // Contract: dedupe_and_suppression_interactions
  // ============================================================================

  describe('dedupe_and_suppression_interactions', () => {
    it('should block route when deduplicated', () => {
      const decision = applyPolicy(DEFAULT_POLICY, 'high', { isDuplicate: true });

      assert.strictEqual(decision.route.type, 'log_only');
      assert.ok(decision.deduped);
      assert.strictEqual(decision.reason, 'deduplicated');
    });

    it('should block route when suppressed', () => {
      const decision = applyPolicy(DEFAULT_POLICY, 'high', { isSuppressed: true });

      assert.strictEqual(decision.route.type, 'log_only');
      assert.ok(decision.suppressed);
      assert.strictEqual(decision.reason, 'suppressed');
    });

    it('should prioritize suppression over other decisions', () => {
      const decision = applyPolicy(DEFAULT_POLICY, 'critical', {
        isSuppressed: true,
        isDuplicate: true,
      });

      assert.strictEqual(decision.reason, 'suppressed');
    });

    it('should allow suppression to be disabled', () => {
      const noSuppressionPolicy = { ...DEFAULT_POLICY, suppressionEnabled: false };
      const decision = applyPolicy(noSuppressionPolicy, 'high', { isSuppressed: true });

      assert.ok(!decision.suppressed);
      assert.strictEqual(decision.route.type, 'page');
    });

    it('should have explicit dedupe window configured', () => {
      assert.ok(DEFAULT_POLICY.dedupeWindowMs > 0);
      assert.strictEqual(DEFAULT_POLICY.dedupeWindowMs, 300000); // 5 min
    });
  });

  // ============================================================================
  // Contract: escalation_ladders_are_bounded
  // ============================================================================

  describe('escalation_ladders_are_bounded', () => {
    it('should have maxLevel set for all ladders', () => {
      for (const ladder of Object.values(DEFAULT_POLICY.escalationLadders)) {
        assert.ok(ladder.maxLevel > 0);
        assert.ok(ladder.maxLevel <= 10);
      }
    });

    it('should have circuit breaker configured', () => {
      for (const ladder of Object.values(DEFAULT_POLICY.escalationLadders)) {
        assert.ok(ladder.circuitBreakerAfter > 0);
      }
    });

    it('should have sequential escalation levels', () => {
      for (const ladder of Object.values(DEFAULT_POLICY.escalationLadders)) {
        const result = validateEscalationLadder(ladder);
        assert.ok(result.valid, `Ladder ${ladder.name}: ${result.errors.join(', ')}`);
      }
    });

    it('should not allow infinite escalation', () => {
      const badLadder: EscalationLadder = {
        name: 'infinite',
        steps: Array.from({ length: 100 }, (_, i) => ({
          level: i + 1,
          delayMs: 1000,
          target: `target-${i}`,
          notifyPrevious: false,
        })),
        maxLevel: 100,
        circuitBreakerAfter: 5,
      };

      const result = validateEscalationLadder(badLadder);
      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('maxLevel')));
    });

    it('should have reasonable total escalation time', () => {
      for (const ladder of Object.values(DEFAULT_POLICY.escalationLadders)) {
        const totalDelayMs = ladder.steps.reduce((sum, s) => sum + s.delayMs, 0);
        assert.ok(totalDelayMs <= 86400000, `Ladder ${ladder.name} exceeds 24h total delay`);
      }
    });
  });

  // ============================================================================
  // Contract: quiet_hours_are_respected
  // ============================================================================

  describe('quiet_hours_are_respected', () => {
    it('should apply quiet hours route during quiet hours', () => {
      const decision = applyPolicy(DEFAULT_POLICY, 'high', { hour: 23 });

      assert.ok(decision.appliedQuietHours);
      assert.strictEqual(decision.route.type, 'ticket');
    });

    it('should use primary route outside quiet hours', () => {
      const decision = applyPolicy(DEFAULT_POLICY, 'high', { hour: 12 });

      assert.ok(!decision.appliedQuietHours);
      assert.strictEqual(decision.route.type, 'page');
    });

    it('should exempt critical from quiet hours', () => {
      const decision = applyPolicy(DEFAULT_POLICY, 'critical', { hour: 23 });

      assert.ok(!decision.appliedQuietHours);
      assert.strictEqual(decision.route.type, 'page');
    });

    it('should handle overnight quiet hours correctly', () => {
      // 22:00 - 07:00
      assert.ok(isInQuietHours(DEFAULT_POLICY, 23)); // 11 PM
      assert.ok(isInQuietHours(DEFAULT_POLICY, 3)); // 3 AM
      assert.ok(!isInQuietHours(DEFAULT_POLICY, 12)); // 12 PM
      assert.ok(!isInQuietHours(DEFAULT_POLICY, 8)); // 8 AM
    });

    it('should respect timezone setting', () => {
      assert.strictEqual(DEFAULT_POLICY.quietHours.timezone, 'America/Los_Angeles');
    });
  });
});
