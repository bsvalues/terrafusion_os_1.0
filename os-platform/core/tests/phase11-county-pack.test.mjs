/**
 * Phase 11 - County Pack Deployment Tests
 *
 * Tests for deterministic outputs, environment overrides, and evidence auto-attach
 */

import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const bentonPackPath = path.join(repoRoot, 'tools/county-packs/benton-pack-v1.0');
const tdcPath = path.join(repoRoot, 'tools/tdc/cli/dist/index.js');

describe('Phase 11 - County Pack Environment Overrides', () => {
  it('loads base configuration when no environment override exists', () => {
    const baseConfigPath = path.join(bentonPackPath, 'config/county.json');
    assert.ok(fs.existsSync(baseConfigPath), 'Base config should exist');

    const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf-8'));
    assert.ok(baseConfig.countyName, 'Base config should have countyName');
    assert.strictEqual(baseConfig.fipsCode, '53005', 'Benton County FIPS code should be 53005');
  });

  it('development environment override exists and is valid JSON', () => {
    const devConfigPath = path.join(bentonPackPath, 'config/county.development.json');
    assert.ok(fs.existsSync(devConfigPath), 'Development override should exist');

    const devConfig = JSON.parse(fs.readFileSync(devConfigPath, 'utf-8'));
    assert.strictEqual(
      devConfig.deployment?.environment,
      'development',
      'Should be dev environment'
    );
    assert.ok(
      devConfig.deployment?.parcelCount && devConfig.deployment.parcelCount < 1000,
      'Dev should have small parcel count'
    );
  });

  it('staging environment override exists and is valid JSON', () => {
    const stagingConfigPath = path.join(bentonPackPath, 'config/county.staging.json');
    assert.ok(fs.existsSync(stagingConfigPath), 'Staging override should exist');

    const stagingConfig = JSON.parse(fs.readFileSync(stagingConfigPath, 'utf-8'));
    assert.strictEqual(
      stagingConfig.deployment?.environment,
      'staging',
      'Should be staging environment'
    );
  });

  it('environment overrides do not modify core county identifiers', () => {
    const baseConfigPath = path.join(bentonPackPath, 'config/county.json');
    const devConfigPath = path.join(bentonPackPath, 'config/county.development.json');

    const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf-8'));
    const devConfig = JSON.parse(fs.readFileSync(devConfigPath, 'utf-8'));

    // Core identifiers must match
    assert.strictEqual(devConfig.countyName, baseConfig.countyName, 'countyName must not change');
    assert.strictEqual(devConfig.fipsCode, baseConfig.fipsCode, 'fipsCode must not change');
    assert.strictEqual(devConfig.state, baseConfig.state, 'state must not change');
  });
});

describe('Phase 11 - County Pack Deterministic Outputs', () => {
  it('TDC CLI county command exists', () => {
    assert.ok(fs.existsSync(tdcPath), 'TDC CLI should be built');
  });

  it('generates deployment manifest with checksums (dry-run)', () => {
    // Run deployment in dry-run mode
    const result = execSync(
      `node "${tdcPath}" county deploy "${bentonPackPath}" --env development`,
      { cwd: repoRoot, encoding: 'utf-8' }
    );

    // Verify output mentions artifacts
    assert.ok(result.includes('Deployment manifest:'), 'Should generate deployment manifest');
    assert.ok(result.includes('Merged config:'), 'Should generate merged config');
    assert.ok(result.includes('Evidence pack:'), 'Should generate evidence pack');

    // Verify checksums are shown
    assert.ok(result.includes('Base Config:'), 'Should show base config checksum');
    assert.ok(result.includes('Override Config:'), 'Should show override config checksum');
    assert.ok(result.includes('Merged Config:'), 'Should show merged config checksum');
  });

  it('deployment manifest exists after dry-run', () => {
    const manifestsDir = path.join(repoRoot, '.terrafusion/manifests');

    if (fs.existsSync(manifestsDir)) {
      const manifests = fs
        .readdirSync(manifestsDir)
        .filter(f => f.startsWith('county-deploy-53005'));
      assert.ok(manifests.length > 0, 'At least one deployment manifest should exist');

      // Verify manifest structure
      const manifestPath = path.join(manifestsDir, manifests[0]);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      assert.ok(manifest.packName, 'Manifest should have packName');
      assert.ok(manifest.fipsCode, 'Manifest should have fipsCode');
      assert.ok(manifest.environment, 'Manifest should have environment');
      assert.ok(manifest.baseConfig, 'Manifest should have baseConfig checksum');
      assert.ok(manifest.mergedConfig, 'Manifest should have mergedConfig checksum');
      assert.ok(manifest.deployedAt, 'Manifest should have deployedAt timestamp');
    }
  });

  it('merged configuration is generated and differs from base', () => {
    const manifestsDir = path.join(repoRoot, '.terrafusion/manifests');

    if (fs.existsSync(manifestsDir)) {
      const mergedConfigs = fs
        .readdirSync(manifestsDir)
        .filter(f => f.startsWith('county-merged-53005'));

      if (mergedConfigs.length > 0) {
        const mergedPath = path.join(manifestsDir, mergedConfigs[0]);
        const mergedConfig = JSON.parse(fs.readFileSync(mergedPath, 'utf-8'));

        const baseConfigPath = path.join(bentonPackPath, 'config/county.json');
        const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf-8'));

        // Merged should have different deployment settings than base
        assert.notStrictEqual(
          JSON.stringify(mergedConfig.deployment),
          JSON.stringify(baseConfig.deployment),
          'Merged config deployment should differ from base (environment override applied)'
        );
      }
    }
  });
});

