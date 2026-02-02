/**
 * Operator E2E Flow Contract Tests
 * ==================================
 *
 * Phase IIIn: Validates the complete operator journey from drift detection
 * through acknowledgement/suppression to audit trail.
 *
 * Contract:
 * - flow_drift_to_notification: Drift triggers recommendation triggers notification
 * - flow_suppression_respected: Active suppression prevents notification
 * - flow_ack_creates_audit: Acknowledgement creates immutable audit entry
 * - flow_correlation_maintained: Correlation ID traces entire flow
 * - flow_dry_run_safe: Dry-run mode produces no side effects
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for E2E Flow
// ============================================================================

/**
 * Drift observation (input to the flow).
 */
interface DriftObservation {
  readonly sloId: string;
  readonly currentValue: number;
  readonly baselineValue: number;
  readonly driftPercent: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly timestamp: string;
  readonly dimensions: Record<string, string>;
}

/**
 * Recommendation (output of recommendation engine).
 */
interface Recommendation {
  readonly id: string;
  readonly sloId: string;
  readonly action: 'TUNE_SLO' | 'REVIEW_ALERT' | 'INVESTIGATE_BASELINE' | 'NO_ACTION';
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly summary: string;
  readonly runbookUrl: string;
  readonly correlationId: string;
  readonly createdAt: string;
}

/**
 * Notification dispatch result.
 */
interface NotificationResult {
  readonly sent: boolean;
  readonly channel: string;
  readonly correlationId: string;
  readonly suppressedBy?: string;
  readonly rateLimited?: boolean;
  readonly dryRun?: boolean;
}

/**
 * Acknowledgement action.
 */
interface AckAction {
  readonly recommendationId: string;
  readonly operatorId: string;
  readonly action: 'acknowledge' | 'suppress' | 'escalate';
  readonly justification: string;
  readonly suppressionDays?: number;
  readonly correlationId: string;
}

/**
 * Audit entry (created by acknowledgement).
 */
interface AuditEntry {
  readonly id: string;
  readonly sequenceNumber: number;
  readonly action: string;
  readonly actor: { type: string; id: string };
  readonly target: { type: string; id: string };
  readonly correlationId: string;
  readonly timestamp: string;
  readonly checksum: string;
}

/**
 * Suppression record.
 */
interface Suppression {
  readonly id: string;
  readonly targetId: string;
  readonly operatorId: string;
  readonly expiresAt: string;
  readonly active: boolean;
}

/**
 * Flow execution context.
 */
interface FlowContext {
  readonly dryRun: boolean;
  readonly correlationId: string;
  readonly timestamp: string;
}

/**
 * Flow execution result.
 */
interface FlowResult {
  readonly recommendation?: Recommendation;
  readonly notification?: NotificationResult;
  readonly auditEntries: readonly AuditEntry[];
  readonly correlationId: string;
  readonly dryRun: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_DIMENSIONS = ['provider', 'code', 'stage'] as const;
const MIN_DRIFT_FOR_NOTIFICATION = 10; // 10% drift threshold

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Generate unique ID.
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generate correlation ID.
 */
function generateCorrelationId(sloId: string): string {
  return `corr-${sloId}-${Date.now()}`;
}

/**
 * Filter dimensions to allowlist.
 */
function filterDimensions(dims: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const key of ALLOWED_DIMENSIONS) {
    if (key in dims) {
      filtered[key] = dims[key];
    }
  }
  return filtered;
}

/**
 * Mock suppression store.
 */
class SuppressionStore {
  private readonly suppressions: Map<string, Suppression> = new Map();

  add(suppression: Suppression): void {
    this.suppressions.set(suppression.id, suppression);
  }

  findActive(targetId: string, now?: Date): Suppression | undefined {
    const checkTime = now ?? new Date();
    for (const sup of this.suppressions.values()) {
      if (sup.targetId === targetId && sup.active && new Date(sup.expiresAt) > checkTime) {
        return sup;
      }
    }
    return undefined;
  }

  deactivate(id: string): void {
    const sup = this.suppressions.get(id);
    if (sup) {
      this.suppressions.set(id, { ...sup, active: false });
    }
  }
}

/**
 * Mock audit store (append-only).
 */
class AuditStore {
  private readonly entries: AuditEntry[] = [];
  private sequenceCounter = 0;

  append(
    action: string,
    actor: { type: string; id: string },
    target: { type: string; id: string },
    correlationId: string
  ): AuditEntry {
    const entry: AuditEntry = {
      id: generateId('audit'),
      sequenceNumber: this.sequenceCounter++,
      action,
      actor,
      target,
      correlationId,
      timestamp: new Date().toISOString(),
      checksum: `sha256:${Date.now().toString(16)}`,
    };
    this.entries.push(entry);
    return entry;
  }

