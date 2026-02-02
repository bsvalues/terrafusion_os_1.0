import type { BreakGlassResult, RoleBindingResult, TPIResult } from '../../evidence-index.js';
import {
    RBAC_DECISION_SCHEMA,
    RBAC_DECISION_VERSION,
} from '../../schemas/terrafusion.security.rbac-decision.v1.js';
import type { AuditLogger } from '../audit/audit-log.js';
import { createAuditDecisionEvent, createAuditLogger } from '../audit/audit-log.js';
import { createFileAuditSink, createMemoryAuditSink } from '../audit/audit-sinks.js';
import {
    evaluateRbac,
    loadRbacPolicies,
    type RbacDecision,
    type RbacRequest,
    type RbacTier,
} from './rbac.js';

export interface MutationGuardOptions {
  readonly request: RbacRequest;
  readonly logger?: AuditLogger;
}

export interface MutationGuardResult {
  readonly allowed: boolean;
  readonly decision: RbacDecision;
}

export function enforceMutationBoundary(
  actionId: RbacRequest['actionId'],
  profile?: string,
  logger?: AuditLogger
): MutationGuardResult {
  const request = resolveRbacRequestFromEnv(actionId, profile);
  return guardMutation({ request, logger });
}

export function guardMutation(
  options: MutationGuardOptions,
  execute?: () => void
): MutationGuardResult {
  const policyResult = loadRbacPolicies();

  if (!policyResult.ok || !policyResult.policySet) {
    const decision = buildPolicyFailureDecision(
      options.request,
      policyResult.error ?? 'Policy missing'
    );
    emitAudit(options.logger, decision);
    return { allowed: false, decision };
  }

  const decision = evaluateRbac(options.request, policyResult.policySet);
  emitAudit(options.logger, decision);

  if (!decision.allowed) {
    return { allowed: false, decision };
  }

  if (execute) {
    execute();
  }

  return { allowed: true, decision };
}

export function resolveRbacRequestFromEnv(
  actionId: RbacRequest['actionId'],
  profile?: string
): RbacRequest {
  return {
    actionId,
    profile,
    tier: parseTier(process.env.TF_RBAC_TIER),
    tpi: parseTpiResult(),
    breakGlass: parseBreakGlassResult(),
    roleBinding: parseRoleBindingResult(),
  };
}

export function resolveAuditLoggerFromEnv(): AuditLogger {
  const auditPath = process.env.AUDIT_LOG_PATH || process.env.TF_AUDIT_LOG_PATH || '';
  if (auditPath) {
    return createAuditLogger(createFileAuditSink({ path: auditPath }));
  }

  return createAuditLogger(createMemoryAuditSink());
}

function emitAudit(logger: AuditLogger | undefined, decision: RbacDecision): void {
  const activeLogger = logger ?? resolveAuditLoggerFromEnv();
  const event = createAuditDecisionEvent(decision, {
    actorId: process.env.TF_RBAC_ACTOR ?? undefined,
    correlationId: process.env.TF_RBAC_CORRELATION_ID ?? undefined,
  });

  activeLogger.append(event);
}

function buildPolicyFailureDecision(request: RbacRequest, error: string): RbacDecision {
  const policyRefs = {
    breakGlass: { path: '', version: null, sha256: null },
    tpi: { path: '', version: null, sha256: null },
  };
  const normalizedError = error.toLowerCase();

  return {
    schema: RBAC_DECISION_SCHEMA,
    version: RBAC_DECISION_VERSION,
    actionId: request.actionId,
    tier: request.tier ?? 'ci',
    profile: request.profile,
    allowed: false,
    reasonCodes: normalizedError.includes('invalid')
      ? ['RBAC_POLICY_INVALID']
      : ['RBAC_POLICY_MISSING'],
    evaluatedAt: (request.now ?? new Date()).toISOString(),
    policyRefs,
    evidence: {
      tpiOk: request.tpi?.ok ?? null,
      breakGlassActivated: request.breakGlass?.activated ?? null,
      roleBindingOk: request.roleBinding?.ok ?? null,
    },
  };
}

