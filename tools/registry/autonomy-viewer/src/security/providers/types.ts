/**
 * TerraFusion Security Provider Interfaces
 * =========================================
 *
 * Phase IIIb: Provider seams for RBAC/audit enforcement.
 *
 * These interfaces define the contracts for:
 * - Principal resolution (who is acting)
 * - Approval evidence ingestion (TPI/break-glass/role-binding)
 * - Audit sink routing (where decisions are logged)
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
}
