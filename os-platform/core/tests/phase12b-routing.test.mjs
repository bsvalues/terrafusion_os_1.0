/**
 * Phase 12B - MCP PostGIS Routing Tests
 * 
 * Tests deterministic DSN resolution, cross-county isolation, and environment isolation.
 * 
 * Governance Contract:
 * - Counties are sovereign tenants (no cross-county access)
 * - Environments are isolated (no staging→prod accidents)
 * - DSN resolution is deterministic (same inputs = same output)
 * - All routing produces immutable manifests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = resolve(__dirname, 'fixtures', 'routing');

// Load test fixtures
function loadFixture(name) {
  const path = resolve(FIXTURES_DIR, `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Import routing implementation (will be created)
// For now, we stub it for TDD red phase
const postgisRouting = {
  resolveDataSource: null,  // Will be implemented
  generateRoutingManifest: null,
  calculateDSNHash: null
};

// Try to import actual implementation if it exists
try {
  const module = await import('../pilot/mcp/postgis-routing.mjs');
  postgisRouting.resolveDataSource = module.resolveDataSource;
  postgisRouting.generateRoutingManifest = module.generateRoutingManifest;
  postgisRouting.calculateDSNHash = module.calculateDSNHash;
} catch (err) {
  // Implementation not yet created (TDD red phase)
  console.error('Failed to import postgis-routing.mjs:', err.message);
}

describe('Phase 12B - MCP PostGIS Routing (Valid DSN Resolution)', () => {
  it('resolves Benton development DSN correctly', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('benton-dev');
    const result = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    assert.ok(result.dsnHash, 'DSN hash must be generated');
    assert.strictEqual(result.county, 'benton', 'County must match request');
    assert.strictEqual(result.environment, 'development', 'Environment must match request');
    assert.strictEqual(result.dataSource.database, 'terrafusion_benton_dev', 'Database must match fixture');
  });

  it('resolves Benton staging DSN correctly', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('benton-staging');
    const result = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    assert.ok(result.dsnHash, 'DSN hash must be generated');
    assert.strictEqual(result.county, 'benton', 'County must match request');
    assert.strictEqual(result.environment, 'staging', 'Environment must match request');
    assert.strictEqual(result.dataSource.database, 'terrafusion_benton_staging', 'Database must match fixture');
  });

  it('resolves Benton production DSN correctly', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('benton-production');
    const result = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    assert.ok(result.dsnHash, 'DSN hash must be generated');
    assert.strictEqual(result.county, 'benton', 'County must match request');
    assert.strictEqual(result.environment, 'production', 'Environment must match request');
    assert.strictEqual(result.dataSource.database, 'terrafusion_benton_prod', 'Database must match fixture');
    assert.ok(result.dataSource.readReplica, 'Production must have read replica');
  });

  it('resolves Yakima development DSN correctly', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('yakima-dev');
    const result = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    assert.ok(result.dsnHash, 'DSN hash must be generated');
    assert.strictEqual(result.county, 'yakima', 'County must match request');
    assert.strictEqual(result.environment, 'development', 'Environment must match request');
    assert.strictEqual(result.dataSource.database, 'terrafusion_yakima_dev', 'Database must match fixture');
  });
});

describe('Phase 12B - MCP PostGIS Routing (Cross-County Isolation)', () => {
  it('rejects cross-county DSN (Benton request with Yakima DSN)', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('invalid-county-mismatch');
    
    await assert.rejects(
      async () => {
        await postgisRouting.resolveDataSource(
          fixture.county,
          fixture.environment,
          fixture.dataSource
        );
      },
      {
        name: 'Error',
        message: /County mismatch.*benton.*yakima/i
      },
      'Must reject cross-county DSN with descriptive error'
    );
  });
});

describe('Phase 12B - MCP PostGIS Routing (Environment Isolation)', () => {
  it('rejects cross-environment DSN (staging request with prod DSN)', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('invalid-env-mismatch');
    
    await assert.rejects(
      async () => {
        await postgisRouting.resolveDataSource(
          fixture.county,
          fixture.environment,
          fixture.dataSource
        );
      },
      {
        name: 'Error',
        message: /Environment mismatch.*staging.*production/i
      },
      'Must reject cross-environment DSN with descriptive error'
    );
  });
});

describe('Phase 12B - MCP PostGIS Routing (DSN Hash Determinism)', () => {
  it('produces same DSN hash for same inputs (idempotency)', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('benton-dev');
    
    // Resolve twice with identical inputs
    const result1 = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    const result2 = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    assert.strictEqual(
      result1.dsnHash,
      result2.dsnHash,
      'DSN hash must be deterministic (same inputs = same output)'
    );
  });
});

describe('Phase 12B - MCP PostGIS Routing (Manifest Generation)', () => {
  it('generates routing manifest with required fields', async () => {
    if (!postgisRouting.generateRoutingManifest) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    const fixture = loadFixture('benton-dev');
    const resolved = await postgisRouting.resolveDataSource(
      fixture.county,
      fixture.environment,
      fixture.dataSource
    );
    
    const manifest = await postgisRouting.generateRoutingManifest(resolved);
    
    // Required manifest fields
    assert.ok(manifest.routingManifestVersion, 'Manifest must have version');
    assert.strictEqual(manifest.county, 'benton', 'Manifest must include county');
    assert.strictEqual(manifest.environment, 'development', 'Manifest must include environment');
    assert.ok(manifest.dsnHash, 'Manifest must include DSN hash');
    assert.ok(manifest.resolvedAt, 'Manifest must include timestamp');
    assert.ok(manifest.manifestHash, 'Manifest must be self-hashing for drift detection');
    
    // Manifest must NOT include raw credentials
    assert.strictEqual(manifest.username, undefined, 'Manifest must NOT include username');
    assert.strictEqual(manifest.password, undefined, 'Manifest must NOT include password');
    assert.strictEqual(manifest.connectionString, undefined, 'Manifest must NOT include raw connection string');
  });
});

describe('Phase 12B - MCP PostGIS Routing Regression Guards', () => {
  it('postgis-routing.ts compiles without TypeScript errors', async () => {
    const { execSync } = await import('node:child_process');
    const routingPath = resolve(__dirname, '../pilot/mcp/postgis-routing.ts');
    
    // Compile single file (not entire project to avoid unrelated errors)
    const result = execSync(
      `npx tsc "${routingPath}" --module ESNext --target ES2022 --moduleResolution node --skipLibCheck --noEmit --types node`,
      { cwd: resolve(__dirname, '../../..'), encoding: 'utf8' }
    );
    
    // TypeScript returns empty string on success
    assert.ok(
      result === '' || result.includes('Successfully compiled'),
      'postgis-routing.ts must compile without TypeScript errors'
    );
  });

  it('postgis-routing.ts exports required functions', async () => {
    if (!postgisRouting.resolveDataSource) {
      throw new Error('postgis-routing.ts not yet implemented');
    }
    
    assert.strictEqual(typeof postgisRouting.resolveDataSource, 'function', 'Must export resolveDataSource');
    assert.strictEqual(typeof postgisRouting.generateRoutingManifest, 'function', 'Must export generateRoutingManifest');
    assert.strictEqual(typeof postgisRouting.calculateDSNHash, 'function', 'Must export calculateDSNHash');
  });
});
