/**
 * Incident Response Governance: Taxonomy Contract Tests
 *
 * Phase IX - Incident classification and severity mapping.
 *
 * CONTRACT SURFACE:
 * - Incident Types: Defined taxonomy of incident categories
 * - Severity Levels: SEV1-SEV4 with clear criteria
 * - Routing Rules: Severity → team/escalation mapping
 * - Classification: Structured incident classification
 *
 * INVARIANTS:
 * - All incidents must have a valid type and severity
 * - Severity determines initial response SLA
 * - Classification is immutable after triage completion
 * - Incident IDs are opaque (sha256:)
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Incident type taxonomy
 */
type IncidentType =
  | 'security_breach'
  | 'auth_outage'
  | 'data_exposure'
  | 'service_degradation'
  | 'governance_drift'
  | 'compliance_violation'
  | 'infrastructure_failure'
  | 'third_party_outage';

/**
 * Severity level (SEV1 = most critical)
 */
type SeverityLevel = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

/**
 * Impact scope
 */
type ImpactScope = 'global' | 'regional' | 'service' | 'component' | 'user_subset';

/**
 * Response team
 */
type ResponseTeam = 'security' | 'platform' | 'on_call' | 'compliance' | 'engineering';

/**
 * Incident classification
 */
interface IncidentClassification {
  readonly incident_id: string;
  readonly type: IncidentType;
  readonly severity: SeverityLevel;
  readonly impact_scope: ImpactScope;
  readonly affected_surfaces: readonly string[];
  readonly classified_at: string;
  readonly classified_by: string;
  readonly is_finalized: boolean;
  readonly checksum: string;
}

/**
 * Severity criteria
 */
interface SeverityCriteria {
  readonly severity: SeverityLevel;
  readonly description: string;
  readonly response_sla_minutes: number;
  readonly update_frequency_minutes: number;
  readonly requires_incident_commander: boolean;
  readonly requires_exec_notification: boolean;
  readonly auto_escalation_minutes: number | null;
}

/**
 * Routing rule
 */
interface RoutingRule {
  readonly rule_id: string;
  readonly incident_type: IncidentType;
  readonly severity: SeverityLevel;
  readonly primary_team: ResponseTeam;
  readonly escalation_teams: readonly ResponseTeam[];
  readonly notification_channels: readonly string[];
  readonly runbook_ref: string;
}

/**
 * Incident type definition
 */
