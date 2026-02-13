/**
 * Phase 12A - MCP PostGIS Policy Tests (TDD)
 *
 * Tests the postgis-policy layer for:
 * - Read-only enforcement (SELECT-only)
 * - Multi-statement blocking (injection resistance)
 * - Row limit enforcement
 * - Parameterization requirement
 * - Query normalization (deterministic hashing)
 * - PII redaction in trace payloads
 *
 * TDD Note: These tests will FAIL until postgis-policy.ts is implemented.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturesDir = join(__dirname, 'fixtures', 'mcp');

// Helper: Load fixture
function loadFixture(name) {
  const path = join(fixturesDir, name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// Import policy module (will fail until implemented)
let validateQuery, normalizeQuery;
try {
  const policyModule = await import('../../../os-platform/core/pilot/mcp/postgis-policy.mjs');
  validateQuery = policyModule.validateQuery;
  normalizeQuery = policyModule.normalizeQuery;
} catch (err) {
  // TDD: Module not yet implemented
  validateQuery = () => {
    throw new Error('postgis-policy.ts not yet implemented');
  };
  normalizeQuery = () => {
    throw new Error('postgis-policy.ts not yet implemented');
  };
}

describe('Phase 12A - MCP PostGIS Policy (Read-Only Enforcement)', () => {
  test('rejects INSERT in read mode', async t => {
    const fixture = loadFixture('invalid-insert.json');

    try {
      await validateQuery(fixture.query, fixture.params, fixture.mode);
      assert.fail('Should have rejected INSERT statement');
    } catch (err) {
      assert.match(err.message, /write operation|INSERT/i);
    }
  });

  test('blocks multi-statement queries (semicolon injection)', async t => {
    const fixture = loadFixture('invalid-multi-statement.json');

    try {
      await validateQuery(fixture.query, fixture.params, fixture.mode);
      assert.fail('Should have rejected multi-statement query');
    } catch (err) {
      assert.match(err.message, /multiple statements|semicolon/i);
    }
  });

  test('rejects DDL operations (CREATE TABLE)', async t => {
    const fixture = loadFixture('invalid-ddl.json');

    try {
      await validateQuery(fixture.query, fixture.params, fixture.mode);
      assert.fail('Should have rejected DDL operation');
    } catch (err) {
      assert.match(err.message, /DDL|CREATE|ALTER|DROP/i);
    }
  });

  test('rejects dangerous keywords (COPY, pg_read_file)', async t => {
    const fixture = loadFixture('invalid-dangerous-keyword.json');

    try {
      await validateQuery(fixture.query, fixture.params, fixture.mode);
      assert.fail('Should have rejected COPY command');
    } catch (err) {
      assert.match(err.message, /dangerous keyword|COPY/i);
    }
  });
});

describe('Phase 12A - MCP PostGIS Policy (Parameterization)', () => {
  test('requires parameterized inputs (no string literals in WHERE)', async t => {
    const fixture = loadFixture('invalid-missing-params.json');

    try {
      await validateQuery(fixture.query, fixture.params, fixture.mode);
      assert.fail('Should have rejected non-parameterized query');
    } catch (err) {
      assert.match(err.message, /parameterized|string literal/i);
    }
  });

  test('allows valid parameterized SELECT with $1, $2 placeholders', async t => {
    const fixture = loadFixture('valid-select-with-where.json');

    const result = await validateQuery(fixture.query, fixture.params, fixture.mode);
    assert.strictEqual(result.risk, 'read');
    assert.ok(result.isValid);
  });
});

describe('Phase 12A - MCP PostGIS Policy (Query Normalization)', () => {
  test('normalizes queries for deterministic hashing', async t => {
    const fixture = loadFixture('valid-simple-select.json');

    const normalized = normalizeQuery(fixture.query);

    // Normalization: lowercase, collapse whitespace
    assert.strictEqual(normalized, fixture.expectedNormalized);
  });

  test('normalization is idempotent (double normalization = same result)', async t => {
    const fixture = loadFixture('valid-select-join.json');

    const normalized1 = normalizeQuery(fixture.query);
    const normalized2 = normalizeQuery(normalized1);

    assert.strictEqual(normalized1, normalized2);
  });
});

describe('Phase 12A - MCP PostGIS Policy (Limits Enforcement)', () => {
  test('enforces default row limit if not specified', async t => {
    const query = 'SELECT * FROM properties WHERE county_id = $1';
    const params = ['53005'];

    const result = await validateQuery(query, params, 'read');

    // Policy should inject LIMIT if not present
    assert.ok(result.limitEnforced);
    assert.ok(result.effectiveRowLimit > 0);
  });

  test('respects explicit LIMIT if lower than default', async t => {
    const fixture = loadFixture('valid-select-with-limit.json');

    const result = await validateQuery(fixture.query, fixture.params, fixture.mode);

    // Fixture has LIMIT 50, default is 100
    assert.strictEqual(result.effectiveRowLimit, 50);
  });
});

describe('Phase 12A - MCP PostGIS Policy (Trace PII Redaction)', () => {
  test('redacts sensitive fields in trace payload', async t => {
    const fixture = loadFixture('valid-simple-select.json');

    const result = await validateQuery(fixture.query, fixture.params, fixture.mode);

    // Trace payload should NOT include raw params/results
    assert.ok(result.tracePayload);
    assert.ok(result.tracePayload.queryHash); // Hash instead of raw SQL
    assert.ok(result.tracePayload.paramsHash); // Hash instead of raw params
    assert.ok(!result.tracePayload.rawQuery); // No raw SQL
    assert.ok(!result.tracePayload.rawParams); // No raw params
  });
});

describe('Phase 12A - MCP PostGIS Policy Regression Guards', () => {
  test('postgis-policy.ts compiles without TypeScript errors', async t => {
    const { execSync } = await import('node:child_process');

    try {
      // Compile just postgis-policy.ts, not entire project (avoid unrelated type errors)
      execSync(
        'npx tsc os-platform/core/pilot/mcp/postgis-policy.ts --module ESNext --target ES2022 --moduleResolution node --skipLibCheck --noEmit --types node',
        {
          cwd: join(__dirname, '..', '..', '..'),
          encoding: 'utf-8',
          stdio: 'pipe',
        }
      );
    } catch (err) {
      assert.fail(`TypeScript compilation failed:\n${err.stdout}\n${err.stderr}`);
    }
  });

  test('postgis-policy.ts exports required functions', async t => {
    try {
      const policyModule = await import('../../../os-platform/core/pilot/mcp/postgis-policy.mjs');

      assert.ok(typeof policyModule.validateQuery === 'function');
      assert.ok(typeof policyModule.normalizeQuery === 'function');
    } catch (err) {
      assert.fail(`Failed to import policy module: ${err.message}`);
    }
  });
});
