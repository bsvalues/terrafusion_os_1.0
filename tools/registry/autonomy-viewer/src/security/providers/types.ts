/**
 * TerraFusion Security Provider Interfaces
 * =========================================
 *
 * Phase IIIb: Provider seams for RBAC/audit enforcement.
 * Phase IIId: Attestation provider + NIST-aligned extensions.
 *
 * These interfaces define the contracts for:
 * - Principal resolution (who is acting)
 * - Approval evidence ingestion (TPI/break-glass/role-binding)
 * - Audit sink routing (where decisions are logged)
 * - Attestation/signing (KMS/HSM seam)
 * - NIST-aligned audit fields
 * - SBOM/provenance references
 *
 * By abstracting these concerns, KMS/HSM/IdP integration becomes
 * wiring—not redesign—while RBAC decision semantics remain identical.
 */

import type {
    BreakGlassResult,
    RoleBindingResult,
    TPIResult,
} from '../../../src/evidence-index.js';
import type { RbacTier } from '../rbac/rbac.js';

// ============================================================================
// Principal Resolution Provider
// ============================================================================

/**
 * Resolved principal identity.
 * Stable ID + roles/claims; no PII fields.
 */
export interface Principal {
  /** Stable identifier (e.g., OIDC sub, service account ID) */
  readonly id: string;
  /** Display-safe name (not PII; e.g., role or team name) */
  readonly displayName: string;
  /** Roles bound to this principal */
  readonly roles: readonly string[];
  /** Additional claims (key-value, all values are strings or arrays of strings) */
  readonly claims: Readonly<Record<string, string | readonly string[]>>;
  /** Provider that resolved this principal */
  readonly resolvedBy: string;
  /** ISO timestamp of resolution */
  readonly resolvedAt: string;
}

/**
 * Result of principal resolution.
 */
export interface PrincipalResolutionResult {
  readonly ok: boolean;
  readonly principal?: Principal;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/**
 * Context for principal resolution.
 */
export interface PrincipalResolutionContext {
  /** Action being attempted */
  readonly actionId: string;
  /** Invocation metadata */
  readonly invocationId?: string;
  /** Environment variables (subset) */
  readonly env: Readonly<Record<string, string | undefined>>;
}

/**
 * Provider interface for resolving the acting principal.
 */
export interface PrincipalResolutionProvider {
  /** Provider name (for audit trails) */
  readonly name: string;

  /**
   * Resolve the principal from context.
   * Must fail closed (return { ok: false } with error code) on any ambiguity.
   */
  resolve(context: PrincipalResolutionContext): Promise<PrincipalResolutionResult>;
}

// ============================================================================
// Approval Evidence Provider
// ============================================================================

/**
 * Normalized approval evidence bundle.
 */
export interface ApprovalEvidence {
  readonly tpi?: TPIResult;
  readonly breakGlass?: BreakGlassResult;
  readonly roleBinding?: RoleBindingResult;
}

/**
 * Result of approval evidence retrieval.
 */
export interface ApprovalEvidenceResult {
  readonly ok: boolean;
  readonly evidence?: ApprovalEvidence;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/**
 * Context for approval evidence retrieval.
 */
export interface ApprovalEvidenceContext {
  /** Action being attempted */
  readonly actionId: string;
  /** Authorization tier */
  readonly tier: RbacTier;
  /** Principal (if resolved) */
  readonly principal?: Principal;
  /** Profile name */
  readonly profile?: string;
  /** Environment variables (subset) */
  readonly env: Readonly<Record<string, string | undefined>>;
}

/**
 * Provider interface for retrieving approval evidence.
 */
export interface ApprovalEvidenceProvider {
  /** Provider name (for audit trails) */
  readonly name: string;

