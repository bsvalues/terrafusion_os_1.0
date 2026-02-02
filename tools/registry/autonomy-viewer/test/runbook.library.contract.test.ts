/**
 * Control Effectiveness: Runbook Library Contract Tests
 *
 * Phase XII - Canonical templates by incident class, required
 * verification hooks for each step (evidence capture).
 *
 * CONTRACT SURFACE:
 * - Template Library: Canonical runbook templates by incident class
 * - Verification Hooks: Required evidence capture per step
 * - Template Compliance: Runbooks match canonical templates
 * - Version Management: Template versioning and deprecation
 *
 * INVARIANTS:
 * - All templates have verification hooks
 * - Templates are versioned with deprecation support
 * - All IDs are opaque sha256:
 * - Templates enforce required evidence capture
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type IncidentClass =
  | 'database_failover'
  | 'network_outage'
  | 'security_breach'
  | 'capacity_exhaustion'
  | 'dependency_failure'
  | 'configuration_drift'
  | 'data_corruption';

type TemplateStatus = 'active' | 'deprecated' | 'draft' | 'archived';
type HookTrigger = 'pre_step' | 'post_step' | 'on_failure' | 'on_rollback';
type EvidenceType =
  | 'screenshot'
  | 'log_snapshot'
  | 'metric_snapshot'
  | 'approval_record'
  | 'command_output';

/**
 * Runbook template
 */
interface RunbookTemplate {
  readonly template_id: string;
  readonly incident_class: IncidentClass;
  readonly name: string;
  readonly description: string;
  readonly version: number;
  readonly status: TemplateStatus;
  readonly steps: readonly TemplateStep[];
  readonly required_hooks: readonly VerificationHook[];
  readonly created_at: string;
  readonly deprecated_at?: string;
  readonly successor_id?: string;
}

/**
 * Template step
 */
interface TemplateStep {
  readonly step_id: string;
  readonly order: number;
  readonly name: string;
  readonly description: string;
  readonly is_required: boolean;
  readonly verification_hooks: readonly VerificationHook[];
  readonly estimated_duration_minutes: number;
}

/**
 * Verification hook
 */
interface VerificationHook {
  readonly hook_id: string;
  readonly trigger: HookTrigger;
  readonly evidence_type: EvidenceType;
  readonly description: string;
  readonly is_required: boolean;
  readonly retention_days: number;
}

/**
 * Template compliance result
 */
interface TemplateComplianceResult {
  readonly result_id: string;
  readonly runbook_id: string;
  readonly template_id: string;
  readonly is_compliant: boolean;
  readonly missing_steps: readonly string[];
  readonly missing_hooks: readonly string[];
  readonly extra_steps: readonly string[];
  readonly compliance_score: number;
  readonly checked_at: string;
}

/**
 * Template library summary
 */
