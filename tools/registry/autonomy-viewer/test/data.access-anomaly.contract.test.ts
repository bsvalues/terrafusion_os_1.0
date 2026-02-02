/**
 * Data Access Anomaly Contract Tests
 * ====================================
 *
 * Phase VIII: Validates governance-grade anomaly detection for data access.
 *
 * Contract:
 * - anomaly_detects_volume_spikes: rows/bytes exceeding baseline thresholds
 * - anomaly_detects_frequency_spikes: access frequency exceeding baseline
 * - anomaly_detects_new_principals: first-time access to high-risk datasets
 * - anomaly_detects_unusual_exports: first-time exports, size anomalies
 * - anomaly_is_pii_clean: no query text, opaque IDs only
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Data Access Anomaly Detection
// ============================================================================

/**
 * Environment.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Dataset risk tier.
 */
type DatasetRiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Anomaly type.
 */
type AnomalyType =
  | 'volume_spike'
  | 'frequency_spike'
  | 'new_principal'
  | 'unusual_export'
  | 'access_outside_window'
  | 'scope_expansion';

/**
 * Anomaly severity.
 */
type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Access mode.
 */
type AccessMode = 'read' | 'write' | 'export' | 'admin';

/**
 * Principal type.
 */
type PrincipalType = 'user' | 'service' | 'job' | 'bi_tool' | 'api_client';

/**
 * Access event (normalized, PII-clean).
 */
interface AccessEvent {
  readonly eventId: string; // opaque sha256:
  readonly datasetId: string; // opaque sha256:
  readonly principalId: string; // opaque sha256:
  readonly principalType: PrincipalType;
  readonly environment: Environment;
  readonly accessMode: AccessMode;
  readonly timestamp: string;
  readonly rowCount?: number;
  readonly byteCount?: number;
  readonly durationMs?: number;
}

/**
 * Baseline profile for a dataset.
 */
interface DatasetBaseline {
  readonly datasetId: string;
  readonly environment: Environment;
  readonly avgRowsPerAccess: number;
  readonly avgBytesPerAccess: number;
  readonly avgAccessesPerHour: number;
  readonly knownPrincipalIds: readonly string[];
  readonly expectedAccessModes: readonly AccessMode[];
  readonly expectedAccessWindow: { startHour: number; endHour: number };
}

/**
 * Anomaly detection result.
 */
interface AnomalyResult {
  readonly anomalyId: string; // opaque sha256:
  readonly eventId: string; // opaque sha256:
  readonly datasetId: string; // opaque sha256:
  readonly principalId: string; // opaque sha256:
  readonly anomalyType: AnomalyType;
  readonly severity: AnomalySeverity;
  readonly environment: Environment;
  readonly timestamp: string;
  readonly deviation: number; // multiplier over baseline
  readonly description: string; // MUST NOT contain raw identifiers
}

/**
 * Anomaly detection thresholds.
 */
interface AnomalyThresholds {
  readonly volumeSpikeMultiplier: number;
  readonly frequencySpikeMultiplier: number;
  readonly exportSizeSpikeMultiplier: number;
  readonly newPrincipalHighRiskAlert: boolean;
}

/**
 * Anomaly detector.
 */
