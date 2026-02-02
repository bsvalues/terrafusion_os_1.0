/**
 * TerraFusion Security Provider Implementations
 * ==============================================
 *
 * Phase IIIc: File-based and offline-capable providers.
 * Phase IIId: Attestation provider + normalized claims helpers.
 *
 * These providers enable:
 * - Air-gapped exercises (StaticPrincipalProvider)
 * - County offline identity mapping (FilePrincipalProvider)
 * - Evidence-as-artifact chain (FileApprovalEvidenceProvider)
 * - KMS/HSM attestation seam (NoopAttestationProvider as default)
 *
 * All providers implement fail-closed semantics.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type {
    ApprovalEvidence,
    ApprovalEvidenceContext,
    ApprovalEvidenceProvider,
    ApprovalEvidenceResult,
    Attestation,
    AttestationProvider,
    AttestationSignContext,
    AttestationSignResult,
    AttestationVerifyContext,
    AttestationVerifyResult,
    AuditRoutingContext,
    AuditRoutingProvider,
    AuditRoutingResult,
    AuditSinkConfig,
    NormalizedIdentityClaims,
    Principal,
    PrincipalResolutionContext,
    PrincipalResolutionProvider,
    PrincipalResolutionResult,
} from './types.js';

// Re-export Entra provider for convenience
export {
    createMockIdToken,
    createMockJwks,
    EntraOidcPrincipalProvider,
    type EntraIdTokenClaims,
    type EntraOidcProviderConfig,
    type EntraOidcProviderDependencies,
    type Jwk,
    type JwkSet,
    type OidcDiscoveryDocument
} from './identity/entra-oidc.js';

// ============================================================================
// StaticPrincipalProvider
// ============================================================================

/**
 * Options for StaticPrincipalProvider.
 */
export interface StaticPrincipalProviderOptions {
  /** Static principal to return */
  readonly principal: Principal;
}

/**
 * Provider that returns a fixed principal.
 * Use case: air-gapped exercises, deterministic testing.
 */
export class StaticPrincipalProvider implements PrincipalResolutionProvider {
  readonly name = 'static';
  private readonly _principal: Principal;

  constructor(options: StaticPrincipalProviderOptions) {
    this._principal = options.principal;
  }

  async resolve(_context: PrincipalResolutionContext): Promise<PrincipalResolutionResult> {
    return {
      ok: true,
      principal: this._principal,
    };
  }
}

// ============================================================================
// FilePrincipalProvider
// ============================================================================

/**
 * Principal mapping entry in file.
 */
interface PrincipalMappingEntry {
  readonly id: string;
  readonly displayName: string;
  readonly roles: readonly string[];
  readonly claims?: Record<string, string | readonly string[]>;
}

/**
 * Principal mapping file schema.
 */
interface PrincipalMappingFile {
  readonly schema: string;
  readonly version: string;
  readonly principals: Record<string, PrincipalMappingEntry>;
}

/**
 * Options for FilePrincipalProvider.
 */
export interface FilePrincipalProviderOptions {
  /** Path to principal mapping JSON file */
  readonly mappingFilePath: string;
  /** Environment variable key for operator ID (default: TF_OPERATOR_ID) */
  readonly operatorIdEnvKey?: string;
}

const FILE_PRINCIPAL_SCHEMA = 'terrafusion.security.principal-mapping.v1';

/**
 * Provider that resolves principals from a JSON file.
 * Use case: county environments with offline operator identity mapping.
 */
export class FilePrincipalProvider implements PrincipalResolutionProvider {
  readonly name = 'file';
  private readonly _mappingFilePath: string;
  private readonly _operatorIdEnvKey: string;
  private _cache: PrincipalMappingFile | null = null;

  constructor(options: FilePrincipalProviderOptions) {
    this._mappingFilePath = resolve(options.mappingFilePath);
    this._operatorIdEnvKey = options.operatorIdEnvKey ?? 'TF_OPERATOR_ID';
  }

