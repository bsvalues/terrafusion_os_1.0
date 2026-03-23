export function validateInvocation(tool, ctx, params) {
  const errors = [];

  try {
    if (tool.paramsSchema && tool.paramsSchema.properties && tool.paramsSchema.properties.county) {
      const required = params && params.county;
      if (!required) {
        errors.push(`MISSING_PARAM:${'county'}`);
      } else if (ctx.countyId && required !== ctx.countyId) {
        errors.push('COUNTY_MISMATCH');
      }
    }
  } catch (e) {
    errors.push('PARAMS_SCHEMA_ERROR');
  }

  // If county mismatch detected, short-circuit with that canonical error
  if (errors.includes('COUNTY_MISMATCH')) {
    return { allowed: false, errors: ['COUNTY_MISMATCH'] };
  }

  if (tool.requiresConfirmation) {
    if (!ctx.confirmationProvided) {
      errors.push('CONFIRMATION_REQUIRED');
    }
  }

  if (tool.reasonCodeRequired) {
    const reason = (params && (params.reasonCode || params.reason)) || ctx.reasonCode;
    if (!reason) {
      errors.push('REASON_CODE_REQUIRED');
    } else if (tool.reasonCodes && !tool.reasonCodes.includes(reason)) {
      errors.push('INVALID_REASON_CODE');
    }
  }


  if (tool.requiresSupervisorApproval) {
    const roles = ctx.userRoles || [];
    const supervisorProvided = (params && params.supervisorApproval) || ctx.supervisorApproval;
    const allowed = (tool.supervisorRoles || []).some(r => roles.includes(r));
    if (!allowed && !supervisorProvided) {
      return { allowed: false, errors: ['SUPERVISOR_APPROVAL_REQUIRED'], requiresSupervisorApproval: true };
    }
  }

  return { allowed: errors.length === 0, errors };
}
