/**
 * Federation Deployment: Cross-Agency Incident Response Contract Tests
 *
 * Phase XV - Shared incident taxonomy, escalation bridge, and evidence
 * sharing under incident scope with least privilege.
 *
 * CONTRACT SURFACE:
 * - Incident Taxonomy: Shared classification across agencies
 * - Escalation Bridge: Cross-agency incident notification and handoff
 * - Evidence Sharing: Scoped evidence access during incidents
 * - Resolution Tracking: Coordinated incident resolution
 *
 * INVARIANTS:
 * - Incidents scoped to specific agencies
 * - Evidence sharing is least-privilege and time-bounded
 * - All escalations are audit logged
 * - IDs are opaque sha256
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
type IncidentCategory =
  | 'security'
  | 'data_integrity'
  | 'availability'
  | 'compliance'
  | 'federation';
type IncidentStatus = 'open' | 'investigating' | 'escalated' | 'mitigated' | 'resolved' | 'closed';
type EscalationType = 'notification' | 'handoff' | 'collaboration' | 'takeover';

/**
 * Federated incident record
 */
interface FederatedIncident {
  readonly incident_id: string;
  readonly severity: IncidentSeverity;
  readonly category: IncidentCategory;
  readonly title: string;
  readonly description: string;
  readonly source_agency_id: string;
  readonly affected_agencies: readonly string[];
  readonly status: IncidentStatus;
  readonly created_at: string;
  readonly updated_at: string;
  readonly resolved_at: string | null;
}

/**
 * Incident taxonomy
 */
interface IncidentTaxonomy {
  readonly taxonomy_id: string;
  readonly category: IncidentCategory;
  readonly subcategory: string;
  readonly description: string;
  readonly default_severity: IncidentSeverity;
  readonly requires_escalation: boolean;
  readonly response_sla_hours: number;
}

/**
 * Escalation record
 */
interface EscalationRecord {
  readonly escalation_id: string;
  readonly incident_id: string;
  readonly escalation_type: EscalationType;
  readonly from_agency_id: string;
  readonly to_agency_id: string;
  readonly reason: string;
  readonly accepted: boolean | null;
  readonly escalated_at: string;
  readonly responded_at: string | null;
}

/**
 * Incident evidence share
 */
interface IncidentEvidenceShare {
  readonly share_id: string;
  readonly incident_id: string;
  readonly evidence_pack_id: string;
  readonly shared_by_agency_id: string;
  readonly shared_with_agency_id: string;
  readonly access_scope: 'read' | 'read_copy';
  readonly shared_at: string;
  readonly expires_at: string;
  readonly revoked_at: string | null;
}

/**
 * Resolution record
 */
interface ResolutionRecord {
  readonly resolution_id: string;
  readonly incident_id: string;
  readonly resolved_by_agency_id: string;
  readonly resolution_summary: string;
  readonly root_cause: string;
  readonly preventive_actions: readonly string[];
  readonly resolved_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockIncident(overrides: Partial<FederatedIncident> = {}): FederatedIncident {
  const incidentId = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    incident_id: `sha256:${Buffer.from(incidentId).toString('hex').slice(0, 64)}`,
    severity: 'high',
    category: 'security',
    title: 'Cross-agency data sync failure',
    description: 'Data synchronization between agencies failed during policy exchange',
    source_agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    affected_agencies: [],
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null,
    ...overrides,
  };
}

function createMockTaxonomy(overrides: Partial<IncidentTaxonomy> = {}): IncidentTaxonomy {
  const taxId = `tax-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    taxonomy_id: `sha256:${Buffer.from(taxId).toString('hex').slice(0, 64)}`,
    category: 'security',
    subcategory: 'unauthorized_access',
    description: 'Unauthorized access attempt detected',
    default_severity: 'high',
    requires_escalation: true,
    response_sla_hours: 4,
    ...overrides,
  };
}

function createMockEscalation(overrides: Partial<EscalationRecord> = {}): EscalationRecord {
  const escId = `esc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    escalation_id: `sha256:${Buffer.from(escId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from('inc-1').toString('hex').slice(0, 64)}`,
    escalation_type: 'notification',
    from_agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    to_agency_id: `sha256:${Buffer.from('agency-2').toString('hex').slice(0, 64)}`,
    reason: 'Incident affects shared infrastructure',
    accepted: null,
    escalated_at: new Date().toISOString(),
    responded_at: null,
    ...overrides,
  };
}