  async resolve(context: PrincipalResolutionContext): Promise<PrincipalResolutionResult> {
    // Get operator ID from environment
    const operatorId = context.env[this._operatorIdEnvKey];
    if (!operatorId) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Missing ${this._operatorIdEnvKey} environment variable`,
      };
    }

    // Load mapping file
    let mapping: PrincipalMappingFile;
    try {
      if (!this._cache) {
        const content = await readFile(this._mappingFilePath, 'utf-8');
        this._cache = JSON.parse(content) as PrincipalMappingFile;
      }
      mapping = this._cache;
    } catch (err) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Failed to load principal mapping: ${String(err)}`,
      };
    }

    // Validate schema
    if (mapping.schema !== FILE_PRINCIPAL_SCHEMA) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Invalid mapping schema: expected ${FILE_PRINCIPAL_SCHEMA}, got ${mapping.schema}`,
      };
    }

    // Look up principal
    const entry = mapping.principals[operatorId];
    if (!entry) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Unknown operator ID: ${operatorId}`,
      };
    }

    const principal: Principal = {
      id: entry.id,
      displayName: entry.displayName,
      roles: entry.roles,
      claims: entry.claims ?? {},
      resolvedBy: this.name,
      resolvedAt: new Date().toISOString(),
    };

    return { ok: true, principal };
  }

  /** Clear cached mapping (for testing) */
  clearCache(): void {
    this._cache = null;
  }
}

// ============================================================================
// EnvPrincipalProvider
// ============================================================================

/**
 * Options for EnvPrincipalProvider.
 */
export interface EnvPrincipalProviderOptions {
  /** Environment variable for principal ID (default: TF_PRINCIPAL_ID) */
  readonly principalIdEnvKey?: string;
  /** Environment variable for roles (comma-separated, default: TF_PRINCIPAL_ROLES) */
  readonly rolesEnvKey?: string;
  /** Allow anonymous principal when ID is missing (default: false) */
  readonly allowAnonymous?: boolean;
}

/**
 * Provider that resolves principal from environment variables.
 * Use case: CI/CD environments.
 */
export class EnvPrincipalProvider implements PrincipalResolutionProvider {
  readonly name = 'env';
  private readonly _principalIdEnvKey: string;
  private readonly _rolesEnvKey: string;
  private readonly _allowAnonymous: boolean;

  constructor(options: EnvPrincipalProviderOptions = {}) {
    this._principalIdEnvKey = options.principalIdEnvKey ?? 'TF_PRINCIPAL_ID';
    this._rolesEnvKey = options.rolesEnvKey ?? 'TF_PRINCIPAL_ROLES';
    this._allowAnonymous = options.allowAnonymous ?? false;
  }

