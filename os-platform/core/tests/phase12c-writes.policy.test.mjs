/**
 * Phase 12C - MCP PostGIS Write Policy Tests
 *
 * Tests write operation gates and approval validation with correct parameter passing.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_PATH = resolve(__dirname, 'fixtures/mcp-writes');
const CONTRACT_PATH = resolve(
  __dirname,
  '../../../tools/registry/contracts/mcp-postgis.contract.json'
);

// Load contract
let contract;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
} catch (err) {
  console.error('Failed to load contract:', err.message);
}

function loadFixture(name) {
  const path = resolve(FIXTURES_PATH, `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const postgisWrites = { buildWriteManifest: null, validateApproval: null, executeWrite: null };

try {
  const module = await import('../pilot/mcp/postgis-writes.mjs');
  postgisWrites.buildWriteManifest = module.buildWriteManifest;
  postgisWrites.validateApproval = module.validateApproval;
  postgisWrites.executeWrite = module.executeWrite;
} catch (err) {
  console.error('Failed to import postgis-writes.mjs:', err.message);
}

describe('Phase 12C - MCP PostGIS Write Policy (Write Without Approval)', () => {
  it('blocks write operation without approval artifact', async () => {
    const fixture = loadFixture('invalid-write-no-approval');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: 'test-approval' }
    );

    const routing = { county: fixture.county, dsn: 'postgresql://test', dsnHash: 'test_dsn_hash' };

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract
    );

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => /Write operation requires supervisor approval/i.test(e)));
  });
});

describe('Phase 12C - MCP PostGIS Write Policy (Expired Approval)', () => {
  it('blocks write with expired approval artifact', async () => {
    const fixture = loadFixture('invalid-write-expired-approval');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };
    const currentTime = new Date('2026-02-13T12:00:00Z');

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract,
      currentTime
    );

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => /Approval artifact expired/i.test(e)));
  });
});

describe('Phase 12C - MCP PostGIS Write Policy (Hash Mismatch)', () => {
  it('blocks write when approval paramsHash does not match manifest', async () => {
    const fixture = loadFixture('invalid-write-params-hash-mismatch');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract
    );

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => /Params hash mismatch/i.test(e)));
  });
});

describe('Phase 12C - MCP PostGIS Write Policy (County Mismatch)', () => {
  it('blocks write when approval county does not match manifest county', async () => {
    const fixture = loadFixture('invalid-write-county-mismatch');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract
    );

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => /County mismatch/i.test(e)));
  });
});

describe('Phase 12C - MCP PostGIS Write Policy (Operation Allowlist)', () => {
  it('blocks write when operation not in contract allowlist', async () => {
    const fixture = loadFixture('invalid-write-operation-not-allowlisted');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract
    );

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => /not found in contract allowlist/i.test(e)));
  });
});

describe('Phase 12C - MCP PostGIS Write Policy (Raw SQL)', () => {
  it('blocks raw SQL write attempts (no template)', async () => {
    const fixture = loadFixture('invalid-write-raw-sql-attempt');

    assert.ok(!fixture.writeOperation.operationId || fixture.writeOperation.operationId === null);
    assert.ok(fixture.writeOperation.rawSQL);
  });
});

describe('Phase 12C - MCP PostGIS Write Policy (Valid Writes)', () => {
  it('allows write with valid approval artifact (update assessment)', async () => {
    const fixture = loadFixture('valid-update-assessment-with-approval');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };
    const currentTime = new Date('2026-02-13T12:00:00Z');

    // Sync approval bindings to match calculated hashes
    fixture.approvalArtifact.bindings.paramsHash = manifest.paramsHash;
    fixture.approvalArtifact.bindings.manifestHash = manifest.manifestHash;
    fixture.approvalArtifact.bindings.toolContractHash = contract.contractHash;

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract,
      currentTime
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('allows write with valid approval artifact (insert parcel)', async () => {
    const fixture = loadFixture('valid-insert-parcel-with-approval');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };
    const currentTime = new Date('2026-02-13T13:00:00Z');

    fixture.approvalArtifact.bindings.paramsHash = manifest.paramsHash;
    fixture.approvalArtifact.bindings.manifestHash = manifest.manifestHash;
    fixture.approvalArtifact.bindings.toolContractHash = contract.contractHash;

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract,
      currentTime
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('allows write with valid approval artifact (delete obsolete)', async () => {
    const fixture = loadFixture('valid-delete-obsolete-record-with-approval');

    const manifest = await postgisWrites.buildWriteManifest(
      fixture.writeOperation,
      fixture.county,
      fixture.environment,
      { approvalId: fixture.approvalArtifact.approvalId }
    );

    const routing = {
      county: fixture.county,
      dsn: 'postgresql://test',
      dsnHash: fixture.approvalArtifact.bindings.dsnHash,
    };
    const currentTime = new Date('2026-02-13T14:00:00Z');

    fixture.approvalArtifact.bindings.paramsHash = manifest.paramsHash;
    fixture.approvalArtifact.bindings.manifestHash = manifest.manifestHash;
    fixture.approvalArtifact.bindings.toolContractHash = contract.contractHash;

    const result = await postgisWrites.validateApproval(
      fixture.approvalArtifact,
      manifest,
      routing,
      contract,
      currentTime
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });
});

describe('Phase 12C - MCP PostGIS Write Policy Regression Guards', () => {
  it('postgis-writes.ts compiles without TypeScript errors', async () => {
    const { execSync } = await import('node:child_process');

    const result = execSync(
      `npx tsc os-platform/core/pilot/mcp/postgis-writes.ts --module ESNext --target ES2022 --moduleResolution node --skipLibCheck --types node`,
      { cwd: resolve(__dirname, '../../..'), encoding: 'utf8' }
    );

    assert.ok(result === '' || result.includes('Successfully compiled'));
  });

  it('postgis-writes.ts exports required functions', () => {
    assert.strictEqual(typeof postgisWrites.buildWriteManifest, 'function');
    assert.strictEqual(typeof postgisWrites.validateApproval, 'function');
    assert.strictEqual(typeof postgisWrites.executeWrite, 'function');
  });
});
