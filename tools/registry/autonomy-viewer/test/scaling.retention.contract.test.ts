/**
 * Scaling Hardening: Retention & Cost Ceiling Contract Tests
 *
 * Phase VIf - Governance plane scaling for bounded storage and cost control.
 *
 * CONTRACT SURFACE:
 * - Storage Bounds: Maximum storage per entity type and aggregate
 * - Compaction: Event log compaction with governance-grade audit preservation
 * - Rollups: Time-series rollup for metrics and evidence
 * - Cost Ceilings: Budget-aware retention policies
 *
 * INVARIANTS:
 * - Compaction preserves audit trail integrity (checksums, chain)
 * - Rollups are lossless for governance dimensions (allowlist only)
 * - Cost ceilings are enforced before storage limits
 * - Retention policies are immutable once applied
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Retention tier for data lifecycle
 */
type RetentionTier = 'hot' | 'warm' | 'cold' | 'archive' | 'deleted';

/**
 * Entity type for retention policy scoping
 */
type EntityType =
  | 'governance_event'
  | 'evidence_pack'
  | 'audit_log'
  | 'posture_snapshot'
  | 'anomaly_finding'
  | 'drift_event';

/**
 * Compaction strategy
 */
type CompactionStrategy = 'merge' | 'tombstone' | 'snapshot' | 'rollup';

/**
 * Retention policy definition
 */
interface RetentionPolicy {
  readonly policy_id: string;
  readonly entity_type: EntityType;
  readonly hot_duration_days: number;
  readonly warm_duration_days: number;
  readonly cold_duration_days: number;
  readonly archive_duration_days: number;
  readonly total_retention_days: number;
  readonly compaction_strategy: CompactionStrategy;
  readonly cost_ceiling_gb: number;
  readonly is_immutable: boolean;
}

/**
 * Storage metrics for an entity type
 */
interface StorageMetrics {
  readonly entity_type: EntityType;
  readonly total_bytes: number;
  readonly hot_bytes: number;
  readonly warm_bytes: number;
  readonly cold_bytes: number;
  readonly archive_bytes: number;
  readonly record_count: number;
  readonly oldest_record_at: string;
  readonly newest_record_at: string;
}

/**
 * Compaction result
 */
interface CompactionResult {
  readonly entity_type: EntityType;
  readonly records_before: number;
  readonly records_after: number;
  readonly bytes_before: number;
  readonly bytes_after: number;
  readonly compaction_ratio: number;
  readonly audit_chain_preserved: boolean;
  readonly checksum_before: string;
  readonly checksum_after: string;
  readonly compacted_at: string;
}

/**
 * Rollup definition
 */
interface RollupDefinition {
  readonly rollup_id: string;
  readonly source_entity_type: EntityType;
  readonly rollup_interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  readonly dimensions: readonly string[];
  readonly aggregations: readonly ('count' | 'sum' | 'avg' | 'min' | 'max' | 'p99')[];
  readonly retention_days: number;
}

/**
 * Rollup result
 */
interface RollupResult {
  readonly rollup_id: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly source_records: number;
  readonly dimension_values: Record<string, string>;
  readonly aggregated_values: Record<string, number>;
  readonly checksum: string;
}

/**
 * Cost status for budget tracking
 */
