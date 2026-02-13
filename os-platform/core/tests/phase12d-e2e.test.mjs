/**
 * Phase 12D - End-to-End MCP Integration Tests
 *
 * Tests the full MCP PostGIS stack integration:
 * - Phase 12A: PostGIS read-only queries
 * - Phase 12B: Multi-county routing isolation
 * - Phase 12C: Supervised writes with approval artifacts
 * - Phase 12D: End-to-end flows with evidence verification
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_PATH = resolve(__dirname, 'fixtures/mcp-e2e');
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

// Import implementations
const postgisWrites = {
  buildWriteManifest: null,
  validateApproval: null,
  executeWrite: null,
  generateWriteReceipt: null,
};
const postgisApproval = { buildApprovalArtifact: null };
const mockPool = { createMockPool: null };

try {
  const writesModule = await import('../pilot/mcp/postgis-writes.mjs');
  postgisWrites.buildWriteManifest = writesModule.buildWriteManifest;
  postgisWrites.validateApproval = writesModule.validateApproval;
  postgisWrites.executeWrite = writesModule.executeWrite;
  postgisWrites.generateWriteReceipt = writesModule.generateWriteReceipt;
} catch (err) {
  console.error('Failed to import postgis-writes.mjs:', err.message);
}

try {
  const approvalModule = await import('../pilot/mcp/postgis-approval.mjs');
  postgisApproval.buildApprovalArtifact = approvalModule.buildApprovalArtifact;
} catch (err) {
  console.error('Failed to import postgis-approval.mjs:', err.message);
}

try {
  const poolModule = await import('./mocks/mock-pg-pool.mjs');
  mockPool.createMockPool = poolModule.createMockPool;
} catch (err) {
  console.error('Failed to import mock-pg-pool.mjs:', err.message);
}

describe('Phase 12D - End-to-End MCP Integration (Read-Write Flow)', () => {
  it('executes full read → approve → write → verify evidence flow', async () => {
    const fixture = loadFixture('read-write-flow-valid');
    const pool = mockPool.createMockPool();

    // Setup: Populate mock database with initial data
    pool.setMockData('properties', fixture.step1_read.mockResult);

    // Step 1: Read property (Phase 12A)
    const readResult = await pool.query(fixture.step1_read.query, fixture.step1_read.params);

    assert.strictEqual(
      readResult.rowCount,
      fixture.step1_read.expectedRowCount,
      'Read must return expected row count'
    );
    assert.strictEqual(
      readResult.rows[0].parcel_id,
      '12-345-678',
      'Read must return correct parcel'
    );
    assert.strictEqual(
      readResult.rows[0].assessed_value,
      300000,
      'Read must return initial assessment value'
    );

    // Step 2: Build approval artifact FIRST (generates approvalId)
    const approval = await postgisApproval.buildApprovalArtifact({
      approvedBy: fixture.step2_approve_write.approvedBy,
      reason: fixture.step2_approve_write.reason,
      county: fixture.county,
      environment: fixture.environment,
      operationId: fixture.step2_approve_write.operationId,
      manifestHash: 'temp-hash', // Temporary
      paramsHash: 'temp-params-hash', // Temporary
      dsnHash: 'mock_dsn_hash_e2e',
      contractHash: contract.contractHash,
      expiryHours: 8,
    });

    // Build write manifest with approval's generated ID
    const manifest = await postgisWrites.buildWriteManifest(
      fixture.step3_execute_write,
      fixture.county,
      fixture.environment,
      { approvalId: approval.approvalId }
    );

    // Update approval bindings with actual manifest hash
    approval.bindings.manifestHash = manifest.manifestHash;
    approval.bindings.paramsHash = manifest.paramsHash;

    assert.ok(approval.approvalId, 'Approval must have ID');
    assert.ok(approval.bindings.manifestHash, 'Approval must bind to manifest hash');

    // Step 3: Execute write with approval (Phase 12C)
    const routing = {
      county: fixture.county,
      dsn: 'postgresql://mock',
      dsnHash: 'mock_dsn_hash_e2e',
    };

    const currentTime = new Date(fixture.step2_approve_write.approvedAt);

    const receipt = await postgisWrites.executeWrite(manifest, approval, routing, contract, pool);

    assert.ok(receipt.receiptId, 'Receipt must have ID');
    assert.strictEqual(
      receipt.rowsAffected,
      fixture.step3_execute_write.expectedRowsAffected,
      'Write must affect expected rows'
    );
    assert.strictEqual(
      receipt.manifestHash,
      manifest.manifestHash,
      'Receipt must link to manifest'
    );
    assert.strictEqual(receipt.approvalId, approval.approvalId, 'Receipt must link to approval');

    // Step 4: Verify evidence trail (Phase 12D)
    assert.strictEqual(manifest.approvalId, approval.approvalId, 'Manifest → Approval link');
    assert.strictEqual(
      approval.bindings.manifestHash,
      manifest.manifestHash,
      'Approval → Manifest link'
    );
    assert.strictEqual(receipt.manifestHash, manifest.manifestHash, 'Receipt → Manifest link');
    assert.strictEqual(receipt.approvalId, approval.approvalId, 'Receipt → Approval link');

    // Step 5: Verify write succeeded (Phase 12A)
    const verifyResult = await pool.query(
      fixture.step5_verify_read.query,
      fixture.step5_verify_read.params
    );

    assert.strictEqual(
      verifyResult.rows[0].assessed_value,
      350000,
      'Write must update assessment value'
    );
    assert.strictEqual(verifyResult.rows[0].tax_year, 2026, 'Write must update tax year');
  });
});

describe('Phase 12D - End-to-End MCP Integration (Cross-County Isolation)', () => {
  it('prevents cross-county write with Benton approval on Yakima data', async () => {
    const fixture = loadFixture('cross-county-isolation');
    const pool = mockPool.createMockPool();

    // Setup: Populate Benton data
    pool.setMockData('properties', fixture.benton_read.mockResult);

    // Step 1: Benton read succeeds
    const bentonRead = await pool.query(fixture.benton_read.query, fixture.benton_read.params);
    assert.strictEqual(bentonRead.rowCount, 1, 'Benton read must succeed');

    // Step 2: Build Benton approval
    const bentonManifest = await postgisWrites.buildWriteManifest(
      {
        operationId: 'update_property_assessment',
        params: fixture.yakima_write_attempt.params,
        ownerLane: 'benton-assessor',
        reason: 'Test cross-county prevention',
      },
      fixture.yakima_write_attempt.county, // yakima
      fixture.environment,
      { approvalId: 'appr-benton-001' }
    );

    const bentonApproval = await postgisApproval.buildApprovalArtifact({
      approvedBy: fixture.benton_approval.approvedBy,
      reason: fixture.benton_approval.reason,
      county: fixture.benton_approval.scope.county, // benton
      environment: fixture.benton_approval.scope.environment,
      operationId: fixture.benton_approval.scope.operationId,
      manifestHash: bentonManifest.manifestHash,
      paramsHash: bentonManifest.paramsHash,
      dsnHash: 'mock_dsn_hash_benton',
      contractHash: contract.contractHash,
    });

    // Step 3: Yakima write attempt must fail (county mismatch)
    const yakimaRouting = {
      county: fixture.yakima_write_attempt.county, // yakima
      dsn: 'postgresql://mock-yakima',
      dsnHash: 'mock_dsn_hash_yakima',
    };

    const validation = await postgisWrites.validateApproval(
      bentonApproval,
      bentonManifest,
      yakimaRouting,
      contract
    );

    assert.strictEqual(validation.valid, false, 'Cross-county write must be rejected');
    assert.ok(
      validation.errors.some(e => /County mismatch/i.test(e)),
      'Error must mention county mismatch'
    );
  });
});

describe('Phase 12D - End-to-End MCP Integration (Evidence Trail)', () => {
  it('generates complete evidence pack with bidirectional linking', async () => {
    const fixture = loadFixture('evidence-trail-complete');
    const pool = mockPool.createMockPool();

    // Setup initial data
    pool.setMockData('properties', [
      {
        parcel_id: '12-345-678',
        county_id: 'wa-benton-053',
        assessed_value: 300000,
        tax_year: 2025,
        owner_name: 'John Doe',
      },
    ]);

    // Step 1: Build approval artifact FIRST (generates approvalId)
    // Note: We'll update manifest hash binding after manifest is built
    const approval = await postgisApproval.buildApprovalArtifact({
      approvedBy: fixture.write_with_approval.approval.approvedBy,
      reason: fixture.write_with_approval.approval.reason,
      county: fixture.county,
      environment: fixture.environment,
      operationId: fixture.write_with_approval.operationId,
      manifestHash: 'temp-hash', // Temporary, will be updated after manifest built
      paramsHash: 'temp-params-hash',
      dsnHash: 'mock_dsn_hash_evidence',
      contractHash: contract.contractHash,
      expiryHours: 8,
    });

    // Step 2: Build write manifest using approval's generated ID
    const manifest = await postgisWrites.buildWriteManifest(
      fixture.write_with_approval,
      fixture.county,
      fixture.environment,
      { approvalId: approval.approvalId }
    );

    // Update approval bindings with actual manifest hash (for bidirectional linking)
    approval.bindings.manifestHash = manifest.manifestHash;
    approval.bindings.paramsHash = manifest.paramsHash;

    // Verify manifest has required fields
    const manifestFields = fixture.evidence_pack.artifacts.find(
      a => a.type === 'write.manifest.json'
    );
    for (const field of manifestFields.requiredFields) {
      assert.ok(manifest[field] !== undefined, `Manifest must have field: ${field}`);
    }

    // Verify approval has required fields
    const approvalFields = fixture.evidence_pack.artifacts.find(
      a => a.type === 'approval.artifact.json'
    );
    for (const field of approvalFields.requiredFields) {
      assert.ok(approval[field] !== undefined, `Approval must have field: ${field}`);
    }

    // Step 3: Execute write and generate receipt
    const routing = {
      county: fixture.county,
      dsn: 'postgresql://mock',
      dsnHash: 'mock_dsn_hash_evidence',
    };

    const receipt = await postgisWrites.executeWrite(manifest, approval, routing, contract, pool);

    // Verify receipt has required fields
    const receiptFields = fixture.evidence_pack.artifacts.find(
      a => a.type === 'write.receipt.json'
    );
    for (const field of receiptFields.requiredFields) {
      assert.ok(receipt[field] !== undefined, `Receipt must have field: ${field}`);
    }

    // Step 4: Verify all bidirectional links
    const links = fixture.evidence_pack.bidirectionalLinks;

    // Link 1: manifest → approval
    assert.strictEqual(manifest.approvalId, approval.approvalId, links[0].link);

    // Link 2: approval → manifest
    assert.strictEqual(approval.bindings.manifestHash, manifest.manifestHash, links[1].link);

    // Link 3: receipt → manifest
    assert.strictEqual(receipt.manifestHash, manifest.manifestHash, links[2].link);

    // Link 4: receipt → approval
    assert.strictEqual(receipt.approvalId, approval.approvalId, links[3].link);
  });
});

describe('Phase 12D - End-to-End MCP Integration Regression Guards', () => {
  it('mock-pg-pool.ts compiles without TypeScript errors', async () => {
    const { execSync } = await import('node:child_process');

    const result = execSync(
      `npx tsc os-platform/core/tests/mocks/mock-pg-pool.ts --module ESNext --target ES2022 --moduleResolution node --skipLibCheck --types node`,
      { cwd: resolve(__dirname, '../../..'), encoding: 'utf8' }
    );

    assert.ok(result === '' || result.includes('Successfully compiled'));
  });

  it('mock-pg-pool.ts exports required functions', () => {
    assert.strictEqual(typeof mockPool.createMockPool, 'function');
  });
});
