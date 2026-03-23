import { ToolManifestEntry, ExecutionContext, ValidationResult, validateInvocation } from './policy';

export type TracePolicy = 'summary_only' | 'payload_ref' | 'full_payload';

export function preInvokeCheck(
  tool: ToolManifestEntry,
  ctx: ExecutionContext,
  params: Record<string, any>
): ValidationResult {
  // Run policy validations
  return validateInvocation(tool, ctx, params);
}

export function mapTracePolicy(manifestPolicy: string): TracePolicy {
  switch (manifestPolicy) {
    case 'payload_ref':
      return 'payload_ref';
    case 'summary_only':
      return 'summary_only';
    default:
      return 'summary_only';
  }
}

export function buildExecutionContextFromRequest(req: any): ExecutionContext {
  // Minimal adapter: extract authenticated user, roles, county, and confirmation flag
  return {
    userId: req.user?.id || 'anonymous',
    userRoles: req.user?.roles || [],
    countyId: req.headers?.['x-county-id'] || req.query?.county || undefined,
    confirmationProvided: req.body?.confirmation === true || req.query?.confirm === '1'
  };
}
