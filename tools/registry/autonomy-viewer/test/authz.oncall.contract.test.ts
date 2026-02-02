/**
 * AuthZ OnCall Contract Tests
 * ============================
 *
 * Phase V: Validates on-call alerting behavior for authorization events.
 *
 * Contract:
 * - oncall_rate_limits_enforced: prevents alert storms
 * - oncall_dedupe_windows: coalesces duplicate alerts
 * - oncall_ack_suppress_rules: honored acks suppress follow-ups
 * - oncall_audit_integrity: all alerts auditable with immutable log
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for AuthZ OnCall
// ============================================================================

/**
 * Alert severity.
 */
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Alert status.
 */
type AlertStatus = 'firing' | 'acknowledged' | 'resolved' | 'suppressed';

/**
 * Alert source.
 */
type AlertSource =
  | 'drift_detection'
  | 'high_risk_expansion'
  | 'policy_violation'
  | 'anomaly_detection';

/**
 * Authorization alert.
 */
interface AuthZAlert {
  readonly alertId: string;
  readonly createdAt: string;
  readonly source: AlertSource;
  readonly severity: AlertSeverity;
  readonly status: AlertStatus;
  readonly title: string;
  readonly description: string;
  readonly dedupeKey: string;
  readonly artifactType: string;
  readonly artifactId: string;
  readonly environment: string;
  readonly suppressUntil: string | null;
  readonly acknowledgedBy: string | null;
  readonly acknowledgedAt: string | null;
  readonly resolvedAt: string | null;
}

/**
 * Rate limit config.
 */
interface RateLimitConfig {
  readonly maxAlertsPerHour: number;
  readonly maxAlertsPerDay: number;
  readonly burstLimit: number;
  readonly burstWindowSeconds: number;
}

/**
 * Dedupe config.
 */
interface DedupeConfig {
  readonly windowSeconds: number;
  readonly keyFields: readonly string[];
}

/**
 * Suppress rule.
 */
interface SuppressRule {
  readonly ruleId: string;
  readonly source: AlertSource | '*';
  readonly severity: AlertSeverity | '*';
  readonly artifactPattern: string;
  readonly suppressDurationSeconds: number;
  readonly requiresAck: boolean;
}

/**
 * Audit log entry.
 */
interface AuditLogEntry {
  readonly entryId: string;
  readonly timestamp: string;
  readonly alertId: string;
  readonly action: 'created' | 'acknowledged' | 'resolved' | 'suppressed' | 'escalated';
  readonly actor: string;
  readonly previousStatus: AlertStatus | null;
  readonly newStatus: AlertStatus;
  readonly metadata: Record<string, unknown>;
  readonly checksum: string;
}

/**
 * Rate limit result.
 */
interface RateLimitResult {
  readonly allowed: boolean;
  readonly reason: string | null;
  readonly currentCount: number;
  readonly limit: number;
  readonly windowType: 'burst' | 'hourly' | 'daily';
}

/**
 * Dedupe result.
 */
interface DedupeResult {
  readonly isDuplicate: boolean;
  readonly existingAlertId: string | null;
  readonly dedupeKey: string;
  readonly windowExpiry: string;
}

/**
 * Alert state bucket (for rate limiting).
 */
interface AlertStateBucket {
  burstCount: number;
  burstWindowStart: number;
  hourlyCount: number;
  hourlyWindowStart: number;
  dailyCount: number;
  dailyWindowStart: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxAlertsPerHour: 100,
  maxAlertsPerDay: 500,
  burstLimit: 10,
  burstWindowSeconds: 60,
};

