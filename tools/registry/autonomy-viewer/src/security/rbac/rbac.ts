import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BreakGlassResult, RoleBindingResult, TPIResult } from '../../evidence-index.js';
import {
    RBAC_DECISION_SCHEMA,
    RBAC_DECISION_VERSION,
} from '../../schemas/terrafusion.security.rbac-decision.v1.js';
import { ACTION_MAP, type RbacActionId } from './action-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_BREAK_GLASS_POLICY_PATH = resolve(
  __dirname,
  '..',
  '..',
  '..',
  'policy',
  'AUTONOMY_BREAK_GLASS_POLICY.json'
);
const DEFAULT_TPI_POLICY_PATH = resolve(
  __dirname,
  '..',
  '..',
  '..',
  'policy',
  'AUTONOMY_TPI_POLICY.json'
);

export type RbacTier = 'ci' | 'merged' | 'incident';

export type RbacReasonCode =
  | 'RBAC_DENY_DEFAULT'
  | 'RBAC_UNKNOWN_ACTION'
  | 'RBAC_POLICY_MISSING'
  | 'RBAC_POLICY_INVALID'
  | 'RBAC_TIER_NOT_ALLOWED'
  | 'RBAC_TPI_INSUFFICIENT_APPROVALS'
  | 'RBAC_BREAK_GLASS_REQUIRED'
  | 'RBAC_ROLE_BINDING_REQUIRED'
  | 'RBAC_AMBIGUOUS_CONTEXT';

export interface PolicyRef {
  readonly path: string;
  readonly version: string | null;
  readonly sha256: string | null;
}

export interface BreakGlassPolicy {
  readonly schema: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly allowedActions: string[];
  readonly requirements: {
    readonly minApprovals: number;
  };
  readonly roleBinding?: {
    readonly enabled: boolean;
    readonly requiredApproverRoles: string[];
  };
}

export interface TpiPolicy {
  readonly schema: string;
  readonly version: string;
  readonly enforcement: {
    readonly minApprovals: number;
  };
}

export interface RbacPolicySet {
  readonly breakGlass: BreakGlassPolicy;
  readonly tpi: TpiPolicy;
  readonly refs: {
    readonly breakGlass: PolicyRef;
    readonly tpi: PolicyRef;
  };
}

export interface RbacRequest {
  readonly actionId: RbacActionId;
  readonly tier?: RbacTier;
  readonly profile?: string;
  readonly tpi?: TPIResult;
  readonly breakGlass?: BreakGlassResult;
  readonly roleBinding?: RoleBindingResult;
  readonly now?: Date;
}

export interface RbacDecision {
  readonly schema: typeof RBAC_DECISION_SCHEMA;
  readonly version: typeof RBAC_DECISION_VERSION;
  readonly actionId: RbacActionId;
  readonly tier: RbacTier;
  readonly profile?: string;
  readonly allowed: boolean;
  readonly reasonCodes: RbacReasonCode[];
  readonly evaluatedAt: string;
  readonly policyRefs: {
    readonly breakGlass: PolicyRef;
    readonly tpi: PolicyRef;
  };
  readonly evidence: {
    readonly tpiOk: boolean | null;
    readonly breakGlassActivated: boolean | null;
    readonly roleBindingOk: boolean | null;
  };
}

export interface PolicyLoadResult {
  readonly ok: boolean;
  readonly policySet?: RbacPolicySet;
  readonly error?: string;
}

export function loadRbacPolicies(): PolicyLoadResult {
  const breakGlass = loadPolicyFile(DEFAULT_BREAK_GLASS_POLICY_PATH);
  if (!breakGlass.ok) {
    return { ok: false, error: breakGlass.error };
  }

  const tpi = loadPolicyFile(DEFAULT_TPI_POLICY_PATH);
  if (!tpi.ok) {
    return { ok: false, error: tpi.error };
  }

  const breakGlassPolicy = breakGlass.policy as BreakGlassPolicy;
  const tpiPolicy = tpi.policy as TpiPolicy;

  if (!isValidBreakGlassPolicy(breakGlassPolicy)) {
    return { ok: false, error: 'Invalid break-glass policy' };
  }

  if (!isValidTpiPolicy(tpiPolicy)) {
    return { ok: false, error: 'Invalid TPI policy' };
  }

  return {
    ok: true,
    policySet: {
      breakGlass: breakGlassPolicy,
      tpi: tpiPolicy,
      refs: {
        breakGlass: breakGlass.ref,
        tpi: tpi.ref,
      },
    },
  };
}