  /**
   * Retrieve approval evidence for the given context.
   * Must fail closed on any retrieval error.
   */
  retrieve(context: ApprovalEvidenceContext): Promise<ApprovalEvidenceResult>;
}

// ============================================================================
// Audit Routing Provider
// ============================================================================

/**
 * Audit sink configuration.
 */
export interface AuditSinkConfig {
  /** Sink type */
  readonly type: 'memory' | 'file' | 'stdout' | 'composite';
  /** File path (for file sink) */
  readonly path?: string;
  /** Child sinks (for composite) */
  readonly children?: readonly AuditSinkConfig[];
}

/**
 * Result of audit routing resolution.
 */
export interface AuditRoutingResult {
  readonly ok: boolean;
  readonly config?: AuditSinkConfig;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/**
 * Context for audit routing resolution.
 */
export interface AuditRoutingContext {
  /** Action being attempted */
  readonly actionId: string;
  /** Authorization tier */
  readonly tier?: RbacTier;
  /** Profile name */
  readonly profile?: string;
  /** Environment variables (subset) */
  readonly env: Readonly<Record<string, string | undefined>>;
}

/**
 * Provider interface for resolving audit sink configuration.
 */
export interface AuditRoutingProvider {
  /** Provider name (for audit trails) */
  readonly name: string;

  /**
   * Resolve the audit sink configuration.
   * Must return a valid config (defaults to memory sink if no preference).
   */
  resolve(context: AuditRoutingContext): Promise<AuditRoutingResult>;
}

// ============================================================================
// Security Context (Composition Root)
// ============================================================================

/**
 * Composed security context with all providers.
 */
export interface SecurityContext {
  readonly principalProvider: PrincipalResolutionProvider;
  readonly approvalsProvider: ApprovalEvidenceProvider;
  readonly auditProvider: AuditRoutingProvider;
}

/**
 * Options for creating security context.
 */
export interface SecurityContextOptions {
  /** Override principal provider (default: env-based) */
  principalProvider?: PrincipalResolutionProvider;
  /** Override approvals provider (default: env-based) */
  approvalsProvider?: ApprovalEvidenceProvider;
  /** Override audit routing provider (default: env-based) */
  auditProvider?: AuditRoutingProvider;
  /** Override attestation provider (default: noop) */
  attestationProvider?: AttestationProvider;
}

// ============================================================================
// Attestation Provider (Phase IIId)
// ============================================================================

/**
 * Supported attestation algorithms.
 * These align with NIST SP 800-186 recommendations.
 */
export type AttestationAlgorithm =
  | 'ECDSA-P256'
  | 'ECDSA-P384'
  | 'RSA-PSS-2048'
  | 'RSA-PSS-4096'
  | 'ED25519';

/**
 * Attestation (signature) to be embedded in audit events.
 */
export interface Attestation {
  /** Attestation type */
  readonly type: 'none' | 'external';
  /** Key identifier (for type='external') */
  readonly keyId?: string;
  /** Algorithm used (for type='external') */
  readonly algorithm?: AttestationAlgorithm;
  /** Base64-encoded signature (for type='external') */
  readonly signature?: string;
  /** ISO timestamp of attestation (for type='external') */
  readonly attestedAt?: string;
  /** Provider that created this attestation */
  readonly attestedBy?: string;
}

/**
 * Context for attestation signing.
 */
export interface AttestationSignContext {
  /** Canonical data to sign (already deterministically serialized) */
  readonly data: string;
  /** Digest algorithm used for data (default: SHA-256) */
  readonly digestAlgorithm?: 'SHA-256' | 'SHA-384' | 'SHA-512';
  /** Optional correlation ID for tracing */
  readonly correlationId?: string;
}

/**
 * Result of attestation signing.
 */
export interface AttestationSignResult {
  readonly ok: boolean;
  readonly attestation?: Attestation;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/**
 * Context for attestation verification.
 */
export interface AttestationVerifyContext {
  /** Canonical data that was signed */
  readonly data: string;
  /** Attestation to verify */
  readonly attestation: Attestation;
}

/**
 * Result of attestation verification.
 */
export interface AttestationVerifyResult {
  readonly ok: boolean;
  readonly valid?: boolean;
  /** Reason for invalid/error */
  readonly reason?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/**
 * Provider interface for cryptographic attestation (signing/verification).
 * This is the seam for KMS/HSM integration.
 */
export interface AttestationProvider {
  /** Provider name (for audit trails) */
  readonly name: string;

  /**
   * Sign data and produce an attestation.
   * For type='none' providers, returns { ok: true, attestation: { type: 'none' } }.
   */
  sign(context: AttestationSignContext): Promise<AttestationSignResult>;

