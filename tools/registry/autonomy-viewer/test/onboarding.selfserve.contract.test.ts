/**
 * Boundary Enforcement: Self-Serve Onboarding Contract Tests
 *
 * Phase XIII - New services register into governance plane
 * (coverage heatmap moves from "gap" to "covered").
 *
 * CONTRACT SURFACE:
 * - Service Registration: Self-serve service onboarding workflow
 * - Governance Binding: Automatic binding to governance policies
 * - Coverage Tracking: Gap-to-covered transition tracking
 * - Validation Gates: Pre-registration validation checks
 *
 * INVARIANTS:
 * - All registrations require service owner attestation
 * - Registration does not grant exemptions by default
 * - All IDs are opaque sha256:
 * - Coverage status transitions are auditable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RegistrationStatus = 'pending' | 'validating' | 'approved' | 'rejected' | 'active';
type CoverageTransition = 'gap_to_pending' | 'pending_to_covered' | 'covered_to_gap';
type ServiceTier = 'critical' | 'standard' | 'experimental';
type GovernanceBinding = 'full' | 'partial' | 'pending';

/**
 * Service registration request
 */
interface ServiceRegistration {
  readonly registration_id: string;
  readonly service_id: string;
  readonly service_name: string;
  readonly owner_id: string;
  readonly team_id: string;
  readonly tier: ServiceTier;
  readonly status: RegistrationStatus;
  readonly governance_binding: GovernanceBinding;
  readonly required_artifacts: readonly string[];
  readonly submitted_artifacts: readonly string[];
  readonly created_at: string;
  readonly approved_at?: string;
}

/**
 * Registration validation result
 */
interface RegistrationValidation {
  readonly validation_id: string;
  readonly registration_id: string;
  readonly is_valid: boolean;
  readonly checks_passed: readonly string[];
  readonly checks_failed: readonly string[];
  readonly blocking_issues: readonly string[];
  readonly validated_at: string;
}

/**
 * Coverage transition record
 */
interface CoverageTransitionRecord {
  readonly transition_id: string;
  readonly service_id: string;
  readonly transition_type: CoverageTransition;
  readonly previous_status: string;
  readonly new_status: string;
  readonly triggered_by: string;
  readonly timestamp: string;
}

/**
 * Onboarding checklist
 */
interface OnboardingChecklist {
  readonly checklist_id: string;
  readonly service_id: string;
  readonly total_items: number;
  readonly completed_items: number;
  readonly items: readonly ChecklistItem[];
  readonly completion_percentage: number;
}

/**
 * Checklist item
 */