interface AnomalyDetector {
  detectVolumeSpike: (
    event: AccessEvent,
    baseline: DatasetBaseline,
    thresholds: AnomalyThresholds
  ) => AnomalyResult | null;
  detectFrequencySpike: (
    recentEvents: readonly AccessEvent[],
    baseline: DatasetBaseline,
    thresholds: AnomalyThresholds
  ) => AnomalyResult | null;
  detectNewPrincipal: (
    event: AccessEvent,
    baseline: DatasetBaseline,
    datasetRiskTier: DatasetRiskTier
  ) => AnomalyResult | null;
  detectUnusualExport: (
    event: AccessEvent,
    baseline: DatasetBaseline,
    thresholds: AnomalyThresholds
  ) => AnomalyResult | null;
  detectAccessOutsideWindow: (
    event: AccessEvent,
    baseline: DatasetBaseline
  ) => AnomalyResult | null;
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
 * Compute severity from deviation and risk tier.
 */
function computeSeverity(deviation: number, riskTier: DatasetRiskTier): AnomalySeverity {
  if (deviation >= 10 || riskTier === 'critical') return 'critical';
  if (deviation >= 5 || riskTier === 'high') return 'high';
  if (deviation >= 2) return 'medium';
  return 'low';
}

/**
 * Create anomaly detector.
 */
function createAnomalyDetector(): AnomalyDetector {
  return {
    detectVolumeSpike(event, baseline, thresholds) {
      const rows = event.rowCount ?? 0;
      const bytes = event.byteCount ?? 0;

      const rowDeviation = baseline.avgRowsPerAccess > 0 ? rows / baseline.avgRowsPerAccess : 0;
      const byteDeviation = baseline.avgBytesPerAccess > 0 ? bytes / baseline.avgBytesPerAccess : 0;
      const maxDeviation = Math.max(rowDeviation, byteDeviation);

      if (maxDeviation >= thresholds.volumeSpikeMultiplier) {
        return {
          anomalyId: computeOpaqueId(`anomaly-volume-${event.eventId}`),
          eventId: event.eventId,
          datasetId: event.datasetId,
          principalId: event.principalId,
          anomalyType: 'volume_spike',
          severity: computeSeverity(maxDeviation, 'high'),
          environment: event.environment,
          timestamp: new Date().toISOString(),
          deviation: maxDeviation,
          description: `Volume ${maxDeviation.toFixed(1)}x baseline`,
        };
      }
      return null;
    },

    detectFrequencySpike(recentEvents, baseline, thresholds) {
      if (recentEvents.length === 0) return null;

      // Count events in last hour
      const hourAgo = Date.now() - 3600000;
      const recentCount = recentEvents.filter(
        e => new Date(e.timestamp).getTime() > hourAgo
      ).length;
      const deviation =
        baseline.avgAccessesPerHour > 0 ? recentCount / baseline.avgAccessesPerHour : recentCount;

      if (deviation >= thresholds.frequencySpikeMultiplier) {
        const lastEvent = recentEvents[recentEvents.length - 1];
        return {
          anomalyId: computeOpaqueId(`anomaly-freq-${lastEvent.datasetId}-${Date.now()}`),
          eventId: lastEvent.eventId,
          datasetId: lastEvent.datasetId,
          principalId: lastEvent.principalId,
          anomalyType: 'frequency_spike',
          severity: computeSeverity(deviation, 'medium'),
          environment: lastEvent.environment,
          timestamp: new Date().toISOString(),
          deviation,
          description: `Frequency ${deviation.toFixed(1)}x baseline (${recentCount} accesses/hour)`,
        };
      }
      return null;
    },

    detectNewPrincipal(event, baseline, datasetRiskTier) {
      if (!baseline.knownPrincipalIds.includes(event.principalId)) {
        const severity =
          datasetRiskTier === 'critical'
            ? 'critical'
            : datasetRiskTier === 'high'
              ? 'high'
              : 'medium';
        return {
          anomalyId: computeOpaqueId(`anomaly-newprinc-${event.eventId}`),
          eventId: event.eventId,
          datasetId: event.datasetId,
          principalId: event.principalId,
          anomalyType: 'new_principal',
          severity,
          environment: event.environment,
          timestamp: new Date().toISOString(),
          deviation: 1, // binary: new or not
          description: `New principal accessing ${datasetRiskTier}-risk dataset`,
        };
      }
      return null;
    },

    detectUnusualExport(event, baseline, thresholds) {
      if (event.accessMode !== 'export') return null;

      // First-time export or size spike
      const bytes = event.byteCount ?? 0;
      const deviation = baseline.avgBytesPerAccess > 0 ? bytes / baseline.avgBytesPerAccess : 10;

      if (
        deviation >= thresholds.exportSizeSpikeMultiplier ||
        !baseline.expectedAccessModes.includes('export')
      ) {
        return {
          anomalyId: computeOpaqueId(`anomaly-export-${event.eventId}`),
          eventId: event.eventId,
          datasetId: event.datasetId,
          principalId: event.principalId,
          anomalyType: 'unusual_export',
          severity: 'high',
          environment: event.environment,
          timestamp: new Date().toISOString(),
          deviation,
          description: baseline.expectedAccessModes.includes('export')
            ? `Export size ${deviation.toFixed(1)}x baseline`
            : 'First-time export detected',
        };
      }
      return null;
    },

    detectAccessOutsideWindow(event, baseline) {
      const eventHour = new Date(event.timestamp).getHours();
      const { startHour, endHour } = baseline.expectedAccessWindow;

      const outsideWindow =
        startHour <= endHour
          ? eventHour < startHour || eventHour > endHour
          : eventHour < startHour && eventHour > endHour;

      if (outsideWindow) {
        return {
          anomalyId: computeOpaqueId(`anomaly-window-${event.eventId}`),
          eventId: event.eventId,
          datasetId: event.datasetId,
          principalId: event.principalId,
          anomalyType: 'access_outside_window',
          severity: 'medium',
          environment: event.environment,
          timestamp: new Date().toISOString(),
          deviation: 1,
          description: `Access at hour ${eventHour} outside expected window (${startHour}-${endHour})`,
        };
      }
      return null;
    },
  };
}

/**
 * Create sample access event.
 */
function createSampleEvent(options: Partial<AccessEvent> = {}): AccessEvent {
  return {
    eventId: options.eventId ?? computeOpaqueId(`event-${Date.now()}-${Math.random()}`),
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    principalId: options.principalId ?? computeOpaqueId('principal-sample'),
    principalType: options.principalType ?? 'service',
    environment: options.environment ?? 'production',
    accessMode: options.accessMode ?? 'read',
    timestamp: options.timestamp ?? new Date().toISOString(),
    rowCount: options.rowCount,
    byteCount: options.byteCount,
    durationMs: options.durationMs,
  };
}

/**
 * Create sample baseline.
 */
function createSampleBaseline(options: Partial<DatasetBaseline> = {}): DatasetBaseline {
  return {
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    environment: options.environment ?? 'production',
    avgRowsPerAccess: options.avgRowsPerAccess ?? 1000,
    avgBytesPerAccess: options.avgBytesPerAccess ?? 1000000,
    avgAccessesPerHour: options.avgAccessesPerHour ?? 10,
    knownPrincipalIds: options.knownPrincipalIds ?? [computeOpaqueId('principal-sample')],
    expectedAccessModes: options.expectedAccessModes ?? ['read'],
    expectedAccessWindow: options.expectedAccessWindow ?? { startHour: 8, endHour: 18 },
  };
}

/**
 * Create sample thresholds.
 */
function createSampleThresholds(options: Partial<AnomalyThresholds> = {}): AnomalyThresholds {
  return {
    volumeSpikeMultiplier: options.volumeSpikeMultiplier ?? 5,
    frequencySpikeMultiplier: options.frequencySpikeMultiplier ?? 3,
    exportSizeSpikeMultiplier: options.exportSizeSpikeMultiplier ?? 5,
    newPrincipalHighRiskAlert: options.newPrincipalHighRiskAlert ?? true,
  };
}

// ============================================================================
// Contract: anomaly_detects_volume_spikes
// ============================================================================

describe('Data Access Anomaly Contract', () => {
  describe('anomaly_detects_volume_spikes', () => {
    it('should detect row volume spike', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgRowsPerAccess: 1000 });
      const event = createSampleEvent({ rowCount: 10000 }); // 10x
      const thresholds = createSampleThresholds({ volumeSpikeMultiplier: 5 });

      const result = detector.detectVolumeSpike(event, baseline, thresholds);

      assert.ok(result);
      assert.strictEqual(result.anomalyType, 'volume_spike');
      assert.ok(result.deviation >= 5);
    });

    it('should detect byte volume spike', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgBytesPerAccess: 1000000 });
      const event = createSampleEvent({ byteCount: 10000000 }); // 10x
      const thresholds = createSampleThresholds({ volumeSpikeMultiplier: 5 });

