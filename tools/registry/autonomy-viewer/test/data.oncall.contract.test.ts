/**
 * Data Access On-Call Contract Tests
 * ====================================
 *
 * Phase VIII: Validates on-call notification contracts for data access alerts.
 *
 * Contract:
 * - oncall_enforces_rate_limits: bounded notification volume per window
 * - oncall_enforces_dedupe_windows: suppress duplicates within window
 * - oncall_enforces_ack_suppress: acknowledged alerts suppressed until TTL
 * - oncall_maintains_audit_integrity: audit trail for all alerting decisions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

// ============================================================================
// Types for Data Access On-Call
// ============================================================================

/**
 * Alert severity.
 */
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Alert category for data access.
 */
type DataAlertCategory =
  | 'volume_spike'
  | 'new_principal_high_risk'
  | 'unusual_export'
  | 'policy_drift'
  | 'access_outside_window'
  | 'export_size_exceeded';

/**
 * Alert status.
 */
type AlertStatus = 'pending' | 'sent' | 'suppressed' | 'acknowledged' | 'resolved';

/**
 * Suppression reason.
 */
type SuppressionReason =
  | 'rate_limited'
  | 'dedupe_window'
  | 'acknowledged'
  | 'maintenance_window'
  | 'escalation_pending';

/**
 * Data access alert.
 */
interface DataAccessAlert {
  readonly alertId: string; // opaque sha256:
  readonly category: DataAlertCategory;
  readonly severity: AlertSeverity;
  readonly datasetId: string; // opaque sha256:
  readonly environment: string;
  readonly datasetRiskTier: string;
  readonly createdAt: string;
  readonly status: AlertStatus;
  readonly dedupeKey: string;
  readonly suppressionReason?: SuppressionReason;
  readonly suppressedUntil?: string;
}

/**
 * Rate limit configuration.
 */
interface RateLimitConfig {
  readonly maxAlertsPerHour: number;
  readonly maxAlertsPerDay: number;
  readonly burstLimit: number;
  readonly burstWindowMinutes: number;
}

/**
 * Dedupe configuration.
 */
interface DedupeConfig {
  readonly windowMinutes: number;
  readonly keyFields: readonly string[];
}

/**
 * Acknowledgment record.
 */
interface AckRecord {
  readonly alertId: string;
  readonly ackedBy: string;
  readonly ackedAt: string;
  readonly suppressUntil: string;
  readonly reason: string;
}

/**
 * Alerting decision audit entry.
 */
interface AlertingAuditEntry {
  readonly entryId: string; // opaque sha256:
  readonly alertId: string; // opaque sha256:
  readonly timestamp: string;
  readonly decision: 'send' | 'suppress' | 'escalate' | 'defer';
  readonly reason: string;
  readonly context: Record<string, unknown>;
}

/**
 * Rate limit state.
 */
interface RateLimitState {
  readonly hourlyCount: number;
  readonly dailyCount: number;
  readonly burstCount: number;
  readonly lastBurstReset: string;
}

/**
 * On-call engine.
 */
interface OnCallEngine {
  checkRateLimit: (state: RateLimitState, config: RateLimitConfig) => boolean;
  computeDedupeKey: (alert: DataAccessAlert, config: DedupeConfig) => string;
  shouldSuppress: (alert: DataAccessAlert, recentAlerts: readonly DataAccessAlert[], config: DedupeConfig) => boolean;
  checkAckSuppression: (alertId: string, acks: readonly AckRecord[]) => { suppressed: boolean; reason?: string };
  recordDecision: (alert: DataAccessAlert, decision: 'send' | 'suppress', reason: string) => AlertingAuditEntry;
}

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute opaque ID.
 */
