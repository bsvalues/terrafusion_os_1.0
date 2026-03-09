// GENERATED - DO NOT EDIT
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRunner = exports.ToolRunner = exports.ToolRunnerError = exports.ErrorCodes = void 0;
const crypto_1 = require("crypto");
const TraceService_js_1 = require("../trace/TraceService.js");
const ToolRunner_preflight_js_1 = require("./ToolRunner.preflight.js");
const ToolRegistry_js_1 = require("./ToolRegistry.js");
// ============================================================================
// Error Codes
// ============================================================================
exports.ErrorCodes = {
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
};
class ToolRunnerError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ToolRunnerError';
    }
}
exports.ToolRunnerError = ToolRunnerError;
// ============================================================================
// Enforcement Functions
// ============================================================================
/**
 * Gate 4: Write-lane validation
 */
function enforceWriteLane(tool, context) {
    const violations = [];
    // Read-only tools skip write lane checks
    if (tool.risk === 'read_only') {
        return violations;
    }
    // Write tools must have a write lane
    if (tool.writeLane === null || tool.writeLane === undefined) {
        violations.push(`[${exports.ErrorCodes.WRITE_LANE_REQUIRED}] Tool ${tool.toolId} requires a writeLane`);
        return violations;
    }
    // Write lane must match suite (or be in crossSuiteReads)
    if (tool.writeLane !== tool.suite) {
        if (!tool.crossSuiteReads?.includes(tool.writeLane)) {
            violations.push(`[${exports.ErrorCodes.WRITE_LANE_MISMATCH}] Tool ${tool.toolId}: writeLane (${tool.writeLane}) must match suite (${tool.suite})`);
        }
    }
    return violations;
}
/**
 * Gate 5: Risk policy validation
 */
function enforceRiskPolicy(tool, context) {
    const violations = [];
    // Confirmation check for write_low and above
    if (tool.requiresConfirmation && !context.confirmation) {
        violations.push(`[${exports.ErrorCodes.CONFIRMATION_REQUIRED}] Tool ${tool.toolId} requires confirmation`);
    }
    // write_high: reason code required
    if (tool.risk === 'write_high' || tool.reasonCodeRequired) {
        if (!context.reasonCode) {
            violations.push(`[${exports.ErrorCodes.REASON_CODE_REQUIRED}] Tool ${tool.toolId} requires a reason code`);
        }
        else if (tool.reasonCodes && !tool.reasonCodes.includes(context.reasonCode)) {
            violations.push(`[${exports.ErrorCodes.REASON_CODE_INVALID}] Reason code "${context.reasonCode}" not in allowed list: ${tool.reasonCodes.join(', ')}`);
        }
    }
    // irreversible: supervisor approval required
    if (tool.risk === 'irreversible') {
        if (!context.supervisorApproval) {
            violations.push(`[${exports.ErrorCodes.SUPERVISOR_APPROVAL_REQUIRED}] Tool ${tool.toolId} requires supervisor approval`);
        }
        else if (tool.supervisorRoles) {
            const approverRole = context.supervisorApproval.role;
            if (!tool.supervisorRoles.includes(approverRole)) {
                violations.push(`[${exports.ErrorCodes.SUPERVISOR_ROLE_INVALID}] Supervisor role "${approverRole}" not in allowed list: ${tool.supervisorRoles.join(', ')}`);
            }
        }
    }
    return violations;
}
/**
 * Gate 6: PII/Trace policy validation
 */
