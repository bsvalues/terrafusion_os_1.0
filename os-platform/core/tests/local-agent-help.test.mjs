import assert from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentHelpSystem;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentHelpSystem = pilot.LocalAgentHelpSystem;
});

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Local agent help system', () => {
  it('prints founder-safe workflows and explanations', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-help-'));

    try {
      const help = new LocalAgentHelpSystem(root);
      assert.match(help.helpMe(), /Prometheus is the internal codename/);
      assert.match(help.helpMe(), /--repo-root <path>/);
      assert.match(help.helpMe(), /start/);
      assert.match(help.helpMe(), /command-registry/);
      assert.match(help.helpMe(), /release-freeze/);
      assert.match(help.explainCommands(), /Patch Control/);
      assert.match(help.explainCommands(), /release-freeze/);
      assert.match(help.explainCommands(), /Global option: --repo-root <path>/);
      assert.match(help.explainCommands(), /Help does not mutate/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('recommends start when no locked card exists', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-help-'));

    try {
      const recommendation = new LocalAgentHelpSystem(root).recommendNext();
      assert.equal(recommendation.command, 'pnpm run tf:local-agent -- start');
      assert.match(recommendation.reason, /No locked work card/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('recommends proof, save-state, finalize, and restart from local artifacts', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-help-'));
    mkdirSync(resolve(root, '.terrafusion'), { recursive: true });

    try {
      writeFileSync(resolve(root, '.terrafusion/current-work-card.json'), '{}', 'utf8');
      let recommendation = new LocalAgentHelpSystem(root).recommendNext();
      assert.equal(recommendation.command, 'pnpm run tf:local-agent -- proof');

      writeFileSync(resolve(root, '.terrafusion/proof-results.json'), '{}', 'utf8');
      recommendation = new LocalAgentHelpSystem(root).recommendNext();
      assert.match(recommendation.command, /save-state/);

      writeFileSync(resolve(root, '.terrafusion/save-state.md'), '# Save State\n', 'utf8');
      recommendation = new LocalAgentHelpSystem(root).recommendNext();
      assert.equal(recommendation.command, 'pnpm run tf:local-agent -- finalize');

      writeFileSync(resolve(root, '.terrafusion/final-report.json'), '{}', 'utf8');
      recommendation = new LocalAgentHelpSystem(root).recommendNext();
      assert.equal(recommendation.command, 'pnpm run tf:local-agent -- start');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the help CLI commands', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-help-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const help = runCli(root, 'help-me');
      assert.equal(help.status, 0);
      assert.match(help.stdout, /TerraFusion Local Agent Help/);

      const next = runCli(root, 'next');
      assert.equal(next.status, 0);
      assert.match(next.stdout, /Recommended Next Command/);

      const explain = runCli(root, 'explain-commands');
      assert.equal(explain.status, 0);
      assert.match(explain.stdout, /Command Map/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});