function computeOpaqueId(input: string): string {
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

/**
 * Create on-call engine.
 */
function createOnCallEngine(): OnCallEngine {
  return {
    checkRateLimit(state, config) {
      if (state.hourlyCount >= config.maxAlertsPerHour) return false;
      if (state.dailyCount >= config.maxAlertsPerDay) return false;
      if (state.burstCount >= config.burstLimit) return false;
      return true;
    },

    computeDedupeKey(alert, config) {
      const parts = config.keyFields.map((field) => {
        const value = (alert as Record<string, unknown>)[field];
        return String(value ?? '');
      });
      return computeOpaqueId(parts.join(':'));
    },

    shouldSuppress(alert, recentAlerts, config) {
      const windowMs = config.windowMinutes * 60 * 1000;
      const now = Date.now();

      for (const recent of recentAlerts) {
        const recentTime = new Date(recent.createdAt).getTime();
        if (now - recentTime <= windowMs) {
          if (recent.dedupeKey === alert.dedupeKey && recent.alertId !== alert.alertId) {
            return true;
          }
        }
      }
      return false;
    },

    checkAckSuppression(alertId, acks) {
      const now = new Date();
      for (const ack of acks) {
        if (ack.alertId === alertId) {
          const suppressUntil = new Date(ack.suppressUntil);
          if (suppressUntil > now) {
            return { suppressed: true, reason: `Acknowledged by ${ack.ackedBy} until ${ack.suppressUntil}` };
          }
        }
      }
      return { suppressed: false };
    },

    recordDecision(alert, decision, reason) {
      return {
        entryId: computeOpaqueId(`audit-${alert.alertId}-${Date.now()}`),
        alertId: alert.alertId,
        timestamp: new Date().toISOString(),
        decision,
        reason,
        context: {
          category: alert.category,
          severity: alert.severity,
          environment: alert.environment,
          datasetRiskTier: alert.datasetRiskTier,
        },
      };
    },
  };
}

/**
 * Create sample alert.
 */
function createSampleAlert(options: Partial<DataAccessAlert> = {}): DataAccessAlert {
  const baseId = options.alertId ?? computeOpaqueId(`alert-${Date.now()}`);
  return {
    alertId: baseId,
    category: options.category ?? 'volume_spike',
    severity: options.severity ?? 'high',
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    environment: options.environment ?? 'production',
    datasetRiskTier: options.datasetRiskTier ?? 'high',
    createdAt: options.createdAt ?? new Date().toISOString(),
    status: options.status ?? 'pending',
    dedupeKey: options.dedupeKey ?? computeOpaqueId(`${baseId}:default`),
    suppressionReason: options.suppressionReason,
    suppressedUntil: options.suppressedUntil,
  };
}

/**
 * Create sample rate limit config.
 */
function createSampleRateLimitConfig(options: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    maxAlertsPerHour: options.maxAlertsPerHour ?? 10,
    maxAlertsPerDay: options.maxAlertsPerDay ?? 50,
    burstLimit: options.burstLimit ?? 5,
    burstWindowMinutes: options.burstWindowMinutes ?? 5,
  };
}

/**
 * Create sample dedupe config.
 */
function createSampleDedupeConfig(options: Partial<DedupeConfig> = {}): DedupeConfig {
  return {
    windowMinutes: options.windowMinutes ?? 15,
    keyFields: options.keyFields ?? ['category', 'datasetId', 'environment'],
  };
}

/**
 * Create sample ack record.
 */
function createSampleAckRecord(alertId: string, options: Partial<AckRecord> = {}): AckRecord {
  return {
    alertId,
    ackedBy: options.ackedBy ?? computeOpaqueId('user-oncall'),
    ackedAt: options.ackedAt ?? new Date().toISOString(),
    suppressUntil: options.suppressUntil ?? new Date(Date.now() + 3600000).toISOString(),
    reason: options.reason ?? 'Investigating volume spike',
  };
}

// ============================================================================
// Contract: oncall_enforces_rate_limits
// ============================================================================

