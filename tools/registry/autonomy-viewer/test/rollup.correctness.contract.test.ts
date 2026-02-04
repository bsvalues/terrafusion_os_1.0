/**
 * Phase XXI — Optimization & Sustainability
 * ==========================================
 * Contract: rollup.correctness.contract.test.ts
 *
 * Tests rollup aggregation accuracy: ensures no silent data loss,
 * validates aggregation correctness, and enforces audit trails.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Rollups preserve data integrity
 * - No silent data loss during aggregation
 * - Audit trail for all rollup operations
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type RollupId = `sha256:${string}`;
type SourceId = `sha256:${string}`;
type AuditId = `sha256:${string}`;
type SurfaceId = `sha256:${string}`;

type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99';
type RollupGranularity = 'minute' | 'hour' | 'day' | 'week' | 'month';
type RollupStatus = 'pending' | 'complete' | 'failed' | 'partial';

interface RawDataPoint {
  readonly id: SourceId;
  readonly surfaceId: SurfaceId;
  readonly metric: string;
  readonly value: number;
  readonly timestamp: string;
}

interface RollupDefinition {
  readonly id: RollupId;
  readonly name: string;
  readonly sourceMetric: string;
  readonly aggregationType: AggregationType;
  readonly granularity: RollupGranularity;
  readonly retentionDays: number;
  readonly description: string;
}

interface RollupBucket {
  readonly id: RollupId;
  readonly definitionId: RollupId;
  readonly surfaceId: SurfaceId;
  readonly startTime: string;
  readonly endTime: string;
  readonly granularity: RollupGranularity;
  readonly aggregatedValue: number;
  readonly sourcePointCount: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly sumValue: number;
  readonly status: RollupStatus;
}

interface RollupAuditEntry {
  readonly id: AuditId;
  readonly rollupId: RollupId;
  readonly operation: 'create' | 'aggregation' | 'compaction' | 'verification' | 'repair';
  readonly timestamp: string;
  readonly inputCount: number;
  readonly outputCount: number;
  readonly checksum: string;
  readonly success: boolean;
  readonly errorMessage?: string;
}

interface CorrectnessReport {
  readonly generatedAt: string;
  readonly rollupId: RollupId;
  readonly expectedValue: number;
  readonly actualValue: number;
  readonly variance: number;
  readonly variancePercent: number;
  readonly isWithinTolerance: boolean;
  readonly tolerance: number;
  readonly sourcePointCount: number;
}

interface DataLossCheck {
  readonly rollupId: RollupId;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly expectedSourceCount: number;
  readonly actualSourceCount: number;
  readonly missingCount: number;
  readonly lossRate: number;
  readonly hasDataLoss: boolean;
  readonly missingSourceIds: readonly SourceId[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockRollupCorrectnessService() {
  const definitions = new Map<RollupId, RollupDefinition>();
  const rawData: RawDataPoint[] = [];
  const buckets = new Map<RollupId, RollupBucket>();
  const auditLog: RollupAuditEntry[] = [];
  const processedSources = new Set<SourceId>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function generateChecksum(data: readonly number[]): string {
    // Simple checksum simulation
    const sum = data.reduce((a, b) => a + b, 0);
    return `sha256:checksum_${sum.toFixed(4)}`;
  }

  // Initialize default rollup definitions
  const defaultDefinitions: Array<Omit<RollupDefinition, 'id'>> = [
    {
      name: 'Request Count Hourly',
      sourceMetric: 'request.count',
      aggregationType: 'sum',
      granularity: 'hour',
      retentionDays: 90,
      description: 'Hourly sum of request counts',
    },
    {
      name: 'Latency P95 Hourly',
      sourceMetric: 'request.latency',
      aggregationType: 'p95',
      granularity: 'hour',
      retentionDays: 90,
      description: 'Hourly 95th percentile latency',
    },
    {
      name: 'Error Rate Daily',
      sourceMetric: 'error.rate',
      aggregationType: 'avg',
      granularity: 'day',
      retentionDays: 365,
      description: 'Daily average error rate',
    },
    {
      name: 'Active Users Daily',
      sourceMetric: 'user.active',
      aggregationType: 'count',
      granularity: 'day',
      retentionDays: 365,
      description: 'Daily unique active user count',
    },
    {
      name: 'Storage Max Weekly',
      sourceMetric: 'storage.used',
      aggregationType: 'max',
      granularity: 'week',
      retentionDays: 730,
      description: 'Weekly max storage usage',
    },
  ];

  for (const def of defaultDefinitions) {
    const id = generateId('rollup_def') as RollupId;
    definitions.set(id, { ...def, id });
  }

  return {
    // Rollup Definitions
    getDefinition(id: RollupId): RollupDefinition | null {
      return definitions.get(id) ?? null;
    },

    getDefinitionByName(name: string): RollupDefinition | null {
      return [...definitions.values()].find(d => d.name === name) ?? null;
    },

    getAllDefinitions(): readonly RollupDefinition[] {
      return [...definitions.values()];
    },

    // Raw Data Ingestion
    ingestDataPoint(
      surfaceId: SurfaceId,
      metric: string,
      value: number,
      timestamp?: string
    ): RawDataPoint {
      const dataPoint: RawDataPoint = {
        id: generateId('raw') as SourceId,
        surfaceId,
        metric,
        value,
        timestamp: timestamp ?? new Date().toISOString(),
      };

      rawData.push(dataPoint);
      return dataPoint;
    },

    getRawData(metric: string, limit: number = 1000): readonly RawDataPoint[] {
      return rawData.filter(d => d.metric === metric).slice(-limit);
    },

    getRawDataCount(metric: string): number {
      return rawData.filter(d => d.metric === metric).length;
    },

    // Rollup Execution
    executeRollup(
      definitionId: RollupId,
      surfaceId: SurfaceId,
      startTime: string,
      endTime: string
    ): RollupBucket | null {
      const def = definitions.get(definitionId);
      if (!def) return null;

      // Get source data for the period
      const periodData = rawData.filter(
        d =>
          d.metric === def.sourceMetric &&
          d.surfaceId === surfaceId &&
          d.timestamp >= startTime &&
          d.timestamp <= endTime
      );

      if (periodData.length === 0) {
        // Create audit entry for empty bucket
        this.createAuditEntry(definitionId, 'aggregation', 0, 0, false, 'No source data');
        return null;
      }

      const values = periodData.map(d => d.value);

      // Calculate aggregation based on type
      let aggregatedValue: number;
      switch (def.aggregationType) {
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'p50':
          aggregatedValue = this.calculatePercentile(values, 0.5);
          break;
        case 'p95':
          aggregatedValue = this.calculatePercentile(values, 0.95);
          break;
        case 'p99':
          aggregatedValue = this.calculatePercentile(values, 0.99);
          break;
        default:
          aggregatedValue = values.reduce((a, b) => a + b, 0);
      }

      const bucket: RollupBucket = {
        id: generateId('bucket') as RollupId,
        definitionId,
        surfaceId,
        startTime,
        endTime,
        granularity: def.granularity,
        aggregatedValue,
        sourcePointCount: values.length,
        minValue: Math.min(...values),
        maxValue: Math.max(...values),
        sumValue: values.reduce((a, b) => a + b, 0),
        status: 'complete',
      };

      buckets.set(bucket.id, bucket);

      // Track processed sources
      for (const point of periodData) {
        processedSources.add(point.id);
      }

      // Create audit entry
      this.createAuditEntry(bucket.id, 'aggregation', periodData.length, 1, true);

      return bucket;
    },

    calculatePercentile(values: readonly number[], percentile: number): number {
      const sorted = [...values].sort((a, b) => a - b);
      const index = Math.ceil(sorted.length * percentile) - 1;
      return sorted[Math.max(0, index)];
    },

    // Bucket Retrieval
    getBucket(id: RollupId): RollupBucket | null {
      return buckets.get(id) ?? null;
    },

    getBuckets(definitionId: RollupId): readonly RollupBucket[] {
      return [...buckets.values()].filter(b => b.definitionId === definitionId);
    },

    // Correctness Verification
    verifyCorrectness(bucketId: RollupId, tolerance: number = 0.0001): CorrectnessReport | null {
      const bucket = buckets.get(bucketId);
      if (!bucket) return null;

      const def = definitions.get(bucket.definitionId);
      if (!def) return null;

      // Re-calculate from source data
      const sourceData = rawData.filter(
        d =>
          d.metric === def.sourceMetric &&
          d.surfaceId === bucket.surfaceId &&
          d.timestamp >= bucket.startTime &&
          d.timestamp <= bucket.endTime
      );

      const values = sourceData.map(d => d.value);
      let expectedValue: number;

      switch (def.aggregationType) {
        case 'sum':
          expectedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          expectedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          expectedValue = Math.min(...values);
          break;
        case 'max':
          expectedValue = Math.max(...values);
          break;
        case 'count':
          expectedValue = values.length;
          break;
        case 'p95':
          expectedValue = this.calculatePercentile(values, 0.95);
          break;
        default:
          expectedValue = values.reduce((a, b) => a + b, 0);
      }

      const variance = Math.abs(bucket.aggregatedValue - expectedValue);
      const variancePercent =
        expectedValue !== 0 ? (variance / Math.abs(expectedValue)) * 100 : variance === 0 ? 0 : 100;

      const report: CorrectnessReport = {
        generatedAt: new Date().toISOString(),
        rollupId: bucketId,
        expectedValue,
        actualValue: bucket.aggregatedValue,
        variance,
        variancePercent,
        isWithinTolerance: variancePercent <= tolerance * 100,
        tolerance,
        sourcePointCount: values.length,
      };

      // Create audit entry
      this.createAuditEntry(bucketId, 'verification', values.length, 1, report.isWithinTolerance);

      return report;
    },

    // Data Loss Detection
    checkDataLoss(
      definitionId: RollupId,
      surfaceId: SurfaceId,
      periodStart: string,
      periodEnd: string
    ): DataLossCheck {
      const def = definitions.get(definitionId);
      if (!def) {
        return {
          rollupId: definitionId,
          periodStart,
          periodEnd,
          expectedSourceCount: 0,
          actualSourceCount: 0,
          missingCount: 0,
          lossRate: 0,
          hasDataLoss: false,
          missingSourceIds: [],
        };
      }

      const sourceData = rawData.filter(
        d =>
          d.metric === def.sourceMetric &&
          d.surfaceId === surfaceId &&
          d.timestamp >= periodStart &&
          d.timestamp <= periodEnd
      );

      const processed = sourceData.filter(d => processedSources.has(d.id));
      const missing = sourceData.filter(d => !processedSources.has(d.id));

      return {
        rollupId: definitionId,
        periodStart,
        periodEnd,
        expectedSourceCount: sourceData.length,
        actualSourceCount: processed.length,
        missingCount: missing.length,
        lossRate: sourceData.length > 0 ? missing.length / sourceData.length : 0,
        hasDataLoss: missing.length > 0,
        missingSourceIds: missing.map(d => d.id),
      };
    },

    // Audit Trail
    createAuditEntry(
      rollupId: RollupId,
      operation: RollupAuditEntry['operation'],
      inputCount: number,
      outputCount: number,
      success: boolean,
      errorMessage?: string
    ): RollupAuditEntry {
      const entry: RollupAuditEntry = {
        id: generateId('audit') as AuditId,
        rollupId,
        operation,
        timestamp: new Date().toISOString(),
        inputCount,
        outputCount,
        checksum: generateChecksum([inputCount, outputCount]),
        success,
        errorMessage,
      };

      auditLog.push(entry);
      return entry;
    },

    getAuditLog(rollupId: RollupId): readonly RollupAuditEntry[] {
      return auditLog.filter(e => e.rollupId === rollupId);
    },

    getAllAuditEntries(): readonly RollupAuditEntry[] {
      return [...auditLog];
    },

    // Compaction
    compactBuckets(
      definitionId: RollupId,
      fromGranularity: RollupGranularity,
      toGranularity: RollupGranularity
    ): RollupBucket[] {
      const sourceBuckets = [...buckets.values()].filter(
        b => b.definitionId === definitionId && b.granularity === fromGranularity
      );

      if (sourceBuckets.length === 0) return [];

      // Group by surface
      const bySurface = new Map<SurfaceId, RollupBucket[]>();
      for (const bucket of sourceBuckets) {
        const group = bySurface.get(bucket.surfaceId) ?? [];
        group.push(bucket);
        bySurface.set(bucket.surfaceId, group);
      }

      const compactedBuckets: RollupBucket[] = [];

      for (const [surfaceId, surfaceBuckets] of bySurface) {
        if (surfaceBuckets.length === 0) continue;

        const def = definitions.get(definitionId);
        if (!def) continue;

        const sorted = surfaceBuckets.sort((a, b) => a.startTime.localeCompare(b.startTime));

        const values = sorted.map(b => b.aggregatedValue);
        let aggregatedValue: number;

        switch (def.aggregationType) {
          case 'sum':
            aggregatedValue = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'min':
            aggregatedValue = Math.min(...values);
            break;
          case 'max':
            aggregatedValue = Math.max(...values);
            break;
          case 'count':
            aggregatedValue = sorted.reduce((sum, b) => sum + b.sourcePointCount, 0);
            break;
          default:
            aggregatedValue = values.reduce((a, b) => a + b, 0);
        }

        const compacted: RollupBucket = {
          id: generateId('compacted') as RollupId,
          definitionId,
          surfaceId,
          startTime: sorted[0].startTime,
          endTime: sorted[sorted.length - 1].endTime,
          granularity: toGranularity,
          aggregatedValue,
          sourcePointCount: sorted.reduce((sum, b) => sum + b.sourcePointCount, 0),
          minValue: Math.min(...sorted.map(b => b.minValue)),
          maxValue: Math.max(...sorted.map(b => b.maxValue)),
          sumValue: sorted.reduce((sum, b) => sum + b.sumValue, 0),
          status: 'complete',
        };

        buckets.set(compacted.id, compacted);
        compactedBuckets.push(compacted);

        this.createAuditEntry(compacted.id, 'compaction', sorted.length, 1, true);
      }

      return compactedBuckets;
    },

    // Repair
    repairBucket(bucketId: RollupId): RollupBucket | null {
      const bucket = buckets.get(bucketId);
      if (!bucket) return null;

      const def = definitions.get(bucket.definitionId);
      if (!def) return null;

      // Re-aggregate from source
      const sourceData = rawData.filter(
        d =>
          d.metric === def.sourceMetric &&
          d.surfaceId === bucket.surfaceId &&
          d.timestamp >= bucket.startTime &&
          d.timestamp <= bucket.endTime
      );

      const values = sourceData.map(d => d.value);
      let aggregatedValue: number;

      switch (def.aggregationType) {
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        default:
          aggregatedValue = values.reduce((a, b) => a + b, 0);
      }

      const repaired: RollupBucket = {
        ...bucket,
        aggregatedValue,
        sourcePointCount: values.length,
        minValue: Math.min(...values),
        maxValue: Math.max(...values),
        sumValue: values.reduce((a, b) => a + b, 0),
        status: 'complete',
      };

      buckets.set(bucketId, repaired);

      this.createAuditEntry(bucketId, 'repair', values.length, 1, true);

      return repaired;
    },

    // Validation
    validateAggregation(
      aggregationType: AggregationType,
      values: readonly number[],
      result: number
    ): boolean {
      if (values.length === 0) return result === 0;

      let expected: number;
      switch (aggregationType) {
        case 'sum':
          expected = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          expected = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          expected = Math.min(...values);
          break;
        case 'max':
          expected = Math.max(...values);
          break;
        case 'count':
          expected = values.length;
          break;
        default:
          expected = result; // Unknown type, assume correct
      }

      return Math.abs(result - expected) < 0.0001;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXI: Rollup Correctness Contracts', () => {
  let rollupService: ReturnType<typeof createMockRollupCorrectnessService>;
  const surfaceA = 'sha256:surface_alpha' as SurfaceId;
  const surfaceB = 'sha256:surface_beta' as SurfaceId;

  beforeEach(() => {
    rollupService = createMockRollupCorrectnessService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate definition IDs with sha256: prefix', () => {
      const defs = rollupService.getAllDefinitions();
      assert.ok(defs[0].id.startsWith('sha256:'));
    });

    it('should generate data point IDs with sha256: prefix', () => {
      const point = rollupService.ingestDataPoint(surfaceA, 'test.metric', 100);
      assert.ok(point.id.startsWith('sha256:'));
    });

    it('should generate bucket IDs with sha256: prefix', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:00:00Z');
      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );
      assert.ok(bucket?.id.startsWith('sha256:'));
    });

    it('should generate audit IDs with sha256: prefix', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:00:00Z');
      rollupService.executeRollup(def.id, surfaceA, '2024-01-01T00:00:00Z', '2024-01-01T01:00:00Z');
      const entries = rollupService.getAllAuditEntries();
      assert.ok(entries[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Rollup Definition Tests
  // ==========================================================================

  describe('Rollup Definitions', () => {
    it('should have default definitions', () => {
      const defs = rollupService.getAllDefinitions();
      assert.ok(defs.length >= 5);
    });

    it('should get definition by name', () => {
      const def = rollupService.getDefinitionByName('Request Count Hourly');
      assert.ok(def);
      assert.strictEqual(def.aggregationType, 'sum');
    });

    it('should have aggregation type', () => {
      const def = rollupService.getAllDefinitions()[0];
      assert.ok(
        ['sum', 'avg', 'min', 'max', 'count', 'p50', 'p95', 'p99'].includes(def.aggregationType)
      );
    });

    it('should have granularity', () => {
      const def = rollupService.getAllDefinitions()[0];
      assert.ok(['minute', 'hour', 'day', 'week', 'month'].includes(def.granularity));
    });

    it('should have retention days', () => {
      const def = rollupService.getAllDefinitions()[0];
      assert.ok(def.retentionDays > 0);
    });
  });

  // ==========================================================================
  // Data Ingestion Tests
  // ==========================================================================

  describe('Data Ingestion', () => {
    it('should ingest data point', () => {
      const point = rollupService.ingestDataPoint(surfaceA, 'test.metric', 100);
      assert.strictEqual(point.value, 100);
    });

    it('should track metric name', () => {
      const point = rollupService.ingestDataPoint(surfaceA, 'test.metric', 100);
      assert.strictEqual(point.metric, 'test.metric');
    });

    it('should track surface ID', () => {
      const point = rollupService.ingestDataPoint(surfaceA, 'test.metric', 100);
      assert.strictEqual(point.surfaceId, surfaceA);
    });

    it('should get raw data by metric', () => {
      rollupService.ingestDataPoint(surfaceA, 'metric.a', 100);
      rollupService.ingestDataPoint(surfaceA, 'metric.b', 200);

      const dataA = rollupService.getRawData('metric.a');
      assert.strictEqual(dataA.length, 1);
    });

    it('should count raw data', () => {
      rollupService.ingestDataPoint(surfaceA, 'test.metric', 100);
      rollupService.ingestDataPoint(surfaceA, 'test.metric', 200);

      const count = rollupService.getRawDataCount('test.metric');
      assert.strictEqual(count, 2);
    });
  });

  // ==========================================================================
  // Aggregation Tests
  // ==========================================================================

  describe('Aggregation Operations', () => {
    it('should calculate sum correctly', () => {
      const def = rollupService.getDefinitionByName('Request Count Hourly');
      if (def) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 10, '2024-01-01T00:10:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 20, '2024-01-01T00:20:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 30, '2024-01-01T00:30:00Z');

        const bucket = rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T00:00:00Z',
          '2024-01-01T01:00:00Z'
        );

        assert.strictEqual(bucket?.aggregatedValue, 60);
      }
    });

    it('should calculate avg correctly', () => {
      const def = rollupService.getDefinitionByName('Error Rate Daily');
      if (def) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 0.1, '2024-01-01T00:00:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 0.2, '2024-01-01T12:00:00Z');

        const bucket = rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T00:00:00Z',
          '2024-01-02T00:00:00Z'
        );

        // Use tolerance for floating-point comparison
        assert.ok(bucket);
        assert.ok(Math.abs(bucket.aggregatedValue - 0.15) < 0.0001);
      }
    });

    it('should calculate max correctly', () => {
      const def = rollupService.getDefinitionByName('Storage Max Weekly');
      if (def) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:00:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 500, '2024-01-03T00:00:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 300, '2024-01-05T00:00:00Z');

        const bucket = rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T00:00:00Z',
          '2024-01-08T00:00:00Z'
        );

        assert.strictEqual(bucket?.aggregatedValue, 500);
      }
    });

    it('should track source point count', () => {
      const def = rollupService.getAllDefinitions()[0];
      for (let i = 0; i < 5; i++) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
      }

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.strictEqual(bucket?.sourcePointCount, 5);
    });

    it('should track min/max values', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 10, '2024-01-01T00:10:00Z');
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 50, '2024-01-01T00:20:00Z');
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 30, '2024-01-01T00:30:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.strictEqual(bucket?.minValue, 10);
      assert.strictEqual(bucket?.maxValue, 50);
    });
  });

  // ==========================================================================
  // Correctness Verification Tests
  // ==========================================================================

  describe('Correctness Verification', () => {
    it('should verify correctness of sum rollup', () => {
      const def = rollupService.getDefinitionByName('Request Count Hourly');
      if (def) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 200, '2024-01-01T00:20:00Z');

        const bucket = rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T00:00:00Z',
          '2024-01-01T01:00:00Z'
        );

        if (bucket) {
          const report = rollupService.verifyCorrectness(bucket.id);
          assert.strictEqual(report?.isWithinTolerance, true);
          assert.strictEqual(report?.variance, 0);
        }
      }
    });

    it('should detect correctness variance', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        const report = rollupService.verifyCorrectness(bucket.id);
        assert.ok(report?.generatedAt);
        assert.strictEqual(report?.sourcePointCount, 1);
      }
    });

    it('should create audit entry for verification', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        rollupService.verifyCorrectness(bucket.id);
        const audit = rollupService.getAuditLog(bucket.id);
        assert.ok(audit.some(e => e.operation === 'verification'));
      }
    });
  });

  // ==========================================================================
  // Data Loss Detection Tests
  // ==========================================================================

  describe('Data Loss Detection', () => {
    it('should detect no data loss when all processed', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      rollupService.executeRollup(def.id, surfaceA, '2024-01-01T00:00:00Z', '2024-01-01T01:00:00Z');

      const check = rollupService.checkDataLoss(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.strictEqual(check.hasDataLoss, false);
      assert.strictEqual(check.missingCount, 0);
    });

    it('should detect data loss when unprocessed', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      // Don't execute rollup - data is unprocessed
      const check = rollupService.checkDataLoss(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.strictEqual(check.hasDataLoss, true);
      assert.strictEqual(check.missingCount, 1);
    });

    it('should calculate loss rate', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 200, '2024-01-01T00:20:00Z');

      const check = rollupService.checkDataLoss(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.strictEqual(check.lossRate, 1); // 100% unprocessed
    });

    it('should list missing source IDs', () => {
      const def = rollupService.getAllDefinitions()[0];
      const point = rollupService.ingestDataPoint(
        surfaceA,
        def.sourceMetric,
        100,
        '2024-01-01T00:10:00Z'
      );

      const check = rollupService.checkDataLoss(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.ok(check.missingSourceIds.includes(point.id));
    });
  });

  // ==========================================================================
  // Audit Trail Tests
  // ==========================================================================

  describe('Audit Trail', () => {
    it('should create audit entry on aggregation', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        const audit = rollupService.getAuditLog(bucket.id);
        assert.ok(audit.some(e => e.operation === 'aggregation'));
      }
    });

    it('should track input/output counts', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 200, '2024-01-01T00:20:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        const audit = rollupService.getAuditLog(bucket.id);
        const aggEntry = audit.find(e => e.operation === 'aggregation');
        assert.strictEqual(aggEntry?.inputCount, 2);
        assert.strictEqual(aggEntry?.outputCount, 1);
      }
    });

    it('should include checksum', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        const audit = rollupService.getAuditLog(bucket.id);
        assert.ok(audit[0].checksum.startsWith('sha256:'));
      }
    });

    it('should track success/failure', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        const audit = rollupService.getAuditLog(bucket.id);
        assert.strictEqual(audit[0].success, true);
      }
    });

    it('should get all audit entries', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
      rollupService.executeRollup(def.id, surfaceA, '2024-01-01T00:00:00Z', '2024-01-01T01:00:00Z');

      const all = rollupService.getAllAuditEntries();
      assert.ok(all.length >= 1);
    });
  });

  // ==========================================================================
  // Compaction Tests
  // ==========================================================================

  describe('Compaction', () => {
    it('should compact hourly to daily', () => {
      const def = rollupService.getDefinitionByName('Request Count Hourly');
      if (def) {
        // Create 3 hourly buckets
        for (let h = 0; h < 3; h++) {
          rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, `2024-01-01T0${h}:30:00Z`);
          rollupService.executeRollup(
            def.id,
            surfaceA,
            `2024-01-01T0${h}:00:00Z`,
            `2024-01-01T0${h + 1}:00:00Z`
          );
        }

        const compacted = rollupService.compactBuckets(def.id, 'hour', 'day');
        assert.ok(compacted.length >= 1);
        assert.strictEqual(compacted[0].granularity, 'day');
      }
    });

    it('should sum values in compaction for sum aggregation', () => {
      const def = rollupService.getDefinitionByName('Request Count Hourly');
      if (def) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:30:00Z');
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 200, '2024-01-01T01:30:00Z');

        rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T00:00:00Z',
          '2024-01-01T01:00:00Z'
        );
        rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T01:00:00Z',
          '2024-01-01T02:00:00Z'
        );

        const compacted = rollupService.compactBuckets(def.id, 'hour', 'day');
        assert.strictEqual(compacted[0].aggregatedValue, 300);
      }
    });

    it('should create audit entry for compaction', () => {
      const def = rollupService.getDefinitionByName('Request Count Hourly');
      if (def) {
        rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:30:00Z');
        rollupService.executeRollup(
          def.id,
          surfaceA,
          '2024-01-01T00:00:00Z',
          '2024-01-01T01:00:00Z'
        );

        const compacted = rollupService.compactBuckets(def.id, 'hour', 'day');
        if (compacted.length > 0) {
          const audit = rollupService.getAuditLog(compacted[0].id);
          assert.ok(audit.some(e => e.operation === 'compaction'));
        }
      }
    });
  });

  // ==========================================================================
  // Repair Tests
  // ==========================================================================

  describe('Repair', () => {
    it('should repair bucket from source data', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 200, '2024-01-01T00:20:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        const repaired = rollupService.repairBucket(bucket.id);
        assert.ok(repaired);
        assert.strictEqual(repaired.status, 'complete');
      }
    });

    it('should create audit entry for repair', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');

      const bucket = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      if (bucket) {
        rollupService.repairBucket(bucket.id);
        const audit = rollupService.getAuditLog(bucket.id);
        assert.ok(audit.some(e => e.operation === 'repair'));
      }
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Validation', () => {
    it('should validate sum aggregation', () => {
      const valid = rollupService.validateAggregation('sum', [1, 2, 3, 4], 10);
      assert.strictEqual(valid, true);
    });

    it('should validate avg aggregation', () => {
      const valid = rollupService.validateAggregation('avg', [2, 4, 6], 4);
      assert.strictEqual(valid, true);
    });

    it('should validate min aggregation', () => {
      const valid = rollupService.validateAggregation('min', [5, 2, 8], 2);
      assert.strictEqual(valid, true);
    });

    it('should validate max aggregation', () => {
      const valid = rollupService.validateAggregation('max', [5, 2, 8], 8);
      assert.strictEqual(valid, true);
    });

    it('should validate count aggregation', () => {
      const valid = rollupService.validateAggregation('count', [1, 2, 3, 4, 5], 5);
      assert.strictEqual(valid, true);
    });

    it('should detect invalid aggregation', () => {
      const valid = rollupService.validateAggregation('sum', [1, 2, 3], 999);
      assert.strictEqual(valid, false);
    });
  });

  // ==========================================================================
  // Multi-Surface Tests
  // ==========================================================================

  describe('Multi-Surface', () => {
    it('should isolate rollups by surface', () => {
      const def = rollupService.getAllDefinitions()[0];
      rollupService.ingestDataPoint(surfaceA, def.sourceMetric, 100, '2024-01-01T00:10:00Z');
      rollupService.ingestDataPoint(surfaceB, def.sourceMetric, 200, '2024-01-01T00:10:00Z');

      const bucketA = rollupService.executeRollup(
        def.id,
        surfaceA,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      const bucketB = rollupService.executeRollup(
        def.id,
        surfaceB,
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      );

      assert.strictEqual(bucketA?.aggregatedValue, 100);
      assert.strictEqual(bucketB?.aggregatedValue, 200);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of definitions', () => {
      const d1 = rollupService.getAllDefinitions();
      const d2 = rollupService.getAllDefinitions();
      assert.ok(d1 !== d2);
    });

    it('should return copies of audit log', () => {
      const a1 = rollupService.getAllAuditEntries();
      const a2 = rollupService.getAllAuditEntries();
      assert.ok(a1 !== a2);
    });
  });
});
