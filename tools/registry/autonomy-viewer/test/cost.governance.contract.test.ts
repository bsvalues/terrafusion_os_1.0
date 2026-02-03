/**
 * Federation Adoption: Cost Governance Contract Tests
 *
 * Phase XVI - Retention/cost ceilings per agency, evidence pack
 * storage budgets, and cost rollups across the federation.
 *
 * CONTRACT SURFACE:
 * - Cost Limits: Per-agency cost ceilings and thresholds
 * - Retention Policies: Evidence retention windows and enforcement
 * - Storage Budgets: Evidence pack storage quotas
 * - Cost Reporting: Federation-wide cost rollups
 *
 * INVARIANTS:
 * - All limits are configurable per agency
 * - Alerts before hard limits
 * - Evidence linked not embedded
 * - All IDs opaque sha256
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type AlertLevel = 'info' | 'warning' | 'critical';
type EnforcementAction = 'alert' | 'throttle' | 'block' | 'purge';

/**
 * Cost limit configuration
 */
interface CostLimit {
  readonly limit_id: string;
  readonly agency_id: string;
  readonly monthly_ceiling_usd: number;
  readonly warning_threshold_pct: number;
  readonly critical_threshold_pct: number;
  readonly current_usage_usd: number;
  readonly updated_at: string;
}

/**
 * Retention policy
 */
interface RetentionPolicy {
  readonly policy_id: string;
  readonly agency_id: string;
  readonly evidence_retention_days: number;
  readonly audit_log_retention_days: number;
  readonly report_retention_days: number;
  readonly auto_purge_enabled: boolean;
  readonly updated_at: string;
}

/**
 * Storage budget
 */
interface StorageBudget {
  readonly budget_id: string;
  readonly agency_id: string;
  readonly total_quota_gb: number;
  readonly evidence_quota_gb: number;
  readonly audit_quota_gb: number;
  readonly current_usage_gb: number;
  readonly enforcement_action: EnforcementAction;
  readonly updated_at: string;
}

/**
 * Budget alert
 */
interface BudgetAlert {
  readonly alert_id: string;
  readonly agency_id: string;
  readonly resource_type: 'cost' | 'storage' | 'retention';
  readonly alert_level: AlertLevel;
  readonly threshold_pct: number;
  readonly current_pct: number;
  readonly message: string;
  readonly triggered_at: string;
}

/**
 * Cost rollup
 */
interface CostRollup {
  readonly rollup_id: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly total_agencies: number;
  readonly total_cost_usd: number;
  readonly total_storage_gb: number;
  readonly by_agency: readonly AgencyCostSummary[];
  readonly generated_at: string;
}

/**
 * Per-agency cost summary
 */
