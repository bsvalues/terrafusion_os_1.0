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
import { TraceService } from '../trace/TraceService.js';
import type { Tool, ToolExecutionContext, ToolExecutionInput, ToolExecutionResult } from '../types/index.js';
import { ToolRegistry } from './ToolRegistry.js';
export declare const ErrorCodes: {
    readonly WRITE_LANE_MISMATCH: "WRITE_LANE_MISMATCH";
    readonly WRITE_LANE_REQUIRED: "WRITE_LANE_REQUIRED";
    readonly CONFIRMATION_REQUIRED: "CONFIRMATION_REQUIRED";
    readonly REASON_CODE_REQUIRED: "REASON_CODE_REQUIRED";
    readonly REASON_CODE_INVALID: "REASON_CODE_INVALID";
    readonly SUPERVISOR_APPROVAL_REQUIRED: "SUPERVISOR_APPROVAL_REQUIRED";
    readonly SUPERVISOR_ROLE_INVALID: "SUPERVISOR_ROLE_INVALID";
    readonly PAYLOAD_STORE_REQUIRED: "PAYLOAD_STORE_REQUIRED";
    readonly TOOL_NOT_FOUND: "TOOL_NOT_FOUND";
    readonly MODE_MISMATCH: "MODE_MISMATCH";
    readonly EXECUTION_FAILED: "EXECUTION_FAILED";
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
export type ToolHandler<TParams = unknown, TResult = unknown> = (params: TParams, context: ToolExecutionContext, tool: Tool) => Promise<TResult>;
export interface ToolRunnerOptions {
    registry?: ToolRegistry;
    trace?: TraceService;
}
export declare class ToolRunner {
    private registry;
    private trace;
    private handlers;
    constructor(options?: ToolRunnerOptions);
    /**
     * Register a handler for a tool.
     */
    registerHandler<TParams = unknown, TResult = unknown>(toolId: string, handler: ToolHandler<TParams, TResult>): void;
    /**
     * Execute a tool with full enforcement and tracing.
     */
    execute<TParams = unknown, TResult = unknown>(input: ToolExecutionInput<TParams>): Promise<ToolExecutionResult<TResult>>;
    /**
     * Validate a tool invocation without executing.
     * Useful for pre-flight checks.
     */
    validate(input: ToolExecutionInput): {
        valid: boolean;
        violations: string[];
    };
    /**
     * Get all registered handler tool IDs.
     */
    getRegisteredHandlers(): string[];
    private fail;
    private emitTraceEvent;
}
export declare const toolRunner: ToolRunner;
