import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

const { runAtlasConfigurationAuthBoundary } =
  await import('../pilot/localops-atlas-configuration-auth-boundary.mjs');

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const productionConfigPath = path.join(
  repoRoot,
  'backend/src/TerraFusion.API/appsettings.Production.json'
);
const authPath = path.join(
  repoRoot,
  'backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs'
);

function atlasSshConfig(hostname = '192.168.1.156') {
  return `host atlas\nhostname ${hostname}\ncontrolmaster false\n`;
}

describe('Atlas configuration and authentication boundary', () => {
  it('resolves the fixed Atlas endpoints and credential references without accessing state', async () => {
    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      { inspectSshConfiguration: () => atlasSshConfig() }
    );

    assert.deepStrictEqual(result, {
      ok: true,
      status: 'ready',
      boundary: 'atlas-configuration-auth',
      atlas: {
        alias: 'atlas',
        hostname: '192.168.1.156',
        database: {
          provider: 'postgresql',
          port: 5432,
          database: 'terrafusion_production',
          principal: 'terrafusion',
          hostReference: 'TF_DB_HOST',
          credentialReference: 'TF_DB_PASSWORD',
          runtimeOverrideKey: 'ConnectionStrings__DefaultConnection',
        },
        redis: {
          port: 6379,
          hostReference: 'TF_REDIS_HOST',
          credentialReference: 'TF_REDIS_PASSWORD',
          runtimeOverrideKey: 'ConnectionStrings__Redis',
        },
      },
      authentication: {
        scheme: 'Bearer',
        settingsSection: 'JwtSettings',
        credentialReference: 'JwtSettings__SecretKey',
        issuerReference: 'JwtSettings__Issuer',
        audienceReference: 'JwtSettings__Audience',
        validates: ['issuer', 'audience', 'lifetime', 'signing-key'],
        fallbackPolicy: 'authenticated-user-required',
      },
      resolution: {
        productionTemplate: 'appsettings.Production.json',
        runtimeConnectionResolver: 'ConnectionStrings:DefaultConnection',
        localOverridePattern: 'appsettings.{Environment}.local.json',
        templateExpansionClaimed: false,
      },
      safety: {
        secretValuesInspected: false,
        networkConnections: false,
        databaseQueries: false,
        migrations: false,
        mutations: false,
      },
    });
  });

  it('fails closed before source or SSH inspection when secret-bearing input is supplied', async () => {
    let reads = 0;
    let inspections = 0;
    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot, password: 'must-not-be-read' },
      {
        readFile: async () => {
          reads += 1;
        },
        inspectSshConfiguration: () => {
          inspections += 1;
        },
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'INVALID_ATLAS_BOUNDARY_INPUT');
    assert.strictEqual(reads, 0);
    assert.strictEqual(inspections, 0);
    assert.doesNotMatch(JSON.stringify(result), /must-not-be-read/);
  });

  it('fails closed when the production database template drifts or embeds a credential', async () => {
    const actualConfig = JSON.parse(await readFile(productionConfigPath, 'utf8'));
    actualConfig.ConnectionStrings.DefaultConnection =
      'Host=${TF_DB_HOST};Database=terrafusion_production;Username=terrafusion;Password=literal';

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        inspectSshConfiguration: () => atlasSshConfig(),
        readFile: async filePath =>
          path.resolve(filePath) === productionConfigPath
            ? JSON.stringify(actualConfig)
            : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_CONFIGURATION_CONTRACT_DRIFT');
    assert.doesNotMatch(JSON.stringify(result), /Password=literal/);
  });

  it('fails closed when the production JWT validation boundary drifts', async () => {
    const actualAuth = await readFile(authPath, 'utf8');
    const weakenedAuth = actualAuth.replace('ValidateAudience = true', 'ValidateAudience = false');

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        inspectSshConfiguration: () => atlasSshConfig(),
        readFile: async filePath =>
          path.resolve(filePath) === authPath ? weakenedAuth : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_AUTHENTICATION_CONTRACT_DRIFT');
  });

  it('refuses an Atlas alias with inherited forwarding or an unsafe hostname', async () => {
    for (const sshConfig of [
      `${atlasSshConfig()}localforward 15432 127.0.0.1:5432\n`,
      atlasSshConfig('atlas host'),
    ]) {
      const result = await runAtlasConfigurationAuthBoundary(
        { repoRoot },
        { inspectSshConfiguration: () => sshConfig }
      );
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.reasonCode, 'ATLAS_SSH_CONFIGURATION_UNSAFE');
    }
  });

  it('fails closed when the fixed Atlas alias cannot be inspected', async () => {
    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        inspectSshConfiguration: () => {
          throw new Error('missing alias');
        },
      }
    );

    assert.deepStrictEqual(result, {
      ok: false,
      status: 'failed',
      reasonCode: 'ATLAS_SSH_CONFIGURATION_UNAVAILABLE',
      message: 'The fixed atlas SSH alias could not be inspected without a network connection.',
    });
  });

  it('fails closed when committed sources are missing without attempting another source', async () => {
    let inspections = 0;
    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        readFile: async () => {
          throw new Error('missing');
        },
        inspectSshConfiguration: () => {
          inspections += 1;
          return atlasSshConfig();
        },
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_BOUNDARY_SOURCE_UNAVAILABLE');
    assert.strictEqual(inspections, 0);
  });

  it('keeps the implementation free of network, database, and migration clients', async () => {
    const implementation = await readFile(
      path.join(repoRoot, 'os-platform/core/pilot/localops-atlas-configuration-auth-boundary.mjs'),
      'utf8'
    );
    assert.doesNotMatch(
      implementation,
      /from\s+['"](?:node:(?:net|http|https)|pg|postgres|redis|ioredis)['"]|\bfetch\s*\(/i
    );
    assert.doesNotMatch(
      implementation,
      /\.Migrate\s*\(|dotnet\s+ef|child_process\.exec|shell:\s*true/i
    );
    assert.strictEqual(implementation.match(/\bspawnSync\s*\(/g)?.length, 1);
    assert.match(implementation, /spawnSync\('ssh', \['-G', ATLAS_SSH_ALIAS\]/);
  });
});