const DEFAULT_DEDUPE: DedupeConfig = {
  windowSeconds: 3600, // 1 hour
  keyFields: ['source', 'artifactType', 'artifactId', 'severity'],
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Generate dedupe key.
 */
function generateDedupeKey(
  alert: Pick<AuthZAlert, 'source' | 'artifactType' | 'artifactId' | 'severity'>
): string {
  return `${alert.source}:${alert.artifactType}:${alert.artifactId}:${alert.severity}`;
}

/**
 * Check rate limit.
 */
function checkRateLimit(
  bucket: AlertStateBucket,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
  now: number = Date.now()
): RateLimitResult {
  const nowSeconds = Math.floor(now / 1000);

  // Check burst limit
  if (nowSeconds - bucket.burstWindowStart > config.burstWindowSeconds) {
    bucket.burstCount = 0;
    bucket.burstWindowStart = nowSeconds;
  }
  if (bucket.burstCount >= config.burstLimit) {
    return {
      allowed: false,
      reason: `Burst limit exceeded: ${bucket.burstCount}/${config.burstLimit}`,
      currentCount: bucket.burstCount,
      limit: config.burstLimit,
      windowType: 'burst',
    };
  }

  // Check hourly limit
  if (nowSeconds - bucket.hourlyWindowStart > 3600) {
    bucket.hourlyCount = 0;
    bucket.hourlyWindowStart = nowSeconds;
  }
  if (bucket.hourlyCount >= config.maxAlertsPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit exceeded: ${bucket.hourlyCount}/${config.maxAlertsPerHour}`,
      currentCount: bucket.hourlyCount,
      limit: config.maxAlertsPerHour,
      windowType: 'hourly',
    };
  }

  // Check daily limit
  if (nowSeconds - bucket.dailyWindowStart > 86400) {
    bucket.dailyCount = 0;
    bucket.dailyWindowStart = nowSeconds;
  }
  if (bucket.dailyCount >= config.maxAlertsPerDay) {
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${bucket.dailyCount}/${config.maxAlertsPerDay}`,
      currentCount: bucket.dailyCount,
      limit: config.maxAlertsPerDay,
      windowType: 'daily',
    };
  }

  // Increment counters
  bucket.burstCount++;
  bucket.hourlyCount++;
  bucket.dailyCount++;

  return {
    allowed: true,
    reason: null,
    currentCount: bucket.burstCount,
    limit: config.burstLimit,
    windowType: 'burst',
  };
}

/**
 * Check dedupe.
 */
function checkDedupe(
  alert: Pick<AuthZAlert, 'source' | 'artifactType' | 'artifactId' | 'severity'>,
  recentAlerts: Map<string, { alertId: string; createdAt: number }>,
  config: DedupeConfig = DEFAULT_DEDUPE,
  now: number = Date.now()
): DedupeResult {
  const dedupeKey = generateDedupeKey(alert);
  const existing = recentAlerts.get(dedupeKey);

  if (existing) {
    const windowExpiry = existing.createdAt + config.windowSeconds * 1000;
    if (now < windowExpiry) {
      return {
        isDuplicate: true,
        existingAlertId: existing.alertId,
        dedupeKey,
        windowExpiry: new Date(windowExpiry).toISOString(),
      };
    }
  }

  return {
    isDuplicate: false,
    existingAlertId: null,
    dedupeKey,
    windowExpiry: new Date(now + config.windowSeconds * 1000).toISOString(),
  };
}

/**
 * Check suppress rules.
 */
function checkSuppressRules(
  alert: AuthZAlert,
  rules: readonly SuppressRule[],
  now: number = Date.now()
): { suppressed: boolean; rule: SuppressRule | null; until: string | null } {
  // Check if already suppressed
  if (alert.suppressUntil) {
    const suppressUntilMs = new Date(alert.suppressUntil).getTime();
    if (now < suppressUntilMs) {
      return { suppressed: true, rule: null, until: alert.suppressUntil };
    }
  }

  // Check matching rules
  for (const rule of rules) {
    const sourceMatch = rule.source === '*' || rule.source === alert.source;
    const severityMatch = rule.severity === '*' || rule.severity === alert.severity;
    const artifactMatch =
      rule.artifactPattern === '*' ||
      new RegExp(rule.artifactPattern.replace('*', '.*')).test(alert.artifactId);

    if (sourceMatch && severityMatch && artifactMatch) {
      // Rule requires ack but alert not acknowledged
      if (rule.requiresAck && alert.status !== 'acknowledged') {
        continue;
      }

      const until = new Date(now + rule.suppressDurationSeconds * 1000).toISOString();
      return { suppressed: true, rule, until };
    }
  }

  return { suppressed: false, rule: null, until: null };
}

