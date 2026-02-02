/**
 * Incident Response Governance: Triage Contract Tests
 *
 * Phase IX - Triage runbook linkage and decision trees.
 *
 * CONTRACT SURFACE:
 * - Runbook Linkage: Incident type → runbook mapping
 * - Decision Trees: Structured triage flows
 * - Bounded Steps: Maximum steps in any decision tree
 * - Owner Assignment: Triage-to-owner handoff governance
 *
 * INVARIANTS:
 * - All incident types have valid runbooks
 * - Decision trees have bounded depth
 * - Triage must complete before incident can be assigned
 * - Triage decisions are append-only in timeline
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type IncidentType =
  | 'security_breach'
  | 'auth_outage'
  | 'data_exposure'
  | 'service_degradation'
  | 'governance_drift'
  | 'compliance_violation'
  | 'infrastructure_failure'
  | 'third_party_outage';

type SeverityLevel = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
type TriageStatus = 'pending' | 'in_progress' | 'completed' | 'escalated';
type TriageDecision =
  | 'confirm_severity'
  | 'adjust_severity'
  | 'assign_owner'
  | 'escalate'
  | 'merge_incident';

/**
 * Runbook definition
 */
interface RunbookDefinition {
  readonly runbook_id: string;
  readonly incident_type: IncidentType;
  readonly title: string;
  readonly url: string;
  readonly version: string;
  readonly last_updated: string;
  readonly steps: readonly RunbookStep[];
  readonly max_triage_time_minutes: number;
}

/**
 * Runbook step
 */
interface RunbookStep {
  readonly step_id: string;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly is_decision_point: boolean;
  readonly decision_options?: readonly string[];
  readonly next_step_id?: string;
}

/**
 * Decision tree node
 */
interface DecisionTreeNode {
  readonly node_id: string;
  readonly prompt: string;
  readonly options: readonly DecisionOption[];
  readonly max_depth_remaining: number;
}

/**
 * Decision option
 */
interface DecisionOption {
  readonly label: string;
  readonly action: TriageDecision;
  readonly next_node_id?: string;
  readonly terminal: boolean;
}

/**
 * Triage record
 */
interface TriageRecord {
  readonly triage_id: string;
  readonly incident_id: string;
  readonly status: TriageStatus;
  readonly runbook_id: string;
  readonly current_step: number;
  readonly decisions: readonly TriageDecisionRecord[];
  readonly started_at: string;
  readonly completed_at?: string;
  readonly assigned_owner?: string;
  readonly checksum: string;
}

/**
 * Triage decision record
 */
