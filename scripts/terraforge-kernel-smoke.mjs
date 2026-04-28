#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exe = process.platform === 'win32' ? '.exe' : '';
const releaseDir = join(repoRoot, 'packages', 'terrabuild', 'kernels', 'target', 'release');
const costKernel = join(releaseDir, `terraforge-kernel-cost${exe}`);
const valuationKernel = join(releaseDir, `terraforge-kernel-valuation${exe}`);

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function runKernel(path, invocation) {
  if (!existsSync(path)) {
    throw new Error(`Kernel binary not found: ${path}`);
  }

  const result = spawnSync(path, {
    input: JSON.stringify(invocation),
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10_000,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Kernel exited ${result.status}: ${result.stderr}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    throw new Error(`Kernel emitted invalid JSON: ${err.message}\nstdout=${result.stdout}`);
  }
}

function assertClose(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.000001) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertAudit(resp, module) {
  if (!resp.success) {
    throw new Error(`${module} failed: ${resp.error ?? 'unknown error'}`);
  }
  if (resp.auditEvent?.module !== module) {
    throw new Error(`${module}: audit module missing or wrong`);
  }
  if (!/^git:[0-9a-f]{7,40}$/i.test(resp.auditEvent?.hash ?? '')) {
    throw new Error(`${module}: audit hash is not a git:<sha> provenance value`);
  }
}

const costInvocation = {
  contractPackVersion: '1.0.0',
  moduleApiVersion: '1.0.0',
  requestId: 'kernel-smoke-cost',
  action: 'calculate_cost',
  payload: {
    subject: {
      parcelId: 'KERNEL-SMOKE-001',
      attributes: { sqft: 1600, quality: 'STANDARD', condition: 'AVERAGE' },
    },
    tables: {
      baseRate: 105.05,
      modifiers: { STANDARD: 1, AVERAGE: 1, DepreciationRate: 0.1 },
    },
  },
};

const cost = runKernel(costKernel, costInvocation);
assertAudit(cost, 'terraforge.kernel.cost');
assertClose(cost.data.replacementCost, 168080, 'cost.replacementCost');
assertClose(cost.data.depreciation, 16808, 'cost.depreciation');
assertClose(cost.data.rcnld, 151272, 'cost.rcnld');

const valuationInvocation = {
  contractPackVersion: '1.0.0',
  moduleApiVersion: '1.0.0',
  requestId: 'kernel-smoke-valuation',
  action: 'valuate',
  payload: {
    subject: { parcelId: 'KERNEL-SMOKE-001', attributes: {} },
    costBreakdown: cost.data,
    model: {
      landValue: 52563.6,
      adjustmentFactors: null,
    },
  },
};

const valuation = runKernel(valuationKernel, valuationInvocation);
assertAudit(valuation, 'terraforge.kernel.valuation');
assertClose(valuation.data.components.building, 151272, 'valuation.components.building');
assertClose(valuation.data.totalValue, 203835.6, 'valuation.totalValue');

const proof = {
  ok: true,
  cost: {
    rcnld: cost.data.rcnld,
    sourceRevision: cost.auditEvent.hash,
    binarySha256: sha256(costKernel),
  },
  valuation: {
    totalValue: valuation.data.totalValue,
    sourceRevision: valuation.auditEvent.hash,
    binarySha256: sha256(valuationKernel),
  },
};

console.log(JSON.stringify(proof, null, 2));