  findByCorrelation(correlationId: string): readonly AuditEntry[] {
    return this.entries.filter(e => e.correlationId === correlationId);
  }

  getAll(): readonly AuditEntry[] {
    return [...this.entries];
  }
}

/**
 * Mock notification dispatcher.
 */
class NotificationDispatcher {
  private readonly sentNotifications: NotificationResult[] = [];
  private readonly rateLimitCounts: Map<string, number> = new Map();
  private readonly rateLimitMax = 10;

  dispatch(
    recommendation: Recommendation,
    channel: string,
    suppressionStore: SuppressionStore,
    context: FlowContext
  ): NotificationResult {
    // Check suppression
    const activeSuppression = suppressionStore.findActive(recommendation.sloId);
    if (activeSuppression) {
      return {
        sent: false,
        channel,
        correlationId: context.correlationId,
        suppressedBy: activeSuppression.id,
      };
    }

    // Check rate limit
    const key = `${channel}:${recommendation.sloId}`;
    const count = this.rateLimitCounts.get(key) ?? 0;
    if (count >= this.rateLimitMax) {
      return {
        sent: false,
        channel,
        correlationId: context.correlationId,
        rateLimited: true,
      };
    }

    // Dry run check
    if (context.dryRun) {
      return {
        sent: false,
        channel,
        correlationId: context.correlationId,
        dryRun: true,
      };
    }

    // Actually send (mock)
    this.rateLimitCounts.set(key, count + 1);
    const result: NotificationResult = {
      sent: true,
      channel,
      correlationId: context.correlationId,
    };
    this.sentNotifications.push(result);
    return result;
  }

  getSentCount(): number {
    return this.sentNotifications.length;
  }
}

/**
 * Recommendation engine.
 */
