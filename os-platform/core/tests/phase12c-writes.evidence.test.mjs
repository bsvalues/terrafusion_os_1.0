/**
 * Phase 12C - MCP PostGIS Write Evidence Tests
 *
 * Tests bidirectional evidence linking between write manifests, approval artifacts, and evidence packs.
 *
 * Governance Contract:
 * - Write manifest references approval artifact
 * - Approval artifact references manifest hash (tamper detection)
 * - Evidence pack links to both manifest and approval
 * - All artifacts are immutable and hash-verified
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Import write implementation (will be created)
const postgisWrites = {
  buildWriteManifest: null,
  generateWriteReceipt: null,
};

const postgisApproval = {
  buildApprovalArtifact: null,
  validateApprovalBinding: null,
};

// Try to import actual implementations if they exist
try {
  const writesModule = await import('../pilot/mcp/postgis-writes.mjs');
  postgisWrites.buildWriteManifest = writesModule.buildWriteManifest;
  postgisWrites.generateWriteReceipt = writesModule.generateWriteReceipt;
} catch (err) {
  console.error('Failed to import postgis-writes.mjs:', err.message);
}

try {
  const approvalModule = await import('../pilot/mcp/postgis-approval.mjs');
  postgisApproval.buildApprovalArtifact = approvalModule.buildApprovalArtifact;
  postgisApproval.validateApprovalBinding = approvalModule.validateApprovalBinding;
} catch (err) {
  console.error('Failed to import postgis-approval.mjs:', err.message);
}

describe('Phase 12C - MCP PostGIS Write Evidence (Manifest → Approval)', () => {
  it('write manifest references approval artifact ID', async () => {
    if (!postgisWrites.buildWriteManifest) {
      throw new Error('postgis-writes.ts not yet implemented');
    }

    const writeOp = {
      operationId: 'update_property_assessment',
      params: [350000, 2026, 'supervisor@benton.gov', '12-345-678', 'wa-benton-053'],
      ownerLane: 'benton-assessor',
      reason: 'Test write',
    };

    const approvalId = 'appr-2026-02-13-999';

    const manifest = await postgisWrites.buildWriteManifest(writeOp, 'benton', 'staging', {
      approvalId,
    });

    assert.ok(manifest.approvalId, 'Manifest must reference approval artifact ID');
    assert.strictEqual(
      manifest.approvalId,
      approvalId,
      'Manifest must reference correct approval ID'
    );
  });

  it('write manifest includes manifestHash for binding', async () => {
    if (!postgisWrites.buildWriteManifest) {
      throw new Error('postgis-writes.ts not yet implemented');
    }

    const writeOp = {
      operationId: 'update_property_assessment',
      params: [350000, 2026, 'supervisor@benton.gov', '12-345-678', 'wa-benton-053'],
      ownerLane: 'benton-assessor',
      reason: 'Test write',
    };

    const manifest = await postgisWrites.buildWriteManifest(writeOp, 'benton', 'staging', {
      approvalId: 'appr-test',
    });

    assert.ok(manifest.manifestHash, 'Manifest must include manifestHash');
    assert.strictEqual(
      manifest.manifestHash.length,
      16,
      'Manifest hash must be 16 chars (SHA256 truncated)'
    );
  });
});

describe('Phase 12C - MCP PostGIS Write Evidence (Approval → Manifest)', () => {
  it('approval artifact binds to manifest hash', async () => {
    if (!postgisApproval.buildApprovalArtifact) {
      throw new Error('postgis-approval.ts not yet implemented');
    }

    const manifestHash = 'a1b2c3d4e5f6g7h8';
    const paramsHash = 'b2c3d4e5f6g7h8i9';
    const dsnHash = 'c3d4e5f6g7h8i9j0';
    const contractHash = '12267a5467c2a024'; // v1.1.0

    const approval = await postgisApproval.buildApprovalArtifact({
      approvedBy: 'supervisor@benton.gov',
      reason: 'Test approval',
      county: 'benton',
      environment: 'staging',
      operationId: 'update_property_assessment',
      manifestHash,
      paramsHash,
      dsnHash,
      contractHash,
    });

    assert.ok(approval.bindings, 'Approval must include bindings');
    assert.strictEqual(
      approval.bindings.manifestHash,
      manifestHash,
      'Approval must bind to manifest hash'
    );
    assert.strictEqual(
      approval.bindings.paramsHash,
      paramsHash,
      'Approval must bind to params hash'
    );
    assert.strictEqual(approval.bindings.dsnHash, dsnHash, 'Approval must bind to DSN hash');
    assert.strictEqual(
      approval.bindings.toolContractHash,
      contractHash,
      'Approval must bind to contract hash'
    );
  });

  it('approval binding validation detects manifest tampering', async () => {
    if (!postgisApproval.validateApprovalBinding) {
      throw new Error('postgis-approval.ts not yet implemented');
    }

    const approval = {
      bindings: {
        manifestHash: 'original_hash_abc',
        paramsHash: 'params_hash_def',
        dsnHash: 'dsn_hash_ghi',
        contractHash: 'contract_hash_jkl',
      },
    };

    const tamperedManifest = {
      manifestHash: 'tampered_hash_xyz', // Different from approval binding
      paramsHash: 'params_hash_def',
      dsnHash: 'dsn_hash_ghi',
      contractHash: 'contract_hash_jkl',
    };

    await assert.rejects(
      async () => {
        await postgisApproval.validateApprovalBinding(approval, tamperedManifest);
      },
      {
        name: 'Error',
        message: /Manifest hash mismatch/i,
      },
      'Must detect manifest tampering via hash mismatch'
    );
  });
});

describe('Phase 12C - MCP PostGIS Write Evidence (Receipt Generation)', () => {
  it('write receipt links to manifest and approval', async () => {
    if (!postgisWrites.generateWriteReceipt) {
      throw new Error('postgis-writes.ts not yet implemented');
    }

    const writeResult = {
      rowsAffected: 1,
      executedAt: new Date().toISOString(),
      executedBy: 'supervisor@benton.gov',
    };

    const manifestHash = 'd4e5f6g7h8i9j0k1';
    const approvalId = 'appr-2026-02-13-999';

    const receipt = await postgisWrites.generateWriteReceipt(writeResult, manifestHash, approvalId);

    assert.ok(receipt.manifestHash, 'Receipt must reference manifest hash');
    assert.ok(receipt.approvalId, 'Receipt must reference approval ID');
    assert.strictEqual(receipt.manifestHash, manifestHash, 'Receipt must link to correct manifest');
    assert.strictEqual(receipt.approvalId, approvalId, 'Receipt must link to correct approval');
  });

  it('write receipt includes receiptHash for evidence pack linking', async () => {
    if (!postgisWrites.generateWriteReceipt) {
      throw new Error('postgis-writes.ts not yet implemented');
    }

    const writeResult = {
      rowsAffected: 1,
      executedAt: new Date().toISOString(),
      executedBy: 'supervisor@benton.gov',
    };

    const receipt = await postgisWrites.generateWriteReceipt(
      writeResult,
      'manifest_hash_abc',
      'appr_id_def'
    );

    assert.ok(receipt.receiptHash, 'Receipt must include receiptHash');
    assert.strictEqual(
      receipt.receiptHash.length,
      16,
      'Receipt hash must be 16 chars (SHA256 truncated)'
    );
  });
});

describe('Phase 12C - MCP PostGIS Write Evidence Regression Guards', () => {
  it('postgis-approval.ts compiles without TypeScript errors', async () => {
    const { execSync } = await import('node:child_process');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const approvalPath = resolve(__dirname, '../pilot/mcp/postgis-approval.ts');

    // Compile single file (not entire project to avoid unrelated errors)
    const result = execSync(
      `npx tsc "${approvalPath}" --module ESNext --target ES2022 --moduleResolution node --skipLibCheck --noEmit --types node`,
      { cwd: resolve(__dirname, '../../..'), encoding: 'utf8' }
    );

    // TypeScript returns empty string on success
    assert.ok(
      result === '' || result.includes('Successfully compiled'),
      'postgis-approval.ts must compile without TypeScript errors'
    );
  });

  it('postgis-approval.ts exports required functions', async () => {
    if (!postgisApproval.buildApprovalArtifact) {
      throw new Error('postgis-approval.ts not yet implemented');
    }

    assert.strictEqual(
      typeof postgisApproval.buildApprovalArtifact,
      'function',
      'Must export buildApprovalArtifact'
    );
    assert.strictEqual(
      typeof postgisApproval.validateApprovalBinding,
      'function',
      'Must export validateApprovalBinding'
    );
  });
});
