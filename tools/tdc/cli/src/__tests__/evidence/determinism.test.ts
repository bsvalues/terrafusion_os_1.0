/**
 * Evidence Pack Determinism Tests (Phase 7A)
 *
 * CRITICAL GATE: These tests MUST PASS before Phase 8 begins.
 *
 * Purpose: Prove that Evidence Pack generation is deterministic.
 * Requirement: Two consecutive runs on identical source → identical normalized output
 *
 * Why deterministic matters:
 * - CI gates must be reliable (no flaky fails)
 * - Hash-based integrity requires stable output
 * - Cryptographic receipts must be reproducible
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { aggregateEvidencePack } from '../../lib/evidence/aggregate';
import {
    arePacksDeterministicallyEqual,
    normalizeEvidencePack,
} from '../../lib/evidence/normalizer';

describe('Evidence Pack Determinism (Phase 7A)', () => {
  let tempDir: string;
  let contractsDir: string;

  beforeEach(() => {
    // Create temporary test directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-test-'));
    contractsDir = path.join(tempDir, '.terrafusion', 'contracts');
    fs.mkdirSync(contractsDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Determinism: Identical source → identical normalized pack', async () => {
    // Create test contract fixtures
    const testContracts = [
      {
        skillName: 'tf-ui-foundation',
        lane: 'ui',
        status: 'PASS',
        violationsCount: 0,
        executedAt: '2026-02-13T14:30:00Z',
      },
      {
        skillName: 'tf-a11y-508-audit',
        lane: 'ui',
        status: 'PASS',
        violationsCount: 0,
        executedAt: '2026-02-13T14:31:00Z',
      },
    ];

    // Write contract fixtures to disk
    const contractFiles: string[] = [];
    testContracts.forEach((contract, idx) => {
      const filePath = path.join(contractsDir, `contract-${idx}.json`);
      fs.writeFileSync(filePath, JSON.stringify(contract, null, 2), 'utf8');
      contractFiles.push(filePath);
    });

    // Create empty context file
    const contextPath = path.join(tempDir, '.terrafusion', 'context', 'latest.json');
    fs.mkdirSync(path.dirname(contextPath), { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify({ version: '1.0.0' }), 'utf8');

    // Build Evidence Pack TWICE with identical source
    const pack1 = await aggregateEvidencePack({
      contractFiles,
      prNumber: 314,
      branchRef: 'test-branch',
      contextPath,
    });

    // Wait 100ms to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    const pack2 = await aggregateEvidencePack({
      contractFiles,
      prNumber: 314,
      branchRef: 'test-branch',
      contextPath,
    });

    // Normalize both packs (strip volatile fields)
    const normalized1 = normalizeEvidencePack(pack1);
    const normalized2 = normalizeEvidencePack(pack2);

    // ASSERT: Normalized packs MUST be identical
    expect(normalized1.contractVersion).toEqual(normalized2.contractVersion);
    expect(normalized1.overallStatus).toEqual(normalized2.overallStatus);
    expect(normalized1.contracts).toEqual(normalized2.contracts);
    expect(normalized1.lanesAudited).toEqual(normalized2.lanesAudited);
    expect(normalized1.totalViolations).toEqual(normalized2.totalViolations);

    // ASSERT: Deterministic equality helper
    expect(arePacksDeterministicallyEqual(pack1, pack2)).toBe(true);
  });

  test('Determinism: Different source → different normalized pack', async () => {
    // Create first contract set
    const contract1Path = path.join(contractsDir, 'contract-1.json');
    fs.writeFileSync(
      contract1Path,
      JSON.stringify({
        skillName: 'tf-ui-foundation',
        lane: 'ui',
        status: 'PASS',
        violationsCount: 0,
      }),
      'utf8'
    );

    const contextPath = path.join(tempDir, '.terrafusion', 'context', 'latest.json');
    fs.mkdirSync(path.dirname(contextPath), { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify({ version: '1.0.0' }), 'utf8');

    const pack1 = await aggregateEvidencePack({
      contractFiles: [contract1Path],
      contextPath,
    });

    // Modify contract (different status)
    fs.writeFileSync(
      contract1Path,
      JSON.stringify({
        skillName: 'tf-ui-foundation',
        lane: 'ui',
        status: 'FAIL',
        violationsCount: 1,
      }),
      'utf8'
    );

    const pack2 = await aggregateEvidencePack({
      contractFiles: [contract1Path],
      contextPath,
    });

    // ASSERT: Different source → different normalized pack
    expect(arePacksDeterministicallyEqual(pack1, pack2)).toBe(false);
    expect(pack1.overallStatus).toBe('PASS');
    expect(pack2.overallStatus).toBe('FAIL');
  });

  test('Normalization: Strips volatile fields (timestamps, triggeredBy)', () => {
    const pack = {
      contractVersion: '1.0.0',
      generatedAt: '2026-02-13T14:30:00Z', // Volatile (timestamp)
      overallStatus: 'PASS' as const,
      lanesAudited: ['ui'],
      contracts: [
        {
          skillName: 'tf-ui-foundation',
          lane: 'ui',
          status: 'PASS' as const,
          violationsCount: 0,
          artifactPath: '/absolute/path/contract.json', // Volatile (absolute path)
          hash: 'sha256:abc123',
          executedAt: '2026-02-13T14:29:00Z', // Volatile (timestamp)
        },
      ],
      totalViolations: 0,
      contextHash: 'sha256:def456',
      markdownSnippet: 'test',
      metadata: {
        tdcVersion: '1.0.0',
        nodeVersion: 'v20.10.0',
        ciEnvironment: 'local',
        triggeredBy: 'user123', // Volatile (user-specific)
      },
    };

    const normalized = normalizeEvidencePack(pack);

    // ASSERT: Volatile fields stripped
    expect(normalized.generatedAt).toBeUndefined();
    expect(normalized.contracts[0].executedAt).toBeUndefined();
    expect(normalized.metadata?.triggeredBy).toBeUndefined();

    // ASSERT: Stable fields preserved
    expect(normalized.contractVersion).toBe('1.0.0');
    expect(normalized.overallStatus).toBe('PASS');
    expect(normalized.contracts[0].skillName).toBe('tf-ui-foundation');

    // ASSERT: File path normalized (absolute → relative)
    expect(normalized.contracts[0].artifactPath).not.toContain('/absolute/path/');
  });

  test('Contract sorting: Stable ordering by skillName', async () => {
    // Create contracts in random order
    const contracts = [
      { name: 'zeta-skill', lane: 'ui', status: 'PASS', violationsCount: 0 },
      { name: 'alpha-skill', lane: 'security', status: 'PASS', violationsCount: 0 },
      { name: 'mu-skill', lane: 'ops', status: 'PASS', violationsCount: 0 },
    ];

    const contractFiles: string[] = [];
    contracts.forEach((contract, idx) => {
      const filePath = path.join(contractsDir, `contract-${idx}.json`);
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          skillName: contract.name,
          lane: contract.lane,
          status: contract.status,
          violationsCount: contract.violationsCount,
        }),
        'utf8'
      );
      contractFiles.push(filePath);
    });

    const contextPath = path.join(tempDir, '.terrafusion', 'context', 'latest.json');
    fs.mkdirSync(path.dirname(contextPath), { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify({ version: '1.0.0' }), 'utf8');

    const pack = await aggregateEvidencePack({
      contractFiles,
      contextPath,
    });

    const normalized = normalizeEvidencePack(pack);

    // ASSERT: Contracts sorted alphabetically by skillName
    expect(normalized.contracts[0].skillName).toBe('alpha-skill');
    expect(normalized.contracts[1].skillName).toBe('mu-skill');
    expect(normalized.contracts[2].skillName).toBe('zeta-skill');
  });
});