interface LibrarySummary {
  readonly summary_id: string;
  readonly total_templates: number;
  readonly active_templates: number;
  readonly deprecated_templates: number;
  readonly templates_by_class: Record<string, number>;
  readonly total_hooks_defined: number;
  readonly generated_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockVerificationHook(overrides: Partial<VerificationHook> = {}): VerificationHook {
  const hookId = `hook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    hook_id: `sha256:${Buffer.from(hookId).toString('hex').slice(0, 64)}`,
    trigger: 'post_step',
    evidence_type: 'log_snapshot',
    description: 'capture system logs after step completion',
    is_required: true,
    retention_days: 90,
    ...overrides,
  };
}

function createMockTemplateStep(overrides: Partial<TemplateStep> = {}): TemplateStep {
  const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    step_id: `sha256:${Buffer.from(stepId).toString('hex').slice(0, 64)}`,
    order: 1,
    name: 'verify-health',
    description: 'verify system health before proceeding',
    is_required: true,
    verification_hooks: [createMockVerificationHook()],
    estimated_duration_minutes: 5,
    ...overrides,
  };
}

function createMockRunbookTemplate(overrides: Partial<RunbookTemplate> = {}): RunbookTemplate {
  const templateId = `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    template_id: `sha256:${Buffer.from(templateId).toString('hex').slice(0, 64)}`,
    incident_class: 'database_failover',
    name: 'database-failover-standard',
    description: 'standard procedure for database failover',
    version: 1,
    status: 'active',
    steps: [
      createMockTemplateStep({ order: 1, name: 'pre-failover-checks' }),
      createMockTemplateStep({ order: 2, name: 'initiate-failover' }),
      createMockTemplateStep({ order: 3, name: 'verify-failover' }),
    ],
    required_hooks: [
      createMockVerificationHook({ trigger: 'pre_step', evidence_type: 'metric_snapshot' }),
      createMockVerificationHook({ trigger: 'post_step', evidence_type: 'log_snapshot' }),
    ],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK RUNBOOK LIBRARY SERVICE
// ============================================================================

interface RunbookLibraryService {
  // Template Management
  getTemplate(templateId: string): Promise<RunbookTemplate | null>;
  listTemplates(): Promise<readonly RunbookTemplate[]>;
  getTemplatesByClass(incidentClass: IncidentClass): Promise<readonly RunbookTemplate[]>;
  getActiveTemplate(incidentClass: IncidentClass): Promise<RunbookTemplate | null>;

  // Template Versioning
  createVersion(templateId: string): Promise<RunbookTemplate>;
  deprecateTemplate(templateId: string, successorId: string): Promise<RunbookTemplate>;
  getTemplateHistory(templateId: string): Promise<readonly RunbookTemplate[]>;

  // Verification Hooks
  getRequiredHooks(templateId: string): Promise<readonly VerificationHook[]>;
  validateHooks(runbookId: string, templateId: string): Promise<readonly string[]>;
  hasRequiredHooks(templateId: string): Promise<boolean>;

  // Compliance Checking
  checkCompliance(runbookId: string, templateId: string): Promise<TemplateComplianceResult>;
  getComplianceScore(runbookId: string, templateId: string): Promise<number>;

  // Library Summary
  generateSummary(): Promise<LibrarySummary>;
  getTemplateCount(): Promise<number>;
  getHookCount(): Promise<number>;
}

function createMockRunbookLibraryService(): RunbookLibraryService {
  const templates: Map<string, RunbookTemplate> = new Map();
  const templateHistory: Map<string, RunbookTemplate[]> = new Map();

  // Seed templates by incident class
  const incidentClasses: IncidentClass[] = [
    'database_failover',
    'network_outage',
    'security_breach',
    'capacity_exhaustion',
    'dependency_failure',
  ];

  for (const incidentClass of incidentClasses) {
    const template = createMockRunbookTemplate({
      incident_class: incidentClass,
      name: `${incidentClass}-standard`,
    });
    templates.set(template.template_id, template);
    templateHistory.set(template.template_id, [template]);
  }

  // Add a deprecated template
  const deprecatedTemplate = createMockRunbookTemplate({
    incident_class: 'database_failover',
    name: 'database-failover-legacy',
    status: 'deprecated',
    version: 1,
  });
  templates.set(deprecatedTemplate.template_id, deprecatedTemplate);

  return {
    async getTemplate(templateId) {
      return templates.get(templateId) ?? null;
    },

    async listTemplates() {
      return Array.from(templates.values());
    },

    async getTemplatesByClass(incidentClass) {
      return Array.from(templates.values()).filter(t => t.incident_class === incidentClass);
    },

    async getActiveTemplate(incidentClass) {
      const classTemplates = Array.from(templates.values()).filter(
        t => t.incident_class === incidentClass && t.status === 'active'
      );
      return classTemplates[0] ?? null;
    },

    async createVersion(templateId) {
      const existing = templates.get(templateId);
      if (!existing) throw new Error(`Template not found: ${templateId}`);

      const newVersion = createMockRunbookTemplate({
        ...existing,
        version: existing.version + 1,
        created_at: new Date().toISOString(),
      });
      templates.set(newVersion.template_id, newVersion);

      const history = templateHistory.get(templateId) ?? [];
      history.push(newVersion);
      templateHistory.set(templateId, history);

      return newVersion;
    },

    async deprecateTemplate(templateId, successorId) {
      const existing = templates.get(templateId);
      if (!existing) throw new Error(`Template not found: ${templateId}`);

      const deprecated: RunbookTemplate = {
        ...existing,
        status: 'deprecated',
        deprecated_at: new Date().toISOString(),
        successor_id: successorId,
      };
      templates.set(templateId, deprecated);
      return deprecated;
    },

    async getTemplateHistory(templateId) {
      return templateHistory.get(templateId) ?? [];
    },

    async getRequiredHooks(templateId) {
      const template = templates.get(templateId);
      if (!template) return [];
      return template.required_hooks.filter(h => h.is_required);
    },

    async validateHooks(runbookId, templateId) {
      // Mock validation - return empty array if compliant
      const template = templates.get(templateId);
      if (!template) return ['template_not_found'];
      // Simulate all hooks present
      return [];
    },

    async hasRequiredHooks(templateId) {
      const template = templates.get(templateId);
      if (!template) return false;
      return template.required_hooks.some(h => h.is_required);
    },

    async checkCompliance(runbookId, templateId) {
      const resultId = `res-${Date.now()}`;
      const template = templates.get(templateId);

      return {
        result_id: `sha256:${Buffer.from(resultId).toString('hex').slice(0, 64)}`,
        runbook_id: runbookId,
        template_id: templateId,
        is_compliant: true,
        missing_steps: [],
        missing_hooks: [],
        extra_steps: [],
        compliance_score: 100,
        checked_at: new Date().toISOString(),
      };
    },

    async getComplianceScore(runbookId, templateId) {
      const result = await this.checkCompliance(runbookId, templateId);
      return result.compliance_score;
    },

    async generateSummary() {
      const allTemplates = Array.from(templates.values());
      const active = allTemplates.filter(t => t.status === 'active');
      const deprecated = allTemplates.filter(t => t.status === 'deprecated');

      const byClass: Record<string, number> = {};
      for (const t of allTemplates) {
        byClass[t.incident_class] = (byClass[t.incident_class] ?? 0) + 1;
      }

      let totalHooks = 0;
      for (const t of allTemplates) {
        totalHooks += t.required_hooks.length;
        for (const step of t.steps) {
          totalHooks += step.verification_hooks.length;
        }
      }

      const summaryId = `sum-${Date.now()}`;
      return {
        summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
        total_templates: allTemplates.length,
        active_templates: active.length,
        deprecated_templates: deprecated.length,
        templates_by_class: byClass,
        total_hooks_defined: totalHooks,
        generated_at: new Date().toISOString(),
      };
    },

    async getTemplateCount() {
      return templates.size;
    },

    async getHookCount() {
      let count = 0;
      for (const t of templates.values()) {
        count += t.required_hooks.length;
      }
      return count;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Control Effectiveness: Runbook Library Contracts', () => {
  let service: RunbookLibraryService;

  beforeEach(() => {
    service = createMockRunbookLibraryService();
  });

  // ==========================================================================
  // CONTRACT: template_library
  // ==========================================================================
  describe('CONTRACT: template_library', () => {
    it('lists templates', async () => {
      const templates = await service.listTemplates();

      assert.ok(templates.length > 0);
    });

    it('templates have incident class', async () => {
      const templates = await service.listTemplates();

      for (const template of templates) {
        assert.ok(template.incident_class);
      }
    });

    it('gets templates by class', async () => {
      const templates = await service.getTemplatesByClass('database_failover');

      assert.ok(templates.length > 0);
      for (const t of templates) {
        assert.strictEqual(t.incident_class, 'database_failover');
      }
    });

    it('gets active template for class', async () => {
      const template = await service.getActiveTemplate('network_outage');

      assert.ok(template);
      assert.strictEqual(template.status, 'active');
    });

    it('template IDs are opaque', async () => {
      const templates = await service.listTemplates();

      for (const t of templates) {
        assert.ok(t.template_id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: verification_hooks
  // ==========================================================================
  describe('CONTRACT: verification_hooks', () => {
    it('templates have verification hooks', async () => {
      const templates = await service.listTemplates();
      const activeTemplate = templates.find(t => t.status === 'active');

      assert.ok(activeTemplate);
      assert.ok(activeTemplate.required_hooks.length > 0);
    });

    it('gets required hooks', async () => {
      const templates = await service.listTemplates();
      const hooks = await service.getRequiredHooks(templates[0].template_id);

      assert.ok(hooks.length > 0);
      for (const hook of hooks) {
        assert.strictEqual(hook.is_required, true);
      }
    });

    it('hooks have evidence types', async () => {
      const templates = await service.listTemplates();
      const activeTemplate = templates.find(t => t.status === 'active');

      assert.ok(activeTemplate);
      for (const hook of activeTemplate.required_hooks) {
        assert.ok(
          [
            'screenshot',
            'log_snapshot',
            'metric_snapshot',
            'approval_record',
            'command_output',
          ].includes(hook.evidence_type)
        );
      }
    });

    it('hooks have retention period', async () => {
      const templates = await service.listTemplates();
      const activeTemplate = templates.find(t => t.status === 'active');

      assert.ok(activeTemplate);
      for (const hook of activeTemplate.required_hooks) {
        assert.ok(hook.retention_days > 0);
      }
    });

    it('validates hooks are present', async () => {
      const templates = await service.listTemplates();
      const runbookId = `sha256:${Buffer.from('rb-1').toString('hex').slice(0, 64)}`;
      const missingHooks = await service.validateHooks(runbookId, templates[0].template_id);

      assert.ok(Array.isArray(missingHooks));
    });
  });

  // ==========================================================================
  // CONTRACT: template_versioning
  // ==========================================================================
  describe('CONTRACT: template_versioning', () => {
    it('templates have versions', async () => {
      const templates = await service.listTemplates();

      for (const t of templates) {
        assert.ok(t.version >= 1);
      }
    });

    it('creates new version', async () => {
      const templates = await service.listTemplates();
      const original = templates[0];
      const newVersion = await service.createVersion(original.template_id);

      assert.strictEqual(newVersion.version, original.version + 1);
    });

    it('deprecates template with successor', async () => {
      const templates = await service.listTemplates();
      const toDeprecate = templates.find(t => t.status === 'active');
      assert.ok(toDeprecate);

      const successorId = `sha256:${Buffer.from('successor').toString('hex').slice(0, 64)}`;
      const deprecated = await service.deprecateTemplate(toDeprecate.template_id, successorId);

      assert.strictEqual(deprecated.status, 'deprecated');
      assert.ok(deprecated.deprecated_at);
      assert.strictEqual(deprecated.successor_id, successorId);
    });

    it('retrieves template history', async () => {
      const templates = await service.listTemplates();
      const history = await service.getTemplateHistory(templates[0].template_id);

      assert.ok(history.length >= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: template_compliance
  // ==========================================================================
  describe('CONTRACT: template_compliance', () => {
    it('checks runbook compliance', async () => {
      const templates = await service.listTemplates();
      const runbookId = `sha256:${Buffer.from('rb-check').toString('hex').slice(0, 64)}`;
      const result = await service.checkCompliance(runbookId, templates[0].template_id);

      assert.ok(result.result_id.startsWith('sha256:'));
      assert.strictEqual(typeof result.is_compliant, 'boolean');
    });

    it('compliance includes missing items', async () => {
      const templates = await service.listTemplates();
      const runbookId = `sha256:${Buffer.from('rb-check').toString('hex').slice(0, 64)}`;
      const result = await service.checkCompliance(runbookId, templates[0].template_id);

      assert.ok(Array.isArray(result.missing_steps));
      assert.ok(Array.isArray(result.missing_hooks));
    });

    it('compliance has score', async () => {
      const templates = await service.listTemplates();
      const runbookId = `sha256:${Buffer.from('rb-score').toString('hex').slice(0, 64)}`;
      const score = await service.getComplianceScore(runbookId, templates[0].template_id);

      assert.ok(score >= 0);
      assert.ok(score <= 100);
    });
  });

  // ==========================================================================
  // CONTRACT: library_summary
  // ==========================================================================
  describe('CONTRACT: library_summary', () => {
    it('generates library summary', async () => {
      const summary = await service.generateSummary();

      assert.ok(summary.summary_id.startsWith('sha256:'));
      assert.ok(summary.total_templates > 0);
    });

    it('summary includes template counts', async () => {
      const summary = await service.generateSummary();

      assert.ok(summary.active_templates >= 0);
      assert.ok(summary.deprecated_templates >= 0);
      assert.strictEqual(
        summary.active_templates + summary.deprecated_templates <= summary.total_templates,
        true
      );
    });

    it('summary includes templates by class', async () => {
      const summary = await service.generateSummary();

      assert.ok(typeof summary.templates_by_class === 'object');
      assert.ok(Object.keys(summary.templates_by_class).length > 0);
    });

    it('summary includes hook count', async () => {
      const summary = await service.generateSummary();

      assert.ok(summary.total_hooks_defined > 0);
    });

    it('retrieves template count', async () => {
      const count = await service.getTemplateCount();

      assert.ok(count > 0);
    });
  });
});