function enforcePiiPolicy(tool) {
    const violations = [];
    // payload_ref requires payloadStore
    if (tool.tracePolicy === 'payload_ref' && !tool.payloadStore) {
        violations.push(`[${exports.ErrorCodes.PAYLOAD_STORE_REQUIRED}] Tool ${tool.toolId}: payload_ref trace policy requires payloadStore`);
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
const ROLE_CLAIMS = {
    viewer: ['read:parcel', 'read:dossier'],
    appraiser: ['read:parcel', 'read:dossier', 'write:forge', 'write:dossier'],
    supervisor: ['read:parcel', 'read:dossier', 'write:forge', 'write:dossier', 'write:dais', 'approve:irreversible'],
    administrator: ['read:parcel', 'read:dossier', 'write:forge', 'write:dossier', 'write:dais', 'write:clerk', 'write:treasury', 'write:audit', 'approve:irreversible', 'admin:trace', 'admin:system'],
    clerk: ['read:parcel', 'read:dossier', 'write:clerk'],
    treasurer: ['read:parcel', 'read:dossier', 'write:treasury'],
    auditor: ['read:parcel', 'read:dossier', 'read:trace', 'write:audit', 'audit:all'],
};
/**
 * Derive the claims a tool requires based on its manifest properties.
 */
function deriveRequiredClaims(tool) {
    const claims = [];
    // Read tools need read claims for their touch targets
    if (tool.touches?.includes('parcel'))
        claims.push('read:parcel');
    if (tool.touches?.includes('dossier'))
        claims.push('read:dossier');
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
function resolveClaimsForRoles(roles) {
    const claims = new Set();
    for (const role of roles) {
        const roleClaims = ROLE_CLAIMS[role.toLowerCase()];
        if (roleClaims) {
            for (const c of roleClaims)
                claims.add(c);
        }
    }
    return claims;
}
/**
 * Gate 5b: RBAC permission check.
 * Derives required claims from tool manifest and checks against user's roles.
 */
function enforceRbacPermissions(tool, context) {
    const violations = [];
    const required = deriveRequiredClaims(tool);
    if (required.length === 0)
        return violations;
    const userClaims = resolveClaimsForRoles(context.roles);
    const missing = required.filter(c => !userClaims.has(c));
    if (missing.length > 0) {
        violations.push(`[${exports.ErrorCodes.PERMISSION_DENIED}] User lacks claims: ${missing.join(', ')} (required by ${tool.toolId})`);
    }
    return violations;
}
class ToolRunner {
    constructor(options = {}) {
        this.handlers = new Map();
        this.registry = options.registry ?? ToolRegistry_js_1.toolRegistry;
        this.trace = options.trace ?? TraceService_js_1.traceService;
        this.preflight = (0, ToolRunner_preflight_js_1.createPreflight)(options.preflightPolicy);
    }
    /**
     * Canonical execution path.
     * Centralizes mode + county enforcement and returns a normalized result shape.
     */
    async run(toolId, params, context) {
        const county = params.county;
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
            const failure = outcome;
            const failureCode = Object.values(exports.ErrorCodes).includes(failure.errorCode)
                ? failure.errorCode
                : exports.ErrorCodes.EXECUTION_FAILED;
            const mapped = mapErrorCode(failureCode);
            throw new ToolRunnerError(mapped, failure.error);
        }
        const payloadRef = outcome.result?.payloadRef;
        return {
            ok: true,
            toolId,
            suite: tool.suite,
            mode: tool.mode,
            risk: tool.risk,
            result: outcome.result,
            payloadRef,
            traceId: outcome.traceEventId,
        };
    }
    /**
     * Register a handler for a tool.
     */
    registerHandler(toolId, handler) {
        if (!this.registry.isInitialized()) {
            throw new Error('ToolRegistry must be initialized before registering handlers');
        }
        // Verify tool exists
        this.registry.requireTool(toolId);
        this.handlers.set(toolId, handler);
    }
    /**
     * Execute a tool with full enforcement and tracing.
     */
    async execute(input) {
        const correlationId = (0, crypto_1.randomUUID)();
        const { toolId, params, context } = input;
        // Lookup tool
        const tool = this.registry.getTool(toolId);
        if (!tool) {
            return this.fail(correlationId, exports.ErrorCodes.TOOL_NOT_FOUND, `Tool not found: ${toolId}`);
        }
        // Mode check
        if (tool.mode && tool.mode !== context.mode) {
            return this.fail(correlationId, exports.ErrorCodes.MODE_MISMATCH, `Tool ${toolId} requires mode "${tool.mode}" but got "${context.mode}"`);
        }
        // Optional preflight policy gate (additive, defaults to allow)
        const governance = tool.governance;
        const preflight = this.preflight.decide({
            toolId,
            correlationId,
            governance,
            requestedMutation: mutationFromRisk(tool.risk),
        });
        if (preflight.allow !== true) {
            // Narrow to denial branch for TS discriminated union compat
            const denied = preflight;
            this.emitTraceEvent(tool, 'tool_failed', correlationId, context, {
                summary: `Policy denied ${toolId}: ${denied.reason}`,
                errorCode: exports.ErrorCodes.POLICY_DENIED,
                component: 'ToolRunner',
            });
            return this.fail(correlationId, exports.ErrorCodes.POLICY_DENIED, denied.reason);
        }
        // Collect all enforcement violations
        const violations = [
            ...enforceWriteLane(tool, context),
            ...enforceRiskPolicy(tool, context),
            ...enforceRbacPermissions(tool, context),
            ...enforcePiiPolicy(tool),
        ];
        if (violations.length > 0) {
            // Extract error code from first violation
            const errorCode = violations[0].match(/\[([A-Z_]+)\]/)?.[1] ?? exports.ErrorCodes.EXECUTION_FAILED;
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
            return this.fail(correlationId, exports.ErrorCodes.EXECUTION_FAILED, `No handler registered for ${toolId}`);
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
                result: result,
                correlationId,
                traceEventId: completeEvent.eventId,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const stackTrace = err instanceof Error ? err.stack : undefined;
            // Emit failure trace with stackTrace for handler errors
            this.emitTraceEvent(tool, 'tool_failed', correlationId, context, {
                summary: `Failed ${toolId}: ${errorMessage}`,
                errorCode: exports.ErrorCodes.EXECUTION_FAILED,
                component: 'Handler',
                stackTrace,
            });
            return this.fail(correlationId, exports.ErrorCodes.EXECUTION_FAILED, errorMessage);
        }
    }
    /**
     * Validate a tool invocation without executing.
     * Useful for pre-flight checks.
     */
    validate(input) {
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
    getRegisteredHandlers() {
        return Array.from(this.handlers.keys());
    }
    fail(correlationId, errorCode, error) {
        return {
            ok: false,
            error,
            errorCode,
            correlationId,
        };
    }
    emitTraceEvent(tool, type, correlationId, context, options) {
        const piiHandling = tool.piiHandling ?? 'sanitize';
        const tracePolicy = tool.tracePolicy ?? 'summary_only';
        // Decide how to handle payload based on trace policy
        let payloadToStore;
        let targetStore = tool.payloadStore;
        if (tracePolicy === 'payload_ref' && options.rawPayload) {
            payloadToStore = options.rawPayload;
        }
        else if (tracePolicy === 'summary_only') {
            payloadToStore = undefined;
        }
        else if (tracePolicy === 'none') {
            payloadToStore = undefined;
        }
        const input = {
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
exports.ToolRunner = ToolRunner;
function mapErrorCode(code) {
    switch (code) {
        case exports.ErrorCodes.MODE_MISMATCH:
            return 'MODE_DENIED';
        case exports.ErrorCodes.PAYLOAD_STORE_REQUIRED:
            return 'PII_BLOCKED';
        case exports.ErrorCodes.TOOL_NOT_FOUND:
            return 'TOOL_NOT_FOUND';
        case exports.ErrorCodes.PERMISSION_DENIED:
            return 'PERMISSION_DENIED';
        case exports.ErrorCodes.POLICY_DENIED:
        case exports.ErrorCodes.WRITE_LANE_MISMATCH:
        case exports.ErrorCodes.WRITE_LANE_REQUIRED:
        case exports.ErrorCodes.CONFIRMATION_REQUIRED:
        case exports.ErrorCodes.REASON_CODE_REQUIRED:
        case exports.ErrorCodes.REASON_CODE_INVALID:
        case exports.ErrorCodes.SUPERVISOR_APPROVAL_REQUIRED:
        case exports.ErrorCodes.SUPERVISOR_ROLE_INVALID:
            return 'VALIDATION';
        default:
            return 'EXECUTION_FAILED';
    }
}
function mutationFromRisk(risk) {
    if (risk === 'read_only')
        return 'none';
    if (risk === 'write_low')
        return 'transient';
    return 'durable';
}
// ============================================================================
// Singleton Instance
// ============================================================================
exports.toolRunner = new ToolRunner();