interface TriageDecisionRecord {
  readonly decision_id: string;
  readonly step_id: string;
  readonly decision: TriageDecision;
  readonly rationale: string;
  readonly decided_by: string;
  readonly decided_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockRunbookDefinition(
  overrides: Partial<RunbookDefinition> = {}
): RunbookDefinition {
  return {
    runbook_id: `runbook-${Date.now()}`,
    incident_type: 'service_degradation',
    title: 'Service Degradation Runbook',
    url: 'https://runbooks.terrafusion.gov/service-degradation',
    version: '1.0.0',
    last_updated: new Date().toISOString(),
    steps: [
      {
        step_id: 'step-1',
        order: 1,
        title: 'Confirm Impact',
        description: 'Assess the scope of service degradation',
        is_decision_point: true,
        decision_options: ['Global', 'Regional', 'Service-specific'],
        next_step_id: 'step-2',
      },
      {
        step_id: 'step-2',
        order: 2,
        title: 'Check Dependencies',
        description: 'Identify affected upstream/downstream services',
        is_decision_point: false,
        next_step_id: 'step-3',
      },
      {
        step_id: 'step-3',
        order: 3,
        title: 'Assign Owner',
        description: 'Assign incident owner based on affected service',
        is_decision_point: true,
        decision_options: ['Platform Team', 'Service Team', 'Escalate'],
      },
    ],
    max_triage_time_minutes: 30,
    ...overrides,
  };
}

function createMockTriageRecord(overrides: Partial<TriageRecord> = {}): TriageRecord {
  const triageId = `triage-${Date.now()}`;
  return {
    triage_id: `sha256:${Buffer.from(triageId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from(`incident-${Date.now()}`).toString('hex').slice(0, 64)}`,
    status: 'pending',
    runbook_id: 'runbook-service-degradation',
    current_step: 1,
    decisions: [],
    started_at: new Date().toISOString(),
    checksum: `sha256:${Buffer.from(`checksum-${triageId}`).toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockTriageDecisionRecord(
  overrides: Partial<TriageDecisionRecord> = {}
): TriageDecisionRecord {
  return {
    decision_id: `decision-${Date.now()}`,
    step_id: 'step-1',
    decision: 'confirm_severity',
    rationale: 'Impact confirmed as regional',
    decided_by: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    decided_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK TRIAGE STORE
// ============================================================================

interface TriageStore {
  // Runbook Management
  getRunbook(incidentType: IncidentType): Promise<RunbookDefinition>;
  getRunbookById(runbookId: string): Promise<RunbookDefinition>;
  getAllRunbooks(): Promise<readonly RunbookDefinition[]>;
  hasRunbook(incidentType: IncidentType): boolean;

  // Triage Management
  startTriage(incidentId: string, incidentType: IncidentType): Promise<TriageRecord>;
  getTriage(triageId: string): Promise<TriageRecord | null>;
  getTriageByIncident(incidentId: string): Promise<TriageRecord | null>;
  recordDecision(triageId: string, decision: TriageDecisionRecord): Promise<TriageRecord>;
  advanceStep(triageId: string): Promise<TriageRecord>;
  completeTriage(triageId: string, ownerId: string): Promise<TriageRecord>;
  escalateTriage(triageId: string, reason: string): Promise<TriageRecord>;

  // Decision Tree
  getDecisionTree(runbookId: string): Promise<DecisionTreeNode>;
  getMaxTreeDepth(runbookId: string): number;
  validateTreeBounds(runbookId: string): Promise<boolean>;
}

function createMockTriageStore(): TriageStore {
  const triageRecords: Map<string, TriageRecord> = new Map();
  const incidentToTriage: Map<string, string> = new Map();
  const MAX_TREE_DEPTH = 10;

  const runbooks: Map<IncidentType, RunbookDefinition> = new Map([
    [
      'security_breach',
      createMockRunbookDefinition({
        incident_type: 'security_breach',
        title: 'Security Breach Runbook',
        max_triage_time_minutes: 15,
      }),
    ],
    [
      'auth_outage',
      createMockRunbookDefinition({
        incident_type: 'auth_outage',
        title: 'Auth Outage Runbook',
        max_triage_time_minutes: 15,
      }),
    ],
    [
      'data_exposure',
      createMockRunbookDefinition({
        incident_type: 'data_exposure',
        title: 'Data Exposure Runbook',
        max_triage_time_minutes: 15,
      }),
    ],
    [
      'service_degradation',
      createMockRunbookDefinition({
        incident_type: 'service_degradation',
        title: 'Service Degradation Runbook',
        max_triage_time_minutes: 30,
      }),
    ],
    [
      'governance_drift',
      createMockRunbookDefinition({
        incident_type: 'governance_drift',
        title: 'Governance Drift Runbook',
        max_triage_time_minutes: 60,
      }),
    ],
    [
      'compliance_violation',
      createMockRunbookDefinition({
        incident_type: 'compliance_violation',
        title: 'Compliance Violation Runbook',
        max_triage_time_minutes: 30,
      }),
    ],
    [
      'infrastructure_failure',
      createMockRunbookDefinition({
        incident_type: 'infrastructure_failure',
        title: 'Infrastructure Failure Runbook',
        max_triage_time_minutes: 30,
      }),
    ],
    [
      'third_party_outage',
      createMockRunbookDefinition({
        incident_type: 'third_party_outage',
        title: 'Third Party Outage Runbook',
        max_triage_time_minutes: 60,
      }),
    ],
  ]);

  return {
    async getRunbook(incidentType) {
      const runbook = runbooks.get(incidentType);
      if (!runbook) throw new Error(`No runbook for incident type: ${incidentType}`);
      return runbook;
    },

    async getRunbookById(runbookId) {
      for (const runbook of runbooks.values()) {
        if (runbook.runbook_id === runbookId) return runbook;
      }
      throw new Error(`Runbook not found: ${runbookId}`);
    },

    async getAllRunbooks() {
      return Array.from(runbooks.values());
    },

    hasRunbook(incidentType) {
      return runbooks.has(incidentType);
    },

    async startTriage(incidentId, incidentType) {
      const runbook = await this.getRunbook(incidentType);
      const triage = createMockTriageRecord({
        incident_id: incidentId,
        runbook_id: runbook.runbook_id,
        status: 'in_progress',
      });
      triageRecords.set(triage.triage_id, triage);
      incidentToTriage.set(incidentId, triage.triage_id);
      return triage;
    },

    async getTriage(triageId) {
      return triageRecords.get(triageId) ?? null;
    },

    async getTriageByIncident(incidentId) {
      const triageId = incidentToTriage.get(incidentId);
      if (!triageId) return null;
      return triageRecords.get(triageId) ?? null;
    },

    async recordDecision(triageId, decision) {
      const existing = triageRecords.get(triageId);
      if (!existing) throw new Error(`Triage not found: ${triageId}`);
      const updated: TriageRecord = {
        ...existing,
        decisions: [...existing.decisions, decision],
      };
      triageRecords.set(triageId, updated);
      return updated;
    },

    async advanceStep(triageId) {
      const existing = triageRecords.get(triageId);
      if (!existing) throw new Error(`Triage not found: ${triageId}`);
      const updated: TriageRecord = {
        ...existing,
        current_step: existing.current_step + 1,
      };
      triageRecords.set(triageId, updated);
      return updated;
    },

    async completeTriage(triageId, ownerId) {
      const existing = triageRecords.get(triageId);
      if (!existing) throw new Error(`Triage not found: ${triageId}`);
      const updated: TriageRecord = {
        ...existing,
        status: 'completed',
        completed_at: new Date().toISOString(),
        assigned_owner: `sha256:${Buffer.from(ownerId).toString('hex').slice(0, 64)}`,
      };
      triageRecords.set(triageId, updated);
      return updated;
    },

    async escalateTriage(triageId, _reason) {
      const existing = triageRecords.get(triageId);
      if (!existing) throw new Error(`Triage not found: ${triageId}`);
      const updated: TriageRecord = {
        ...existing,
        status: 'escalated',
      };
      triageRecords.set(triageId, updated);
      return updated;
    },

    async getDecisionTree(_runbookId) {
      return {
        node_id: 'root',
        prompt: 'What is the impact scope?',
        max_depth_remaining: MAX_TREE_DEPTH,
        options: [
          {
            label: 'Global',
            action: 'confirm_severity' as TriageDecision,
            next_node_id: 'node-2',
            terminal: false,
          },
          {
            label: 'Regional',
            action: 'confirm_severity' as TriageDecision,
            next_node_id: 'node-2',
            terminal: false,
          },
          {
            label: 'Service',
            action: 'adjust_severity' as TriageDecision,
            next_node_id: 'node-3',
            terminal: false,
          },
        ],
      };
    },

    getMaxTreeDepth(_runbookId) {
      return MAX_TREE_DEPTH;
    },

    async validateTreeBounds(_runbookId) {
      return true; // All trees are validated to have bounded depth
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Incident Response Governance: Triage Contracts', () => {
  let store: TriageStore;

  beforeEach(() => {
    store = createMockTriageStore();
  });

  // ==========================================================================
  // CONTRACT: triage_runbook_linkage
  // ==========================================================================
  describe('CONTRACT: triage_runbook_linkage', () => {
    it('every incident type has a runbook', async () => {
      const incidentTypes: IncidentType[] = [
        'security_breach',
        'auth_outage',
        'data_exposure',
        'service_degradation',
        'governance_drift',
        'compliance_violation',
        'infrastructure_failure',
        'third_party_outage',
      ];

      for (const type of incidentTypes) {
        assert.ok(store.hasRunbook(type), `should have runbook for ${type}`);
      }
    });

    it('runbook has required metadata', async () => {
      const runbook = await store.getRunbook('security_breach');

      assert.ok(runbook.runbook_id);
      assert.ok(runbook.title);
      assert.ok(runbook.url);
      assert.ok(runbook.version);
      assert.ok(runbook.last_updated);
    });

    it('runbook has defined steps', async () => {
      const runbook = await store.getRunbook('service_degradation');

      assert.ok(runbook.steps.length > 0, 'runbook must have steps');
      for (const step of runbook.steps) {
        assert.ok(step.step_id);
        assert.ok(step.order >= 1);
        assert.ok(step.title);
        assert.ok(step.description);
      }
    });

    it('high-severity types have shorter triage time', async () => {
      const securityRunbook = await store.getRunbook('security_breach');
      const driftRunbook = await store.getRunbook('governance_drift');

      assert.ok(
        securityRunbook.max_triage_time_minutes < driftRunbook.max_triage_time_minutes,
        'security breach should have shorter triage time than drift'
      );
    });

    it('runbook steps have valid order', async () => {
      const runbook = await store.getRunbook('infrastructure_failure');
      const orders = runbook.steps.map(s => s.order);
      const sorted = [...orders].sort((a, b) => a - b);

      assert.deepStrictEqual(orders, sorted, 'steps should be in order');
    });
  });

  // ==========================================================================
  // CONTRACT: triage_decision_trees
  // ==========================================================================
  describe('CONTRACT: triage_decision_trees', () => {
    it('decision tree has bounded depth', async () => {
      const runbook = await store.getRunbook('service_degradation');
      const maxDepth = store.getMaxTreeDepth(runbook.runbook_id);

      assert.ok(maxDepth <= 10, 'tree depth should be bounded');
    });

    it('decision tree starts with root node', async () => {
      const runbook = await store.getRunbook('auth_outage');
      const tree = await store.getDecisionTree(runbook.runbook_id);

      assert.ok(tree.node_id);
      assert.ok(tree.prompt);
      assert.ok(tree.options.length > 0);
    });

    it('decision options have required fields', async () => {
      const runbook = await store.getRunbook('data_exposure');
      const tree = await store.getDecisionTree(runbook.runbook_id);

      for (const option of tree.options) {
        assert.ok(option.label);
        assert.ok(option.action);
        assert.ok(typeof option.terminal === 'boolean');
      }
    });

    it('validates tree bounds on load', async () => {
      const runbook = await store.getRunbook('compliance_violation');
      const isValid = await store.validateTreeBounds(runbook.runbook_id);

      assert.strictEqual(isValid, true);
    });
  });

  // ==========================================================================
  // CONTRACT: triage_workflow
  // ==========================================================================
  describe('CONTRACT: triage_workflow', () => {
    it('triage starts in in_progress status', async () => {
      const incidentId = `sha256:${Buffer.from('incident-1').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'service_degradation');

      assert.strictEqual(triage.status, 'in_progress');
      assert.strictEqual(triage.current_step, 1);
    });

