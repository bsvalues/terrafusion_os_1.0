"use strict";
/**
 * TerraFusion OS Core Types
 *
 * Shared type definitions for TerraPilot, TerraTrace, and runtime enforcement.
 * These types mirror the manifest schema and CI gate contracts.
 *
 * Reference: tools/registry/terrapilot.tools.schema.json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceEnforcementError = exports.ToolEnforcementError = void 0;
// ============================================================================
// Enforcement Error Types
// ============================================================================
class ToolEnforcementError extends Error {
    constructor(message, code, toolId, gate) {
        super(message);
        this.code = code;
        this.toolId = toolId;
        this.gate = gate;
        this.name = 'ToolEnforcementError';
    }
}
exports.ToolEnforcementError = ToolEnforcementError;
class TraceEnforcementError extends Error {
    constructor(message, code, toolId) {
        super(message);
        this.code = code;
        this.toolId = toolId;
        this.name = 'TraceEnforcementError';
    }
}
exports.TraceEnforcementError = TraceEnforcementError;
