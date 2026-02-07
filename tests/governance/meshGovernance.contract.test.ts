import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const MESH_DIR = path.join(ROOT_DIR, '.governance', 'mesh');
const AGENT_ENTRYPOINT_PATH = path.join(ROOT_DIR, '.github', 'AGENT_ENTRYPOINT.md');

describe('Mesh Governance Contract', () => {
  describe('Specification Files', () => {
    const requiredFiles = [
      'MESH_GOVERNANCE.md',
      'message-schema.json',
      'roles.md',
      'conflict-resolution.md',
      'mesh-config.schema.json',
    ];

    it.each(requiredFiles)('must have %s', file => {
      const filePath = path.join(MESH_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Message Schema', () => {
    it('must define required message types', () => {
      const schemaPath = path.join(MESH_DIR, 'message-schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      const typeEnum = schema.properties.type.enum;
      expect(typeEnum).toContain('REQUEST');
      expect(typeEnum).toContain('PROPOSAL');
      expect(typeEnum).toContain('DECISION');
      expect(typeEnum).toContain('CONFLICT');
      expect(typeEnum).toContain('BLOCKER');
      expect(typeEnum).toContain('FYI');
      expect(typeEnum).toContain('SYNC');
    });

    it('must define role constraints', () => {
      const schemaPath = path.join(MESH_DIR, 'message-schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      const roleEnum = schema.properties.from_role.enum;
      expect(roleEnum).toContain('integrator');
      expect(roleEnum).toContain('researcher');
      expect(roleEnum).toContain('builder');
      expect(roleEnum).toContain('reviewer');
    });

    it('must define channel namespaces', () => {
      const schemaPath = path.join(MESH_DIR, 'message-schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      const channelEnum = schema.properties.channel.enum;
      expect(channelEnum).toContain('#discovery');
      expect(channelEnum).toContain('#research');
      expect(channelEnum).toContain('#architecture');
      expect(channelEnum).toContain('#build');
      expect(channelEnum).toContain('#qa');
      expect(channelEnum).toContain('#decisions');
    });

    it('must require doc_targets for DECISION type', () => {
      const schemaPath = path.join(MESH_DIR, 'message-schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      // Find the allOf constraint for DECISION
      const decisionConstraint = schema.allOf.find(
        (rule: Record<string, unknown>) => rule.if?.properties?.type?.const === 'DECISION'
      );
      expect(decisionConstraint).toBeDefined();
      expect(decisionConstraint.then.required).toContain('doc_targets');
      expect(decisionConstraint.then.required).toContain('rationale');
    });

    it('must restrict DECISION to integrator role', () => {
      const schemaPath = path.join(MESH_DIR, 'message-schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      const decisionConstraint = schema.allOf.find(
        (rule: Record<string, unknown>) => rule.if?.properties?.type?.const === 'DECISION'
      );
      expect(decisionConstraint.then.properties.from_role.const).toBe('integrator');
    });
  });

  describe('Roles Document', () => {
    it('must define all four roles', () => {
      const rolesPath = path.join(MESH_DIR, 'roles.md');
      const content = fs.readFileSync(rolesPath, 'utf-8');

      expect(content).toContain('### Integrator');
      expect(content).toContain('### Researcher');
      expect(content).toContain('### Builder');
      expect(content).toContain('### Reviewer');
    });

    it('must specify Integrator as merge authority', () => {
      const rolesPath = path.join(MESH_DIR, 'roles.md');
      const content = fs.readFileSync(rolesPath, 'utf-8');

      expect(content).toMatch(/integrator.*merge.*authority/i);
    });

    it('must include permission matrix', () => {
      const rolesPath = path.join(MESH_DIR, 'roles.md');
      const content = fs.readFileSync(rolesPath, 'utf-8');

      expect(content).toContain('Permission Matrix');
    });
  });

  describe('Conflict Resolution', () => {
    it('must define decision rubric', () => {
      const conflictPath = path.join(MESH_DIR, 'conflict-resolution.md');
      const content = fs.readFileSync(conflictPath, 'utf-8');

      expect(content).toContain('Decision Rubric');
      expect(content).toContain('Correctness');
      expect(content).toContain('Security');
      expect(content).toContain('Simplicity');
    });

    it('must require acknowledgment', () => {
      const conflictPath = path.join(MESH_DIR, 'conflict-resolution.md');
      const content = fs.readFileSync(conflictPath, 'utf-8');

      expect(content).toContain('Acknowledgment');
    });

    it('must define resolution timeline', () => {
      const conflictPath = path.join(MESH_DIR, 'conflict-resolution.md');
      const content = fs.readFileSync(conflictPath, 'utf-8');

      expect(content).toContain('Resolution Timeline');
      expect(content).toContain('cycle');
    });
  });

  describe('Configuration Schema', () => {
    it('must define mesh enable toggle', () => {
      const configPath = path.join(MESH_DIR, 'mesh-config.schema.json');
      const schema = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(schema.properties['terrafusion.agent.mesh.enabled']).toBeDefined();
      expect(schema.properties['terrafusion.agent.mesh.enabled'].default).toBe(false);
    });

    it('must define rate limiting', () => {
      const configPath = path.join(MESH_DIR, 'mesh-config.schema.json');
      const schema = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(schema.properties['terrafusion.agent.mesh.rateLimit']).toBeDefined();
      expect(schema.properties['terrafusion.agent.mesh.rateLimit'].default).toBe(5);
    });

    it('must define redaction settings', () => {
      const configPath = path.join(MESH_DIR, 'mesh-config.schema.json');
      const schema = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(schema.properties['terrafusion.agent.mesh.redaction.enabled']).toBeDefined();
      expect(schema.properties['terrafusion.agent.mesh.redaction.patterns']).toBeDefined();
    });
  });

  describe('Main Specification', () => {
    it('must document activation via environment variable', () => {
      const specPath = path.join(MESH_DIR, 'MESH_GOVERNANCE.md');
      const content = fs.readFileSync(specPath, 'utf-8');

      expect(content).toContain('TF_AGENT_MESH');
    });

    it('must document security policy', () => {
      const specPath = path.join(MESH_DIR, 'MESH_GOVERNANCE.md');
      const content = fs.readFileSync(specPath, 'utf-8');

      expect(content).toContain('Security Policy');
      expect(content).toContain('Prohibited Content');
      expect(content).toContain('Redaction');
    });

    it('must document consensus windows', () => {
      const specPath = path.join(MESH_DIR, 'MESH_GOVERNANCE.md');
      const content = fs.readFileSync(specPath, 'utf-8');

      expect(content).toContain('Consensus Windows');
    });

    it('must document doc-first law', () => {
      const specPath = path.join(MESH_DIR, 'MESH_GOVERNANCE.md');
      const content = fs.readFileSync(specPath, 'utf-8');

      expect(content).toMatch(/doc-first/i);
    });
  });

  describe('Agent Entrypoint Integration', () => {
    it('AGENT_ENTRYPOINT.md must reference mesh governance', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('MESH_GOVERNANCE.md');
    });

    it('AGENT_ENTRYPOINT.md must document mesh activation', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('TF_AGENT_MESH');
    });

    it('AGENT_ENTRYPOINT.md must list message types', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('REQUEST');
      expect(entrypoint).toContain('PROPOSAL');
      expect(entrypoint).toContain('DECISION');
      expect(entrypoint).toContain('CONFLICT');
    });

    it('AGENT_ENTRYPOINT.md must list roles', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('Integrator');
      expect(entrypoint).toContain('Researcher');
      expect(entrypoint).toContain('Builder');
      expect(entrypoint).toContain('Reviewer');
    });
  });
});