  async resolve(context: PrincipalResolutionContext): Promise<PrincipalResolutionResult> {
    const principalId = context.env[this._principalIdEnvKey];

    if (!principalId && !this._allowAnonymous) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Missing ${this._principalIdEnvKey} environment variable`,
      };
    }

    const rolesRaw = context.env[this._rolesEnvKey] ?? '';
    const roles = rolesRaw
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const principal: Principal = {
      id: principalId ?? 'anonymous',
      displayName: principalId ? `Principal ${principalId}` : 'Anonymous',
      roles,
      claims: {},
      resolvedBy: this.name,
      resolvedAt: new Date().toISOString(),
    };

    return { ok: true, principal };
  }
}

// ============================================================================
// FileApprovalEvidenceProvider
// ============================================================================

/**
 * Approval evidence file schema.
 */
interface ApprovalEvidenceFile {
  readonly schema: string;
  readonly version: string;
  readonly tpi?: {
    readonly approvals: number;
    readonly approvers?: readonly string[];
    readonly policyVersion?: string;
  };
  readonly breakGlass?: {
    readonly activated: boolean;
    readonly reason?: string;
    readonly activatedAt?: string;
    readonly expiresAt?: string;
  };
  readonly roleBinding?: {
    readonly bound: boolean;
    readonly roles?: readonly string[];
    readonly policyVersion?: string;
  };
}

/**
 * Options for FileApprovalEvidenceProvider.
 */
export interface FileApprovalEvidenceProviderOptions {
  /** Base directory for evidence files */
  readonly evidenceDir: string;
  /** Evidence file name pattern (default: evidence-{actionId}.json) */
  readonly filePattern?: string;
}

const FILE_EVIDENCE_SCHEMA = 'terrafusion.security.approval-evidence.v1';

/**
 * Provider that loads approval evidence from JSON files.
 * Use case: courtroom chain-of-evidence scenarios.
 */
export class FileApprovalEvidenceProvider implements ApprovalEvidenceProvider {
  readonly name = 'file';
  private readonly _evidenceDir: string;
  private readonly _filePattern: string;

  constructor(options: FileApprovalEvidenceProviderOptions) {
    this._evidenceDir = resolve(options.evidenceDir);
    this._filePattern = options.filePattern ?? 'evidence-{actionId}.json';
  }

  async retrieve(context: ApprovalEvidenceContext): Promise<ApprovalEvidenceResult> {
    // Build file path
    const fileName = this._filePattern.replace('{actionId}', context.actionId.replace(/\./g, '-'));
    const filePath = join(this._evidenceDir, fileName);

    // Load file
    let evidenceFile: ApprovalEvidenceFile;
    try {
      const content = await readFile(filePath, 'utf-8');
      evidenceFile = JSON.parse(content) as ApprovalEvidenceFile;
    } catch (err) {
      // Missing file is not an error; it means no evidence
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          ok: true,
          evidence: {},
        };
      }
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Failed to load evidence file: ${String(err)}`,
      };
    }

    // Validate schema
    if (evidenceFile.schema !== FILE_EVIDENCE_SCHEMA) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Invalid evidence schema: expected ${FILE_EVIDENCE_SCHEMA}, got ${evidenceFile.schema}`,
      };
    }

    // Convert to ApprovalEvidence
    const evidence: ApprovalEvidence = {};

    if (evidenceFile.tpi) {
      Object.assign(evidence, {
        tpi: {
          approvals: evidenceFile.tpi.approvals,
          policyVersion: evidenceFile.tpi.policyVersion ?? '1.0.0',
        },
      });
    }

    if (evidenceFile.breakGlass) {
      Object.assign(evidence, {
        breakGlass: {
          activated: evidenceFile.breakGlass.activated,
          reason: evidenceFile.breakGlass.reason,
          activatedAt: evidenceFile.breakGlass.activatedAt,
          expiresAt: evidenceFile.breakGlass.expiresAt,
        },
      });
    }

    if (evidenceFile.roleBinding) {
      Object.assign(evidence, {
        roleBinding: {
          bound: evidenceFile.roleBinding.bound,
          roles: evidenceFile.roleBinding.roles ?? [],
          policyVersion: evidenceFile.roleBinding.policyVersion ?? '1.0.0',
        },
      });
    }

    return { ok: true, evidence };
  }
}

// ============================================================================
// EnvApprovalEvidenceProvider
// ============================================================================

/**
 * Options for EnvApprovalEvidenceProvider.
 */
export interface EnvApprovalEvidenceProviderOptions {
  /** Environment variable for TPI approvals (default: TF_TPI_APPROVALS) */
  readonly tpiApprovalsEnvKey?: string;
  /** Environment variable for break-glass flag (default: TF_BREAK_GLASS) */
  readonly breakGlassEnvKey?: string;
  /** Environment variable for role binding (default: TF_ROLE_BINDING) */
  readonly roleBindingEnvKey?: string;
}

/**
 * Provider that loads approval evidence from environment variables.
 * Use case: CI/CD and automated pipelines.
 */
export class EnvApprovalEvidenceProvider implements ApprovalEvidenceProvider {
  readonly name = 'env';
  private readonly _tpiApprovalsEnvKey: string;
  private readonly _breakGlassEnvKey: string;
  private readonly _roleBindingEnvKey: string;

  constructor(options: EnvApprovalEvidenceProviderOptions = {}) {
    this._tpiApprovalsEnvKey = options.tpiApprovalsEnvKey ?? 'TF_TPI_APPROVALS';
    this._breakGlassEnvKey = options.breakGlassEnvKey ?? 'TF_BREAK_GLASS';
    this._roleBindingEnvKey = options.roleBindingEnvKey ?? 'TF_ROLE_BINDING';
  }

  async retrieve(context: ApprovalEvidenceContext): Promise<ApprovalEvidenceResult> {
    const evidence: ApprovalEvidence = {};

    // TPI approvals
    const tpiApprovalsRaw = context.env[this._tpiApprovalsEnvKey];
    if (tpiApprovalsRaw) {
      const approvals = parseInt(tpiApprovalsRaw, 10);
      if (!isNaN(approvals) && approvals >= 0) {
        Object.assign(evidence, {
          tpi: { approvals, policyVersion: 'env' },
        });
      }
    }

    // Break-glass
    const breakGlassRaw = context.env[this._breakGlassEnvKey];
    if (breakGlassRaw) {
      const activated = breakGlassRaw.toLowerCase() === 'true' || breakGlassRaw === '1';
      Object.assign(evidence, {
        breakGlass: {
          activated,
          reason: activated ? 'env-triggered' : undefined,
        },
      });
    }

    // Role binding
    const roleBindingRaw = context.env[this._roleBindingEnvKey];
    if (roleBindingRaw) {
      const roles = roleBindingRaw
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);
      Object.assign(evidence, {
        roleBinding: { bound: roles.length > 0, roles, policyVersion: 'env' },
      });
    }

    return { ok: true, evidence };
  }
}

// ============================================================================
// EnvAuditRoutingProvider
// ============================================================================

/**
 * Options for EnvAuditRoutingProvider.
 */
export interface EnvAuditRoutingProviderOptions {
  /** Environment variable for sink type (default: TF_AUDIT_SINK) */
  readonly sinkTypeEnvKey?: string;
  /** Environment variable for file path (default: TF_AUDIT_FILE) */
  readonly filePathEnvKey?: string;
  /** Default sink type if not specified (default: memory) */
  readonly defaultSinkType?: 'memory' | 'file' | 'stdout';
}

/**
 * Provider that resolves audit routing from environment variables.
 */
export class EnvAuditRoutingProvider implements AuditRoutingProvider {
  readonly name = 'env';
  private readonly _sinkTypeEnvKey: string;
  private readonly _filePathEnvKey: string;
  private readonly _defaultSinkType: 'memory' | 'file' | 'stdout';

  constructor(options: EnvAuditRoutingProviderOptions = {}) {
    this._sinkTypeEnvKey = options.sinkTypeEnvKey ?? 'TF_AUDIT_SINK';
    this._filePathEnvKey = options.filePathEnvKey ?? 'TF_AUDIT_FILE';
    this._defaultSinkType = options.defaultSinkType ?? 'memory';
  }

  async resolve(context: AuditRoutingContext): Promise<AuditRoutingResult> {
    const sinkTypeRaw = context.env[this._sinkTypeEnvKey] ?? this._defaultSinkType;
    const sinkType = sinkTypeRaw as 'memory' | 'file' | 'stdout';

    if (!['memory', 'file', 'stdout'].includes(sinkType)) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Invalid sink type: ${sinkTypeRaw}`,
      };
    }

    const config: AuditSinkConfig = { type: sinkType };

    if (sinkType === 'file') {
      const filePath = context.env[this._filePathEnvKey];
      if (!filePath) {
        return {
          ok: false,
          errorCode: 'DENY_PROVIDER_ERROR',
          errorMessage: `${this._filePathEnvKey} required when sink is file`,
        };
      }
      Object.assign(config, { path: filePath });
    }

    return { ok: true, config };
  }
}