      const result = detector.detectVolumeSpike(event, baseline, thresholds);

      assert.ok(result);
      assert.strictEqual(result.anomalyType, 'volume_spike');
    });

    it('should not flag normal volume', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgRowsPerAccess: 1000 });
      const event = createSampleEvent({ rowCount: 1200 }); // 1.2x
      const thresholds = createSampleThresholds({ volumeSpikeMultiplier: 5 });

      const result = detector.detectVolumeSpike(event, baseline, thresholds);

      assert.strictEqual(result, null);
    });

    it('should set severity based on deviation', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgRowsPerAccess: 100 });
      const event = createSampleEvent({ rowCount: 1500 }); // 15x
      const thresholds = createSampleThresholds({ volumeSpikeMultiplier: 5 });

      const result = detector.detectVolumeSpike(event, baseline, thresholds);

      assert.ok(result);
      assert.strictEqual(result.severity, 'critical');
    });
  });

  // ============================================================================
  // Contract: anomaly_detects_frequency_spikes
  // ============================================================================

  describe('anomaly_detects_frequency_spikes', () => {
    it('should detect frequency spike', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgAccessesPerHour: 10 });
      const thresholds = createSampleThresholds({ frequencySpikeMultiplier: 3 });

      // 50 events in last hour = 5x baseline
      const recentEvents = Array.from({ length: 50 }, () =>
        createSampleEvent({ timestamp: new Date().toISOString() })
      );

      const result = detector.detectFrequencySpike(recentEvents, baseline, thresholds);

      assert.ok(result);
      assert.strictEqual(result.anomalyType, 'frequency_spike');
    });

    it('should not flag normal frequency', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgAccessesPerHour: 10 });
      const thresholds = createSampleThresholds({ frequencySpikeMultiplier: 3 });

      // 15 events in last hour = 1.5x baseline
      const recentEvents = Array.from({ length: 15 }, () =>
        createSampleEvent({ timestamp: new Date().toISOString() })
      );

      const result = detector.detectFrequencySpike(recentEvents, baseline, thresholds);

      assert.strictEqual(result, null);
    });

    it('should handle empty event list', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline();
      const thresholds = createSampleThresholds();

      const result = detector.detectFrequencySpike([], baseline, thresholds);

      assert.strictEqual(result, null);
    });

    it('should include access count in description', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgAccessesPerHour: 5 });
      const thresholds = createSampleThresholds({ frequencySpikeMultiplier: 2 });

      const recentEvents = Array.from({ length: 20 }, () =>
        createSampleEvent({ timestamp: new Date().toISOString() })
      );

      const result = detector.detectFrequencySpike(recentEvents, baseline, thresholds);

      assert.ok(result);
      assert.ok(result.description.includes('accesses/hour'));
    });
  });

  // ============================================================================
  // Contract: anomaly_detects_new_principals
  // ============================================================================

  describe('anomaly_detects_new_principals', () => {
    it('should detect new principal on critical dataset', () => {
      const detector = createAnomalyDetector();
      const knownPrincipal = computeOpaqueId('known-principal');
      const baseline = createSampleBaseline({ knownPrincipalIds: [knownPrincipal] });

      const event = createSampleEvent({ principalId: computeOpaqueId('unknown-principal') });

      const result = detector.detectNewPrincipal(event, baseline, 'critical');

      assert.ok(result);
      assert.strictEqual(result.anomalyType, 'new_principal');
      assert.strictEqual(result.severity, 'critical');
    });

    it('should set high severity for high-risk dataset', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ knownPrincipalIds: [] });
      const event = createSampleEvent();

      const result = detector.detectNewPrincipal(event, baseline, 'high');

      assert.ok(result);
      assert.strictEqual(result.severity, 'high');
    });

    it('should not flag known principal', () => {
      const detector = createAnomalyDetector();
      const principalId = computeOpaqueId('known-principal');
      const baseline = createSampleBaseline({ knownPrincipalIds: [principalId] });
      const event = createSampleEvent({ principalId });

      const result = detector.detectNewPrincipal(event, baseline, 'critical');

      assert.strictEqual(result, null);
    });

    it('should include risk tier in description', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ knownPrincipalIds: [] });
      const event = createSampleEvent();

      const result = detector.detectNewPrincipal(event, baseline, 'high');

      assert.ok(result);
      assert.ok(result.description.includes('high-risk'));
    });
  });

  // ============================================================================
  // Contract: anomaly_detects_unusual_exports
  // ============================================================================

  describe('anomaly_detects_unusual_exports', () => {
    it('should detect first-time export', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ expectedAccessModes: ['read'] }); // no export
      const event = createSampleEvent({ accessMode: 'export', byteCount: 1000 });
      const thresholds = createSampleThresholds();

      const result = detector.detectUnusualExport(event, baseline, thresholds);

      assert.ok(result);
      assert.strictEqual(result.anomalyType, 'unusual_export');
      assert.ok(result.description.includes('First-time'));
    });

    it('should detect export size spike', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({
        expectedAccessModes: ['read', 'export'],
        avgBytesPerAccess: 1000000,
      });
      const event = createSampleEvent({ accessMode: 'export', byteCount: 10000000 }); // 10x
      const thresholds = createSampleThresholds({ exportSizeSpikeMultiplier: 5 });

      const result = detector.detectUnusualExport(event, baseline, thresholds);

      assert.ok(result);
      assert.ok(result.description.includes('baseline'));
    });

    it('should not flag non-export events', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline();
      const event = createSampleEvent({ accessMode: 'read', byteCount: 10000000 });
      const thresholds = createSampleThresholds();

      const result = detector.detectUnusualExport(event, baseline, thresholds);

      assert.strictEqual(result, null);
    });

    it('should not flag normal exports', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({
        expectedAccessModes: ['read', 'export'],
        avgBytesPerAccess: 1000000,
      });
      const event = createSampleEvent({ accessMode: 'export', byteCount: 1200000 }); // 1.2x
      const thresholds = createSampleThresholds({ exportSizeSpikeMultiplier: 5 });

      const result = detector.detectUnusualExport(event, baseline, thresholds);

      assert.strictEqual(result, null);
    });
  });

  // ============================================================================
  // Contract: anomaly_is_pii_clean
  // ============================================================================

  describe('anomaly_is_pii_clean', () => {
    it('should use opaque event IDs', () => {
      const event = createSampleEvent();

      assert.ok(event.eventId.startsWith('sha256:'));
    });

    it('should use opaque principal IDs', () => {
      const event = createSampleEvent();

      assert.ok(event.principalId.startsWith('sha256:'));
    });

    it('should use opaque anomaly IDs', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ avgRowsPerAccess: 100 });
      const event = createSampleEvent({ rowCount: 1000 });
      const thresholds = createSampleThresholds({ volumeSpikeMultiplier: 5 });

      const result = detector.detectVolumeSpike(event, baseline, thresholds);

      assert.ok(result);
      assert.ok(result.anomalyId.startsWith('sha256:'));
    });

    it('should not include raw query text', () => {
      const event = createSampleEvent();

      // Event should not have query field
      assert.ok(!('query' in event));
      assert.ok(!('sql' in event));
    });

    it('should not expose table names in description', () => {
      const detector = createAnomalyDetector();
      const baseline = createSampleBaseline({ knownPrincipalIds: [] });
      const event = createSampleEvent();

      const result = detector.detectNewPrincipal(event, baseline, 'high');

      assert.ok(result);
      assert.ok(!result.description.includes('customer'));
      assert.ok(!result.description.includes('users'));
    });
  });
});
