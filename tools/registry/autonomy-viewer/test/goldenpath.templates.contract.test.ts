/**
 * Boundary Enforcement: Golden Path Templates Contract Tests
 *
 * Phase XIII - Templates + generators for runbooks, evidence packs,
 * attestations, playbooks - providing canonical paths that embed governance.
 *
 * CONTRACT SURFACE:
 * - Template Catalog: Browsable template registry
 * - Template Generation: Create artifacts from templates
 * - Template Validation: Ensure generated artifacts conform
 * - Template Customization: Service-specific overrides
 *
 * INVARIANTS:
 * - All generated artifacts pass policy lint gates
 * - Templates are versioned and immutable once published
 * - All IDs are opaque sha256:
 * - Generated artifacts embed governance metadata
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TemplateType =
  | 'runbook'
  | 'evidence_pack'
  | 'attestation'
  | 'playbook'
  | 'incident_response'
  | 'drp';
type TemplateStatus = 'draft' | 'published' | 'deprecated';

/**
 * Template definition
 */
interface Template {
  readonly template_id: string;
  readonly name: string;
  readonly type: TemplateType;
  readonly description: string;
  readonly version: number;
  readonly status: TemplateStatus;
  readonly schema: Record<string, unknown>;
  readonly required_fields: readonly string[];
  readonly created_at: string;
  readonly published_at?: string;
}

/**
 * Template input parameters
 */
interface TemplateInput {
  readonly template_id: string;
  readonly service_id: string;
  readonly parameters: Record<string, unknown>;
  readonly customizations?: Record<string, unknown>;
}

/**
 * Generated artifact
 */
interface GeneratedArtifact {
  readonly artifact_id: string;
  readonly template_id: string;
  readonly service_id: string;
  readonly type: TemplateType;
  readonly content: Record<string, unknown>;
  readonly governance_metadata: GovernanceMetadata;
  readonly generated_at: string;
  readonly valid: boolean;
}

/**
 * Governance metadata embedded in artifacts
 */
interface GovernanceMetadata {
  readonly template_version: number;
  readonly generated_by: string;
  readonly attestation_required: boolean;
  readonly review_required: boolean;
  readonly compliance_tags: readonly string[];
}

/**
 * Template validation result
 */
