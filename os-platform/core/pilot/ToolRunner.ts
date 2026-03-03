/**
 * TerraFusion OS - Tool Runner
 *
 * Runtime enforcement layer for Gates 4-6.
 * Validates tool invocations before execution and traces results.
 *
 * Gate 4: Write-lane assertions
 * Gate 5: RiskPolicy enforcement
 * Gate 6: PII sanitization / trace policy
 */

import { randomUUID } from 'crypto';
import { traceService, TraceService } from '../trace/TraceService.js';
import type {
  CommandGovernanceMeta,
  MutationClass,
  PolicyDecision,
  PreflightPolicy,
} from '../types/commandGovernance.js';
import { createPreflight } from './ToolRunner.preflight.js';
import type {
    Tool,
    ToolExecutionContext,
    ToolExecutionInput,
    ToolExecutionResult,
    TraceEventInput,
} from '../types/index.js';
import { toolRegistry, ToolRegistry } from './ToolRegistry.js';

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  // Gate 4: Write Lane
  WRITE_LANE_MISMATCH: 'WRITE_LANE_MISMATCH',
  WRITE_LANE_REQUIRED: 'WRITE_LANE_REQUIRED',

  // Gate 5: Risk Policy
  CONFIRMATION_REQUIRED: 'CONFIRMATION_REQUIRED',
  REASON_CODE_REQUIRED: 'REASON_CODE_REQUIRED',
  REASON_CODE_INVALID: 'REASON_CODE_INVALID',
  SUPERVISOR_APPROVAL_REQUIRED: 'SUPERVISOR_APPROVAL_REQUIRED',
  SUPERVISOR_ROLE_INVALID: 'SUPERVISOR_ROLE_INVALID',

  // Gate 5b: RBAC Permission
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Gate 6: PII / Trace
  PAYLOAD_STORE_REQUIRED: 'PAYLOAD_STORE_REQUIRED',

  // General
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  MODE_MISMATCH: 'MODE_MISMATCH',
  POLICY_DENIED: 'POLICY_DENIED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export type RunnerErrorCode =
  | 'MODE_DENIED'
  | 'COUNTY_MISMATCH'
  | 'VALIDATION'
  | 'PII_BLOCKED'
  | 'EXECUTION_FAILED'
  | 'TOOL_NOT_FOUND'
  | 'PERMISSION_DENIED';

export class ToolRunnerError extends Error {
  constructor(
    public readonly code: RunnerErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ToolRunnerError';
  }
}

// ============================================================================
// Enforcement Functions
// ============================================================================

/**
 * Gate 4: Write-lane validation
 */
function enforceWriteLane(tool: Tool, context: ToolExecutionContext): string[] {
  const violations: string[] = [];

  // Read-only tools skip write lane checks
  if (tool.risk === 'read_only') {
    return violations;
  }

  // Write tools must have a write lane
  if (tool.writeLane === null || tool.writeLane === undefined) {
    violations.push(`[${ErrorCodes.WRITE_LANE_REQUIRED}] Tool ${tool.toolId} requires a writeLane`);
    return violations;
  }

  // Write lane must match suite (or be in crossSuiteReads)
  if (tool.writeLane !== tool.suite) {
    if (!tool.crossSuiteReads?.includes(tool.writeLane)) {
      violations.push(
        `[${ErrorCodes.WRITE_LANE_MISMATCH}] Tool ${tool.toolId}: writeLane (${tool.writeLane}) must match suite (${tool.suite})`
      );
    }
  }

  return violations;
}

/**
 * Gate 5: Risk policy validation
 */
function enforceRiskPolicy(tool: Tool, context: ToolExecutionContext): string[] {
  const violations: string[] = [];

  // Confirmation check for write_low and above
  if (tool.requiresConfirmation && !context.confirmation) {
    violations.push(
      `[${ErrorCodes.CONFIRMATION_REQUIRED}] Tool ${tool.toolId} requires confirmation`
    );
  }

  // write_high: reason code required
  if (tool.risk === 'write_high' || tool.reasonCodeRequired) {
    if (!context.reasonCode) {
      violations.push(
        `[${ErrorCodes.REASON_CODE_REQUIRED}] Tool ${tool.toolId} requires a reason code`
      );
    } else if (tool.reasonCodes && !tool.reasonCodes.includes(context.reasonCode)) {
      violations.push(
        `[${ErrorCodes.REASON_CODE_INVALID}] Reason code "${context.reasonCode}" not in allowed list: ${tool.reasonCodes.join(', ')}`
      );
    }
  }

  // irreversible: supervisor approval required
  if (tool.risk === 'irreversible') {
    if (!context.supervisorApproval) {
      violations.push(
        `[${ErrorCodes.SUPERVISOR_APPROVAL_REQUIRED}] Tool ${tool.toolId} requires supervisor approval`
      );
    } else if (tool.supervisorRoles) {
      const approverRole = context.supervisorApproval.role;
      if (!tool.supervisorRoles.includes(approverRole)) {
        violations.push(
          `[${ErrorCodes.SUPERVISOR_ROLE_INVALID}] Supervisor role "${approverRole}" not in allowed list: ${tool.supervisorRoles.join(', ')}`
        );
      }
    }
  }

  return violations;
}