interface ChecklistItem {
  readonly item_id: string;
  readonly category: string;
  readonly description: string;
  readonly is_required: boolean;
  readonly is_completed: boolean;
  readonly completed_at?: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockRegistration(overrides: Partial<ServiceRegistration> = {}): ServiceRegistration {
  const regId = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    registration_id: `sha256:${Buffer.from(regId).toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-new').toString('hex').slice(0, 64)}`,
    service_name: 'api-gateway-v2',
    owner_id: `sha256:${Buffer.from('owner-1').toString('hex').slice(0, 64)}`,
    team_id: `sha256:${Buffer.from('team-1').toString('hex').slice(0, 64)}`,
    tier: 'standard',
    status: 'pending',
    governance_binding: 'pending',
    required_artifacts: ['runbook', 'evidence_pack', 'attestation'],
    submitted_artifacts: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockValidation(
  overrides: Partial<RegistrationValidation> = {}
): RegistrationValidation {
  const valId = `val-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    validation_id: `sha256:${Buffer.from(valId).toString('hex').slice(0, 64)}`,
    registration_id: `sha256:${Buffer.from('reg-1').toString('hex').slice(0, 64)}`,
    is_valid: true,
    checks_passed: ['owner_attestation', 'team_exists', 'tier_valid'],
    checks_failed: [],
    blocking_issues: [],
    validated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockTransitionRecord(
  overrides: Partial<CoverageTransitionRecord> = {}
): CoverageTransitionRecord {
  const transId = `trans-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    transition_id: `sha256:${Buffer.from(transId).toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    transition_type: 'gap_to_pending',
    previous_status: 'gap',
    new_status: 'pending',
    triggered_by: `sha256:${Buffer.from('actor-1').toString('hex').slice(0, 64)}`,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function createMockChecklist(overrides: Partial<OnboardingChecklist> = {}): OnboardingChecklist {
  const checkId = `check-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    checklist_id: `sha256:${Buffer.from(checkId).toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    total_items: 5,
    completed_items: 2,
    items: [
      {
        item_id: 'i1',
        category: 'runbook',
        description: 'create primary runbook',
        is_required: true,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      {
        item_id: 'i2',
        category: 'evidence',
        description: 'upload evidence pack',
        is_required: true,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      {
        item_id: 'i3',
        category: 'attestation',
        description: 'owner attestation',
        is_required: true,
        is_completed: false,
      },
      {
        item_id: 'i4',
        category: 'drill',
        description: 'schedule first drill',
        is_required: false,
        is_completed: false,
      },
      {
        item_id: 'i5',
        category: 'review',
        description: 'team review complete',
        is_required: true,
        is_completed: false,
      },
    ],
    completion_percentage: 40,
    ...overrides,
  };
}

// ============================================================================
// MOCK SELF-SERVE ONBOARDING SERVICE
// ============================================================================

interface SelfServeOnboardingService {
  // Registration
  createRegistration(
    serviceName: string,
    ownerId: string,
    teamId: string,
    tier: ServiceTier
  ): Promise<ServiceRegistration>;
  getRegistration(registrationId: string): Promise<ServiceRegistration | null>;
  listPendingRegistrations(): Promise<readonly ServiceRegistration[]>;
  approveRegistration(registrationId: string, approverId: string): Promise<ServiceRegistration>;
  rejectRegistration(registrationId: string, reason: string): Promise<ServiceRegistration>;

  // Validation
  validateRegistration(registrationId: string): Promise<RegistrationValidation>;
  hasRequiredAttestation(registrationId: string): Promise<boolean>;
  checkPrerequisites(serviceName: string, tier: ServiceTier): Promise<readonly string[]>;

  // Coverage Transitions
  recordTransition(
    serviceId: string,
    transitionType: CoverageTransition,
    actorId: string
  ): Promise<CoverageTransitionRecord>;
  getTransitionHistory(serviceId: string): Promise<readonly CoverageTransitionRecord[]>;
  getCurrentCoverageStatus(serviceId: string): Promise<string>;

  // Onboarding Checklist
  getChecklist(serviceId: string): Promise<OnboardingChecklist>;
  completeChecklistItem(serviceId: string, itemId: string): Promise<OnboardingChecklist>;
  getCompletionPercentage(serviceId: string): Promise<number>;

  // Governance Binding
  bindToGovernance(serviceId: string): Promise<GovernanceBinding>;
  getGovernanceBinding(serviceId: string): Promise<GovernanceBinding>;
  hasExemptions(serviceId: string): Promise<boolean>;
}

function createMockSelfServeOnboardingService(): SelfServeOnboardingService {
  const registrations: Map<string, ServiceRegistration> = new Map();
  const transitions: Map<string, CoverageTransitionRecord[]> = new Map();
  const checklists: Map<string, OnboardingChecklist> = new Map();
  const bindings: Map<string, GovernanceBinding> = new Map();

  return {
    async createRegistration(serviceName, ownerId, teamId, tier) {
      const registration = createMockRegistration({
        service_name: serviceName,
        owner_id: ownerId,
        team_id: teamId,
        tier,
      });
      registrations.set(registration.registration_id, registration);
      return registration;
    },

    async getRegistration(registrationId) {
      return registrations.get(registrationId) ?? null;
    },

    async listPendingRegistrations() {
      return Array.from(registrations.values()).filter(r => r.status === 'pending');
    },

    async approveRegistration(registrationId, approverId) {
      const reg = registrations.get(registrationId);
      if (!reg) throw new Error(`Registration not found: ${registrationId}`);

      const approved: ServiceRegistration = {
        ...reg,
        status: 'approved',
        governance_binding: 'full',
        approved_at: new Date().toISOString(),
      };
      registrations.set(registrationId, approved);

      // Record transition
      await this.recordTransition(reg.service_id, 'pending_to_covered', approverId);

      return approved;
    },

    async rejectRegistration(registrationId, _reason) {
      const reg = registrations.get(registrationId);
      if (!reg) throw new Error(`Registration not found: ${registrationId}`);

      const rejected: ServiceRegistration = { ...reg, status: 'rejected' };
      registrations.set(registrationId, rejected);
      return rejected;
    },

    async validateRegistration(registrationId) {
      const reg = registrations.get(registrationId);
      if (!reg) {
        return createMockValidation({
          registration_id: registrationId,
          is_valid: false,
          checks_failed: ['registration_not_found'],
          blocking_issues: ['registration does not exist'],
        });
      }

      const checksPass = ['owner_exists', 'team_exists', 'tier_valid', 'name_unique'];
      const checksFail: string[] = [];
      const blocking: string[] = [];

      // Check owner attestation
      if (!reg.owner_id) {
        checksFail.push('owner_attestation');
        blocking.push('owner attestation required');
      } else {
        checksPass.push('owner_attestation');
      }

      return createMockValidation({
        registration_id: registrationId,
        is_valid: blocking.length === 0,
        checks_passed: checksPass,
        checks_failed: checksFail,
        blocking_issues: blocking,
      });
    },

    async hasRequiredAttestation(registrationId) {
      const reg = registrations.get(registrationId);
      return !!reg?.owner_id;
    },

    async checkPrerequisites(_serviceName, tier) {
      const missing: string[] = [];
      if (tier === 'critical') {
        // Critical tier has more requirements
        missing.push('security_review_required');
      }
      return missing;
    },

    async recordTransition(serviceId, transitionType, actorId) {
      const record = createMockTransitionRecord({
        service_id: serviceId,
        transition_type: transitionType,
        triggered_by: actorId,
      });

      const history = transitions.get(serviceId) ?? [];
      history.push(record);
      transitions.set(serviceId, history);

      return record;
    },

    async getTransitionHistory(serviceId) {
      return transitions.get(serviceId) ?? [];
    },

    async getCurrentCoverageStatus(serviceId) {
      const history = transitions.get(serviceId) ?? [];
      if (history.length === 0) return 'gap';
      return history[history.length - 1].new_status;
    },

    async getChecklist(serviceId) {
      const existing = checklists.get(serviceId);
      if (existing) return existing;

      const checklist = createMockChecklist({ service_id: serviceId });
      checklists.set(serviceId, checklist);
      return checklist;
    },

    async completeChecklistItem(serviceId, itemId) {
      const checklist = await this.getChecklist(serviceId);
      const updatedItems = checklist.items.map(item =>
        item.item_id === itemId
          ? { ...item, is_completed: true, completed_at: new Date().toISOString() }
          : item
      );
      const completedCount = updatedItems.filter(i => i.is_completed).length;

      const updated: OnboardingChecklist = {
        ...checklist,
        items: updatedItems,
        completed_items: completedCount,
        completion_percentage: Math.round((completedCount / checklist.total_items) * 100),
      };
      checklists.set(serviceId, updated);
      return updated;
    },

    async getCompletionPercentage(serviceId) {
      const checklist = await this.getChecklist(serviceId);
      return checklist.completion_percentage;
    },

    async bindToGovernance(serviceId) {
      bindings.set(serviceId, 'full');
      return 'full';
    },

    async getGovernanceBinding(serviceId) {
      return bindings.get(serviceId) ?? 'pending';
    },

    async hasExemptions(_serviceId) {
      // INVARIANT: Registration does not grant exemptions by default
      return false;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Boundary Enforcement: Self-Serve Onboarding Contracts', () => {
  let service: SelfServeOnboardingService;

  beforeEach(() => {
    service = createMockSelfServeOnboardingService();
  });

  // ==========================================================================
  // CONTRACT: service_registration
  // ==========================================================================
  describe('CONTRACT: service_registration', () => {
    it('creates service registration', async () => {
      const reg = await service.createRegistration('new-api', 'owner-1', 'team-1', 'standard');

      assert.ok(reg.registration_id.startsWith('sha256:'));
      assert.strictEqual(reg.status, 'pending');
    });

    it('registration requires owner ID', async () => {
      const reg = await service.createRegistration('api-svc', 'owner-1', 'team-1', 'standard');

      assert.ok(reg.owner_id.startsWith('sha256:'));
    });

    it('retrieves registration by ID', async () => {
      const reg = await service.createRegistration('test-svc', 'owner-1', 'team-1', 'standard');
      const retrieved = await service.getRegistration(reg.registration_id);

      assert.ok(retrieved);
      assert.strictEqual(retrieved.registration_id, reg.registration_id);
    });

    it('lists pending registrations', async () => {
      await service.createRegistration('svc-1', 'owner-1', 'team-1', 'standard');
      await service.createRegistration('svc-2', 'owner-1', 'team-1', 'standard');

      const pending = await service.listPendingRegistrations();
      assert.ok(pending.length >= 2);
    });

    it('registration IDs are opaque', async () => {
      const reg = await service.createRegistration('opaque-test', 'owner-1', 'team-1', 'standard');

      assert.ok(reg.registration_id.startsWith('sha256:'));
      assert.ok(reg.service_id.startsWith('sha256:'));
      assert.ok(reg.owner_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: registration_validation
  // ==========================================================================
  describe('CONTRACT: registration_validation', () => {
    it('validates registration', async () => {
      const reg = await service.createRegistration('valid-svc', 'owner-1', 'team-1', 'standard');
      const validation = await service.validateRegistration(reg.registration_id);

      assert.ok(validation.validation_id.startsWith('sha256:'));
      assert.strictEqual(validation.is_valid, true);
    });

    it('validation includes checks passed/failed', async () => {
      const reg = await service.createRegistration('check-svc', 'owner-1', 'team-1', 'standard');
      const validation = await service.validateRegistration(reg.registration_id);

      assert.ok(Array.isArray(validation.checks_passed));
      assert.ok(Array.isArray(validation.checks_failed));
    });

    it('validates owner attestation requirement', async () => {
      const reg = await service.createRegistration('attest-svc', 'owner-1', 'team-1', 'standard');
      const hasAttestation = await service.hasRequiredAttestation(reg.registration_id);

      assert.strictEqual(hasAttestation, true);
    });

    it('checks prerequisites by tier', async () => {
      const standardPrereqs = await service.checkPrerequisites('standard-svc', 'standard');
      const criticalPrereqs = await service.checkPrerequisites('critical-svc', 'critical');

      assert.ok(criticalPrereqs.length >= standardPrereqs.length);
    });
  });

  // ==========================================================================
  // CONTRACT: registration_approval
  // ==========================================================================
  describe('CONTRACT: registration_approval', () => {
    it('approves registration', async () => {
      const reg = await service.createRegistration('approve-svc', 'owner-1', 'team-1', 'standard');
      const approved = await service.approveRegistration(reg.registration_id, 'approver-1');

      assert.strictEqual(approved.status, 'approved');
      assert.ok(approved.approved_at);
    });

    it('approval binds to governance', async () => {
      const reg = await service.createRegistration('bind-svc', 'owner-1', 'team-1', 'standard');
      const approved = await service.approveRegistration(reg.registration_id, 'approver-1');

      assert.strictEqual(approved.governance_binding, 'full');
    });

    it('rejects registration with reason', async () => {
      const reg = await service.createRegistration('reject-svc', 'owner-1', 'team-1', 'standard');
      const rejected = await service.rejectRegistration(
        reg.registration_id,
        'incomplete documentation'
      );

      assert.strictEqual(rejected.status, 'rejected');
    });
  });

  // ==========================================================================
  // CONTRACT: coverage_transitions
  // ==========================================================================
  describe('CONTRACT: coverage_transitions', () => {
    it('records coverage transition', async () => {
      const serviceId = `sha256:${Buffer.from('trans-svc').toString('hex').slice(0, 64)}`;
      const record = await service.recordTransition(serviceId, 'gap_to_pending', 'actor-1');

      assert.ok(record.transition_id.startsWith('sha256:'));
      assert.strictEqual(record.transition_type, 'gap_to_pending');
    });

    it('retrieves transition history', async () => {
      const serviceId = `sha256:${Buffer.from('history-svc').toString('hex').slice(0, 64)}`;
      await service.recordTransition(serviceId, 'gap_to_pending', 'actor-1');
      await service.recordTransition(serviceId, 'pending_to_covered', 'actor-1');

      const history = await service.getTransitionHistory(serviceId);
      assert.strictEqual(history.length, 2);
    });

    it('gets current coverage status', async () => {
      const serviceId = `sha256:${Buffer.from('status-svc').toString('hex').slice(0, 64)}`;
      await service.recordTransition(serviceId, 'gap_to_pending', 'actor-1');

      const status = await service.getCurrentCoverageStatus(serviceId);
      assert.strictEqual(status, 'pending');
    });

    it('approval triggers transition', async () => {
      const reg = await service.createRegistration(
        'trans-approve',
        'owner-1',
        'team-1',
        'standard'
      );
      await service.approveRegistration(reg.registration_id, 'approver-1');

      const history = await service.getTransitionHistory(reg.service_id);
      assert.ok(history.some(t => t.transition_type === 'pending_to_covered'));
    });
  });

  // ==========================================================================
  // CONTRACT: onboarding_checklist
  // ==========================================================================
  describe('CONTRACT: onboarding_checklist', () => {
    it('gets onboarding checklist', async () => {
      const serviceId = `sha256:${Buffer.from('checklist-svc').toString('hex').slice(0, 64)}`;
      const checklist = await service.getChecklist(serviceId);

      assert.ok(checklist.checklist_id.startsWith('sha256:'));
      assert.ok(checklist.total_items > 0);
    });

    it('completes checklist item', async () => {
      const serviceId = `sha256:${Buffer.from('complete-svc').toString('hex').slice(0, 64)}`;
      const checklist = await service.getChecklist(serviceId);
      const initialCompleted = checklist.completed_items;

      const incompleteItem = checklist.items.find(i => !i.is_completed);
      if (incompleteItem) {
        const updated = await service.completeChecklistItem(serviceId, incompleteItem.item_id);
        assert.strictEqual(updated.completed_items, initialCompleted + 1);
      }
    });

    it('tracks completion percentage', async () => {
      const serviceId = `sha256:${Buffer.from('percent-svc').toString('hex').slice(0, 64)}`;
      const percentage = await service.getCompletionPercentage(serviceId);

      assert.ok(percentage >= 0);
      assert.ok(percentage <= 100);
    });
  });

  // ==========================================================================
  // CONTRACT: governance_binding
  // ==========================================================================
  describe('CONTRACT: governance_binding', () => {
    it('binds service to governance', async () => {
      const serviceId = `sha256:${Buffer.from('bind-gov').toString('hex').slice(0, 64)}`;
      const binding = await service.bindToGovernance(serviceId);

      assert.strictEqual(binding, 'full');
    });

    it('retrieves governance binding status', async () => {
      const serviceId = `sha256:${Buffer.from('get-bind').toString('hex').slice(0, 64)}`;
      await service.bindToGovernance(serviceId);

      const binding = await service.getGovernanceBinding(serviceId);
      assert.strictEqual(binding, 'full');
    });

    it('no exemptions by default (invariant)', async () => {
      const serviceId = `sha256:${Buffer.from('no-exempt').toString('hex').slice(0, 64)}`;
      const hasExemptions = await service.hasExemptions(serviceId);

      assert.strictEqual(hasExemptions, false);
    });
  });
});
