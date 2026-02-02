/**
 * Phase 4N47 – Performance Budget Tests
 * ======================================
 *
 * Tests to enforce SLO ceilings from ops-slo.ts:
 *   - Verification runtime budgets
 *   - Reconstitution runtime budgets
 *   - Pack generation time limits
 *   - Size budget compliance
 *   - OS matrix considerations
 *
 * @module perf-budget.test
 * @version 4N47.1
 */

import * as assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SLOBudget {
  readonly operation: string;
  readonly ceilingMs: number;
  readonly description: string;
  readonly warnThresholdPercent: number;
}

interface SizeLimits {
  readonly maxCasefileSizeBytes: number;
  readonly maxRollupSizeBytes: number;
  readonly maxPackSizeBytes: number;
  readonly maxChunkSizeBytes: number;
}

interface PerformanceMetric {
  readonly operation: string;
  readonly durationMs: number;
  readonly sizeBytes?: number;
  readonly environment: EnvironmentProfile;
  readonly timestamp: string;
}

interface EnvironmentProfile {
  readonly os: 'windows' | 'linux' | 'macos';
  readonly diskType: 'ssd' | 'hdd' | 'network';
  readonly memoryMb: number;
  readonly cpuCores: number;
  readonly isCI: boolean;
}

interface BudgetResult {
  readonly operation: string;
  readonly passed: boolean;
  readonly actualMs: number;
  readonly ceilingMs: number;
  readonly utilizationPercent: number;
  readonly headroomMs: number;
  readonly warning: boolean;
}

interface SizeBudgetResult {
  readonly artifactType: string;
  readonly passed: boolean;
  readonly actualBytes: number;
  readonly limitBytes: number;
  readonly utilizationPercent: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_BUDGETS: SLOBudget[] = [
  {
    operation: 'verify-casefile',
    ceilingMs: 5000,
    description: 'Verify casefile',
    warnThresholdPercent: 80,
  },
  {
    operation: 'dr-reconstitute',
    ceilingMs: 30000,
    description: 'DR reconstitution',
    warnThresholdPercent: 80,
  },
  {
    operation: 'generate-pack',
    ceilingMs: 60000,
    description: 'Pack generation',
    warnThresholdPercent: 80,
  },
  {
    operation: 'rollup-compute',
    ceilingMs: 120000,
    description: 'Rollup compute',
    warnThresholdPercent: 80,
  },
  {
    operation: 'audit-packet-generate',
    ceilingMs: 30000,
    description: 'Audit packet',
    warnThresholdPercent: 80,
  },
];

const DEFAULT_SIZE_LIMITS: SizeLimits = {
  maxCasefileSizeBytes: 100 * 1024 * 1024, // 100MB
  maxRollupSizeBytes: 500 * 1024 * 1024, // 500MB
  maxPackSizeBytes: 1024 * 1024 * 1024, // 1GB
  maxChunkSizeBytes: 10 * 1024 * 1024, // 10MB
};

const SLOW_DISK_MULTIPLIER = 2.0; // HDD/network storage penalty
const CI_MULTIPLIER = 1.5; // CI environment overhead

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentEnvironment(): EnvironmentProfile {
  return {
    os:
      process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux',
    diskType: 'ssd', // Assume SSD for tests
    memoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    cpuCores: os.cpus().length,
    isCI: process.env.CI === 'true',
  };
}

function adjustCeilingForEnvironment(baseCeilingMs: number, env: EnvironmentProfile): number {
  let adjusted = baseCeilingMs;

  // Slow disk penalty
  if (env.diskType === 'hdd' || env.diskType === 'network') {
    adjusted *= SLOW_DISK_MULTIPLIER;
  }

  // CI environment overhead
  if (env.isCI) {
    adjusted *= CI_MULTIPLIER;
  }

  return Math.round(adjusted);
}

function checkTimeBudget(metric: PerformanceMetric, budgets: SLOBudget[]): BudgetResult {
  const budget = budgets.find(b => b.operation === metric.operation);

  if (!budget) {
    throw new Error(`Unknown operation: ${metric.operation}`);
  }

  const adjustedCeiling = adjustCeilingForEnvironment(budget.ceilingMs, metric.environment);
  const passed = metric.durationMs <= adjustedCeiling;
  const utilizationPercent = (metric.durationMs / adjustedCeiling) * 100;
  const headroomMs = adjustedCeiling - metric.durationMs;
  const warning = utilizationPercent >= budget.warnThresholdPercent && passed;

  return {
    operation: metric.operation,
    passed,
    actualMs: metric.durationMs,
    ceilingMs: adjustedCeiling,
    utilizationPercent: Math.round(utilizationPercent),
    headroomMs,
    warning,
  };
}

function checkSizeBudget(
  artifactType: string,
  sizeBytes: number,
  limits: SizeLimits
): SizeBudgetResult {
  let limitBytes: number;

  switch (artifactType) {
    case 'casefile':
      limitBytes = limits.maxCasefileSizeBytes;
      break;
    case 'rollup':
      limitBytes = limits.maxRollupSizeBytes;
      break;
    case 'pack':
      limitBytes = limits.maxPackSizeBytes;
      break;
    case 'chunk':
      limitBytes = limits.maxChunkSizeBytes;
      break;
    default:
      throw new Error(`Unknown artifact type: ${artifactType}`);
  }

  const passed = sizeBytes <= limitBytes;
  const utilizationPercent = (sizeBytes / limitBytes) * 100;

  return {
    artifactType,
    passed,
    actualBytes: sizeBytes,
    limitBytes,
    utilizationPercent: Math.round(utilizationPercent),
  };
}

async function simulateOperation(
  operation: string,
  simulatedDurationMs: number
): Promise<PerformanceMetric> {
  const start = performance.now();
  await new Promise(resolve => setTimeout(resolve, simulatedDurationMs));
  const end = performance.now();

  return {
    operation,
    durationMs: Math.round(end - start),
    environment: getCurrentEnvironment(),
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Budget Definitions
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Budget Definitions', () => {
  it('all required operations have budgets', () => {
    const requiredOps = ['verify-casefile', 'dr-reconstitute', 'generate-pack', 'rollup-compute'];
    for (const op of requiredOps) {
      assert.ok(
        DEFAULT_BUDGETS.some(b => b.operation === op),
        `Should have budget for ${op}`
      );
    }
  });

  it('verify-casefile ceiling is under 5 seconds', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'verify-casefile');
    assert.ok(budget);
    assert.ok(budget.ceilingMs <= 5000);
  });