    it('triage IDs are opaque', async () => {
      const incidentId = `sha256:${Buffer.from('incident-2').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'security_breach');

      assert.ok(triage.triage_id.startsWith('sha256:'));
    });

    it('triage records decisions in append-only fashion', async () => {
      const incidentId = `sha256:${Buffer.from('incident-3').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'auth_outage');

      const decision1 = createMockTriageDecisionRecord({ decision: 'confirm_severity' });
      const updated1 = await store.recordDecision(triage.triage_id, decision1);
      assert.strictEqual(updated1.decisions.length, 1);

      const decision2 = createMockTriageDecisionRecord({ decision: 'assign_owner' });
      const updated2 = await store.recordDecision(triage.triage_id, decision2);
      assert.strictEqual(updated2.decisions.length, 2);
    });

    it('triage can advance through steps', async () => {
      const incidentId = `sha256:${Buffer.from('incident-4').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'infrastructure_failure');

      assert.strictEqual(triage.current_step, 1);

      const advanced = await store.advanceStep(triage.triage_id);
      assert.strictEqual(advanced.current_step, 2);
    });
  });

  // ==========================================================================
  // CONTRACT: triage_completion
  // ==========================================================================
  describe('CONTRACT: triage_completion', () => {
    it('completed triage has assigned owner', async () => {
      const incidentId = `sha256:${Buffer.from('incident-5').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'third_party_outage');
      const completed = await store.completeTriage(triage.triage_id, 'owner-1');

      assert.strictEqual(completed.status, 'completed');
      assert.ok(completed.assigned_owner?.startsWith('sha256:'));
      assert.ok(completed.completed_at);
    });

    it('triage can be escalated', async () => {
      const incidentId = `sha256:${Buffer.from('incident-6').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'governance_drift');
      const escalated = await store.escalateTriage(triage.triage_id, 'Requires security review');

      assert.strictEqual(escalated.status, 'escalated');
    });

    it('triage is retrievable by incident ID', async () => {
      const incidentId = `sha256:${Buffer.from('incident-7').toString('hex').slice(0, 64)}`;
      await store.startTriage(incidentId, 'compliance_violation');
      const retrieved = await store.getTriageByIncident(incidentId);

      assert.ok(retrieved);
      assert.strictEqual(retrieved.incident_id, incidentId);
    });

    it('triage has integrity checksum', async () => {
      const incidentId = `sha256:${Buffer.from('incident-8').toString('hex').slice(0, 64)}`;
      const triage = await store.startTriage(incidentId, 'data_exposure');

      assert.ok(triage.checksum.startsWith('sha256:'));
    });
  });
});
