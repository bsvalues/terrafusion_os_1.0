import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const WORKFLOW_DIR = path.join(ROOT_DIR, '.governance', 'workflow');
const SEAL_GATE_PATH = path.join(ROOT_DIR, 'scripts', 'ci-seal-gate.ps1');
const AGENT_ENTRYPOINT_PATH = path.join(ROOT_DIR, '.github', 'AGENT_ENTRYPOINT.md');

describe('Workflow Governance Contract', () => {
  describe('Template Files', () => {
    const requiredTemplates = [
      'discovery.md',
      'research.md',
      'plan.md',
      'progress.md',
      'README.md',
    ];

    it.each(requiredTemplates)('must have %s template', template => {
      const templatePath = path.join(WORKFLOW_DIR, template);
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('discovery.md must have Q/A section markers', () => {
      const discoveryPath = path.join(WORKFLOW_DIR, 'discovery.md');
      const content = fs.readFileSync(discoveryPath, 'utf-8');
      expect(content).toContain('Q/A Transcript');
      expect(content).toContain('**Q');
      expect(content).toContain('**A');
    });

    it('research.md must have sub-agent sections', () => {
      const researchPath = path.join(WORKFLOW_DIR, 'research.md');
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toContain('Agent A');
      expect(content).toContain('Agent B');
      expect(content).toContain('Verbatim');
    });

    it('plan.md must have DoD and phases', () => {
      const planPath = path.join(WORKFLOW_DIR, 'plan.md');
      const content = fs.readFileSync(planPath, 'utf-8');
      expect(content).toContain('Definition of Done');
      expect(content).toContain('## Phases');
      expect(content).toContain('Risk Register');
    });

    it('progress.md must have commit tracking', () => {
      const progressPath = path.join(WORKFLOW_DIR, 'progress.md');
      const content = fs.readFileSync(progressPath, 'utf-8');
      expect(content).toContain('Commit');
      expect(content).toContain('Status');
      expect(content).toContain('Next Steps');
    });
  });

  describe('SEAL Gate Enforcement', () => {
    it('ci-seal-gate.ps1 must include Gate 8 workflow check', () => {
      const sealGate = fs.readFileSync(SEAL_GATE_PATH, 'utf-8');
      expect(sealGate).toContain('Gate 8: Workflow Governance Artifacts');
      expect(sealGate).toContain('discovery.md');
      expect(sealGate).toContain('research.md');
      expect(sealGate).toContain('plan.md');
      expect(sealGate).toContain('progress.md');
    });

    it('ci-seal-gate.ps1 must require 30 Q/A minimum', () => {
      const sealGate = fs.readFileSync(SEAL_GATE_PATH, 'utf-8');
      expect(sealGate).toContain('30');
      expect(sealGate).toMatch(/minimum\s+30\s+required/i);
    });

    it('ci-seal-gate.ps1 must check for feat/refactor branches', () => {
      const sealGate = fs.readFileSync(SEAL_GATE_PATH, 'utf-8');
      expect(sealGate).toMatch(/feat|feature|refactor|ux/);
      expect(sealGate).toContain('isFeatureBranch');
    });
  });

  describe('Agent Entrypoint Integration', () => {
    it('AGENT_ENTRYPOINT.md must reference workflow governance', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('WORKFLOW GOVERNANCE');
      expect(entrypoint).toContain('.governance/workflow/README.md');
    });

    it('AGENT_ENTRYPOINT.md must mandate 30+ questions', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('30+');
      expect(entrypoint).toMatch(/discovery\s+phase/i);
    });

    it('AGENT_ENTRYPOINT.md must specify workflow sequence', () => {
      const entrypoint = fs.readFileSync(AGENT_ENTRYPOINT_PATH, 'utf-8');
      expect(entrypoint).toContain('Discovery');
      expect(entrypoint).toContain('Research');
      expect(entrypoint).toContain('Plan');
      expect(entrypoint).toContain('Execute');
    });
  });

  describe('README Documentation', () => {
    it('README.md must document enforcement rules', () => {
      const readme = fs.readFileSync(path.join(WORKFLOW_DIR, 'README.md'), 'utf-8');
      expect(readme).toContain('SEAL');
      expect(readme).toContain('enforce');
    });

    it('README.md must document when workflow is required', () => {
      const readme = fs.readFileSync(path.join(WORKFLOW_DIR, 'README.md'), 'utf-8');
      expect(readme).toMatch(/When.*REQUIRED|Required.*paths/i);
    });
  });
});