interface IncidentTypeDefinition {
  readonly type: IncidentType;
  readonly description: string;
  readonly default_severity: SeverityLevel;
  readonly affected_surfaces: readonly string[];
  readonly requires_security_review: boolean;
  readonly requires_compliance_review: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockIncidentClassification(
  overrides: Partial<IncidentClassification> = {}
): IncidentClassification {
  const incidentId = `incident-${Date.now()}`;
  return {
    incident_id: `sha256:${Buffer.from(incidentId).toString('hex').slice(0, 64)}`,
    type: 'service_degradation',
    severity: 'SEV3',
    impact_scope: 'service',
    affected_surfaces: ['data_access'],
    classified_at: new Date().toISOString(),
    classified_by: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    is_finalized: false,
    checksum: `sha256:${Buffer.from(`checksum-${incidentId}`).toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockSeverityCriteria(overrides: Partial<SeverityCriteria> = {}): SeverityCriteria {
  return {
    severity: 'SEV2',
    description: 'Major incident affecting multiple users or services',
    response_sla_minutes: 30,
    update_frequency_minutes: 30,
    requires_incident_commander: true,
    requires_exec_notification: false,
    auto_escalation_minutes: 60,
    ...overrides,
  };
}

function createMockRoutingRule(overrides: Partial<RoutingRule> = {}): RoutingRule {
  return {
    rule_id: `rule-${Date.now()}`,
    incident_type: 'service_degradation',
    severity: 'SEV2',
    primary_team: 'on_call',
    escalation_teams: ['platform', 'engineering'],
    notification_channels: ['pagerduty', 'slack-incidents'],
    runbook_ref: 'https://runbooks.terrafusion.gov/incidents/service-degradation',
    ...overrides,
  };
}

function createMockIncidentTypeDefinition(
  overrides: Partial<IncidentTypeDefinition> = {}
): IncidentTypeDefinition {
  return {
    type: 'service_degradation',
    description: 'Partial or complete service unavailability',
    default_severity: 'SEV2',
    affected_surfaces: ['scaling', 'data_access'],
    requires_security_review: false,
    requires_compliance_review: false,
    ...overrides,
  };
}

// ============================================================================
// MOCK TAXONOMY STORE
// ============================================================================

interface TaxonomyStore {
  // Incident Types
  getIncidentTypes(): Promise<readonly IncidentTypeDefinition[]>;
  getIncidentType(type: IncidentType): Promise<IncidentTypeDefinition>;
  isValidType(type: string): boolean;

  // Severity Levels
  getSeverityCriteria(severity: SeverityLevel): Promise<SeverityCriteria>;
  getAllSeverityCriteria(): Promise<readonly SeverityCriteria[]>;
  getResponseSlaMinutes(severity: SeverityLevel): number;

  // Classification
  classifyIncident(
    type: IncidentType,
    severity: SeverityLevel,
    impactScope: ImpactScope,
    operatorId: string
  ): Promise<IncidentClassification>;
  getClassification(incidentId: string): Promise<IncidentClassification | null>;
  finalizeClassification(incidentId: string): Promise<IncidentClassification>;
  isClassificationFinalized(incidentId: string): Promise<boolean>;

  // Routing
  getRoutingRule(type: IncidentType, severity: SeverityLevel): Promise<RoutingRule>;
  getRoutingRules(): Promise<readonly RoutingRule[]>;
  getPrimaryTeam(type: IncidentType, severity: SeverityLevel): ResponseTeam;
}

function createMockTaxonomyStore(): TaxonomyStore {
  const classifications: Map<string, IncidentClassification> = new Map();

  const incidentTypes: IncidentTypeDefinition[] = [
    createMockIncidentTypeDefinition({
      type: 'security_breach',
      description: 'Unauthorized access or data breach',
      default_severity: 'SEV1',
      requires_security_review: true,
      requires_compliance_review: true,
    }),
    createMockIncidentTypeDefinition({
      type: 'auth_outage',
      description: 'Authentication service unavailable',
      default_severity: 'SEV1',
      affected_surfaces: ['identity', 'authz'],
    }),
    createMockIncidentTypeDefinition({
      type: 'data_exposure',
      description: 'Sensitive data exposed or leaked',
      default_severity: 'SEV1',
      requires_security_review: true,
      requires_compliance_review: true,
    }),
    createMockIncidentTypeDefinition({
      type: 'service_degradation',
      description: 'Partial or complete service unavailability',
      default_severity: 'SEV2',
    }),
    createMockIncidentTypeDefinition({
      type: 'governance_drift',
      description: 'Security posture drift detected',
      default_severity: 'SEV3',
      requires_compliance_review: true,
    }),
    createMockIncidentTypeDefinition({
      type: 'compliance_violation',
      description: 'Policy or compliance violation detected',
      default_severity: 'SEV2',
      requires_compliance_review: true,
    }),
    createMockIncidentTypeDefinition({
      type: 'infrastructure_failure',
      description: 'Infrastructure component failure',
      default_severity: 'SEV2',
      affected_surfaces: ['scaling'],
    }),
    createMockIncidentTypeDefinition({
      type: 'third_party_outage',
      description: 'Third party service outage',
      default_severity: 'SEV3',
    }),
  ];

  const severityCriteria: SeverityCriteria[] = [
    createMockSeverityCriteria({
      severity: 'SEV1',
      description: 'Critical incident with global impact',
      response_sla_minutes: 15,
      update_frequency_minutes: 15,
      requires_incident_commander: true,
      requires_exec_notification: true,
      auto_escalation_minutes: 30,
    }),
    createMockSeverityCriteria({
      severity: 'SEV2',
      description: 'Major incident affecting multiple users',
      response_sla_minutes: 30,
      update_frequency_minutes: 30,
      requires_incident_commander: true,
      requires_exec_notification: false,
      auto_escalation_minutes: 60,
    }),
    createMockSeverityCriteria({
      severity: 'SEV3',
      description: 'Minor incident with limited impact',
      response_sla_minutes: 120,
      update_frequency_minutes: 60,
      requires_incident_commander: false,
      requires_exec_notification: false,
      auto_escalation_minutes: 240,
    }),
    createMockSeverityCriteria({
      severity: 'SEV4',
      description: 'Low-priority issue or improvement',
      response_sla_minutes: 480,
      update_frequency_minutes: 240,
      requires_incident_commander: false,
      requires_exec_notification: false,
      auto_escalation_minutes: null,
    }),
  ];

  return {
    async getIncidentTypes() {
      return incidentTypes;
    },

    async getIncidentType(type) {
      const found = incidentTypes.find(t => t.type === type);
      if (!found) throw new Error(`Unknown incident type: ${type}`);
      return found;
    },

    isValidType(type) {
      return incidentTypes.some(t => t.type === type);
    },

    async getSeverityCriteria(severity) {
      const found = severityCriteria.find(s => s.severity === severity);
      if (!found) throw new Error(`Unknown severity: ${severity}`);
      return found;
    },

    async getAllSeverityCriteria() {
      return severityCriteria;
    },

    getResponseSlaMinutes(severity) {
      const criteria = severityCriteria.find(s => s.severity === severity);
      return criteria?.response_sla_minutes ?? 480;
    },

    async classifyIncident(type, severity, impactScope, operatorId) {
      const classification = createMockIncidentClassification({
        type,
        severity,
        impact_scope: impactScope,
        classified_by: `sha256:${Buffer.from(operatorId).toString('hex').slice(0, 64)}`,
      });
      classifications.set(classification.incident_id, classification);
      return classification;
    },

    async getClassification(incidentId) {
      return classifications.get(incidentId) ?? null;
    },

    async finalizeClassification(incidentId) {
      const existing = classifications.get(incidentId);
      if (!existing) throw new Error(`Classification not found: ${incidentId}`);
      const finalized: IncidentClassification = { ...existing, is_finalized: true };
      classifications.set(incidentId, finalized);
      return finalized;
    },

    async isClassificationFinalized(incidentId) {
      const existing = classifications.get(incidentId);
      return existing?.is_finalized ?? false;
    },

    async getRoutingRule(type, severity) {
      return createMockRoutingRule({ incident_type: type, severity });
    },

    async getRoutingRules() {
      const rules: RoutingRule[] = [];
      for (const type of incidentTypes) {
        for (const sev of severityCriteria) {
          rules.push(createMockRoutingRule({ incident_type: type.type, severity: sev.severity }));
        }
      }
      return rules;
    },

    getPrimaryTeam(type, severity) {
      if (type === 'security_breach' || type === 'data_exposure') return 'security';
      if (type === 'compliance_violation' || type === 'governance_drift') return 'compliance';
      if (severity === 'SEV1') return 'platform';
      return 'on_call';
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Incident Response Governance: Taxonomy Contracts', () => {
  let store: TaxonomyStore;

  beforeEach(() => {
    store = createMockTaxonomyStore();
  });

  // ==========================================================================
  // CONTRACT: taxonomy_incident_types
  // ==========================================================================
  describe('CONTRACT: taxonomy_incident_types', () => {
    it('defines complete incident type taxonomy', async () => {
      const types = await store.getIncidentTypes();

      assert.ok(types.length >= 6, 'should have at least 6 incident types');
      const typeNames = types.map(t => t.type);
      assert.ok(typeNames.includes('security_breach'));
      assert.ok(typeNames.includes('auth_outage'));
      assert.ok(typeNames.includes('data_exposure'));
      assert.ok(typeNames.includes('service_degradation'));
    });

    it('each type has required fields', async () => {
      const types = await store.getIncidentTypes();

      for (const type of types) {
        assert.ok(type.type, 'must have type');
        assert.ok(type.description, 'must have description');
        assert.ok(type.default_severity, 'must have default_severity');
        assert.ok(Array.isArray(type.affected_surfaces));
        assert.ok(typeof type.requires_security_review === 'boolean');
        assert.ok(typeof type.requires_compliance_review === 'boolean');
      }
    });

    it('validates incident types', () => {
      assert.strictEqual(store.isValidType('security_breach'), true);
      assert.strictEqual(store.isValidType('auth_outage'), true);
      assert.strictEqual(store.isValidType('invalid_type'), false);
    });

    it('security incidents require security review', async () => {
      const securityBreach = await store.getIncidentType('security_breach');
      const dataExposure = await store.getIncidentType('data_exposure');

      assert.strictEqual(securityBreach.requires_security_review, true);
      assert.strictEqual(dataExposure.requires_security_review, true);
    });

    it('types have default severity', async () => {
      const types = await store.getIncidentTypes();

      for (const type of types) {
        assert.ok(['SEV1', 'SEV2', 'SEV3', 'SEV4'].includes(type.default_severity));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: taxonomy_severity_levels
  // ==========================================================================
  describe('CONTRACT: taxonomy_severity_levels', () => {
    it('defines all severity levels', async () => {
      const criteria = await store.getAllSeverityCriteria();

      assert.strictEqual(criteria.length, 4);
      const severities = criteria.map(c => c.severity);
      assert.ok(severities.includes('SEV1'));
      assert.ok(severities.includes('SEV2'));
      assert.ok(severities.includes('SEV3'));
      assert.ok(severities.includes('SEV4'));
    });

    it('SEV1 has shortest response SLA', async () => {
      const sev1 = await store.getSeverityCriteria('SEV1');
      const sev4 = await store.getSeverityCriteria('SEV4');

      assert.ok(sev1.response_sla_minutes < sev4.response_sla_minutes);
      assert.ok(sev1.response_sla_minutes <= 15, 'SEV1 should respond within 15 minutes');
    });

    it('SEV1 requires incident commander and exec notification', async () => {
      const sev1 = await store.getSeverityCriteria('SEV1');

      assert.strictEqual(sev1.requires_incident_commander, true);
      assert.strictEqual(sev1.requires_exec_notification, true);
    });

    it('lower severities have longer SLAs', async () => {
      const sev1 = await store.getSeverityCriteria('SEV1');
      const sev2 = await store.getSeverityCriteria('SEV2');
      const sev3 = await store.getSeverityCriteria('SEV3');
      const sev4 = await store.getSeverityCriteria('SEV4');

      assert.ok(sev1.response_sla_minutes < sev2.response_sla_minutes);
      assert.ok(sev2.response_sla_minutes < sev3.response_sla_minutes);
      assert.ok(sev3.response_sla_minutes < sev4.response_sla_minutes);
    });

    it('provides response SLA lookup', () => {
      assert.strictEqual(store.getResponseSlaMinutes('SEV1'), 15);
      assert.strictEqual(store.getResponseSlaMinutes('SEV2'), 30);
    });
  });

  // ==========================================================================
  // CONTRACT: taxonomy_classification
  // ==========================================================================
  describe('CONTRACT: taxonomy_classification', () => {
    it('creates classification with opaque incident ID', async () => {
      const classification = await store.classifyIncident(
        'service_degradation',
        'SEV2',
        'service',
        'operator-1'
      );

      assert.ok(classification.incident_id.startsWith('sha256:'));
      assert.strictEqual(classification.type, 'service_degradation');
      assert.strictEqual(classification.severity, 'SEV2');
    });

    it('classification includes operator ID (opaque)', async () => {
      const classification = await store.classifyIncident(
        'security_breach',
        'SEV1',
        'global',
        'security-analyst'
      );

      assert.ok(classification.classified_by.startsWith('sha256:'));
      assert.ok(classification.classified_at);
    });

    it('classification starts as non-finalized', async () => {
      const classification = await store.classifyIncident(
        'governance_drift',
        'SEV3',
        'component',
        'operator-2'
      );

      assert.strictEqual(classification.is_finalized, false);
    });

    it('classification can be finalized', async () => {
      const initial = await store.classifyIncident('auth_outage', 'SEV1', 'global', 'operator-3');
      const finalized = await store.finalizeClassification(initial.incident_id);

      assert.strictEqual(finalized.is_finalized, true);
    });

    it('classification has checksum', async () => {
      const classification = await store.classifyIncident(
        'data_exposure',
        'SEV1',
        'regional',
        'operator-4'
      );

      assert.ok(classification.checksum.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: taxonomy_routing
  // ==========================================================================
  describe('CONTRACT: taxonomy_routing', () => {
    it('routes security incidents to security team', () => {
      const team = store.getPrimaryTeam('security_breach', 'SEV1');
      assert.strictEqual(team, 'security');
    });

    it('routes compliance incidents to compliance team', () => {
      const team = store.getPrimaryTeam('compliance_violation', 'SEV2');
      assert.strictEqual(team, 'compliance');
    });

    it('routing rules include runbook reference', async () => {
      const rule = await store.getRoutingRule('service_degradation', 'SEV2');

      assert.ok(rule.runbook_ref, 'must have runbook reference');
      assert.ok(rule.runbook_ref.includes('http'), 'runbook should be a URL');
    });

    it('routing rules include escalation path', async () => {
      const rule = await store.getRoutingRule('auth_outage', 'SEV1');

      assert.ok(rule.primary_team, 'must have primary team');
      assert.ok(Array.isArray(rule.escalation_teams));
      assert.ok(rule.escalation_teams.length > 0, 'should have escalation teams');
    });

    it('routing rules include notification channels', async () => {
      const rule = await store.getRoutingRule('infrastructure_failure', 'SEV2');

      assert.ok(Array.isArray(rule.notification_channels));
      assert.ok(rule.notification_channels.length > 0);
    });
  });
});