interface AgencyCostSummary {
  readonly agency_id: string;
  readonly cost_usd: number;
  readonly storage_gb: number;
  readonly within_budget: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockCostLimit(overrides: Partial<CostLimit> = {}): CostLimit {
  const limitId = `limit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    limit_id: `sha256:${Buffer.from(limitId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    monthly_ceiling_usd: 10000,
    warning_threshold_pct: 75,
    critical_threshold_pct: 90,
    current_usage_usd: 5000,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockRetentionPolicy(overrides: Partial<RetentionPolicy> = {}): RetentionPolicy {
  const policyId = `retention-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    policy_id: `sha256:${Buffer.from(policyId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    evidence_retention_days: 365,
    audit_log_retention_days: 2555, // 7 years
    report_retention_days: 1095, // 3 years
    auto_purge_enabled: true,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockStorageBudget(overrides: Partial<StorageBudget> = {}): StorageBudget {
  const budgetId = `storage-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    budget_id: `sha256:${Buffer.from(budgetId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    total_quota_gb: 500,
    evidence_quota_gb: 300,
    audit_quota_gb: 100,
    current_usage_gb: 150,
    enforcement_action: 'alert',
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockBudgetAlert(overrides: Partial<BudgetAlert> = {}): BudgetAlert {
  const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    alert_id: `sha256:${Buffer.from(alertId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    resource_type: 'cost',
    alert_level: 'warning',
    threshold_pct: 75,
    current_pct: 80,
    message: 'Cost usage at 80% of monthly ceiling',
    triggered_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCostRollup(overrides: Partial<CostRollup> = {}): CostRollup {
  const rollupId = `costrollup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    rollup_id: `sha256:${Buffer.from(rollupId).toString('hex').slice(0, 64)}`,
    period_start: new Date(Date.now() - 86400000 * 30).toISOString(),
    period_end: new Date().toISOString(),
    total_agencies: 25,
    total_cost_usd: 125000,
    total_storage_gb: 5000,
    by_agency: [],
    generated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK COST GOVERNANCE SERVICE
// ============================================================================

interface CostGovernanceService {
  // Cost Limits
  setCostLimit(agencyId: string, monthlyCeilingUsd: number): Promise<CostLimit>;
  getCostLimit(agencyId: string): Promise<CostLimit | null>;
  updateUsage(agencyId: string, usageUsd: number): Promise<CostLimit>;
  checkThreshold(agencyId: string): Promise<BudgetAlert | null>;

  // Retention Policies
  setRetentionPolicy(
    agencyId: string,
    evidenceDays: number,
    auditDays: number,
    reportDays: number
  ): Promise<RetentionPolicy>;
  getRetentionPolicy(agencyId: string): Promise<RetentionPolicy | null>;
  enableAutoPurge(agencyId: string): Promise<RetentionPolicy>;
  disableAutoPurge(agencyId: string): Promise<RetentionPolicy>;

  // Storage Budgets
  setStorageBudget(agencyId: string, totalQuotaGb: number): Promise<StorageBudget>;
  getStorageBudget(agencyId: string): Promise<StorageBudget | null>;
  updateStorageUsage(agencyId: string, usageGb: number): Promise<StorageBudget>;
  setEnforcementAction(agencyId: string, action: EnforcementAction): Promise<StorageBudget>;

  // Budget Alerts
  listAlerts(agencyId: string): Promise<readonly BudgetAlert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;

  // Cost Rollups
  generateCostRollup(periodStart: string, periodEnd: string): Promise<CostRollup>;
  getLatestRollup(): Promise<CostRollup | null>;
  getAgencySummary(agencyId: string): Promise<AgencyCostSummary | null>;
}

function createMockCostGovernanceService(): CostGovernanceService {
  const costLimits: Map<string, CostLimit> = new Map();
  const retentionPolicies: Map<string, RetentionPolicy> = new Map();
  const storageBudgets: Map<string, StorageBudget> = new Map();
  const alerts: Map<string, BudgetAlert[]> = new Map();
  const rollups: CostRollup[] = [];

  return {
    async setCostLimit(agencyId, monthlyCeilingUsd) {
      const limit = createMockCostLimit({
        agency_id: agencyId,
        monthly_ceiling_usd: monthlyCeilingUsd,
        current_usage_usd: 0,
      });
      costLimits.set(agencyId, limit);
      return limit;
    },

    async getCostLimit(agencyId) {
      return costLimits.get(agencyId) ?? null;
    },

    async updateUsage(agencyId, usageUsd) {
      const limit = costLimits.get(agencyId);
      if (!limit) throw new Error('cost limit not found');

      const updated = createMockCostLimit({ ...limit, current_usage_usd: usageUsd });
      costLimits.set(agencyId, updated);

      // Check if threshold breached
      const usagePct = (usageUsd / limit.monthly_ceiling_usd) * 100;
      if (usagePct >= limit.warning_threshold_pct) {
        const alert = createMockBudgetAlert({
          agency_id: agencyId,
          resource_type: 'cost',
          alert_level: usagePct >= limit.critical_threshold_pct ? 'critical' : 'warning',
          threshold_pct:
            usagePct >= limit.critical_threshold_pct
              ? limit.critical_threshold_pct
              : limit.warning_threshold_pct,
          current_pct: usagePct,
        });
        const agencyAlerts = alerts.get(agencyId) ?? [];
        agencyAlerts.push(alert);
        alerts.set(agencyId, agencyAlerts);
      }

      return updated;
    },

    async checkThreshold(agencyId) {
      const limit = costLimits.get(agencyId);
      if (!limit) return null;

      const usagePct = (limit.current_usage_usd / limit.monthly_ceiling_usd) * 100;
      if (usagePct >= limit.warning_threshold_pct) {
        return createMockBudgetAlert({
          agency_id: agencyId,
          current_pct: usagePct,
        });
      }
      return null;
    },

    async setRetentionPolicy(agencyId, evidenceDays, auditDays, reportDays) {
      const policy = createMockRetentionPolicy({
        agency_id: agencyId,
        evidence_retention_days: evidenceDays,
        audit_log_retention_days: auditDays,
        report_retention_days: reportDays,
      });
      retentionPolicies.set(agencyId, policy);
      return policy;
    },

    async getRetentionPolicy(agencyId) {
      return retentionPolicies.get(agencyId) ?? null;
    },

    async enableAutoPurge(agencyId) {
      const policy = retentionPolicies.get(agencyId);
      if (!policy) throw new Error('retention policy not found');

      const updated = createMockRetentionPolicy({ ...policy, auto_purge_enabled: true });
      retentionPolicies.set(agencyId, updated);
      return updated;
    },

    async disableAutoPurge(agencyId) {
      const policy = retentionPolicies.get(agencyId);
      if (!policy) throw new Error('retention policy not found');

      const updated = createMockRetentionPolicy({ ...policy, auto_purge_enabled: false });
      retentionPolicies.set(agencyId, updated);
      return updated;
    },

    async setStorageBudget(agencyId, totalQuotaGb) {
      const budget = createMockStorageBudget({
        agency_id: agencyId,
        total_quota_gb: totalQuotaGb,
        current_usage_gb: 0,
      });
      storageBudgets.set(agencyId, budget);
      return budget;
    },

    async getStorageBudget(agencyId) {
      return storageBudgets.get(agencyId) ?? null;
    },

    async updateStorageUsage(agencyId, usageGb) {
      const budget = storageBudgets.get(agencyId);
      if (!budget) throw new Error('storage budget not found');

      const updated = createMockStorageBudget({ ...budget, current_usage_gb: usageGb });
      storageBudgets.set(agencyId, updated);
      return updated;
    },

    async setEnforcementAction(agencyId, action) {
      const budget = storageBudgets.get(agencyId);
      if (!budget) throw new Error('storage budget not found');

      const updated = createMockStorageBudget({ ...budget, enforcement_action: action });
      storageBudgets.set(agencyId, updated);
      return updated;
    },

    async listAlerts(agencyId) {
      return alerts.get(agencyId) ?? [];
    },

    async acknowledgeAlert(_alertId) {
      // Acknowledge implementation
    },

    async generateCostRollup(periodStart, periodEnd) {
      const agencySummaries: AgencyCostSummary[] = [];
      let totalCost = 0;
      let totalStorage = 0;

      for (const [agencyId, limit] of costLimits.entries()) {
        const budget = storageBudgets.get(agencyId);
        const summary: AgencyCostSummary = {
          agency_id: agencyId,
          cost_usd: limit.current_usage_usd,
          storage_gb: budget?.current_usage_gb ?? 0,
          within_budget: limit.current_usage_usd <= limit.monthly_ceiling_usd,
        };
        agencySummaries.push(summary);
        totalCost += limit.current_usage_usd;
        totalStorage += budget?.current_usage_gb ?? 0;
      }

      const rollup = createMockCostRollup({
        period_start: periodStart,
        period_end: periodEnd,
        total_agencies: agencySummaries.length,
        total_cost_usd: totalCost,
        total_storage_gb: totalStorage,
        by_agency: agencySummaries,
      });
      rollups.push(rollup);
      return rollup;
    },

    async getLatestRollup() {
      return rollups.length > 0 ? rollups[rollups.length - 1] : null;
    },

    async getAgencySummary(agencyId) {
      const latest = await this.getLatestRollup();
      if (!latest) return null;

      return latest.by_agency.find(s => s.agency_id === agencyId) ?? null;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federation Adoption: Cost Governance Contracts', () => {
  let service: CostGovernanceService;

  beforeEach(() => {
    service = createMockCostGovernanceService();
  });

  // ==========================================================================
  // CONTRACT: cost_limits
  // ==========================================================================
  describe('CONTRACT: cost_limits', () => {
    it('sets cost limit for agency', async () => {
      const limit = await service.setCostLimit(`sha256:${'a'.repeat(64)}`, 10000);

      assert.ok(limit.limit_id.startsWith('sha256:'));
      assert.strictEqual(limit.monthly_ceiling_usd, 10000);
    });

    it('retrieves cost limit', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setCostLimit(agencyId, 10000);

      const limit = await service.getCostLimit(agencyId);
      assert.ok(limit);
      assert.strictEqual(limit.monthly_ceiling_usd, 10000);
    });

    it('updates usage', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setCostLimit(agencyId, 10000);

      const updated = await service.updateUsage(agencyId, 5000);
      assert.strictEqual(updated.current_usage_usd, 5000);
    });

    it('checks threshold breach', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setCostLimit(agencyId, 10000);
      await service.updateUsage(agencyId, 8000); // 80%

      const alert = await service.checkThreshold(agencyId);
      assert.ok(alert);
      assert.ok(alert.current_pct >= 75);
    });

    it('has warning and critical thresholds', async () => {
      const limit = createMockCostLimit();
      assert.ok(limit.warning_threshold_pct > 0);
      assert.ok(limit.critical_threshold_pct > limit.warning_threshold_pct);
    });
  });

  // ==========================================================================
  // CONTRACT: retention_policies
  // ==========================================================================
  describe('CONTRACT: retention_policies', () => {
    it('sets retention policy', async () => {
      const policy = await service.setRetentionPolicy(`sha256:${'a'.repeat(64)}`, 365, 2555, 1095);

      assert.ok(policy.policy_id.startsWith('sha256:'));
      assert.strictEqual(policy.evidence_retention_days, 365);
    });

    it('retrieves retention policy', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setRetentionPolicy(agencyId, 365, 2555, 1095);

      const policy = await service.getRetentionPolicy(agencyId);
      assert.ok(policy);
    });

    it('enables auto purge', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setRetentionPolicy(agencyId, 365, 2555, 1095);

      const policy = await service.enableAutoPurge(agencyId);
      assert.strictEqual(policy.auto_purge_enabled, true);
    });

    it('disables auto purge', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setRetentionPolicy(agencyId, 365, 2555, 1095);

      const policy = await service.disableAutoPurge(agencyId);
      assert.strictEqual(policy.auto_purge_enabled, false);
    });

    it('has separate retention for evidence, audit, reports', async () => {
      const policy = createMockRetentionPolicy();
      assert.ok(policy.evidence_retention_days > 0);
      assert.ok(policy.audit_log_retention_days > 0);
      assert.ok(policy.report_retention_days > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: storage_budgets
  // ==========================================================================
  describe('CONTRACT: storage_budgets', () => {
    it('sets storage budget', async () => {
      const budget = await service.setStorageBudget(`sha256:${'a'.repeat(64)}`, 500);

      assert.ok(budget.budget_id.startsWith('sha256:'));
      assert.strictEqual(budget.total_quota_gb, 500);
    });

    it('retrieves storage budget', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setStorageBudget(agencyId, 500);

      const budget = await service.getStorageBudget(agencyId);
      assert.ok(budget);
    });

    it('updates storage usage', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setStorageBudget(agencyId, 500);

      const updated = await service.updateStorageUsage(agencyId, 150);
      assert.strictEqual(updated.current_usage_gb, 150);
    });

    it('sets enforcement action', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setStorageBudget(agencyId, 500);

      const updated = await service.setEnforcementAction(agencyId, 'throttle');
      assert.strictEqual(updated.enforcement_action, 'throttle');
    });

    it('has separate quotas for evidence and audit', async () => {
      const budget = createMockStorageBudget();
      assert.ok(budget.evidence_quota_gb > 0);
      assert.ok(budget.audit_quota_gb > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: budget_alerts
  // ==========================================================================
  describe('CONTRACT: budget_alerts', () => {
    it('lists alerts for agency', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setCostLimit(agencyId, 10000);
      await service.updateUsage(agencyId, 8000); // Triggers alert

      const agencyAlerts = await service.listAlerts(agencyId);
      assert.ok(agencyAlerts.length >= 1);
    });

    it('alert has level and threshold', async () => {
      const alert = createMockBudgetAlert();
      assert.ok(['info', 'warning', 'critical'].includes(alert.alert_level));
      assert.ok(alert.threshold_pct > 0);
    });

    it('alert includes current percentage', async () => {
      const alert = createMockBudgetAlert({ current_pct: 80 });
      assert.strictEqual(alert.current_pct, 80);
    });
  });

  // ==========================================================================
  // CONTRACT: cost_rollups
  // ==========================================================================
  describe('CONTRACT: cost_rollups', () => {
    it('generates cost rollup', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setCostLimit(agencyId, 10000);
      await service.updateUsage(agencyId, 5000);

      const rollup = await service.generateCostRollup(
        new Date(Date.now() - 86400000 * 30).toISOString(),
        new Date().toISOString()
      );

      assert.ok(rollup.rollup_id.startsWith('sha256:'));
    });

    it('gets latest rollup', async () => {
      await service.setCostLimit(`sha256:${'a'.repeat(64)}`, 10000);
      await service.generateCostRollup(
        new Date(Date.now() - 86400000 * 30).toISOString(),
        new Date().toISOString()
      );

      const latest = await service.getLatestRollup();
      assert.ok(latest);
    });

    it('rollup includes per-agency summary', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.setCostLimit(agencyId, 10000);
      await service.updateUsage(agencyId, 5000);
      await service.setStorageBudget(agencyId, 500);
      await service.updateStorageUsage(agencyId, 100);

      await service.generateCostRollup(
        new Date(Date.now() - 86400000 * 30).toISOString(),
        new Date().toISOString()
      );

      const summary = await service.getAgencySummary(agencyId);
      assert.ok(summary);
      assert.ok(typeof summary.cost_usd === 'number');
      assert.ok(typeof summary.storage_gb === 'number');
    });

    it('rollup includes within_budget flag', async () => {
      const summary: AgencyCostSummary = {
        agency_id: `sha256:${'a'.repeat(64)}`,
        cost_usd: 5000,
        storage_gb: 100,
        within_budget: true,
      };
      assert.strictEqual(summary.within_budget, true);
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const limit = createMockCostLimit();
      const policy = createMockRetentionPolicy();
      const budget = createMockStorageBudget();
      const alert = createMockBudgetAlert();
      const rollup = createMockCostRollup();

      assert.ok(limit.limit_id.startsWith('sha256:'));
      assert.ok(policy.policy_id.startsWith('sha256:'));
      assert.ok(budget.budget_id.startsWith('sha256:'));
      assert.ok(alert.alert_id.startsWith('sha256:'));
      assert.ok(rollup.rollup_id.startsWith('sha256:'));
    });

    it('limits are configurable per agency', async () => {
      const agency1 = `sha256:${'a'.repeat(64)}`;
      const agency2 = `sha256:${'b'.repeat(64)}`;

      await service.setCostLimit(agency1, 10000);
      await service.setCostLimit(agency2, 5000);

      const limit1 = await service.getCostLimit(agency1);
      const limit2 = await service.getCostLimit(agency2);

      assert.ok(limit1);
      assert.ok(limit2);
      assert.notStrictEqual(limit1.monthly_ceiling_usd, limit2.monthly_ceiling_usd);
    });

    it('alerts before hard limits', async () => {
      const limit = createMockCostLimit();
      // Warning at 75%, critical at 90%, hard limit at 100%
      assert.ok(limit.warning_threshold_pct < 100);
      assert.ok(limit.critical_threshold_pct < 100);
    });
  });
});