describe('Data Access On-Call Contract', () => {
  describe('oncall_enforces_rate_limits', () => {
    it('should allow alerts under hourly limit', () => {
      const engine = createOnCallEngine();
      const config = createSampleRateLimitConfig({ maxAlertsPerHour: 10 });
      const state: RateLimitState = {
        hourlyCount: 5,
        dailyCount: 10,
        burstCount: 2,
        lastBurstReset: new Date().toISOString(),
      };

      assert.strictEqual(engine.checkRateLimit(state, config), true);
    });

    it('should block alerts at hourly limit', () => {
      const engine = createOnCallEngine();
      const config = createSampleRateLimitConfig({ maxAlertsPerHour: 10 });
      const state: RateLimitState = {
        hourlyCount: 10,
        dailyCount: 10,
        burstCount: 2,
        lastBurstReset: new Date().toISOString(),
      };

      assert.strictEqual(engine.checkRateLimit(state, config), false);
    });

    it('should block alerts at daily limit', () => {
      const engine = createOnCallEngine();
      const config = createSampleRateLimitConfig({ maxAlertsPerDay: 50 });
      const state: RateLimitState = {
        hourlyCount: 5,
        dailyCount: 50,
        burstCount: 2,
        lastBurstReset: new Date().toISOString(),
      };

      assert.strictEqual(engine.checkRateLimit(state, config), false);
    });

    it('should block alerts at burst limit', () => {
      const engine = createOnCallEngine();
      const config = createSampleRateLimitConfig({ burstLimit: 5 });
      const state: RateLimitState = {
        hourlyCount: 5,
        dailyCount: 10,
        burstCount: 5,
        lastBurstReset: new Date().toISOString(),
      };

      assert.strictEqual(engine.checkRateLimit(state, config), false);
    });
  });

  // ============================================================================
  // Contract: oncall_enforces_dedupe_windows
  // ============================================================================

  describe('oncall_enforces_dedupe_windows', () => {
    it('should compute consistent dedupe keys', () => {
      const engine = createOnCallEngine();
      const config = createSampleDedupeConfig();

      const alert1 = createSampleAlert({ category: 'volume_spike', datasetId: 'sha256:abc123' });
      const alert2 = createSampleAlert({ category: 'volume_spike', datasetId: 'sha256:abc123' });

      const key1 = engine.computeDedupeKey(alert1, config);
      const key2 = engine.computeDedupeKey(alert2, config);

      assert.strictEqual(key1, key2);
    });

    it('should compute different keys for different datasets', () => {
      const engine = createOnCallEngine();
      const config = createSampleDedupeConfig();

      const alert1 = createSampleAlert({ datasetId: 'sha256:abc' });
      const alert2 = createSampleAlert({ datasetId: 'sha256:def' });

      const key1 = engine.computeDedupeKey(alert1, config);
      const key2 = engine.computeDedupeKey(alert2, config);

      assert.notStrictEqual(key1, key2);
    });

    it('should suppress duplicates within window', () => {
      const engine = createOnCallEngine();
      const config = createSampleDedupeConfig({ windowMinutes: 15 });

      const dedupeKey = computeOpaqueId('same-key');
      const existing = createSampleAlert({
        alertId: 'sha256:existing',
        dedupeKey,
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      });
      const current = createSampleAlert({ alertId: 'sha256:current', dedupeKey });

      assert.strictEqual(engine.shouldSuppress(current, [existing], config), true);
    });

    it('should not suppress after window expires', () => {
      const engine = createOnCallEngine();
      const config = createSampleDedupeConfig({ windowMinutes: 15 });

      const dedupeKey = computeOpaqueId('same-key');
      const existing = createSampleAlert({
        alertId: 'sha256:existing',
        dedupeKey,
        createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
      });
      const current = createSampleAlert({ alertId: 'sha256:current', dedupeKey });

      assert.strictEqual(engine.shouldSuppress(current, [existing], config), false);
    });

    it('should use opaque dedupe keys', () => {
      const engine = createOnCallEngine();
      const config = createSampleDedupeConfig();
      const alert = createSampleAlert();

      const key = engine.computeDedupeKey(alert, config);
      assert.ok(key.startsWith('sha256:'));
    });
  });

  // ============================================================================
  // Contract: oncall_enforces_ack_suppress
  // ============================================================================

  describe('oncall_enforces_ack_suppress', () => {
    it('should suppress acknowledged alerts', () => {
      const engine = createOnCallEngine();
      const alertId = 'sha256:alert123';
      const ack = createSampleAckRecord(alertId, {
        suppressUntil: new Date(Date.now() + 3600000).toISOString(),
      });

      const result = engine.checkAckSuppression(alertId, [ack]);
      assert.strictEqual(result.suppressed, true);
    });

    it('should not suppress after ack expires', () => {
      const engine = createOnCallEngine();
      const alertId = 'sha256:alert123';
      const ack = createSampleAckRecord(alertId, {
        suppressUntil: new Date(Date.now() - 3600000).toISOString(),
      });

      const result = engine.checkAckSuppression(alertId, [ack]);
      assert.strictEqual(result.suppressed, false);
    });

    it('should not suppress unacknowledged alerts', () => {
      const engine = createOnCallEngine();
      const result = engine.checkAckSuppression('sha256:unknown', []);

      assert.strictEqual(result.suppressed, false);
    });

    it('should include reason for suppressed alerts', () => {
      const engine = createOnCallEngine();
      const alertId = 'sha256:alert123';
      const ack = createSampleAckRecord(alertId);

      const result = engine.checkAckSuppression(alertId, [ack]);
      assert.ok(result.reason?.includes('Acknowledged'));
    });
  });

  // ============================================================================
  // Contract: oncall_maintains_audit_integrity
  // ============================================================================

  describe('oncall_maintains_audit_integrity', () => {
    it('should record send decisions', () => {
      const engine = createOnCallEngine();
      const alert = createSampleAlert();
      const audit = engine.recordDecision(alert, 'send', 'Within rate limits');

      assert.strictEqual(audit.decision, 'send');
      assert.strictEqual(audit.alertId, alert.alertId);
    });

    it('should record suppress decisions', () => {
      const engine = createOnCallEngine();
      const alert = createSampleAlert();
      const audit = engine.recordDecision(alert, 'suppress', 'Rate limited');

      assert.strictEqual(audit.decision, 'suppress');
      assert.ok(audit.reason.includes('Rate'));
    });

    it('should include timestamp', () => {
      const engine = createOnCallEngine();
      const alert = createSampleAlert();
      const audit = engine.recordDecision(alert, 'send', 'Normal');

      assert.ok(audit.timestamp);
      assert.ok(new Date(audit.timestamp).getTime() > 0);
    });

    it('should include alert context', () => {
      const engine = createOnCallEngine();
      const alert = createSampleAlert({ category: 'unusual_export', severity: 'critical' });
      const audit = engine.recordDecision(alert, 'send', 'Normal');

      assert.strictEqual(audit.context.category, 'unusual_export');
      assert.strictEqual(audit.context.severity, 'critical');
    });

    it('should use opaque audit entry IDs', () => {
      const engine = createOnCallEngine();
      const alert = createSampleAlert();
      const audit = engine.recordDecision(alert, 'send', 'Normal');

      assert.ok(audit.entryId.startsWith('sha256:'));
    });
  });
});