function generateRecommendation(
  drift: DriftObservation,
  correlationId: string
): Recommendation | null {
  if (drift.driftPercent < MIN_DRIFT_FOR_NOTIFICATION) {
    return null;
  }

  const action =
    drift.severity === 'critical' || drift.severity === 'high'
      ? 'TUNE_SLO'
      : drift.severity === 'medium'
        ? 'REVIEW_ALERT'
        : 'INVESTIGATE_BASELINE';

  const priority =
    drift.severity === 'critical'
      ? 'urgent'
      : drift.severity === 'high'
        ? 'high'
        : drift.severity === 'medium'
          ? 'medium'
          : 'low';

  return {
    id: generateId('rec'),
    sloId: drift.sloId,
    action,
    priority,
    summary: `Drift of ${drift.driftPercent}% detected on ${drift.sloId}`,
    runbookUrl: `https://runbook.terrafusion.io/slo/${drift.sloId}`,
    correlationId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Execute the complete E2E flow.
 */
function executeFlow(
  drift: DriftObservation,
  channel: string,
  dispatcher: NotificationDispatcher,
  suppressionStore: SuppressionStore,
  auditStore: AuditStore,
  options: { dryRun?: boolean } = {}
): FlowResult {
  const correlationId = generateCorrelationId(drift.sloId);
  const context: FlowContext = {
    dryRun: options.dryRun ?? false,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  const auditEntries: AuditEntry[] = [];

  // Step 1: Generate recommendation
  const recommendation = generateRecommendation(drift, correlationId);
  if (!recommendation) {
    return {
      auditEntries,
      correlationId,
      dryRun: context.dryRun,
    };
  }

  // Audit: recommendation emitted
  if (!context.dryRun) {
    auditEntries.push(
      auditStore.append(
        'recommendation.emitted',
        { type: 'system', id: 'recommendation-engine' },
        { type: 'slo', id: drift.sloId },
        correlationId
      )
    );
  }

  // Step 2: Dispatch notification
  const notification = dispatcher.dispatch(recommendation, channel, suppressionStore, context);

  // Audit: notification sent/suppressed
  if (!context.dryRun && notification.sent) {
    auditEntries.push(
      auditStore.append(
        'notification.sent',
        { type: 'system', id: 'notification-dispatcher' },
        { type: 'notification', id: channel },
        correlationId
      )
    );
  }

  return {
    recommendation,
    notification,
    auditEntries,
    correlationId,
    dryRun: context.dryRun,
  };
}

/**
 * Process acknowledgement action.
 */
function processAcknowledgement(
  ack: AckAction,
  suppressionStore: SuppressionStore,
  auditStore: AuditStore,
  options: { dryRun?: boolean } = {}
): { success: boolean; auditEntry?: AuditEntry; suppression?: Suppression } {
  if (options.dryRun) {
    return { success: true };
  }

  // Create audit entry
  const auditEntry = auditStore.append(
    `ack.${ack.action}`,
    { type: 'operator', id: ack.operatorId },
    { type: 'recommendation', id: ack.recommendationId },
    ack.correlationId
  );

  // Create suppression if requested
  let suppression: Suppression | undefined;
  if (ack.action === 'suppress' && ack.suppressionDays) {
    const expiresAt = new Date(Date.now() + ack.suppressionDays * 24 * 60 * 60 * 1000);
    suppression = {
      id: generateId('sup'),
      targetId: ack.recommendationId.split('-')[0], // Extract SLO ID
      operatorId: ack.operatorId,
      expiresAt: expiresAt.toISOString(),
      active: true,
    };
    suppressionStore.add(suppression);
  }

  return { success: true, auditEntry, suppression };
}

// ============================================================================
// Contract: flow_drift_to_notification
// ============================================================================

describe('Operator E2E Flow Contract', () => {
  describe('flow_drift_to_notification', () => {
    it('should generate recommendation from drift above threshold', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const recommendation = generateRecommendation(drift, 'corr-1');
      assert.ok(recommendation, 'Should generate recommendation');
      assert.strictEqual(recommendation.sloId, 'security.denial_rate');
      assert.strictEqual(recommendation.action, 'TUNE_SLO');
    });

    it('should not generate recommendation for low drift', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.051,
        baselineValue: 0.05,
        driftPercent: 2, // Below threshold
        severity: 'low',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const recommendation = generateRecommendation(drift, 'corr-1');
      assert.ok(!recommendation, 'Should not generate recommendation');
    });

    it('should dispatch notification for valid recommendation', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore);

      assert.ok(result.recommendation, 'Should have recommendation');
      assert.ok(result.notification?.sent, 'Should send notification');
      assert.strictEqual(dispatcher.getSentCount(), 1);
    });

    it('should create audit entries for the flow', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore);

      assert.ok(result.auditEntries.length >= 2, 'Should have audit entries');
      assert.ok(
        result.auditEntries.some(e => e.action === 'recommendation.emitted'),
        'Should audit recommendation'
      );
      assert.ok(
        result.auditEntries.some(e => e.action === 'notification.sent'),
        'Should audit notification'
      );
    });
  });

  // ============================================================================
  // Contract: flow_suppression_respected
  // ============================================================================

  describe('flow_suppression_respected', () => {
    it('should not send notification when suppression active', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      // Add active suppression
      suppressionStore.add({
        id: 'sup-1',
        targetId: 'security.denial_rate',
        operatorId: 'ops-user-1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        active: true,
      });

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore);

      assert.ok(!result.notification?.sent, 'Should not send notification');
      assert.strictEqual(result.notification?.suppressedBy, 'sup-1');
    });

    it('should send notification when suppression expired', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      // Add expired suppression
      suppressionStore.add({
        id: 'sup-1',
        targetId: 'security.denial_rate',
        operatorId: 'ops-user-1',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
        active: true,
      });

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore);

      assert.ok(result.notification?.sent, 'Should send notification');
    });

    it('should not affect other SLOs with suppression', () => {
      const drift: DriftObservation = {
        sloId: 'security.latency_p99',
        currentValue: 500,
        baselineValue: 200,
        driftPercent: 150,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      // Suppress different SLO
      suppressionStore.add({
        id: 'sup-1',
        targetId: 'security.denial_rate',
        operatorId: 'ops-user-1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        active: true,
      });

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore);

      assert.ok(result.notification?.sent, 'Should send notification for unsuppressed SLO');
    });
  });

  // ============================================================================
  // Contract: flow_ack_creates_audit
  // ============================================================================

  describe('flow_ack_creates_audit', () => {
    it('should create audit entry on acknowledgement', () => {
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const ack: AckAction = {
        recommendationId: 'rec-123',
        operatorId: 'ops-user-1',
        action: 'acknowledge',
        justification: 'Reviewed and confirmed expected behavior during maintenance',
        correlationId: 'corr-123',
      };

      const result = processAcknowledgement(ack, suppressionStore, auditStore);

      assert.ok(result.success);
      assert.ok(result.auditEntry);
      assert.strictEqual(result.auditEntry.action, 'ack.acknowledge');
      assert.strictEqual(result.auditEntry.actor.id, 'ops-user-1');
    });

    it('should create suppression on suppress action', () => {
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const ack: AckAction = {
        recommendationId: 'security.denial_rate-rec-123',
        operatorId: 'ops-user-1',
        action: 'suppress',
        justification: 'Known issue being addressed in next sprint deployment',
        suppressionDays: 7,
        correlationId: 'corr-123',
      };

      const result = processAcknowledgement(ack, suppressionStore, auditStore);

      assert.ok(result.success);
      assert.ok(result.suppression);
      assert.strictEqual(result.suppression.operatorId, 'ops-user-1');
      assert.ok(result.suppression.active);
    });

    it('should link audit to correlation ID', () => {
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const ack: AckAction = {
        recommendationId: 'rec-123',
        operatorId: 'ops-user-1',
        action: 'acknowledge',
        justification: 'Linking audit entry to the correlation chain',
        correlationId: 'corr-specific-123',
      };

      processAcknowledgement(ack, suppressionStore, auditStore);

      const entries = auditStore.findByCorrelation('corr-specific-123');
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].correlationId, 'corr-specific-123');
    });
  });

  // ============================================================================
  // Contract: flow_correlation_maintained
  // ============================================================================

  describe('flow_correlation_maintained', () => {
    it('should maintain correlation ID across entire flow', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore);

      // All components should share correlation ID
      assert.ok(result.correlationId, 'Should have correlation ID');
      assert.strictEqual(
        result.recommendation?.correlationId,
        result.correlationId,
        'Recommendation should share correlation'
      );
      assert.strictEqual(
        result.notification?.correlationId,
        result.correlationId,
        'Notification should share correlation'
      );
      for (const entry of result.auditEntries) {
        assert.strictEqual(
          entry.correlationId,
          result.correlationId,
          'Audit entries should share correlation'
        );
      }
    });

    it('should include SLO ID in correlation ID', () => {
      const correlationId = generateCorrelationId('security.denial_rate');
      assert.ok(correlationId.includes('security.denial_rate'));
    });

    it('should allow querying audit by correlation', () => {
      const auditStore = new AuditStore();

      auditStore.append(
        'test.action',
        { type: 'system', id: 'test' },
        { type: 'slo', id: 'slo-1' },
        'corr-findme-123'
      );
      auditStore.append(
        'test.action',
        { type: 'system', id: 'test' },
        { type: 'slo', id: 'slo-2' },
        'corr-other-456'
      );

      const found = auditStore.findByCorrelation('corr-findme-123');
      assert.strictEqual(found.length, 1);
      assert.strictEqual(found[0].target.id, 'slo-1');
    });
  });

  // ============================================================================
  // Contract: flow_dry_run_safe
  // ============================================================================

  describe('flow_dry_run_safe', () => {
    it('should not send notifications in dry-run mode', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore, {
        dryRun: true,
      });

      assert.ok(!result.notification?.sent, 'Should not send in dry-run');
      assert.ok(result.notification?.dryRun, 'Should mark as dry-run');
      assert.strictEqual(dispatcher.getSentCount(), 0, 'No notifications should be sent');
    });

    it('should not create audit entries in dry-run mode', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore, {
        dryRun: true,
      });

      assert.strictEqual(result.auditEntries.length, 0, 'No audit in dry-run');
      assert.strictEqual(auditStore.getAll().length, 0, 'Audit store should be empty');
    });

    it('should not create suppression in dry-run mode', () => {
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const ack: AckAction = {
        recommendationId: 'rec-123',
        operatorId: 'ops-user-1',
        action: 'suppress',
        justification: 'Testing dry-run suppression behavior',
        suppressionDays: 7,
        correlationId: 'corr-123',
      };

      const result = processAcknowledgement(ack, suppressionStore, auditStore, { dryRun: true });

      assert.ok(result.success);
      assert.ok(!result.suppression, 'Should not create suppression in dry-run');
      assert.ok(!result.auditEntry, 'Should not create audit in dry-run');
    });

    it('should still generate recommendations in dry-run mode', () => {
      const drift: DriftObservation = {
        sloId: 'security.denial_rate',
        currentValue: 0.08,
        baselineValue: 0.05,
        driftPercent: 60,
        severity: 'high',
        timestamp: new Date().toISOString(),
        dimensions: { provider: 'auth0' },
      };

      const dispatcher = new NotificationDispatcher();
      const suppressionStore = new SuppressionStore();
      const auditStore = new AuditStore();

      const result = executeFlow(drift, 'slack', dispatcher, suppressionStore, auditStore, {
        dryRun: true,
      });

      assert.ok(result.recommendation, 'Should still generate recommendation');
      assert.ok(result.dryRun, 'Should mark result as dry-run');
    });
  });
});
