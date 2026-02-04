/**
 * Audit Integrity Job Contract Tests
 * ====================================
 *
 * Phase IIIo: Validates periodic audit log integrity verification.
 *
 * Contract:
 * - integrity_checksum_chain: Sequential checksums verified
 * - integrity_sequence_gaps: Detect missing sequence numbers
 * - integrity_alert_on_break: Alert raised when integrity fails
 * - integrity_job_scheduling: Regular verification runs
 * - integrity_report_generation: Produce audit integrity report
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Audit Integrity
// ============================================================================

/**
 * Audit record for integrity checking.
 */
interface AuditRecord {
  readonly id: string;
  readonly sequenceNumber: number;
  readonly checksum: string;
  readonly previousChecksum: string | null;
  readonly timestamp: string;
  readonly action: string;
}

/**
 * Integrity check result.
 */
interface IntegrityCheckResult {
  readonly passed: boolean;
  readonly recordsChecked: number;
  readonly lastValidSequence: number;
  readonly firstInvalidSequence?: number;
  readonly errors: readonly IntegrityError[];
  readonly checkedAt: string;
  readonly durationMs: number;
}

/**
 * Integrity error types.
 */
type IntegrityErrorType =
  | 'checksum_mismatch'
  | 'sequence_gap'
  | 'sequence_duplicate'
  | 'chain_break'
  | 'timestamp_anomaly';

/**
 * Integrity error detail.
 */
interface IntegrityError {
  readonly type: IntegrityErrorType;
  readonly sequenceNumber: number;
  readonly description: string;
  readonly severity: 'warning' | 'critical';
}

/**
 * Integrity job configuration.
 */
interface IntegrityJobConfig {
  readonly intervalMs: number;
  readonly batchSize: number;
  readonly maxLookbackDays: number;
  readonly alertOnFailure: boolean;
  readonly fullCheckIntervalMs: number;
}

/**
 * Job execution result.
 */
interface JobExecutionResult {
  readonly jobId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly status: 'success' | 'failure' | 'partial';
  readonly checkResult: IntegrityCheckResult;
  readonly alertsSent: number;
}

/**
 * Integrity report.
 */