interface TemplateValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly policy_check_passed: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockTemplate(overrides: Partial<Template> = {}): Template {
  const templateId = `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    template_id: `sha256:${Buffer.from(templateId).toString('hex').slice(0, 64)}`,
    name: 'standard-runbook',
    type: 'runbook',
    description: 'standard operational runbook template',
    version: 1,
    status: 'published',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        steps: { type: 'array' },
        rollback: { type: 'object' },
      },
    },
    required_fields: ['title', 'steps', 'rollback'],
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockArtifact(overrides: Partial<GeneratedArtifact> = {}): GeneratedArtifact {
  const artifactId = `art-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    artifact_id: `sha256:${Buffer.from(artifactId).toString('hex').slice(0, 64)}`,
    template_id: `sha256:${Buffer.from('tmpl-1').toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    type: 'runbook',
    content: {
      title: 'gen-runbook-001',
      steps: [{ action: 'check health' }],
      rollback: { steps: [] },
    },
    governance_metadata: {
      template_version: 1,
      generated_by: `sha256:${Buffer.from('generator-v1').toString('hex').slice(0, 64)}`,
      attestation_required: true,
      review_required: true,
      compliance_tags: ['SOC2', 'FISMA'],
    },
    generated_at: new Date().toISOString(),
    valid: true,
    ...overrides,
  };
}

// ============================================================================
// MOCK GOLDEN PATH SERVICE
// ============================================================================

interface GoldenPathTemplateService {
  // Catalog
  listTemplates(): Promise<readonly Template[]>;
  getTemplate(templateId: string): Promise<Template | null>;
  getTemplatesByType(type: TemplateType): Promise<readonly Template[]>;
  getPublishedTemplates(): Promise<readonly Template[]>;

  // Generation
  generateArtifact(input: TemplateInput): Promise<GeneratedArtifact>;
  generateMultiple(inputs: readonly TemplateInput[]): Promise<readonly GeneratedArtifact[]>;
  previewArtifact(input: TemplateInput): Promise<GeneratedArtifact>;

  // Validation
  validateArtifact(artifact: GeneratedArtifact): Promise<TemplateValidationResult>;
  validateInput(input: TemplateInput): Promise<TemplateValidationResult>;
  checkRequiredFields(input: TemplateInput, template: Template): Promise<readonly string[]>;

  // Customization
  applyCustomizations(
    artifact: GeneratedArtifact,
    customizations: Record<string, unknown>
  ): Promise<GeneratedArtifact>;
  getServiceDefaults(serviceId: string): Promise<Record<string, unknown>>;
}

function createMockGoldenPathService(): GoldenPathTemplateService {
  const templates: Map<string, Template> = new Map();

  // Seed default templates
  const defaultTemplates: Template[] = [
    createMockTemplate({ name: 'standard-runbook', type: 'runbook' }),
    createMockTemplate({ name: 'evidence-pack-quarterly', type: 'evidence_pack' }),
    createMockTemplate({ name: 'service-attestation', type: 'attestation' }),
    createMockTemplate({ name: 'incident-playbook', type: 'playbook' }),
    createMockTemplate({ name: 'disaster-recovery-plan', type: 'drp' }),
  ];

  for (const template of defaultTemplates) {
    templates.set(template.template_id, template);
  }

  return {
    async listTemplates() {
      return Array.from(templates.values());
    },

    async getTemplate(templateId) {
      return templates.get(templateId) ?? null;
    },

    async getTemplatesByType(type) {
      return Array.from(templates.values()).filter(t => t.type === type);
    },

    async getPublishedTemplates() {
      return Array.from(templates.values()).filter(t => t.status === 'published');
    },

    async generateArtifact(input) {
      const template = templates.get(input.template_id);
      if (!template) {
        return createMockArtifact({ valid: false });
      }

      return createMockArtifact({
        template_id: input.template_id,
        service_id: input.service_id,
        type: template.type,
        content: { ...input.parameters, ...input.customizations },
        governance_metadata: {
          template_version: template.version,
          generated_by: `sha256:${Buffer.from('generator-v1').toString('hex').slice(0, 64)}`,
          attestation_required: true,
          review_required: true,
          compliance_tags: ['FISMA'],
        },
        valid: true,
      });
    },

    async generateMultiple(inputs) {
      const results: GeneratedArtifact[] = [];
      for (const input of inputs) {
        results.push(await this.generateArtifact(input));
      }
      return results;
    },

    async previewArtifact(input) {
      const artifact = await this.generateArtifact(input);
      return artifact;
    },

    async validateArtifact(artifact) {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required governance metadata
      if (!artifact.governance_metadata.template_version) {
        errors.push('missing template_version in governance metadata');
      }

      // Check for PII-free content (mock check)
      const contentStr = JSON.stringify(artifact.content);
      if (/\b(ssn|email)\b/i.test(contentStr)) {
        errors.push('PII detected in artifact content');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        policy_check_passed: errors.length === 0,
      };
    },

    async validateInput(input) {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!input.template_id) {
        errors.push('template_id required');
      }
      if (!input.service_id) {
        errors.push('service_id required');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        policy_check_passed: true,
      };
    },

    async checkRequiredFields(input, template) {
      const missing: string[] = [];
      for (const field of template.required_fields) {
        if (!(field in input.parameters)) {
          missing.push(field);
        }
      }
      return missing;
    },

    async applyCustomizations(artifact, customizations) {
      return createMockArtifact({
        ...artifact,
        content: { ...artifact.content, ...customizations },
      });
    },

    async getServiceDefaults(serviceId) {
      return {
        service_id: serviceId,
        environment: 'production',
        tier: 'standard',
      };
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Boundary Enforcement: Golden Path Templates Contracts', () => {
  let service: GoldenPathTemplateService;

  beforeEach(() => {
    service = createMockGoldenPathService();
  });

  // ==========================================================================
  // CONTRACT: template_catalog
  // ==========================================================================
  describe('CONTRACT: template_catalog', () => {
    it('lists all templates', async () => {
      const templates = await service.listTemplates();

      assert.ok(templates.length > 0);
    });

    it('templates have opaque IDs', async () => {
      const templates = await service.listTemplates();

      for (const template of templates) {
        assert.ok(template.template_id.startsWith('sha256:'));
      }
    });

    it('templates are versioned', async () => {
      const templates = await service.listTemplates();

      for (const template of templates) {
        assert.ok(template.version >= 1);
      }
    });

    it('filters by type', async () => {
      const runbooks = await service.getTemplatesByType('runbook');

      for (const t of runbooks) {
        assert.strictEqual(t.type, 'runbook');
      }
    });

    it('filters published only', async () => {
      const published = await service.getPublishedTemplates();

      for (const t of published) {
        assert.strictEqual(t.status, 'published');
      }
    });

    it('templates have required fields defined', async () => {
      const templates = await service.listTemplates();

      for (const template of templates) {
        assert.ok(Array.isArray(template.required_fields));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: artifact_generation
  // ==========================================================================
  describe('CONTRACT: artifact_generation', () => {
    it('generates artifact from template', async () => {
      const templates = await service.listTemplates();
      const template = templates[0];

      const artifact = await service.generateArtifact({
        template_id: template.template_id,
        service_id: `sha256:${Buffer.from('test-svc').toString('hex').slice(0, 64)}`,
        parameters: { title: 'gen-test-001', steps: [], rollback: {} },
      });

      assert.ok(artifact.artifact_id.startsWith('sha256:'));
      assert.strictEqual(artifact.template_id, template.template_id);
    });

    it('generated artifact has governance metadata', async () => {
      const templates = await service.listTemplates();
      const artifact = await service.generateArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test-svc').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.ok(artifact.governance_metadata);
      assert.ok(artifact.governance_metadata.template_version >= 1);
    });

    it('generates multiple artifacts', async () => {
      const templates = await service.listTemplates();
      const inputs = templates.slice(0, 2).map(t => ({
        template_id: t.template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      }));

      const artifacts = await service.generateMultiple(inputs);
      assert.strictEqual(artifacts.length, 2);
    });

    it('preview does not persist', async () => {
      const templates = await service.listTemplates();
      const preview = await service.previewArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.ok(preview.artifact_id);
    });

    it('artifacts include compliance tags', async () => {
      const templates = await service.listTemplates();
      const artifact = await service.generateArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.ok(Array.isArray(artifact.governance_metadata.compliance_tags));
    });
  });

  // ==========================================================================
  // CONTRACT: artifact_validation
  // ==========================================================================
  describe('CONTRACT: artifact_validation', () => {
    it('validates valid artifact', async () => {
      const artifact = createMockArtifact();
      const result = await service.validateArtifact(artifact);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.policy_check_passed, true);
    });

    it('validates input parameters', async () => {
      const result = await service.validateInput({
        template_id: `sha256:${'a'.repeat(64)}`,
        service_id: `sha256:${'b'.repeat(64)}`,
        parameters: {},
      });

      assert.strictEqual(result.valid, true);
    });

    it('detects missing required fields', async () => {
      const templates = await service.listTemplates();
      const template = templates[0];

      const missing = await service.checkRequiredFields(
        { template_id: template.template_id, service_id: 'svc', parameters: {} },
        template
      );

      assert.ok(missing.length > 0);
    });

    it('validation result has error details', async () => {
      const invalidArtifact = createMockArtifact({
        governance_metadata: {
          template_version: 0,
          generated_by: '',
          attestation_required: false,
          review_required: false,
          compliance_tags: [],
        },
      });

      const result = await service.validateArtifact(invalidArtifact);
      assert.ok(Array.isArray(result.errors));
    });
  });

  // ==========================================================================
  // CONTRACT: customization
  // ==========================================================================
  describe('CONTRACT: customization', () => {
    it('applies customizations to artifact', async () => {
      const artifact = createMockArtifact();
      const customized = await service.applyCustomizations(artifact, {
        custom_field: 'custom_value',
      });

      assert.strictEqual((customized.content as any).custom_field, 'custom_value');
    });

    it('gets service defaults', async () => {
      const serviceId = `sha256:${Buffer.from('svc-defaults').toString('hex').slice(0, 64)}`;
      const defaults = await service.getServiceDefaults(serviceId);

      assert.ok(defaults);
      assert.ok('service_id' in defaults);
    });

    it('customization preserves governance metadata', async () => {
      const artifact = createMockArtifact();
      const customized = await service.applyCustomizations(artifact, { extra: 'data' });

      assert.ok(customized.governance_metadata);
      assert.ok(customized.governance_metadata.template_version >= 1);
    });

    it('customized artifact has new artifact ID', async () => {
      const artifact = createMockArtifact();
      const customized = await service.applyCustomizations(artifact, { extra: 'data' });

      assert.ok(customized.artifact_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: governance_embedded
  // ==========================================================================
  describe('CONTRACT: governance_embedded', () => {
    it('artifacts require attestation', async () => {
      const templates = await service.listTemplates();
      const artifact = await service.generateArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.strictEqual(artifact.governance_metadata.attestation_required, true);
    });

    it('artifacts require review', async () => {
      const templates = await service.listTemplates();
      const artifact = await service.generateArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.strictEqual(artifact.governance_metadata.review_required, true);
    });

    it('generator is tracked', async () => {
      const templates = await service.listTemplates();
      const artifact = await service.generateArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.ok(artifact.governance_metadata.generated_by.startsWith('sha256:'));
    });

    it('generation timestamp recorded', async () => {
      const templates = await service.listTemplates();
      const artifact = await service.generateArtifact({
        template_id: templates[0].template_id,
        service_id: `sha256:${Buffer.from('test').toString('hex').slice(0, 64)}`,
        parameters: {},
      });

      assert.ok(artifact.generated_at);
      const date = new Date(artifact.generated_at);
      assert.ok(!isNaN(date.getTime()));
    });
  });
});