function parseTier(raw?: string): RbacTier | undefined {
  if (!raw) return undefined;
  if (raw === 'ci' || raw === 'merged' || raw === 'incident') {
    return raw;
  }
  return undefined;
}

function parseTpiResult(): TPIResult | undefined {
  if (!process.env.TF_RBAC_TPI_OK) return undefined;
  const approverCount = parseCount(process.env.TF_RBAC_TPI_APPROVER_COUNT);
  const minApprovals = parseCount(process.env.TF_RBAC_TPI_MIN_APPROVALS);
  const count = Math.max(approverCount, minApprovals);

  return {
    ok: process.env.TF_RBAC_TPI_OK === '1',
    minApprovals: minApprovals,
    approverLogins: buildPlaceholderApprovers(count),
    policyVersion: process.env.TF_RBAC_TPI_POLICY_VERSION ?? 'env',
    evaluatedAt: new Date().toISOString(),
  };
}

function parseBreakGlassResult(): BreakGlassResult | undefined {
  if (!process.env.TF_RBAC_BREAK_GLASS_OK) return undefined;
  const approverCount = parseCount(process.env.TF_RBAC_BREAK_GLASS_APPROVER_COUNT);

  return {
    activated: true,
    reason: process.env.TF_RBAC_BREAK_GLASS_REASON ?? 'unspecified',
    action: (process.env.TF_RBAC_BREAK_GLASS_ACTION as BreakGlassResult['action']) ?? 'unknown',
    approvers: buildPlaceholderApprovers(approverCount),
    approvalsRequired: parseCount(process.env.TF_RBAC_BREAK_GLASS_MIN_APPROVALS),
    policySha: process.env.TF_RBAC_BREAK_GLASS_POLICY_SHA ?? '',
    policyVersion: process.env.TF_RBAC_BREAK_GLASS_POLICY_VERSION ?? 'env',
    evaluatedAt: new Date().toISOString(),
    checks: {
      pinned: process.env.TF_RBAC_BREAK_GLASS_CHECKS_OK === '1',
      rekor: process.env.TF_RBAC_BREAK_GLASS_CHECKS_OK === '1',
      verifyBundleStrict: process.env.TF_RBAC_BREAK_GLASS_CHECKS_OK === '1',
      rollbackVerified: process.env.TF_RBAC_BREAK_GLASS_CHECKS_OK === '1',
      noAutomerge: process.env.TF_RBAC_BREAK_GLASS_CHECKS_OK === '1',
    },
  };
}

function parseRoleBindingResult(): RoleBindingResult | undefined {
  if (!process.env.TF_RBAC_ROLE_BINDING_OK) return undefined;
  const requiredRoles = parseCsv(process.env.TF_RBAC_ROLE_BINDING_REQUIRED);
  const satisfiedRoles = parseCsv(process.env.TF_RBAC_ROLE_BINDING_SATISFIED);

  return {
    ok: process.env.TF_RBAC_ROLE_BINDING_OK === '1',
    requiredRoles,
    satisfiedRoles,
    missingRoles: requiredRoles.filter(role => !satisfiedRoles.includes(role)),
    approverRoles: {
      security: [],
      cio: [],
      engineering: [],
    },
    approvalCountEligible: parseCount(process.env.TF_RBAC_ROLE_BINDING_APPROVER_COUNT),
    excludedApprovers: [],
    approverSource: process.env.TF_RBAC_ROLE_BINDING_SOURCE ?? 'env',
    evaluatedAt: new Date().toISOString(),
  };
}

function parseCount(value?: string): number {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}

function buildPlaceholderApprovers(count: number): string[] {
  const safeCount = Math.max(0, count);
  return Array.from({ length: safeCount }, (_value, index) => `approver-${index + 1}`);
}