export function evaluateRbac(request: RbacRequest, policySet: RbacPolicySet): RbacDecision {
  const actionDefinition = Object.values(ACTION_MAP).find(
    entry => entry.actionId === request.actionId
  );

  if (!actionDefinition) {
    return buildDecision(request, policySet, false, ['RBAC_UNKNOWN_ACTION']);
  }

  if (!request.tier) {
    return buildDecision(request, policySet, false, ['RBAC_AMBIGUOUS_CONTEXT']);
  }

  const tier = request.tier;
  const reasonCodes: RbacReasonCode[] = [];

  const evidence = {
    tpiOk: request.tpi?.ok ?? null,
    breakGlassActivated: request.breakGlass?.activated ?? null,
    roleBindingOk: request.roleBinding?.ok ?? null,
  };

  const requiresTpi = tier !== 'ci';
  if (requiresTpi) {
    const tpiResult = request.tpi;
    const minApprovals = policySet.tpi.enforcement.minApprovals;
    const approvalCount = tpiResult?.approverLogins?.length ?? 0;

    if (!tpiResult || !tpiResult.ok || approvalCount < minApprovals) {
      reasonCodes.push('RBAC_TPI_INSUFFICIENT_APPROVALS');
    }
  }

  const breakGlassActivated = request.breakGlass?.activated === true;
  if (breakGlassActivated) {
    const breakGlass = request.breakGlass;
    const breakGlassOk = breakGlass
      ? Object.values(breakGlass.checks ?? {}).every(value => value === true)
      : false;
    const minApprovals = policySet.breakGlass.requirements.minApprovals;
    const approvalCount = breakGlass?.approvers?.length ?? 0;

    if (!policySet.breakGlass.enabled) {
      reasonCodes.push('RBAC_BREAK_GLASS_REQUIRED');
    } else if (!breakGlassOk || approvalCount < minApprovals) {
      reasonCodes.push('RBAC_BREAK_GLASS_REQUIRED');
    }

    if (actionDefinition.breakGlassAction) {
      const allowed = policySet.breakGlass.allowedActions.includes(
        actionDefinition.breakGlassAction
      );
      if (!allowed || breakGlass?.action !== actionDefinition.breakGlassAction) {
        reasonCodes.push('RBAC_BREAK_GLASS_REQUIRED');
      }
    } else {
      reasonCodes.push('RBAC_BREAK_GLASS_REQUIRED');
    }

    if (policySet.breakGlass.roleBinding?.enabled) {
      const requiredRoles = policySet.breakGlass.roleBinding.requiredApproverRoles;
      const satisfiedRoles = request.roleBinding?.satisfiedRoles ?? [];
      const missingRoles = requiredRoles.filter(role => !satisfiedRoles.includes(role));

      if (!request.roleBinding?.ok || missingRoles.length > 0) {
        reasonCodes.push('RBAC_ROLE_BINDING_REQUIRED');
      }
    }
  }

  if (reasonCodes.length > 0) {
    return buildDecision(request, policySet, false, reasonCodes, evidence);
  }

  return buildDecision(request, policySet, true, [], evidence);
}

function buildDecision(
  request: RbacRequest,
  policySet: RbacPolicySet,
  allowed: boolean,
  reasonCodes: RbacReasonCode[],
  evidenceOverrides?: {
    tpiOk: boolean | null;
    breakGlassActivated: boolean | null;
    roleBindingOk: boolean | null;
  }
): RbacDecision {
  const evaluatedAt = (request.now ?? new Date()).toISOString();
  const tier = request.tier ?? 'ci';

  const finalReasonCodes: RbacReasonCode[] = allowed
    ? reasonCodes
    : reasonCodes.length > 0
      ? reasonCodes
      : ['RBAC_DENY_DEFAULT'];

  return {
    schema: RBAC_DECISION_SCHEMA,
    version: RBAC_DECISION_VERSION,
    actionId: request.actionId,
    tier,
    profile: request.profile,
    allowed,
    reasonCodes: finalReasonCodes,
    evaluatedAt,
    policyRefs: {
      breakGlass: policySet.refs.breakGlass,
      tpi: policySet.refs.tpi,
    },
    evidence: evidenceOverrides ?? {
      tpiOk: request.tpi?.ok ?? null,
      breakGlassActivated: request.breakGlass?.activated ?? null,
      roleBindingOk: request.roleBinding?.ok ?? null,
    },
  };
}

function loadPolicyFile(path: string): {
  ok: boolean;
  policy?: unknown;
  ref?: PolicyRef;
  error?: string;
} {
  if (!existsSync(path)) {
    return { ok: false, error: `Policy missing: ${path}` };
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const policy = JSON.parse(content);
    const sha256 = createHash('sha256').update(content).digest('hex');

    return {
      ok: true,
      policy,
      ref: {
        path,
        version: typeof policy.version === 'string' ? policy.version : null,
        sha256,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: `Policy invalid: ${(err as Error).message}`,
    };
  }
}

function isValidBreakGlassPolicy(policy: BreakGlassPolicy): boolean {
  return (
    typeof policy === 'object' &&
    policy !== null &&
    typeof policy.version === 'string' &&
    typeof policy.enabled === 'boolean' &&
    Array.isArray(policy.allowedActions) &&
    typeof policy.requirements?.minApprovals === 'number'
  );
}

function isValidTpiPolicy(policy: TpiPolicy): boolean {
  return (
    typeof policy === 'object' &&
    policy !== null &&
    typeof policy.version === 'string' &&
    typeof policy.enforcement?.minApprovals === 'number'
  );
}
