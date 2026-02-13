/**
 * Phase 12B - MCP PostGIS Routing
 *
 * Deterministic DSN resolution with cross-county and cross-environment isolation.
 *
 * Governance Contract:
 * - Counties are sovereign tenants (no cross-county data access)
 * - Environments are isolated (no staging→prod accidents)
 * - DSN resolution is deterministic (same inputs = same output)
 * - All routing produces immutable manifests with evidence trails
 */

import { createHash } from 'node:crypto';

/**
 * Data source configuration interface
 */
export interface DataSourceConfig {
  type: 'postgresql';
  host: string;
  port: number;
  database: string;
  schema: string;
  connectionPool?: {
    min: number;
    max: number;
  };
  readReplica?: {
    host: string;
    port: number;
  };
}

/**
 * Resolved routing result
 */
export interface ResolvedRouting {
  county: string;
  countyId?: string;
  environment: 'development' | 'staging' | 'production';
  dataSource: DataSourceConfig;
  dsnHash: string;
  policy: {
    allowedRisks: ('read' | 'write' | 'ddl')[];
    requireApprovalFor: ('write' | 'ddl')[];
    auditLevel: 'standard' | 'elevated' | 'critical';
  };
  resolvedAt: string;
}

/**
 * Routing manifest (immutable evidence artifact)
 */
export interface RoutingManifest {
  routingManifestVersion: string;
  county: string;
  environment: string;
  dsnHash: string;
  resolvedAt: string;
  source: string;
  manifestHash: string;
}

/**
 * Calculate DSN hash from connection parameters
 *
 * Hash format: SHA256(host:port/database) truncated to 16 chars
 * Excludes credentials for PII safety
 */
export function calculateDSNHash(dataSource: DataSourceConfig): string {
  const dsnString = `${dataSource.host}:${dataSource.port}/${dataSource.database}`;
  const hash = createHash('sha256').update(dsnString).digest('hex');
  return hash.substring(0, 16);
}

/**
 * Extract county from database name
 *
 * Expected format: terrafusion_{county}_{env}
 * Example: terrafusion_benton_dev → benton
 */
function extractCountyFromDatabase(database: string): string | null {
  const match = database.match(
    /^terrafusion_([a-z]+)_(?:dev|development|staging|prod|production)$/i
  );
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extract environment from database name
 *
 * Expected format: terrafusion_{county}_{env}
 * Example: terrafusion_benton_dev → development
 */
function extractEnvironmentFromDatabase(database: string): string | null {
  const match = database.match(/^terrafusion_[a-z]+_(dev|development|staging|prod|production)$/i);
  if (!match) return null;

  const env = match[1].toLowerCase();
  // Normalize aliases
  if (env === 'dev') return 'development';
  if (env === 'prod') return 'production';
  return env;
}

/**
 * Resolve data source for a county/environment pair
 *
 * Validates:
 * - County matches database name
 * - Environment matches database name
 * - DSN is deterministic (same inputs = same output)
 *
 * Throws:
 * - County mismatch: requested county doesn't match DSN
 * - Environment mismatch: requested env doesn't match DSN
 */
export async function resolveDataSource(
  requestedCounty: string,
  requestedEnvironment: string,
  dataSource: DataSourceConfig
): Promise<ResolvedRouting> {
  // Extract actual county/env from database name
  const actualCounty = extractCountyFromDatabase(dataSource.database);
  const actualEnvironment = extractEnvironmentFromDatabase(dataSource.database);

  // Validate county isolation
  if (!actualCounty) {
    throw new Error(
      `Invalid database name format: ${dataSource.database}. ` +
        `Expected: terrafusion_{county}_{environment}`
    );
  }

  if (actualCounty !== requestedCounty.toLowerCase()) {
    throw new Error(
      `County mismatch: requested ${requestedCounty} but DSN resolved to ${actualCounty}. ` +
        `Cross-county data access is forbidden.`
    );
  }

  // Validate environment isolation
  if (!actualEnvironment) {
    throw new Error(
      `Invalid database name format: ${dataSource.database}. ` +
        `Expected: terrafusion_{county}_{environment}`
    );
  }

  if (actualEnvironment !== requestedEnvironment.toLowerCase()) {
    throw new Error(
      `Environment mismatch: requested ${requestedEnvironment} but DSN resolved to ${actualEnvironment}. ` +
        `Cross-environment data access is forbidden.`
    );
  }

  // Calculate deterministic DSN hash
  const dsnHash = calculateDSNHash(dataSource);

  // Determine policy based on environment
  const policy = {
    allowedRisks: ['read'] as ('read' | 'write' | 'ddl')[],
    requireApprovalFor: [] as ('write' | 'ddl')[],
    auditLevel: 'standard' as 'standard' | 'elevated' | 'critical',
  };

  if (actualEnvironment === 'staging') {
    policy.allowedRisks.push('write');
    policy.requireApprovalFor.push('write');
    policy.auditLevel = 'elevated';
  } else if (actualEnvironment === 'production') {
    policy.allowedRisks.push('write');
    policy.requireApprovalFor.push('write', 'ddl');
    policy.auditLevel = 'critical';
  }

  return {
    county: requestedCounty,
    environment: requestedEnvironment as 'development' | 'staging' | 'production',
    dataSource,
    dsnHash,
    policy,
    resolvedAt: new Date().toISOString(),
  };
}

/**
 * Generate routing manifest (immutable evidence artifact)
 *
 * Manifest includes:
 * - County/environment context
 * - DSN hash (no credentials)
 * - Timestamp
 * - Self-hashing for drift detection
 */
export async function generateRoutingManifest(resolved: ResolvedRouting): Promise<RoutingManifest> {
  const manifest: Omit<RoutingManifest, 'manifestHash'> = {
    routingManifestVersion: '1.0.0',
    county: resolved.county,
    environment: resolved.environment,
    dsnHash: resolved.dsnHash,
    resolvedAt: resolved.resolvedAt,
    source: 'county-pack',
  };

  // Calculate manifest hash (excludes itself to avoid recursion)
  const manifestString = JSON.stringify(manifest, null, 2);
  const hash = createHash('sha256').update(manifestString).digest('hex');
  const manifestHash = hash.substring(0, 16);

  return {
    ...manifest,
    manifestHash,
  };
}