/**
 * Gate 6: PII/Trace policy validation
 */
function enforcePiiPolicy(tool: Tool): string[] {
  const violations: string[] = [];

  // payload_ref requires payloadStore
  if (tool.tracePolicy === 'payload_ref' && !tool.payloadStore) {
    violations.push(
      `[${ErrorCodes.PAYLOAD_STORE_REQUIRED}] Tool ${tool.toolId}: payload_ref trace policy requires payloadStore`
    );
  }

  return violations;
}

// ============================================================================
// Gate 5b: RBAC Permission Enforcement (ported from packages/os-core)
// ============================================================================

/**
 * Role → claims mapping per ROLE_VOCABULARY.md contract.
 * This is the canonical source; if the contract changes, update here.
 */
const ROLE_CLAIMS: Record<string, string[]> = {
  viewer:        ['read:parcel', 'read:dossier'],
  appraiser:     ['read:parcel', 'read:dossier', 'write:forge', 'write:dossier'],
  supervisor:    ['read:parcel', 'read:dossier', 'write:forge', 'write:dossier', 'write:dais', 'approve:irreversible'],
  administrator: ['read:parcel', 'read:dossier', 'write:forge', 'write:dossier', 'write:dais', 'approve:irreversible', 'admin:trace', 'admin:system'],
  auditor:       ['read:parcel', 'read:dossier', 'read:trace', 'audit:all'],
};

/**
 * Derive the claims a tool requires based on its manifest properties.
 */
function deriveRequiredClaims(tool: Tool): string[] {
  const claims: string[] = [];

  // Read tools need read claims for their touch targets
  if (tool.touches?.includes('parcel')) claims.push('read:parcel');
  if (tool.touches?.includes('dossier')) claims.push('read:dossier');

  // Write tools need write claims for their suite
  // OS-lane tools are governed by admin:trace (no write:os claim in vocabulary)
  if (tool.writeLane && tool.writeLane !== 'os') {
    claims.push(`write:${tool.writeLane}`);
  }

  // Irreversible tools need approval claim
  if (tool.risk === 'irreversible') {
    claims.push('approve:irreversible');
  }

  // Trace admin tools
  if (tool.suite === 'os' && tool.touches?.includes('workflow') && tool.risk !== 'read_only') {
    claims.push('admin:trace');
  }

  return [...new Set(claims)];
}

/**
 * Resolve effective claims for a user's roles.
 */
function resolveClaimsForRoles(roles: string[]): Set<string> {
  const claims = new Set<string>();
  for (const role of roles) {
    const roleClaims = ROLE_CLAIMS[role.toLowerCase()];
    if (roleClaims) {
      for (const c of roleClaims) claims.add(c);
    }
  }
  return claims;
}

/**
 * Gate 5b: RBAC permission check.
 * Derives required claims from tool manifest and checks against user's roles.
 */
function enforceRbacPermissions(tool: Tool, context: ToolExecutionContext): string[] {
  const violations: string[] = [];

  const required = deriveRequiredClaims(tool);
  if (required.length === 0) return violations;

  const userClaims = resolveClaimsForRoles(context.roles);
  const missing = required.filter(c => !userClaims.has(c));

  if (missing.length > 0) {
    violations.push(
      `[${ErrorCodes.PERMISSION_DENIED}] User lacks claims: ${missing.join(', ')} (required by ${tool.toolId})`
    );
  }

  return violations;
}

// ============================================================================
// ToolRunner Class
// ============================================================================

export type ToolHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
  context: ToolExecutionContext,
  tool: Tool
) => Promise<TResult>;

export interface ToolRunnerOptions {
  registry?: ToolRegistry;
  trace?: TraceService;
  preflightPolicy?: PreflightPolicy;
}

export class ToolRunner {
  private registry: ToolRegistry;
  private trace: TraceService;
  private handlers: Map<string, ToolHandler> = new Map();
  private preflight: ReturnType<typeof createPreflight>;

  constructor(options: ToolRunnerOptions = {}) {
    this.registry = options.registry ?? toolRegistry;
    this.trace = options.trace ?? traceService;
    this.preflight = createPreflight(options.preflightPolicy);
  }

