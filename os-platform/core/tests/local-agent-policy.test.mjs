import assert from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentPermissionPolicy;
let loadFounderLocalAgentPolicy;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;

  LocalAgentPermissionPolicy = pilot.LocalAgentPermissionPolicy;
  loadFounderLocalAgentPolicy = pilot.loadFounderLocalAgentPolicy;
});

describe('Local agent permission policy', () => {
  it('allows normal reads inside the workspace', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-policy-'));

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);
      const decision = policy.decide({
        tool: 'read_file',
        action: 'read',
        target: 'src/App.tsx',
        payload: {},
      });

      assert.equal(decision.decision, 'allow');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('denies .env reads', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-policy-'));

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);
      const decision = policy.decide({
        tool: 'read_file',
        action: 'read',
        target: '.env',
        payload: {},
      });

      assert.equal(decision.decision, 'deny');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('asks before normal writes', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-policy-'));

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);
      const decision = policy.decide({
        tool: 'write_file',
        action: 'write',
        target: 'src/App.tsx',
        payload: {},
      });

      assert.equal(decision.decision, 'ask');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('allows the governed type-check command', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-policy-'));

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);
      const decision = policy.decide({
        tool: 'run_command',
        action: 'command',
        target: 'pnpm run type-check',
        payload: {},
      });

      assert.equal(decision.decision, 'allow');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('denies git push', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-policy-'));

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);
      const decision = policy.decide({
        tool: 'run_command',
        action: 'command',
        target: 'git push origin main',
        payload: {},
      });

      assert.equal(decision.decision, 'deny');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('blocks workspace escapes', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-policy-'));

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);

      assert.throws(() => {
        policy.decide({
          tool: 'read_file',
          action: 'read',
          target: '../outside.txt',
          payload: {},
        });
      }, /Path escapes workspace/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});