  /**
   * Verify an attestation against data.
   * For type='none', returns { ok: true, valid: true } if attestation.type='none'.
   */
  verify(context: AttestationVerifyContext): Promise<AttestationVerifyResult>;
}

// ============================================================================
// Normalized Identity Claims (Phase IIId)
// ============================================================================

/**
 * Assurance levels aligned with NIST SP 800-63.
 * These represent authentication strength.
 */
export type AssuranceLevel = 'AAL1' | 'AAL2' | 'AAL3';

/**
 * Authentication context categories.
 */
export type AuthnContext =
  | 'password'
  | 'mfa'
  | 'certificate'
  | 'hardware-token'
  | 'biometric'
  | 'federated'
  | 'service-account';

/**
 * Normalized identity claims.
 * Any IdP can map into this shape; all fields are PII-safe.
 */
export interface NormalizedIdentityClaims {
  /** SHA-256 hash of subject identifier (never raw) */
  readonly subjectHash: string;
  /** Roles/permissions derived from IdP */
  readonly roles: readonly string[];
  /** Assurance level of authentication */
  readonly assuranceLevel?: AssuranceLevel;
  /** How the identity was authenticated */
  readonly authnContext?: AuthnContext;
  /** ISO timestamp of authentication */
  readonly authnTime?: string;
  /** Session hash (for session binding, never raw session ID) */
  readonly sessionHash?: string;
  /** IdP issuer identifier (URL or name) */
  readonly issuer?: string;
  /** Claims expiration time */
  readonly expiresAt?: string;
}

// ============================================================================
// NIST-Aligned Audit Field Extensions (Phase IIId)
// ============================================================================

/**
 * NIST audit event categories.
 * Aligned with NIST SP 800-53 AU-2/AU-3.
 */
export type NistEventCategory =
  | 'authentication'
  | 'authorization'
  | 'account-management'
  | 'data-access'
  | 'system-events'
  | 'privilege-use'
  | 'policy-change';

/**
 * NIST audit event outcome.
 */
export type NistEventOutcome = 'success' | 'failure' | 'unknown';

/**
 * NIST-aligned audit field extensions.
 * These are optional and extend the base audit event.
 */
export interface NistAuditExtensions {
  /** Event category (AU-2) */
  readonly eventCategory?: NistEventCategory;
  /** Event outcome (AU-3) */
  readonly eventOutcome?: NistEventOutcome;
  /** Privilege or permission exercised */
  readonly privilegeUsed?: string;
  /** Session binding hash (not raw session ID) */
  readonly sessionBindingHash?: string;
  /** Resource identifier affected */
  readonly resourceId?: string;
  /** Resource type */
  readonly resourceType?: string;
  /** Component/subsystem generating event */
  readonly component?: string;
  /** Environment (prod/staging/dev) */
  readonly environment?: string;
}

// ============================================================================
// SBOM/Provenance Attestation Seam (Phase IIId)
// ============================================================================

/**
 * SBOM format types.
 */
export type SbomFormat = 'spdx' | 'cyclonedx';

/**
 * Provenance attestation types.
 */
export type ProvenanceType = 'slsa' | 'sigstore' | 'in-toto';

/**
 * Reference to a supply chain attestation artifact.
 * This is a seam for future SBOM/provenance generation.
 */
export interface SupplyChainAttestationRef {
  /** Type of attestation */
  readonly type: 'sbom' | 'provenance' | 'build-attestation';
  /** Format (for SBOM) */
  readonly format?: SbomFormat;
  /** Provenance framework (for provenance) */
  readonly provenanceType?: ProvenanceType;
  /** SHA-256 hash of the attestation artifact */
  readonly artifactDigest: string;
  /** URI where attestation can be retrieved */
  readonly artifactUri?: string;
  /** Tool that generated the attestation */
  readonly generatorTool?: string;
  /** Version of the generator tool */
  readonly generatorVersion?: string;
  /** ISO timestamp of generation */
  readonly generatedAt?: string;
}

/**
 * Bundle of supply chain attestation references.
 * Placeholder for future SBOM/provenance integration.
 */
export interface SupplyChainBundle {
  /** Schema identifier */
  readonly schema: 'terrafusion.security.supply-chain.v1';
  /** SBOM reference (if available) */
  readonly sbom?: SupplyChainAttestationRef;
  /** Provenance reference (if available) */
  readonly provenance?: SupplyChainAttestationRef;
  /** Additional attestations */
  readonly additionalAttestations?: readonly SupplyChainAttestationRef[];
}
