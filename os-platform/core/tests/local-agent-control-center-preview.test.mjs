import assert from 'node:assert';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentControlCenterPreview;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentControlCenterPreview = pilot.LocalAgentControlCenterPreview;
});

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function writeState(root, payload) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/control-center-state.json'), JSON.stringify(payload), 'utf8');
}

function sampleState() {
  return {
    createdAt: 1,
    version: '0.1.0',
    policy: {
      available: true,
      profile: 'founder',
      source: 'active-policy.json',
      purpose: 'Build TerraFusion OS.',
      cloudAllowed: false,
      privateLanAllowed: false,
      modelEndpoint: 'http://127.0.0.1:8008/v1',
      warning: null,
    },
    doctor: {
      available: true,
      overallStatus: 'warn',
      criticalFailures: 0,
      warnings: 3,
      path: '.terrafusion/doctor-report.json',
    },
    model: {
      available: true,
      healthy: false,
      endpoint: 'http://127.0.0.1:8008/v1',
      model: 'local-coder',
      startupMode: 'manual-founder',
      warnings: ['Local model endpoint is unavailable.'],
      path: '.terrafusion/model-runtime-status.json',
    },
    artifacts: {
      activePolicy: true,
      commandRegistry: true,
      controlCenterState: true,
      currentWorkCard: false,
      patchPreview: false,
      proofResults: false,
      saveState: false,
      finalReport: false,
      doctorReport: true,
      modelRuntimeStatus: true,
    },
    nextCommand: 'pnpm run tf:local-agent -- start',
    nextReason: 'No locked work card exists. The founder cockpit is the safest way to pick up or start a bounded slice.',
    actions: [
      {
        id: 'doctor',
        label: 'Run Doctor',
        command: 'pnpm run tf:local-agent -- proof',
        group: 'Validation',
        enabled: true,
        reason: 'Available under current local state.',
        beginnerSafe: true,
        mutatesState: true,
      },
      {
        id: 'proof',
        label: 'Run Proof Gates',
        command: 'pnpm run tf:local-agent -- proof',
        group: 'Validation',
        enabled: false,
        reason: 'Locked work card required.',
        beginnerSafe: true,
        mutatesState: true,
      },
      {
        id: 'next',
        label: 'Recommend Next Step',
        command: 'pnpm run tf:local-agent -- next',
        group: 'Guidance',
        enabled: true,
        reason: 'Available under current local state.',
        beginnerSafe: true,
        mutatesState: false,
      },
    ],
    commandCount: 10,
    commandGroups: ['Guidance', 'Validation'],
    commandRegistryPath: '.terrafusion/command-registry.json',
    notes: ['Control Center state generated locally.'],
  };
}

describe('Local agent control center preview', () => {
  it('renders dashboard-like terminal output from control-center-state', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-preview-'));

    try {
      writeState(root, sampleState());
      const output = new LocalAgentControlCenterPreview(root).render();
      assert.match(output, /TerraFusion Control Center/);
      assert.match(output, /Policy: founder/);
      assert.match(output, /Doctor: warn/);
      assert.match(output, /Model:  unavailable/);
      assert.match(output, /\[enabled\] Run Doctor/);
      assert.match(output, /\[disabled\] Run Proof Gates/);
      assert.match(output, /Locked work card required/);
      assert.match(output, /- activePolicy: yes/);
      assert.match(output, /Authority Boundary/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails safely when state is missing or corrupted', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-preview-'));

    try {
      assert.throws(
        () => new LocalAgentControlCenterPreview(root).render(),
        /control-center-state\.json is missing/i,
      );

      mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
      writeFileSync(resolve(root, '.terrafusion/control-center-state.json'), '{bad json', 'utf8');
      assert.throws(
        () => new LocalAgentControlCenterPreview(root).render(),
        /control-center-state\.json is corrupted/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails safely for malformed actions without mutating files', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-preview-'));

    try {
      writeState(root, { ...sampleState(), actions: [{ id: 'doctor' }] });
      const before = readFileSync(resolve(root, '.terrafusion/control-center-state.json'), 'utf8');
      assert.throws(
        () => new LocalAgentControlCenterPreview(root).render(),
        /action missing fields/i,
      );
      const after = readFileSync(resolve(root, '.terrafusion/control-center-state.json'), 'utf8');
      assert.equal(after, before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the control-center-preview CLI command', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-preview-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      writeState(root, sampleState());
      const result = runCli(root, 'control-center-preview');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /TerraFusion Control Center/);
      assert.match(result.stdout, /Recommend Next Step/);

      rmSync(resolve(root, '.terrafusion'), { recursive: true, force: true });
      const missing = runCli(root, 'control-center-preview');
      assert.equal(missing.status, 2);
      assert.match(missing.stderr || missing.stdout, /control-center-state\.json is missing/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});