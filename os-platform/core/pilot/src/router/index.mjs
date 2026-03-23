import { validateInvocation } from './policy.mjs';

export function preInvokeCheck(tool, ctx, params) {
  return validateInvocation(tool, ctx, params);
}

export function mapTracePolicy(manifestPolicy) {
  switch (manifestPolicy) {
    case 'payload_ref':
      return 'payload_ref';
    case 'summary_only':
      return 'summary_only';
    default:
      return 'summary_only';
  }
}

export function buildExecutionContextFromRequest(req, body) {
  const rolesHeader = req.headers?.['x-role'] || req.headers?.['x-roles'];
  const roles = [];
  if (Array.isArray(rolesHeader)) {
    for (const r of rolesHeader) {
      roles.push(...String(r).split(',').map(s => s.trim()).filter(Boolean));
    }
  } else if (rolesHeader) {
    roles.push(...String(rolesHeader).split(',').map(s => s.trim()).filter(Boolean));
  }

  return {
    userId: req.user?.id || req.headers?.['x-user-id'] || 'anonymous',
    userRoles: req.user?.roles || roles,
    countyId: req.headers?.['x-county-id'] || req.query?.county || undefined,
    confirmationProvided: body?.confirmation === true || req.query?.confirm === '1',
    supervisorApproval: body?.supervisorApproval || null,
    reasonCode: body?.reasonCode || body?.reason || null,
  };
}