/**
 * Compute checksum for an entry.
 */
function computeChecksum(entry: Omit<AuditLogEntry, 'checksum'>): string {
  // Create a stable JSON representation (sorted keys would be ideal, but for simplicity we use order)
  const checksumInput = [
    entry.entryId,
    entry.timestamp,
    entry.alertId,
    entry.action,
    entry.actor,
    entry.previousStatus ?? 'null',
    entry.newStatus,
    JSON.stringify(entry.metadata),
  ].join('|');
  // Simulated checksum - in real impl would use crypto
  // Use a simple hash-like approach
  let hash = 0;
  for (let i = 0; i < checksumInput.length; i++) {
    const char = checksumInput.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Create audit log entry.
 */
function createAuditLogEntry(
  alert: AuthZAlert,
  action: AuditLogEntry['action'],
  actor: string,
  previousStatus: AlertStatus | null
): AuditLogEntry {
  const entryWithoutChecksum = {
    entryId: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    alertId: alert.alertId,
    action,
    actor,
    previousStatus,
    newStatus: alert.status,
    metadata: {},
  };

  return {
    ...entryWithoutChecksum,
    checksum: computeChecksum(entryWithoutChecksum),
  };
}

/**
 * Validate audit log integrity.
 */
function validateAuditLogIntegrity(entries: readonly AuditLogEntry[]): {
  valid: boolean;
  invalidEntries: string[];
} {
  const invalidEntries: string[] = [];

  for (const entry of entries) {
    // Recompute checksum from entry data (excluding checksum)
    const { checksum, ...entryWithoutChecksum } = entry;
    const expectedChecksum = computeChecksum(entryWithoutChecksum);

    if (checksum !== expectedChecksum) {
      invalidEntries.push(entry.entryId);
    }
  }

  return { valid: invalidEntries.length === 0, invalidEntries };
}

/**
 * Create sample alert.
 */
function createSampleAlert(
  options: {
    source?: AlertSource;
    severity?: AlertSeverity;
    status?: AlertStatus;
    artifactType?: string;
    artifactId?: string;
    suppressUntil?: string | null;
  } = {}
): AuthZAlert {
  const {
    source = 'drift_detection',
    severity = 'high',
    status = 'firing',
    artifactType = 'role',
    artifactId = 'ROLE-ADMIN',
    suppressUntil = null,
  } = options;

  return {
    alertId: `ALERT-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source,
    severity,
    status,
    title: 'Authorization drift detected',
    description: 'Admin role permissions changed unexpectedly',
    dedupeKey: generateDedupeKey({ source, artifactType, artifactId, severity }),
    artifactType,
    artifactId,
    environment: 'production',
    suppressUntil,
    acknowledgedBy: status === 'acknowledged' ? 'sha256:oncall-opaque-id' : null,
    acknowledgedAt: status === 'acknowledged' ? new Date().toISOString() : null,
    resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
  };
}

/**
 * Create fresh state bucket.
 */
function createFreshBucket(): AlertStateBucket {
  const now = Math.floor(Date.now() / 1000);
  return {
    burstCount: 0,
    burstWindowStart: now,
    hourlyCount: 0,
    hourlyWindowStart: now,
    dailyCount: 0,
    dailyWindowStart: now,
  };
}

// ============================================================================
// Contract: oncall_rate_limits_enforced
// ============================================================================

describe('AuthZ OnCall Contract', () => {
  describe('oncall_rate_limits_enforced', () => {
    it('should allow alerts within burst limit', () => {
      const bucket = createFreshBucket();
      const result = checkRateLimit(bucket);

      assert.ok(result.allowed);
      assert.strictEqual(result.reason, null);
    });

    it('should block alerts exceeding burst limit', () => {
      const bucket = createFreshBucket();
      bucket.burstCount = DEFAULT_RATE_LIMIT.burstLimit;

      const result = checkRateLimit(bucket);

      assert.ok(!result.allowed);
      assert.ok(result.reason?.includes('Burst limit'));
    });

    it('should block alerts exceeding hourly limit', () => {
      const bucket = createFreshBucket();
      bucket.hourlyCount = DEFAULT_RATE_LIMIT.maxAlertsPerHour;

      const result = checkRateLimit(bucket);

      assert.ok(!result.allowed);
      assert.ok(result.reason?.includes('Hourly limit'));
    });

    it('should block alerts exceeding daily limit', () => {
      const bucket = createFreshBucket();
      bucket.dailyCount = DEFAULT_RATE_LIMIT.maxAlertsPerDay;

      const result = checkRateLimit(bucket);

      assert.ok(!result.allowed);
      assert.ok(result.reason?.includes('Daily limit'));
    });

    it('should reset burst window after expiry', () => {
      const now = Date.now();
      const bucket = createFreshBucket();
      bucket.burstCount = DEFAULT_RATE_LIMIT.burstLimit;
      bucket.burstWindowStart = Math.floor(now / 1000) - DEFAULT_RATE_LIMIT.burstWindowSeconds - 1;

      const result = checkRateLimit(bucket, DEFAULT_RATE_LIMIT, now);

      assert.ok(result.allowed);
    });
  });

  // ============================================================================
  // Contract: oncall_dedupe_windows
  // ============================================================================

  describe('oncall_dedupe_windows', () => {
    it('should generate consistent dedupe keys', () => {
      const alert = createSampleAlert();
      const key1 = generateDedupeKey(alert);
      const key2 = generateDedupeKey(alert);

      assert.strictEqual(key1, key2);
    });

    it('should detect duplicate alerts within window', () => {
      const now = Date.now();
      const alert = createSampleAlert();
      const recentAlerts = new Map([
        [alert.dedupeKey, { alertId: 'EXISTING-1', createdAt: now - 1000 }],
      ]);

      const result = checkDedupe(alert, recentAlerts, DEFAULT_DEDUPE, now);

      assert.ok(result.isDuplicate);
      assert.strictEqual(result.existingAlertId, 'EXISTING-1');
    });

    it('should allow alerts after window expiry', () => {
      const now = Date.now();
      const alert = createSampleAlert();
      const recentAlerts = new Map([
        [
          alert.dedupeKey,
          { alertId: 'OLD-1', createdAt: now - DEFAULT_DEDUPE.windowSeconds * 1000 - 1000 },
        ],
      ]);

      const result = checkDedupe(alert, recentAlerts, DEFAULT_DEDUPE, now);

      assert.ok(!result.isDuplicate);
    });

    it('should use correct key fields for deduplication', () => {
      const alert1 = createSampleAlert({ artifactId: 'ROLE-1' });
      const alert2 = createSampleAlert({ artifactId: 'ROLE-2' });

      const key1 = generateDedupeKey(alert1);
      const key2 = generateDedupeKey(alert2);

      assert.notStrictEqual(key1, key2);
    });
  });

  // ============================================================================
  // Contract: oncall_ack_suppress_rules
  // ============================================================================

  describe('oncall_ack_suppress_rules', () => {
    it('should suppress alerts with valid suppressUntil', () => {
      const now = Date.now();
      const alert = createSampleAlert({
        suppressUntil: new Date(now + 3600000).toISOString(),
      });

      const result = checkSuppressRules(alert, [], now);

      assert.ok(result.suppressed);
    });

    it('should not suppress after suppressUntil expires', () => {
      const now = Date.now();
      const alert = createSampleAlert({
        suppressUntil: new Date(now - 1000).toISOString(),
      });

      const result = checkSuppressRules(alert, [], now);

      assert.ok(!result.suppressed);
    });

    it('should apply matching suppress rules', () => {
      const alert = createSampleAlert({ source: 'drift_detection', severity: 'low' });
      const rules: SuppressRule[] = [
        {
          ruleId: 'RULE-1',
          source: 'drift_detection',
          severity: 'low',
          artifactPattern: '*',
          suppressDurationSeconds: 3600,
          requiresAck: false,
        },
      ];

      const result = checkSuppressRules(alert, rules);

      assert.ok(result.suppressed);
      assert.strictEqual(result.rule?.ruleId, 'RULE-1');
    });

    it('should require ack before suppressing when requiresAck=true', () => {
      const alert = createSampleAlert({ status: 'firing' });
      const rules: SuppressRule[] = [
        {
          ruleId: 'RULE-1',
          source: '*',
          severity: '*',
          artifactPattern: '*',
          suppressDurationSeconds: 3600,
          requiresAck: true,
        },
      ];

      const result = checkSuppressRules(alert, rules);

      assert.ok(!result.suppressed);
    });

    it('should suppress acknowledged alerts when requiresAck=true', () => {
      const alert = createSampleAlert({ status: 'acknowledged' });
      const rules: SuppressRule[] = [
        {
          ruleId: 'RULE-1',
          source: '*',
          severity: '*',
          artifactPattern: '*',
          suppressDurationSeconds: 3600,
          requiresAck: true,
        },
      ];

      const result = checkSuppressRules(alert, rules);

      assert.ok(result.suppressed);
    });
  });

  // ============================================================================
  // Contract: oncall_audit_integrity
  // ============================================================================

  describe('oncall_audit_integrity', () => {
    it('should create audit entry with checksum', () => {
      const alert = createSampleAlert();
      const entry = createAuditLogEntry(alert, 'created', 'sha256:system', null);

      assert.ok(entry.checksum.startsWith('sha256:'));
    });

    it('should validate intact audit entries', () => {
      const alert = createSampleAlert();
      const entries = [
        createAuditLogEntry(alert, 'created', 'sha256:system', null),
        createAuditLogEntry(
          { ...alert, status: 'acknowledged' },
          'acknowledged',
          'sha256:oncall',
          'firing'
        ),
      ];

      const result = validateAuditLogIntegrity(entries);

      assert.ok(result.valid);
    });

    it('should detect tampered audit entries', () => {
      const alert = createSampleAlert();
      const entry = createAuditLogEntry(alert, 'created', 'sha256:system', null);

      // Tamper with entry
      const tamperedEntry = { ...entry, actor: 'sha256:hacker' };

      const result = validateAuditLogIntegrity([tamperedEntry]);

      assert.ok(!result.valid);
      assert.ok(result.invalidEntries.includes(entry.entryId));
    });

    it('should include required audit fields', () => {
      const alert = createSampleAlert();
      const entry = createAuditLogEntry(alert, 'acknowledged', 'sha256:oncall', 'firing');

      assert.ok(entry.entryId);
      assert.ok(entry.timestamp);
      assert.ok(entry.alertId);
      assert.ok(entry.action);
      assert.ok(entry.actor);
      assert.strictEqual(entry.previousStatus, 'firing');
      assert.ok(entry.checksum);
    });

    it('should use opaque actor IDs', () => {
      const alert = createSampleAlert();
      const entry = createAuditLogEntry(alert, 'acknowledged', 'sha256:opaque-id', 'firing');

      assert.ok(entry.actor.startsWith('sha256:'));
    });
  });
});