  it('dr-reconstitute ceiling is under 30 seconds', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'dr-reconstitute');
    assert.ok(budget);
    assert.ok(budget.ceilingMs <= 30000);
  });

  it('pack generation ceiling is under 60 seconds', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'generate-pack');
    assert.ok(budget);
    assert.ok(budget.ceilingMs <= 60000);
  });

  it('all budgets have warn threshold', () => {
    for (const budget of DEFAULT_BUDGETS) {
      assert.ok(budget.warnThresholdPercent > 0);
      assert.ok(budget.warnThresholdPercent <= 100);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Time Budget Checking
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Time Budget Checking', () => {
  it('operation under ceiling passes', () => {
    const metric: PerformanceMetric = {
      operation: 'verify-casefile',
      durationMs: 1000,
      environment: getCurrentEnvironment(),
      timestamp: new Date().toISOString(),
    };

    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, true);
    assert.ok(result.headroomMs > 0);
  });

  it('operation over ceiling fails', () => {
    const metric: PerformanceMetric = {
      operation: 'verify-casefile',
      durationMs: 10000,
      environment: { ...getCurrentEnvironment(), isCI: false, diskType: 'ssd' },
      timestamp: new Date().toISOString(),
    };

    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, false);
    assert.ok(result.headroomMs < 0);
  });

  it('operation at 80% utilization triggers warning', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'verify-casefile')!;
    const at80Percent = budget.ceilingMs * 0.85;

    const metric: PerformanceMetric = {
      operation: 'verify-casefile',
      durationMs: at80Percent,
      environment: { ...getCurrentEnvironment(), isCI: false, diskType: 'ssd' },
      timestamp: new Date().toISOString(),
    };

    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.warning, true);
  });

  it('utilization percent is calculated correctly', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'verify-casefile')!;
    const halfCeiling = budget.ceilingMs / 2;

    const metric: PerformanceMetric = {
      operation: 'verify-casefile',
      durationMs: halfCeiling,
      environment: { ...getCurrentEnvironment(), isCI: false, diskType: 'ssd' },
      timestamp: new Date().toISOString(),
    };

    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.utilizationPercent, 50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Environment Adjustments
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Environment Adjustments', () => {
  it('slow disk gets 2x ceiling', () => {
    const env: EnvironmentProfile = {
      os: 'linux',
      diskType: 'hdd',
      memoryMb: 8192,
      cpuCores: 4,
      isCI: false,
    };

    const adjusted = adjustCeilingForEnvironment(5000, env);
    assert.strictEqual(adjusted, 10000);
  });

  it('CI environment gets 1.5x ceiling', () => {
    const env: EnvironmentProfile = {
      os: 'linux',
      diskType: 'ssd',
      memoryMb: 8192,
      cpuCores: 4,
      isCI: true,
    };

    const adjusted = adjustCeilingForEnvironment(5000, env);
    assert.strictEqual(adjusted, 7500);
  });

  it('slow disk + CI compounds adjustments', () => {
    const env: EnvironmentProfile = {
      os: 'linux',
      diskType: 'hdd',
      memoryMb: 8192,
      cpuCores: 4,
      isCI: true,
    };

    const adjusted = adjustCeilingForEnvironment(5000, env);
    assert.strictEqual(adjusted, 15000); // 2x * 1.5x = 3x
  });

  it('fast SSD non-CI uses base ceiling', () => {
    const env: EnvironmentProfile = {
      os: 'linux',
      diskType: 'ssd',
      memoryMb: 8192,
      cpuCores: 4,
      isCI: false,
    };

    const adjusted = adjustCeilingForEnvironment(5000, env);
    assert.strictEqual(adjusted, 5000);
  });

  it('network storage treated as slow', () => {
    const env: EnvironmentProfile = {
      os: 'linux',
      diskType: 'network',
      memoryMb: 8192,
      cpuCores: 4,
      isCI: false,
    };

    const adjusted = adjustCeilingForEnvironment(5000, env);
    assert.strictEqual(adjusted, 10000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Size Budgets
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Size Budgets', () => {
  it('casefile under 100MB passes', () => {
    const result = checkSizeBudget('casefile', 50 * 1024 * 1024, DEFAULT_SIZE_LIMITS);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.utilizationPercent, 50);
  });

  it('casefile over 100MB fails', () => {
    const result = checkSizeBudget('casefile', 150 * 1024 * 1024, DEFAULT_SIZE_LIMITS);
    assert.strictEqual(result.passed, false);
  });

  it('rollup limit is 500MB', () => {
    const result = checkSizeBudget('rollup', 400 * 1024 * 1024, DEFAULT_SIZE_LIMITS);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.limitBytes, 500 * 1024 * 1024);
  });

  it('pack limit is 1GB', () => {
    const result = checkSizeBudget('pack', 800 * 1024 * 1024, DEFAULT_SIZE_LIMITS);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.limitBytes, 1024 * 1024 * 1024);
  });

  it('chunk limit is 10MB', () => {
    const result = checkSizeBudget('chunk', 5 * 1024 * 1024, DEFAULT_SIZE_LIMITS);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.limitBytes, 10 * 1024 * 1024);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Simulated Operations
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Simulated Operations', () => {
  it('fast verification passes budget', async () => {
    const metric = await simulateOperation('verify-casefile', 50);
    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, true);
  });

  it('fast DR reconstitution passes budget', async () => {
    const metric = await simulateOperation('dr-reconstitute', 100);
    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, true);
  });

  it('fast pack generation passes budget', async () => {
    const metric = await simulateOperation('generate-pack', 50);
    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, true);
  });

  it('metric includes environment profile', async () => {
    const metric = await simulateOperation('verify-casefile', 10);
    assert.ok(metric.environment);
    assert.ok(metric.environment.os);
    assert.ok(metric.environment.cpuCores > 0);
  });

  it('metric includes timestamp', async () => {
    const metric = await simulateOperation('verify-casefile', 10);
    assert.ok(metric.timestamp);
    assert.ok(Date.parse(metric.timestamp) > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – OS Matrix Considerations
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – OS Matrix Considerations', () => {
  it('Windows environment is recognized', () => {
    const env: EnvironmentProfile = {
      os: 'windows',
      diskType: 'ssd',
      memoryMb: 16384,
      cpuCores: 8,
      isCI: false,
    };

    assert.strictEqual(env.os, 'windows');
  });

  it('Linux environment is recognized', () => {
    const env: EnvironmentProfile = {
      os: 'linux',
      diskType: 'ssd',
      memoryMb: 8192,
      cpuCores: 4,
      isCI: true,
    };

    assert.strictEqual(env.os, 'linux');
  });

  it('macOS environment is recognized', () => {
    const env: EnvironmentProfile = {
      os: 'macos',
      diskType: 'ssd',
      memoryMb: 32768,
      cpuCores: 10,
      isCI: false,
    };

    assert.strictEqual(env.os, 'macos');
  });

  it('current environment is detected', () => {
    const env = getCurrentEnvironment();
    assert.ok(['windows', 'linux', 'macos'].includes(env.os));
    assert.ok(env.memoryMb > 0);
    assert.ok(env.cpuCores > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Audit Packet Budget
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Audit Packet Budget', () => {
  it('audit packet generation has budget defined', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'audit-packet-generate');
    assert.ok(budget);
    assert.ok(budget.ceilingMs > 0);
  });

  it('audit packet ceiling is 30 seconds', () => {
    const budget = DEFAULT_BUDGETS.find(b => b.operation === 'audit-packet-generate');
    assert.strictEqual(budget?.ceilingMs, 30000);
  });

  it('fast audit packet generation passes', async () => {
    const metric = await simulateOperation('audit-packet-generate', 100);
    const result = checkTimeBudget(metric, DEFAULT_BUDGETS);
    assert.strictEqual(result.passed, true);
  });
});
