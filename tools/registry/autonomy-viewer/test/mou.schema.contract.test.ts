/**
 * Phase XXII — MOUs-as-Code
 * ==========================
 * Contract: mou.schema.contract.test.ts
 *
 * Tests MOU schema validation: required sections, structure,
 * roles, escalation contacts, and evidence sharing rules.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - MOUs require all mandatory sections
 * - Roles are bounded and well-defined
 * - Evidence sharing rules are explicit
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type MouId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type ContactId = `sha256:${string}`;
type RoleId = `sha256:${string}`;

type MouStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_signoff'
  | 'active'
  | 'expired'
  | 'suspended'
  | 'terminated';
type MouSection =
  | 'purpose'
  | 'scope'
  | 'roles'
  | 'sla'
  | 'escalation'
  | 'evidence_sharing'
  | 'dispute_resolution'
  | 'breach_response'
  | 'termination'
  | 'signatures';

interface EscalationContact {
  readonly id: ContactId;
  readonly roleId: RoleId;
  readonly tier: 1 | 2 | 3;
  readonly responseTimeSlaMinutes: number;
  readonly notificationChannels: readonly string[];
}

interface Role {
  readonly id: RoleId;
  readonly name: string;
  readonly description: string;
  readonly responsibilities: readonly string[];
  readonly authorityLevel: 'operational' | 'supervisory' | 'executive';
  readonly agencyId: AgencyId;
}

interface EvidenceSharingRule {
  readonly dataCategory: string;
  readonly shareDirection: 'unidirectional' | 'bidirectional';
  readonly retentionDays: number;
  readonly piiHandling: 'exclude' | 'redact' | 'tokenize';
  readonly requiredApprovals: number;
  readonly auditRequired: boolean;
}

interface SlaDefinition {
  readonly metric: string;
  readonly targetValue: number;
  readonly warningThreshold: number;
  readonly criticalThreshold: number;
  readonly unit: string;
  readonly measurementFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

interface MouSection_Content {
  readonly sectionType: MouSection;
  readonly content: string;
  readonly lastModified: string;
  readonly modifiedBy: ContactId;
  readonly isComplete: boolean;
}

interface MouDocument {
  readonly id: MouId;
  readonly title: string;
  readonly version: string;
  readonly status: MouStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly effectiveDate?: string;
  readonly expirationDate?: string;
  readonly parties: readonly AgencyId[];
  readonly sections: readonly MouSection_Content[];
  readonly roles: readonly Role[];
  readonly escalationContacts: readonly EscalationContact[];
  readonly slaDefinitions: readonly SlaDefinition[];
  readonly evidenceSharingRules: readonly EvidenceSharingRule[];
}

interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly completenessScore: number;
}

interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly section?: MouSection;
  readonly field?: string;
}

interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly section?: MouSection;
  readonly recommendation?: string;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockMouSchemaService() {
  const mous = new Map<MouId, MouDocument>();
  const requiredSections: readonly MouSection[] = [
    'purpose',
    'scope',
    'roles',
    'sla',
    'escalation',
    'evidence_sharing',
    'dispute_resolution',
    'breach_response',
    'termination',
    'signatures',
  ];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  return {
    // Required Sections
    getRequiredSections(): readonly MouSection[] {
      return [...requiredSections];
    },

    isSectionRequired(section: MouSection): boolean {
      return requiredSections.includes(section);
    },

    // MOU Creation
    createMou(title: string, parties: readonly AgencyId[]): MouDocument {
      const id = generateId('mou') as MouId;
      const now = new Date().toISOString();

      const mou: MouDocument = {
        id,
        title,
        version: '0.1.0',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        parties,
        sections: [],
        roles: [],
        escalationContacts: [],
        slaDefinitions: [],
        evidenceSharingRules: [],
      };

      mous.set(id, mou);
      return mou;
    },

    getMou(id: MouId): MouDocument | null {
      return mous.get(id) ?? null;
    },

    // Section Management
    addSection(
      mouId: MouId,
      sectionType: MouSection,
      content: string,
      modifiedBy: ContactId
    ): MouDocument | null {
      const mou = mous.get(mouId);
      if (!mou) return null;

      const existingIndex = mou.sections.findIndex(s => s.sectionType === sectionType);
      const newSection: MouSection_Content = {
        sectionType,
        content,
        lastModified: new Date().toISOString(),
        modifiedBy,
        isComplete: content.length >= 50, // Minimum content length
      };

      let updatedSections: MouSection_Content[];
      if (existingIndex >= 0) {
        updatedSections = [
          ...mou.sections.slice(0, existingIndex),
          newSection,
          ...mou.sections.slice(existingIndex + 1),
        ];
      } else {
        updatedSections = [...mou.sections, newSection];
      }

      const updated: MouDocument = {
        ...mou,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      };

      mous.set(mouId, updated);
      return updated;
    },

    getSection(mouId: MouId, sectionType: MouSection): MouSection_Content | null {
      const mou = mous.get(mouId);
      return mou?.sections.find(s => s.sectionType === sectionType) ?? null;
    },

    // Role Management
    addRole(
      mouId: MouId,
      name: string,
      description: string,
      responsibilities: readonly string[],
      authorityLevel: Role['authorityLevel'],
      agencyId: AgencyId
    ): Role | null {
      const mou = mous.get(mouId);
      if (!mou) return null;

      const role: Role = {
        id: generateId('role') as RoleId,
        name,
        description,
        responsibilities,
        authorityLevel,
        agencyId,
      };

      const updated: MouDocument = {
        ...mou,
        roles: [...mou.roles, role],
        updatedAt: new Date().toISOString(),
      };

      mous.set(mouId, updated);
      return role;
    },

    getRoles(mouId: MouId): readonly Role[] {
      const mou = mous.get(mouId);
      return [...(mou?.roles ?? [])];
    },

    // Escalation Contacts
    addEscalationContact(
      mouId: MouId,
      roleId: RoleId,
      tier: 1 | 2 | 3,
      responseTimeSlaMinutes: number,
      notificationChannels: readonly string[]
    ): EscalationContact | null {
      const mou = mous.get(mouId);
      if (!mou) return null;

      const contact: EscalationContact = {
        id: generateId('contact') as ContactId,
        roleId,
        tier,
        responseTimeSlaMinutes,
        notificationChannels,
      };

      const updated: MouDocument = {
        ...mou,
        escalationContacts: [...mou.escalationContacts, contact],
        updatedAt: new Date().toISOString(),
      };

      mous.set(mouId, updated);
      return contact;
    },

    getEscalationContacts(mouId: MouId): readonly EscalationContact[] {
      const mou = mous.get(mouId);
      return mou?.escalationContacts ?? [];
    },

    // SLA Definitions
    addSlaDefinition(
      mouId: MouId,
      metric: string,
      targetValue: number,
      warningThreshold: number,
      criticalThreshold: number,
      unit: string,
      measurementFrequency: SlaDefinition['measurementFrequency']
    ): SlaDefinition | null {
      const mou = mous.get(mouId);
      if (!mou) return null;

      const sla: SlaDefinition = {
        metric,
        targetValue,
        warningThreshold,
        criticalThreshold,
        unit,
        measurementFrequency,
      };

      const updated: MouDocument = {
        ...mou,
        slaDefinitions: [...mou.slaDefinitions, sla],
        updatedAt: new Date().toISOString(),
      };

      mous.set(mouId, updated);
      return sla;
    },

    getSlaDefinitions(mouId: MouId): readonly SlaDefinition[] {
      const mou = mous.get(mouId);
      return [...(mou?.slaDefinitions ?? [])];
    },

    // Evidence Sharing Rules
    addEvidenceSharingRule(
      mouId: MouId,
      dataCategory: string,
      shareDirection: EvidenceSharingRule['shareDirection'],
      retentionDays: number,
      piiHandling: EvidenceSharingRule['piiHandling'],
      requiredApprovals: number,
      auditRequired: boolean
    ): EvidenceSharingRule | null {
      const mou = mous.get(mouId);
      if (!mou) return null;

      const rule: EvidenceSharingRule = {
        dataCategory,
        shareDirection,
        retentionDays,
        piiHandling,
        requiredApprovals,
        auditRequired,
      };

      const updated: MouDocument = {
        ...mou,
        evidenceSharingRules: [...mou.evidenceSharingRules, rule],
        updatedAt: new Date().toISOString(),
      };

      mous.set(mouId, updated);
      return rule;
    },

    getEvidenceSharingRules(mouId: MouId): readonly EvidenceSharingRule[] {
      const mou = mous.get(mouId);
      return mou?.evidenceSharingRules ?? [];
    },

    // Validation
    validate(mouId: MouId): ValidationResult {
      const mou = mous.get(mouId);
      if (!mou) {
        return {
          isValid: false,
          errors: [{ code: 'MOU_NOT_FOUND', message: 'MOU document not found' }],
          warnings: [],
          completenessScore: 0,
        };
      }

      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Check required sections
      for (const section of requiredSections) {
        const found = mou.sections.find(s => s.sectionType === section);
        if (!found) {
          errors.push({
            code: 'MISSING_SECTION',
            message: `Required section '${section}' is missing`,
            section,
          });
        } else if (!found.isComplete) {
          warnings.push({
            code: 'INCOMPLETE_SECTION',
            message: `Section '${section}' content is incomplete`,
            section,
            recommendation: 'Add more detailed content (minimum 50 characters)',
          });
        }
      }

      // Check parties
      if (mou.parties.length < 2) {
        errors.push({
          code: 'INSUFFICIENT_PARTIES',
          message: 'MOU requires at least two parties',
        });
      }

      // Check roles
      if (mou.roles.length === 0) {
        errors.push({
          code: 'NO_ROLES_DEFINED',
          message: 'At least one role must be defined',
        });
      }

      // Check each party has at least one role
      for (const partyId of mou.parties) {
        const partyRoles = mou.roles.filter(r => r.agencyId === partyId);
        if (partyRoles.length === 0) {
          warnings.push({
            code: 'PARTY_NO_ROLES',
            message: `Party ${partyId} has no defined roles`,
            recommendation: 'Define at least one role for each party',
          });
        }
      }

      // Check escalation contacts
      if (mou.escalationContacts.length === 0) {
        errors.push({
          code: 'NO_ESCALATION_CONTACTS',
          message: 'At least one escalation contact must be defined',
        });
      }

      // Check SLA definitions
      if (mou.slaDefinitions.length === 0) {
        warnings.push({
          code: 'NO_SLA_DEFINITIONS',
          message: 'No SLA definitions specified',
          recommendation: 'Define at least one measurable SLA',
        });
      }

      // Check evidence sharing rules
      if (mou.evidenceSharingRules.length === 0) {
        warnings.push({
          code: 'NO_EVIDENCE_RULES',
          message: 'No evidence sharing rules specified',
          recommendation: 'Define evidence sharing rules for data exchange',
        });
      }

      // Check evidence rules have proper PII handling
      for (const rule of mou.evidenceSharingRules) {
        if (rule.piiHandling === 'exclude') {
          // Good - no PII shared
        } else if (!rule.auditRequired) {
          warnings.push({
            code: 'PII_AUDIT_RECOMMENDED',
            message: `Evidence category '${rule.dataCategory}' handles PII but audit not required`,
            recommendation: 'Enable audit for data categories with PII handling',
          });
        }
      }

      // Calculate completeness
      const sectionCompleteness =
        mou.sections.filter(s => s.isComplete).length / requiredSections.length;
      const hasRoles = mou.roles.length > 0 ? 0.1 : 0;
      const hasContacts = mou.escalationContacts.length > 0 ? 0.1 : 0;
      const hasSlas = mou.slaDefinitions.length > 0 ? 0.1 : 0;
      const hasRules = mou.evidenceSharingRules.length > 0 ? 0.1 : 0;
      const completenessScore = Math.min(
        1,
        sectionCompleteness * 0.6 + hasRoles + hasContacts + hasSlas + hasRules
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completenessScore: Math.round(completenessScore * 100),
      };
    },

    // Status Management
    updateStatus(mouId: MouId, newStatus: MouStatus): MouDocument | null {
      const mou = mous.get(mouId);
      if (!mou) return null;

      // Validate status transitions
      const validTransitions: Record<MouStatus, readonly MouStatus[]> = {
        draft: ['pending_review'],
        pending_review: ['draft', 'pending_signoff'],
        pending_signoff: ['pending_review', 'active'],
        active: ['suspended', 'expired', 'terminated'],
        suspended: ['active', 'terminated'],
        expired: ['draft'], // Can create new version
        terminated: [], // Terminal state
      };

      if (!validTransitions[mou.status].includes(newStatus)) {
        return null; // Invalid transition
      }

      const updated: MouDocument = {
        ...mou,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        effectiveDate: newStatus === 'active' ? new Date().toISOString() : mou.effectiveDate,
      };

      mous.set(mouId, updated);
      return updated;
    },

    // Schema Structure
    getSchemaStructure(): {
      requiredSections: readonly MouSection[];
      authorityLevels: readonly string[];
      piiHandlingOptions: readonly string[];
      measurementFrequencies: readonly string[];
    } {
      return {
        requiredSections,
        authorityLevels: ['operational', 'supervisory', 'executive'] as const,
        piiHandlingOptions: ['exclude', 'redact', 'tokenize'] as const,
        measurementFrequencies: ['realtime', 'hourly', 'daily', 'weekly'] as const,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXII: MOU Schema Contracts', () => {
  let mouService: ReturnType<typeof createMockMouSchemaService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;
  const contactA = 'sha256:contact_alpha' as ContactId;

  beforeEach(() => {
    mouService = createMockMouSchemaService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate MOU IDs with sha256: prefix', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      assert.ok(mou.id.startsWith('sha256:'));
    });

    it('should generate role IDs with sha256: prefix', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(
        mou.id,
        'Data Steward',
        'Manages data governance',
        ['Review data requests', 'Approve sharing'],
        'operational',
        agencyA
      );
      assert.ok(role?.id.startsWith('sha256:'));
    });

    it('should generate contact IDs with sha256: prefix', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(mou.id, 'Lead', 'Lead role', [], 'supervisory', agencyA);
      const contact = mouService.addEscalationContact(mou.id, role!.id, 1, 30, ['email', 'phone']);
      assert.ok(contact?.id.startsWith('sha256:'));
    });

    it('should use opaque agency IDs', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      assert.ok(mou.parties[0].startsWith('sha256:'));
      assert.ok(mou.parties[1].startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Required Sections Tests
  // ==========================================================================

  describe('Required Sections', () => {
    it('should have 10 required sections', () => {
      const sections = mouService.getRequiredSections();
      assert.strictEqual(sections.length, 10);
    });

    it('should require purpose section', () => {
      assert.strictEqual(mouService.isSectionRequired('purpose'), true);
    });

    it('should require scope section', () => {
      assert.strictEqual(mouService.isSectionRequired('scope'), true);
    });

    it('should require roles section', () => {
      assert.strictEqual(mouService.isSectionRequired('roles'), true);
    });

    it('should require sla section', () => {
      assert.strictEqual(mouService.isSectionRequired('sla'), true);
    });

    it('should require escalation section', () => {
      assert.strictEqual(mouService.isSectionRequired('escalation'), true);
    });

    it('should require evidence_sharing section', () => {
      assert.strictEqual(mouService.isSectionRequired('evidence_sharing'), true);
    });

    it('should require dispute_resolution section', () => {
      assert.strictEqual(mouService.isSectionRequired('dispute_resolution'), true);
    });

    it('should require breach_response section', () => {
      assert.strictEqual(mouService.isSectionRequired('breach_response'), true);
    });

    it('should require termination section', () => {
      assert.strictEqual(mouService.isSectionRequired('termination'), true);
    });

    it('should require signatures section', () => {
      assert.strictEqual(mouService.isSectionRequired('signatures'), true);
    });
  });

  // ==========================================================================
  // MOU Creation Tests
  // ==========================================================================

  describe('MOU Creation', () => {
    it('should create MOU in draft status', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      assert.strictEqual(mou.status, 'draft');
    });

    it('should set initial version', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      assert.strictEqual(mou.version, '0.1.0');
    });

    it('should record parties', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      assert.strictEqual(mou.parties.length, 2);
    });

    it('should start with empty sections', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      assert.strictEqual(mou.sections.length, 0);
    });

    it('should get MOU by ID', () => {
      const created = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const retrieved = mouService.getMou(created.id);
      assert.strictEqual(retrieved?.id, created.id);
    });
  });

  // ==========================================================================
  // Section Management Tests
  // ==========================================================================

  describe('Section Management', () => {
    it('should add section to MOU', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const content =
        'This is the purpose of the MOU. It establishes the framework for data sharing between agencies.';
      const updated = mouService.addSection(mou.id, 'purpose', content, contactA);

      assert.strictEqual(updated?.sections.length, 1);
      assert.strictEqual(updated?.sections[0].sectionType, 'purpose');
    });

    it('should mark section complete when content sufficient', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const content =
        'This is the purpose of the MOU. It establishes the framework for data sharing between agencies.';
      const updated = mouService.addSection(mou.id, 'purpose', content, contactA);

      assert.strictEqual(updated?.sections[0].isComplete, true);
    });

    it('should mark section incomplete when content short', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addSection(mou.id, 'purpose', 'Short content', contactA);
      const section = mouService.getSection(mou.id, 'purpose');

      assert.strictEqual(section?.isComplete, false);
    });

    it('should update existing section', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addSection(mou.id, 'purpose', 'Initial content', contactA);
      const newContent =
        'Updated purpose content with more detail about the MOU and its objectives.';
      mouService.addSection(mou.id, 'purpose', newContent, contactA);

      const section = mouService.getSection(mou.id, 'purpose');
      assert.strictEqual(section?.content, newContent);
    });

    it('should get section by type', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const content = 'Purpose content with sufficient detail for completeness check.';
      mouService.addSection(mou.id, 'purpose', content, contactA);

      const section = mouService.getSection(mou.id, 'purpose');
      assert.strictEqual(section?.sectionType, 'purpose');
    });
  });

  // ==========================================================================
  // Role Management Tests
  // ==========================================================================

  describe('Role Management', () => {
    it('should add role to MOU', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(
        mou.id,
        'Data Steward',
        'Manages data governance',
        ['Review requests', 'Approve sharing'],
        'operational',
        agencyA
      );

      assert.ok(role);
      assert.strictEqual(role.name, 'Data Steward');
    });

    it('should track authority level', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(
        mou.id,
        'Executive Sponsor',
        'Exec',
        [],
        'executive',
        agencyA
      );

      assert.strictEqual(role?.authorityLevel, 'executive');
    });

    it('should track responsibilities', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const responsibilities = ['Review requests', 'Approve sharing', 'Audit logs'];
      const role = mouService.addRole(
        mou.id,
        'Steward',
        'Desc',
        responsibilities,
        'operational',
        agencyA
      );

      assert.strictEqual(role?.responsibilities.length, 3);
    });

    it('should associate role with agency', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(mou.id, 'Lead', 'Desc', [], 'supervisory', agencyB);

      assert.strictEqual(role?.agencyId, agencyB);
    });

    it('should get all roles', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addRole(mou.id, 'Role1', 'Desc', [], 'operational', agencyA);
      mouService.addRole(mou.id, 'Role2', 'Desc', [], 'supervisory', agencyB);

      const roles = mouService.getRoles(mou.id);
      assert.strictEqual(roles.length, 2);
    });
  });

  // ==========================================================================
  // Escalation Contacts Tests
  // ==========================================================================

  describe('Escalation Contacts', () => {
    it('should add escalation contact', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(mou.id, 'Lead', 'Desc', [], 'supervisory', agencyA);
      const contact = mouService.addEscalationContact(mou.id, role!.id, 1, 30, ['email']);

      assert.ok(contact);
      assert.strictEqual(contact.tier, 1);
    });

    it('should track response time SLA', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(mou.id, 'Lead', 'Desc', [], 'supervisory', agencyA);
      const contact = mouService.addEscalationContact(mou.id, role!.id, 1, 15, ['email']);

      assert.strictEqual(contact?.responseTimeSlaMinutes, 15);
    });

    it('should track notification channels', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role = mouService.addRole(mou.id, 'Lead', 'Desc', [], 'supervisory', agencyA);
      const contact = mouService.addEscalationContact(mou.id, role!.id, 1, 30, [
        'email',
        'phone',
        'sms',
      ]);

      assert.strictEqual(contact?.notificationChannels.length, 3);
    });

    it('should support multiple tiers', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const role1 = mouService.addRole(mou.id, 'Lead', 'Desc', [], 'supervisory', agencyA);
      const role2 = mouService.addRole(mou.id, 'Exec', 'Desc', [], 'executive', agencyA);

      mouService.addEscalationContact(mou.id, role1!.id, 1, 30, ['email']);
      mouService.addEscalationContact(mou.id, role2!.id, 2, 60, ['email', 'phone']);

      const contacts = mouService.getEscalationContacts(mou.id);
      assert.strictEqual(contacts.length, 2);
    });
  });

  // ==========================================================================
  // SLA Definition Tests
  // ==========================================================================

  describe('SLA Definitions', () => {
    it('should add SLA definition', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const sla = mouService.addSlaDefinition(
        mou.id,
        'response_time',
        200,
        300,
        500,
        'ms',
        'realtime'
      );

      assert.ok(sla);
      assert.strictEqual(sla.metric, 'response_time');
    });

    it('should track target and thresholds', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const sla = mouService.addSlaDefinition(
        mou.id,
        'uptime',
        99.9,
        99.5,
        99.0,
        'percent',
        'hourly'
      );

      assert.strictEqual(sla?.targetValue, 99.9);
      assert.strictEqual(sla?.warningThreshold, 99.5);
      assert.strictEqual(sla?.criticalThreshold, 99.0);
    });

    it('should track measurement frequency', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const sla = mouService.addSlaDefinition(
        mou.id,
        'audit_compliance',
        100,
        95,
        90,
        'percent',
        'weekly'
      );

      assert.strictEqual(sla?.measurementFrequency, 'weekly');
    });

    it('should get all SLA definitions', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addSlaDefinition(mou.id, 'metric1', 100, 90, 80, 'percent', 'daily');
      mouService.addSlaDefinition(mou.id, 'metric2', 200, 300, 500, 'ms', 'realtime');

      const slas = mouService.getSlaDefinitions(mou.id);
      assert.strictEqual(slas.length, 2);
    });
  });

  // ==========================================================================
  // Evidence Sharing Rules Tests
  // ==========================================================================

  describe('Evidence Sharing Rules', () => {
    it('should add evidence sharing rule', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const rule = mouService.addEvidenceSharingRule(
        mou.id,
        'audit_logs',
        'bidirectional',
        365,
        'exclude',
        1,
        true
      );

      assert.ok(rule);
      assert.strictEqual(rule.dataCategory, 'audit_logs');
    });

    it('should track PII handling', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const rule = mouService.addEvidenceSharingRule(
        mou.id,
        'user_events',
        'unidirectional',
        90,
        'tokenize',
        2,
        true
      );

      assert.strictEqual(rule?.piiHandling, 'tokenize');
    });

    it('should track retention period', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const rule = mouService.addEvidenceSharingRule(
        mou.id,
        'data',
        'bidirectional',
        730,
        'redact',
        1,
        true
      );

      assert.strictEqual(rule?.retentionDays, 730);
    });

    it('should track approval requirements', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const rule = mouService.addEvidenceSharingRule(
        mou.id,
        'sensitive',
        'unidirectional',
        30,
        'exclude',
        3,
        true
      );

      assert.strictEqual(rule?.requiredApprovals, 3);
    });

    it('should track audit requirement', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const rule = mouService.addEvidenceSharingRule(
        mou.id,
        'logs',
        'bidirectional',
        365,
        'exclude',
        1,
        false
      );

      assert.strictEqual(rule?.auditRequired, false);
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Validation', () => {
    it('should fail validation for empty MOU', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const result = mouService.validate(mou.id);

      assert.strictEqual(result.isValid, false);
    });

    it('should require all sections', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const result = mouService.validate(mou.id);

      const missingSectionErrors = result.errors.filter(e => e.code === 'MISSING_SECTION');
      assert.strictEqual(missingSectionErrors.length, 10);
    });

    it('should require at least two parties', () => {
      const mou = mouService.createMou('Test MOU', [agencyA]);
      const result = mouService.validate(mou.id);

      assert.ok(result.errors.some(e => e.code === 'INSUFFICIENT_PARTIES'));
    });

    it('should require at least one role', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const result = mouService.validate(mou.id);

      assert.ok(result.errors.some(e => e.code === 'NO_ROLES_DEFINED'));
    });

    it('should require escalation contacts', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const result = mouService.validate(mou.id);

      assert.ok(result.errors.some(e => e.code === 'NO_ESCALATION_CONTACTS'));
    });

    it('should warn about missing SLAs', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const result = mouService.validate(mou.id);

      assert.ok(result.warnings.some(w => w.code === 'NO_SLA_DEFINITIONS'));
    });

    it('should warn about PII audit', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addEvidenceSharingRule(mou.id, 'data', 'bidirectional', 90, 'tokenize', 1, false);
      const result = mouService.validate(mou.id);

      assert.ok(result.warnings.some(w => w.code === 'PII_AUDIT_RECOMMENDED'));
    });

    it('should calculate completeness score', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const result = mouService.validate(mou.id);

      assert.ok(result.completenessScore >= 0 && result.completenessScore <= 100);
    });

    it('should return not found for invalid ID', () => {
      const result = mouService.validate('sha256:invalid' as MouId);
      assert.ok(result.errors.some(e => e.code === 'MOU_NOT_FOUND'));
    });
  });

  // ==========================================================================
  // Status Management Tests
  // ==========================================================================

  describe('Status Management', () => {
    it('should transition from draft to pending_review', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const updated = mouService.updateStatus(mou.id, 'pending_review');

      assert.strictEqual(updated?.status, 'pending_review');
    });

    it('should transition from pending_review to pending_signoff', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.updateStatus(mou.id, 'pending_review');
      const updated = mouService.updateStatus(mou.id, 'pending_signoff');

      assert.strictEqual(updated?.status, 'pending_signoff');
    });

    it('should transition from pending_signoff to active', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.updateStatus(mou.id, 'pending_review');
      mouService.updateStatus(mou.id, 'pending_signoff');
      const updated = mouService.updateStatus(mou.id, 'active');

      assert.strictEqual(updated?.status, 'active');
    });

    it('should set effective date on activation', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.updateStatus(mou.id, 'pending_review');
      mouService.updateStatus(mou.id, 'pending_signoff');
      const updated = mouService.updateStatus(mou.id, 'active');

      assert.ok(updated?.effectiveDate);
    });

    it('should reject invalid transitions', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      const updated = mouService.updateStatus(mou.id, 'active'); // Invalid: draft -> active

      assert.strictEqual(updated, null);
    });

    it('should not allow transition from terminated', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.updateStatus(mou.id, 'pending_review');
      mouService.updateStatus(mou.id, 'pending_signoff');
      mouService.updateStatus(mou.id, 'active');
      mouService.updateStatus(mou.id, 'terminated');

      const updated = mouService.updateStatus(mou.id, 'active');
      assert.strictEqual(updated, null);
    });
  });

  // ==========================================================================
  // Schema Structure Tests
  // ==========================================================================

  describe('Schema Structure', () => {
    it('should expose schema structure', () => {
      const schema = mouService.getSchemaStructure();
      assert.ok(schema.requiredSections.length > 0);
    });

    it('should list authority levels', () => {
      const schema = mouService.getSchemaStructure();
      assert.ok(schema.authorityLevels.includes('operational'));
      assert.ok(schema.authorityLevels.includes('supervisory'));
      assert.ok(schema.authorityLevels.includes('executive'));
    });

    it('should list PII handling options', () => {
      const schema = mouService.getSchemaStructure();
      assert.ok(schema.piiHandlingOptions.includes('exclude'));
      assert.ok(schema.piiHandlingOptions.includes('redact'));
      assert.ok(schema.piiHandlingOptions.includes('tokenize'));
    });

    it('should list measurement frequencies', () => {
      const schema = mouService.getSchemaStructure();
      assert.ok(schema.measurementFrequencies.includes('realtime'));
      assert.ok(schema.measurementFrequencies.includes('daily'));
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of required sections', () => {
      const s1 = mouService.getRequiredSections();
      const s2 = mouService.getRequiredSections();
      assert.ok(s1 !== s2);
    });

    it('should return copies of roles', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addRole(mou.id, 'Role', 'Desc', [], 'operational', agencyA);
      const r1 = mouService.getRoles(mou.id);
      const r2 = mouService.getRoles(mou.id);
      assert.ok(r1 !== r2);
    });

    it('should return copies of SLA definitions', () => {
      const mou = mouService.createMou('Test MOU', [agencyA, agencyB]);
      mouService.addSlaDefinition(mou.id, 'metric', 100, 90, 80, 'percent', 'daily');
      const s1 = mouService.getSlaDefinitions(mou.id);
      const s2 = mouService.getSlaDefinitions(mou.id);
      assert.ok(s1 !== s2);
    });
  });
});