// ============================================================================
// TierBasedAuditRoutingProvider
// ============================================================================

/**
 * Options for TierBasedAuditRoutingProvider.
 */
export interface TierBasedAuditRoutingProviderOptions {
  /** Sink config for CI tier (default: memory) */
  readonly ciSink?: AuditSinkConfig;
  /** Sink config for merged tier (default: file) */
  readonly mergedSink?: AuditSinkConfig;
  /** Sink config for incident tier (default: composite file+stdout) */
  readonly incidentSink?: AuditSinkConfig;
  /** Default sink for unknown tiers (default: memory) */
  readonly defaultSink?: AuditSinkConfig;
}

/**
 * Provider that routes audit events based on authorization tier.
 * Use case: incident tier gets enhanced logging.
 */
export class TierBasedAuditRoutingProvider implements AuditRoutingProvider {
  readonly name = 'tier-based';
  private readonly _ciSink: AuditSinkConfig;
  private readonly _mergedSink: AuditSinkConfig;
  private readonly _incidentSink: AuditSinkConfig;
  private readonly _defaultSink: AuditSinkConfig;

  constructor(options: TierBasedAuditRoutingProviderOptions = {}) {
    this._ciSink = options.ciSink ?? { type: 'memory' };
    this._mergedSink = options.mergedSink ?? { type: 'file', path: './audit/merged.jsonl' };
    this._incidentSink = options.incidentSink ?? {
      type: 'composite',
      children: [{ type: 'file', path: './audit/incident.jsonl' }, { type: 'stdout' }],
    };
    this._defaultSink = options.defaultSink ?? { type: 'memory' };
  }