interface CostStatus {
  readonly entity_type: EntityType;
  readonly storage_gb: number;
  readonly ceiling_gb: number;
  readonly utilization_pct: number;
  readonly projected_overage_days: number | null;
  readonly action_required: 'none' | 'compact' | 'archive' | 'delete';
  readonly estimated_monthly_cost_usd: number;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

const DIMENSION_ALLOWLIST = [
  'environment',
  'dataset_tier',
  'access_mode',
  'principal_type',
  'risk_tier',
] as const;

function createMockRetentionPolicy(overrides: Partial<RetentionPolicy> = {}): RetentionPolicy {
  return {
    policy_id: `policy-${Date.now()}`,
    entity_type: 'governance_event',
    hot_duration_days: 7,
    warm_duration_days: 30,
    cold_duration_days: 90,
    archive_duration_days: 365,
    total_retention_days: 492,
    compaction_strategy: 'merge',
    cost_ceiling_gb: 100,
    is_immutable: true,
    ...overrides,
  };
}

function createMockStorageMetrics(overrides: Partial<StorageMetrics> = {}): StorageMetrics {
  const now = new Date();
  return {
    entity_type: 'governance_event',
    total_bytes: 50 * 1024 * 1024 * 1024, // 50 GB
    hot_bytes: 5 * 1024 * 1024 * 1024,
    warm_bytes: 15 * 1024 * 1024 * 1024,
    cold_bytes: 20 * 1024 * 1024 * 1024,
    archive_bytes: 10 * 1024 * 1024 * 1024,
    record_count: 10000000,
    oldest_record_at: new Date(now.getTime() - 365 * 86400000).toISOString(),
    newest_record_at: now.toISOString(),
    ...overrides,
  };
}

function createMockCompactionResult(overrides: Partial<CompactionResult> = {}): CompactionResult {
  return {
    entity_type: 'governance_event',
    records_before: 10000,
    records_after: 2000,
    bytes_before: 100 * 1024 * 1024,
    bytes_after: 25 * 1024 * 1024,
    compaction_ratio: 0.25,
    audit_chain_preserved: true,
    checksum_before: 'sha256:abcd1234',
    checksum_after: 'sha256:efgh5678',
    compacted_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockRollupDefinition(overrides: Partial<RollupDefinition> = {}): RollupDefinition {
  return {
    rollup_id: `rollup-${Date.now()}`,
    source_entity_type: 'anomaly_finding',
    rollup_interval: 'daily',
    dimensions: ['environment', 'risk_tier'],
    aggregations: ['count', 'sum', 'avg'],
    retention_days: 365,
    ...overrides,
  };
}

function createMockRollupResult(overrides: Partial<RollupResult> = {}): RollupResult {
  const now = new Date();
  return {
    rollup_id: `rollup-${Date.now()}`,
    period_start: new Date(now.getTime() - 86400000).toISOString(),
    period_end: now.toISOString(),
    source_records: 5000,
    dimension_values: { environment: 'production', risk_tier: 'high' },
    aggregated_values: { count: 5000, sum: 15000, avg: 3 },
    checksum: 'sha256:rollup123',
    ...overrides,
  };
}

function createMockCostStatus(overrides: Partial<CostStatus> = {}): CostStatus {
  return {
    entity_type: 'governance_event',
    storage_gb: 50,
    ceiling_gb: 100,
    utilization_pct: 50,
    projected_overage_days: null,
    action_required: 'none',
    estimated_monthly_cost_usd: 125.0,
    ...overrides,
  };
}

// ============================================================================
// MOCK RETENTION STORE
// ============================================================================

interface RetentionStore {
  // Retention Policies
  getPolicy(entityType: EntityType): Promise<RetentionPolicy>;
  getPolicies(): Promise<readonly RetentionPolicy[]>;
  validatePolicyImmutability(policyId: string): Promise<boolean>;

  // Storage Metrics
  getStorageMetrics(entityType: EntityType): Promise<StorageMetrics>;
  getAggregateStorageBytes(): Promise<number>;
  getStorageCeiling(): Promise<number>;

  // Compaction
  runCompaction(entityType: EntityType): Promise<CompactionResult>;
  validateAuditChainIntegrity(entityType: EntityType): Promise<boolean>;
  getCompactionHistory(entityType: EntityType, limit: number): Promise<readonly CompactionResult[]>;

  // Rollups
  defineRollup(definition: RollupDefinition): Promise<void>;
  getRollupResults(rollupId: string, limit: number): Promise<readonly RollupResult[]>;
  validateRollupDimensions(
    definition: RollupDefinition
  ): Promise<{ valid: boolean; invalid: string[] }>;

  // Cost Management
  getCostStatus(entityType: EntityType): Promise<CostStatus>;
  getAggregateCostStatus(): Promise<CostStatus>;
  enforceCostCeiling(entityType: EntityType): Promise<{ action: string; bytes_freed: number }>;
}

function createMockRetentionStore(): RetentionStore {
  const policies: Map<EntityType, RetentionPolicy> = new Map();
  const rollups: Map<string, RollupDefinition> = new Map();

  // Initialize default policies
  const entityTypes: EntityType[] = [
    'governance_event',
    'evidence_pack',
    'audit_log',
    'posture_snapshot',
    'anomaly_finding',
    'drift_event',
  ];
  for (const entityType of entityTypes) {
    policies.set(entityType, createMockRetentionPolicy({ entity_type: entityType }));
  }

  return {
    async getPolicy(entityType) {
      return policies.get(entityType) ?? createMockRetentionPolicy({ entity_type: entityType });
    },

    async getPolicies() {
      return Array.from(policies.values());
    },

    async validatePolicyImmutability(policyId) {
      // All policies are immutable once applied
      return true;
    },

    async getStorageMetrics(entityType) {
      return createMockStorageMetrics({ entity_type: entityType });
    },

    async getAggregateStorageBytes() {
      return 300 * 1024 * 1024 * 1024; // 300 GB total
    },

    async getStorageCeiling() {
      return 500 * 1024 * 1024 * 1024; // 500 GB ceiling
    },

    async runCompaction(entityType) {
      return createMockCompactionResult({ entity_type: entityType });
    },

    async validateAuditChainIntegrity(entityType) {
      return true;
    },

    async getCompactionHistory(entityType, limit) {
      return [createMockCompactionResult({ entity_type: entityType })];
    },

    async defineRollup(definition) {
      rollups.set(definition.rollup_id, definition);
    },

    async getRollupResults(rollupId, limit) {
      return [createMockRollupResult({ rollup_id: rollupId })];
    },

    async validateRollupDimensions(definition) {
      const invalid = definition.dimensions.filter(
        d => !DIMENSION_ALLOWLIST.includes(d as (typeof DIMENSION_ALLOWLIST)[number])
      );
      return { valid: invalid.length === 0, invalid };
    },

    async getCostStatus(entityType) {
      return createMockCostStatus({ entity_type: entityType });
    },

    async getAggregateCostStatus() {
      return createMockCostStatus({
        entity_type: 'governance_event',
        storage_gb: 300,
        ceiling_gb: 500,
        utilization_pct: 60,
      });
    },

    async enforceCostCeiling(entityType) {
      return { action: 'compact', bytes_freed: 10 * 1024 * 1024 * 1024 };
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Scaling Hardening: Retention & Cost Ceiling Contracts', () => {
  let store: RetentionStore;

  beforeEach(() => {
    store = createMockRetentionStore();
  });

  // ==========================================================================
  // CONTRACT: retention_storage_bounds
  // ==========================================================================
  describe('CONTRACT: retention_storage_bounds', () => {
    it('defines retention tiers with bounded durations', async () => {
      const policy = await store.getPolicy('governance_event');

      assert.ok(policy.hot_duration_days > 0, 'hot tier must have positive duration');
      assert.ok(policy.warm_duration_days > 0, 'warm tier must have positive duration');
      assert.ok(policy.cold_duration_days > 0, 'cold tier must have positive duration');
      assert.ok(policy.archive_duration_days > 0, 'archive tier must have positive duration');
      assert.ok(
        policy.total_retention_days <=
          policy.hot_duration_days +
            policy.warm_duration_days +
            policy.cold_duration_days +
            policy.archive_duration_days
      );
    });

    it('tracks storage metrics per entity type', async () => {
      const metrics = await store.getStorageMetrics('evidence_pack');

      assert.ok(metrics.total_bytes > 0, 'should have total bytes');
      assert.strictEqual(
        metrics.total_bytes,
        metrics.hot_bytes + metrics.warm_bytes + metrics.cold_bytes + metrics.archive_bytes
      );
      assert.ok(metrics.record_count > 0, 'should have record count');
    });

    it('enforces aggregate storage ceiling', async () => {
      const totalBytes = await store.getAggregateStorageBytes();
      const ceilingBytes = await store.getStorageCeiling();

      assert.ok(totalBytes <= ceilingBytes, 'total storage must not exceed ceiling');
    });

    it('policies are immutable once applied', async () => {
      const policy = await store.getPolicy('audit_log');
      const isImmutable = await store.validatePolicyImmutability(policy.policy_id);

      assert.strictEqual(isImmutable, true);
      assert.strictEqual(policy.is_immutable, true);
    });

    it('covers all governance entity types', async () => {
      const policies = await store.getPolicies();
      const entityTypes: EntityType[] = [
        'governance_event',
        'evidence_pack',
        'audit_log',
        'posture_snapshot',
        'anomaly_finding',
        'drift_event',
      ];

      for (const entityType of entityTypes) {
        assert.ok(
          policies.some(p => p.entity_type === entityType),
          `policy required for ${entityType}`
        );
      }
    });
  });

  // ==========================================================================
  // CONTRACT: retention_compaction
  // ==========================================================================
  describe('CONTRACT: retention_compaction', () => {
    it('compacts records while preserving audit chain', async () => {
      const result = await store.runCompaction('governance_event');

      assert.ok(result.records_after < result.records_before, 'compaction should reduce records');
      assert.ok(result.bytes_after < result.bytes_before, 'compaction should reduce bytes');
      assert.strictEqual(result.audit_chain_preserved, true);
    });

    it('records compaction ratio', async () => {
      const result = await store.runCompaction('evidence_pack');

      assert.ok(result.compaction_ratio > 0, 'compaction ratio must be positive');
      assert.ok(result.compaction_ratio <= 1, 'compaction ratio must not exceed 1');
      assert.ok(result.compaction_ratio === result.bytes_after / result.bytes_before);
    });

    it('validates audit chain integrity after compaction', async () => {
      await store.runCompaction('audit_log');
      const isValid = await store.validateAuditChainIntegrity('audit_log');

      assert.strictEqual(isValid, true);
    });

    it('maintains checksums before and after', async () => {
      const result = await store.runCompaction('posture_snapshot');

      assert.ok(result.checksum_before.startsWith('sha256:'));
      assert.ok(result.checksum_after.startsWith('sha256:'));
      assert.notStrictEqual(result.checksum_before, result.checksum_after);
    });

    it('records compaction history', async () => {
      await store.runCompaction('anomaly_finding');
      const history = await store.getCompactionHistory('anomaly_finding', 10);

      assert.ok(history.length > 0, 'should have compaction history');
      assert.ok(history[0].compacted_at, 'should have compaction timestamp');
    });
  });

  // ==========================================================================
  // CONTRACT: retention_rollups
  // ==========================================================================
  describe('CONTRACT: retention_rollups', () => {
    it('defines rollups with allowlisted dimensions only', async () => {
      const definition = createMockRollupDefinition({
        dimensions: ['environment', 'risk_tier'],
      });

      const validation = await store.validateRollupDimensions(definition);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.invalid.length, 0);
    });

    it('rejects rollups with non-allowlisted dimensions', async () => {
      const definition = createMockRollupDefinition({
        dimensions: ['environment', 'user_email', 'query_text'],
      });

      const validation = await store.validateRollupDimensions(definition);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.invalid.includes('user_email'));
      assert.ok(validation.invalid.includes('query_text'));
    });

    it('rollup results include aggregated values', async () => {
      const definition = createMockRollupDefinition();
      await store.defineRollup(definition);

      const results = await store.getRollupResults(definition.rollup_id, 10);

      assert.ok(results.length > 0);
      assert.ok(typeof results[0].aggregated_values.count === 'number');
      assert.ok(results[0].source_records > 0);
    });

    it('rollup results have checksums', async () => {
      const definition = createMockRollupDefinition();
      await store.defineRollup(definition);

      const results = await store.getRollupResults(definition.rollup_id, 10);

      assert.ok(results[0].checksum.startsWith('sha256:'));
    });

    it('rollups preserve dimension values', async () => {
      const definition = createMockRollupDefinition({
        dimensions: ['environment', 'dataset_tier'],
      });
      await store.defineRollup(definition);

      const results = await store.getRollupResults(definition.rollup_id, 10);

      assert.ok(results[0].dimension_values, 'should have dimension values');
      assert.ok(Object.keys(results[0].dimension_values).length > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: retention_cost_ceilings
  // ==========================================================================
  describe('CONTRACT: retention_cost_ceilings', () => {
    it('tracks cost status per entity type', async () => {
      const status = await store.getCostStatus('governance_event');

      assert.ok(typeof status.storage_gb === 'number');
      assert.ok(typeof status.ceiling_gb === 'number');
      assert.ok(typeof status.utilization_pct === 'number');
      assert.ok(status.utilization_pct >= 0 && status.utilization_pct <= 100);
    });

    it('tracks aggregate cost status', async () => {
      const status = await store.getAggregateCostStatus();

      assert.ok(status.storage_gb > 0);
      assert.ok(status.ceiling_gb > 0);
      assert.ok(status.storage_gb <= status.ceiling_gb);
    });

    it('determines required action based on utilization', async () => {
      const status = await store.getCostStatus('evidence_pack');

      assert.ok(['none', 'compact', 'archive', 'delete'].includes(status.action_required));
    });

    it('estimates monthly cost', async () => {
      const status = await store.getCostStatus('audit_log');

      assert.ok(typeof status.estimated_monthly_cost_usd === 'number');
      assert.ok(status.estimated_monthly_cost_usd >= 0);
    });

    it('enforces ceiling by freeing storage', async () => {
      const result = await store.enforceCostCeiling('drift_event');

      assert.ok(result.action, 'should specify action taken');
      assert.ok(typeof result.bytes_freed === 'number');
    });
  });
});
