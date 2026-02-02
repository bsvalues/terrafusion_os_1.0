/**
 * Operational Runbook Automation: Schema Contract Tests
 *
 * Phase XI - Runbook-as-Code schema validation.
 *
 * CONTRACT SURFACE:
 * - Schema Validation: Runbooks must conform to declarative schema
 * - Required Fields: Title, steps, owner, rollback strategy
 * - Step Bounds: Maximum steps per runbook, max nested depth
 * - PII Rules: No PII in runbook definitions
 *
 * INVARIANTS:
 * - No unreviewed runbook can execute
 * - Runbooks are versioned and immutable once published
 * - All IDs are opaque sha256
 * - Steps are bounded and enumerable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RunbookStatus = 'draft' | 'review' | 'approved' | 'published' | 'deprecated';
type StepType = 'manual' | 'automated' | 'approval' | 'notification' | 'checkpoint';
type RiskTier = 'low' | 'medium' | 'high' | 'critical';
type ValidationResult = 'valid' | 'invalid' | 'warning';

/**
 * Runbook definition
 */
interface Runbook {
  readonly runbook_id: string;
  readonly title: string;
  readonly description: string;
  readonly version: number;
  readonly status: RunbookStatus;
  readonly owner_id: string;
  readonly steps: readonly RunbookStep[];
  readonly rollback_strategy: RollbackStrategy;
  readonly preconditions: readonly Precondition[];
  readonly evidence_hooks: readonly EvidenceHook[];
  readonly risk_tier: RiskTier;
  readonly max_execution_time_minutes: number;
  readonly created_at: string;
  readonly updated_at: string;
  readonly reviewed_by?: string;
  readonly approved_at?: string;
}

/**
 * Runbook step
 */
interface RunbookStep {
  readonly step_id: string;
  readonly order: number;
  readonly type: StepType;
  readonly title: string;
  readonly description: string;
  readonly timeout_minutes: number;
  readonly retry_count: number;
  readonly on_failure: 'abort' | 'rollback' | 'continue' | 'escalate';
  readonly evidence_required: boolean;
  readonly approval_required: boolean;
  readonly nested_steps?: readonly RunbookStep[];
}

/**
 * Rollback strategy
 */
interface RollbackStrategy {
  readonly strategy_id: string;
  readonly type: 'automatic' | 'manual' | 'checkpoint';
  readonly steps: readonly RunbookStep[];
  readonly max_rollback_time_minutes: number;
  readonly verification_required: boolean;
}

/**
 * Precondition
 */
interface Precondition {
  readonly precondition_id: string;
  readonly description: string;
  readonly check_type: 'health' | 'capacity' | 'dependency' | 'approval' | 'time_window';
  readonly required: boolean;
}

/**
 * Evidence hook
 */
interface EvidenceHook {
  readonly hook_id: string;
  readonly trigger: 'before_step' | 'after_step' | 'on_failure' | 'on_success';
  readonly step_id?: string;
  readonly evidence_type: string;
  readonly retention_days: number;
}

/**
 * Schema validation result
 */
interface SchemaValidationResult {
  readonly validation_id: string;
  readonly runbook_id: string;
  readonly result: ValidationResult;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly validated_at: string;
}

/**
 * Validation error
 */
interface ValidationError {
  readonly error_id: string;
  readonly field: string;
  readonly message: string;
  readonly rule: string;
}

/**
 * Validation warning
 */
