/**
 * Phase 12C - MCP PostGIS Write Contract Tests
 *
 * Tests write operation contract declarations and allowlists.
 *
 * Governance Contract:
 * - Contract must declare all allowlisted write operations
 * - Each operation must specify: operationId, template, paramsSchema, risk, ownerLane, allowedEnvs
 * - Contract hash must be validated for drift detection
 * - No hardcoded credentials or DSN strings in contract
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

describe('Phase 12C - MCP PostGIS Write Contract (Write Operations)', () => {
  it('contract declares writeOperations array', () => {
    assert.ok(contract, 'Contract must be loadable');
    assert.ok(contract.writeOperations, 'Contract must declare writeOperations');
    assert.ok(Array.isArray(contract.writeOperations), 'writeOperations must be an array');
  });

  it('contract declares at least 3 core write operations', () => {
    assert.ok(
      contract.writeOperations.length >= 3,
      'Contract must declare at least 3 write operations'
    );

    const requiredOps = [
      'update_property_assessment',
      'insert_new_parcel',
      'delete_obsolete_tax_record',
    ];

    const declaredOps = contract.writeOperations.map(op => op.operationId);

    for (const reqOp of requiredOps) {
      assert.ok(declaredOps.includes(reqOp), `Contract must declare operation: ${reqOp}`);
    }
  });

  it('each write operation declares required fields', () => {
    const requiredFields = [
      'operationId',
      'template',
      'paramsSchema',
      'risk',
      'ownerLane',
      'allowedEnvs',
    ];

    for (const op of contract.writeOperations) {
      for (const field of requiredFields) {
        assert.ok(
          op[field] !== undefined,
          `Operation ${op.operationId || 'UNKNOWN'} must declare field: ${field}`
        );
      }
    }
  });

  it('write operations declare correct risk level', () => {
    for (const op of contract.writeOperations) {
      assert.strictEqual(
        op.risk,
        'write',
        `Operation ${op.operationId} must declare risk: 'write'`
      );
    }
  });
});

describe('Phase 12C - MCP PostGIS Write Contract (Approval Requirements)', () => {
  it('contract declares approval requirements', () => {
    assert.ok(contract.approvalRequirements, 'Contract must declare approvalRequirements');
  });

  it('approval requirements declare required fields', () => {
    const approval = contract.approvalRequirements;

    assert.ok(approval.requiredFields, 'approvalRequirements must declare requiredFields');
    assert.ok(Array.isArray(approval.requiredFields), 'requiredFields must be an array');

    const expectedFields = [
      'approvalId',
      'approvedBy',
      'approvedAt',
      'expiresAt',
      'reason',
      'scope',
      'bindings',
    ];

    for (const field of expectedFields) {
      assert.ok(
        approval.requiredFields.includes(field),
        `approvalRequirements must include field: ${field}`
      );
    }
  });

  it('approval requirements declare expiry rules', () => {
    const approval = contract.approvalRequirements;

    assert.ok(approval.maxExpiryHours, 'approvalRequirements must declare maxExpiryHours');
    assert.strictEqual(typeof approval.maxExpiryHours, 'number', 'maxExpiryHours must be a number');
    assert.ok(
      approval.maxExpiryHours > 0 && approval.maxExpiryHours <= 24,
      'maxExpiryHours must be between 1 and 24 hours'
    );
  });
});

describe('Phase 12C - MCP PostGIS Write Contract (Drift Detection)', () => {
  it('contract hash matches expected manifest hash', () => {
    // Calculate contract hash (excluding contractHash field to avoid recursion)
    const { contractHash, ...contractWithoutHash } = contract;
    const contractString = JSON.stringify(contractWithoutHash, null, 2);
    const hash = createHash('sha256').update(contractString).digest('hex');
    const calculatedHash = hash.substring(0, 16);

    assert.strictEqual(
      contract.contractHash,
      calculatedHash,
      `Contract hash mismatch: expected ${calculatedHash} but got ${contract.contractHash}. Contract may have been modified without updating hash.`
    );
  });

  it('contract version is declared and matches expected format', () => {
    assert.ok(contract.version, 'Contract must declare version');
    assert.ok(
      /^\d+\.\d+\.\d+$/.test(contract.version),
      'Contract version must follow semver format (x.y.z)'
    );
  });
});

describe('Phase 12C - MCP PostGIS Write Contract Regression Guards', () => {
  it('contract is valid JSON', () => {
    // Already parsed, but verify structure
    assert.ok(contract, 'Contract must be valid JSON');
    assert.strictEqual(typeof contract, 'object', 'Contract must be an object');
  });

  it('contract has no hardcoded connection strings', () => {
    const contractString = JSON.stringify(contract, null, 2);

    // Check for common connection string patterns
    const forbiddenPatterns = [
      /postgresql:\/\/[^\s"]+/i,
      /postgres:\/\/[^\s"]+/i,
      /password["\s]*[:=]["\s]*[^\s"]+/i,
      /host["\s]*[:=]["\s]*\d+\.\d+\.\d+\.\d+/i,
    ];

    for (const pattern of forbiddenPatterns) {
      assert.ok(
        !pattern.test(contractString),
        `Contract must not contain hardcoded connection strings (pattern: ${pattern})`
      );
    }
  });

  it('write operations use parameterized SQL templates', () => {
    for (const op of contract.writeOperations) {
      // Check that template contains parameter placeholders ($1, $2, etc.)
      const hasParams = /\$\d+/.test(op.template);

      assert.ok(
        hasParams,
        `Operation ${op.operationId} template must use parameterized SQL ($1, $2, etc.)`
      );
    }
  });
});