  async resolve(context: AuditRoutingContext): Promise<AuditRoutingResult> {
    let config: AuditSinkConfig;

    switch (context.tier) {
      case 'ci':
        config = this._ciSink;
        break;
      case 'merged':
        config = this._mergedSink;
        break;
      case 'incident':
        config = this._incidentSink;
        break;
      default:
        config = this._defaultSink;
    }

    return { ok: true, config };
  }
}

// ============================================================================
// Security Context Factory
// ============================================================================

/**
 * Supported identity provider types.
 * TF_IDP_PROVIDER environment variable selects which provider to use.
 */
export type IdpProviderType = 'env' | 'file' | 'entra' | 'oidc';

export interface CreateSecurityContextOptions {
  principalProvider?: PrincipalResolutionProvider;
  approvalsProvider?: ApprovalEvidenceProvider;
  auditProvider?: AuditRoutingProvider;
  attestationProvider?: AttestationProvider;
  /** Override IdP provider type (default: from TF_IDP_PROVIDER or 'env') */
  idpProvider?: IdpProviderType;
  /** Entra config (required when idpProvider='entra') */
  entraConfig?: {
    tenantId: string;
    clientId: string;
    issuer?: string;
    discoveryEndpoint?: string;
    bearerTokenEnvKey?: string;
  };
  /** File principal provider config (required when idpProvider='file') */
  fileConfig?: {
    mappingFilePath: string;
    operatorIdEnvKey?: string;
  };
}

/**
 * Create a principal provider based on IdP type selection.
 */
function createPrincipalProviderFromType(
  idpType: IdpProviderType,
  options: CreateSecurityContextOptions
): PrincipalResolutionProvider {
  switch (idpType) {
    case 'entra':
    case 'oidc':
      if (!options.entraConfig) {
        throw new Error(`${idpType} IdP requires entraConfig with tenantId and clientId`);
      }
      // Dynamic import would be better but for now we use static
      // EntraOidcPrincipalProvider is re-exported at top
      const { EntraOidcPrincipalProvider } = require('./identity/entra-oidc.js');
      return new EntraOidcPrincipalProvider({
        tenantId: options.entraConfig.tenantId,
        clientId: options.entraConfig.clientId,
        issuer: options.entraConfig.issuer,
        discoveryEndpoint: options.entraConfig.discoveryEndpoint,
        bearerTokenEnvKey: options.entraConfig.bearerTokenEnvKey,
      });

    case 'file':
      if (!options.fileConfig) {
        throw new Error('file IdP requires fileConfig with mappingFilePath');
      }
      return new FilePrincipalProvider({
        mappingFilePath: options.fileConfig.mappingFilePath,
        operatorIdEnvKey: options.fileConfig.operatorIdEnvKey,
      });

    case 'env':
    default:
      return new EnvPrincipalProvider();
  }
}

/**
 * Create a security context with default or custom providers.
 *
 * IdP selection (TF_IDP_PROVIDER or options.idpProvider):
 * - 'env': EnvPrincipalProvider (CI/CD, default)
 * - 'file': FilePrincipalProvider (air-gapped, county offline)
 * - 'entra': EntraOidcPrincipalProvider (Azure AD / Entra ID)
 * - 'oidc': EntraOidcPrincipalProvider (Generic OIDC, same code path)
 */
