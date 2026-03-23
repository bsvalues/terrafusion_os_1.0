export interface ToolManifestEntry {
  toolId: string;
  requiresConfirmation?: boolean;
  reasonCodeRequired?: boolean;
  reasonCodes?: string[];
  paramsSchema?: any;
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
}

export interface ExecutionContext {
  userId: string;
  userRoles?: string[];
  countyId?: string;
  confirmationProvided?: boolean;
}

export interface ValidationResult {
  allowed: boolean;
  errors: string[];
  requiresSupervisorApproval?: boolean;
}

export function validateInvocation(
  tool: ToolManifestEntry,
  ctx: ExecutionContext,
  params: Record<string, any>
): ValidationResult {
  const errors: string[] = [];

  // County match validation (if schema requires county)
  try {
    if (tool.paramsSchema && tool.paramsSchema.properties && tool.paramsSchema.properties.county) {
      const required = params && params.county;
      if (!required) {
        errors.push('missing required param: county');
      } else if (ctx.countyId && required !== ctx.countyId) {
        errors.push('county mismatch: execution context countyId does not match params.county');
      }
    }
  } catch (e) {
    errors.push('params schema validation failed');
  }

  // Confirmation requirement
  if (tool.requiresConfirmation) {
    if (!ctx.confirmationProvided) {
      errors.push('invocation requires confirmation');
    }
  }

  // Reason code
  if (tool.reasonCodeRequired) {
    const reason = params && (params.reasonCode || params.reason);
    if (!reason) {
      errors.push('invocation requires reasonCode');
    } else if (tool.reasonCodes && !tool.reasonCodes.includes(reason)) {
      errors.push('invalid reasonCode');
    }
  }

  // Supervisor approval
  if (tool.requiresSupervisorApproval) {
    const roles = ctx.userRoles || [];
    const allowed = (tool.supervisorRoles || []).some(r => roles.includes(r));
    if (!allowed) {
      return { allowed: false, errors: ['supervisor approval required'], requiresSupervisorApproval: true };
    }
  }

  return { allowed: errors.length === 0, errors };
}
