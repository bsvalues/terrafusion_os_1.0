/**
 * Phase 12A - MCP PostGIS Contract Tests (TDD)
 *
 * Tests the mcp-postgis.contract.json for:
 * - Tool allowlist (mcp-postgis-query)
 * - Risk level declarations
 * - Required fields (ownerLane, county, env)
 * - Contract hash verification (drift detection)
 *
 * TDD Note: These tests will FAIL until mcp-postgis.contract.json is created.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const contractPath = join(__dirname, '..', '..', '..', 'tools', 'registry', 'contracts', 'mcp-postgis.contract.json');

// Helper: Load contract
function loadContract() {
  if (!existsSync(contractPath)) {
    throw new Error('mcp-postgis.contract.json not yet created');
  }
  return JSON.parse(readFileSync(contractPath, 'utf-8'));
}

// Helper: Calculate contract hash (for drift detection)
function calculateContractHash(contract) {
  // Exclude contractHash field to avoid recursion
  const { contractHash, ...contractWithoutHash } = contract;
  const normalized = JSON.stringify(contractWithoutHash, null, 2);
  return createHash('sha256').update(normalized, 'utf-8').digest('hex').substring(0, 16);
}

describe('Phase 12A - MCP PostGIS Contract (Tool Allowlist)', () => {
  test('contract declares mcp-postgis-query tool', async (t) => {
    const contract = loadContract();

    assert.ok(contract.tools);
    assert.ok(Array.isArray(contract.tools));

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');
    assert.ok(postgisQuery, 'mcp-postgis-query tool not found in contract');
  });

  test('mcp-postgis-query declares read risk as default', async (t) => {
    const contract = loadContract();

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');

    assert.strictEqual(postgisQuery.defaultRisk, 'read');
  });

  test('mcp-postgis-query requires ownerLane field', async (t) => {
    const contract = loadContract();

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');

    assert.ok(postgisQuery.requiredFields);
    assert.ok(postgisQuery.requiredFields.includes('ownerLane'));
  });

  test('mcp-postgis-query requires county and environment context', async (t) => {
    const contract = loadContract();

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');

    assert.ok(postgisQuery.requiredFields.includes('county'));
    assert.ok(postgisQuery.requiredFields.includes('environment'));
  });
});

describe('Phase 12A - MCP PostGIS Contract (Risk Levels)', () => {
  test('contract defines risk levels (read, write, ddl)', async (t) => {
    const contract = loadContract();

    assert.ok(contract.riskLevels);
    assert.ok(contract.riskLevels.read);
    assert.ok(contract.riskLevels.write);
    assert.ok(contract.riskLevels.ddl);
  });

  test('read risk allows SELECT only', async (t) => {
    const contract = loadContract();

    const readRisk = contract.riskLevels.read;

    assert.ok(readRisk.allowedStatements);
    assert.ok(readRisk.allowedStatements.includes('SELECT'));
    assert.ok(!readRisk.allowedStatements.includes('INSERT'));
    assert.ok(!readRisk.allowedStatements.includes('UPDATE'));
    assert.ok(!readRisk.allowedStatements.includes('DELETE'));
  });

  test('write risk requires supervisor approval', async (t) => {
    const contract = loadContract();

    const writeRisk = contract.riskLevels.write;

    assert.strictEqual(writeRisk.requiresSupervisorApproval, true);
  });
});

describe('Phase 12A - MCP PostGIS Contract (Limits)', () => {
  test('contract declares default row limit', async (t) => {
    const contract = loadContract();

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');

    assert.ok(postgisQuery.limits);
    assert.ok(postgisQuery.limits.defaultRowLimit > 0);
  });

  test('contract declares statement timeout', async (t) => {
    const contract = loadContract();

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');

    assert.ok(postgisQuery.limits.statementTimeoutMs > 0);
  });

  test('contract declares max result bytes', async (t) => {
    const contract = loadContract();

    const postgisQuery = contract.tools.find((tool) => tool.name === 'mcp-postgis-query');

    assert.ok(postgisQuery.limits.maxResultBytes > 0);
  });
});

describe('Phase 12A - MCP PostGIS Contract (Drift Detection)', () => {
  test('contract hash matches expected manifest hash', async (t) => {
    const contract = loadContract();

    const currentHash = calculateContractHash(contract);

    // Store hash in contract itself for drift detection
    if (contract.contractHash) {
      assert.strictEqual(
        currentHash,
        contract.contractHash,
        'Contract has drifted (hash mismatch)'
      );
    } else {
      // First run: just log the hash for manual verification
      console.log(`Contract hash (store this in contract.contractHash): ${currentHash}`);
    }
  });

  test('contract version is declared', async (t) => {
    const contract = loadContract();

    assert.ok(contract.version);
    assert.match(contract.version, /^\d+\.\d+\.\d+$/); // Semantic versioning
  });
});

describe('Phase 12A - MCP PostGIS Contract Regression Guards', () => {
  test('contract is valid JSON', async (t) => {
    try {
      loadContract();
    } catch (err) {
      assert.fail(`Contract is not valid JSON: ${err.message}`);
    }
  });

  test('contract has no hardcoded connection strings', async (t) => {
    const contract = loadContract();

    const contractString = JSON.stringify(contract);

    // Check for common connection string patterns
    assert.ok(!contractString.includes('postgres://'));
    assert.ok(!contractString.includes('postgresql://'));
    assert.ok(!contractString.includes('password='));
    assert.ok(!contractString.includes('pwd='));
  });
});