export function createSecurityContext(options: CreateSecurityContextOptions = {}): {
  principalProvider: PrincipalResolutionProvider;
  approvalsProvider: ApprovalEvidenceProvider;
  auditProvider: AuditRoutingProvider;
  attestationProvider: AttestationProvider;
} {
  // Determine IdP type from options or environment
  const idpType: IdpProviderType =
    options.idpProvider ?? (process.env['TF_IDP_PROVIDER'] as IdpProviderType | undefined) ?? 'env';

  // Select principal provider
  const principalProvider =
    options.principalProvider ?? createPrincipalProviderFromType(idpType, options);

  return {
    principalProvider,
    approvalsProvider: options.approvalsProvider ?? new EnvApprovalEvidenceProvider(),
    auditProvider: options.auditProvider ?? new EnvAuditRoutingProvider(),
    attestationProvider: options.attestationProvider ?? new NoopAttestationProvider(),
  };
}

// ============================================================================
// Attestation Provider (Phase IIId)
// ============================================================================

/**
 * No-operation attestation provider.
 * Default for systems without KMS/HSM.
 * Returns type='none' attestations which pass verification trivially.
 */
export class NoopAttestationProvider implements AttestationProvider {
  readonly name = 'noop';

  async sign(_context: AttestationSignContext): Promise<AttestationSignResult> {
    const attestation: Attestation = {
      type: 'none',
      attestedBy: this.name,
      attestedAt: new Date().toISOString(),
    };
    return { ok: true, attestation };
  }

  async verify(context: AttestationVerifyContext): Promise<AttestationVerifyResult> {
    // Noop provider only validates type='none' attestations
    if (context.attestation.type === 'none') {
      return { ok: true, valid: true };
    }

    // External attestations cannot be verified by noop provider
    return {
      ok: false,
      valid: false,
      errorCode: 'ATTESTATION_PROVIDER_MISMATCH',
      errorMessage: 'NoopAttestationProvider cannot verify external attestations',
    };
  }
}

// ============================================================================
// Normalized Identity Claims Helpers (Phase IIId)
// ============================================================================

/**
 * Hash a subject identifier to produce a PII-safe hash.
 */
export function hashSubjectIdentifier(subjectId: string): string {
  return 'sha256:' + createHash('sha256').update(subjectId).digest('hex');
}

/**
 * Hash a session identifier to produce a PII-safe hash.
 */
export function hashSessionIdentifier(sessionId: string): string {
  return 'sha256:' + createHash('sha256').update(sessionId).digest('hex');
}

/**
 * Options for creating normalized identity claims.
 */
export interface CreateNormalizedClaimsOptions {
  /** Raw subject identifier (will be hashed) */
  readonly subjectId: string;
  /** Roles to include */
  readonly roles: readonly string[];
  /** Assurance level */
  readonly assuranceLevel?: NormalizedIdentityClaims['assuranceLevel'];
  /** Authentication context */
  readonly authnContext?: NormalizedIdentityClaims['authnContext'];
  /** Authentication time */
  readonly authnTime?: string;
  /** Raw session ID (will be hashed if provided) */
  readonly sessionId?: string;
  /** IdP issuer */
  readonly issuer?: string;
  /** Claims expiration */
  readonly expiresAt?: string;
}

/**
 * Create normalized identity claims from raw inputs.
 * This ensures all identifiers are hashed and PII-safe.
 */
export function createNormalizedClaims(
  options: CreateNormalizedClaimsOptions
): NormalizedIdentityClaims {
  return {
    subjectHash: hashSubjectIdentifier(options.subjectId),
    roles: options.roles,
    assuranceLevel: options.assuranceLevel,
    authnContext: options.authnContext,
    authnTime: options.authnTime,
    sessionHash: options.sessionId ? hashSessionIdentifier(options.sessionId) : undefined,
    issuer: options.issuer,
    expiresAt: options.expiresAt,
  };
}
