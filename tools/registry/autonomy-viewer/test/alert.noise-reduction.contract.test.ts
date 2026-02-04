/**
 * Phase XXI — Optimization & Sustainability
 * ==========================================
 * Contract: alert.noise-reduction.contract.test.ts
 *
 * Tests alert noise reduction: dedupe effectiveness, routing guardrails,
 * severity preservation, and noise metrics.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - SEV1/SEV2 alerts are never suppressed by noise reduction
 * - Dedupe preserves critical signal while reducing volume
 * - Alert routing reduces noise without masking incidents
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type AlertId = `sha256:${string}`;
type DedupeGroupId = `sha256:${string}`;
type RoutingRuleId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type ServiceId = `sha256:${string}`;

type AlertSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'info';
type AlertCategory = 'compliance' | 'availability' | 'security' | 'performance' | 'capacity';
type DedupeStrategy = 'fingerprint' | 'content_hash' | 'time_window' | 'count_threshold';
type RoutingAction = 'page' | 'slack' | 'email' | 'ticket' | 'log_only' | 'suppress';

interface Alert {
  readonly id: AlertId;
  readonly agencyId: AgencyId;
  readonly serviceId: ServiceId;
  readonly severity: AlertSeverity;
  readonly category: AlertCategory;
  readonly title: string;
  readonly fingerprint: string;
  readonly createdAt: string;
  readonly deduplicated: boolean;
  readonly dedupeGroupId?: DedupeGroupId;
  readonly routed: boolean;
  readonly routingAction?: RoutingAction;
}

interface DedupeGroup {
  readonly id: DedupeGroupId;
  readonly fingerprint: string;
  readonly strategy: DedupeStrategy;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly count: number;
  readonly severity: AlertSeverity;
  readonly representativeAlertId: AlertId;
}

interface DedupeConfig {
  readonly strategy: DedupeStrategy;
  readonly windowMinutes: number;
  readonly countThreshold: number;
  readonly enabled: boolean;
}

interface RoutingRule {
  readonly id: RoutingRuleId;
  readonly name: string;
  readonly priority: number;
  readonly conditions: RoutingCondition;
  readonly action: RoutingAction;
  readonly enabled: boolean;
  readonly createdAt: string;
}

interface RoutingCondition {
  readonly severities?: readonly AlertSeverity[];
  readonly categories?: readonly AlertCategory[];
  readonly agencyIds?: readonly AgencyId[];
  readonly minCount?: number;
  readonly timeWindowMinutes?: number;
}

interface NoiseMetrics {
  readonly period: string;
  readonly totalAlerts: number;
  readonly deduplicatedCount: number;
  readonly dedupeRate: number;
  readonly bySeverity: Record<AlertSeverity, { total: number; deduplicated: number }>;
  readonly byCategory: Record<AlertCategory, { total: number; deduplicated: number }>;
  readonly topNoisySources: readonly { serviceId: ServiceId; count: number }[];
  readonly signalToNoiseRatio: number;
}

interface DedupeEffectiveness {
  readonly period: string;
  readonly strategy: DedupeStrategy;
  readonly alertsProcessed: number;
  readonly groupsCreated: number;
  readonly volumeReduction: number;
  readonly falsePositiveRate: number;
  readonly missedDuplicateRate: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockAlertNoiseService() {
  const alerts = new Map<AlertId, Alert>();
  const dedupeGroups = new Map<DedupeGroupId, DedupeGroup>();
  const routingRules = new Map<RoutingRuleId, RoutingRule>();
  let dedupeConfig: DedupeConfig = {
    strategy: 'fingerprint',
    windowMinutes: 60,
    countThreshold: 5,
    enabled: true,
  };

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Initialize default routing rules
  const defaultRules: Array<Omit<RoutingRule, 'id' | 'createdAt'>> = [
    {
      name: 'SEV1 Always Page',
      priority: 1,
      conditions: { severities: ['sev1'] },
      action: 'page',
      enabled: true,
    },
    {
      name: 'SEV2 Always Page',
      priority: 2,
      conditions: { severities: ['sev2'] },
      action: 'page',
      enabled: true,
    },
    {
      name: 'Security Alerts to Slack',
      priority: 3,
      conditions: { categories: ['security'], severities: ['sev3', 'sev4'] },
      action: 'slack',
      enabled: true,
    },
    {
      name: 'Info to Log Only',
      priority: 100,
      conditions: { severities: ['info'] },
      action: 'log_only',
      enabled: true,
    },
  ];

  for (const rule of defaultRules) {
    const id = generateId('rule') as RoutingRuleId;
    routingRules.set(id, {
      ...rule,
      id,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    // Alert Processing
    processAlert(
      agencyId: AgencyId,
      serviceId: ServiceId,
      severity: AlertSeverity,
      category: AlertCategory,
      title: string,
      fingerprint: string
    ): Alert {
      const id = generateId('alert') as AlertId;

      // Check dedupe
      let deduplicated = false;
      let dedupeGroupId: DedupeGroupId | undefined;

      if (dedupeConfig.enabled) {
        const existingGroup = this.findDedupeGroup(fingerprint);
        if (existingGroup) {
          // Add to existing group
          deduplicated = true;
          dedupeGroupId = existingGroup.id;
          this.updateDedupeGroup(existingGroup.id, id, severity);
        } else {
          // Create new group
          dedupeGroupId = this.createDedupeGroup(fingerprint, id, severity);
        }
      }

      // Determine routing
      const routingAction = this.determineRouting(severity, category, agencyId, deduplicated);

      const alert: Alert = {
        id,
        agencyId,
        serviceId,
        severity,
        category,
        title,
        fingerprint,
        createdAt: new Date().toISOString(),
        deduplicated,
        dedupeGroupId,
        routed: true,
        routingAction,
      };

      alerts.set(id, alert);
      return alert;
    },

    getAlert(id: AlertId): Alert | null {
      return alerts.get(id) ?? null;
    },

    getAlertsByAgency(agencyId: AgencyId): readonly Alert[] {
      return [...alerts.values()].filter(a => a.agencyId === agencyId);
    },

    getAlertsBySeverity(severity: AlertSeverity): readonly Alert[] {
      return [...alerts.values()].filter(a => a.severity === severity);
    },

    // Dedupe Management
    findDedupeGroup(fingerprint: string): DedupeGroup | null {
      const now = Date.now();
      for (const group of dedupeGroups.values()) {
        if (group.fingerprint === fingerprint) {
          const lastSeen = new Date(group.lastSeenAt).getTime();
          const windowMs = dedupeConfig.windowMinutes * 60 * 1000;
          if (now - lastSeen <= windowMs) {
            return group;
          }
        }
      }
      return null;
    },

    createDedupeGroup(
      fingerprint: string,
      alertId: AlertId,
      severity: AlertSeverity
    ): DedupeGroupId {
      const id = generateId('dedupegroup') as DedupeGroupId;
      const group: DedupeGroup = {
        id,
        fingerprint,
        strategy: dedupeConfig.strategy,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        count: 1,
        severity,
        representativeAlertId: alertId,
      };
      dedupeGroups.set(id, group);
      return id;
    },

    updateDedupeGroup(id: DedupeGroupId, alertId: AlertId, severity: AlertSeverity): void {
      const group = dedupeGroups.get(id);
      if (!group) return;

      // Escalate severity if new alert is higher
      const severityOrder: AlertSeverity[] = ['sev1', 'sev2', 'sev3', 'sev4', 'info'];
      const newSeverity =
        severityOrder.indexOf(severity) < severityOrder.indexOf(group.severity)
          ? severity
          : group.severity;

      const updated: DedupeGroup = {
        ...group,
        lastSeenAt: new Date().toISOString(),
        count: group.count + 1,
        severity: newSeverity,
      };
      dedupeGroups.set(id, updated);
    },

    getDedupeGroup(id: DedupeGroupId): DedupeGroup | null {
      return dedupeGroups.get(id) ?? null;
    },

    getAllDedupeGroups(): readonly DedupeGroup[] {
      return [...dedupeGroups.values()];
    },

    // Configuration
    getDedupeConfig(): DedupeConfig {
      return { ...dedupeConfig };
    },

    setDedupeConfig(config: Partial<DedupeConfig>): DedupeConfig {
      dedupeConfig = { ...dedupeConfig, ...config };
      return { ...dedupeConfig };
    },

    // Routing
    determineRouting(
      severity: AlertSeverity,
      category: AlertCategory,
      agencyId: AgencyId,
      deduplicated: boolean
    ): RoutingAction {
      // SEV1/SEV2 always page, never suppressed
      if (severity === 'sev1' || severity === 'sev2') {
        return 'page';
      }

      // Get matching rules sorted by priority
      const sortedRules = [...routingRules.values()]
        .filter(r => r.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        if (this.matchesCondition(rule.conditions, severity, category, agencyId)) {
          // Never suppress SEV1/SEV2 even if rule says so
          if (rule.action === 'suppress' && (severity === 'sev1' || severity === 'sev2')) {
            continue;
          }
          return rule.action;
        }
      }

      // Default routing based on severity
      switch (severity) {
        case 'sev3':
          return 'slack';
        case 'sev4':
          return 'email';
        case 'info':
          return 'log_only';
        default:
          return 'ticket';
      }
    },

    matchesCondition(
      conditions: RoutingCondition,
      severity: AlertSeverity,
      category: AlertCategory,
      agencyId: AgencyId
    ): boolean {
      if (conditions.severities && !conditions.severities.includes(severity)) {
        return false;
      }
      if (conditions.categories && !conditions.categories.includes(category)) {
        return false;
      }
      if (conditions.agencyIds && !conditions.agencyIds.includes(agencyId)) {
        return false;
      }
      return true;
    },

    // Routing Rules
    createRoutingRule(
      name: string,
      priority: number,
      conditions: RoutingCondition,
      action: RoutingAction
    ): RoutingRule {
      const id = generateId('rule') as RoutingRuleId;
      const rule: RoutingRule = {
        id,
        name,
        priority,
        conditions,
        action,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      routingRules.set(id, rule);
      return rule;
    },

    getRoutingRule(id: RoutingRuleId): RoutingRule | null {
      return routingRules.get(id) ?? null;
    },

    getAllRoutingRules(): readonly RoutingRule[] {
      return [...routingRules.values()].sort((a, b) => a.priority - b.priority);
    },

    enableRoutingRule(id: RoutingRuleId): RoutingRule | null {
      const rule = routingRules.get(id);
      if (!rule) return null;
      const updated = { ...rule, enabled: true };
      routingRules.set(id, updated);
      return updated;
    },

    disableRoutingRule(id: RoutingRuleId): RoutingRule | null {
      const rule = routingRules.get(id);
      if (!rule) return null;
      const updated = { ...rule, enabled: false };
      routingRules.set(id, updated);
      return updated;
    },

    // Critical Alert Protection
    canSuppressAlert(severity: AlertSeverity): boolean {
      return severity !== 'sev1' && severity !== 'sev2';
    },

    // Metrics
    calculateNoiseMetrics(period: string): NoiseMetrics {
      const allAlerts = [...alerts.values()];
      const totalAlerts = allAlerts.length;
      const deduplicatedCount = allAlerts.filter(a => a.deduplicated).length;
      const dedupeRate = totalAlerts > 0 ? (deduplicatedCount / totalAlerts) * 100 : 0;

      const bySeverity: Record<AlertSeverity, { total: number; deduplicated: number }> = {
        sev1: { total: 0, deduplicated: 0 },
        sev2: { total: 0, deduplicated: 0 },
        sev3: { total: 0, deduplicated: 0 },
        sev4: { total: 0, deduplicated: 0 },
        info: { total: 0, deduplicated: 0 },
      };

      const byCategory: Record<AlertCategory, { total: number; deduplicated: number }> = {
        compliance: { total: 0, deduplicated: 0 },
        availability: { total: 0, deduplicated: 0 },
        security: { total: 0, deduplicated: 0 },
        performance: { total: 0, deduplicated: 0 },
        capacity: { total: 0, deduplicated: 0 },
      };

      const serviceAlertCounts = new Map<ServiceId, number>();

      for (const alert of allAlerts) {
        bySeverity[alert.severity].total++;
        if (alert.deduplicated) bySeverity[alert.severity].deduplicated++;

        byCategory[alert.category].total++;
        if (alert.deduplicated) byCategory[alert.category].deduplicated++;

        const count = serviceAlertCounts.get(alert.serviceId) ?? 0;
        serviceAlertCounts.set(alert.serviceId, count + 1);
      }

      const topNoisySources = [...serviceAlertCounts.entries()]
        .map(([serviceId, count]) => ({ serviceId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Signal = unique alerts (after dedupe), Noise = duplicates
      const uniqueAlerts = totalAlerts - deduplicatedCount;
      const signalToNoiseRatio =
        deduplicatedCount > 0 ? uniqueAlerts / deduplicatedCount : totalAlerts;

      return {
        period,
        totalAlerts,
        deduplicatedCount,
        dedupeRate: Math.round(dedupeRate * 100) / 100,
        bySeverity,
        byCategory,
        topNoisySources,
        signalToNoiseRatio: Math.round(signalToNoiseRatio * 100) / 100,
      };
    },

    calculateDedupeEffectiveness(period: string): DedupeEffectiveness {
      const allAlerts = [...alerts.values()];
      const groups = [...dedupeGroups.values()];

      const alertsProcessed = allAlerts.length;
      const groupsCreated = groups.length;
      const volumeReduction =
        alertsProcessed > 0 ? ((alertsProcessed - groupsCreated) / alertsProcessed) * 100 : 0;

      // Mock values for false positive/missed rates
      const falsePositiveRate = 0.5; // 0.5% false positives
      const missedDuplicateRate = 1.0; // 1% missed duplicates

      return {
        period,
        strategy: dedupeConfig.strategy,
        alertsProcessed,
        groupsCreated,
        volumeReduction: Math.round(volumeReduction * 100) / 100,
        falsePositiveRate,
        missedDuplicateRate,
      };
    },

    // Noise Threshold Check
    isAboveNoiseThreshold(serviceId: ServiceId, thresholdPerHour: number): boolean {
      const now = Date.now();
      const hourAgo = now - 60 * 60 * 1000;

      const recentAlerts = [...alerts.values()].filter(a => {
        const alertTime = new Date(a.createdAt).getTime();
        return a.serviceId === serviceId && alertTime >= hourAgo;
      });

      return recentAlerts.length > thresholdPerHour;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXI: Alert Noise Reduction Contracts', () => {
  let noiseService: ReturnType<typeof createMockAlertNoiseService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const serviceA = 'sha256:service_alpha' as ServiceId;
  const serviceB = 'sha256:service_beta' as ServiceId;

  beforeEach(() => {
    noiseService = createMockAlertNoiseService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate alert IDs with sha256: prefix', () => {
      const alert = noiseService.processAlert(
        agencyA,
        serviceA,
        'sev3',
        'performance',
        'Test',
        'fp1'
      );
      assert.ok(alert.id.startsWith('sha256:'));
    });

    it('should generate dedupe group IDs with sha256: prefix', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test', 'fp1');
      const groups = noiseService.getAllDedupeGroups();
      assert.ok(groups[0].id.startsWith('sha256:'));
    });

    it('should use opaque agency IDs', () => {
      const alert = noiseService.processAlert(
        agencyA,
        serviceA,
        'sev3',
        'performance',
        'Test',
        'fp1'
      );
      assert.ok(alert.agencyId.startsWith('sha256:'));
    });

    it('should use opaque service IDs', () => {
      const alert = noiseService.processAlert(
        agencyA,
        serviceA,
        'sev3',
        'performance',
        'Test',
        'fp1'
      );
      assert.ok(alert.serviceId.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Critical Alert Protection Tests
  // ==========================================================================

  describe('Critical Alert Protection', () => {
    it('should never suppress SEV1 alerts', () => {
      assert.strictEqual(noiseService.canSuppressAlert('sev1'), false);
    });

    it('should never suppress SEV2 alerts', () => {
      assert.strictEqual(noiseService.canSuppressAlert('sev2'), false);
    });

    it('should allow suppressing SEV3 alerts', () => {
      assert.strictEqual(noiseService.canSuppressAlert('sev3'), true);
    });

    it('should allow suppressing SEV4 alerts', () => {
      assert.strictEqual(noiseService.canSuppressAlert('sev4'), true);
    });

    it('should allow suppressing info alerts', () => {
      assert.strictEqual(noiseService.canSuppressAlert('info'), true);
    });

    it('should always route SEV1 to page', () => {
      const alert = noiseService.processAlert(
        agencyA,
        serviceA,
        'sev1',
        'availability',
        'Critical',
        'fp1'
      );
      assert.strictEqual(alert.routingAction, 'page');
    });

    it('should always route SEV2 to page', () => {
      const alert = noiseService.processAlert(agencyA, serviceA, 'sev2', 'security', 'High', 'fp1');
      assert.strictEqual(alert.routingAction, 'page');
    });
  });

  // ==========================================================================
  // Dedupe Tests
  // ==========================================================================

  describe('Deduplication', () => {
    it('should create dedupe group for first alert', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test', 'fp1');
      const groups = noiseService.getAllDedupeGroups();
      assert.strictEqual(groups.length, 1);
      assert.strictEqual(groups[0].count, 1);
    });

    it('should deduplicate matching fingerprints', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 1', 'fp1');
      const alert2 = noiseService.processAlert(
        agencyA,
        serviceA,
        'sev3',
        'performance',
        'Test 2',
        'fp1'
      );
      assert.strictEqual(alert2.deduplicated, true);

      const groups = noiseService.getAllDedupeGroups();
      assert.strictEqual(groups.length, 1);
      assert.strictEqual(groups[0].count, 2);
    });

    it('should create separate groups for different fingerprints', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 1', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 2', 'fp2');

      const groups = noiseService.getAllDedupeGroups();
      assert.strictEqual(groups.length, 2);
    });

    it('should escalate severity in dedupe group', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev4', 'performance', 'Test 1', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 2', 'fp1');

      const groups = noiseService.getAllDedupeGroups();
      assert.strictEqual(groups[0].severity, 'sev3');
    });

    it('should respect dedupe window', () => {
      const config = noiseService.getDedupeConfig();
      assert.ok(config.windowMinutes > 0);
    });

    it('should disable dedupe when configured', () => {
      noiseService.setDedupeConfig({ enabled: false });
      const alert = noiseService.processAlert(
        agencyA,
        serviceA,
        'sev3',
        'performance',
        'Test',
        'fp1'
      );
      assert.strictEqual(alert.deduplicated, false);
    });
  });

  // ==========================================================================
  // Routing Tests
  // ==========================================================================

  describe('Alert Routing', () => {
    it('should have default routing rules', () => {
      const rules = noiseService.getAllRoutingRules();
      assert.ok(rules.length >= 3);
    });

    it('should route SEV1 to page regardless of rules', () => {
      const action = noiseService.determineRouting('sev1', 'performance', agencyA, false);
      assert.strictEqual(action, 'page');
    });

    it('should route info to log_only', () => {
      const action = noiseService.determineRouting('info', 'performance', agencyA, false);
      assert.strictEqual(action, 'log_only');
    });

    it('should create custom routing rule', () => {
      const rule = noiseService.createRoutingRule(
        'Custom Rule',
        50,
        { categories: ['capacity'] },
        'email'
      );
      assert.ok(rule.id.startsWith('sha256:'));
      assert.strictEqual(rule.action, 'email');
    });

    it('should disable routing rule', () => {
      const rules = noiseService.getAllRoutingRules();
      const disabled = noiseService.disableRoutingRule(rules[0].id);
      assert.strictEqual(disabled?.enabled, false);
    });

    it('should re-enable routing rule', () => {
      const rules = noiseService.getAllRoutingRules();
      noiseService.disableRoutingRule(rules[0].id);
      const enabled = noiseService.enableRoutingRule(rules[0].id);
      assert.strictEqual(enabled?.enabled, true);
    });

    it('should match conditions correctly', () => {
      const conditions: RoutingCondition = {
        severities: ['sev3', 'sev4'],
        categories: ['security'],
      };
      assert.strictEqual(
        noiseService.matchesCondition(conditions, 'sev3', 'security', agencyA),
        true
      );
      assert.strictEqual(
        noiseService.matchesCondition(conditions, 'sev1', 'security', agencyA),
        false
      );
      assert.strictEqual(
        noiseService.matchesCondition(conditions, 'sev3', 'performance', agencyA),
        false
      );
    });
  });

  // ==========================================================================
  // Noise Metrics Tests
  // ==========================================================================

  describe('Noise Metrics', () => {
    it('should calculate noise metrics', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 1', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 2', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev4', 'capacity', 'Test 3', 'fp2');

      const metrics = noiseService.calculateNoiseMetrics('2026-01');
      assert.strictEqual(metrics.totalAlerts, 3);
      assert.strictEqual(metrics.deduplicatedCount, 1);
    });

    it('should calculate dedupe rate', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 1', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 2', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev4', 'capacity', 'Test 3', 'fp2');
      noiseService.processAlert(agencyA, serviceA, 'sev4', 'capacity', 'Test 4', 'fp2');

      const metrics = noiseService.calculateNoiseMetrics('2026-01');
      assert.strictEqual(metrics.dedupeRate, 50);
    });

    it('should track by severity', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev1', 'availability', 'Critical', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Normal', 'fp2');

      const metrics = noiseService.calculateNoiseMetrics('2026-01');
      assert.strictEqual(metrics.bySeverity.sev1.total, 1);
      assert.strictEqual(metrics.bySeverity.sev3.total, 1);
    });

    it('should track by category', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'security', 'Security', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Perf', 'fp2');

      const metrics = noiseService.calculateNoiseMetrics('2026-01');
      assert.strictEqual(metrics.byCategory.security.total, 1);
      assert.strictEqual(metrics.byCategory.performance.total, 1);
    });

    it('should identify noisy sources', () => {
      for (let i = 0; i < 10; i++) {
        noiseService.processAlert(agencyA, serviceA, 'sev4', 'performance', `Alert ${i}`, `fp${i}`);
      }
      for (let i = 0; i < 5; i++) {
        noiseService.processAlert(
          agencyA,
          serviceB,
          'sev4',
          'performance',
          `Alert ${i}`,
          `fpB${i}`
        );
      }

      const metrics = noiseService.calculateNoiseMetrics('2026-01');
      assert.strictEqual(metrics.topNoisySources[0].serviceId, serviceA);
      assert.strictEqual(metrics.topNoisySources[0].count, 10);
    });

    it('should calculate signal to noise ratio', () => {
      // 4 alerts, 2 unique fingerprints = 2 deduplicated
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 1', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 2', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev4', 'capacity', 'Test 3', 'fp2');
      noiseService.processAlert(agencyA, serviceA, 'sev4', 'capacity', 'Test 4', 'fp2');

      const metrics = noiseService.calculateNoiseMetrics('2026-01');
      assert.ok(metrics.signalToNoiseRatio > 0);
    });
  });

  // ==========================================================================
  // Dedupe Effectiveness Tests
  // ==========================================================================

  describe('Dedupe Effectiveness', () => {
    it('should calculate dedupe effectiveness', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 1', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 2', 'fp1');
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test 3', 'fp1');

      const effectiveness = noiseService.calculateDedupeEffectiveness('2026-01');
      assert.strictEqual(effectiveness.alertsProcessed, 3);
      assert.strictEqual(effectiveness.groupsCreated, 1);
    });

    it('should calculate volume reduction', () => {
      for (let i = 0; i < 10; i++) {
        noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', `Test ${i}`, 'fp1');
      }

      const effectiveness = noiseService.calculateDedupeEffectiveness('2026-01');
      assert.strictEqual(effectiveness.alertsProcessed, 10);
      assert.strictEqual(effectiveness.groupsCreated, 1);
      assert.ok(effectiveness.volumeReduction >= 80);
    });

    it('should track current strategy', () => {
      const effectiveness = noiseService.calculateDedupeEffectiveness('2026-01');
      assert.strictEqual(effectiveness.strategy, 'fingerprint');
    });

    it('should report false positive rate', () => {
      const effectiveness = noiseService.calculateDedupeEffectiveness('2026-01');
      assert.ok(effectiveness.falsePositiveRate < 5); // Less than 5%
    });
  });

  // ==========================================================================
  // Noise Threshold Tests
  // ==========================================================================

  describe('Noise Thresholds', () => {
    it('should detect above threshold', () => {
      for (let i = 0; i < 50; i++) {
        noiseService.processAlert(agencyA, serviceA, 'sev4', 'performance', `Alert ${i}`, `fp${i}`);
      }

      const isNoisy = noiseService.isAboveNoiseThreshold(serviceA, 25);
      assert.strictEqual(isNoisy, true);
    });

    it('should detect below threshold', () => {
      for (let i = 0; i < 10; i++) {
        noiseService.processAlert(agencyA, serviceA, 'sev4', 'performance', `Alert ${i}`, `fp${i}`);
      }

      const isNoisy = noiseService.isAboveNoiseThreshold(serviceA, 25);
      assert.strictEqual(isNoisy, false);
    });
  });

  // ==========================================================================
  // Configuration Tests
  // ==========================================================================

  describe('Configuration', () => {
    it('should get dedupe config', () => {
      const config = noiseService.getDedupeConfig();
      assert.ok(config.strategy);
      assert.ok(config.windowMinutes > 0);
    });

    it('should set dedupe config', () => {
      noiseService.setDedupeConfig({ windowMinutes: 120, countThreshold: 10 });
      const config = noiseService.getDedupeConfig();
      assert.strictEqual(config.windowMinutes, 120);
      assert.strictEqual(config.countThreshold, 10);
    });

    it('should preserve unset config values', () => {
      const original = noiseService.getDedupeConfig();
      noiseService.setDedupeConfig({ windowMinutes: 120 });
      const updated = noiseService.getDedupeConfig();
      assert.strictEqual(updated.strategy, original.strategy);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of dedupe groups', () => {
      noiseService.processAlert(agencyA, serviceA, 'sev3', 'performance', 'Test', 'fp1');
      const g1 = noiseService.getAllDedupeGroups();
      const g2 = noiseService.getAllDedupeGroups();
      assert.ok(g1 !== g2);
    });

    it('should return copies of routing rules', () => {
      const r1 = noiseService.getAllRoutingRules();
      const r2 = noiseService.getAllRoutingRules();
      assert.ok(r1 !== r2);
    });

    it('should return copy of config', () => {
      const c1 = noiseService.getDedupeConfig();
      const c2 = noiseService.getDedupeConfig();
      assert.ok(c1 !== c2);
    });
  });
});
