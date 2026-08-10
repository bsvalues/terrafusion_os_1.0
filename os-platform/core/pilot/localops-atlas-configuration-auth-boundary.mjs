import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APPROVED_ATLAS_HOSTNAME = '192.168.1.156';
const PRODUCTION_CONFIG = 'backend/src/TerraFusion.API/appsettings.Production.json';
const PROGRAM_SOURCE = 'backend/src/TerraFusion.API/Program.cs';
const AUTH_SOURCE = 'backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs';
const DATABASE_TEMPLATE =
  'Host=${TF_DB_HOST};Database=terrafusion_production;Username=terrafusion;Password=${TF_DB_PASSWORD};Maximum Pool Size=100';
const REDIS_TEMPLATE = '${TF_REDIS_HOST}:6379,password=${TF_REDIS_PASSWORD}';

function problem(reasonCode, message) {
  return { ok: false, status: 'failed', reasonCode, message };
}

function validateInput(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return problem('INVALID_ATLAS_BOUNDARY_INPUT', 'Atlas boundary options must be an object.');
  }
  const keys = Object.keys(options);
  if (keys.some(key => key !== 'repoRoot')) {
    return problem(
      'INVALID_ATLAS_BOUNDARY_INPUT',
      'Atlas boundary proof accepts no credentials, connection strings, queries, or mutations.'
    );
  }
  if (typeof options.repoRoot !== 'string' || !path.isAbsolute(options.repoRoot)) {
    return problem('INVALID_ATLAS_BOUNDARY_INPUT', 'repoRoot must be an absolute path.');
  }
  return null;
}

function validateProductionConfiguration(source) {
  let configuration;
  try {
    configuration = JSON.parse(source);
  } catch {
    return false;
  }
  return (
    configuration?.ConnectionStrings?.DefaultConnection === DATABASE_TEMPLATE &&
    configuration?.ConnectionStrings?.TerraFusionDatabase === DATABASE_TEMPLATE &&
    configuration?.ConnectionStrings?.Redis === REDIS_TEMPLATE
  );
}

function withoutCSharpComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function validateProgramContract(source) {
  const uncommented = withoutCSharpComments(source);
  const mainBuilderStart = uncommented.indexOf('var builder = WebApplication.CreateBuilder(');
  const localConfigurationEnd = uncommented.indexOf(
    'static string ResolveSqliteConnectionString',
    mainBuilderStart
  );
  if (mainBuilderStart < 0 || localConfigurationEnd < 0) return false;
  const mainBuilderConfiguration = uncommented.slice(mainBuilderStart, localConfigurationEnd);
  const resolverStart = uncommented.indexOf(
    'static string ResolvePrimaryConnectionString',
    localConfigurationEnd
  );
  const resolverEnd = uncommented.indexOf('static bool TryReadBoolean', resolverStart);
  if (resolverStart < 0 || resolverEnd < 0) return false;
  const primaryResolver = uncommented.slice(resolverStart, resolverEnd);
  return (
    [
      /AddJsonFile\(\s*\$"appsettings\.\{builder\.Environment\.EnvironmentName\}\.local\.json"/s,
    ].every(pattern => pattern.test(mainBuilderConfiguration)) &&
    /configuration\.GetConnectionString\("DefaultConnection"\)\s*\?\?\s*"Data Source=terrafusion\.db"/.test(
      primaryResolver
    ) &&
    /return connectionString;/.test(primaryResolver) &&
    /ResolvePrimaryConnectionString\(builder\.Configuration, builder\.Environment\)/.test(
      uncommented.slice(resolverEnd)
    )
  );
}

function validateAuthenticationRegistration(source) {
  const uncommented = withoutCSharpComments(source);
  const mainBuilderStart = uncommented.indexOf('var builder = WebApplication.CreateBuilder(');
  return (
    mainBuilderStart >= 0 &&
    /builder\.Services\.AddTerraFusionAuthentication\(builder\.Configuration, builder\.Environment\);/.test(
      uncommented.slice(mainBuilderStart)
    )
  );
}

function validateAuthenticationContract(source) {
  const uncommented = withoutCSharpComments(source);
  return [
    /GetSection\("JwtSettings"\)/,
    /jwtSettings\["SecretKey"\]/,
    /var issuer = jwtSettings\["Issuer"\]/,
    /var audience = jwtSettings\["Audience"\]/,
    /JwtSettings__SecretKey/,
    /string\.IsNullOrWhiteSpace\(secretKey\) && !isDevelopment/,
    /throw new InvalidOperationException\(/,
    /DefaultAuthenticateScheme = JwtBearerDefaults\.AuthenticationScheme/,
    /ValidateIssuer = true/,
    /ValidateAudience = true/,
    /ValidateLifetime = true/,
    /ValidateIssuerSigningKey = true/,
    /ValidIssuer = issuer/,
    /ValidAudience = audience/,
    /IssuerSigningKey = new SymmetricSecurityKey\(Encoding\.UTF8\.GetBytes\(secretKey\)\)/,
    /FallbackPolicy = new AuthorizationPolicyBuilder\(\)\s*\.RequireAuthenticatedUser\(\)/s,
  ].every(pattern => pattern.test(uncommented));
}

export async function runAtlasConfigurationAuthBoundary(options, dependencies = {}) {
  const invalid = validateInput(options);
  if (invalid) return invalid;

  const readSource = dependencies.readFile ?? readFile;
  let productionConfiguration;
  let programSource;
  let authenticationSource;
  try {
    [productionConfiguration, programSource, authenticationSource] = await Promise.all([
      readSource(path.join(options.repoRoot, PRODUCTION_CONFIG), 'utf8'),
      readSource(path.join(options.repoRoot, PROGRAM_SOURCE), 'utf8'),
      readSource(path.join(options.repoRoot, AUTH_SOURCE), 'utf8'),
    ]);
  } catch {
    return problem(
      'ATLAS_BOUNDARY_SOURCE_UNAVAILABLE',
      'Required committed TerraFusion configuration sources are unavailable.'
    );
  }

  if (
    !validateProductionConfiguration(productionConfiguration) ||
    !validateProgramContract(programSource)
  ) {
    return problem(
      'ATLAS_CONFIGURATION_CONTRACT_DRIFT',
      'Committed TerraFusion database or configuration resolution contract has drifted.'
    );
  }
  if (!validateAuthenticationContract(authenticationSource)) {
    return problem(
      'ATLAS_AUTHENTICATION_CONTRACT_DRIFT',
      'Committed TerraFusion authentication contract has drifted.'
    );
  }
  if (!validateAuthenticationRegistration(programSource)) {
    return problem(
      'ATLAS_AUTHENTICATION_CONTRACT_DRIFT',
      'Committed TerraFusion authentication contract has drifted.'
    );
  }

  return {
    ok: true,
    status: 'ready',
    boundary: 'atlas-configuration-auth',
    atlas: {
      hostname: APPROVED_ATLAS_HOSTNAME,
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
  };
}

async function main() {
  const result = await runAtlasConfigurationAuthBoundary({ repoRoot: process.cwd() });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
