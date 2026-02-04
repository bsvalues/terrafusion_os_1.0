/**
 * Phase XXI — Optimization & Sustainability
 * ==========================================
 * Contract: cost.retention.optimization.contract.test.ts
 *
 * Tests cost/retention governance: per-surface budgets, per-agency quotas,
 * retention tiers, storage compaction, and bounded growth.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Budgets are enforced, not advisory
 * - Retention tiers preserve data correctness
 * - Storage growth is bounded with auditable compaction
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type SurfaceId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type BudgetId = `sha256:${string}`;
type CompactionJobId = `sha256:${string}`;

type RetentionTier = 'hot' | 'warm' | 'cold' | 'archive';
type SurfaceType = 'evidence' | 'telemetry' | 'audit' | 'portal' | 'alerting';
type BudgetStatus = 'under' | 'warning' | 'exceeded';
type CompactionStatus = 'pending' | 'running' | 'completed' | 'failed';

interface StorageBudget {
  readonly id: BudgetId;
  readonly agencyId: AgencyId;
  readonly surfaceType: SurfaceType;
  readonly monthlyBudgetBytes: number;
  readonly warningThresholdPercent: number;
  readonly currentUsageBytes: number;
  readonly status: BudgetStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface RetentionPolicy {
  readonly surfaceType: SurfaceType;
  readonly tier: RetentionTier;
  readonly retentionDays: number;
  readonly rollupAfterDays: number;
  readonly compressAfterDays: number;
  readonly deleteAfterDays: number;
}

interface StorageMetrics {
  readonly agencyId: AgencyId;
  readonly surfaceType: SurfaceType;
  readonly totalBytes: number;
  readonly byTier: Record<RetentionTier, number>;
  readonly recordCount: number;
  readonly oldestRecordAt: string;
  readonly newestRecordAt: string;
}

interface CompactionJob {
  readonly id: CompactionJobId;
  readonly agencyId: AgencyId;
  readonly surfaceType: SurfaceType;
  readonly tier: RetentionTier;
  readonly status: CompactionStatus;
  readonly recordsProcessed: number;
  readonly bytesSaved: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly error?: string;
}

interface RollupSpec {
  readonly surfaceType: SurfaceType;
  readonly sourceGranularity: string;
  readonly targetGranularity: string;
  readonly aggregationFunctions: readonly string[];
  readonly preservedDimensions: readonly string[];
  readonly droppedDimensions: readonly string[];
}

interface CostSummary {
  readonly generatedAt: string;
  readonly agencyId: AgencyId;
  readonly period: string;
  readonly totalBytes: number;
  readonly totalBudgetBytes: number;
  readonly utilizationPercent: number;
  readonly bySurface: Record<SurfaceType, { used: number; budget: number; status: BudgetStatus }>;
  readonly projectedOverageBytes: number;
  readonly recommendedActions: readonly string[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockCostRetentionService() {
  const budgets = new Map<BudgetId, StorageBudget>();
  const metrics = new Map<string, StorageMetrics>();
  const compactionJobs = new Map<CompactionJobId, CompactionJob>();
  const retentionPolicies = new Map<string, RetentionPolicy>();
  const rollupSpecs = new Map<SurfaceType, RollupSpec>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function metricsKey(agencyId: AgencyId, surfaceType: SurfaceType): string {
    return `${agencyId}||${surfaceType}`;
  }

  function policyKey(surfaceType: SurfaceType, tier: RetentionTier): string {
    return `${surfaceType}||${tier}`;
  }

  // Initialize default retention policies
  const defaultPolicies: RetentionPolicy[] = [
    {
      surfaceType: 'evidence',
      tier: 'hot',
      retentionDays: 30,
      rollupAfterDays: 0,
      compressAfterDays: 7,
      deleteAfterDays: 30,
    },
    {
      surfaceType: 'evidence',
      tier: 'warm',
      retentionDays: 90,
      rollupAfterDays: 30,
      compressAfterDays: 30,
      deleteAfterDays: 90,
    },
    {
      surfaceType: 'evidence',
      tier: 'cold',
      retentionDays: 365,
      rollupAfterDays: 90,
      compressAfterDays: 90,
      deleteAfterDays: 365,
    },
    {
      surfaceType: 'evidence',
      tier: 'archive',
      retentionDays: 2555,
      rollupAfterDays: 365,
      compressAfterDays: 365,
      deleteAfterDays: 2555,
    },
    {
      surfaceType: 'telemetry',
      tier: 'hot',
      retentionDays: 7,
      rollupAfterDays: 0,
      compressAfterDays: 1,
      deleteAfterDays: 7,
    },
    {
      surfaceType: 'telemetry',
      tier: 'warm',
      retentionDays: 30,
      rollupAfterDays: 7,
      compressAfterDays: 7,
      deleteAfterDays: 30,
    },
    {
      surfaceType: 'telemetry',
      tier: 'cold',
      retentionDays: 90,
      rollupAfterDays: 30,
      compressAfterDays: 30,
      deleteAfterDays: 90,
    },
    {
      surfaceType: 'audit',
      tier: 'hot',
      retentionDays: 90,
      rollupAfterDays: 0,
      compressAfterDays: 30,
      deleteAfterDays: 90,
    },
    {
      surfaceType: 'audit',
      tier: 'archive',
      retentionDays: 2555,
      rollupAfterDays: 90,
      compressAfterDays: 90,
      deleteAfterDays: 2555,
    },
    {
      surfaceType: 'alerting',
      tier: 'hot',
      retentionDays: 14,
      rollupAfterDays: 0,
      compressAfterDays: 7,
      deleteAfterDays: 14,
    },
    {
      surfaceType: 'alerting',
      tier: 'warm',
      retentionDays: 90,
      rollupAfterDays: 14,
      compressAfterDays: 14,
      deleteAfterDays: 90,
    },
  ];

  for (const policy of defaultPolicies) {
    retentionPolicies.set(policyKey(policy.surfaceType, policy.tier), policy);
  }

  // Initialize default rollup specs
  const defaultRollups: RollupSpec[] = [
    {
      surfaceType: 'telemetry',
      sourceGranularity: '1m',
      targetGranularity: '1h',
      aggregationFunctions: ['avg', 'max', 'min', 'count'],
      preservedDimensions: ['agency_id', 'service_id', 'metric_type'],
      droppedDimensions: ['instance_id', 'request_id'],
    },
    {
      surfaceType: 'evidence',
      sourceGranularity: 'raw',
      targetGranularity: 'daily_summary',
      aggregationFunctions: ['count', 'distinct_count'],
      preservedDimensions: ['agency_id', 'control_id', 'attestation_type'],
      droppedDimensions: ['evidence_ref', 'timestamp_ms'],
    },
    {
      surfaceType: 'alerting',
      sourceGranularity: 'raw',
      targetGranularity: 'hourly_summary',
      aggregationFunctions: ['count', 'severity_max'],
      preservedDimensions: ['agency_id', 'alert_type', 'severity'],
      droppedDimensions: ['alert_id', 'raw_message'],
    },
  ];

  for (const spec of defaultRollups) {
    rollupSpecs.set(spec.surfaceType, spec);
  }

  return {
    // Budget Management
    createBudget(
      agencyId: AgencyId,
      surfaceType: SurfaceType,
      monthlyBudgetBytes: number,
      warningThresholdPercent: number = 80
    ): StorageBudget {
      const id = generateId('budget') as BudgetId;
      const budget: StorageBudget = {
        id,
        agencyId,
        surfaceType,
        monthlyBudgetBytes,
        warningThresholdPercent,
        currentUsageBytes: 0,
        status: 'under',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      budgets.set(id, budget);
      return budget;
    },

    getBudget(id: BudgetId): StorageBudget | null {
      return budgets.get(id) ?? null;
    },

    getBudgetsForAgency(agencyId: AgencyId): readonly StorageBudget[] {
      return [...budgets.values()].filter(b => b.agencyId === agencyId);
    },

    getBudgetBySurface(agencyId: AgencyId, surfaceType: SurfaceType): StorageBudget | null {
      return (
        [...budgets.values()].find(b => b.agencyId === agencyId && b.surfaceType === surfaceType) ??
        null
      );
    },

    updateBudgetUsage(id: BudgetId, usageBytes: number): StorageBudget | null {
      const budget = budgets.get(id);
      if (!budget) return null;

      const utilizationPercent = (usageBytes / budget.monthlyBudgetBytes) * 100;
      let status: BudgetStatus = 'under';
      if (utilizationPercent >= 100) {
        status = 'exceeded';
      } else if (utilizationPercent >= budget.warningThresholdPercent) {
        status = 'warning';
      }

      const updated: StorageBudget = {
        ...budget,
        currentUsageBytes: usageBytes,
        status,
        updatedAt: new Date().toISOString(),
      };
      budgets.set(id, updated);
      return updated;
    },

    checkBudgetEnforcement(
      agencyId: AgencyId,
      surfaceType: SurfaceType,
      additionalBytes: number
    ): {
      allowed: boolean;
      reason?: string;
      currentUsage: number;
      budgetLimit: number;
      projectedUsage: number;
    } {
      const budget = this.getBudgetBySurface(agencyId, surfaceType);
      if (!budget) {
        return {
          allowed: false,
          reason: 'No budget configured for this agency/surface',
          currentUsage: 0,
          budgetLimit: 0,
          projectedUsage: additionalBytes,
        };
      }

      const projectedUsage = budget.currentUsageBytes + additionalBytes;
      const allowed = projectedUsage <= budget.monthlyBudgetBytes;

      return {
        allowed,
        reason: allowed
          ? undefined
          : `Would exceed budget: ${projectedUsage} > ${budget.monthlyBudgetBytes}`,
        currentUsage: budget.currentUsageBytes,
        budgetLimit: budget.monthlyBudgetBytes,
        projectedUsage,
      };
    },

    // Retention Policies
    getRetentionPolicy(surfaceType: SurfaceType, tier: RetentionTier): RetentionPolicy | null {
      return retentionPolicies.get(policyKey(surfaceType, tier)) ?? null;
    },

    getRetentionPoliciesForSurface(surfaceType: SurfaceType): readonly RetentionPolicy[] {
      return [...retentionPolicies.values()].filter(p => p.surfaceType === surfaceType);
    },

    setRetentionPolicy(policy: RetentionPolicy): void {
      retentionPolicies.set(policyKey(policy.surfaceType, policy.tier), policy);
    },

    calculateTargetTier(surfaceType: SurfaceType, ageInDays: number): RetentionTier {
      const policies = this.getRetentionPoliciesForSurface(surfaceType);
      if (policies.length === 0) return 'hot';

      // Find the appropriate tier based on age
      const sorted = [...policies].sort((a, b) => a.retentionDays - b.retentionDays);
      for (const policy of sorted) {
        if (ageInDays <= policy.retentionDays) {
          return policy.tier;
        }
      }
      return 'archive';
    },

    // Storage Metrics
    recordStorageMetrics(
      agencyId: AgencyId,
      surfaceType: SurfaceType,
      totalBytes: number,
      byTier: Record<RetentionTier, number>,
      recordCount: number
    ): StorageMetrics {
      const key = metricsKey(agencyId, surfaceType);
      const metric: StorageMetrics = {
        agencyId,
        surfaceType,
        totalBytes,
        byTier,
        recordCount,
        oldestRecordAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        newestRecordAt: new Date().toISOString(),
      };
      metrics.set(key, metric);
      return metric;
    },

    getStorageMetrics(agencyId: AgencyId, surfaceType: SurfaceType): StorageMetrics | null {
      return metrics.get(metricsKey(agencyId, surfaceType)) ?? null;
    },

    getAllStorageMetrics(): readonly StorageMetrics[] {
      return [...metrics.values()];
    },

    // Compaction Jobs
    scheduleCompaction(
      agencyId: AgencyId,
      surfaceType: SurfaceType,
      tier: RetentionTier
    ): CompactionJob {
      const id = generateId('compaction') as CompactionJobId;
      const job: CompactionJob = {
        id,
        agencyId,
        surfaceType,
        tier,
        status: 'pending',
        recordsProcessed: 0,
        bytesSaved: 0,
        startedAt: new Date().toISOString(),
      };
      compactionJobs.set(id, job);
      return job;
    },

    getCompactionJob(id: CompactionJobId): CompactionJob | null {
      return compactionJobs.get(id) ?? null;
    },

    startCompaction(id: CompactionJobId): CompactionJob | null {
      const job = compactionJobs.get(id);
      if (!job || job.status !== 'pending') return null;

      const updated: CompactionJob = {
        ...job,
        status: 'running',
      };
      compactionJobs.set(id, updated);
      return updated;
    },

    completeCompaction(
      id: CompactionJobId,
      recordsProcessed: number,
      bytesSaved: number
    ): CompactionJob | null {
      const job = compactionJobs.get(id);
      if (!job || job.status !== 'running') return null;

      const updated: CompactionJob = {
        ...job,
        status: 'completed',
        recordsProcessed,
        bytesSaved,
        completedAt: new Date().toISOString(),
      };
      compactionJobs.set(id, updated);
      return updated;
    },

    failCompaction(id: CompactionJobId, error: string): CompactionJob | null {
      const job = compactionJobs.get(id);
      if (!job || job.status !== 'running') return null;

      const updated: CompactionJob = {
        ...job,
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      };
      compactionJobs.set(id, updated);
      return updated;
    },

    getCompactionJobsByStatus(status: CompactionStatus): readonly CompactionJob[] {
      return [...compactionJobs.values()].filter(j => j.status === status);
    },

    getPendingCompactions(): readonly CompactionJob[] {
      return this.getCompactionJobsByStatus('pending');
    },

    // Rollup Specs
    getRollupSpec(surfaceType: SurfaceType): RollupSpec | null {
      return rollupSpecs.get(surfaceType) ?? null;
    },

    getAllRollupSpecs(): readonly RollupSpec[] {
      return [...rollupSpecs.values()];
    },

    validateRollupCorrectness(
      surfaceType: SurfaceType,
      sourceRecordCount: number,
      targetRecordCount: number
    ): {
      valid: boolean;
      compressionRatio: number;
      expectedMinRatio: number;
      reason?: string;
    } {
      const spec = rollupSpecs.get(surfaceType);
      if (!spec) {
        return {
          valid: false,
          compressionRatio: 0,
          expectedMinRatio: 0,
          reason: 'No rollup spec defined for surface type',
        };
      }

      const compressionRatio = sourceRecordCount / targetRecordCount;
      // Expect at least 10:1 compression for most rollups
      const expectedMinRatio = 10;

      if (targetRecordCount > sourceRecordCount) {
        return {
          valid: false,
          compressionRatio,
          expectedMinRatio,
          reason: 'Rollup produced MORE records than source (data explosion)',
        };
      }

      if (compressionRatio < expectedMinRatio) {
        return {
          valid: false,
          compressionRatio,
          expectedMinRatio,
          reason: `Compression ratio ${compressionRatio.toFixed(2)} below expected ${expectedMinRatio}`,
        };
      }

      return {
        valid: true,
        compressionRatio,
        expectedMinRatio,
      };
    },

    // Cost Summary
    generateCostSummary(agencyId: AgencyId, period: string): CostSummary {
      const agencyBudgets = this.getBudgetsForAgency(agencyId);
      let totalBytes = 0;
      let totalBudgetBytes = 0;
      const bySurface: Record<SurfaceType, { used: number; budget: number; status: BudgetStatus }> =
        {
          evidence: { used: 0, budget: 0, status: 'under' },
          telemetry: { used: 0, budget: 0, status: 'under' },
          audit: { used: 0, budget: 0, status: 'under' },
          portal: { used: 0, budget: 0, status: 'under' },
          alerting: { used: 0, budget: 0, status: 'under' },
        };

      for (const budget of agencyBudgets) {
        totalBytes += budget.currentUsageBytes;
        totalBudgetBytes += budget.monthlyBudgetBytes;
        bySurface[budget.surfaceType] = {
          used: budget.currentUsageBytes,
          budget: budget.monthlyBudgetBytes,
          status: budget.status,
        };
      }

      const utilizationPercent = totalBudgetBytes > 0 ? (totalBytes / totalBudgetBytes) * 100 : 0;

      const recommendedActions: string[] = [];
      for (const [surface, data] of Object.entries(bySurface)) {
        if (data.status === 'exceeded') {
          recommendedActions.push(`${surface}: Immediate compaction required`);
        } else if (data.status === 'warning') {
          recommendedActions.push(`${surface}: Schedule compaction within 7 days`);
        }
      }

      const projectedOverageBytes = Math.max(0, totalBytes - totalBudgetBytes);

      return {
        generatedAt: new Date().toISOString(),
        agencyId,
        period,
        totalBytes,
        totalBudgetBytes,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
        bySurface,
        projectedOverageBytes,
        recommendedActions,
      };
    },

    // Storage Growth Bounds
    calculateGrowthRate(
      agencyId: AgencyId,
      surfaceType: SurfaceType,
      days: number
    ): {
      dailyGrowthBytes: number;
      weeklyGrowthBytes: number;
      projectedMonthlyGrowthBytes: number;
      growthTrend: 'stable' | 'increasing' | 'decreasing';
    } {
      // Mock implementation - in real system would use time-series data
      const metric = this.getStorageMetrics(agencyId, surfaceType);
      if (!metric) {
        return {
          dailyGrowthBytes: 0,
          weeklyGrowthBytes: 0,
          projectedMonthlyGrowthBytes: 0,
          growthTrend: 'stable',
        };
      }

      const dailyGrowthBytes = Math.round(metric.totalBytes / Math.max(days, 1));
      const weeklyGrowthBytes = dailyGrowthBytes * 7;
      const projectedMonthlyGrowthBytes = dailyGrowthBytes * 30;

      return {
        dailyGrowthBytes,
        weeklyGrowthBytes,
        projectedMonthlyGrowthBytes,
        growthTrend: 'stable',
      };
    },

    // Audit compaction history
    getCompactionHistory(agencyId: AgencyId, limit: number = 10): readonly CompactionJob[] {
      return [...compactionJobs.values()]
        .filter(j => j.agencyId === agencyId && j.status === 'completed')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
        .slice(0, limit);
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXI: Cost/Retention Optimization Contracts', () => {
  let costService: ReturnType<typeof createMockCostRetentionService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;

  beforeEach(() => {
    costService = createMockCostRetentionService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate budget IDs with sha256: prefix', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      assert.ok(budget.id.startsWith('sha256:'));
    });

    it('should generate compaction job IDs with sha256: prefix', () => {
      const job = costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      assert.ok(job.id.startsWith('sha256:'));
    });

    it('should use opaque agency IDs in budgets', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      assert.ok(budget.agencyId.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Budget Management Tests
  // ==========================================================================

  describe('Budget Management', () => {
    it('should create storage budget', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000, 80);
      assert.strictEqual(budget.surfaceType, 'evidence');
      assert.strictEqual(budget.monthlyBudgetBytes, 1000000000);
      assert.strictEqual(budget.warningThresholdPercent, 80);
      assert.strictEqual(budget.status, 'under');
    });

    it('should get budgets for agency', () => {
      costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.createBudget(agencyA, 'telemetry', 500000000);
      costService.createBudget(agencyB, 'evidence', 800000000);

      const budgets = costService.getBudgetsForAgency(agencyA);
      assert.strictEqual(budgets.length, 2);
    });

    it('should get budget by surface', () => {
      costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.createBudget(agencyA, 'telemetry', 500000000);

      const budget = costService.getBudgetBySurface(agencyA, 'evidence');
      assert.strictEqual(budget?.surfaceType, 'evidence');
    });

    it('should update budget usage and status', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000, 80);

      // Under threshold
      const under = costService.updateBudgetUsage(budget.id, 500000000);
      assert.strictEqual(under?.status, 'under');

      // Warning threshold
      const warning = costService.updateBudgetUsage(budget.id, 850000000);
      assert.strictEqual(warning?.status, 'warning');

      // Exceeded
      const exceeded = costService.updateBudgetUsage(budget.id, 1100000000);
      assert.strictEqual(exceeded?.status, 'exceeded');
    });
  });

  // ==========================================================================
  // Budget Enforcement Tests
  // ==========================================================================

  describe('Budget Enforcement', () => {
    it('should allow writes within budget', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 500000000);

      const check = costService.checkBudgetEnforcement(agencyA, 'evidence', 100000000);
      assert.strictEqual(check.allowed, true);
    });

    it('should block writes exceeding budget', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 900000000);

      const check = costService.checkBudgetEnforcement(agencyA, 'evidence', 200000000);
      assert.strictEqual(check.allowed, false);
      assert.ok(check.reason?.includes('exceed budget'));
    });

    it('should reject when no budget configured', () => {
      const check = costService.checkBudgetEnforcement(agencyA, 'evidence', 100000000);
      assert.strictEqual(check.allowed, false);
      assert.ok(check.reason?.includes('No budget configured'));
    });

    it('should report projected usage', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 500000000);

      const check = costService.checkBudgetEnforcement(agencyA, 'evidence', 300000000);
      assert.strictEqual(check.projectedUsage, 800000000);
    });
  });

  // ==========================================================================
  // Retention Policy Tests
  // ==========================================================================

  describe('Retention Policies', () => {
    it('should have default retention policies', () => {
      const evidenceHot = costService.getRetentionPolicy('evidence', 'hot');
      assert.ok(evidenceHot);
      assert.strictEqual(evidenceHot.retentionDays, 30);
    });

    it('should get policies for surface type', () => {
      const evidencePolicies = costService.getRetentionPoliciesForSurface('evidence');
      assert.ok(evidencePolicies.length >= 3);
    });

    it('should calculate target tier based on age', () => {
      const tier7 = costService.calculateTargetTier('telemetry', 7);
      assert.strictEqual(tier7, 'hot');

      const tier20 = costService.calculateTargetTier('telemetry', 20);
      assert.strictEqual(tier20, 'warm');

      const tier60 = costService.calculateTargetTier('telemetry', 60);
      assert.strictEqual(tier60, 'cold');
    });

    it('should have longer retention for audit data', () => {
      const auditArchive = costService.getRetentionPolicy('audit', 'archive');
      assert.ok(auditArchive);
      assert.ok(auditArchive.retentionDays >= 2555); // 7 years
    });

    it('should set custom retention policy', () => {
      const customPolicy: RetentionPolicy = {
        surfaceType: 'portal',
        tier: 'hot',
        retentionDays: 14,
        rollupAfterDays: 7,
        compressAfterDays: 7,
        deleteAfterDays: 14,
      };
      costService.setRetentionPolicy(customPolicy);

      const retrieved = costService.getRetentionPolicy('portal', 'hot');
      assert.strictEqual(retrieved?.retentionDays, 14);
    });
  });

  // ==========================================================================
  // Storage Metrics Tests
  // ==========================================================================

  describe('Storage Metrics', () => {
    it('should record storage metrics', () => {
      const byTier: Record<RetentionTier, number> = {
        hot: 100000000,
        warm: 200000000,
        cold: 300000000,
        archive: 400000000,
      };

      const metrics = costService.recordStorageMetrics(
        agencyA,
        'evidence',
        1000000000,
        byTier,
        50000
      );
      assert.strictEqual(metrics.totalBytes, 1000000000);
      assert.strictEqual(metrics.recordCount, 50000);
    });

    it('should get storage metrics', () => {
      const byTier: Record<RetentionTier, number> = {
        hot: 100000000,
        warm: 200000000,
        cold: 300000000,
        archive: 400000000,
      };

      costService.recordStorageMetrics(agencyA, 'evidence', 1000000000, byTier, 50000);
      const metrics = costService.getStorageMetrics(agencyA, 'evidence');
      assert.ok(metrics);
      assert.strictEqual(metrics.byTier.hot, 100000000);
    });

    it('should get all storage metrics', () => {
      const byTier: Record<RetentionTier, number> = { hot: 0, warm: 0, cold: 0, archive: 0 };
      costService.recordStorageMetrics(agencyA, 'evidence', 1000000000, byTier, 50000);
      costService.recordStorageMetrics(agencyA, 'telemetry', 500000000, byTier, 100000);

      const all = costService.getAllStorageMetrics();
      assert.strictEqual(all.length, 2);
    });
  });

  // ==========================================================================
  // Compaction Job Tests
  // ==========================================================================

  describe('Compaction Jobs', () => {
    it('should schedule compaction job', () => {
      const job = costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      assert.strictEqual(job.status, 'pending');
      assert.strictEqual(job.tier, 'warm');
    });

    it('should start compaction job', () => {
      const job = costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      const started = costService.startCompaction(job.id);
      assert.strictEqual(started?.status, 'running');
    });

    it('should complete compaction job', () => {
      const job = costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      costService.startCompaction(job.id);
      const completed = costService.completeCompaction(job.id, 10000, 50000000);

      assert.strictEqual(completed?.status, 'completed');
      assert.strictEqual(completed?.recordsProcessed, 10000);
      assert.strictEqual(completed?.bytesSaved, 50000000);
      assert.ok(completed?.completedAt);
    });

    it('should fail compaction job with error', () => {
      const job = costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      costService.startCompaction(job.id);
      const failed = costService.failCompaction(job.id, 'Disk full');

      assert.strictEqual(failed?.status, 'failed');
      assert.strictEqual(failed?.error, 'Disk full');
    });

    it('should get pending compactions', () => {
      costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      costService.scheduleCompaction(agencyA, 'evidence', 'cold');

      const pending = costService.getPendingCompactions();
      assert.strictEqual(pending.length, 2);
    });

    it('should get compaction history', () => {
      const job1 = costService.scheduleCompaction(agencyA, 'telemetry', 'warm');
      costService.startCompaction(job1.id);
      costService.completeCompaction(job1.id, 1000, 5000000);

      const job2 = costService.scheduleCompaction(agencyA, 'evidence', 'cold');
      costService.startCompaction(job2.id);
      costService.completeCompaction(job2.id, 2000, 10000000);

      const history = costService.getCompactionHistory(agencyA);
      assert.strictEqual(history.length, 2);
    });
  });

  // ==========================================================================
  // Rollup Correctness Tests
  // ==========================================================================

  describe('Rollup Correctness', () => {
    it('should have default rollup specs', () => {
      const telemetrySpec = costService.getRollupSpec('telemetry');
      assert.ok(telemetrySpec);
      assert.ok(telemetrySpec.aggregationFunctions.includes('avg'));
    });

    it('should get all rollup specs', () => {
      const specs = costService.getAllRollupSpecs();
      assert.ok(specs.length >= 3);
    });

    it('should validate correct rollup compression', () => {
      const result = costService.validateRollupCorrectness('telemetry', 100000, 5000);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.compressionRatio, 20);
    });

    it('should reject rollup with data explosion', () => {
      const result = costService.validateRollupCorrectness('telemetry', 1000, 5000);
      assert.strictEqual(result.valid, false);
      assert.ok(result.reason?.includes('data explosion'));
    });

    it('should reject rollup with low compression', () => {
      const result = costService.validateRollupCorrectness('telemetry', 100, 50);
      assert.strictEqual(result.valid, false);
      assert.ok(result.reason?.includes('below expected'));
    });

    it('should preserve required dimensions', () => {
      const spec = costService.getRollupSpec('telemetry');
      assert.ok(spec?.preservedDimensions.includes('agency_id'));
      assert.ok(spec?.preservedDimensions.includes('service_id'));
    });

    it('should drop high-cardinality dimensions', () => {
      const spec = costService.getRollupSpec('telemetry');
      assert.ok(spec?.droppedDimensions.includes('instance_id'));
      assert.ok(spec?.droppedDimensions.includes('request_id'));
    });
  });

  // ==========================================================================
  // Cost Summary Tests
  // ==========================================================================

  describe('Cost Summary', () => {
    it('should generate cost summary', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 500000000);

      const summary = costService.generateCostSummary(agencyA, '2026-01');
      assert.ok(summary.generatedAt);
      assert.strictEqual(summary.agencyId, agencyA);
    });

    it('should calculate utilization percent', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 500000000);

      const summary = costService.generateCostSummary(agencyA, '2026-01');
      assert.strictEqual(summary.utilizationPercent, 50);
    });

    it('should recommend actions for exceeded budgets', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 1100000000);

      const summary = costService.generateCostSummary(agencyA, '2026-01');
      assert.ok(summary.recommendedActions.some(a => a.includes('Immediate compaction')));
    });

    it('should recommend actions for warning budgets', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000, 80);
      costService.updateBudgetUsage(budget.id, 850000000);

      const summary = costService.generateCostSummary(agencyA, '2026-01');
      assert.ok(summary.recommendedActions.some(a => a.includes('Schedule compaction')));
    });

    it('should calculate projected overage', () => {
      const budget = costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.updateBudgetUsage(budget.id, 1200000000);

      const summary = costService.generateCostSummary(agencyA, '2026-01');
      assert.strictEqual(summary.projectedOverageBytes, 200000000);
    });

    it('should aggregate by surface', () => {
      costService.createBudget(agencyA, 'evidence', 1000000000);
      costService.createBudget(agencyA, 'telemetry', 500000000);

      const summary = costService.generateCostSummary(agencyA, '2026-01');
      assert.ok('evidence' in summary.bySurface);
      assert.ok('telemetry' in summary.bySurface);
    });
  });

  // ==========================================================================
  // Growth Rate Tests
  // ==========================================================================

  describe('Growth Rate Calculation', () => {
    it('should calculate growth rates', () => {
      const byTier: Record<RetentionTier, number> = { hot: 0, warm: 0, cold: 0, archive: 0 };
      costService.recordStorageMetrics(agencyA, 'evidence', 300000000, byTier, 10000);

      const growth = costService.calculateGrowthRate(agencyA, 'evidence', 30);
      assert.ok(growth.dailyGrowthBytes > 0);
      assert.strictEqual(growth.weeklyGrowthBytes, growth.dailyGrowthBytes * 7);
      assert.strictEqual(growth.projectedMonthlyGrowthBytes, growth.dailyGrowthBytes * 30);
    });

    it('should return zero for missing metrics', () => {
      const growth = costService.calculateGrowthRate(agencyA, 'evidence', 30);
      assert.strictEqual(growth.dailyGrowthBytes, 0);
      assert.strictEqual(growth.growthTrend, 'stable');
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of budgets', () => {
      costService.createBudget(agencyA, 'evidence', 1000000000);
      const b1 = costService.getBudgetsForAgency(agencyA);
      const b2 = costService.getBudgetsForAgency(agencyA);
      assert.ok(b1 !== b2);
    });

    it('should return copies of rollup specs', () => {
      const s1 = costService.getAllRollupSpecs();
      const s2 = costService.getAllRollupSpecs();
      assert.ok(s1 !== s2);
    });

    it('should generate fresh summary each call', () => {
      costService.createBudget(agencyA, 'evidence', 1000000000);
      const sum1 = costService.generateCostSummary(agencyA, '2026-01');
      const sum2 = costService.generateCostSummary(agencyA, '2026-01');
      assert.ok(sum1 !== sum2);
    });
  });
});