interface IntegrityReport {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly period: { start: string; end: string };
  readonly summary: {
    readonly totalRecords: number;
    readonly checksPerformed: number;
    readonly errorsFound: number;
    readonly lastGoodCheckpoint: number;
  };
  readonly errors: readonly IntegrityError[];
  readonly recommendation: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_JOB_CONFIG: IntegrityJobConfig = {
  intervalMs: 3600000, // 1 hour
  batchSize: 10000,
  maxLookbackDays: 30,
  alertOnFailure: true,
  fullCheckIntervalMs: 86400000, // 24 hours
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Generate checksum for record content.
 */
function generateChecksum(content: string): string {
  const hash = content.split('').reduce((acc, c) => {
    return ((acc << 5) - acc + c.charCodeAt(0)) | 0;
  }, 0);
  return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Compute expected checksum for record.
 */
function computeExpectedChecksum(record: Omit<AuditRecord, 'checksum'>): string {
  const content = JSON.stringify({
    id: record.id,
    sequenceNumber: record.sequenceNumber,
    previousChecksum: record.previousChecksum,
    timestamp: record.timestamp,
    action: record.action,
  });
  return generateChecksum(content);
}

/**
 * Verify checksum chain for a batch of records.
 */
function verifyChecksumChain(records: readonly AuditRecord[]): IntegrityCheckResult {
  const startTime = Date.now();
  const errors: IntegrityError[] = [];
  let lastValidSequence = -1;
  let firstInvalidSequence: number | undefined;

  if (records.length === 0) {
    return {
      passed: true,
      recordsChecked: 0,
      lastValidSequence: -1,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      errors: [],
    };
  }

  // Sort by sequence number
  const sorted = [...records].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;

    // Check sequence continuity
    if (i > 0 && record.sequenceNumber !== prev!.sequenceNumber + 1) {
      if (record.sequenceNumber === prev!.sequenceNumber) {
        errors.push({
          type: 'sequence_duplicate',
          sequenceNumber: record.sequenceNumber,
          description: `Duplicate sequence number: ${record.sequenceNumber}`,
          severity: 'critical',
        });
      } else {
        errors.push({
          type: 'sequence_gap',
          sequenceNumber: prev!.sequenceNumber + 1,
          description: `Gap in sequence: expected ${prev!.sequenceNumber + 1}, got ${record.sequenceNumber}`,
          severity: 'critical',
        });
      }
      if (firstInvalidSequence === undefined) {
        firstInvalidSequence = record.sequenceNumber;
      }
    }

    // Verify previous checksum link
    if (prev && record.previousChecksum !== prev.checksum) {
      errors.push({
        type: 'chain_break',
        sequenceNumber: record.sequenceNumber,
        description: `Chain break: previousChecksum doesn't match previous record's checksum`,
        severity: 'critical',
      });
      if (firstInvalidSequence === undefined) {
        firstInvalidSequence = record.sequenceNumber;
      }
    }

    // Verify checksum
    const expected = computeExpectedChecksum({
      id: record.id,
      sequenceNumber: record.sequenceNumber,
      previousChecksum: record.previousChecksum,
      timestamp: record.timestamp,
      action: record.action,
    });
    if (record.checksum !== expected) {
      errors.push({
        type: 'checksum_mismatch',
        sequenceNumber: record.sequenceNumber,
        description: `Checksum mismatch: expected ${expected}, got ${record.checksum}`,
        severity: 'critical',
      });
      if (firstInvalidSequence === undefined) {
        firstInvalidSequence = record.sequenceNumber;
      }
    }

    // Check timestamp ordering
    if (prev && new Date(record.timestamp) < new Date(prev.timestamp)) {
      errors.push({
        type: 'timestamp_anomaly',
        sequenceNumber: record.sequenceNumber,
        description: `Timestamp out of order: ${record.timestamp} is before ${prev.timestamp}`,
        severity: 'warning',
      });
    }

    if (errors.length === 0 || errors.every(e => e.sequenceNumber > record.sequenceNumber)) {
      lastValidSequence = record.sequenceNumber;
    }
  }

  return {
    passed: errors.filter(e => e.severity === 'critical').length === 0,
    recordsChecked: records.length,
    lastValidSequence,
    firstInvalidSequence,
    errors,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Generate integrity report.
 */
function generateIntegrityReport(
  checkResults: readonly IntegrityCheckResult[],
  periodStart: Date,
  periodEnd: Date
): IntegrityReport {
  const allErrors = checkResults.flatMap(r => r.errors);
  const totalRecords = checkResults.reduce((sum, r) => sum + r.recordsChecked, 0);
  const lastGoodCheckpoint = Math.max(...checkResults.map(r => r.lastValidSequence));

  let recommendation = 'Audit log integrity verified successfully.';
  if (allErrors.length > 0) {
    const criticalCount = allErrors.filter(e => e.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendation = `CRITICAL: ${criticalCount} integrity violations detected. Immediate investigation required.`;
    } else {
      recommendation = `WARNING: ${allErrors.length} warnings detected. Review recommended.`;
    }
  }

  return {
    reportId: `integrity-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    summary: {
      totalRecords,
      checksPerformed: checkResults.length,
      errorsFound: allErrors.length,
      lastGoodCheckpoint,
    },
    errors: allErrors,
    recommendation,
  };
}

/**
 * Mock job scheduler.
 */
class IntegrityJobScheduler {
  private readonly config: IntegrityJobConfig;
  private readonly executions: JobExecutionResult[] = [];
  private lastFullCheckAt = 0;

  constructor(config: IntegrityJobConfig = DEFAULT_JOB_CONFIG) {
    this.config = config;
  }

  shouldRunFullCheck(now: number): boolean {
    return now - this.lastFullCheckAt >= this.config.fullCheckIntervalMs;
  }

  runJob(records: readonly AuditRecord[], now: number = Date.now()): JobExecutionResult {
    const startedAt = new Date(now).toISOString();
    const isFullCheck = this.shouldRunFullCheck(now);

    if (isFullCheck) {
      this.lastFullCheckAt = now;
    }

    const checkResult = verifyChecksumChain(records);

    const result: JobExecutionResult = {
      jobId: `job-${now}`,
      startedAt,
      completedAt: new Date().toISOString(),
      status: checkResult.passed ? 'success' : 'failure',
      checkResult,
      alertsSent:
        this.config.alertOnFailure && !checkResult.passed
          ? checkResult.errors.filter(e => e.severity === 'critical').length
          : 0,
    };

    this.executions.push(result);
    return result;
  }

  getExecutionHistory(): readonly JobExecutionResult[] {
    return [...this.executions];
  }

  getConfig(): IntegrityJobConfig {
    return this.config;
  }
}

/**
 * Create valid audit record chain.
 */
function createValidChain(count: number): AuditRecord[] {
  const records: AuditRecord[] = [];
  let prevChecksum: string | null = null;

  for (let i = 0; i < count; i++) {
    const recordBase = {
      id: `audit-${i}`,
      sequenceNumber: i,
      previousChecksum: prevChecksum,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      action: 'test.action',
    };
    const checksum = computeExpectedChecksum(recordBase);
    const record: AuditRecord = { ...recordBase, checksum };
    records.push(record);
    prevChecksum = checksum;
  }

  return records;
}

// ============================================================================
// Contract: integrity_checksum_chain
// ============================================================================

describe('Audit Integrity Job Contract', () => {
  describe('integrity_checksum_chain', () => {
    it('should verify valid checksum chain', () => {
      const records = createValidChain(10);
      const result = verifyChecksumChain(records);

      assert.ok(result.passed);
      assert.strictEqual(result.recordsChecked, 10);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should detect checksum mismatch', () => {
      const records = createValidChain(5);
      // Tamper with a record
      const tampered = { ...records[2], checksum: 'sha256:tamperedvalue000' };
      records[2] = tampered;

      const result = verifyChecksumChain(records);

      assert.ok(!result.passed);
      assert.ok(result.errors.some(e => e.type === 'checksum_mismatch'));
    });

    it('should detect chain break', () => {
      const records = createValidChain(5);
      // Break the chain
      const broken = { ...records[3], previousChecksum: 'sha256:wrongprevious00' };
      records[3] = broken;

      const result = verifyChecksumChain(records);

      assert.ok(!result.passed);
      assert.ok(result.errors.some(e => e.type === 'chain_break'));
    });

    it('should handle empty record set', () => {
      const result = verifyChecksumChain([]);

      assert.ok(result.passed);
      assert.strictEqual(result.recordsChecked, 0);
    });

    it('should report last valid sequence', () => {
      const records = createValidChain(10);
      // Break chain at position 7
      records[7] = { ...records[7], checksum: 'sha256:tampered0000000' };

      const result = verifyChecksumChain(records);

      assert.ok(result.lastValidSequence >= 6);
      assert.strictEqual(result.firstInvalidSequence, 7);
    });
  });

  // ============================================================================
  // Contract: integrity_sequence_gaps
  // ============================================================================

  describe('integrity_sequence_gaps', () => {
    it('should detect sequence gaps', () => {
      const records = createValidChain(5);
      // Create gap by changing sequence number
      records[3] = { ...records[3], sequenceNumber: 5 };

      const result = verifyChecksumChain(records);

      assert.ok(result.errors.some(e => e.type === 'sequence_gap'));
    });

    it('should detect duplicate sequences', () => {
      const records = createValidChain(5);
      // Create duplicate
      records[3] = { ...records[3], sequenceNumber: 2 };

      const result = verifyChecksumChain(records);

      assert.ok(result.errors.some(e => e.type === 'sequence_duplicate'));
    });

    it('should detect timestamp anomalies', () => {
      const records = createValidChain(5);
      // Create timestamp out of order
      records[3] = {
        ...records[3],
        timestamp: new Date(Date.now() - 1000000).toISOString(),
      };

      const result = verifyChecksumChain(records);

      assert.ok(result.errors.some(e => e.type === 'timestamp_anomaly'));
    });

    it('should classify gap errors as critical', () => {
      const records = createValidChain(5);
      records[3] = { ...records[3], sequenceNumber: 10 };

      const result = verifyChecksumChain(records);
      const gapError = result.errors.find(e => e.type === 'sequence_gap');

      assert.ok(gapError);
      assert.strictEqual(gapError.severity, 'critical');
    });
  });

  // ============================================================================
  // Contract: integrity_alert_on_break
  // ============================================================================

  describe('integrity_alert_on_break', () => {
    it('should alert on integrity failure', () => {
      const scheduler = new IntegrityJobScheduler({ ...DEFAULT_JOB_CONFIG, alertOnFailure: true });
      const records = createValidChain(5);
      records[2] = { ...records[2], checksum: 'sha256:tampered0000000' };

      const result = scheduler.runJob(records);

      assert.strictEqual(result.status, 'failure');
      assert.ok(result.alertsSent > 0);
    });

    it('should not alert when disabled', () => {
      const scheduler = new IntegrityJobScheduler({
        ...DEFAULT_JOB_CONFIG,
        alertOnFailure: false,
      });
      const records = createValidChain(5);
      records[2] = { ...records[2], checksum: 'sha256:tampered0000000' };

      const result = scheduler.runJob(records);

      assert.strictEqual(result.alertsSent, 0);
    });

    it('should not alert on success', () => {
      const scheduler = new IntegrityJobScheduler();
      const records = createValidChain(5);

      const result = scheduler.runJob(records);

      assert.strictEqual(result.status, 'success');
      assert.strictEqual(result.alertsSent, 0);
    });

    it('should count critical errors for alerts', () => {
      const scheduler = new IntegrityJobScheduler();
      const records = createValidChain(10);
      // Create multiple critical errors
      records[3] = { ...records[3], checksum: 'sha256:tampered0000000' };
      records[7] = { ...records[7], checksum: 'sha256:tampered0000001' };

      const result = scheduler.runJob(records);

      assert.ok(result.alertsSent >= 2);
    });
  });

  // ============================================================================
  // Contract: integrity_job_scheduling
  // ============================================================================

  describe('integrity_job_scheduling', () => {
    it('should run at configured interval', () => {
      const config = { ...DEFAULT_JOB_CONFIG, intervalMs: 3600000 };
      const scheduler = new IntegrityJobScheduler(config);

      assert.strictEqual(scheduler.getConfig().intervalMs, 3600000);
    });

    it('should track full check schedule', () => {
      const scheduler = new IntegrityJobScheduler();
      const now = Date.now();

      assert.ok(scheduler.shouldRunFullCheck(now), 'Should run first full check');

      scheduler.runJob(createValidChain(5), now);

      assert.ok(!scheduler.shouldRunFullCheck(now + 1000), 'Should not run again immediately');
    });

    it('should run full check after interval', () => {
      const config = { ...DEFAULT_JOB_CONFIG, fullCheckIntervalMs: 60000 };
      const scheduler = new IntegrityJobScheduler(config);
      const now = Date.now();

      scheduler.runJob(createValidChain(5), now);
      assert.ok(!scheduler.shouldRunFullCheck(now + 30000));
      assert.ok(scheduler.shouldRunFullCheck(now + 70000));
    });

    it('should maintain execution history', () => {
      const scheduler = new IntegrityJobScheduler();

      scheduler.runJob(createValidChain(5));
      scheduler.runJob(createValidChain(3));
      scheduler.runJob(createValidChain(7));

      const history = scheduler.getExecutionHistory();
      assert.strictEqual(history.length, 3);
    });
  });

  // ============================================================================
  // Contract: integrity_report_generation
  // ============================================================================

  describe('integrity_report_generation', () => {
    it('should generate report from check results', () => {
      const results = [
        verifyChecksumChain(createValidChain(100)),
        verifyChecksumChain(createValidChain(50)),
      ];
      const periodStart = new Date(Date.now() - 86400000);
      const periodEnd = new Date();

      const report = generateIntegrityReport(results, periodStart, periodEnd);

      assert.ok(report.reportId);
      assert.strictEqual(report.summary.totalRecords, 150);
      assert.strictEqual(report.summary.errorsFound, 0);
    });

    it('should include errors in report', () => {
      const badRecords = createValidChain(10);
      badRecords[5] = { ...badRecords[5], checksum: 'sha256:tampered0000000' };

      const results = [verifyChecksumChain(badRecords)];
      const report = generateIntegrityReport(results, new Date(), new Date());

      assert.ok(report.summary.errorsFound > 0);
      assert.ok(report.errors.length > 0);
    });

    it('should provide appropriate recommendation', () => {
      const goodResults = [verifyChecksumChain(createValidChain(10))];
      const goodReport = generateIntegrityReport(goodResults, new Date(), new Date());
      assert.ok(goodReport.recommendation.includes('successfully'));

      const badRecords = createValidChain(10);
      badRecords[5] = { ...badRecords[5], checksum: 'sha256:tampered0000000' };
      const badResults = [verifyChecksumChain(badRecords)];
      const badReport = generateIntegrityReport(badResults, new Date(), new Date());
      assert.ok(badReport.recommendation.includes('CRITICAL'));
    });

    it('should report last good checkpoint', () => {
      const records = createValidChain(20);
      records[15] = { ...records[15], checksum: 'sha256:tampered0000000' };

      const results = [verifyChecksumChain(records)];
      const report = generateIntegrityReport(results, new Date(), new Date());

      assert.ok(report.summary.lastGoodCheckpoint >= 14);
    });
  });
});
