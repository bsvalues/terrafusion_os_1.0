// GENERATED - DO NOT EDIT
function validateInvocation(tool, ctx, params) {
  const errors = [];

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

  if (tool.requiresConfirmation) {
    if (!ctx.confirmationProvided) {
      errors.push('invocation requires confirmation');
    }
  }

  if (tool.reasonCodeRequired) {
    const reason = params && (params.reasonCode || params.reason);
    if (!reason) {
      errors.push('invocation requires reasonCode');
    } else if (tool.reasonCodes && !tool.reasonCodes.includes(reason)) {
      errors.push('invalid reasonCode');
    }
  }

  if (tool.requiresSupervisorApproval) {
    const roles = ctx.userRoles || [];
    const allowed = (tool.supervisorRoles || []).some(r => roles.includes(r));
    if (!allowed) {
      return { allowed: false, errors: ['supervisor approval required'], requiresSupervisorApproval: true };
    }
  }

  return { allowed: errors.length === 0, errors };
}

export { validateInvocation };