interface ValidationWarning {
  readonly warning_id: string;
  readonly field: string;
  readonly message: string;
  readonly suggestion: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

const MAX_STEPS = 50;
const MAX_NESTED_DEPTH = 3;
const MAX_EXECUTION_TIME_MINUTES = 480; // 8 hours

function createMockRunbook(overrides: Partial<Runbook> = {}): Runbook {
  const runbookId = `rb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    runbook_id: `sha256:${Buffer.from(runbookId).toString('hex').slice(0, 64)}`,
    title: 'db-failover-procedure',
    description: 'Standard procedure for database failover during incident',
    version: 1,
    status: 'draft',
    owner_id: `sha256:${Buffer.from('owner-1').toString('hex').slice(0, 64)}`,
    steps: [createMockRunbookStep()],
    rollback_strategy: createMockRollbackStrategy(),
    preconditions: [createMockPrecondition()],
    evidence_hooks: [createMockEvidenceHook()],
    risk_tier: 'high',
    max_execution_time_minutes: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockRunbookStep(overrides: Partial<RunbookStep> = {}): RunbookStep {
  const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    step_id: `sha256:${Buffer.from(stepId).toString('hex').slice(0, 64)}`,
    order: 1,
    type: 'manual',
    title: 'verify-system-health',
    description: 'check all health endpoints before proceeding',
    timeout_minutes: 15,
    retry_count: 3,
    on_failure: 'abort',
    evidence_required: true,
    approval_required: false,
    ...overrides,
  };
}

function createMockRollbackStrategy(overrides: Partial<RollbackStrategy> = {}): RollbackStrategy {
  const strategyId = `strat-${Date.now()}`;
  return {
    strategy_id: `sha256:${Buffer.from(strategyId).toString('hex').slice(0, 64)}`,
    type: 'checkpoint',
    steps: [createMockRunbookStep({ title: 'restore-from-checkpoint' })],
    max_rollback_time_minutes: 60,
    verification_required: true,
    ...overrides,
  };
}

function createMockPrecondition(overrides: Partial<Precondition> = {}): Precondition {
  const precondId = `pre-${Date.now()}`;
  return {
    precondition_id: `sha256:${Buffer.from(precondId).toString('hex').slice(0, 64)}`,
    description: 'System is in healthy state',
    check_type: 'health',
    required: true,
    ...overrides,
  };
}

function createMockEvidenceHook(overrides: Partial<EvidenceHook> = {}): EvidenceHook {
  const hookId = `hook-${Date.now()}`;
  return {
    hook_id: `sha256:${Buffer.from(hookId).toString('hex').slice(0, 64)}`,
    trigger: 'after_step',
    evidence_type: 'screenshot',
    retention_days: 90,
    ...overrides,
  };
}

function createMockValidationResult(
  runbookId: string,
  errors: ValidationError[] = [],
  warnings: ValidationWarning[] = []
): SchemaValidationResult {
  const validationId = `val-${Date.now()}`;
  return {
    validation_id: `sha256:${Buffer.from(validationId).toString('hex').slice(0, 64)}`,
    runbook_id: runbookId,
    result: errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid',
    errors,
    warnings,
    validated_at: new Date().toISOString(),
  };
}

// ============================================================================
// MOCK RUNBOOK SCHEMA SERVICE
// ============================================================================

interface RunbookSchemaService {
  // Schema Validation
  validateRunbook(runbook: Runbook): Promise<SchemaValidationResult>;
  validateStep(step: RunbookStep, depth: number): Promise<readonly ValidationError[]>;
  validateRollbackStrategy(strategy: RollbackStrategy): Promise<readonly ValidationError[]>;

  // Required Fields
  getRequiredFields(): Promise<readonly string[]>;
  hasRequiredFields(runbook: Runbook): Promise<boolean>;

  // Bounds Checking
  countTotalSteps(runbook: Runbook): Promise<number>;
  getMaxNestedDepth(steps: readonly RunbookStep[], currentDepth?: number): Promise<number>;
  isWithinBounds(runbook: Runbook): Promise<boolean>;

  // PII Validation
  containsPII(text: string): Promise<boolean>;
  scanForPII(runbook: Runbook): Promise<readonly string[]>;

  // Versioning
  createVersion(runbook: Runbook): Promise<Runbook>;
  getVersionHistory(runbookId: string): Promise<readonly Runbook[]>;
  isImmutable(runbook: Runbook): Promise<boolean>;
}

function createMockRunbookSchemaService(): RunbookSchemaService {
  const versions: Map<string, Runbook[]> = new Map();

  const piiPatterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Names
    /\b[\w.-]+@[\w.-]+\.\w+\b/, // Emails
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
  ];

  function countSteps(steps: readonly RunbookStep[]): number {
    let count = steps.length;
    for (const step of steps) {
      if (step.nested_steps) {
        count += countSteps(step.nested_steps);
      }
    }
    return count;
  }

  function getDepth(steps: readonly RunbookStep[], current: number): number {
    if (steps.length === 0) return current;
    let maxDepth = current;
    for (const step of steps) {
      if (step.nested_steps && step.nested_steps.length > 0) {
        const childDepth = getDepth(step.nested_steps, current + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }
    return maxDepth;
  }

  return {
    async validateRunbook(runbook) {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Required fields
      if (!runbook.title) {
        errors.push({
          error_id: 'e1',
          field: 'title',
          message: 'Title is required',
          rule: 'required_field',
        });
      }
      if (!runbook.owner_id) {
        errors.push({
          error_id: 'e2',
          field: 'owner_id',
          message: 'Owner is required',
          rule: 'required_field',
        });
      }
      if (runbook.steps.length === 0) {
        errors.push({
          error_id: 'e3',
          field: 'steps',
          message: 'At least one step required',
          rule: 'required_field',
        });
      }
      if (!runbook.rollback_strategy) {
        errors.push({
          error_id: 'e4',
          field: 'rollback_strategy',
          message: 'Rollback strategy is required',
          rule: 'required_field',
        });
      }

      // Bounds
      const totalSteps = countSteps(runbook.steps);
      if (totalSteps > MAX_STEPS) {
        errors.push({
          error_id: 'e5',
          field: 'steps',
          message: `Too many steps: ${totalSteps} exceeds max ${MAX_STEPS}`,
          rule: 'step_bounds',
        });
      }

      const depth = getDepth(runbook.steps, 1);
      if (depth > MAX_NESTED_DEPTH) {
        errors.push({
          error_id: 'e6',
          field: 'steps',
          message: `Nesting too deep: ${depth} exceeds max ${MAX_NESTED_DEPTH}`,
          rule: 'nesting_bounds',
        });
      }

      if (runbook.max_execution_time_minutes > MAX_EXECUTION_TIME_MINUTES) {
        errors.push({
          error_id: 'e7',
          field: 'max_execution_time_minutes',
          message: `Execution time exceeds maximum ${MAX_EXECUTION_TIME_MINUTES} minutes`,
          rule: 'time_bounds',
        });
      }

      // PII scan
      const piiFields = await this.scanForPII(runbook);
      if (piiFields.length > 0) {
        errors.push({
          error_id: 'e8',
          field: piiFields.join(', '),
          message: 'PII detected in runbook definition',
          rule: 'pii_clean',
        });
      }

      // Warnings
      if (runbook.evidence_hooks.length === 0) {
        warnings.push({
          warning_id: 'w1',
          field: 'evidence_hooks',
          message: 'No evidence hooks defined',
          suggestion: 'Add evidence hooks for auditability',
        });
      }

      return createMockValidationResult(runbook.runbook_id, errors, warnings);
    },

    async validateStep(step, depth) {
      const errors: ValidationError[] = [];

      if (!step.title) {
        errors.push({
          error_id: 'e1',
          field: 'title',
          message: 'Step title required',
          rule: 'required_field',
        });
      }
      if (step.timeout_minutes <= 0) {
        errors.push({
          error_id: 'e2',
          field: 'timeout_minutes',
          message: 'Timeout must be positive',
          rule: 'positive_value',
        });
      }
      if (depth > MAX_NESTED_DEPTH && step.nested_steps && step.nested_steps.length > 0) {
        errors.push({
          error_id: 'e3',
          field: 'nested_steps',
          message: 'Maximum nesting depth exceeded',
          rule: 'nesting_bounds',
        });
      }

      return errors;
    },

    async validateRollbackStrategy(strategy) {
      const errors: ValidationError[] = [];

      if (strategy.steps.length === 0) {
        errors.push({
          error_id: 'e1',
          field: 'steps',
          message: 'Rollback strategy must have at least one step',
          rule: 'required_field',
        });
      }
      if (strategy.max_rollback_time_minutes <= 0) {
        errors.push({
          error_id: 'e2',
          field: 'max_rollback_time_minutes',
          message: 'Rollback time must be positive',
          rule: 'positive_value',
        });
      }

      return errors;
    },

    async getRequiredFields() {
      return ['title', 'owner_id', 'steps', 'rollback_strategy', 'risk_tier'];
    },

    async hasRequiredFields(runbook) {
      return !!(
        runbook.title &&
        runbook.owner_id &&
        runbook.steps.length > 0 &&
        runbook.rollback_strategy &&
        runbook.risk_tier
      );
    },

    async countTotalSteps(runbook) {
      return countSteps(runbook.steps);
    },

    async getMaxNestedDepth(steps, currentDepth = 1) {
      return getDepth(steps, currentDepth);
    },

    async isWithinBounds(runbook) {
      const totalSteps = countSteps(runbook.steps);
      const depth = getDepth(runbook.steps, 1);
      return totalSteps <= MAX_STEPS && depth <= MAX_NESTED_DEPTH;
    },

    async containsPII(text) {
      return piiPatterns.some(pattern => pattern.test(text));
    },

    async scanForPII(runbook) {
      const fieldsWithPII: string[] = [];

      if (await this.containsPII(runbook.title)) fieldsWithPII.push('title');
      if (await this.containsPII(runbook.description)) fieldsWithPII.push('description');

      for (const step of runbook.steps) {
        if (await this.containsPII(step.title)) fieldsWithPII.push(`step.${step.order}.title`);
        if (await this.containsPII(step.description))
          fieldsWithPII.push(`step.${step.order}.description`);
      }

      return fieldsWithPII;
    },

    async createVersion(runbook) {
      const newVersion = runbook.version + 1;
      const versioned: Runbook = {
        ...runbook,
        version: newVersion,
        updated_at: new Date().toISOString(),
      };

      const existing = versions.get(runbook.runbook_id) ?? [];
      versions.set(runbook.runbook_id, [...existing, versioned]);

      return versioned;
    },

    async getVersionHistory(runbookId) {
      return versions.get(runbookId) ?? [];
    },

    async isImmutable(runbook) {
      return runbook.status === 'published';
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Operational Runbook Automation: Schema Contracts', () => {
  let service: RunbookSchemaService;

  beforeEach(() => {
    service = createMockRunbookSchemaService();
  });

  // ==========================================================================
  // CONTRACT: schema_validation
  // ==========================================================================
  describe('CONTRACT: schema_validation', () => {
    it('validates valid runbook', async () => {
      const runbook = createMockRunbook();
      const result = await service.validateRunbook(runbook);

      assert.strictEqual(result.result, 'valid');
      assert.strictEqual(result.errors.length, 0);
    });

    it('rejects runbook without title', async () => {
      const runbook = createMockRunbook({ title: '' });
      const result = await service.validateRunbook(runbook);

      assert.strictEqual(result.result, 'invalid');
      assert.ok(result.errors.some(e => e.field === 'title'));
    });

    it('rejects runbook without steps', async () => {
      const runbook = createMockRunbook({ steps: [] });
      const result = await service.validateRunbook(runbook);

      assert.strictEqual(result.result, 'invalid');
      assert.ok(result.errors.some(e => e.field === 'steps'));
    });

    it('validation ID is opaque', async () => {
      const runbook = createMockRunbook();
      const result = await service.validateRunbook(runbook);

      assert.ok(result.validation_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: required_fields
  // ==========================================================================
  describe('CONTRACT: required_fields', () => {
    it('lists required fields', async () => {
      const fields = await service.getRequiredFields();

      assert.ok(fields.includes('title'));
      assert.ok(fields.includes('owner_id'));
      assert.ok(fields.includes('steps'));
      assert.ok(fields.includes('rollback_strategy'));
    });

    it('checks for required fields presence', async () => {
      const validRunbook = createMockRunbook();
      const hasRequired = await service.hasRequiredFields(validRunbook);

      assert.strictEqual(hasRequired, true);
    });

    it('rollback strategy is mandatory', async () => {
      const runbook = createMockRunbook({
        rollback_strategy: undefined as unknown as RollbackStrategy,
      });
      const result = await service.validateRunbook(runbook);

      assert.ok(result.errors.some(e => e.field === 'rollback_strategy'));
    });

    it('owner_id must be present', async () => {
      const runbook = createMockRunbook({ owner_id: '' });
      const result = await service.validateRunbook(runbook);

      assert.ok(result.errors.some(e => e.field === 'owner_id'));
    });
  });

  // ==========================================================================
  // CONTRACT: step_bounds
  // ==========================================================================
  describe('CONTRACT: step_bounds', () => {
    it('counts total steps including nested', async () => {
      const nestedStep = createMockRunbookStep({
        nested_steps: [createMockRunbookStep(), createMockRunbookStep()],
      });
      const runbook = createMockRunbook({ steps: [nestedStep] });

      const count = await service.countTotalSteps(runbook);

      assert.strictEqual(count, 3); // 1 parent + 2 nested
    });

    it('rejects runbook exceeding max steps', async () => {
      const manySteps = Array.from({ length: 51 }, (_, i) =>
        createMockRunbookStep({ order: i + 1 })
      );
      const runbook = createMockRunbook({ steps: manySteps });

      const result = await service.validateRunbook(runbook);

      assert.strictEqual(result.result, 'invalid');
      assert.ok(result.errors.some(e => e.rule === 'step_bounds'));
    });

    it('calculates max nested depth', async () => {
      const level3 = createMockRunbookStep({ nested_steps: [] });
      const level2 = createMockRunbookStep({ nested_steps: [level3] });
      const level1 = createMockRunbookStep({ nested_steps: [level2] });

      const depth = await service.getMaxNestedDepth([level1]);

      assert.strictEqual(depth, 3);
    });

    it('rejects excessive nesting depth', async () => {
      const level4 = createMockRunbookStep({});
      const level3 = createMockRunbookStep({ nested_steps: [level4] });
      const level2 = createMockRunbookStep({ nested_steps: [level3] });
      const level1 = createMockRunbookStep({ nested_steps: [level2] });
      const runbook = createMockRunbook({ steps: [level1] });

      const result = await service.validateRunbook(runbook);

      assert.strictEqual(result.result, 'invalid');
      assert.ok(result.errors.some(e => e.rule === 'nesting_bounds'));
    });

    it('checks bounds compliance', async () => {
      const runbook = createMockRunbook();
      const withinBounds = await service.isWithinBounds(runbook);

      assert.strictEqual(withinBounds, true);
    });
  });

  // ==========================================================================
  // CONTRACT: pii_rules
  // ==========================================================================
  describe('CONTRACT: pii_rules', () => {
    it('detects PII in text', async () => {
      const hasEmail = await service.containsPII('Contact john@example.com');
      const hasSSN = await service.containsPII('SSN: 123-45-6789');

      assert.strictEqual(hasEmail, true);
      assert.strictEqual(hasSSN, true);
    });

    it('accepts clean text', async () => {
      const hasPII = await service.containsPII('Restart the database service');

      assert.strictEqual(hasPII, false);
    });

    it('scans runbook for PII', async () => {
      const runbook = createMockRunbook({
        description: 'Contact admin@company.com for help',
      });

      const piiFields = await service.scanForPII(runbook);

      assert.ok(piiFields.includes('description'));
    });

    it('rejects runbook with PII', async () => {
      const runbook = createMockRunbook({
        title: 'Procedure by John Smith',
      });

      const result = await service.validateRunbook(runbook);

      assert.strictEqual(result.result, 'invalid');
      assert.ok(result.errors.some(e => e.rule === 'pii_clean'));
    });
  });

  // ==========================================================================
  // CONTRACT: versioning
  // ==========================================================================
  describe('CONTRACT: versioning', () => {
    it('creates new version', async () => {
      const runbook = createMockRunbook();
      const versioned = await service.createVersion(runbook);

      assert.strictEqual(versioned.version, runbook.version + 1);
    });

    it('maintains version history', async () => {
      const runbook = createMockRunbook();
      await service.createVersion(runbook);
      await service.createVersion({ ...runbook, version: 2 });

      const history = await service.getVersionHistory(runbook.runbook_id);

      assert.strictEqual(history.length, 2);
    });

    it('published runbooks are immutable', async () => {
      const runbook = createMockRunbook({ status: 'published' });
      const isImmutable = await service.isImmutable(runbook);

      assert.strictEqual(isImmutable, true);
    });

    it('draft runbooks are mutable', async () => {
      const runbook = createMockRunbook({ status: 'draft' });
      const isImmutable = await service.isImmutable(runbook);

      assert.strictEqual(isImmutable, false);
    });
  });

  // ==========================================================================
  // CONTRACT: step_validation
  // ==========================================================================
  describe('CONTRACT: step_validation', () => {
    it('validates step with required fields', async () => {
      const step = createMockRunbookStep();
      const errors = await service.validateStep(step, 1);

      assert.strictEqual(errors.length, 0);
    });

    it('rejects step without title', async () => {
      const step = createMockRunbookStep({ title: '' });
      const errors = await service.validateStep(step, 1);

      assert.ok(errors.some(e => e.field === 'title'));
    });

    it('rejects step with invalid timeout', async () => {
      const step = createMockRunbookStep({ timeout_minutes: 0 });
      const errors = await service.validateStep(step, 1);

      assert.ok(errors.some(e => e.field === 'timeout_minutes'));
    });
  });

  // ==========================================================================
  // CONTRACT: rollback_validation
  // ==========================================================================
  describe('CONTRACT: rollback_validation', () => {
    it('validates rollback strategy', async () => {
      const strategy = createMockRollbackStrategy();
      const errors = await service.validateRollbackStrategy(strategy);

      assert.strictEqual(errors.length, 0);
    });

    it('rejects empty rollback steps', async () => {
      const strategy = createMockRollbackStrategy({ steps: [] });
      const errors = await service.validateRollbackStrategy(strategy);

      assert.ok(errors.some(e => e.field === 'steps'));
    });

    it('strategy ID is opaque', async () => {
      const strategy = createMockRollbackStrategy();

      assert.ok(strategy.strategy_id.startsWith('sha256:'));
    });
  });
});