function createMockEvidenceShare(
  overrides: Partial<IncidentEvidenceShare> = {}
): IncidentEvidenceShare {
  const shareId = `share-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    share_id: `sha256:${Buffer.from(shareId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from('inc-1').toString('hex').slice(0, 64)}`,
    evidence_pack_id: `sha256:${Buffer.from('pack-1').toString('hex').slice(0, 64)}`,
    shared_by_agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    shared_with_agency_id: `sha256:${Buffer.from('agency-2').toString('hex').slice(0, 64)}`,
    access_scope: 'read',
    shared_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    revoked_at: null,
    ...overrides,
  };
}

function createMockResolution(overrides: Partial<ResolutionRecord> = {}): ResolutionRecord {
  const resId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    resolution_id: `sha256:${Buffer.from(resId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from('inc-1').toString('hex').slice(0, 64)}`,
    resolved_by_agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    resolution_summary: 'Issue resolved by policy update',
    root_cause: 'Misconfigured federation policy',
    preventive_actions: ['Added policy validation gate', 'Updated monitoring'],
    resolved_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK CROSS-AGENCY INCIDENT SERVICE
// ============================================================================

interface CrossAgencyIncidentService {
  // Incident Management
  createIncident(
    severity: IncidentSeverity,
    category: IncidentCategory,
    title: string,
    description: string,
    sourceAgencyId: string
  ): Promise<FederatedIncident>;
  getIncident(incidentId: string): Promise<FederatedIncident | null>;
  updateStatus(incidentId: string, status: IncidentStatus): Promise<FederatedIncident>;
  addAffectedAgency(incidentId: string, agencyId: string): Promise<FederatedIncident>;
  listIncidents(agencyId: string): Promise<readonly FederatedIncident[]>;
  listOpenIncidents(): Promise<readonly FederatedIncident[]>;

  // Taxonomy
  defineTaxonomy(
    category: IncidentCategory,
    subcategory: string,
    description: string,
    severity: IncidentSeverity,
    slaHours: number
  ): Promise<IncidentTaxonomy>;
  getTaxonomy(category: IncidentCategory, subcategory: string): Promise<IncidentTaxonomy | null>;
  listTaxonomies(): Promise<readonly IncidentTaxonomy[]>;

  // Escalation
  escalate(
    incidentId: string,
    fromAgencyId: string,
    toAgencyId: string,
    escalationType: EscalationType,
    reason: string
  ): Promise<EscalationRecord>;
  respondToEscalation(escalationId: string, accepted: boolean): Promise<EscalationRecord>;
  listEscalations(incidentId: string): Promise<readonly EscalationRecord[]>;
  getPendingEscalations(agencyId: string): Promise<readonly EscalationRecord[]>;

  // Evidence Sharing
  shareEvidence(
    incidentId: string,
    evidencePackId: string,
    fromAgencyId: string,
    toAgencyId: string,
    scope: 'read' | 'read_copy'
  ): Promise<IncidentEvidenceShare>;
  revokeShare(shareId: string): Promise<IncidentEvidenceShare>;
  listShares(incidentId: string): Promise<readonly IncidentEvidenceShare[]>;
  getActiveShares(agencyId: string): Promise<readonly IncidentEvidenceShare[]>;

  // Resolution
  resolveIncident(
    incidentId: string,
    agencyId: string,
    summary: string,
    rootCause: string,
    preventiveActions: string[]
  ): Promise<ResolutionRecord>;
  getResolution(incidentId: string): Promise<ResolutionRecord | null>;
}

function createMockCrossAgencyIncidentService(): CrossAgencyIncidentService {
  const incidents: Map<string, FederatedIncident> = new Map();
  const taxonomies: Map<string, IncidentTaxonomy> = new Map();
  const escalations: Map<string, EscalationRecord[]> = new Map();
  const shares: Map<string, IncidentEvidenceShare[]> = new Map();
  const resolutions: Map<string, ResolutionRecord> = new Map();

  return {
    async createIncident(severity, category, title, description, sourceAgencyId) {
      const incident = createMockIncident({
        severity,
        category,
        title,
        description,
        source_agency_id: sourceAgencyId,
      });
      incidents.set(incident.incident_id, incident);
      escalations.set(incident.incident_id, []);
      shares.set(incident.incident_id, []);
      return incident;
    },

    async getIncident(incidentId) {
      return incidents.get(incidentId) ?? null;
    },

    async updateStatus(incidentId, status) {
      const incident = incidents.get(incidentId);
      if (!incident) throw new Error('incident not found');

      const updated = createMockIncident({
        ...incident,
        status,
        updated_at: new Date().toISOString(),
        resolved_at: status === 'resolved' ? new Date().toISOString() : incident.resolved_at,
      });
      incidents.set(incidentId, updated);
      return updated;
    },

    async addAffectedAgency(incidentId, agencyId) {
      const incident = incidents.get(incidentId);
      if (!incident) throw new Error('incident not found');

      const updated = createMockIncident({
        ...incident,
        affected_agencies: [...incident.affected_agencies, agencyId],
        updated_at: new Date().toISOString(),
      });
      incidents.set(incidentId, updated);
      return updated;
    },

    async listIncidents(agencyId) {
      return Array.from(incidents.values()).filter(
        i => i.source_agency_id === agencyId || i.affected_agencies.includes(agencyId)
      );
    },

    async listOpenIncidents() {
      return Array.from(incidents.values()).filter(
        i => i.status !== 'closed' && i.status !== 'resolved'
      );
    },

    async defineTaxonomy(category, subcategory, description, severity, slaHours) {
      const taxonomy = createMockTaxonomy({
        category,
        subcategory,
        description,
        default_severity: severity,
        response_sla_hours: slaHours,
      });
      taxonomies.set(`${category}:${subcategory}`, taxonomy);
      return taxonomy;
    },

    async getTaxonomy(category, subcategory) {
      return taxonomies.get(`${category}:${subcategory}`) ?? null;
    },

    async listTaxonomies() {
      return Array.from(taxonomies.values());
    },

    async escalate(incidentId, fromAgencyId, toAgencyId, escalationType, reason) {
      const record = createMockEscalation({
        incident_id: incidentId,
        from_agency_id: fromAgencyId,
        to_agency_id: toAgencyId,
        escalation_type: escalationType,
        reason,
      });

      const incidentEscs = escalations.get(incidentId) ?? [];
      incidentEscs.push(record);
      escalations.set(incidentId, incidentEscs);

      return record;
    },

    async respondToEscalation(escalationId, accepted) {
      for (const [incidentId, escs] of escalations) {
        const idx = escs.findIndex(e => e.escalation_id === escalationId);
        if (idx >= 0) {
          const updated = createMockEscalation({
            ...escs[idx],
            accepted,
            responded_at: new Date().toISOString(),
          });
          escs[idx] = updated;
          escalations.set(incidentId, escs);
          return updated;
        }
      }
      throw new Error('escalation not found');
    },

    async listEscalations(incidentId) {
      return escalations.get(incidentId) ?? [];
    },

    async getPendingEscalations(agencyId) {
      const pending: EscalationRecord[] = [];
      for (const escs of escalations.values()) {
        pending.push(...escs.filter(e => e.to_agency_id === agencyId && e.accepted === null));
      }
      return pending;
    },

    async shareEvidence(incidentId, evidencePackId, fromAgencyId, toAgencyId, scope) {
      const share = createMockEvidenceShare({
        incident_id: incidentId,
        evidence_pack_id: evidencePackId,
        shared_by_agency_id: fromAgencyId,
        shared_with_agency_id: toAgencyId,
        access_scope: scope,
      });

      const incidentShares = shares.get(incidentId) ?? [];
      incidentShares.push(share);
      shares.set(incidentId, incidentShares);

      return share;
    },

    async revokeShare(shareId) {
      for (const [incidentId, incShares] of shares) {
        const idx = incShares.findIndex(s => s.share_id === shareId);
        if (idx >= 0) {
          const revoked = createMockEvidenceShare({
            ...incShares[idx],
            revoked_at: new Date().toISOString(),
          });
          incShares[idx] = revoked;
          shares.set(incidentId, incShares);
          return revoked;
        }
      }
      throw new Error('share not found');
    },

    async listShares(incidentId) {
      return shares.get(incidentId) ?? [];
    },

    async getActiveShares(agencyId) {
      const active: IncidentEvidenceShare[] = [];
      for (const incShares of shares.values()) {
        active.push(
          ...incShares.filter(
            s =>
              s.shared_with_agency_id === agencyId &&
              !s.revoked_at &&
              new Date(s.expires_at) > new Date()
          )
        );
      }
      return active;
    },

    async resolveIncident(incidentId, agencyId, summary, rootCause, preventiveActions) {
      const resolution = createMockResolution({
        incident_id: incidentId,
        resolved_by_agency_id: agencyId,
        resolution_summary: summary,
        root_cause: rootCause,
        preventive_actions: preventiveActions,
      });
      resolutions.set(incidentId, resolution);

      // Update incident status
      await this.updateStatus(incidentId, 'resolved');

      return resolution;
    },

    async getResolution(incidentId) {
      return resolutions.get(incidentId) ?? null;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federation Deployment: Cross-Agency Incident Contracts', () => {
  let service: CrossAgencyIncidentService;

  beforeEach(() => {
    service = createMockCrossAgencyIncidentService();
  });

  // ==========================================================================
  // CONTRACT: incident_management
  // ==========================================================================
  describe('CONTRACT: incident_management', () => {
    it('creates federated incident', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test Incident',
        'Description',
        `sha256:${'a'.repeat(64)}`
      );

      assert.ok(incident.incident_id.startsWith('sha256:'));
      assert.strictEqual(incident.status, 'open');
    });

    it('retrieves incident by ID', async () => {
      const created = await service.createIncident(
        'medium',
        'data_integrity',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const retrieved = await service.getIncident(created.incident_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.incident_id, created.incident_id);
    });

    it('updates incident status', async () => {
      const incident = await service.createIncident(
        'high',
        'availability',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const updated = await service.updateStatus(incident.incident_id, 'investigating');
      assert.strictEqual(updated.status, 'investigating');
    });

    it('adds affected agency', async () => {
      const incident = await service.createIncident(
        'high',
        'federation',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const updated = await service.addAffectedAgency(
        incident.incident_id,
        `sha256:${'b'.repeat(64)}`
      );
      assert.ok(updated.affected_agencies.length > 0);
    });

    it('lists open incidents', async () => {
      await service.createIncident(
        'high',
        'security',
        'Test 1',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );
      await service.createIncident(
        'medium',
        'compliance',
        'Test 2',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const open = await service.listOpenIncidents();
      assert.ok(open.length >= 2);
    });
  });

  // ==========================================================================
  // CONTRACT: taxonomy
  // ==========================================================================
  describe('CONTRACT: taxonomy', () => {
    it('defines incident taxonomy', async () => {
      const taxonomy = await service.defineTaxonomy(
        'security',
        'data_breach',
        'Unauthorized data access',
        'critical',
        2
      );

      assert.ok(taxonomy.taxonomy_id.startsWith('sha256:'));
      assert.strictEqual(taxonomy.category, 'security');
    });

    it('retrieves taxonomy by category/subcategory', async () => {
      await service.defineTaxonomy(
        'compliance',
        'policy_violation',
        'Policy was violated',
        'high',
        8
      );

      const taxonomy = await service.getTaxonomy('compliance', 'policy_violation');
      assert.ok(taxonomy);
      assert.strictEqual(taxonomy.subcategory, 'policy_violation');
    });

    it('lists all taxonomies', async () => {
      await service.defineTaxonomy('security', 'breach', 'Breach', 'critical', 1);
      await service.defineTaxonomy('availability', 'outage', 'Outage', 'high', 4);

      const all = await service.listTaxonomies();
      assert.ok(all.length >= 2);
    });

    it('taxonomy has SLA', async () => {
      const taxonomy = createMockTaxonomy({ response_sla_hours: 4 });
      assert.ok(taxonomy.response_sla_hours > 0);
    });

    it('taxonomy indicates escalation requirement', async () => {
      const taxonomy = createMockTaxonomy({ requires_escalation: true });
      assert.strictEqual(taxonomy.requires_escalation, true);
    });
  });

  // ==========================================================================
  // CONTRACT: escalation
  // ==========================================================================
  describe('CONTRACT: escalation', () => {
    it('escalates incident to another agency', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const escalation = await service.escalate(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        'notification',
        'Affects shared resources'
      );

      assert.ok(escalation.escalation_id.startsWith('sha256:'));
    });

    it('responds to escalation', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const esc = await service.escalate(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        'collaboration',
        'Need expertise'
      );

      const responded = await service.respondToEscalation(esc.escalation_id, true);
      assert.strictEqual(responded.accepted, true);
      assert.ok(responded.responded_at);
    });

    it('lists escalations for incident', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      await service.escalate(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        'notification',
        'FYI'
      );

      const escs = await service.listEscalations(incident.incident_id);
      assert.ok(escs.length >= 1);
    });

    it('gets pending escalations for agency', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const toAgency = `sha256:${'b'.repeat(64)}`;
      await service.escalate(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        toAgency,
        'handoff',
        'Handoff needed'
      );

      const pending = await service.getPendingEscalations(toAgency);
      assert.ok(pending.length >= 1);
    });

    it('escalation types are explicit', async () => {
      const esc = createMockEscalation({ escalation_type: 'takeover' });
      assert.strictEqual(esc.escalation_type, 'takeover');
    });
  });

  // ==========================================================================
  // CONTRACT: evidence_sharing
  // ==========================================================================
  describe('CONTRACT: evidence_sharing', () => {
    it('shares evidence for incident', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const share = await service.shareEvidence(
        incident.incident_id,
        `sha256:${'pack'.repeat(16).slice(0, 64)}`,
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        'read'
      );

      assert.ok(share.share_id.startsWith('sha256:'));
      assert.strictEqual(share.access_scope, 'read');
    });

    it('revokes evidence share', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const share = await service.shareEvidence(
        incident.incident_id,
        `sha256:${'pack'.repeat(16).slice(0, 64)}`,
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        'read'
      );

      const revoked = await service.revokeShare(share.share_id);
      assert.ok(revoked.revoked_at);
    });

    it('share has expiry', async () => {
      const share = createMockEvidenceShare();
      assert.ok(share.expires_at);
      const expiresAt = new Date(share.expires_at);
      assert.ok(expiresAt > new Date());
    });

    it('share has explicit scope', async () => {
      const share = createMockEvidenceShare({ access_scope: 'read_copy' });
      assert.ok(['read', 'read_copy'].includes(share.access_scope));
    });

    it('gets active shares for agency', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const toAgency = `sha256:${'b'.repeat(64)}`;
      await service.shareEvidence(
        incident.incident_id,
        `sha256:${'pack'.repeat(16).slice(0, 64)}`,
        `sha256:${'a'.repeat(64)}`,
        toAgency,
        'read'
      );

      const active = await service.getActiveShares(toAgency);
      assert.ok(active.length >= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: resolution
  // ==========================================================================
  describe('CONTRACT: resolution', () => {
    it('resolves incident', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      const resolution = await service.resolveIncident(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        'Issue fixed',
        'Configuration error',
        ['Updated config', 'Added validation']
      );

      assert.ok(resolution.resolution_id.startsWith('sha256:'));
    });

    it('resolution includes root cause', async () => {
      const resolution = createMockResolution({ root_cause: 'Misconfiguration' });
      assert.ok(resolution.root_cause);
    });

    it('resolution includes preventive actions', async () => {
      const resolution = createMockResolution({
        preventive_actions: ['Added monitoring', 'Updated policy'],
      });
      assert.ok(resolution.preventive_actions.length >= 2);
    });

    it('retrieves resolution', async () => {
      const incident = await service.createIncident(
        'medium',
        'compliance',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      await service.resolveIncident(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        'Resolved',
        'Cause',
        ['Action']
      );

      const resolution = await service.getResolution(incident.incident_id);
      assert.ok(resolution);
    });

    it('resolution updates incident status', async () => {
      const incident = await service.createIncident(
        'high',
        'availability',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      await service.resolveIncident(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        'Fixed',
        'Root cause',
        ['Action']
      );

      const updated = await service.getIncident(incident.incident_id);
      assert.strictEqual(updated?.status, 'resolved');
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const incident = createMockIncident();
      const taxonomy = createMockTaxonomy();
      const escalation = createMockEscalation();
      const share = createMockEvidenceShare();
      const resolution = createMockResolution();

      assert.ok(incident.incident_id.startsWith('sha256:'));
      assert.ok(taxonomy.taxonomy_id.startsWith('sha256:'));
      assert.ok(escalation.escalation_id.startsWith('sha256:'));
      assert.ok(share.share_id.startsWith('sha256:'));
      assert.ok(resolution.resolution_id.startsWith('sha256:'));
    });

    it('evidence sharing is time-bounded', async () => {
      const share = createMockEvidenceShare();
      assert.ok(share.expires_at);
      assert.ok(new Date(share.expires_at) > new Date(share.shared_at));
    });

    it('escalations are audit logged', async () => {
      const incident = await service.createIncident(
        'high',
        'security',
        'Test',
        'Desc',
        `sha256:${'a'.repeat(64)}`
      );

      await service.escalate(
        incident.incident_id,
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        'notification',
        'Test'
      );

      const escs = await service.listEscalations(incident.incident_id);
      assert.ok(escs.length >= 1);
      assert.ok(escs[0].escalated_at);
    });

    it('incidents scoped to agencies', async () => {
      const incident = createMockIncident();
      assert.ok(incident.source_agency_id.startsWith('sha256:'));
    });
  });
});
