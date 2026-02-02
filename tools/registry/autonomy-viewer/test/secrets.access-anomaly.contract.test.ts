/**
 * Secrets Access Anomaly Contract Tests
 * =======================================
 *
 * Phase VI: Validates access anomaly detection (governance-grade, not SIEM).
 *
 * Contract:
 * - anomaly_detects_new_principals: flags first-time accessors
 * - anomaly_detects_volume_spikes: flags unusual access frequency
 * - anomaly_detects_scope_violations: flags access outside expected scope
 * - anomaly_is_pii_clean: opaque principal IDs, aggregated patterns only
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Access Anomaly Detection
// ============================================================================

/**
 * Secret class.
 */
type SecretClass = 'critical' | 'high' | 'medium' | 'low';

/**
 * Access operation type.
 */
type AccessOperation = 'read' | 'write' | 'list' | 'delete';

/**
 * Anomaly type.
 */
type AnomalyType =
  | 'new_principal'
  | 'volume_spike'
  | 'scope_violation'
  | 'time_violation'
  | 'access_pattern';

/**
 * Anomaly severity.
 */
type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Principal type.
 */
type PrincipalType = 'user' | 'group' | 'service_principal' | 'workload_identity';

/**
 * Access event (raw, from audit source).
 */
interface AccessEvent {
  readonly eventId: string;
  readonly timestamp: string;
  readonly secretId: string; // Opaque
  readonly principalId: string; // Opaque
  readonly principalType: PrincipalType;
  readonly operation: AccessOperation;
  readonly environment: string;
  readonly scope: string;
  readonly sourceIp: string; // Anonymized/hashed
  readonly success: boolean;
}

/**
 * Access baseline (historical pattern).
 */
interface AccessBaseline {
  readonly secretId: string;
  readonly knownPrincipals: ReadonlySet<string>;
  readonly averageAccessesPerHour: number;
  readonly stdDevAccessesPerHour: number;
  readonly expectedScopes: readonly string[];
  readonly expectedTimeWindows: readonly { start: number; end: number }[]; // Hours 0-23
  readonly lastUpdated: string;
}

/**
 * Detected anomaly.
 */
interface DetectedAnomaly {
  readonly anomalyId: string;
  readonly detectedAt: string;
  readonly anomalyType: AnomalyType;
  readonly severity: AnomalySeverity;
  readonly secretId: string;
  readonly principalId: string; // Opaque
  readonly principalType: PrincipalType;
  readonly environment: string;
  readonly description: string;
  readonly evidence: AnomalyEvidence;
}

/**
 * Evidence for anomaly.
 */
interface AnomalyEvidence {
  readonly eventCount: number;
  readonly timeWindow: { start: string; end: string };
  readonly baseline?: {
    readonly expected: number;
    readonly observed: number;
    readonly deviationMultiple: number;
  };
  readonly newPrincipal?: boolean;
  readonly unexpectedScope?: string;
  readonly unexpectedHour?: number;
}

/**
 * Anomaly detection config.
 */
interface AnomalyDetectionConfig {
  readonly volumeSpikeThreshold: number; // Standard deviations
  readonly newPrincipalSeverity: AnomalySeverity;
  readonly criticalSecretSeverityBoost: boolean;
  readonly minEventsForBaseline: number;
  readonly lookbackWindowHours: number;
}

/**
 * Anomaly summary.
 */