  /**
   * Canonical execution path.
   * Centralizes mode + county enforcement and returns a normalized result shape.
   */
  async run<TParams = Record<string, unknown>, TResult = unknown>(
    toolId: string,
    params: TParams,
    context: ToolExecutionContext
  ): Promise<{
    ok: true;
    toolId: string;
    suite: Tool['suite'];
    mode: Tool['mode'];
    risk: Tool['risk'];
    result: TResult;
    payloadRef?: string;
    traceId?: string;
  }> {
    const county = (params as { county?: string }).county;
    if (!county || typeof county !== 'string') {
      throw new ToolRunnerError('VALIDATION', 'county is required');
    }
    if (!context.countyId || county.toLowerCase() !== context.countyId.toLowerCase()) {
      throw new ToolRunnerError('COUNTY_MISMATCH', 'County mismatch');
    }

    const tool = this.registry.getTool(toolId);
    if (!tool) {
      throw new ToolRunnerError('TOOL_NOT_FOUND', `Tool not found: ${toolId}`);
    }

    const outcome = await this.execute({ toolId, params, context });
    if (!outcome.ok) {
      const failure = outcome as Extract<ToolExecutionResult<TResult>, { ok: false }>;
      const failureCode = (Object.values(ErrorCodes) as string[]).includes(failure.errorCode)
        ? (failure.errorCode as ErrorCode)
        : ErrorCodes.EXECUTION_FAILED;
      const mapped = mapErrorCode(failureCode);
      throw new ToolRunnerError(mapped, failure.error);
    }

    const payloadRef = (outcome.result as { payloadRef?: string })?.payloadRef;
    return {
      ok: true,
      toolId,
      suite: tool.suite,
      mode: tool.mode,
      risk: tool.risk,
      result: outcome.result as TResult,
      payloadRef,
      traceId: outcome.traceEventId,
    };
  }

  /**
   * Register a handler for a tool.
   */
  registerHandler<TParams = unknown, TResult = unknown>(
    toolId: string,
    handler: ToolHandler<TParams, TResult>
  ): void {
    if (!this.registry.isInitialized()) {
      throw new Error('ToolRegistry must be initialized before registering handlers');
    }
    // Verify tool exists
    this.registry.requireTool(toolId);
    this.handlers.set(toolId, handler as ToolHandler);
  }

  /**
   * Execute a tool with full enforcement and tracing.
   */
  async execute<TParams = unknown, TResult = unknown>(
    input: ToolExecutionInput<TParams>
  ): Promise<ToolExecutionResult<TResult>> {
    const correlationId = randomUUID();
    const { toolId, params, context } = input;

    // Lookup tool
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      return this.fail(correlationId, ErrorCodes.TOOL_NOT_FOUND, `Tool not found: ${toolId}`);
    }

    // Mode check
    if (tool.mode && tool.mode !== context.mode) {
      return this.fail(
        correlationId,
        ErrorCodes.MODE_MISMATCH,
        `Tool ${toolId} requires mode "${tool.mode}" but got "${context.mode}"`
      );
    }

    // Optional preflight policy gate (additive, defaults to allow)
    const governance = (tool as Tool & { governance?: CommandGovernanceMeta }).governance;
    const preflight = this.preflight.decide({
      toolId,
      correlationId,
      governance,
      requestedMutation: mutationFromRisk(tool.risk),
    });
    if (preflight.allow !== true) {
      // Narrow to denial branch for TS discriminated union compat
      const denied = preflight as Extract<PolicyDecision, { allow: false }>;
      this.emitTraceEvent(tool, 'tool_failed', correlationId, context, {
        summary: `Policy denied ${toolId}: ${denied.reason}`,
        errorCode: ErrorCodes.POLICY_DENIED,
        component: 'ToolRunner',
      });
      return this.fail(correlationId, ErrorCodes.POLICY_DENIED, denied.reason);
    }

    // Collect all enforcement violations
    const violations: string[] = [
      ...enforceWriteLane(tool, context),
      ...enforceRiskPolicy(tool, context),
      ...enforceRbacPermissions(tool, context),
      ...enforcePiiPolicy(tool),
    ];

    if (violations.length > 0) {
      // Extract error code from first violation
      const errorCode =
        (violations[0].match(/\[([A-Z_]+)\]/)?.[1] as ErrorCode) ?? ErrorCodes.EXECUTION_FAILED;

      // Trace the enforcement failure
      this.emitTraceEvent(tool, 'tool_failed', correlationId, context, {
        summary: `Enforcement failed: ${violations.length} violation(s)`,
        errorCode,
        component: 'ToolRunner',
      });

      return this.fail(correlationId, errorCode, violations.join('; '));
    }

    // Emit invocation trace
    const invokeEvent = this.emitTraceEvent(tool, 'tool_invoked', correlationId, context, {
      summary: `Invoking ${toolId} (risk: ${tool.risk})`,
      rawPayload: params,
    });

