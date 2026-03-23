import { validateInvocation } from './policy.js';

function preInvokeCheck(tool, ctx, params) {
  return validateInvocation(tool, ctx, params);
}

function mapTracePolicy(manifestPolicy) {
  switch (manifestPolicy) {
    case 'payload_ref':
      return 'payload_ref';
    case 'summary_only':
      return 'summary_only';
    default:
      return 'summary_only';
  }
}

function buildExecutionContextFromRequest(req, body) {
  return {
    userId: req.user?.id || 'anonymous',
    userRoles: req.user?.roles || [],
    countyId: req.headers?.['x-county-id'] || req.query?.county || undefined,
    confirmationProvided: body?.confirmation === true || req.query?.confirm === '1'
  };
}

export { preInvokeCheck, mapTracePolicy, buildExecutionContextFromRequest };