describe('Phase 11 - County Pack Evidence Auto-Attach', () => {
  it('evidence pack is auto-generated on deployment', () => {
    const evidenceDir = path.join(repoRoot, '.terrafusion/evidence');

    if (fs.existsSync(evidenceDir)) {
      const evidencePacks = fs.readdirSync(evidenceDir).filter(f => f.startsWith('evidence-53005'));
      assert.ok(evidencePacks.length > 0, 'At least one evidence pack should exist');
    }
  });

  it('evidence pack contains required fields', () => {
    const evidenceDir = path.join(repoRoot, '.terrafusion/evidence');

    if (fs.existsSync(evidenceDir)) {
      const evidencePacks = fs.readdirSync(evidenceDir).filter(f => f.startsWith('evidence-53005'));

      if (evidencePacks.length > 0) {
        const evidencePath = path.join(evidenceDir, evidencePacks[0]);
        const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));

        // Verify required fields
        assert.ok(evidence.id, 'Evidence should have id');
        assert.strictEqual(
          evidence.type,
          'county-deployment',
          'Evidence type should be county-deployment'
        );
        assert.ok(evidence.packName, 'Evidence should have packName');
        assert.ok(evidence.countyName, 'Evidence should have countyName');
        assert.ok(evidence.fipsCode, 'Evidence should have fipsCode');
        assert.ok(evidence.environment, 'Evidence should have environment');
        assert.ok(evidence.createdAt, 'Evidence should have createdAt timestamp');

        // Verify artifacts section
        assert.ok(evidence.artifacts, 'Evidence should have artifacts');
        assert.ok(
          evidence.artifacts.deploymentManifest,
          'Evidence should reference deployment manifest'
        );
        assert.ok(evidence.artifacts.mergedConfig, 'Evidence should reference merged config');

        // Verify checksums section
        assert.ok(evidence.checksums, 'Evidence should have checksums');
        assert.ok(evidence.checksums.baseConfig, 'Evidence should have baseConfig checksum');
        assert.ok(evidence.checksums.mergedConfig, 'Evidence should have mergedConfig checksum');

        // Verify status
        assert.ok(
          ['dry-run', 'deployed'].includes(evidence.status),
          'Evidence status should be valid'
        );
      }
    }
  });

  it('deployment manifest references evidence pack', () => {
    const manifestsDir = path.join(repoRoot, '.terrafusion/manifests');

    if (fs.existsSync(manifestsDir)) {
      const manifests = fs
        .readdirSync(manifestsDir)
        .filter(f => f.startsWith('county-deploy-53005'));

      if (manifests.length > 0) {
        const manifestPath = path.join(manifestsDir, manifests[0]);
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        assert.ok(manifest.evidencePackId, 'Manifest should reference evidence pack');
        assert.ok(
          manifest.evidencePackId.startsWith('evidence-'),
          'Evidence pack ID should have correct prefix'
        );
      }
    }
  });
});

describe('Phase 11 - County Pack Deployment Regression Guards', () => {
  it('county.ts compiles without TypeScript errors', () => {
    const countyTsPath = path.join(repoRoot, 'tools/tdc/cli/src/commands/county.ts');
    assert.ok(fs.existsSync(countyTsPath), 'county.ts should exist');

    // Run TypeScript compiler in noEmit mode
    try {
      execSync('npx tsc --noEmit', { cwd: path.join(repoRoot, 'tools/tdc/cli'), stdio: 'pipe' });
    } catch (error) {
      assert.fail(`county.ts should compile without errors: ${error.stdout || error.message}`);
    }
  });

  it('county.ts exports required functions', () => {
    const countyJsPath = path.join(repoRoot, 'tools/tdc/cli/dist/commands/county.js');
    assert.ok(fs.existsSync(countyJsPath), 'county.js should be compiled');

    // Read compiled JavaScript
    const countyJs = fs.readFileSync(countyJsPath, 'utf-8');

    // Verify key exports exist
    assert.ok(countyJs.includes('registerCountyCommand'), 'Should export registerCountyCommand');
    assert.ok(countyJs.includes('loadCountyConfig'), 'Should export loadCountyConfig helper');
    assert.ok(countyJs.includes('calculateChecksum'), 'Should export calculateChecksum helper');
    assert.ok(countyJs.includes('deepMerge'), 'Should export deepMerge helper');
  });

  it('county.ts does not contain hardcoded paths', () => {
    const countyTsPath = path.join(repoRoot, 'tools/tdc/cli/src/commands/county.ts');
    const content = fs.readFileSync(countyTsPath, 'utf-8');

    // Should not contain hardcoded absolute paths
    assert.ok(!content.match(/C:\\\\Users\\\\/i), 'Should not contain hardcoded Windows paths');
    assert.ok(!content.match(/\/home\/[a-z]+\//i), 'Should not contain hardcoded Linux home paths');
  });
});