    // Execute handler
    const handler = this.handlers.get(toolId);
    if (!handler) {
      return this.fail(
        correlationId,
        ErrorCodes.EXECUTION_FAILED,
        `No handler registered for ${toolId}`
      );
    }

    try {
      const result = await handler(params, context, tool);

      // Emit success trace
      const completeEvent = this.emitTraceEvent(tool, 'tool_completed', correlationId, context, {
        summary: `Completed ${toolId}`,
        rawPayload: result,
      });

      return {
        ok: true,
        result: result as TResult,
        correlationId,
        traceEventId: completeEvent.eventId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const stackTrace = err instanceof Error ? err.stack : undefined;

      // Emit failure trace with stackTrace for handler errors
      this.emitTraceEvent(tool, 'tool_failed', correlationId, context, {
        summary: `Failed ${toolId}: ${errorMessage}`,
        errorCode: ErrorCodes.EXECUTION_FAILED,
        component: 'Handler',
        stackTrace,
      });

      return this.fail(correlationId, ErrorCodes.EXECUTION_FAILED, errorMessage);
    }
  }

  /**
   * Validate a tool invocation without executing.
   * Useful for pre-flight checks.
   */
  validate(input: ToolExecutionInput): { valid: boolean; violations: string[] } {
    const { toolId, context } = input;

    const tool = this.registry.getTool(toolId);
    if (!tool) {
      return { valid: false, violations: [`Tool not found: ${toolId}`] };
    }

    if (tool.mode && tool.mode !== context.mode) {
      return {
        valid: false,
        violations: [`Mode mismatch: tool requires ${tool.mode}, got ${context.mode}`],
      };
    }

    const violations = [
      ...enforceWriteLane(tool, context),
      ...enforceRiskPolicy(tool, context),
      ...enforceRbacPermissions(tool, context),
      ...enforcePiiPolicy(tool),
    ];

    return { valid: violations.length === 0, violations };
  }

  /**
   * Get all registered handler tool IDs.
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  private fail(
    correlationId: string,
    errorCode: ErrorCode,
    error: string
  ): ToolExecutionResult<never> {
    return {
      ok: false,
      error,
      errorCode,
      correlationId,
    };
  }

  private emitTraceEvent(
    tool: Tool,
    type: 'tool_invoked' | 'tool_completed' | 'tool_failed',
    correlationId: string,
    context: ToolExecutionContext,
    options: {
      summary: string;
      rawPayload?: unknown;
      errorCode?: string;
      component?: string;
      stackTrace?: string;
    }
  ) {
    const piiHandling = tool.piiHandling ?? 'sanitize';
    const tracePolicy = tool.tracePolicy ?? 'summary_only';

    // Decide how to handle payload based on trace policy
    let payloadToStore: unknown | undefined;
    let targetStore = tool.payloadStore;

    if (tracePolicy === 'payload_ref' && options.rawPayload) {
      payloadToStore = options.rawPayload;
    } else if (tracePolicy === 'summary_only') {
      payloadToStore = undefined;
    } else if (tracePolicy === 'none') {
      payloadToStore = undefined;
    }

    const input: TraceEventInput = {
      type,
      toolId: tool.toolId,
      correlationId,
      context,
      summary: options.summary,
      errorCode: options.errorCode,
      component: options.component,
      stackTrace: options.stackTrace,
    };

    return this.trace.emitWithPiiHandling(input, piiHandling, payloadToStore, targetStore);
  }
}

function mapErrorCode(code: ErrorCode): RunnerErrorCode {
  switch (code) {
    case ErrorCodes.MODE_MISMATCH:
      return 'MODE_DENIED';
    case ErrorCodes.PAYLOAD_STORE_REQUIRED:
      return 'PII_BLOCKED';
    case ErrorCodes.TOOL_NOT_FOUND:
      return 'TOOL_NOT_FOUND';
    case ErrorCodes.PERMISSION_DENIED:
      return 'PERMISSION_DENIED';
    case ErrorCodes.POLICY_DENIED:
    case ErrorCodes.WRITE_LANE_MISMATCH:
    case ErrorCodes.WRITE_LANE_REQUIRED:
    case ErrorCodes.CONFIRMATION_REQUIRED:
    case ErrorCodes.REASON_CODE_REQUIRED:
    case ErrorCodes.REASON_CODE_INVALID:
    case ErrorCodes.SUPERVISOR_APPROVAL_REQUIRED:
    case ErrorCodes.SUPERVISOR_ROLE_INVALID:
      return 'VALIDATION';
    default:
      return 'EXECUTION_FAILED';
  }
}

function mutationFromRisk(risk: Tool['risk']): MutationClass {
  if (risk === 'read_only') return 'none';
  if (risk === 'write_low') return 'transient';
  return 'durable';
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const toolRunner = new ToolRunner();