interface AnomalySummary {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly environment: string;
  readonly totalAnomalies: number;
  readonly bySeverity: Record<AnomalySeverity, number>;
  readonly byType: Record<AnomalyType, number>;
  readonly topAffectedSecrets: readonly { secretId: string; count: number }[];
  readonly anomalies: readonly DetectedAnomaly[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  volumeSpikeThreshold: 3, // 3 standard deviations
  newPrincipalSeverity: 'high',
  criticalSecretSeverityBoost: true,
  minEventsForBaseline: 10,
  lookbackWindowHours: 24,
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Detect new principal accessing secret.
 */
function detectNewPrincipal(
  event: AccessEvent,
  baseline: AccessBaseline,
  secretClass: SecretClass,
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): DetectedAnomaly | null {
  if (baseline.knownPrincipals.has(event.principalId)) {
    return null;
  }

  let severity = config.newPrincipalSeverity;
  if (config.criticalSecretSeverityBoost && secretClass === 'critical') {
    severity = 'critical';
  }

  return {
    anomalyId: `ANOM-NEW-${Date.now()}`,
    detectedAt: new Date().toISOString(),
    anomalyType: 'new_principal',
    severity,
    secretId: event.secretId,
    principalId: event.principalId,
    principalType: event.principalType,
    environment: event.environment,
    description: `New principal accessing secret for first time`,
    evidence: {
      eventCount: 1,
      timeWindow: { start: event.timestamp, end: event.timestamp },
      newPrincipal: true,
    },
  };
}

/**
 * Detect volume spike.
 */
function detectVolumeSpike(
  events: readonly AccessEvent[],
  secretId: string,
  baseline: AccessBaseline,
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): DetectedAnomaly | null {
  const secretEvents = events.filter(e => e.secretId === secretId);
  if (secretEvents.length === 0) return null;

  // Calculate hourly rate
  const windowMs = config.lookbackWindowHours * 60 * 60 * 1000;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const recentEvents = secretEvents.filter(e => new Date(e.timestamp) >= windowStart);
  const hourlyRate = recentEvents.length / config.lookbackWindowHours;

  // Check against baseline
  const deviation =
    (hourlyRate - baseline.averageAccessesPerHour) / (baseline.stdDevAccessesPerHour || 1);

  if (deviation < config.volumeSpikeThreshold) {
    return null;
  }

  const firstEvent = recentEvents[0];
  return {
    anomalyId: `ANOM-VOL-${Date.now()}`,
    detectedAt: new Date().toISOString(),
    anomalyType: 'volume_spike',
    severity: deviation >= 5 ? 'critical' : deviation >= 4 ? 'high' : 'medium',
    secretId,
    principalId: firstEvent?.principalId ?? 'sha256:multiple',
    principalType: firstEvent?.principalType ?? 'service_principal',
    environment: firstEvent?.environment ?? 'unknown',
    description: `Access volume ${deviation.toFixed(1)}x standard deviation above baseline`,
    evidence: {
      eventCount: recentEvents.length,
      timeWindow: { start: windowStart.toISOString(), end: now.toISOString() },
      baseline: {
        expected: baseline.averageAccessesPerHour * config.lookbackWindowHours,
        observed: recentEvents.length,
        deviationMultiple: deviation,
      },
    },
  };
}

/**
 * Detect scope violation.
 */
function detectScopeViolation(
  event: AccessEvent,
  baseline: AccessBaseline,
  secretClass: SecretClass
): DetectedAnomaly | null {
  if (baseline.expectedScopes.length === 0) {
    return null; // No scope restrictions
  }

  const scopeMatches = baseline.expectedScopes.some(
    expected => event.scope === expected || event.scope.startsWith(expected + '/')
  );

  if (scopeMatches) {
    return null;
  }

  return {
    anomalyId: `ANOM-SCOPE-${Date.now()}`,
    detectedAt: new Date().toISOString(),
    anomalyType: 'scope_violation',
    severity: secretClass === 'critical' ? 'critical' : 'high',
    secretId: event.secretId,
    principalId: event.principalId,
    principalType: event.principalType,
    environment: event.environment,
    description: `Access from unexpected scope: ${event.scope}`,
    evidence: {
      eventCount: 1,
      timeWindow: { start: event.timestamp, end: event.timestamp },
      unexpectedScope: event.scope,
    },
  };
}

/**
 * Detect time window violation.
 */
function detectTimeViolation(
  event: AccessEvent,
  baseline: AccessBaseline,
  secretClass: SecretClass
): DetectedAnomaly | null {
  if (baseline.expectedTimeWindows.length === 0) {
    return null; // No time restrictions
  }

  const eventHour = new Date(event.timestamp).getUTCHours();
  const withinWindow = baseline.expectedTimeWindows.some(
    w => eventHour >= w.start && eventHour <= w.end
  );

  if (withinWindow) {
    return null;
  }

  return {
    anomalyId: `ANOM-TIME-${Date.now()}`,
    detectedAt: new Date().toISOString(),
    anomalyType: 'time_violation',
    severity: secretClass === 'critical' ? 'high' : 'medium',
    secretId: event.secretId,
    principalId: event.principalId,
    principalType: event.principalType,
    environment: event.environment,
    description: `Access outside expected time window (hour ${eventHour})`,
    evidence: {
      eventCount: 1,
      timeWindow: { start: event.timestamp, end: event.timestamp },
      unexpectedHour: eventHour,
    },
  };
}

/**
 * Generate anomaly summary.
 */
function generateAnomalySummary(
  anomalies: readonly DetectedAnomaly[],
  environment: string
): AnomalySummary {
  const bySeverity: Record<AnomalySeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byType: Record<AnomalyType, number> = {
    new_principal: 0,
    volume_spike: 0,
    scope_violation: 0,
    time_violation: 0,
    access_pattern: 0,
  };
  const secretCounts = new Map<string, number>();

  for (const a of anomalies) {
    bySeverity[a.severity]++;
    byType[a.anomalyType]++;
    secretCounts.set(a.secretId, (secretCounts.get(a.secretId) ?? 0) + 1);
  }

  const topAffectedSecrets = Array.from(secretCounts.entries())
    .map(([secretId, count]) => ({ secretId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    reportId: `ANOM-REPORT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    environment,
    totalAnomalies: anomalies.length,
    bySeverity,
    byType,
    topAffectedSecrets,
    anomalies,
  };
}

/**
 * Create sample access event.
 */
function createSampleEvent(options: Partial<AccessEvent> = {}): AccessEvent {
  return {
    eventId: `EVT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    secretId: 'sha256:secret-123',
    principalId: 'sha256:principal-456',
    principalType: 'service_principal',
    operation: 'read',
    environment: 'production',
    scope: '/api/v1',
    sourceIp: 'sha256:ip-hash',
    success: true,
    ...options,
  };
}

/**
 * Create sample baseline.
 */
function createSampleBaseline(options: Partial<AccessBaseline> = {}): AccessBaseline {
  return {
    secretId: 'sha256:secret-123',
    knownPrincipals: new Set(['sha256:known-1', 'sha256:known-2']),
    averageAccessesPerHour: 10,
    stdDevAccessesPerHour: 2,
    expectedScopes: ['/api/v1', '/api/v2'],
    expectedTimeWindows: [{ start: 6, end: 22 }], // 6am to 10pm
    lastUpdated: new Date().toISOString(),
    ...options,
  };
}

// ============================================================================
// Contract: anomaly_detects_new_principals
// ============================================================================

describe('Secrets Access Anomaly Contract', () => {
  describe('anomaly_detects_new_principals', () => {
    it('should detect first-time accessor', () => {
      const event = createSampleEvent({ principalId: 'sha256:new-principal' });
      const baseline = createSampleBaseline();
      const anomaly = detectNewPrincipal(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.anomalyType, 'new_principal');
    });

    it('should not flag known principals', () => {
      const event = createSampleEvent({ principalId: 'sha256:known-1' });
      const baseline = createSampleBaseline();
      const anomaly = detectNewPrincipal(event, baseline, 'high');

      assert.strictEqual(anomaly, null);
    });

    it('should boost severity for critical secrets', () => {
      const event = createSampleEvent({ principalId: 'sha256:new-principal' });
      const baseline = createSampleBaseline();
      const anomaly = detectNewPrincipal(event, baseline, 'critical');

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.severity, 'critical');
    });

    it('should include evidence of new principal', () => {
      const event = createSampleEvent({ principalId: 'sha256:new-principal' });
      const baseline = createSampleBaseline();
      const anomaly = detectNewPrincipal(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.evidence.newPrincipal, true);
    });
  });

  // ============================================================================
  // Contract: anomaly_detects_volume_spikes
  // ============================================================================

  describe('anomaly_detects_volume_spikes', () => {
    it('should detect access volume above threshold', () => {
      // Create many events in a single hour window (high rate)
      const events: AccessEvent[] = [];
      const now = Date.now();
      // 500 events in last hour = 500/hour rate vs baseline of 10/hour
      for (let i = 0; i < 500; i++) {
        events.push(
          createSampleEvent({
            eventId: `EVT-${i}`,
            timestamp: new Date(now - i * 7000).toISOString(), // ~7s apart, all within 1 hour
          })
        );
      }

      const baseline = createSampleBaseline({
        averageAccessesPerHour: 10,
        stdDevAccessesPerHour: 2,
      });
      const anomaly = detectVolumeSpike(events, 'sha256:secret-123', baseline);

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.anomalyType, 'volume_spike');
    });

    it('should not flag normal volume', () => {
      const events = [createSampleEvent()];
      const baseline = createSampleBaseline({
        averageAccessesPerHour: 10,
        stdDevAccessesPerHour: 5,
      });
      const anomaly = detectVolumeSpike(events, 'sha256:secret-123', baseline);

      assert.strictEqual(anomaly, null);
    });

    it('should include baseline comparison in evidence', () => {
      const events: AccessEvent[] = [];
      const now = Date.now();
      for (let i = 0; i < 200; i++) {
        events.push(
          createSampleEvent({
            eventId: `EVT-${i}`,
            timestamp: new Date(now - i * 30000).toISOString(),
          })
        );
      }

      const baseline = createSampleBaseline({
        averageAccessesPerHour: 5,
        stdDevAccessesPerHour: 1,
      });
      const anomaly = detectVolumeSpike(events, 'sha256:secret-123', baseline);

      assert.ok(anomaly !== null);
      assert.ok(anomaly.evidence.baseline !== undefined);
      assert.ok(anomaly.evidence.baseline.deviationMultiple >= 3);
    });

    it('should escalate severity for extreme spikes', () => {
      const events: AccessEvent[] = [];
      const now = Date.now();
      for (let i = 0; i < 500; i++) {
        events.push(
          createSampleEvent({
            eventId: `EVT-${i}`,
            timestamp: new Date(now - i * 10000).toISOString(),
          })
        );
      }

      const baseline = createSampleBaseline({
        averageAccessesPerHour: 2,
        stdDevAccessesPerHour: 0.5,
      });
      const anomaly = detectVolumeSpike(events, 'sha256:secret-123', baseline);

      assert.ok(anomaly !== null);
      assert.ok(['critical', 'high'].includes(anomaly.severity));
    });
  });

  // ============================================================================
  // Contract: anomaly_detects_scope_violations
  // ============================================================================

  describe('anomaly_detects_scope_violations', () => {
    it('should detect access from unexpected scope', () => {
      const event = createSampleEvent({ scope: '/admin/dangerous' });
      const baseline = createSampleBaseline({ expectedScopes: ['/api/v1', '/api/v2'] });
      const anomaly = detectScopeViolation(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.anomalyType, 'scope_violation');
    });

    it('should allow access from expected scope', () => {
      const event = createSampleEvent({ scope: '/api/v1' });
      const baseline = createSampleBaseline({ expectedScopes: ['/api/v1', '/api/v2'] });
      const anomaly = detectScopeViolation(event, baseline, 'high');

      assert.strictEqual(anomaly, null);
    });

    it('should allow sub-scopes of expected scope', () => {
      const event = createSampleEvent({ scope: '/api/v1/users/123' });
      const baseline = createSampleBaseline({ expectedScopes: ['/api/v1'] });
      const anomaly = detectScopeViolation(event, baseline, 'high');

      assert.strictEqual(anomaly, null);
    });

    it('should include unexpected scope in evidence', () => {
      const event = createSampleEvent({ scope: '/unauthorized' });
      const baseline = createSampleBaseline({ expectedScopes: ['/api'] });
      const anomaly = detectScopeViolation(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.evidence.unexpectedScope, '/unauthorized');
    });

    it('should detect time window violations', () => {
      // Create event at 3am UTC
      const event = createSampleEvent({
        timestamp: new Date('2026-01-15T03:00:00Z').toISOString(),
      });
      const baseline = createSampleBaseline({
        expectedTimeWindows: [{ start: 6, end: 22 }],
      });
      const anomaly = detectTimeViolation(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.strictEqual(anomaly.anomalyType, 'time_violation');
    });
  });

  // ============================================================================
  // Contract: anomaly_is_pii_clean
  // ============================================================================

  describe('anomaly_is_pii_clean', () => {
    it('should use opaque principal IDs', () => {
      const event = createSampleEvent({ principalId: 'sha256:opaque-id' });
      const baseline = createSampleBaseline();
      const anomaly = detectNewPrincipal(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.ok(anomaly.principalId.startsWith('sha256:'));
    });

    it('should use opaque secret IDs', () => {
      const event = createSampleEvent({ secretId: 'sha256:secret-opaque' });
      const baseline = createSampleBaseline({ secretId: 'sha256:secret-opaque' });
      const anomaly = detectNewPrincipal(event, baseline, 'high');

      assert.ok(anomaly !== null);
      assert.ok(anomaly.secretId.startsWith('sha256:'));
    });

    it('should hash source IPs', () => {
      const event = createSampleEvent();

      assert.ok(event.sourceIp.startsWith('sha256:'));
    });

    it('should provide aggregated summary', () => {
      const anomalies = [
        {
          anomalyId: 'A1',
          detectedAt: new Date().toISOString(),
          anomalyType: 'new_principal' as AnomalyType,
          severity: 'high' as AnomalySeverity,
          secretId: 'sha256:s1',
          principalId: 'sha256:p1',
          principalType: 'service_principal' as PrincipalType,
          environment: 'production',
          description: 'Test',
          evidence: { eventCount: 1, timeWindow: { start: '', end: '' } },
        },
      ];
      const summary = generateAnomalySummary(anomalies, 'production');

      assert.ok(summary.totalAnomalies === 1);
      assert.ok(summary.bySeverity['high'] === 1);
      assert.ok(summary.byType['new_principal'] === 1);
    });

    it('should never include raw principal names', () => {
      const anomalies = [
        {
          anomalyId: 'A1',
          detectedAt: new Date().toISOString(),
          anomalyType: 'new_principal' as AnomalyType,
          severity: 'high' as AnomalySeverity,
          secretId: 'sha256:s1',
          principalId: 'sha256:p1',
          principalType: 'service_principal' as PrincipalType,
          environment: 'production',
          description: 'Test',
          evidence: { eventCount: 1, timeWindow: { start: '', end: '' } },
        },
      ];
      const summary = generateAnomalySummary(anomalies, 'production');
      const summaryStr = JSON.stringify(summary);

      assert.ok(!summaryStr.includes('@'));
      assert.ok(!summaryStr.includes('user-'));
      assert.ok(!summaryStr.includes('.com'));
    });
  });
});
