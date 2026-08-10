import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const { runAtlasConfigurationAuthBoundary } =
  await import('../pilot/localops-atlas-configuration-auth-boundary.mjs');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const productionConfigPath = path.join(
  repoRoot,
  'backend/src/TerraFusion.API/appsettings.Production.json'
);
const programPath = path.join(repoRoot, 'backend/src/TerraFusion.API/Program.cs');
const authPath = path.join(
  repoRoot,
  'backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs'
);
const allowedBoundaryImports = ['node:fs/promises', 'node:path', 'node:url'];

function assertBoundaryImportsAreSafe(implementation) {
  const sourceFile = ts.createSourceFile(
    'localops-atlas-configuration-auth-boundary.mjs',
    implementation,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
  assert.deepStrictEqual(sourceFile.parseDiagnostics, []);
  const importedModules = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      assert.ok(ts.isStringLiteralLike(node.moduleSpecifier));
      importedModules.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      assert.strictEqual(node.arguments.length, 1);
      assert.ok(ts.isStringLiteralLike(node.arguments[0]));
      importedModules.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.deepStrictEqual(importedModules.sort(), allowedBoundaryImports);
}

describe('Atlas configuration and authentication boundary', () => {
  it('resolves the fixed Atlas endpoints and credential references without accessing state', async () => {
    const result = await runAtlasConfigurationAuthBoundary({ repoRoot });

    assert.deepStrictEqual(result, {
      ok: true,
      status: 'ready',
      boundary: 'atlas-configuration-auth',
      atlas: {
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
        subprocesses: false,
        networkConnections: false,
        databaseQueries: false,
        migrations: false,
        mutations: false,
      },
    });
  });

  it('fails closed before source inspection when secret-bearing input is supplied', async () => {
    let reads = 0;
    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot, password: 'must-not-be-read' },
      {
        readFile: async () => {
          reads += 1;
        },
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'INVALID_ATLAS_BOUNDARY_INPUT');
    assert.strictEqual(reads, 0);
    assert.doesNotMatch(JSON.stringify(result), /must-not-be-read/);
  });

  it('fails closed when the production database template drifts or embeds a credential', async () => {
    const actualConfig = JSON.parse(await readFile(productionConfigPath, 'utf8'));
    actualConfig.ConnectionStrings.DefaultConnection =
      'Host=${TF_DB_HOST};Database=terrafusion_production;Username=terrafusion;Password=literal';

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
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
        readFile: async filePath =>
          path.resolve(filePath) === authPath ? weakenedAuth : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_AUTHENTICATION_CONTRACT_DRIFT');
  });

  it('fails closed when JWT validation is disconnected from the configured secret key', async () => {
    const actualAuth = await readFile(authPath, 'utf8');
    const disconnectedSigningKey = actualAuth.replace(
      'IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))',
      'IssuerSigningKey = null'
    );
    assert.notStrictEqual(disconnectedSigningKey, actualAuth);

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        readFile: async filePath =>
          path.resolve(filePath) === authPath ? disconnectedSigningKey : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_AUTHENTICATION_CONTRACT_DRIFT');
  });

  it('ties the local override contract to the main WebApplication builder', async () => {
    const actualProgram = await readFile(programPath, 'utf8');
    const disconnectedMainOverride = actualProgram.replace(
      'builder.Configuration.AddJsonFile(\n    $"appsettings.{builder.Environment.EnvironmentName}.local.json",',
      'builder.Configuration.AddJsonFile(\n    $"appsettings.Disconnected.local.json",'
    );
    assert.notStrictEqual(disconnectedMainOverride, actualProgram);

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        readFile: async filePath =>
          path.resolve(filePath) === programPath
            ? disconnectedMainOverride
            : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_CONFIGURATION_CONTRACT_DRIFT');
  });

  it('ties DefaultConnection to the primary runtime resolver body', async () => {
    const actualProgram = await readFile(programPath, 'utf8');
    const disconnectedResolver = actualProgram.replace(
      'var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=terrafusion.db";',
      'var connectionString = "Data Source=other.db";'
    );
    assert.notStrictEqual(disconnectedResolver, actualProgram);

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        readFile: async filePath =>
          path.resolve(filePath) === programPath
            ? disconnectedResolver
            : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_CONFIGURATION_CONTRACT_DRIFT');
  });

  it('fails closed when authentication is not registered on the main API builder', async () => {
    const actualProgram = await readFile(programPath, 'utf8');
    const disconnectedAuthentication = actualProgram.replace(
      'builder.Services.AddTerraFusionAuthentication(builder.Configuration, builder.Environment);',
      '// authentication registration disconnected'
    );
    assert.notStrictEqual(disconnectedAuthentication, actualProgram);

    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        readFile: async filePath =>
          path.resolve(filePath) === programPath
            ? disconnectedAuthentication
            : readFile(filePath, 'utf8'),
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_AUTHENTICATION_CONTRACT_DRIFT');
  });

  it('fails closed when committed sources are missing without attempting another source', async () => {
    const result = await runAtlasConfigurationAuthBoundary(
      { repoRoot },
      {
        readFile: async () => {
          throw new Error('missing');
        },
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'ATLAS_BOUNDARY_SOURCE_UNAVAILABLE');
  });

  it('keeps the implementation free of network, database, and migration clients', async () => {
    const implementation = await readFile(
      path.join(repoRoot, 'os-platform/core/pilot/localops-atlas-configuration-auth-boundary.mjs'),
      'utf8'
    );
    assertBoundaryImportsAreSafe(implementation);
    assert.throws(() => assertBoundaryImportsAreSafe(`${implementation}\nimport 'pg';`));
    assert.throws(() =>
      assertBoundaryImportsAreSafe(`${implementation}\nawait import(targetModule);`)
    );
    assert.throws(() =>
      assertBoundaryImportsAreSafe(`${implementation}\nawait import/*gap*/(targetModule);`)
    );
    assert.throws(() => assertBoundaryImportsAreSafe(`${implementation}\nrequire('pg');`));
    assert.throws(() =>
      assertBoundaryImportsAreSafe(`${implementation}\nrequire/*gap*/(targetModule);`)
    );
    assert.doesNotMatch(implementation, /\bfetch\s*\(/i);
    assert.doesNotMatch(
      implementation,
      /\.Migrate\s*\(|dotnet\s+ef|child_process\.exec|shell:\s*true/i
    );
    assert.doesNotMatch(implementation, /\b(?:spawn|spawnSync|exec|execFile)\s*\(/);
  });
});
